# Search Console Fix 2026-06-17

Issue shown in Google Search Console:

- Not found (404)
- Page with redirect
- Redirect error
- Excluded by `noindex`

Changes made:

- Added all known legacy redirects to `_worker.js`.
- Mirrored the same Worker update in `cloudflare-pages-site/_worker.js`.
- Changed `_redirects` targets from `.html` URLs to final canonical extensionless URLs.
- Mirrored the same `_redirects` update in `cloudflare-pages-site/_redirects`.
- Rebuilt:
  - `cloudflare-pages-site.zip`
  - `issuespot-cloudflare-pages-20260617.zip`
- Deployed Cloudflare Pages project `issuespot`.

Deployment:

- `https://e79a3250.issuespot.pages.dev`

Verification:

- Legacy apex URLs return one-hop 301 redirects to final canonical URLs.
- Legacy `www` URLs return one-hop 301 redirects to final canonical apex URLs.
- `https://issuespot.co.kr/sitemap.xml` returns 200.
- All sitemap URLs return 200 without redirects.
- `https://issuespot.co.kr/articles/claim-document-type-checklist` returns 200.

Search Console follow-up:

- Reopen the Page indexing report.
- For `Page with redirect` and `Redirect error`, click Validate fix.
- For `Not found (404)`, inspect examples first. URLs that are private files or intentionally removed can remain 404/noindex.
- Submit `https://issuespot.co.kr/sitemap.xml` again if the last read date is old.
