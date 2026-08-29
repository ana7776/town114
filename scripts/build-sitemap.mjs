import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const siteUrl = (process.env.SITE_URL || "https://town114.com").replace(/\/+$/, "");
const excludedDirs = new Set([".git", ".github", "node_modules", "qa-screenshots"]);
const lastmodStorePath = join(root, "data", "page-lastmod.json");
const today = new Date().toISOString().slice(0, 10);

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

function isIndexable(html) {
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i)?.[1] || "";
  return !robots.toLowerCase().split(",").map((value) => value.trim()).includes("noindex");
}

// lastmod must reflect real content changes, not build time. File mtime is the
// checkout time on CI and on Cloudflare Pages, so every build would otherwise
// stamp every URL with the deploy date. Dates are kept in data/page-lastmod.json
// and only advance when the page content hash changes.
async function readLastmodStore() {
  try {
    return JSON.parse(await readFile(lastmodStorePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

const files = await findIndexPages(root);
const pages = [];
for (const file of files) {
  const html = await readFile(file, "utf8");
  if (isIndexable(html)) {
    pages.push({ pathname: toUrlPath(file), hash: createHash("sha256").update(html).digest("hex") });
  }
}

const previousLastmod = await readLastmodStore();
const lastmodStore = {};
const urls = pages.map((page) => {
  const previous = previousLastmod[page.pathname];
  const lastmod = previous && previous.hash === page.hash && previous.lastmod ? previous.lastmod : today;
  lastmodStore[page.pathname] = { hash: page.hash, lastmod };
  return {
    loc: `${siteUrl}${page.pathname}`,
    pathname: page.pathname,
    lastmod,
    priority: priorityFor(page.pathname)
  };
});

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

const sortedLastmodStore = Object.fromEntries(
  Object.keys(lastmodStore).sort().map((pathname) => [pathname, lastmodStore[pathname]])
);

await writeFile(join(root, "sitemap.xml"), sitemap, "utf8");
await writeFile(join(root, "robots.txt"), robots, "utf8");
await writeFile(lastmodStorePath, `${JSON.stringify(sortedLastmodStore, null, 2)}\n`, "utf8");

const changedToday = urls.filter((item) => item.lastmod === today).length;
console.log(`Generated sitemap.xml with ${urls.length} URL(s), ${changedToday} dated ${today}.`);
console.log("Generated robots.txt.");
console.log("Updated data/page-lastmod.json.");
