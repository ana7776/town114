import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

// feed.xml은 색인 대상 편집 콘텐츠만 담는다.
// noindex로 두고 sitemap에서도 제외한 자동 생성 글을 RSS로 내보내면
// 검색엔진에 "색인하지 말라고 한 페이지"를 다시 발견 경로로 제공하게 된다.

const root = process.cwd();
const siteUrl = (process.env.SITE_URL || "https://town114.com").replace(/\/+$/, "");
const FEED_DIRS = ["articles", "news"];
const EXCLUDE_PREFIX = "news/auto-posts/";
const MAX_ITEMS = 20;

const CHANNEL_TITLE = "TOWN114 생활정보 업데이트";
const CHANNEL_DESCRIPTION =
  "약국, 주차장, 도서관, 주민센터, 정비소처럼 자주 찾는 지역 생활정보를 방문 전 확인 기준으로 정리합니다.";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function findHtmlFiles(dir, files = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await findHtmlFiles(join(dir, entry.name), files);
      continue;
    }
    if (entry.name === "index.html") files.push(join(dir, entry.name));
  }
  return files;
}

function isIndexable(html) {
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)?.[1] || "";
  return !robots.toLowerCase().split(",").map((value) => value.trim()).includes("noindex");
}

function toRssDate(isoDate) {
  // 페이지가 선언한 날짜를 한국시간 정오 기준으로 읽어 파일 mtime에 의존하지 않는다.
  return new Date(`${isoDate}T12:00:00+09:00`).toUTCString();
}

const items = [];

for (const dir of FEED_DIRS) {
  for (const file of await findHtmlFiles(join(root, dir))) {
    const rel = relative(root, file).split(sep).join("/");
    if (rel.startsWith(EXCLUDE_PREFIX)) continue;

    const html = await readFile(file, "utf8");
    if (!isIndexable(html)) continue;

    const pathname = `/${rel.replace(/\/index\.html$/, "/")}`;
    const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim().replace(/\s*\|\s*TOWN114\s*$/, "");
    const description = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || "").trim();
    const date = html.match(/"dateModified":\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];

    if (!title || !date) {
      console.warn(`skip (missing title or dateModified): ${rel}`);
      continue;
    }

    items.push({ pathname, title, description, date });
  }
}

items.sort((a, b) => (a.date === b.date ? a.pathname.localeCompare(b.pathname) : b.date.localeCompare(a.date)));
const selected = items.slice(0, MAX_ITEMS);

if (!selected.length) throw new Error("build-feed: no indexable editorial pages found");

const renderedItems = selected
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${siteUrl}${item.pathname}</link>
      <guid isPermaLink="true">${siteUrl}${item.pathname}</guid>
      <pubDate>${toRssDate(item.date)}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`
  )
  .join("\n");

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(CHANNEL_TITLE)}</title>
    <link>${siteUrl}/</link>
    <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${toRssDate(selected[0].date)}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${renderedItems}
  </channel>
</rss>
`;

await writeFile(join(root, "feed.xml"), feed, "utf8");
console.log(`feed.xml: ${selected.length} editorial item(s) of ${items.length} candidate(s).`);
