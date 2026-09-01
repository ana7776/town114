import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const siteUrl = (process.env.SITE_URL || "https://town114.com").replace(/\/+$/, "");
const excludedDirs = new Set([".git", ".github", "node_modules", "qa-screenshots"]);

// 애드센스 승인 지침서(신청 전 20문항)에서 기계로 확인할 수 있는 항목만 검사한다.
// 사람이 직접 봐야 하는 항목은 ADSENSE_APPROVAL_GUIDE.md의 체크표에서 관리한다.
const MIN_BODY_CHARS = 1350;
const MIN_INTERNAL_LINKS = 3;

// 실제 운영과 일치해야 하는 기준 페이지. 날짜 표기가 없으면 최신 상태인지 판단할 수 없다.
const DATED_PAGES = [
  "about/index.html",
  "contact/index.html",
  "privacy/index.html",
  "terms/index.html",
  "advertising-disclosure/index.html",
  "sources/index.html",
];
const DATE_LABEL = /(시행일|최종 검토|최종 확인|업데이트|기준일)/;

// 본문에서 사실을 설명할 때는 쓸 수 있지만, 제목과 요약에서 약속하면 과장이 되는 표현.
const HYPE_CLAIM = /(무조건|100%\s*보장|승인 보장|반드시 통과|절대 실패하지|완벽하게 보장)/;

// 애드센스 게시자 정책이 금지하는 광고 참여 유도 표현.
// 광고를 클릭하지 않아도 된다고 설명하는 문장은 정책 고지이므로 걸러내지 않는다.
const AD_BAIT = /(광고를?\s*(클릭|눌러)\s*(해\s*주|하세요|주세요|바랍|부탁)|배너를?\s*(클릭|눌러)\s*(해\s*주|하세요|주세요)|광고\s*클릭\s*시[^.]{0,24}(지급|제공|혜택|적립|증정))/;

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

function isIndexable(html) {
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)?.[1] || "";
  return !robots.toLowerCase().split(",").map((value) => value.trim()).includes("noindex");
}

function getVisibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMain(html) {
  return html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || html;
}

function resolvesToFile(pathname) {
  if (/\.[a-z0-9]+$/i.test(pathname)) return existsSync(join(root, pathname));
  return existsSync(join(root, pathname, "index.html"));
}

function pushIssue(issues, label, message) {
  if (!issues[label]) issues[label] = [];
  issues[label].push(message);
}

const issues = {};
const htmlFiles = await findHtmlFiles(root);
const titles = new Map();
const descriptions = new Map();
const noindexLocs = [];

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const rel = relative(root, file).split(sep).join("/");
  const pathname = toUrlPath(file);
  const indexable = isIndexable(html);
  if (!indexable) noindexLocs.push(`${siteUrl}${pathname}`);

  // 1. 깨진 내부 링크: 방문자가 막다른 페이지를 만나지 않아야 한다.
  for (const match of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = match[1];
    if (target === "/") continue;
    if (!resolvesToFile(target)) pushIssue(issues, "broken-internal-link", `${rel} -> ${target}`);
  }

  // 2. 외부 링크는 관계 표시를 남긴다.
  for (const match of getMain(html).matchAll(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/g)) {
    const anchor = match[0];
    if (anchor.includes(siteUrl)) continue;
    if (!/\brel=/.test(anchor)) {
      pushIssue(issues, "external-link-rel", `${rel}: ${anchor.slice(0, 100)}`);
    }
  }

  // 3. 이미지와 다이어그램에는 대체 텍스트가 있어야 한다.
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(match[0])) pushIssue(issues, "image-alt", `${rel}: ${match[0].slice(0, 80)}`);
  }
  for (const match of html.matchAll(/<svg\b[^>]*>/g)) {
    if (!/aria-label=|aria-hidden=/.test(match[0])) {
      pushIssue(issues, "svg-label", `${rel}: ${match[0].slice(0, 80)}`);
    }
  }

  // 4. 표는 모바일에서 잘리지 않고 가로 스크롤로 읽을 수 있어야 한다.
  const tableCount = (html.match(/<table class="check-table">/g) || []).length;
  const wrappedCount = (html.match(/<div class="table-scroll"[^>]*><table class="check-table">/g) || []).length;
  if (tableCount !== wrappedCount) {
    pushIssue(issues, "table-scroll", `${rel}: ${tableCount} tables, ${wrappedCount} wrapped`);
  }

  // 5. 광고 참여 유도 표현은 어느 페이지에도 없어야 한다.
  const visibleText = getVisibleText(html);
  if (AD_BAIT.test(visibleText)) {
    pushIssue(issues, "ad-bait", `${rel}: ${visibleText.match(AD_BAIT)[0]}`);
  }

  if (!indexable) continue;

  // 6. 제목과 요약이 겹치면 같은 역할의 페이지가 여러 개라는 뜻이다.
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() || "";
  if (title) titles.set(title, [...(titles.get(title) || []), rel]);
  if (description) descriptions.set(description, [...(descriptions.get(description) || []), rel]);

  // 7. 제목과 요약에서 결과를 보장하지 않는다.
  const promiseZone = [title, description, ...[...html.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)].map((match) => match[1])]
    .join(" ")
    .replace(/<[^>]+>/g, " ");
  if (HYPE_CLAIM.test(promiseZone)) {
    pushIssue(issues, "hype-claim", `${rel}: ${promiseZone.match(HYPE_CLAIM)[0]}`);
  }

  // 8. 색인 대상 페이지는 읽을 분량이 있어야 한다.
  if (visibleText.length < MIN_BODY_CHARS) {
    pushIssue(issues, "thin-content", `${rel}: ${visibleText.length} chars (min ${MIN_BODY_CHARS})`);
  }

  // 9. 본문에서 다음 글로 이동할 수 있어야 한다.
  const internalLinks = new Set(
    [...getMain(html).matchAll(/href="(\/[^"#?]*)"/g)]
      .map((match) => match[1])
      .filter((target) => target !== "/" && !/\.[a-z0-9]+$/i.test(target) && target !== pathname)
  );
  if (internalLinks.size < MIN_INTERNAL_LINKS) {
    pushIssue(issues, "internal-links", `${rel}: ${internalLinks.size} links (min ${MIN_INTERNAL_LINKS})`);
  }

  // 10. 기준 페이지는 언제 확인한 내용인지 보여야 한다.
  if (DATED_PAGES.includes(rel) && !DATE_LABEL.test(visibleText)) {
    pushIssue(issues, "page-date", `${rel}: missing 시행일/최종 검토/업데이트 label`);
  }
}

for (const [title, files] of titles) {
  if (files.length > 1) pushIssue(issues, "duplicate-title", `"${title}" -> ${files.join(", ")}`);
}
for (const [description, files] of descriptions) {
  if (files.length > 1) pushIssue(issues, "duplicate-description", `"${description.slice(0, 60)}..." -> ${files.join(", ")}`);
}

// 11. 자동 생성 글은 색인 대상에서 제외한 상태를 유지한다.
for (const file of htmlFiles) {
  const rel = relative(root, file).split(sep).join("/");
  if (!rel.startsWith("news/auto-posts/")) continue;
  const html = await readFile(file, "utf8");
  if (isIndexable(html)) pushIssue(issues, "auto-post-indexable", rel);
}

const sitemapPath = join(root, "sitemap.xml");
if (existsSync(sitemapPath)) {
  const sitemap = await readFile(sitemapPath, "utf8");
  for (const loc of noindexLocs) {
    if (sitemap.includes(`<loc>${loc}</loc>`)) pushIssue(issues, "sitemap-includes-noindex", loc);
  }
}

const labels = Object.keys(issues);
if (!labels.length) {
  console.log(`AdSense approval audit passed for ${htmlFiles.length} HTML document(s).`);
  process.exit(0);
}

for (const label of labels) {
  console.error(`\n${label}: ${issues[label].length}`);
  for (const message of issues[label].slice(0, 30)) console.error(`  - ${message}`);
  if (issues[label].length > 30) console.error(`  ... ${issues[label].length - 30} more`);
}

process.exit(1);
