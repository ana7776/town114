# TOWN114 data workflow

This folder keeps static data files used before API-based search is enabled.

## Approval-stage approach

- Keep API keys out of public HTML, JavaScript, and Git history.
- Use small static JSON samples to show the site structure.
- Show source, baseline date, and "check before visiting" guidance on pages.
- Replace samples with cached public-data results after Cloudflare Pages Functions or Workers are configured.

## Planned sources

- Parking: 공공데이터포털 전국주차장정보표준데이터
- Libraries: 공공데이터포털 전국도서관표준데이터
- Car repair: 공공데이터포털 전국자동차정비업체표준데이터
- Pharmacies: 보건의료 관련 공개 API or official local notices
- Community centers: official city, district, and public office pages

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
