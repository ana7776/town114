import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const requiredKeys = [
  "PUBLIC_DATA_SERVICE_KEY",
  "PARKING_API_URL",
  "LIBRARY_API_URL",
  "CAR_REPAIR_API_URL",
  "PHARMACY_API_URL",
];

const optionalKeys = [
  "RENTAL_CAR_API_URL",
  "CIVIL_KIOSK_API_URL",
  "CULTURE_EVENT_API_URL",
  "CULTURE_FACILITY_API_URL",
  "EV_CHARGER_API_URL",
  "CHILDCARE_API_URL",
  "WELFARE_FACILITY_API_URL",
  "WORKNET_JOB_API_URL",
];

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!key) continue;
    env[key] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function describeValue(value) {
  if (!value) return "missing";
  if (/serviceKey=/i.test(value)) return "set, but remove serviceKey from the URL";
  return "set";
}

if (!existsSync(".env.local")) {
  console.log(".env.local is missing. Copy .env.example to .env.local first.");
  process.exit(1);
}

const env = parseEnv(await readFile(".env.local", "utf8"));

console.log("Public-data environment check");
console.log("");

for (const key of requiredKeys) {
  console.log(`${key}: ${describeValue(env[key])}`);
}

console.log("");

for (const key of optionalKeys) {
  console.log(`${key}: ${describeValue(env[key])}`);
}
