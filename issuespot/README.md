# 이슈스팟

보험금 청구 서류, 실손보험 청구, 보험 관계 자료, 공공데이터 참고 자료를 정리하는 정적 정보 사이트입니다.

## 배포 구조

```text
local workspace
  -> git push origin main
  -> GitHub main branch
  -> Cloudflare Pages
  -> npm run build
  -> dist/
  -> Cloudflare edge deployment
```

Cloudflare Pages 설정값:

```text
Production branch: main
Framework preset: None / Static HTML
Build command: npm run build
Build output directory: dist
Root directory: /
```

## 주요 명령

```bash
npm install
npm run build
npm run images:crawl:free
```

- `npm run build`: Cloudflare Pages 배포용 `dist/` 폴더를 생성합니다.
- `npm run pages:deploy`: `dist/`를 `issuespot` Pages 프로젝트로 직접 배포합니다.
- `npm run images:crawl:free`: R2 업로드 없이 이미지를 로컬에서 WebP로 변환합니다.
- `npm run images:crawl`: R2 credentials가 있을 때 WebP 변환 후 Cloudflare R2로 업로드합니다.

특정 페이지 URL 하나만 크롤링하려면:

```bash
npm run images:crawl:free -- https://example.com/page-a
```

R2 업로드까지 실행하려면:

```bash
npm run images:crawl -- https://example.com/page-a
```

## 디렉토리 구조

```text
.
|-- index.html
|-- articles/
|-- assets/
|-- topics/
|-- scripts/
|   |-- build-pages.mjs
|   `-- crawl-images.mjs
|-- cloudflare-pages-r2-guide.md
|-- image-r2-pipeline.md
|-- package.json
`-- README.md
```

Git에 올리지 않는 항목:

```text
.env.local
image-sources.txt
.cache/
dist/
node_modules/
```

## 이미지 자동화

`scripts/crawl-images.mjs`는 지정한 HTML 페이지에서 이미지 URL을 수집하고, 이미지를 다운로드한 뒤 `sharp`로 WebP 변환을 수행합니다. 기본 품질은 `80`이며, R2 모드에서는 `@aws-sdk/client-s3`를 사용해 변환된 WebP 이미지를 Cloudflare R2 bucket에 업로드합니다.

자세한 설정과 운영 순서는 [cloudflare-pages-r2-guide.md](./cloudflare-pages-r2-guide.md)를 확인하세요.
