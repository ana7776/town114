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
- Build command: leave empty
- Build output directory: `/`

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

## Search Console / Search Advisor

After deploying the latest files:

- Google Search Console: add `https://town114.com/`, verify ownership, submit `https://town114.com/sitemap.xml`.
- Naver Search Advisor: add `https://town114.com/`, verify ownership, submit `https://town114.com/sitemap.xml`.
- Do not add fake verification meta tags. Google and Naver verification tokens are unique to each account.
