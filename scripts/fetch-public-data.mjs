import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";

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

const serviceKey = process.env.PUBLIC_DATA_SERVICE_KEY;

const sources = [
  {
    name: "parking",
    label: "전국주차장정보표준데이터",
    url: process.env.PARKING_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"],
    maxItems: 300
  },
  {
    name: "libraries",
    label: "전국도서관표준데이터",
    url: process.env.LIBRARY_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"],
    maxItems: 300
  },
  {
    name: "car-repair",
    label: "전국자동차정비업체표준데이터",
    url: process.env.CAR_REPAIR_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"],
    maxItems: 300
  },
  {
    name: "rental-cars",
    label: "전국렌터카업체정보표준데이터",
    url: process.env.RENTAL_CAR_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"],
    maxItems: 300
  },
  {
    name: "pharmacies",
    label: "약국정보서비스",
    url: process.env.PHARMACY_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"]
  },
  {
    name: "hospitals",
    label: "국립중앙의료원_전국 병·의원 찾기 서비스",
    url: process.env.HOSPITAL_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"]
  },
  {
    name: "civil-kiosks",
    label: "무인민원발급기정보 조회서비스",
    url: process.env.CIVIL_KIOSK_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"]
  },
  {
    name: "culture-events",
    label: "문화행사 정보",
    url: process.env.CULTURE_EVENT_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"]
  },
  {
    name: "culture-facilities",
    label: "문화시설 정보",
    url: process.env.CULTURE_FACILITY_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"]
  },
  {
    name: "ev-chargers",
    label: "전기자동차 충전소 정보",
    url: process.env.EV_CHARGER_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"]
  },
  {
    name: "childcare",
    label: "어린이집 정보",
    url: process.env.CHILDCARE_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"]
  },
  {
    name: "welfare-facilities",
    label: "사회복지시설 정보",
    url: process.env.WELFARE_FACILITY_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"]
  },
  {
    name: "worknet-jobs",
    label: "워크넷 채용정보",
    url: process.env.WORKNET_JOB_API_URL,
    regionKeywords: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"]
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

function isStandardDownloadUrl(baseUrl) {
  try {
    const url = new URL(baseUrl);
    return url.hostname.endsWith("data.go.kr") && url.pathname === "/download/standard.json";
  } catch {
    return false;
  }
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

function decodeXml(value) {
  return String(value)
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function parseXmlItems(text) {
  return [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((itemMatch) => {
    const record = {};
    for (const fieldMatch of itemMatch[1].matchAll(/<([^/?][^>]*)>([\s\S]*?)<\/\1>/g)) {
      record[fieldMatch[1]] = decodeXml(fieldMatch[2].trim());
    }
    return record;
  });
}

function matchesRegion(record, keywords) {
  const text = Object.values(record).join(" ");
  return keywords.some((keyword) => text.includes(keyword));
}

function limitItemsByRegion(items, keywords, maxItems) {
  if (!maxItems || items.length <= maxItems) return items;
  const selected = [];
  const selectedIds = new Set();

  for (const keyword of keywords) {
    const item = items.find((record) => Object.values(record).join(" ").includes(keyword));
    if (!item) continue;
    const id = JSON.stringify(item);
    if (selectedIds.has(id)) continue;
    selected.push(item);
    selectedIds.add(id);
  }

  for (const item of items) {
    if (selected.length >= maxItems) break;
    const id = JSON.stringify(item);
    if (selectedIds.has(id)) continue;
    selected.push(item);
    selectedIds.add(id);
  }

  return selected;
}

async function fetchWithRetry(url, options = {}, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url);
  const text = await response.text();
  return { response, text, payload: JSON.parse(text) };
}

async function fetchStandardSource(source) {
  const baseUrl = new URL(source.url);
  const publicDataPk = baseUrl.searchParams.get("publicDataPk");
  if (!publicDataPk) {
    throw new Error(`${source.name} standard URL must include publicDataPk.`);
  }

  const headerUrl = new URL("/download/columList.json", baseUrl.origin);
  headerUrl.searchParams.set("pk", publicDataPk);
  headerUrl.searchParams.set("ext", "JSON");

  const { payload: header } = await fetchJson(headerUrl);
  const perPage = Number(baseUrl.searchParams.get("perPage") || "10000");
  const totalCount = Number(header.totalCount || 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const items = [];
  const matchedKeywords = new Set();
  const requiredKeywordCount = source.regionKeywords.length;

  for (let page = 1; page <= totalPages; page++) {
    const dataUrl = new URL(baseUrl);
    dataUrl.searchParams.delete("serviceKey");
    dataUrl.searchParams.delete("ServiceKey");
    for (const column of header.tableVO.colNmList) {
      dataUrl.searchParams.append("colNmList", column);
    }
    dataUrl.searchParams.set("totalCount", String(totalCount));
    dataUrl.searchParams.set("svcTableNm", header.tableVO.svcTableNm);
    dataUrl.searchParams.set("perPage", String(perPage));
    dataUrl.searchParams.set("page", String(page));

    const { payload } = await fetchJson(dataUrl);
    for (const item of unwrapItems(payload)) {
      if (matchesRegion(item, source.regionKeywords)) {
        items.push(item);
        for (const keyword of source.regionKeywords) {
          if (Object.values(item).join(" ").includes(keyword)) matchedKeywords.add(keyword);
        }
      }
    }
    if (source.maxItems && items.length >= source.maxItems && matchedKeywords.size >= requiredKeywordCount) break;
  }

  const limitedItems = limitItemsByRegion(items, source.regionKeywords, source.maxItems);

  return {
    name: source.name,
    label: source.label,
    status: "ok",
    sourceType: "data.go.kr_standard_download",
    fetchedAt: new Date().toISOString(),
    totalCount,
    count: limitedItems.length,
    items: limitedItems,
  };
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

  if (isStandardDownloadUrl(source.url)) {
    return fetchStandardSource(source);
  }

  const response = await fetchWithRetry(buildUrl(source.url));
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    const xmlItems = parseXmlItems(text);
    if (xmlItems.length) {
      const items = xmlItems.filter((item) => matchesRegion(item, source.regionKeywords));
      return {
        name: source.name,
        label: source.label,
        status: response.ok ? "ok" : "http_error",
        sourceType: "xml_open_api",
        statusCode: response.status,
        fetchedAt: new Date().toISOString(),
        count: items.length,
        items
      };
    }
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
      regions: ["서울", "경기", "인천", "부산", "전북", "전라북도", "전주", "군산", "익산", "정읍", "남원"],
      note: "Public data snapshot for editorial review before publishing.",
      results
    },
    null,
    2
  ),
  "utf8"
);

console.log("data/generated/public-data-snapshot.json saved");
