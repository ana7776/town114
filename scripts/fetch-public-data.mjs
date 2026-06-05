import { mkdir, writeFile } from "node:fs/promises";

const serviceKey = process.env.PUBLIC_DATA_SERVICE_KEY;

const sources = [
  {
    name: "parking",
    label: "전국주차장정보표준데이터",
    url: process.env.PARKING_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산"]
  },
  {
    name: "libraries",
    label: "전국도서관표준데이터",
    url: process.env.LIBRARY_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산"]
  },
  {
    name: "car-repair",
    label: "전국자동차정비업체표준데이터",
    url: process.env.CAR_REPAIR_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산"]
  }
];

if (!serviceKey) {
  throw new Error("PUBLIC_DATA_SERVICE_KEY environment variable is required.");
}

function buildUrl(baseUrl) {
  const url = new URL(baseUrl);
  const params = url.searchParams;
  if (!params.has("serviceKey") && !params.has("ServiceKey")) {
    params.set("serviceKey", serviceKey);
  }
  if (!params.has("pageNo")) params.set("pageNo", "1");
  if (!params.has("numOfRows")) params.set("numOfRows", "100");
  if (!params.has("type")) params.set("type", "json");
  if (!params.has("resultType")) params.set("resultType", "json");
  return url;
}

function unwrapItems(payload) {
  if (Array.isArray(payload)) return payload;
  const candidates = [
    payload?.response?.body?.items?.item,
    payload?.response?.body?.items,
    payload?.body?.items?.item,
    payload?.body?.items,
    payload?.items,
    payload?.data
  ];
  for (const value of candidates) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return [value];
  }
  return [];
}

function matchesRegion(record, keywords) {
  const text = Object.values(record).join(" ");
  return keywords.some((keyword) => text.includes(keyword));
}

async function fetchSource(source) {
  if (!source.url) {
    return {
      name: source.name,
      label: source.label,
      status: "missing_url",
      message: `${source.name} API URL environment variable is not set.`,
      fetchedAt: new Date().toISOString(),
      items: []
    };
  }

  const response = await fetch(buildUrl(source.url));
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    return {
      name: source.name,
      label: source.label,
      status: "non_json_response",
      statusCode: response.status,
      fetchedAt: new Date().toISOString(),
      preview: text.slice(0, 500),
      items: []
    };
  }

  const items = unwrapItems(payload).filter((item) => matchesRegion(item, source.regionKeywords));
  return {
    name: source.name,
    label: source.label,
    status: response.ok ? "ok" : "http_error",
    statusCode: response.status,
    fetchedAt: new Date().toISOString(),
    count: items.length,
    items
  };
}

await mkdir("data/generated", { recursive: true });
const results = [];
for (const source of sources) {
  results.push(await fetchSource(source));
}

await writeFile(
  "data/generated/public-data-snapshot.json",
  JSON.stringify(
    {
      regions: ["서울", "경기", "인천", "부산"],
      note: "Public data snapshot for editorial review before publishing.",
      results
    },
    null,
    2
  ),
  "utf8"
);

console.log("data/generated/public-data-snapshot.json saved");
