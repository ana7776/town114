#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const outDir = path.join(rootDir, "dist");

const entries = [
  "_headers",
  "_redirects",
  "_worker.js",
  "404.html",
  "about.html",
  "ads.txt",
  "advertising-policy.html",
  "articles",
  "assets",
  "claim-guide.html",
  "contact.html",
  "cookie-policy.html",
  "deploy-version.txt",
  "directory.html",
  "editorial-policy.html",
  "fax-guide.html",
  "googlefa76c3e8fcf3b216.html",
  "index.html",
  "insurance-age-calculator.html",
  "insurance-claim-roadmap.html",
  "privacy.html",
  "reference-preview.jpg",
  "review-method.html",
  "robots.txt",
  "rss.xml",
  "sitemap.xml",
  "site-preview-home-2026-06-03.png",
  "site-preview-home.jpg",
  "site-preview-mobile.jpg",
  "terms-archive.html",
  "terms.html",
  "topics"
];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(rootDir, entry);
  const target = path.join(outDir, entry);

  try {
    await fs.cp(source, target, {
      recursive: true,
      filter: (src) => !src.includes(`${path.sep}.DS_Store`)
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    console.warn(`Skipped missing build entry: ${entry}`);
  }
}

console.log(`Built Cloudflare Pages output at ${path.relative(rootDir, outDir)}`);
