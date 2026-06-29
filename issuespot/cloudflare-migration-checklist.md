# Cloudflare Pages 이전 점검 기록

점검일: 2026-06-10
도메인: issuespot.co.kr

## 확인 결과

- `https://issuespot.co.kr/`는 200으로 정상 응답합니다.
- `https://www.issuespot.co.kr/`도 200으로 응답하지만 apex 도메인으로 301 이동하지 않습니다.
- 홈의 canonical은 `https://issuespot.co.kr/`로 들어가 있어 중복 신호는 완화되어 있습니다.
- 이미지 에셋(`/assets/hero-workspace.svg`, `/assets/og-issuespot.svg`, `/assets/favicon.svg`)은 200으로 정상 응답합니다.
- 운영 URL의 `sitemap.xml`과 `rss.xml`은 현재 로컬 최신본보다 오래된 배포본입니다.
- 최근 추가한 글 3개는 운영 URL에서 404를 반환합니다.
- `robots.txt`는 Cloudflare Managed Content가 앞에 추가되어 있으나, 검색 허용과 Sitemap 줄은 포함되어 있습니다.
- 기본 보안 헤더는 응답 중이며, 로컬 최신본에는 HSTS, frame 차단, 권한 제한 헤더를 추가했습니다.

## 판단

도메인 연결 자체는 복구되었지만, 현재 운영 사이트는 최신 로컬 배포본과 일치하지 않습니다. AdSense 심사 전에는 `cloudflare-pages-site.zip` 또는 최신 저장소 내용을 다시 배포해 sitemap, RSS, 신규 글, 보안 헤더, redirect 규칙이 실제 URL에 반영되도록 해야 합니다.

가장 큰 남은 이슈는 `www`가 apex로 301 이동하지 않는 점입니다. `_redirects`에 명시 규칙을 추가했지만, 실제 반영 여부는 Cloudflare Pages 최신 배포 후 다시 확인해야 합니다. 만약 배포 후에도 200으로 유지되면 Cloudflare Redirect Rules에서 `www.issuespot.co.kr/*`를 `https://issuespot.co.kr/$1`로 301 이동시키는 규칙을 추가합니다.

## Cloudflare 대시보드에서 실행할 작업

1. Cloudflare 대시보드에서 Workers & Pages로 이동합니다.
2. 이슈스팟 Pages 프로젝트를 선택합니다.
3. 최신 `cloudflare-pages-site.zip` 또는 저장소 최신 커밋을 다시 배포합니다.
4. 배포 후 아래 URL이 200 또는 301로 정상 응답하는지 확인합니다.
   - https://issuespot.co.kr/
   - https://issuespot.co.kr/robots.txt
   - https://issuespot.co.kr/sitemap.xml
   - https://issuespot.co.kr/rss.xml
   - https://issuespot.co.kr/articles/simplified-underwriting-claim-check.html
   - https://www.issuespot.co.kr/
5. `www`가 계속 200이면 Cloudflare Redirect Rules에서 `www` 전체를 apex로 301 이동시킵니다.

## 완료 기준

- 홈이 200 응답
- `www`가 `https://issuespot.co.kr/`로 301 이동
- `/robots.txt`가 저장소의 Sitemap 항목을 포함
- `/sitemap.xml`과 `/rss.xml`에 최신 글이 반영됨
- 신규 글 URL이 200으로 열림
- 보안 헤더가 운영 URL에서 확인됨
- AdSense 사이트 검토 요청 전에 522가 완전히 사라짐

## 2026-06-11 처리 결과

- Wrangler로 Cloudflare Pages 프로젝트 `issuespot`을 재배포했습니다.
- `www.issuespot.co.kr` 요청이 `_redirects`만으로는 apex 도메인으로 이동하지 않아 Pages Worker를 추가했습니다.
- `_worker.js`에서 `www.issuespot.co.kr` 요청을 `https://issuespot.co.kr/`로 301 이동시키고, 나머지 요청은 기존 정적 에셋으로 전달합니다.
- 최종 배포 URL: `https://0ae9ee0f.issuespot.pages.dev`
- 확인 결과:
  - `https://issuespot.co.kr/` 200 응답
  - `https://www.issuespot.co.kr/` 301 응답, `https://issuespot.co.kr/`로 이동
  - `https://www.issuespot.co.kr/articles/simplified-underwriting-claim-check` 301 응답, apex URL로 이동
  - `https://issuespot.co.kr/articles/simplified-underwriting-claim-check.html` 308 후 200 응답
  - `sitemap.xml`과 `rss.xml`에 최신 글 3개가 반영됨
  - HSTS, frame 차단, nosniff, referrer policy, permissions policy 헤더가 운영 홈에서 확인됨

## 2026-06-12 처리 결과

- Cloudflare Pages production Secret `PUBLIC_DATA_SERVICE_KEY`를 등록했습니다.
- `cloudflare-pages-site` 폴더를 다시 배포했습니다.
- 최종 배포 URL: `https://15575839.issuespot.pages.dev`
- 확인 결과:
  - `https://issuespot.co.kr/api/public-data/silson-insurance?likeCmpyNm=삼성&numOfRows=1` 정상 JSON 응답
  - `https://issuespot.co.kr/api/public-data/auto-victim?basYm=202406&numOfRows=1`은 공공데이터포털 upstream 권한 문제로 503 안내 JSON 응답
  - 자동차보험 통계 API의 401/403 응답은 사용자 화면에서 `Forbidden` 한 단어가 아니라 활용신청 또는 운영 권한 확인 안내로 표시되도록 Worker를 수정했습니다.
- 최신 배포 압축본:
  - `cloudflare-pages-site.zip`
  - `issuespot-cloudflare-pages-20260612.zip`

## 2026-06-12 추가 처리 결과

- PDF `범용 지침.pdf`의 정적 사이트/SEO/애드센스 지침을 확인했습니다.
- 공공데이터 API 조회 스크립트의 한글 안내 문구가 일부 클라이언트에서 깨져 보일 수 있어 JS 문자열을 Unicode escape 형태로 변경했습니다.
- 공공데이터 API 글 2개의 스크립트 쿼리 버전을 `v=20260612`로 올려 Cloudflare 캐시 갱신 경로를 확보했습니다.
- `cloudflare-pages-site` 폴더를 다시 배포했습니다.
- 최종 배포 URL: `https://f915776a.issuespot.pages.dev`
- 확인 결과:
  - `https://issuespot.co.kr/articles/public-data-silson-insurance-api` 200 응답 및 `public-data-api.js?v=20260612` 반영
  - `https://issuespot.co.kr/assets/public-data-api.js?v=20260612` 200 응답 및 Unicode escape 문자열 반영
  - `https://issuespot.co.kr/api/public-data/silson-insurance?likeCmpyNm=삼성&numOfRows=1` 정상 JSON 응답
  - `https://www.issuespot.co.kr/articles/public-data-silson-insurance-api` 301 응답, apex URL로 이동

## 2026-06-15 처리 결과

- 신규 글 `articles/insurance-claim-personal-info-check.html`이 루트와 `cloudflare-pages-site` 배포 폴더에 모두 반영되어 있음을 확인했습니다.
- 홈, 글 목록, `sitemap.xml`, `rss.xml`에서 신규 글 링크가 노출되는 것을 확인했습니다.
- 최신 배포 압축본 `cloudflare-pages-site.zip`과 `issuespot-cloudflare-pages-20260615.zip`에 신규 글, 홈, RSS, sitemap 파일이 포함되어 있음을 확인했습니다.
- 운영 URL 확인 결과:
  - `https://issuespot.co.kr/articles/insurance-claim-personal-info-check` 200 응답
  - `https://www.issuespot.co.kr/articles/insurance-claim-personal-info-check` 301 응답, apex URL로 이동
  - `https://issuespot.co.kr/sitemap.xml`에 신규 글 URL 포함
  - `https://issuespot.co.kr/rss.xml`에 신규 글 항목 포함
  - 운영 글 HTML에서 canonical, 제목, `datePublished` 값 확인

## 2026-06-15 색인 제외 항목 정리

- Google Search Console의 색인 제외 항목을 줄이기 위해 `/404`, `/404.html`, `/deploy-version.txt`, `/adsense-setup.md`, `/cloudflare-migration-checklist.md`, `/ads.txt.template` 요청을 Worker에서 명확히 404로 응답하도록 수정했습니다.
- Google Search Console HTML 인증 파일 `googlefa76c3e8fcf3b216.html`은 리디렉션 없이 200으로 응답하도록 Worker 예외를 유지했습니다.
- `cloudflare-pages-site`를 재배포했습니다.
- 최종 배포 URL: `https://cd039449.issuespot.pages.dev`
- 확인 결과:
  - `https://issuespot.co.kr/404` 404 응답
  - `https://issuespot.co.kr/404.html` 404 응답
  - `https://issuespot.co.kr/deploy-version.txt` 404 응답
  - `https://issuespot.co.kr/` 200 응답
  - `https://issuespot.co.kr/sitemap.xml` 200 응답
- `https://issuespot.co.kr/articles/insurance-claim-personal-info-check` 200 응답
- sitemap에 포함된 58개 URL은 모두 리디렉션 없이 200 응답

## 2026-06-16 누락 URL 리디렉션 처리

- `/medical-certificate-vs-visit-confirmation/` 요청이 404로 표시되는 문제를 확인했습니다.
- 해당 예전 slug를 현재 통원 청구 서류 글인 `/articles/outpatient-claim-documents`로 301 이동하도록 `_worker.js`와 `_redirects`에 규칙을 추가했습니다.
- `cloudflare-pages-site` 배포 폴더와 최신 압축본 `cloudflare-pages-site.zip`, `issuespot-cloudflare-pages-20260616.zip`을 갱신했습니다.
- Wrangler로 Cloudflare Pages 프로젝트 `issuespot`을 재배포했습니다.
- 최종 배포 URL: `https://5910c6c5.issuespot.pages.dev`
- 운영 URL 확인 결과:
  - `https://issuespot.co.kr/medical-certificate-vs-visit-confirmation/` 301 응답
  - 이동 위치: `https://issuespot.co.kr/articles/outpatient-claim-documents`
  - `https://issuespot.co.kr/articles/outpatient-claim-documents` 200 응답

## 2026-06-17 www 옛 URL 리디렉션 단축

- `www.issuespot.co.kr`의 옛 URL 요청이 `www -> apex 옛 URL -> 현재 글`로 두 번 이동하지 않도록 Worker 리디렉션 순서를 정리했습니다.
- `_worker.js`에서 호스트 정규화와 legacy slug 매핑을 모두 적용한 뒤 한 번만 301 응답하도록 수정했습니다.
- 루트 `_worker.js`와 `cloudflare-pages-site/_worker.js`를 동일하게 유지했습니다.
- 최신 압축본 `cloudflare-pages-site.zip`, `issuespot-cloudflare-pages-20260617.zip`을 갱신했습니다.
- Wrangler로 Cloudflare Pages 프로젝트 `issuespot`에 재배포했습니다.
- 최종 배포 URL: `https://fc6437a6.issuespot.pages.dev`
- 운영 URL 확인 결과:
  - `https://issuespot.co.kr/medical-certificate-vs-visit-confirmation/` 301 응답
  - `https://issuespot.co.kr/medical-certificate-vs-visit-confirmation` 301 응답
  - `https://www.issuespot.co.kr/medical-certificate-vs-visit-confirmation/` 301 응답, 이동 위치 `https://issuespot.co.kr/articles/outpatient-claim-documents`
  - `https://issuespot.co.kr/articles/outpatient-claim-documents` 200 응답
  - `https://issuespot.co.kr/sitemap.xml` 200 응답
  - `https://issuespot.co.kr/rss.xml` 200 응답
  - `https://issuespot.co.kr/404`, `https://issuespot.co.kr/deploy-version.txt`는 404 및 `x-robots-tag: noindex, nofollow` 응답
  - `https://issuespot.co.kr/googlefa76c3e8fcf3b216.html` 200 응답

## 2026-06-17 정보성 글 추가

- AIA생명 보험금 청구 서류 안내를 참고하되, 원문을 복제하지 않고 항목별 청구 서류를 분류하는 독립 정보성 글을 추가했습니다.
- 신규 글: `https://issuespot.co.kr/articles/claim-document-type-checklist`
- 홈, 업무 노트 목록, 청구 서류 주제 페이지, sitemap, RSS에 신규 글을 반영했습니다.
- 최신 압축본 `cloudflare-pages-site.zip`, `issuespot-cloudflare-pages-20260617.zip`을 갱신했습니다.
- Wrangler로 Cloudflare Pages 프로젝트 `issuespot`에 재배포했습니다.
- 최종 배포 URL: `https://b3be2dbb.issuespot.pages.dev`

## 2026-06-18 AdSense review hardening deploy

- 홈, 글 목록, 개별 글 하단에 애드센스 심사 대비 신뢰 신호를 보강했습니다.
- 출처/검수 기준 박스가 없던 글 13개에 안내 박스를 추가했습니다.
- Search Console의 404 누적을 줄이기 위해 문서성/레거시 URL을 404 대신 관련 공개 페이지로 301 이동하도록 `_redirects`와 `_worker.js`를 갱신했습니다.
- Worker의 공개 오류 메시지 중 깨진 한글을 정상 문장으로 복구했습니다.
- 최신 압축본 `cloudflare-pages-site.zip`, `issuespot-cloudflare-pages-20260618.zip`을 갱신했습니다.
- Wrangler로 Cloudflare Pages 프로젝트 `issuespot`에 재배포했습니다.
- 최종 배포 URL: `https://dacaef11.issuespot.pages.dev`
- 배포 후 확인:
  - `https://issuespot.co.kr/` 200 응답
  - `https://issuespot.co.kr/sitemap.xml` 200 응답
  - `https://issuespot.co.kr/rss.xml` 200 응답
  - `https://issuespot.co.kr/deploy-version.txt` 301 응답 후 `/articles/` 200 응답
  - `https://issuespot.co.kr/adsense-setup.md` 301 응답 후 `/claim-guide` 200 응답
  - `https://issuespot.co.kr/ads.txt.template` 301 응답 후 `/ads.txt` 200 응답
  - `https://issuespot.co.kr/404.html` 301 응답 후 `/articles/` 200 응답
  - `https://www.issuespot.co.kr/adsense-setup.md` 301 응답 후 apex `/claim-guide` 200 응답
- 운영 URL 확인 결과:
  - 신규 글 200 응답
  - `/articles/`, `/topics/claim-documents`, `/sitemap.xml`, `/rss.xml` 200 응답
  - sitemap과 RSS에서 신규 글 URL 확인

## 2026-06-18 AdSense policy and FAQ hardening deploy

- `claim-guide.html`에 청구 전 자주 묻는 질문 섹션과 `FAQPage` 구조화 데이터를 추가했습니다.
- `claim-guide.html` 하단에 출처와 확인 기준 박스를 추가해 공식 안내 확인 필요성을 명확히 했습니다.
- `advertising-policy.html`에 광고 배치 기준, 광고 수익 사용, 개인정보와 광고 분리 기준을 보강했습니다.
- `editorial-policy.html`에 저작권과 출처 표시 원칙을 추가했습니다.
- `sitemap.xml`에서 `claim-guide`, `advertising-policy`, `editorial-policy`의 `lastmod`를 `2026-06-18`로 갱신했습니다.
- 최신 압축본 `cloudflare-pages-site.zip`, `issuespot-cloudflare-pages-20260618.zip`을 갱신했습니다.
- Wrangler로 Cloudflare Pages 프로젝트 `issuespot`에 재배포했습니다.
- 최종 배포 URL: `https://927cba3b.issuespot.pages.dev`
- 배포 후 확인:
  - `https://issuespot.co.kr/claim-guide` 200 응답 및 FAQ/출처 박스 반영
  - `https://issuespot.co.kr/advertising-policy` 200 응답 및 광고 수익/개인정보 안내 반영
  - `https://issuespot.co.kr/editorial-policy` 200 응답
  - `https://issuespot.co.kr/sitemap.xml` 200 응답

## 2026-06-22 Content expansion package

- Added `articles/fire-property-insurance-compare-check.html`.
- The new article references the Insurance Damoa fire/property insurance comparison page only as source context and rewrites the material as IssueSpot's own checking guide.
- Added `articles/lotteins-claim-document-check.html`.
- The Lotte Insurance article references the official Lotte Insurance required-document and submission-channel page as source context and rewrites it as a checklist for claim type, submission method, original/copy threshold, and supporting documents.
- Added the new article to the home page, article index, `sitemap.xml`, and `rss.xml`.
- Strengthened `articles/claim-document-type-checklist.html` with a company-specific submission channel and amount-threshold section.
- Strengthened `articles/insurance-terms-how-to-read.html` with a comparison-site summary verification section.
- Strengthened `articles/daily-claim-resource-check.html` with a note about recording original comparison conditions.
- Mirrored changed files into `cloudflare-pages-site`.
- Rebuilt `cloudflare-pages-site.zip` and `issuespot-cloudflare-pages-20260622.zip`.
- Deployed Cloudflare Pages project `issuespot`.
- Latest deployment URL: `https://9ec09f99.issuespot.pages.dev`.
- Local verification:
  - JSON-LD parsed successfully for changed HTML files.
  - `sitemap.xml` and `rss.xml` include the new article.
  - Internal HTML link check found no missing local links.
- Live verification:
  - `https://issuespot.co.kr/articles/fire-property-insurance-compare-check` returns 200.
  - `https://issuespot.co.kr/articles/lotteins-claim-document-check` returns 200.
  - `https://issuespot.co.kr/articles/`, `sitemap.xml`, and `rss.xml` return 200.
  - The live articles, sitemap, and RSS include `fire-property-insurance-compare-check` and `lotteins-claim-document-check`.

## 2026-06-22 Post-check

- Confirmed root files and `cloudflare-pages-site` files match for:
  - `index.html`
  - `sitemap.xml`
  - `rss.xml`
  - `articles/claim-document-type-checklist.html`
- Rebuilt a temporary zip from `cloudflare-pages-site` and confirmed it matches both packaged files:
  - `cloudflare-pages-site.zip`
  - `issuespot-cloudflare-pages-20260622.zip`
- Live HTTP verification:
  - `https://issuespot.co.kr/` returns 200.
  - `https://www.issuespot.co.kr/` returns 301 to `https://issuespot.co.kr/`.
  - `https://issuespot.co.kr/sitemap.xml` returns 200.
  - `https://issuespot.co.kr/rss.xml` returns 200.
  - `https://issuespot.co.kr/articles/claim-document-type-checklist` returns 200.
  - `https://issuespot.co.kr/articles/lotteins-claim-document-check` returns 200.
  - `https://issuespot.co.kr/articles/fire-property-insurance-compare-check` returns 200.
  - `https://issuespot.co.kr/articles/daily-claim-resource-check` returns 200.
  - `https://issuespot.co.kr/articles/insurance-terms-how-to-read` returns 200.

## 2026-06-22 Cancer insurance article restructure

- Reviewed `https://www.cancerok.com/` and related mobile pages for cancer insurance, 3-diagnosis coverage, simplified underwriting, medical expense insurance, and claim-document categories.
- Expanded `articles/cancer-diagnosis-claim-check.html` without copying product listings or sales wording.
- Reorganized the external information into IssueSpot-style checks:
  - product category versus claim category
  - renewal/non-renewal and coverage period checks
  - simplified underwriting and prior medical history checks
  - inpatient, outpatient, diagnosis benefit document separation
  - 3-diagnosis coverage scope questions
- Updated `dateModified`, `sitemap.xml`, and the RSS item description.
- Mirrored changed files into `cloudflare-pages-site`.
- Rebuilt `cloudflare-pages-site.zip` and `issuespot-cloudflare-pages-20260622.zip`.
- Local verification:
  - Root and deployment-folder hashes match for changed article, sitemap, and RSS.
  - Rebuilt zip files match each other.
  - JSON-LD parsed successfully for the changed article.
