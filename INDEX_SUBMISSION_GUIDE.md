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
7. Use `URL inspection` only for the URLs listed in the current priority document (see below).
8. If Google says the URL is available to Google, click `Request indexing`.
9. Do not request indexing for URLs that contain `<meta name="robots" content="noindex,follow">`.

## Naver Search Advisor

1. Open `https://searchadvisor.naver.com/`.
2. Select `https://town114.com/`.
3. Submit `https://town114.com/sitemap.xml`.
4. Use web page collection/index request only for the URLs listed in the current priority document (see below).

## Which URLs to request

Do not work from a fixed list in this file; it goes stale. The current request
list lives in `INDEX_REQUEST_PRIORITY_2026-09-01.md`, which is rebuilt from the
latest coverage export.

As of the 2026-08-21 coverage data, 70 of the 71 sitemap URLs are already
indexed, so the list is short on purpose: request only the pages whose content
actually changed, plus whatever the coverage report shows as discovered but not
indexed. Re-requesting pages that are already indexed does nothing.

## Auto-post policy

The `/news/auto-posts/` section is intentionally kept out of Google/Naver indexing while AdSense review is pending. These pages can still help internal discovery through `follow`, but they should not be submitted through URL inspection until they are merged, rewritten, or promoted into a stronger indexable guide.

## Current production note

Checked on 2026-09-01: the site is served from the apex domain and
`www.town114.com` 301-redirects to it. Those www URLs will always appear in
coverage under "페이지에 리디렉션이 있음"; that is the redirect working, not a
defect. See `ADSENSE_APPROVAL_GUIDE.md` section 9 before acting on that report.

If Search Console still shows an old sitemap row named only `town114.com`
(pointing at the site rather than the XML file), remove that row and submit
`https://town114.com/sitemap.xml`.
