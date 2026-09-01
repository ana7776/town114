# 색인 요청 우선순위 목록 - 2026-07-17

> **이 문서는 지난 기록입니다.** 현재 기준은 `INDEX_REQUEST_PRIORITY_2026-09-01.md`입니다.
> 당시에는 색인이 거의 없어 전 페이지를 요청하는 목록이었지만, 2026-08-21 기준 sitemap 71개 중
> 70개가 색인된 상태이므로 이 목록대로 전체를 다시 요청하면 안 됩니다.


현재 sitemap.xml(68개 URL) 기준으로 정리. 이전 문서(INDEX_REQUEST_PRIORITY_2026-06-24.md)의
/news/auto-posts/ 주소들은 현재 사이트맵에서 빠져 있으므로 이 문서를 기준으로 진행합니다.

## 0. 사이트맵 제출 (가장 먼저, 한 번만)

- Google Search Console → Sitemaps → `https://town114.com/sitemap.xml` 제출
- 네이버 서치어드바이저 → 요청 → 사이트맵 제출 → 동일 URL 제출

개별 URL 검사(색인 요청)는 Google 기준 하루 10여 건 제한이 있으므로 아래 순서대로 나눠서 진행합니다.

## 1순위 (1일차): 홈 + 허브 페이지 12개

트래픽과 내부 링크의 중심이 되는 페이지들. 이 페이지들이 색인되면 하위 글 발견도 빨라집니다.

```text
https://town114.com/
https://town114.com/services/pharmacies/
https://town114.com/services/hospitals/
https://town114.com/services/parking/
https://town114.com/services/libraries/
https://town114.com/services/car-repair/
https://town114.com/services/rental-cars/
https://town114.com/services/community-centers/
https://town114.com/topics/public-services/
https://town114.com/topics/local-mobility/
https://town114.com/topics/moving-housing/
https://town114.com/topics/family-care/
```

## 2순위 (2일차): 지역 가이드 + 뉴스 목록 + 도구

```text
https://town114.com/regions/seoul-local-guide/
https://town114.com/regions/gyeonggi-local-guide/
https://town114.com/regions/incheon-local-guide/
https://town114.com/regions/busan-local-guide/
https://town114.com/regions/jeonbuk-local-guide/
https://town114.com/news/list/
https://town114.com/tools/visit-question-builder/
```

## 3순위 (3일차): 대표 글 (검색 수요가 큰 주제 우선)

```text
https://town114.com/articles/late-night-public-pharmacy-guide/
https://town114.com/articles/pharmacy-weekend-guide/
https://town114.com/articles/saturday-hospital-check-guide/
https://town114.com/articles/public-parking-guide/
https://town114.com/articles/public-parking-free-discount-guide/
https://town114.com/articles/bulky-waste-online-report-guide/
https://town114.com/articles/bulky-waste-mobile-report-guide/
https://town114.com/articles/ev-charging-station-guide/
https://town114.com/articles/community-center-guide/
https://town114.com/articles/moving-address-checklist/
```

## 4순위 (4일차 이후): 나머지 글

```text
https://town114.com/articles/how-we-verify-local-info/
https://town114.com/articles/local-info-scorecard/
https://town114.com/articles/local-life-checklist/
https://town114.com/articles/region-comparison-guide/
https://town114.com/articles/safe-local-search-guide/
https://town114.com/articles/local-phone-search-guide/
https://town114.com/articles/unmanned-civil-kiosk-guide/
https://town114.com/articles/car-service-guide/
https://town114.com/articles/local-library-guide/
https://town114.com/articles/apartment-management-fee-guide/
https://town114.com/articles/local-recycling-disposal-guide/
https://town114.com/articles/family-document-guide/
https://town114.com/articles/childcare-center-visit-guide/
https://town114.com/articles/senior-welfare-center-guide/
https://town114.com/articles/safety-report-guide/
https://town114.com/articles/public-notice-guide/
https://town114.com/articles/welfare-job-check-guide/
https://town114.com/articles/culture-facility-visit-guide/
https://town114.com/articles/vehicle-road-check-guide/
https://town114.com/articles/culture-calendar-check-guide/
https://town114.com/articles/culture-benefit-application-guide/
https://town114.com/articles/culture-accessibility-guide/
https://town114.com/articles/national-dermatology-visit-guide/
https://town114.com/articles/local-business-check-guide/
https://town114.com/articles/library-booksea-interlibrary-guide/
https://town114.com/news/local-official-source-check/
https://town114.com/news/jeonbuk-pharmacy-parking-check/
https://town114.com/news/parking-fee-before-visit/
https://town114.com/news/community-center-document-visit/
https://town114.com/news/weekend-pharmacy-check/
https://town114.com/news/ev-charging-parking-cost/
https://town114.com/news/local-data-update-rule/
```

## 개별 요청 불필요 (사이트맵 제출로 충분)

정책·안내 페이지는 색인 우선순위가 낮으므로 개별 요청하지 않습니다.

```text
https://town114.com/about/
https://town114.com/contact/
https://town114.com/privacy/
https://town114.com/terms/
https://town114.com/sources/
https://town114.com/sitemap/
https://town114.com/advertising-disclosure/
```

## 제출 방법

- Google: Search Console → 상단 URL 검사창에 주소 붙여넣기 → "색인 생성 요청" 클릭
- 네이버: 서치어드바이저 → 요청 → 웹 페이지 수집 → 주소 입력
- 요청 제한에 걸리면 중단하고 다음 날 이어서 진행
- 1~3일 후 Search Console "페이지 색인 생성" 보고서에서 색인 수 증가 확인
