import { readdir, stat, writeFile } from "node:fs/promises";
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

const files = await findIndexPages(root);
const urls = await Promise.all(files.map(async (file) => {
  const fileStat = await stat(file);
  const pathname = toUrlPath(file);
  return {
    loc: `${siteUrl}${pathname}`,
    pathname,
    lastmod: fileStat.mtime.toISOString().slice(0, 10),
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

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/feed.xml
`;

await writeFile(join(root, "sitemap.xml"), sitemap, "utf8");
await writeFile(join(root, "robots.txt"), robots, "utf8");

console.log(`Generated sitemap.xml with ${urls.length} URL(s).`);
console.log("Generated robots.txt.");
