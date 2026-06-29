# GitHub + Cloudflare Pages + R2 이미지 자동화 가이드

이 저장소는 로컬에서 수정한 정적 사이트 코드를 GitHub `main` 브랜치에 push하면 Cloudflare Pages가 자동으로 빌드하고 전 세계 Cloudflare edge에 배포하는 구성을 기준으로 합니다. 이미지 작업은 별도 Node.js 스크립트가 담당합니다.

## 전체 흐름

```text
로컬 작업
  -> git push origin main
  -> GitHub main branch
  -> Cloudflare Pages Git integration
  -> npm run build
  -> dist/ 배포
  -> Cloudflare global edge

이미지 소스 URL
  -> scripts/crawl-images.mjs
  -> HTML에서 이미지 URL 수집
  -> 이미지 다운로드
  -> sharp WebP 변환, quality 80
  -> 로컬 .cache/images 저장
  -> 선택적으로 Cloudflare R2 업로드
  -> manifest.json / manifest.csv에 최종 이미지 URL 기록
```

## 초기 디렉토리 구조

```text
.
|-- index.html
|-- 404.html
|-- _headers
|-- _redirects
|-- assets/
|-- articles/
|-- topics/
|-- scripts/
|   |-- build-pages.mjs
|   `-- crawl-images.mjs
|-- .env.example
|-- image-sources.example.txt
|-- image-r2-pipeline.md
|-- cloudflare-pages-r2-guide.md
|-- package.json
`-- package-lock.json
```

Git에 올리지 않는 파일과 폴더:

```text
.env.local
image-sources.txt
.cache/
dist/
node_modules/
```

## GitHub 연결

GitHub에 로그인된 상태라면 먼저 GitHub에서 새 저장소를 만들고, 로컬 저장소에 remote를 연결합니다.

```bash
git remote add origin https://github.com/<OWNER>/<REPO>.git
git branch -M main
git push -u origin main
```

이미 remote가 있다면 아래로 확인합니다.

```bash
git remote -v
```

## Cloudflare Pages 설정

Cloudflare dashboard에서 다음 순서로 연결합니다.

1. `Workers & Pages`로 이동
2. `Create application` 선택
3. `Pages` 선택
4. `Connect to Git` 선택
5. GitHub 저장소 선택
6. 빌드 설정 입력

권장 설정:

```text
Project name: issuespot 또는 원하는 프로젝트명
Production branch: main
Framework preset: None / Static HTML
Build command: npm run build
Build output directory: dist
Root directory: /
```

이후 `Save and Deploy`를 누르면 첫 배포가 실행됩니다. 이후부터는 로컬에서 아래 명령을 실행할 때마다 production 배포가 자동으로 갱신됩니다.

```bash
git add .
git commit -m "Update site"
git push origin main
```

## R2 준비

R2 업로드는 선택 사항입니다. 처음에는 `npm run images:crawl:free`로 로컬 WebP 변환만 사용하는 것을 권장합니다.

R2를 사용할 때 필요한 준비:

1. Cloudflare dashboard에서 R2 bucket 생성
2. R2 API token 또는 Access Key 생성
3. bucket에 object write 권한 부여
4. public URL이 필요하면 R2 custom domain 또는 public development URL 설정
5. `.env.example`을 `.env.local`로 복사하고 값 입력

```bash
copy .env.example .env.local
```

예시:

```env
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET=issuespot-images
R2_PUBLIC_BASE_URL=https://images.example.com

IMAGE_SOURCE_FILE=image-sources.txt
IMAGE_R2_PREFIX=images/crawled
IMAGE_OUTPUT_DIR=.cache/images
IMAGE_MAX_WIDTH=1200
IMAGE_WEBP_QUALITY=80
IMAGE_CONCURRENCY=2
IMAGE_MAX_IMAGES=20
IMAGE_FETCH_TIMEOUT_MS=20000
IMAGE_USER_AGENT=IssueSpotImageBot/0.1
```

R2는 S3 호환 API를 제공합니다. 이 저장소의 스크립트는 AWS SDK v3 `@aws-sdk/client-s3`의 `S3Client`와 `PutObjectCommand`를 사용하고, endpoint는 아래 형식입니다.

```text
https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```

## 이미지 URL 입력

방법 1: 특정 URL을 바로 실행합니다.

```bash
npm run images:crawl:free -- https://example.com/page-a
```

R2 업로드까지 실행하려면:

```bash
npm run images:crawl -- https://example.com/page-a
```

방법 2: 여러 URL을 파일로 관리합니다.

```bash
copy image-sources.example.txt image-sources.txt
```

`image-sources.txt`:

```text
https://example.com/page-a
https://example.com/page-b
```

실행:

```bash
npm run images:crawl:free
```

## 이미지 자동화 스크립트 기능

완성 코드는 `scripts/crawl-images.mjs`에 있습니다.

주요 동작:

- 지정한 HTML 페이지 URL을 fetch합니다.
- `img[src]`, `img[data-src]`, `source[srcset]`, `og:image`, `twitter:image`, inline CSS `url(...)`에서 이미지 후보를 수집합니다.
- 상대경로 이미지를 절대 URL로 정규화합니다.
- 이미지 응답만 다운로드합니다.
- `sharp`로 EXIF 회전을 보정하고 최대 너비를 제한합니다.
- WebP로 변환하며 기본 품질은 `80`입니다.
- 변환 파일을 `.cache/images/`에 저장합니다.
- R2 모드에서는 `PutObjectCommand`로 Cloudflare R2 bucket에 업로드합니다.
- 업로드 객체에는 `Content-Type: image/webp`와 장기 캐시 헤더를 설정합니다.
- 최종 결과는 `.cache/images/manifest.json`과 `.cache/images/manifest.csv`에 기록합니다.

manifest의 `publicUrl`이 최종 이미지 URL입니다. `R2_PUBLIC_BASE_URL`이 비어 있으면 public URL은 만들지 않고 R2 key와 로컬 경로만 기록합니다.

## 명령어

```bash
npm install
npm run build
npm run images:crawl:free
npm run images:crawl:dry
npm run images:crawl
node scripts/crawl-images.mjs --help
```

명령 설명:

- `npm run build`: Pages 배포용 `dist/`를 생성합니다.
- `npm run images:crawl:free`: R2 업로드 없이 로컬 WebP 변환만 실행합니다.
- `npm run images:crawl:dry`: `images:crawl:free`와 같은 local-only 모드입니다.
- `npm run images:crawl`: R2 credentials가 있을 때 WebP 변환 후 R2에 업로드합니다.

## 운영 체크리스트

- GitHub remote가 올바른 저장소를 가리키는지 확인합니다.
- Cloudflare Pages production branch가 `main`인지 확인합니다.
- Pages build command는 `npm run build`, output directory는 `dist`로 둡니다.
- `.env.local`은 절대 Git에 올리지 않습니다.
- `image-sources.txt`에는 크롤링과 이미지 사용 권한이 있는 URL만 넣습니다.
- R2 public URL을 운영에 쓸 경우 `R2_PUBLIC_BASE_URL`을 custom domain으로 설정합니다.

## 공식 문서

- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare R2 AWS SDK JS v3](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)
- [Cloudflare R2 S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
