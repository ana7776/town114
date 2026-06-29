# TOWN114

TOWN114 is a static local information guide for `town114.com`.

The site is positioned as a local service portal: visitors can start from service categories such as pharmacies, public parking, libraries, car repair shops, and community centers, then read visit-before-checking guides, source notes, and regional context.

## Site Structure

- `/` - Home portal with search, quick categories, region links, and example data
- `/services/.../` - Service category pages with visit criteria, example data structure, source plan, and related guides
- `/topics/.../` - SEO topic hubs for public services, local mobility, moving/housing, and family care
- `/articles/.../` - Original editorial guides and checklists
- `/regions/.../` - Regional local guides for Seoul, Gyeonggi, Incheon, Busan, and Jeonbuk
- `/sources/` - Source policy, public-data plan, and editorial standards
- `/sitemap/` - HTML sitemap for visitors and crawlers
- `/data/` - Static example data and future import notes
- `/scripts/` - Public-data snapshot helper scripts

## Data Workflow

Current static pages use example data and original explanatory content. API keys must not be committed or exposed in client-side files.

Planned data sources:

- Public Data Portal: national standard public parking lot data
- Public Data Portal: national standard library data
- Public Data Portal: national standard car repair business data
- Public health and medical open data or official local notices for pharmacies
- Official city, district, and public office pages for community centers
- Culture Portal public pages or API for culture calendars, cultural spaces, support programs, and accessibility notes

When real data is added, show source, baseline date, and a visit-before-checking notice on the public page.

## Cloudflare Pages

Use these settings:

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `/`
- Environment variable: `SITE_URL=https://town114.com`

The build command regenerates `sitemap.xml` and `robots.txt` before deployment. See `DEPLOYMENT_GUIDE.md` for the full GitHub + Cloudflare Pages setup.

## Cloudflare R2 Image Automation

The image automation script crawls configured pages, extracts image URLs, converts each image to WebP, uploads it to Cloudflare R2 through the S3-compatible API, and writes `data/r2-image-manifest.json`.

Local setup:

```bash
npm install
cp .env.example .env.local
```

Fill these values in `.env.local`:

- `CLOUDFLARE_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `IMAGE_CRAWL_SOURCES`

Dry run with configured sources:

```bash
npm run images:r2:dry-run
```

Dry run with a specific URL:

```bash
npm run images:r2:dry-run -- --url=https://town114.com/
```

Upload to R2:

```bash
npm run images:r2 -- --limit=30
```

GitHub Actions workflow:

- `.github/workflows/r2-images.yml`
- Required GitHub Secrets: `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`
- Required GitHub Variables: `IMAGE_CRAWL_SOURCES`
- Optional GitHub Variables: `R2_IMAGE_PREFIX`, `IMAGE_WEBP_MAX_WIDTH`, `IMAGE_WEBP_QUALITY`
- Default image quality: WebP quality `80`

## Local Preview

Run a local static preview from the project root:

```bash
node scripts/local-static-server.mjs 4173
```

Then open `http://127.0.0.1:4173/`.

## Auto Posts

Daily scheduled tasks can add one afternoon post and one evening post from `data/auto-post-topics.json`.

Manual test commands:

```bash
node scripts/auto-add-post.mjs --slot=afternoon --dry-run
node scripts/auto-add-post.mjs --slot=evening --dry-run
```

The Windows Task Scheduler wrapper is `scripts/run-auto-post.ps1`. It creates a post under `/news/auto-posts/`, updates the auto-post index, updates `sitemap.xml`, then commits and pushes only when the working tree contains no unrelated changes.

After deployment, connect these custom domains:

- `town114.com`
- `www.town114.com`

## AdSense Notes

- Add the official publisher line to `ads.txt` after Google AdSense provides the account-specific value.
- Keep ads visually separate from editorial content and data tables.
- Do not use wording that asks visitors to click ads.
- Keep empty or thin categories hidden until each hub has enough original text and related articles. See `ADSENSE_SEO_AUDIT.md`.

## Search Console / Search Advisor

After deploying the latest files:

- Google Search Console: add `https://town114.com/`, verify ownership, submit `https://town114.com/sitemap.xml`.
- Naver Search Advisor: add `https://town114.com/`, verify ownership, submit `https://town114.com/sitemap.xml`.
- Do not add fake verification meta tags. Google and Naver verification tokens are unique to each account.
