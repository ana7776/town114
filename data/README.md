# TOWN114 data workflow

This folder keeps static data files used before API-based search is enabled.

## Static data approach

- Keep API keys out of public HTML, JavaScript, and Git history.
- Use small static JSON examples to show the site structure.
- Show source, baseline date, and "check before visiting" guidance on pages.
- Publish reduced cached summaries instead of raw API payloads.

## Current public-data snapshot

Checked on 2026-06-24, the local `.env.local` has working values for:

- `PARKING_API_URL`
- `LIBRARY_API_URL`
- `CAR_REPAIR_API_URL`
- `RENTAL_CAR_API_URL`
- `PHARMACY_API_URL`

The latest local fetch produced:

- Parking: 300 snapshot rows from national parking standard data
- Libraries: 300 snapshot rows from national library standard data
- Car repair: 300 snapshot rows from national car repair standard data
- Rental cars: 300 snapshot rows from national rental car standard data
- Pharmacies: 81 snapshot rows from pharmacy information service

Raw fetch output is written to `data/generated/public-data-snapshot.json`, which
is ignored by Git. Public visitor-facing data is reduced into
`data/public-data-summary.json` with API keys and unnecessary raw fields removed.

## Planned sources

- Parking: Public Data Portal national standard public parking lot data
- Libraries: Public Data Portal national standard library data
- Car repair: Public Data Portal national standard car repair business data
- Rental cars: Public Data Portal national standard rental car business data
- Pharmacies: public health and medical open data or official local notices
- Community centers: official city, district, and public office pages
- Culture information: Culture Portal public pages or API for culture calendars, spaces, support programs, and accessibility notes

See `../PUBLIC_DATA_API_CHECKLIST.md` before applying for API access. Start
with parking, libraries, car repair, rental cars, and pharmacies, then add civil kiosks,
culture events/facilities, EV chargers, childcare, welfare facilities, and
WorkNet jobs if those sections are expanded.

## Environment variables

The snapshot helper expects API request URLs and the shared public-data service
key to be provided outside Git:

- `PUBLIC_DATA_SERVICE_KEY`
- `PARKING_API_URL`
- `LIBRARY_API_URL`
- `CAR_REPAIR_API_URL`
- `RENTAL_CAR_API_URL`
- `PHARMACY_API_URL`
- `CIVIL_KIOSK_API_URL`
- `CULTURE_EVENT_API_URL`
- `CULTURE_FACILITY_API_URL`
- `EV_CHARGER_API_URL`
- `CHILDCARE_API_URL`
- `WELFARE_FACILITY_API_URL`
- `WORKNET_JOB_API_URL`

Copy `.env.example` to `.env.local`, then fill in the approved service key and
API endpoint URLs. Keep `serviceKey` out of the URL values because
`scripts/fetch-public-data.mjs` adds `PUBLIC_DATA_SERVICE_KEY` automatically.

Check which values are present without printing secrets:

```bash
node scripts/check-public-data-env.mjs
```

Fetch a local editorial snapshot after the required values are set:

```bash
node scripts/fetch-public-data.mjs
```

Then build the public summary:

```bash
node scripts/build-public-data-summary.mjs
```

Use `data/public-data-summary.json` for page enrichment and search features.
Do not publish `data/generated/public-data-snapshot.json` directly.

## Update rule

When real data is imported, keep only fields useful to visitors:

- name
- category
- region
- address
- phone
- opening hours or operation note
- fee or service note
- source
- baseline date
- last checked date

Do not publish unnecessary personal information or raw API keys.
