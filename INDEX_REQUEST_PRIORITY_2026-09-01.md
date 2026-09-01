# 색인 요청 우선순위 목록 - 2026-09-01

이 문서가 현재 기준입니다. `INDEX_REQUEST_PRIORITY_2026-06-24.md`와
`INDEX_REQUEST_PRIORITY_2026-07-17.md`는 지난 기록으로만 보관합니다.

## 지난번과 상황이 다릅니다

7월 문서는 "아직 색인되지 않았으니 전 페이지를 요청하자"는 목록이었습니다.
지금은 그 단계가 끝났습니다.

Search Console 커버리지(데이터 기준일 2026-08-21):

| 항목 | 수 |
| --- | --- |
| 색인 생성됨 | 70 |
| sitemap 등록 URL | 71 |
| 발견됨 - 현재 색인 생성 안 됨 | 1 |

**sitemap에 넣은 71개 중 70개가 이미 색인되어 있습니다.**
따라서 이번에는 전체를 다시 요청하지 않습니다. 지침서에도 같은 경고가 있습니다.

> 색인 요청은 필요할 때 사용하되 반복 제출을 성과로 착각하지 않습니다.

이미 색인된 페이지를 다시 요청해도 순위나 노출이 올라가지 않습니다.
요청은 **내용이 실제로 바뀌어 재크롤이 필요한 페이지**에만 씁니다.

## 0. 배포 확인 (요청 전에 먼저)

2026-09-01 배포(#3 머지) 후 아래를 먼저 확인합니다. 배포가 안 됐으면 요청은 의미가 없습니다.

- `https://town114.com/sitemap.xml`이 열리고 URL 71개인지
- `https://town114.com/services/car-repair/`에서 길찾기 버튼이 카카오맵으로 열리는지
- `https://town114.com/`을 휴대폰에서 열었을 때 히어로 문구와 버튼이 잘리지 않는지
- `https://town114.com/feed.xml`에 `auto-posts` 주소가 없는지
- `https://town114.com/articles/`가 404가 아니라 `/sitemap/`으로 이동하는지

## 1순위: 이번 배포에서 기능이 바뀐 9개

길찾기 링크를 Google 지도에서 카카오맵으로 교체한 페이지와, 모바일 레이아웃을 고친 홈입니다.
사용자가 보는 동작이 실제로 달라졌으므로 재크롤 요청 가치가 있습니다.

```text
https://town114.com/
https://town114.com/services/car-repair/
https://town114.com/services/parking/
https://town114.com/services/libraries/
https://town114.com/services/rental-cars/
https://town114.com/services/pharmacies/
https://town114.com/services/hospitals/
https://town114.com/services/community-centers/
https://town114.com/articles/library-interlibrary-loan-guide/
```

## 2순위: 색인이 안 된 1개 찾기

커버리지의 "발견됨 - 현재 색인 생성 안 됨" 1건이 어느 주소인지 확인합니다.

1. Search Console → 페이지 → "발견됨 - 현재 색인 생성 안 됨" 클릭
2. 표시된 URL을 확인
3. 그 URL만 URL 검사 → 색인 생성 요청

이 항목은 Google이 "알고는 있으나 아직 크롤하지 않은" 상태입니다.
페이지 문제라기보다 크롤 예산 문제인 경우가 많으므로 한 번만 요청하고 기다립니다.

## 3순위: 새로 만든 리디렉션 주소 확인 (요청은 하지 않음)

디렉터리 주소가 404이던 것을 리디렉션으로 바꿨습니다.
**색인 요청 대상이 아니라 동작 확인 대상입니다.** 리디렉션 주소는 색인시키지 않습니다.

```text
https://town114.com/articles/   -> /sitemap/
https://town114.com/services/   -> /sitemap/
https://town114.com/topics/     -> /sitemap/
https://town114.com/regions/    -> /sitemap/
https://town114.com/news/       -> /news/list/
https://town114.com/tools/      -> /tools/visit-question-builder/
```

## 요청하지 않을 것

### 이미 색인된 나머지 페이지

내부 링크를 한두 개 추가하거나 표를 가로 스크롤 컨테이너로 감싼 페이지들입니다.
본문 내용 자체는 그대로이므로 개별 요청하지 않습니다.
sitemap의 `lastmod`가 갱신되어 있어 Google이 알아서 다시 방문합니다.

### 자동 생성 글

`/news/auto-posts/` 는 `noindex,follow`이며 sitemap과 RSS 양쪽에서 제외되어 있습니다.
**절대 색인 요청하지 않습니다.** 승인 심사 중에는 자동 발행 자체를 멈춥니다.

### 정책·안내 페이지

`/about/` `/contact/` `/privacy/` `/terms/` `/sources/` `/sitemap/` `/advertising-disclosure/`
는 색인 우선순위가 낮습니다. sitemap 제출로 충분합니다.

### 삭제한 주소

`/issuespot/` 계열과 정리한 자동 글은 404가 정답입니다.
되살리거나 다른 페이지로 리디렉션하지 않습니다. 근거는 `ADSENSE_APPROVAL_GUIDE.md` 9절.

## 색인보다 먼저 볼 것: 노출 대비 클릭

색인은 거의 끝났지만 클릭이 따라오지 않는 상태입니다(90일 기준 노출 3.8천, 클릭 28, CTR 0.7%).
색인 요청을 더 해도 이 숫자는 움직이지 않습니다. 아래는 **제목과 요약을 검색 문장에 맞추는** 작업 대상입니다.

| 페이지 | 노출 | 클릭 | 관련 검색어 |
| --- | --- | --- | --- |
| `/articles/safety-report-guide/` | 703 | 7 | 안전신문고 위치 |
| `/regions/busan-local-guide/` | 667 | 3 | 부산시설공단 주차통합포털, 부산통합주차포털 |
| `/articles/moving-address-checklist/` | 264 | 1 | 이사전 주소변경 |
| `/news/weekend-pharmacy-check/` | 227 | 1 | 주말 약국 |
| `/services/car-repair/` | 221 | 1 | 자동차 정비 견적비교 |
| `/articles/family-document-guide/` | 153 | 0 | - |
| `/services/community-centers/` | 123 | 0 | - |
| `/news/jeonbuk-pharmacy-parking-check/` | 122 | 0 | - |

제목을 자극적으로 바꾸라는 뜻이 아닙니다. 검색한 문장과 제목이 같은 것을 가리키는지 보고,
어긋나면 맞춥니다. **심사 기간에는 URL을 바꾸지 말고 제목·요약 수정에 그칩니다.**

## 제출 방법

- Google: Search Console → 상단 URL 검사창에 주소 붙여넣기 → "색인 생성 요청"
- 네이버: 서치어드바이저 → 요청 → 웹 페이지 수집 → 주소 입력
- sitemap 재제출: 양쪽 모두 `https://town114.com/sitemap.xml` 한 번만
- 요청 제한(Google 하루 10여 건)에 걸리면 중단하고 다음 날 이어서 진행

1순위 9개는 하루에 다 넣을 수 있는 분량입니다. 2순위 1개까지 합쳐도 10개입니다.
전체를 다시 넣지 마세요.
