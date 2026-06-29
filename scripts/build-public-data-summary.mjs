import { readFile, writeFile } from "node:fs/promises";

const snapshotPath = "data/generated/public-data-snapshot.json";
const outputPath = "data/public-data-summary.json";

const sourceMap = {
  parking: {
    label: "공영주차장",
    page: "/services/parking/",
    fields: {
      name: ["PRKPLCE_NM"],
      region: ["INSTT_NM", "INSTITUTION_NM"],
      address: ["RDNMADR", "LNMADR"],
      phone: ["PHONE_NUMBER"],
      note: ["PARKINGCHRGE_INFO", "OPER_DAY", "PRKPLCE_TYPE"],
      baselineDate: ["REFERENCE_DATE"],
      latitude: ["LATITUDE"],
      longitude: ["LONGITUDE"]
    }
  },
  libraries: {
    label: "도서관",
    page: "/services/libraries/",
    fields: {
      name: ["LBRRY_NM"],
      region: ["CTPRVN_NM", "SIGNGU_NM", "INSTT_NM"],
      address: ["RDNMADR", "LNMADR"],
      phone: ["PHONE_NUMBER"],
      note: ["LBRRY_SE", "CLOSE_DAY", "WEEKDAY_OPER_OPEN_HHMM", "WEEKDAY_OPER_COLSE_HHMM"],
      baselineDate: ["REFERENCE_DATE"],
      latitude: ["LATITUDE"],
      longitude: ["LONGITUDE"]
    }
  },
  "car-repair": {
    label: "자동차 정비소",
    page: "/services/car-repair/",
    fields: {
      name: ["INSPOFC_NM"],
      region: ["INSTT_NM", "INSTITUTION_NM"],
      address: ["RDNMADR", "LNMADR"],
      phone: ["PHONE_NUMBER"],
      note: ["INSPOFC_TYPE", "BSN_STTUS", "OPER_OPEN_HM", "OPER_CLOSE_HM"],
      baselineDate: ["REFERENCE_DATE"],
      latitude: ["LATITUDE"],
      longitude: ["LONGITUDE"]
    }
  },
  "rental-cars": {
    label: "렌터카",
    page: "/services/rental-cars/",
    fields: {
      name: ["ENTRPS_NM"],
      region: ["INSTT_NM"],
      address: ["RDNMADR", "LNMADR"],
      phone: ["PHONE_NUMBER"],
      note: ["BPLC_TYPE", "VHCLE_HOLD_CO", "CAR_HOLD_CO", "VANS_HOLD_CO"],
      baselineDate: ["REFERENCE_DATE"],
      latitude: ["LATITUDE"],
      longitude: ["LONGITUDE"]
    }
  },
  pharmacies: {
    label: "약국",
    page: "/services/pharmacies/",
    fields: {
      name: ["yadmNm"],
      region: ["sidoCdNm", "sgguCdNm", "emdongNm"],
      address: ["addr"],
      phone: ["telno"],
      note: ["clCdNm"],
      baselineDate: ["estbDd"],
      latitude: ["YPos"],
      longitude: ["XPos"]
    }
  }
};

function first(record, keys) {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function combine(record, keys) {
  return keys
    .map((key) => record?.[key])
    .filter((value) => value !== undefined && value !== null && String(value).trim())
    .map((value) => String(value).trim())
    .join(" · ");
}

function normalizeItem(record, fields) {
  return {
    name: first(record, fields.name),
    region: combine(record, fields.region),
    address: first(record, fields.address),
    phone: first(record, fields.phone),
    visitNote: combine(record, fields.note),
    baselineDate: first(record, fields.baselineDate),
    latitude: first(record, fields.latitude),
    longitude: first(record, fields.longitude)
  };
}

const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const fetchedAt = new Date().toISOString();

const services = snapshot.results.map((result) => {
  const config = sourceMap[result.name];
  const items = config
    ? (result.items || [])
        .map((item) => normalizeItem(item, config.fields))
        .filter((item) => item.name && (item.address || item.region))
        .slice(0, 20)
    : [];

  return {
    name: result.name,
    label: config?.label || result.label,
    sourceLabel: result.label,
    page: config?.page || "",
    status: result.status,
    fetchedAt: result.fetchedAt || fetchedAt,
    totalCount: result.totalCount || null,
    snapshotCount: result.count || 0,
    publicSampleCount: items.length,
    items
  };
});

const okServices = services.filter((service) => service.status === "ok");

await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      updatedAt: fetchedAt,
      regions: snapshot.regions,
      note: "Public visitor-facing summary derived from local public-data snapshot. API keys and raw internal fields are not included.",
      totals: {
        configuredOk: okServices.length,
        snapshotItems: okServices.reduce((sum, service) => sum + service.snapshotCount, 0),
        publicSampleItems: okServices.reduce((sum, service) => sum + service.publicSampleCount, 0)
      },
      services
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`${outputPath} saved`);
