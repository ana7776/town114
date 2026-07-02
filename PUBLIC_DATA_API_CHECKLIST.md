# Public data API application checklist

Use this list when applying for API access at https://www.data.go.kr/.
Keep issued service keys outside Git and public HTML. Store them in local
environment variables or deployment secrets only.

## Current setup status

Checked on 2026-06-24:

| Env var | Status | Local snapshot result |
| --- | --- | --- |
| `PUBLIC_DATA_SERVICE_KEY` | Set | Shared key available locally |
| `PARKING_API_URL` | Set | 300 parking rows fetched |
| `LIBRARY_API_URL` | Set | 300 library rows fetched |
| `CAR_REPAIR_API_URL` | Set | 300 car-repair rows fetched |
| `RENTAL_CAR_API_URL` | Set | 300 rental-car rows fetched |
| `PHARMACY_API_URL` | Set | 81 pharmacy rows fetched |
| `HOSPITAL_API_URL` | Approved, URL not set locally | Add National Medical Center hospital search URL |
| `CIVIL_KIOSK_API_URL` | Missing | Add after approval |
| `CULTURE_EVENT_API_URL` | Missing | Add after approval |
| `CULTURE_FACILITY_API_URL` | Missing | Add after approval |
| `EV_CHARGER_API_URL` | Missing | Add after approval |
| `CHILDCARE_API_URL` | Missing | Add after approval |
| `WELFARE_FACILITY_API_URL` | Missing | Add after approval |
| `WORKNET_JOB_API_URL` | Missing | Add after approval |

After adding more URLs to `.env.local`, run:

```bash
node scripts/check-public-data-env.mjs
node scripts/fetch-public-data.mjs
node scripts/build-public-data-summary.mjs
```

## Priority 1: core TOWN114 listings

| Service area | Data.go.kr dataset | Apply? | Suggested env var | Public page use |
| --- | --- | --- | --- | --- |
| Parking | 전국주차장정보표준데이터 (`https://www.data.go.kr/data/15012896/standard.do`) | Yes | `PARKING_API_URL` | `/services/parking/`, local mobility guides |
| Libraries | 전국도서관표준데이터 | Yes | `LIBRARY_API_URL` | `/services/libraries/`, library articles |
| Car repair | 전국자동차정비업체표준데이터 | Yes | `CAR_REPAIR_API_URL` | `/services/car-repair/`, vehicle guides |
| Rental cars | 전국렌터카업체정보표준데이터 (`https://www.data.go.kr/data/15025689/standard.do`) | Optional | `RENTAL_CAR_API_URL` | `/services/rental-cars/`, local mobility guides |
| Pharmacies | 건강보험심사평가원_약국정보서비스 or 국립중앙의료원_전국 약국 정보 조회 서비스 | Yes | `PHARMACY_API_URL` | `/services/pharmacies/`, weekend/night pharmacy guides |
| Hospitals | 국립중앙의료원_전국 병·의원 찾기 서비스 (`https://www.data.go.kr/data/15000736/openapi.do`) | Approved | `HOSPITAL_API_URL` | `/services/hospitals/`, hospital visit and map guides |

## Priority 2: useful local-service expansion

| Service area | Data.go.kr dataset | Apply? | Suggested env var | Public page use |
| --- | --- | --- | --- | --- |
| Unmanned civil kiosks | 행정안전부_무인민원발급기정보 조회서비스 | Yes | `CIVIL_KIOSK_API_URL` | public-services topic, unmanned kiosk article |
| Culture events | 한국문화정보원_한눈에보는문화정보조회서비스 | Yes | `CULTURE_EVENT_API_URL` | culture calendar and briefing posts |
| Culture facilities | 한국문화정보원_문화시설조회서비스 | Yes | `CULTURE_FACILITY_API_URL` | culture facility visit guides |
| EV chargers | 한국환경공단_전기자동차 충전소 정보 | Optional | `EV_CHARGER_API_URL` | parking and vehicle road guides |
| Childcare centers | 한국사회보장정보원_전국 어린이집 정보 조회 or 어린이집별 기본정보 조회 | Optional | `CHILDCARE_API_URL` | family-care topic |
| Welfare facilities | 한국사회보장정보원_사회복지시설정보서비스 현황 | Optional | `WELFARE_FACILITY_API_URL` | senior and welfare guides |
| Jobs/events | 한국고용정보원_워크넷 채용정보 or 채용행사 API | Optional | `WORKNET_JOB_API_URL` | welfare job check guides |

## Recommended application purpose text

TOWN114 is a local information guide that caches public-data results and
shows visitors practical pre-visit checks such as address, phone number,
operating hours, fees, source, and baseline date. API keys are stored on the
server side only, and the site publishes a reduced static snapshot with source
attribution instead of exposing raw keys or unnecessary fields.

## Parking source note

The parking source is `전국주차장정보표준데이터`.

- Page: `https://www.data.go.kr/data/15012896/standard.do`
- Scope: public/private parking lots managed by local governments, excluding resident-priority parking zones
- Useful fields: parking lot name, type, road/lot address, number of spaces, operating days, weekday/Saturday/holiday hours, fee type, base fee, additional fee, daily/monthly fee, payment method, notes, managing agency, phone number, latitude, longitude, disabled parking availability, baseline date
- Official metadata on the page lists the responsible ministry as 국토교통부, provider as 지방자치단체, update cycle as 반기, and latest modification date as 2026-04-20.
- The page provides downloadable formats including XLS, XML, JSON, RDF, and CSV. For the full dataset, prefer API or JSON/CSV snapshot ingestion over manual grid download.

## Rental car source note

The rental car source is `전국렌터카업체정보표준데이터`.

- Page: `https://www.data.go.kr/data/15025689/standard.do`
- Useful fields: business name, road/lot address, latitude, longitude, garage address, garage capacity, vehicle holdings, business hours, phone number, provider, baseline date
- Suggested snapshot URL: `https://www.data.go.kr/download/standard.json?publicDataPk=15025689`
- Use it for basic location and vehicle-holding checks only. Prices, insurance, waiver, and same-day vehicle availability must be confirmed from the rental company directly.

## Fields to publish

- Facility or event name
- Category
- Region and district
- Address
- Phone number or official URL
- Operating hours, fee, or visit note
- Latitude and longitude when available
- Source dataset name
- Data baseline date
- Last fetched date

## Fields to avoid

- API service key
- Raw internal IDs unless needed for source tracing
- Personal names, private contact details, or unrelated administrative fields
- Full raw payloads on public pages
