# GitHub + Cloudflare Pages 배포 가이드

이 사이트는 별도 어드민 없이 로컬에서 HTML, CSS, 데이터, 스크립트를 수정하고 GitHub `main` 브랜치에 push하면 Cloudflare Pages가 자동 배포하는 초경량 정적 사이트 구조입니다.

## 1. 로컬 작업 순서

```bash
npm install
npm run build
npm run preview
```

로컬 확인 주소:

```text
http://127.0.0.1:4173/
```

`npm run build`는 `scripts/build-sitemap.mjs`를 실행해 `sitemap.xml`과 `robots.txt`를 다시 생성합니다. 새 글을 추가한 뒤에는 배포 전 반드시 실행합니다.

## 2. GitHub 저장소 연결

```bash
git add .
git commit -m "Update static site"
git push origin main
```

GitHub Actions의 `Static site check` 워크플로우는 `main` push와 PR에서 다음을 확인합니다.

- Node 20 환경에서 의존성 설치
- `npm run build` 실행
- `sitemap.xml`, `robots.txt` 생성 여부 확인

## 3. Cloudflare Pages 설정

Cloudflare Dashboard에서 Pages 프로젝트를 만들고 GitHub 저장소를 연결합니다.

- Production branch: `main`
- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `/`
- Root directory: 비워 둠
- Environment variable: `SITE_URL=https://town114.com`

Cloudflare Pages는 `main` 브랜치 push를 감지해 자동 빌드 후 전 세계 엣지 서버에 배포합니다.

## 4. 커스텀 도메인

Cloudflare Pages 프로젝트의 Custom domains에서 아래 도메인을 연결합니다.

- `town114.com`
- `www.town114.com`

`_redirects` 파일은 `www.town114.com` 접속을 `town114.com`으로 301 리디렉션합니다.

## 5. 검색엔진 제출

배포 후 아래 URL을 제출합니다.

- Google Search Console: `https://town114.com/sitemap.xml`
- Naver Search Advisor: `https://town114.com/sitemap.xml`
- robots: `https://town114.com/robots.txt`
- RSS: `https://town114.com/feed.xml`

## 6. Cloudflare R2 이미지 자동화

로컬 또는 GitHub Actions에서 특정 페이지 이미지를 크롤링해 WebP 변환 후 R2에 업로드할 수 있습니다.

```bash
npm run images:r2:dry-run -- --url=https://town114.com/
npm run images:r2 -- --url=https://town114.com/ --limit=30
```

필수 환경값:

- `CLOUDFLARE_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

기본 변환 기준:

- WebP
- quality 80
- 최대 너비 1600px
- 업로드 Cache-Control: `public, max-age=31536000, immutable`

GitHub 수동 실행은 `.github/workflows/r2-images.yml`에서 `workflow_dispatch`로 실행합니다.
