import { execFileSync } from "node:child_process";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const siteUrl = (process.env.SITE_URL || "https://town114.com").replace(/\/+$/, "");
const excludedDirs = new Set([".git", ".github", "node_modules", "qa-screenshots"]);

function toUrlPath(filePath) {
  const rel = relative(root, filePath).split(sep).join("/");
  if (rel === "index.html") return "/";
  return `/${rel.replace(/\/index\.html$/, "/")}`;
}

function priorityFor(pathname) {
  if (pathname === "/") return "1.0";
  if (pathname.startsWith("/topics/") || pathname.startsWith("/articles/")) return "0.9";
  if (pathname.startsWith("/services/") || pathname.startsWith("/regions/") || pathname.startsWith("/news/")) return "0.8";
  return "0.6";
}

async function findIndexPages(dir, pages = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) await findIndexPages(join(dir, entry.name), pages);
      continue;
    }
    if (entry.name === "index.html") pages.push(join(dir, entry.name));
  }
  return pages;
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function git(args) {
  return execFileSync("git", ["-c", "core.quotePath=false", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"]
  });
}

// Last commit date per tracked file. The build runs on a fresh clone, so file
// mtimes are all checkout time and would mark every page as changed today.
function loadGitDates() {
  const dates = new Map();
  let log;
  let topLevel;
  try {
    topLevel = git(["rev-parse", "--show-toplevel"]).trim();
    log = git(["log", "--name-only", "--format=%x00%cs"]);
  } catch {
    return { dates, topLevel: root };
  }
  let current = "";
  for (const line of log.split("\n")) {
    if (line.startsWith("\u0000")) {
      current = line.slice(1).trim();
      continue;
    }
    const path = line.trim();
    // git log is newest first, so the first date seen for a path is the latest.
    if (path && current && !dates.has(path)) dates.set(path, current);
  }
  return { dates, topLevel };
}

// Keeps previously published dates for files whose history is missing, which
// happens on shallow clones that cut off before a page's last change.
async function loadPublishedLastmod() {
  const lastmod = new Map();
  try {
    const xml = await readFile(join(root, "sitemap.xml"), "utf8");
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)) {
      try {
        lastmod.set(new URL(match[1]).pathname, match[2]);
      } catch {
        // Ignore malformed entries.
      }
    }
  } catch {
    // No previous sitemap yet.
  }
  return lastmod;
}

async function isIndexable(filePath) {
  const html = await readFile(filePath, "utf8");
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)?.[1] || "";
  return !robots.toLowerCase().split(",").map((value) => value.trim()).includes("noindex");
}

const files = await findIndexPages(root);
const indexableFiles = [];
for (const file of files) {
  if (await isIndexable(file)) indexableFiles.push(file);
}

const { dates: gitDates, topLevel } = loadGitDates();
const publishedLastmod = await loadPublishedLastmod();

const urls = await Promise.all(indexableFiles.map(async (file) => {
  const pathname = toUrlPath(file);
  const repoPath = relative(topLevel, file).split(sep).join("/");
  let lastmod = gitDates.get(repoPath) || publishedLastmod.get(pathname);
  if (!lastmod) {
    const fileStat = await stat(file);
    lastmod = fileStat.mtime.toISOString().slice(0, 10);
  }
  return {
    loc: `${siteUrl}${pathname}`,
    pathname,
    lastmod,
    priority: priorityFor(pathname)
  };
}));

urls.sort((a, b) => {
  if (a.pathname === "/") return -1;
  if (b.pathname === "/") return 1;
  return a.pathname.localeCompare(b.pathname);
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url><loc>${xmlEscape(item.loc)}</loc><lastmod>${item.lastmod}</lastmod><priority>${item.priority}</priority></url>`).join("\n")}
</urlset>
`;

const robots = `User-agent: Mediapartners-Google
Allow: /

User-agent: Google-Display-Ads-Bot
Allow: /

User-agent: AdsBot-Google
Allow: /

User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

await writeFile(join(root, "sitemap.xml"), sitemap, "utf8");
await writeFile(join(root, "robots.txt"), robots, "utf8");

console.log(`Generated sitemap.xml with ${urls.length} URL(s).`);
console.log("Generated robots.txt.");
