# Search indexing submission guide

Use this after the latest files are deployed to `https://town114.com/`.

## Pre-check

- Open `https://town114.com/sitemap.xml`.
- Confirm the sitemap includes the latest `/news/`, `/articles/`, and `/tools/` URLs.
- Confirm `https://town114.com/news/auto-posts/` shows the auto-post index, not the home page.
- Confirm `/news/auto-posts/` pages remain `noindex,follow` unless a page has been manually promoted and rewritten as an indexable guide.
- Confirm `https://town114.com/tools/visit-question-builder/` shows the question builder page, not the home page.
- Confirm `https://town114.com/robots.txt` includes `Sitemap: https://town114.com/sitemap.xml`.

## Google Search Console

1. Open `https://search.google.com/search-console`.
2. Select the `town114.com` domain property.
3. Go to `Sitemaps`.
4. If an old sitemap row named only `town114.com` shows `Couldn't fetch` or `Not found`, remove that row from the sitemap list.
5. Submit only `https://town114.com/sitemap.xml`.
6. Do not submit `town114.com`, `https://town114.com/`, or `/` as a sitemap URL.
7. Use `URL inspection` for the important new URLs below.
8. If Google says the URL is available to Google, click `Request indexing`.
9. Do not request indexing for URLs that contain `<meta name="robots" content="noindex,follow">`.

## Naver Search Advisor

1. Open `https://searchadvisor.naver.com/`.
2. Select `https://town114.com/`.
3. Submit `https://town114.com/sitemap.xml`.
4. Use web page collection/index request for the important new URLs below.

## Important new URLs

- `https://town114.com/tools/visit-question-builder/`
- `https://town114.com/news/list/`
- `https://town114.com/regions/jeonbuk-local-guide/`
- `https://town114.com/services/rental-cars/`
- `https://town114.com/news/jeonbuk-pharmacy-parking-check/`
- `https://town114.com/news/parking-fee-before-visit/`
- `https://town114.com/news/community-center-document-visit/`
- `https://town114.com/news/weekend-pharmacy-check/`
- `https://town114.com/news/ev-charging-parking-cost/`
- `https://town114.com/news/local-data-update-rule/`
- `https://town114.com/articles/public-notice-guide/`
- `https://town114.com/articles/welfare-job-check-guide/`
- `https://town114.com/articles/culture-facility-visit-guide/`
- `https://town114.com/articles/vehicle-road-check-guide/`
- `https://town114.com/articles/culture-calendar-check-guide/`
- `https://town114.com/articles/culture-benefit-application-guide/`
- `https://town114.com/articles/culture-accessibility-guide/`

## Auto-post policy

The `/news/auto-posts/` section is intentionally kept out of Google/Naver indexing while AdSense review is pending. These pages can still help internal discovery through `follow`, but they should not be submitted through URL inspection until they are merged, rewritten, or promoted into a stronger indexable guide.

## Current production note

Checked on 2026-06-24: Search Console may still show a failed sitemap row named
`town114.com` from an earlier incorrect submission. That row points to the site
itself, not to the XML sitemap. Delete it and submit `https://town114.com/sitemap.xml`.
After deployment, confirm the latest local pages are visible on production
before requesting indexing for updated URLs.
