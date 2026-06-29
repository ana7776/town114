# AdSense Approval Follow-up Checklist

점검일: 2026-06-25

## 승인 신청 직후 확인할 것

1. AdSense 사이트 화면에서 `issuespot.co.kr` 상태를 확인합니다.
2. `Ads.txt 상태`가 `찾을 수 없음`이면 사이트 행을 열고 `업데이트 확인`을 누릅니다.
3. `https://issuespot.co.kr/ads.txt`가 브라우저에서 아래처럼 보이는지 확인합니다.

```txt
google.com, pub-5804969457082424, DIRECT, f08c47fec0942fa0
```

4. 승인 심사 중에는 광고 배치나 사이트 구조를 크게 바꾸지 않습니다.
5. Search Console과 네이버 서치어드바이저에서 주요 URL 색인 요청을 진행합니다.

## Search Console에 우선 색인 요청할 URL

- https://issuespot.co.kr/
- https://issuespot.co.kr/insurance-claim-roadmap
- https://issuespot.co.kr/articles/
- https://issuespot.co.kr/topics/
- https://issuespot.co.kr/topics/claim-documents
- https://issuespot.co.kr/topics/claim-methods
- https://issuespot.co.kr/topics/claim-review
- https://issuespot.co.kr/claim-guide
- https://issuespot.co.kr/directory
- https://issuespot.co.kr/about
- https://issuespot.co.kr/contact
- https://issuespot.co.kr/privacy
- https://issuespot.co.kr/editorial-policy
- https://issuespot.co.kr/review-method
- https://issuespot.co.kr/advertising-policy

## 사이트맵 제출 URL

- https://issuespot.co.kr/sitemap.xml
- https://issuespot.co.kr/rss.xml

## 승인 전후 모니터링 포인트

- `robots.txt`에서 전체 크롤링이 허용되는지 확인합니다.
- 주요 URL이 `200 OK`로 열리는지 확인합니다.
- 깨진 내부 링크가 없는지 확인합니다.
- 페이지 제목과 설명이 서로 중복되지 않는지 확인합니다.
- 짧은 글은 순차적으로 본문을 보강합니다.
- 승인 전에는 광고 클릭 유도 문구나 과도한 광고 배치를 추가하지 않습니다.

## 수정/보강된 주요 주소

- `https://issuespot.co.kr/insurance-claim-roadmap`
  - 보험금 청구 처음 가이드 허브 페이지입니다.
  - 핵심 정리, 목차, FAQ, 작성 기준, 관련 글 클러스터가 포함되어 있습니다.

- `https://issuespot.co.kr/articles/`
  - 새 시작 가이드를 상단 글 목록에 연결했습니다.

- `https://issuespot.co.kr/`
  - 홈 추천 동선과 주요 카드에서 시작 가이드로 연결했습니다.

- `https://issuespot.co.kr/sitemap.xml`
  - 새 시작 가이드 URL을 추가했습니다.

- `https://issuespot.co.kr/rss.xml`
  - 깨진 한글 RSS를 UTF-8 RSS로 다시 정리했고 새 시작 가이드를 첫 항목으로 추가했습니다.

- `https://issuespot.co.kr/ads.txt`
  - Worker에서 직접 `200 OK`와 올바른 본문을 반환하도록 고정했습니다.

## 재신청 또는 보완 요청이 왔을 때

AdSense에서 `Low value content`, `Under construction`, `Navigation` 관련 사유가 나오면 아래 순서로 대응합니다.

1. 짧은 글부터 본문을 450~800단어 수준으로 보강합니다.
2. 각 글 상단에 핵심 정리와 목차를 추가합니다.
3. 글 하단에 관련 글 3~4개와 검수 기준 링크를 넣습니다.
4. Search Console에서 해당 URL 색인 요청을 다시 진행합니다.
5. AdSense에서 수정 완료 후 재검토를 요청합니다.
