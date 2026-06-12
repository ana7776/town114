# Search indexing submission guide

Use this after the latest files are deployed to `https://town114.com/`.

## Pre-check

- Open `https://town114.com/sitemap.xml`.
- Confirm the sitemap includes the latest `/news/`, `/articles/`, and `/tools/` URLs.
- Confirm `https://town114.com/news/auto-posts/` shows the auto-post index, not the home page.
- Confirm `https://town114.com/tools/visit-question-builder/` shows the question builder page, not the home page.
- Confirm `https://town114.com/robots.txt` includes `Sitemap: https://town114.com/sitemap.xml`.

## Google Search Console

1. Open `https://search.google.com/search-console`.
2. Select the `town114.com` domain property.
3. Go to `Sitemaps`.
4. Submit `https://town114.com/sitemap.xml`.
5. Use `URL inspection` for the important new URLs below.
6. If Google says the URL is available to Google, click `Request indexing`.

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
- `https://town114.com/news/auto-posts/`
- `https://town114.com/news/auto-posts/2026-06-09-afternoon-weekday-parking-fee-check/`
- `https://town114.com/news/auto-posts/2026-06-09-evening-evening-pharmacy-call-check/`
- `https://town114.com/news/auto-posts/2026-06-10-afternoon-weekday-parking-fee-check/`
- `https://town114.com/news/auto-posts/2026-06-10-evening-evening-pharmacy-call-check/`
- `https://town114.com/news/auto-posts/2026-06-11-afternoon-community-center-document-window/`
- `https://town114.com/news/auto-posts/2026-06-11-evening-library-evening-room-check/`
- `https://town114.com/news/auto-posts/2026-06-12-afternoon-weekday-parking-fee-check/`
- `https://town114.com/news/auto-posts/2026-06-12-evening-evening-pharmacy-call-check/`

## Current production note

Checked on 2026-06-12: `https://town114.com/` is live, but the latest local
news/tools/auto-post pages were not yet deployed. The new URLs currently return
the home page HTML instead of their own page content. Do not request indexing
for the new URLs until production returns the correct page content for each URL.
