# Image Crawl to R2 Pipeline

This is an operations script for collecting image URLs from HTML pages, converting them to WebP, and optionally uploading them to Cloudflare R2 through the S3-compatible API.

Free-first recommendation: use local-only conversion first and keep R2 disabled until the site needs remote image storage.

## Setup

1. Copy `.env.example` to `.env.local`.
2. For free-first mode, leave R2 credentials blank.
3. Install dependencies:

```bash
npm install
```

4. Add source pages. You can use either `IMAGE_SOURCE_URLS` in `.env.local` or a plain text file:

```bash
copy image-sources.example.txt image-sources.txt
```

You can also pass a specific page URL directly:

```bash
npm run images:crawl:free -- https://example.com/page-a
```

5. Run a dry pass first. This crawls, converts to WebP, and writes local manifests without uploading:

```bash
npm run images:crawl:dry
```

6. Optional paid-capable step: upload to R2 only after you intentionally enable R2 and add credentials:

```bash
npm run images:crawl
```

## Environment

- `R2_ACCOUNT_ID`: Cloudflare account ID.
- `R2_ACCESS_KEY_ID`: R2 access key ID.
- `R2_SECRET_ACCESS_KEY`: R2 secret access key.
- `R2_BUCKET`: Target R2 bucket.
- `R2_PUBLIC_BASE_URL`: Optional public custom domain or bucket URL for manifest output.
- `IMAGE_SOURCE_URLS`: Comma-separated page URLs to crawl.
- `IMAGE_SOURCE_FILE`: Optional newline-separated URL file, defaults to `image-sources.txt`.
- `IMAGE_R2_PREFIX`: Object key prefix, defaults to `images/crawled`.
- `IMAGE_OUTPUT_DIR`: Local output and manifest folder, defaults to `.cache/images`.
- `IMAGE_MAX_WIDTH`: Maximum WebP width, defaults to `1200` in the free-first example.
- `IMAGE_WEBP_QUALITY`: WebP quality, defaults to `80`.
- `IMAGE_CONCURRENCY`: Parallel page/image processing count, defaults to `2` in the free-first example.
- `IMAGE_MAX_IMAGES`: Optional cap for testing. The free-first example uses `20`; `0` means unlimited.
- `IMAGE_FETCH_TIMEOUT_MS`: Fetch timeout for pages and images, defaults to `20000`.
- `IMAGE_USER_AGENT`: Request user agent.

## Commands

```bash
npm run images:crawl:dry
npm run images:crawl:free
npm run images:crawl:local
npm run images:crawl
npm run images:crawl:free -- https://example.com/page-a
node scripts/crawl-images.mjs --help
```

- `images:crawl:dry`: No R2 credentials required. Converts locally and writes manifests.
- `images:crawl:free`: Same as local-only mode; recommended default while avoiding R2 costs.
- `images:crawl:local`: Same as dry mode, but named for local-only conversion workflows.
- `images:crawl`: Requires R2 credentials and uploads converted WebP files.
- `npm run images:crawl:free -- <URL>`: Crawls one specific page URL directly.
- `--help`: Prints the available modes and required environment variables.

## Cloudflare R2 credential checklist

After logging in to Cloudflare:

1. Create an R2 bucket.
2. Create an R2 API token with object read/write permission for that bucket.
3. Copy these values into `.env.local`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
4. If the bucket has a public custom domain, set `R2_PUBLIC_BASE_URL` so manifest URLs are generated.

## Notes

- Use this only on pages where crawling and reusing images is allowed.
- Keep real source URL lists in `image-sources.txt`; it is ignored by git.
- The script writes `.cache/images/manifest.json` and `.cache/images/manifest.csv` with original URLs, R2 keys, optional public URLs, and local file paths.
- R2 upload uses `Content-Type: image/webp` and long-lived immutable cache headers.
