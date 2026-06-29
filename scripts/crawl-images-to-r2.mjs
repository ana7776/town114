import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

async function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  const text = await readFile(".env.local", "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!key || process.env[key]) continue;
    process.env[key] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

await loadLocalEnv();

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = Number(limitArg?.split("=")[1] || process.env.IMAGE_CRAWL_LIMIT || 30);
const cliSources = process.argv
  .filter((arg) => arg.startsWith("--url=") || arg.startsWith("--source="))
  .map((arg) => arg.split("=").slice(1).join("=").trim())
  .filter(Boolean);

const requiredEnv = dryRun
  ? ["R2_PUBLIC_BASE_URL"]
  : [
      "CLOUDFLARE_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
      "R2_PUBLIC_BASE_URL"
    ];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const envSources = (process.env.IMAGE_CRAWL_SOURCES || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
const sources = cliSources.length ? cliSources : envSources;

if (!sources.length) {
  throw new Error("Set IMAGE_CRAWL_SOURCES or pass --url=https://example.com/page");
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
const prefix = (process.env.R2_IMAGE_PREFIX || "images/crawled").replace(/^\/+|\/+$/g, "");

const s3 = dryRun ? null : new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

function toAbsoluteUrl(src, pageUrl) {
  try {
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) return null;
    return new URL(src, pageUrl).toString();
  } catch {
    return null;
  }
}

function extractImageUrls(html, pageUrl) {
  const urls = new Set();
  const patterns = [
    /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi,
    /<source\b[^>]*\bsrcset=["']([^"']+)["'][^>]*>/gi,
    /<img\b[^>]*\bsrcset=["']([^"']+)["'][^>]*>/gi,
    /<meta\b[^>]*\bproperty=["']og:image["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/gi
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const candidates = match[1].split(",").map((item) => item.trim().split(/\s+/)[0]);
      for (const candidate of candidates) {
        const absolute = toAbsoluteUrl(candidate, pageUrl);
        if (absolute) urls.add(absolute);
      }
    }
  }

  return [...urls];
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Town114 image crawler/1.0 (+https://town114.com/)"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Not an image response for ${url}: ${contentType || "unknown content type"}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function buildObjectKey(imageUrl, webpBuffer) {
  const url = new URL(imageUrl);
  const rawName = basename(url.pathname).replace(extname(url.pathname), "") || "image";
  const safeName = rawName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\uac00-\ud7a3_-]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  const hash = createHash("sha256").update(imageUrl).update(webpBuffer).digest("hex").slice(0, 12);
  return `${prefix}/${safeName || "image"}-${hash}.webp`;
}

async function crawlPage(pageUrl) {
  const response = await fetch(pageUrl, {
    headers: {
      "user-agent": "Town114 image crawler/1.0 (+https://town114.com/)"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for page ${pageUrl}`);
  const html = await response.text();
  return extractImageUrls(html, pageUrl);
}

const collected = new Set();
for (const source of sources) {
  const imageUrls = await crawlPage(source);
  for (const imageUrl of imageUrls) collected.add(imageUrl);
}

const selected = [...collected].slice(0, limit);
const manifest = [];

for (const imageUrl of selected) {
  const original = await fetchBuffer(imageUrl);
  const webp = await sharp(original)
    .rotate()
    .resize({
      width: Number(process.env.IMAGE_WEBP_MAX_WIDTH || 1600),
      withoutEnlargement: true
    })
    .webp({
      quality: Number(process.env.IMAGE_WEBP_QUALITY || 80)
    })
    .toBuffer();

  const key = buildObjectKey(imageUrl, webp);
  const publicUrl = `${publicBaseUrl}/${key}`;

  if (!dryRun) {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: webp,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable"
    }));
  }

  manifest.push({
    source: imageUrl,
    key,
    publicUrl,
    originalBytes: original.length,
    webpBytes: webp.length,
    uploaded: !dryRun
  });

  console.log(`${dryRun ? "[dry-run] " : ""}${imageUrl} -> ${publicUrl}`);
}

await mkdir("data", { recursive: true });
await writeFile("data/r2-image-manifest.json", `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  dryRun,
  count: manifest.length,
  images: manifest
}, null, 2)}\n`);

console.log(`Processed ${manifest.length} image(s). Manifest: data/r2-image-manifest.json`);
