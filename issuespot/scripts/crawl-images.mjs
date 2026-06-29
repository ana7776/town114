#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config({ path: ".env.local" });
dotenv.config();

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
const help = flags.has("--help") || flags.has("-h");
const dryRun = flags.has("--dry-run");
const localOnly = flags.has("--local-only") || dryRun;
const cliSourceUrls = readCliSourceUrls(argv);

if (help) {
  printHelp();
  process.exit(0);
}

const config = {
  accountId: requiredEnv("R2_ACCOUNT_ID", { skip: localOnly }),
  accessKeyId: requiredEnv("R2_ACCESS_KEY_ID", { skip: localOnly }),
  secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY", { skip: localOnly }),
  bucket: requiredEnv("R2_BUCKET", { skip: localOnly }),
  publicBaseUrl: trimTrailingSlash(process.env.R2_PUBLIC_BASE_URL || ""),
  sourceUrls: await readSources(cliSourceUrls),
  prefix: trimSlashes(process.env.IMAGE_R2_PREFIX || "images/crawled"),
  outputDir: process.env.IMAGE_OUTPUT_DIR || ".cache/images",
  maxWidth: readInt(process.env.IMAGE_MAX_WIDTH, 1600),
  quality: readInt(process.env.IMAGE_WEBP_QUALITY, 80),
  concurrency: readInt(process.env.IMAGE_CONCURRENCY, 3),
  maxImages: readInt(process.env.IMAGE_MAX_IMAGES, 0),
  timeoutMs: readInt(process.env.IMAGE_FETCH_TIMEOUT_MS, 20000),
  userAgent: process.env.IMAGE_USER_AGENT || "IssueSpotImageBot/0.1",
  sourceFile: process.env.IMAGE_SOURCE_FILE || "image-sources.txt"
};

validateConfig();

if (config.sourceUrls.length === 0) {
  fail("No image source URLs. Set IMAGE_SOURCE_URLS or create image-sources.txt.");
}

const s3 = localOnly
  ? null
  : new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });

await fs.mkdir(config.outputDir, { recursive: true });

const pageResults = await mapLimit(config.sourceUrls, config.concurrency, crawlPage);
let imageCandidates = dedupeBy(
  pageResults.flatMap((page) => page.images),
  (image) => image.url
);

if (config.maxImages > 0) {
  imageCandidates = imageCandidates.slice(0, config.maxImages);
}

console.log(`Found ${imageCandidates.length} unique image candidate(s).`);

const processed = await mapLimit(imageCandidates, config.concurrency, processImage);
const images = processed.filter(Boolean);
const manifest = {
  generatedAt: new Date().toISOString(),
  mode: localOnly ? "local-only" : "upload",
  sourceUrls: config.sourceUrls,
  images
};

const manifestPath = path.join(config.outputDir, "manifest.json");
const csvPath = path.join(config.outputDir, "manifest.csv");
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
await fs.writeFile(csvPath, toCsv(images));

console.log(`Wrote manifest: ${manifestPath}`);
console.log(`Wrote CSV: ${csvPath}`);
console.log(localOnly ? "Done. No R2 upload was attempted." : "Done. Uploaded converted WebP files to R2.");

async function crawlPage(pageUrl) {
  console.log(`Crawling ${pageUrl}`);

  const response = await fetch(pageUrl, {
    headers: { "user-agent": config.userAgent },
    signal: AbortSignal.timeout(config.timeoutMs)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${pageUrl}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    throw new Error(`Expected HTML at ${pageUrl}, got ${contentType || "unknown content type"}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const images = [];

  $("img[src], img[data-src], source[srcset], meta[property='og:image'], meta[name='twitter:image']").each((_, element) => {
    const tag = element.tagName?.toLowerCase();
    const attribs = element.attribs || {};
    const rawValue = attribs.src || attribs["data-src"] || attribs.content || firstSrcsetUrl(attribs.srcset);
    addCandidate(images, pageUrl, rawValue, attribs.alt || "", tag);
  });

  $("[style*='background']").each((_, element) => {
    const style = element.attribs?.style || "";
    for (const rawValue of extractCssUrls(style)) {
      addCandidate(images, pageUrl, rawValue, "", "style");
    }
  });

  return { pageUrl, images };
}

function addCandidate(images, pageUrl, rawValue, alt, sourceTag) {
  if (!rawValue || rawValue.startsWith("data:")) return;

  try {
    const url = new URL(rawValue, pageUrl).toString();
    if (isLikelyImageUrl(url)) {
      images.push({ pageUrl, url, alt, sourceTag });
    }
  } catch {
    console.warn(`Skipping invalid image URL on ${pageUrl}: ${rawValue}`);
  }
}

async function processImage(candidate) {
  try {
    const original = await downloadImage(candidate.url);
    const converted = await convertToWebp(original.body);
    const key = buildObjectKey(candidate.url, converted.hash);
    const localPath = path.join(config.outputDir, key.replaceAll("/", "_"));

    await fs.writeFile(localPath, converted.body);

    if (!localOnly) {
      await uploadToR2(key, converted.body);
    }

    const publicUrl = config.publicBaseUrl ? `${config.publicBaseUrl}/${key}` : "";
    console.log(`${localOnly ? "Prepared" : "Uploaded"} ${key}`);

    return {
      sourcePage: candidate.pageUrl,
      sourceUrl: candidate.url,
      key,
      publicUrl,
      bytes: converted.body.byteLength,
      sourceWidth: converted.sourceWidth,
      sourceHeight: converted.sourceHeight,
      width: converted.width,
      height: converted.height,
      localPath
    };
  } catch (error) {
    console.warn(`Image failed: ${candidate.url}`);
    console.warn(`  ${error.message}`);
    return null;
  }
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: { "user-agent": config.userAgent },
    signal: AbortSignal.timeout(config.timeoutMs)
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Not an image response: ${contentType || "unknown content type"}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    contentType,
    body: Buffer.from(arrayBuffer)
  };
}

async function convertToWebp(input) {
  const image = sharp(input, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const resizeWidth = metadata.width && metadata.width > config.maxWidth ? config.maxWidth : undefined;
  const output = await image
    .resize({ width: resizeWidth, withoutEnlargement: true })
    .webp({ quality: config.quality })
    .toBuffer({ resolveWithObject: true });

  return {
    body: output.data,
    hash: crypto.createHash("sha256").update(output.data).digest("hex").slice(0, 16),
    sourceWidth: metadata.width || null,
    sourceHeight: metadata.height || null,
    width: output.info.width || null,
    height: output.info.height || null
  };
}

async function uploadToR2(key, body) {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable"
    })
  );
}

function buildObjectKey(sourceUrl, hash) {
  const url = new URL(sourceUrl);
  const baseName = path.basename(url.pathname).replace(/\.[a-z0-9]+$/i, "") || "image";
  const slug = slugify(baseName).slice(0, 80) || "image";
  return `${config.prefix}/${slug}-${hash}.webp`;
}

async function readSources(cliSources = []) {
  const envSources = readList(process.env.IMAGE_SOURCE_URLS);
  const file = process.env.IMAGE_SOURCE_FILE || "image-sources.txt";
  let fileSources = [];

  try {
    const content = await fs.readFile(file, "utf8");
    fileSources = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  return dedupeBy([...cliSources, ...envSources, ...fileSources], (url) => url);
}

function readCliSourceUrls(args) {
  const urls = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg || arg === "--local-only" || arg === "--dry-run" || arg === "--help" || arg === "-h") continue;

    if (arg === "--url" || arg === "-u") {
      const next = args[index + 1];
      if (next && !next.startsWith("-")) {
        urls.push(next);
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--url=")) {
      urls.push(arg.slice("--url=".length));
      continue;
    }

    if (!arg.startsWith("-")) {
      urls.push(arg);
    }
  }

  return urls.map((url) => url.trim()).filter(Boolean);
}

function firstSrcsetUrl(srcset = "") {
  return srcset.split(",")[0]?.trim().split(/\s+/)[0] || "";
}

function extractCssUrls(style = "") {
  return [...style.matchAll(/url\((['"]?)(.*?)\1\)/gi)].map((match) => match[2]);
}

function isLikelyImageUrl(url) {
  return /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(url) || url.includes("/image/");
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, Math.max(items.length, 1)) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

function toCsv(rows) {
  const headers = ["sourcePage", "sourceUrl", "key", "publicUrl", "bytes", "width", "height", "localPath"];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function readList(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readInt(value, fallback) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function validateConfig() {
  if (config.concurrency < 1) fail("IMAGE_CONCURRENCY must be 1 or greater.");
  if (config.maxWidth < 1) fail("IMAGE_MAX_WIDTH must be 1 or greater.");
  if (config.quality < 1 || config.quality > 100) fail("IMAGE_WEBP_QUALITY must be between 1 and 100.");
  if (config.timeoutMs < 1000) fail("IMAGE_FETCH_TIMEOUT_MS must be 1000 or greater.");
}

function requiredEnv(name, options = {}) {
  const value = process.env[name];
  if (!value && !options.skip) {
    fail(`${name} is required. Copy .env.example to .env.local or export it before running.`);
  }
  return value || "";
}

function trimSlashes(value) {
  return value.replace(/^\/+|\/+$/g, "");
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/g, "");
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Image Crawl to Cloudflare R2

Usage:
  npm run images:crawl:free
  npm run images:crawl:local
  npm run images:crawl:dry
  npm run images:crawl
  node scripts/crawl-images.mjs --local-only

Modes:
  --local-only  Crawl pages, download images, convert to WebP, write manifests. No upload.
  --dry-run     Alias of --local-only.
  --help        Show this help.

Input:
  positional URL          Crawl a specific page URL directly.
  --url, -u URL           Crawl a specific page URL directly.
  IMAGE_SOURCE_URLS       Comma-separated page URLs.
  IMAGE_SOURCE_FILE       Newline-separated URL file. Defaults to image-sources.txt.

Output:
  IMAGE_OUTPUT_DIR        Local output directory. Defaults to .cache/images.
  IMAGE_R2_PREFIX         R2 object key prefix. Defaults to images/crawled.
  R2_PUBLIC_BASE_URL      Optional public URL prefix for manifest output.

Upload:
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET
`);
}
