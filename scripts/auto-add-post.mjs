import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = normalize(join(scriptDir, ".."));
const slotArg = process.argv.find((arg) => arg.startsWith("--slot="))?.split("=")[1];
const dryRun = process.argv.includes("--dry-run");
const slot = slotArg || (new Date().getHours() < 18 ? "afternoon" : "evening");

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).formatToParts(new Date());
const part = (type) => dateParts.find((item) => item.type === type)?.value || "";
const date = `${part("year")}-${part("month")}-${part("day")}`;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(await readFile(path, "utf8"));
}

const topicsPath = join(root, "data", "auto-post-topics.json");
const logPath = join(root, "data", "auto-post-log.json");
const topics = await readJson(topicsPath, []);
const log = await readJson(logPath, []);
const slotTopics = topics.filter((topic) => topic.slot === slot);

if (!slotTopics.length) {
  throw new Error(`No auto post topics configured for slot: ${slot}`);
}

function baseSlug(value) {
  return String(value || "").replace(/^\d{4}-\d{2}-\d{2}-(afternoon|evening)-/, "");
}

const todayUsedSlugs = new Set(
  log.filter((entry) => entry.date === date && entry.slot === slot).map((entry) => baseSlug(entry.slug)),
);
const previouslyUsedSlugs = new Set(
  log.filter((entry) => entry.slot === slot).map((entry) => baseSlug(entry.slug)),
);
const lastSlotEntry = log.find((entry) => entry.slot === slot);
const lastTopicIndex = slotTopics.findIndex((item) => item.slug === baseSlug(lastSlotEntry?.slug));
const rotatedTopics = slotTopics
  .slice(lastTopicIndex + 1)
  .concat(slotTopics.slice(0, lastTopicIndex + 1));
const topic =
  rotatedTopics.find((item) => !todayUsedSlugs.has(item.slug) && !previouslyUsedSlugs.has(item.slug)) ||
  rotatedTopics.find((item) => !todayUsedSlugs.has(item.slug)) ||
  rotatedTopics[0];
const slug = `${date}-${slot}-${slugify(topic.slug || topic.title)}`;
const urlPath = `/news/auto-posts/${slug}/`;
const outDir = join(root, "news", "auto-posts", slug);
const outFile = join(outDir, "index.html");

if (existsSync(outFile)) {
  console.log(`Auto post already exists: ${urlPath}`);
  process.exit(0);
}

const relatedLinks = [
  ["/news/auto-posts/", "자동 생활정보 글 목록"],
  ["/sources/", "자료 출처와 운영 기준"],
  ["/contact/", "정보 수정 요청"],
];

function renderTable() {
  return `<table class="check-table"><thead><tr><th>확인 항목</th><th>질문</th><th>메모</th></tr></thead><tbody>
        <tr><td>운영 여부</td><td>오늘 실제 이용 가능한가요?</td><td>공식 안내와 현장 공지를 함께 봅니다.</td></tr>
        <tr><td>비용</td><td>기본요금 외 추가 조건이 있나요?</td><td>할인, 예약, 취소 기준을 분리해 확인합니다.</td></tr>
        <tr><td>대체안</td><td>방문이 어려우면 가까운 대안이 있나요?</td><td>두 번째 후보를 미리 정하면 이동 실패를 줄일 수 있습니다.</td></tr>
      </tbody></table>`;
}

const pageHtml = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(topic.summary)}" />
    <meta name="robots" content="index,follow" />
    <meta name="google-adsense-account" content="ca-pub-5804969457082424" />
    <link rel="canonical" href="https://town114.com${urlPath}" />
    <title>${escapeHtml(topic.title)} | TOWN114</title>
    <link rel="stylesheet" href="../../../styles.css" />
  </head>
  <body>
    <header class="site-header"><a class="brand" href="/"><span class="brand-mark">114</span><span><strong>TOWN114</strong><small>자동 생활정보</small></span></a><nav class="nav-links"><a href="/news/auto-posts/">자동 글 목록</a><a href="/news/list/">브리핑</a><a href="/sources/">자료 출처</a><a href="/contact/">오류 수정</a></nav></header>
    <main class="plain-page"><article class="content-page">
      <p class="eyebrow">${escapeHtml(topic.category)} 자동 업데이트</p>
      <h1>${escapeHtml(topic.title)}</h1>
      <div class="article-meta"><span>${escapeHtml(topic.category)}</span><span>업데이트: ${date}</span><span>${slot === "afternoon" ? "오후" : "야간"} 자동 발행</span></div>
      <p>${escapeHtml(topic.summary)}</p>
      ${topic.sections.map(([heading, body]) => `<h2>${escapeHtml(heading)}</h2>\n      <p>${escapeHtml(body)}</p>`).join("\n      ")}
      <h2>검색 결과만 보고 이동하지 않는 이유</h2>
      <p>지역 생활정보는 지도나 검색 결과에 표시되는 한 줄 정보만으로 판단하기 어렵습니다. 실제 이용 가능 여부는 운영시간, 접수 마감, 담당자 상주 여부, 비용 조건, 현장 혼잡도에 따라 달라집니다. 같은 장소라도 평일과 주말, 낮과 야간, 일반 이용과 특정 업무 이용의 기준이 다를 수 있으므로 방문 목적을 먼저 정하고 확인 질문을 좁혀야 합니다.</p>
      <h2>전화 확인을 짧게 끝내는 방법</h2>
      <p>전화를 걸 때는 장소 이름을 확인한 뒤 바로 목적과 도착 예정 시간을 말하는 것이 좋습니다. 예를 들어 “오늘 방문하려고 하는데 지금 이용 가능한지”보다 “30분 뒤 도착 예정이고 처방 조제/서류 발급/주차 이용이 가능한지”처럼 구체적으로 묻는 편이 정확합니다. 질문이 구체적이면 담당자도 운영 여부, 마감 시간, 준비물, 대체 방법을 빠르게 안내할 수 있습니다.</p>
      <h2>TOWN114가 보는 좋은 정보의 기준</h2>
      <p>좋은 생활정보는 단순히 가까운 곳을 알려주는 데서 끝나지 않습니다. 방문 전에 실패 가능성을 줄일 수 있어야 하고, 비용이나 준비물처럼 현장에서 당황하기 쉬운 조건을 미리 보여줘야 합니다. TOWN114는 각 글에서 공식 확인 경로, 현장 변수, 대체 후보를 함께 정리해 사용자가 스스로 판단할 수 있는 기준을 남기는 것을 목표로 합니다.</p>
      <h2>방문 전 빠른 점검표</h2>
      ${renderTable()}
      <div class="related-links"><strong>함께 보기</strong>${relatedLinks.map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join("")}</div>
    </article></main>
    <footer class="site-footer"><div><strong>TOWN114</strong><p>지역 생활정보를 방문 전 확인 기준으로 정리합니다.</p></div><div><span><a href="/privacy/">개인정보처리방침</a> · <a href="/terms/">이용약관</a> · <a href="/sitemap/">사이트맵</a></span></div></footer>
  </body>
</html>
`;

const nextLog = [
  { date, slot, slug, title: topic.title, category: topic.category, url: urlPath },
  ...log.filter((entry) => entry.url !== urlPath),
].slice(0, 200);

function renderIndex(entries) {
  const seenTopics = new Set();
  const visibleEntries = entries.filter((entry) => {
    const topicKey = `${entry.slot}:${baseSlug(entry.slug)}`;
    if (seenTopics.has(topicKey)) return false;
    seenTopics.add(topicKey);
    return true;
  });
  const items = visibleEntries
    .map((entry) => `<a href="${entry.url}"><span>${escapeHtml(entry.category)}</span><strong>${escapeHtml(entry.title)}</strong><small>${entry.slot === "afternoon" ? "오후" : "야간"} 자동 발행</small><em>${entry.date.replaceAll("-", ".")}</em></a>`)
    .join("\n          ");
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="TOWN114 자동 생활정보 글 목록입니다. 최근 발행된 생활정보 중 주제가 겹치지 않는 확인 가이드를 우선 정리합니다." />
    <meta name="robots" content="index,follow" />
    <meta name="google-adsense-account" content="ca-pub-5804969457082424" />
    <link rel="canonical" href="https://town114.com/news/auto-posts/" />
    <title>자동 생활정보 글 목록 | TOWN114</title>
    <link rel="stylesheet" href="../../styles.css" />
  </head>
  <body>
    <header class="site-header"><a class="brand" href="/"><span class="brand-mark">114</span><span><strong>TOWN114</strong><small>자동 생활정보</small></span></a><nav class="nav-links"><a href="/news/list/">브리핑</a><a href="/#service-directory">생활정보</a><a href="/sources/">자료 출처</a><a href="/contact/">오류 수정</a></nav></header>
    <main>
      <section class="plain-page briefing-hero"><article class="content-page"><p class="eyebrow">Auto updates</p><h1>자동 생활정보 글 목록</h1><div class="article-meta"><span>매일 오후·야간 자동 추가</span><span>최종 정리: ${date}</span></div><p>예약 작업으로 추가되는 생활정보 글을 모은 목록입니다. 각 글은 방문 전 확인 질문, 비용·운영 기준, 대체 후보 점검을 중심으로 구성합니다. 검색엔진과 방문자가 반복 글보다 최신 주제별 가이드를 먼저 볼 수 있도록 같은 주제는 최신 글만 노출합니다.</p></article></section>
      <section class="notice-section"><div class="notice-list notice-list-detailed" aria-label="자동 생활정보 글 목록">
          ${items}
      </div></section>
    </main>
    <footer class="site-footer"><div><strong>TOWN114</strong><p>자동 글도 출처와 확인 기준을 함께 둡니다.</p></div><div><span><a href="/privacy/">개인정보처리방침</a> · <a href="/terms/">이용약관</a> · <a href="/sitemap/">사이트맵</a></span></div></footer>
  </body>
</html>
`;
}

async function updateSitemap() {
  const sitemapPath = join(root, "sitemap.xml");
  let sitemap = await readFile(sitemapPath, "utf8");
  const entries = [
    `  <url><loc>https://town114.com/news/auto-posts/</loc><lastmod>${date}</lastmod><priority>0.7</priority></url>`,
    `  <url><loc>https://town114.com${urlPath}</loc><lastmod>${date}</lastmod><priority>0.7</priority></url>`,
  ];
  for (const entry of entries) {
    const loc = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!loc) continue;
    const escaped = loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const urlBlock = new RegExp(`\\s*<url><loc>${escaped}<\\/loc><lastmod>.*?<\\/lastmod><priority>.*?<\\/priority><\\/url>`);
    sitemap = sitemap.replace(urlBlock, "");
    sitemap = sitemap.replace("</urlset>", `${entry}\n</urlset>`);
  }
  await writeFile(sitemapPath, sitemap, "utf8");
}

if (dryRun) {
  console.log(`Dry run: would create ${urlPath}`);
  process.exit(0);
}

await mkdir(outDir, { recursive: true });
await writeFile(outFile, pageHtml, "utf8");
await writeFile(logPath, `${JSON.stringify(nextLog, null, 2)}\n`, "utf8");
await mkdir(join(root, "news", "auto-posts"), { recursive: true });
await writeFile(join(root, "news", "auto-posts", "index.html"), renderIndex(nextLog), "utf8");
await updateSitemap();

console.log(`Created auto post: ${urlPath}`);
