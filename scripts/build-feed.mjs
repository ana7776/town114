import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const siteUrl = (process.env.SITE_URL || "https://town114.com").replace(/\/+$/, "");
const MAX_ITEMS = 20;

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// 피드는 sitemap에 실린 색인 대상 페이지만 싣는다. 자동 생활정보 글은
// noindex이고 sitemap에서도 빠지므로 피드에도 나가지 않는다.
const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
const entries = [...sitemap.matchAll(/<loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod>/g)]
  .map(([, loc, lastmod]) => ({ loc, lastmod }))
  .filter((entry) => entry.loc !== `${siteUrl}/`);

const items = [];
for (const entry of entries) {
  const pathname = new URL(entry.loc).pathname;
  const file = join(root, pathname.slice(1), "index.html");
  let html;
  try {
    html = await readFile(file, "utf8");
  } catch {
    continue;
  }
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1]?.split("|")[0].trim();
  const description = html.match(/name="description"\s+content="(.*?)"/s)?.[1];
  if (!title || !description) continue;
  items.push({ ...entry, title, description });
}

items.sort((a, b) => (a.lastmod < b.lastmod ? 1 : a.lastmod > b.lastmod ? -1 : a.loc.localeCompare(b.loc)));
const selected = items.slice(0, MAX_ITEMS);

const body = selected
  .map((item) => `    <item>
      <title>${xmlEscape(item.title)}</title>
      <link>${xmlEscape(item.loc)}</link>
      <guid isPermaLink="true">${xmlEscape(item.loc)}</guid>
      <pubDate>${new Date(`${item.lastmod}T12:00:00+09:00`).toUTCString()}</pubDate>
      <description>${xmlEscape(item.description)}</description>
    </item>`)
  .join("\n");

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TOWN114 생활정보 업데이트</title>
    <link>${siteUrl}/</link>
    <description>약국, 주차장, 도서관, 주민센터, 정비소처럼 자주 찾는 지역 생활정보를 방문 전 확인 기준으로 정리합니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date(`${selected[0]?.lastmod ?? new Date().toISOString().slice(0, 10)}T12:00:00+09:00`).toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${body}
  </channel>
</rss>
`;

await writeFile(join(root, "feed.xml"), feed, "utf8");
console.log(`Generated feed.xml with ${selected.length} item(s) from indexable pages.`);
