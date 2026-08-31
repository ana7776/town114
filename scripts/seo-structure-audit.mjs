import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const siteUrl = (process.env.SITE_URL || "https://town114.com").replace(/\/+$/, "");
const excludedDirs = new Set([".git", ".github", "node_modules", "qa-screenshots"]);

async function findHtmlFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) await findHtmlFiles(join(dir, entry.name), files);
      continue;
    }
    if (entry.name === "index.html") files.push(join(dir, entry.name));
  }
  return files;
}

function toUrlPath(filePath) {
  const rel = relative(root, filePath).split(sep).join("/");
  if (rel === "index.html") return "/";
  return `/${rel.replace(/\/index\.html$/, "/")}`;
}

function getRobotsContent(html) {
  return html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)?.[1] || "";
}

function isIndexable(html) {
  const robots = getRobotsContent(html)
    .toLowerCase()
    .split(",")
    .map((value) => value.trim());
  return !robots.includes("noindex");
}

function getVisibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pushIssue(issues, label, message) {
  if (!issues[label]) issues[label] = [];
  issues[label].push(message);
}

const issues = {};
function collectDuplicate(store, key, rel) {
  if (!store.has(key)) store.set(key, []);
  store.get(key).push(rel);
}

function reportDuplicates(store, label, describe) {
  for (const [key, files] of store) {
    if (files.length > 1) pushIssue(issues, label, `${describe(key)}: ${files.join(", ")}`);
  }
}

const htmlFiles = await findHtmlFiles(root);
const indexableLocs = [];
const noindexLocs = [];
const titlesSeen = new Map();
const bodiesSeen = new Map();
const topicsSeen = new Map();

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const rel = relative(root, file).split(sep).join("/");
  const pathname = toUrlPath(file);
  const loc = `${siteUrl}${pathname}`;

  if (isIndexable(html)) indexableLocs.push(loc);
  else noindexLocs.push(loc);

  // 같은 글이 날짜만 바꿔 다시 올라오는 것을 막는다. 자동 발행 글은 noindex라도
  // 사이트에 그대로 남아 크롤러가 읽으므로 색인 여부와 무관하게 검사한다.
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim();
  if (title) collectDuplicate(titlesSeen, title, rel);

  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html;
  const bodyText = main
    .replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\d{4}[-.]\d{1,2}[-.]\d{1,2}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (bodyText.length > 200) collectDuplicate(bodiesSeen, bodyText, rel);

  // 자동 발행 글의 주제 슬러그는 날짜와 슬롯을 뗀 나머지다.
  const autoTopic = pathname.match(/^\/news\/auto-posts\/\d{4}-\d{2}-\d{2}-(?:afternoon|evening)-(.+)\/$/)?.[1];
  if (autoTopic) collectDuplicate(topicsSeen, autoTopic, rel);

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) pushIssue(issues, "h1", `${rel}: expected 1 h1, found ${h1Count}`);

  const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index] > headings[index - 1] + 1) {
      pushIssue(issues, "heading-order", `${rel}: h${headings[index - 1]} followed by h${headings[index]}`);
      break;
    }
  }

  if (/\/[0-9]+(?:\/|$)/.test(pathname)) {
    pushIssue(issues, "numeric-url", `${rel}: ${pathname}`);
  }

  if (!/<meta[^>]+name=["']description["']/i.test(html)) {
    pushIssue(issues, "meta-description", `${rel}: missing meta description`);
  }

  if (!/<meta[^>]+name=["']robots["']/i.test(html)) {
    pushIssue(issues, "robots-meta", `${rel}: missing robots meta`);
  }

  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) {
    pushIssue(issues, "canonical", `${rel}: missing canonical link`);
  }

  const visibleText = getVisibleText(html);
  if (/[�]|[?]{2,}/.test(visibleText)) {
    pushIssue(issues, "content-encoding", `${rel}: visible text contains replacement characters or repeated question marks`);
  }

  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || "";
  if (!footer.includes('/privacy/') || !footer.includes('/contact/')) {
    pushIssue(issues, "footer-required-links", `${rel}: footer must link privacy and contact pages`);
  }
}

const robotsPath = join(root, "robots.txt");
if (!existsSync(robotsPath)) {
  pushIssue(issues, "robots.txt", "robots.txt is missing");
} else {
  const robots = await readFile(robotsPath, "utf8");
  if (!/User-agent:\s*\*/i.test(robots)) pushIssue(issues, "robots.txt", "missing User-agent: *");
  if (!/Allow:\s*\//i.test(robots)) pushIssue(issues, "robots.txt", "missing Allow: /");
  if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
    pushIssue(issues, "robots.txt", `missing Sitemap: ${siteUrl}/sitemap.xml`);
  }
}

const sitemapPath = join(root, "sitemap.xml");
if (!existsSync(sitemapPath)) {
  pushIssue(issues, "sitemap.xml", "sitemap.xml is missing");
} else {
  const sitemap = await readFile(sitemapPath, "utf8");
  for (const loc of indexableLocs) {
    if (!sitemap.includes(`<loc>${loc}</loc>`)) {
      pushIssue(issues, "sitemap-missing-indexable", loc);
    }
  }
  for (const loc of noindexLocs) {
    if (sitemap.includes(`<loc>${loc}</loc>`)) {
      pushIssue(issues, "sitemap-includes-noindex", loc);
    }
  }
}

reportDuplicates(titlesSeen, "duplicate-title", (key) => key);
reportDuplicates(bodiesSeen, "duplicate-body", (key) => `${key.slice(0, 60)}...`);
reportDuplicates(topicsSeen, "duplicate-auto-post-topic", (key) => key);

const labels = Object.keys(issues);
if (!labels.length) {
  console.log(`SEO structure audit passed for ${htmlFiles.length} HTML document(s).`);
  process.exit(0);
}

for (const label of labels) {
  console.error(`\n${label}: ${issues[label].length}`);
  for (const message of issues[label].slice(0, 30)) console.error(`  - ${message}`);
  if (issues[label].length > 30) console.error(`  ... ${issues[label].length - 30} more`);
}

process.exit(1);
