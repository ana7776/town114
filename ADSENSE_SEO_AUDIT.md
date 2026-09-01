# AdSense SEO Audit

점검일: 2026-06-26 · 보강: 2026-09-01

승인 기준 판단, 대표 글 선정, 거절 대응 순서는 `ADSENSE_APPROVAL_GUIDE.md`에서 관리합니다.
이 문서는 사이트 구조와 필수 파일의 충족 현황만 다룹니다.

## 결론

TOWN114는 별도 어드민 없이 운영 가능한 정적 사이트 구조이며, Google AdSense 승인 전 기본 요건인 독자 콘텐츠, 필수 정책 페이지, 검색엔진 접근성, 명확한 사이트 구조를 갖추고 있습니다. 이번 보강으로 sitemap/robots 자동 생성, Cloudflare Pages 배포 가이드, R2 이미지 최적화 자동화 기준도 명확해졌습니다.

## 요구사항별 확인

| 항목 | 상태 | 적용 위치 |
| --- | --- | --- |
| 초경량 정적 사이트 | 충족 | HTML/CSS/JS 정적 파일 구조 |
| 별도 어드민 없음 | 충족 | 로컬 수정 후 GitHub push 방식 |
| SEO 시맨틱 구조 | 충족 | 전체 `index.html` 페이지 H1 1개 확인 |
| 제목 기반 URL | 충족 | `/articles/local-life-checklist/`, `/news/local-official-source-check/` |
| Footer 필수 링크 | 충족 | 개인정보처리방침, 문의, 약관, 출처, 광고 고지 |
| robots.txt | 충족 | `robots.txt`, `scripts/build-sitemap.mjs` |
| sitemap.xml | 충족 | `sitemap.xml`, `npm run build` 자동 생성 |
| RSS | 충족 | `feed.xml` |
| 애드센스 계정 메타 | 충족 | `meta name="google-adsense-account"` |
| ads.txt | 충족 | `ads.txt` |
| 개인정보처리방침 | 충족 | `/privacy/` |
| 문의 페이지 | 충족 | `/contact/` |
| 자료 출처 페이지 | 충족 | `/sources/` |
| 광고/제휴 고지 | 충족 | `/advertising-disclosure/` |
| 이미지 WebP/R2 자동화 | 충족 | `scripts/crawl-images-to-r2.mjs` |
| Cloudflare Pages 가이드 | 충족 | `DEPLOYMENT_GUIDE.md` |

## 승인 전 운영 원칙

애드센스 승인 전에는 빈 카테고리를 만들지 않습니다. 새 카테고리를 추가해야 할 때는 아래 중 하나를 만족한 뒤 메뉴에 노출합니다.

- 해당 카테고리에 직접 작성한 본문 글 3개 이상
- 카테고리 허브 본문 800자 이상
- 관련 출처, 기준일, 방문 전 체크리스트 포함
- 내부링크 3개 이상

자료가 부족한 주제는 독립 카테고리로 만들지 말고 기존 허브에 포함합니다.

## 본문 품질 기준

각 글은 아래 요소를 포함해야 합니다.

- H1 1개
- H2 3개 이상
- 검색자가 실제로 확인할 질문 또는 체크리스트
- 공식 출처 또는 출처 확인 방법
- 관련 내부링크
- 작성일 또는 업데이트일

단순 장소 나열, 자동 문장 반복, 광고 클릭 유도 문구는 사용하지 않습니다.

## 배포 전 체크

```bash
npm run build
npm run seo:audit
npm run approval:audit
npm run preview
```

확인 항목:

- 홈 첫 화면이 모바일에서 가로 스크롤 없이 보이는지
- 새 글이 `sitemap.xml`에 포함되는지
- `robots.txt`가 `https://town114.com/sitemap.xml`을 가리키는지
- Footer에 `privacy`, `contact`, `sources`, `advertising-disclosure` 링크가 있는지
- 새 글 URL이 숫자가 아니라 제목 기반 슬러그인지

## 이미지 자동화 기준

`scripts/crawl-images-to-r2.mjs`는 다음 기준을 따릅니다.

- `--url=https://example.com/page` 또는 `IMAGE_CRAWL_SOURCES`로 크롤링 대상 지정
- `img`, `source srcset`, `og:image` 추출
- `sharp`로 WebP 변환
- 기본 품질 80
- 최대 너비 1600px
- `@aws-sdk/client-s3`로 Cloudflare R2 업로드
- 결과를 `data/r2-image-manifest.json`에 저장
