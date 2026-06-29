# AdSense and SEO Readiness Check

점검일: 2026-06-25

## 현재 사이트 성격

이슈스팟은 보험금 청구 서류, 접수 방법, 보완 요청, 지급 지연, 보험사 자료 확인 기준을 정리하는 정적 정보 사이트입니다. 별도 어드민 없이 Cloudflare Pages에서 HTML, CSS, XML, Worker 파일로 운영하는 구조입니다.

## 승인 전 강점

- 홈, 주제 허브, 글 목록, 개별 글, 정책 문서가 모두 연결되어 있습니다.
- `about`, `contact`, `privacy`, `terms`, `cookie-policy`, `advertising-policy`, `editorial-policy`, `review-method` 페이지가 있습니다.
- `sitemap.xml`, `rss.xml`, `robots.txt`, `ads.txt`가 운영 도메인 루트에서 접근 가능합니다.
- 전체 개별 글에 canonical, description, JSON-LD, 단일 H1 구조가 대부분 적용되어 있습니다.
- 보험금 청구라는 하나의 주제 안에서 서류, 접수, 심사, 공식 자료 확인으로 콘텐츠 클러스터가 분리되어 있습니다.

## 보강한 내용

- 긴 중심축 콘텐츠 `insurance-claim-roadmap.html`을 추가했습니다.
- 처음 방문자가 따라갈 수 있는 서류 준비 → 접수 방법 → 개인정보 점검 → 접수 후 기록 → 보완 요청 → 공식 출처 확인 흐름을 만들었습니다.
- FAQ 구조화 데이터와 Article 구조화 데이터를 추가했습니다.
- 홈, 글 목록, 사이트맵, RSS, 전역 내비게이션에서 새 시작 가이드로 연결하도록 보강했습니다.

## 남은 개선 우선순위

1. 450단어 미만인 기존 짧은 글을 순차적으로 보강합니다.
2. 보험사별 자료 페이지는 공식 링크와 “확인 기준” 중심으로 유지하고, 번호나 팩스처럼 변동 가능한 정보는 단정하지 않습니다.
3. 광고 승인 전에는 광고 박스 과다 배치를 피하고 본문 읽기 흐름을 우선합니다.
4. Search Console에서 `sitemap.xml`을 다시 제출하고 주요 허브 URL 색인 요청을 진행합니다.
5. AdSense Sites 화면에서 `ads.txt` 업데이트 확인을 누릅니다.

## 공식 기준 대조

Google AdSense 문서 기준으로 ads.txt는 루트에서 접근 가능해야 하며, 변경 반영은 며칠에서 트래픽이 적은 사이트의 경우 최대 한 달까지 걸릴 수 있습니다. Google의 ads.txt 크롤링 체크리스트는 HTTP/HTTPS 접근, 200 상태 코드, robots.txt 허용, 올바른 형식, 루트 도메인 접근을 확인하라고 안내합니다. 현재 운영 도메인 기준으로 이 조건은 충족됩니다.
