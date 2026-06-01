# TOWN114

TOWN114 is a static local information guide for `town114.com`.

## Site Structure

- `/` - Home
- `/about/` - About
- `/contact/` - Contact
- `/privacy/` - Privacy Policy
- `/terms/` - Terms
- `/articles/.../` - Original editorial guides
- `/regions/.../` - Regional local guides
- `/topics/.../` - SEO topic hubs
- `/sitemap/` - HTML sitemap for visitors and crawlers

## Cloudflare Pages

Use these settings:

- Framework preset: `None`
- Build command: leave empty
- Build output directory: `/`

After deployment, connect these custom domains:

- `town114.com`
- `www.town114.com`

## Notes

Replace the placeholder publisher ID in `ads.txt` after Google AdSense provides the real publisher ID.

## Search Console / Search Advisor

After deploying the latest files:

- Google Search Console: add `https://town114.com/`, verify ownership, submit `https://town114.com/sitemap.xml`.
- Naver Search Advisor: add `https://town114.com/`, verify ownership, submit `https://town114.com/sitemap.xml`.
- Do not add fake verification meta tags. Google and Naver verification tokens are unique to each account.


