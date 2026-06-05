# TOWN114 approval checklist

Use this after the latest files are deployed to `https://town114.com/`.

## Before applying

- Confirm `https://town114.com/` and `https://www.town114.com/` both open.
- Confirm `https://town114.com/sitemap.xml` returns the updated sitemap.
- Confirm `https://town114.com/robots.txt` includes the sitemap URL.
- Confirm the homepage shows the local guide hero image and service links.
- Confirm `/about/`, `/contact/`, `/privacy/`, `/terms/`, `/sources/`, and `/advertising-disclosure/` are reachable from internal links.
- Confirm every top navigation and footer link opens a real content page.
- Confirm the homepage does not present the site as unfinished, pending approval, or under construction.
- Confirm article pages include original decision tables, checklists, or field memo sections, not only rewritten official notices.
- Confirm privacy text discloses Google advertising cookies, identifiers, and third-party processing.
- Confirm no ad placement asks users to click ads or makes ads look like navigation.

## Google Search Console

- Add the domain property for `town114.com`.
- Add the TXT record listed in `google-search-console-dns.txt` to Cloudflare DNS.
- After DNS propagation, verify the property.
- Submit `https://town114.com/sitemap.xml`.

## Naver Search Advisor

- Add `https://town114.com/`.
- Use the exact Naver-provided HTML file or meta tag for ownership verification.
- Submit `https://town114.com/sitemap.xml`.

## Google AdSense

- Apply only after the production domain serves the latest files.
- Do not add ad slots until the account provides the official publisher ID.
- When the publisher ID is issued, update `ads.txt` with the official Google seller line.
- Keep ads separate from article text, data tables, search controls, and navigation.
