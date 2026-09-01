# TOWN114 approval checklist

Run this after the latest files are deployed to `https://town114.com/`.

Record **evidence and a check date** for every row. A tick without evidence usually means the check
was marked, not performed. Judgment criteria and the rejection playbook live in
`ADSENSE_APPROVAL_GUIDE.md`; this file is the execution log.

## Before running

```bash
npm run build          # regenerate sitemap.xml and robots.txt
npm run seo:audit      # H1, heading order, canonical, encoding, footer links
npm run approval:audit # broken links, thin content, duplicates, table scroll, page dates
```

Both audits must exit clean before anything below is checked. Items the scripts already cover are
marked "auto" and do not need a manual note unless a script reports an issue.

## Site reachability

| Check | Evidence | Date | Status |
| --- | --- | --- | --- |
| `https://town114.com/` and `https://www.town114.com/` both open | | | |
| Site opens in a private window with no login | `/contact/` verified by the owner | 2026-09-01 | Pass |
| `https://town114.com/sitemap.xml` matches the local `sitemap.xml` URL count | | | |
| `https://town114.com/robots.txt` includes the sitemap URL | auto | | |
| No page presents the site as unfinished, pending approval, or under construction | | | |

## Required pages

| Check | Evidence | Date | Status |
| --- | --- | --- | --- |
| `/about/`, `/contact/`, `/privacy/`, `/terms/`, `/sources/`, `/advertising-disclosure/` reachable from internal links | auto | | |
| Each required page shows an effective or last-reviewed date | auto | | |
| `anagim7776@gmail.com` receives a test message sent from an outside account | Address in active daily use, confirmed by the owner | 2026-09-01 | Pass |
| Privacy text discloses Google advertising cookies, identifiers, and third-party processing | | | |
| Terms contain no leftover sample wording from another site | | | |
| Contact address is identical in page text and structured data | `/`, `/about/`, `/contact/` | | |

## Content

| Check | Evidence | Date | Status |
| --- | --- | --- | --- |
| Three flagship articles fill distinct roles and link to each other | `ADSENSE_APPROVAL_GUIDE.md` §3 | | |
| Article pages include original decision tables, checklists, or field notes, not only rewritten notices | | | |
| Every navigation and footer link opens a real content page | auto | | |
| No indexable page falls below the 1,350-character body baseline | auto | | |
| No duplicate titles or meta descriptions among indexable pages | auto | | |
| Auto-generated posts stay `noindex,follow` and out of the sitemap | auto | | |
| Auto publishing is paused while the application is under review | | | |

## Mobile and ads

| Check | Evidence | Date | Status |
| --- | --- | --- | --- |
| Home, a flagship article, and three tables read correctly on two phones | Chromium sweep: 71 pages x 320/360/390px, no element exceeds the viewport | 2026-09-01 | Chromium (= Android Chrome) clear; iOS Safari still needs a real device |
| Wide tables scroll horizontally instead of being clipped | auto | | |
| No ad placement asks users to click ads or makes ads look like navigation | auto | | |
| Pages linking a commercial service carry a visible external-link notice | | | |
| Every 길찾기 button opens a working car route | Kakao Map links confirmed on a phone by the owner | 2026-09-01 | Pass |

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
- Confirm the site address added in AdSense matches the canonical host exactly (scheme, `www`, subdomain).
- Do not add ad slots until the account provides the official publisher ID.
- When the publisher ID is issued, update `ads.txt` with the official Google seller line.
- Keep ads separate from article text, data tables, search controls, and navigation.
- Do not restructure URLs or take pages offline while the review is in progress.

## If the application is rejected

Do not add articles first. Classify the rejection reason, then work the matching row in
`ADSENSE_APPROVAL_GUIDE.md` §5 and record: problem wording / affected pages / what changed /
how it was verified / date.
