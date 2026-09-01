import { execFile } from "node:child_process";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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

async function isIndexable(filePath) {
  const html = await readFile(filePath, "utf8");
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)?.[1] || "";
  return !robots.toLowerCase().split(",").map((value) => value.trim()).includes("noindex");
}

// Sitemap lastmod must reflect when a page's content actually changed. File mtime
// cannot do that: CI checks the repository out fresh on every run, which would stamp
// every URL with the build date and advertise a site-wide update that never happened.
// The last commit that touched each file is the stable signal, so read those in one pass.
async function readCommitDates() {
  const dates = new Map();

  // In a shallow clone the oldest commit is grafted into a root commit, so it reports
  // every file in the tree as if it were added there. Those file lists are an artifact
  // of the graft, not real history, so drop the boundary commits and let anything that
  // only appears in them fall through to the date already published.
  let boundary = [];
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--is-shallow-repository"], { cwd: root });
    if (stdout.trim() === "true") {
      const gitDir = (await execFileAsync("git", ["rev-parse", "--git-dir"], { cwd: root })).stdout.trim();
      boundary = (await readFile(join(root, gitDir, "shallow"), "utf8")).split("\n").map((line) => line.trim()).filter(Boolean);
      if (!boundary.length) return dates;
    }
  } catch {
    return dates;
  }

  let stdout = "";
  try {
    ({ stdout } = await execFileAsync(
      "git",
      [
        "log", "--no-merges", "--date=short", "--pretty=format:%cd", "--name-only",
        "HEAD", ...(boundary.length ? ["--not", ...boundary] : []), "--", "."
      ],
      { cwd: root, maxBuffer: 64 * 1024 * 1024 }
    ));
  } catch {
    return dates;
  }

  let currentDate = "";
  for (const line of stdout.split("\n")) {
    const value = line.trim();
    if (!value) continue;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      currentDate = value;
      continue;
    }
    // git log walks newest first, so the first date seen for a path is its latest change.
    if (currentDate && !dates.has(value)) dates.set(value, currentDate);
  }
  return dates;
}

// Dates from the sitemap already in the repository, used when git history is unavailable.
async function readPublishedDates() {
  const dates = new Map();
  let xml = "";
  try {
    xml = await readFile(join(root, "sitemap.xml"), "utf8");
  } catch {
    return dates;
  }
  for (const [, loc, lastmod] of xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)) {
    dates.set(loc, lastmod);
  }
  return dates;
}

const files = await findIndexPages(root);
const indexableFiles = [];
for (const file of files) {
  if (await isIndexable(file)) indexableFiles.push(file);
}

const commitDates = await readCommitDates();
const publishedDates = await readPublishedDates();

const urls = await Promise.all(indexableFiles.map(async (file) => {
  const pathname = toUrlPath(file);
  const loc = `${siteUrl}${pathname}`;
  const relPath = relative(root, file).split(sep).join("/");
  // Prefer real history, then the date already published, and only date a page to now
  // when it has neither - which means it is genuinely new.
  const lastmod = commitDates.get(relPath)
    || publishedDates.get(loc)
    || (await stat(file)).mtime.toISOString().slice(0, 10);
  return {
    loc,
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
