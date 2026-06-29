export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let shouldRedirect = false;

    if (url.hostname === "www.issuespot.co.kr") {
      url.hostname = "issuespot.co.kr";
      shouldRedirect = true;
    }

    const legacyRedirect = getLegacyRedirectPath(url.pathname);
    if (legacyRedirect) {
      url.pathname = legacyRedirect;
      shouldRedirect = true;
    }

    if (shouldRedirect) {
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/ads.txt") {
      return new Response(ADS_TXT, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=300",
        },
      });
    }

    if (isPrivateOrErrorPath(url.pathname)) {
      return new Response("Not found", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow",
        },
      });
    }

    if (url.pathname === "/googlefa76c3e8fcf3b216.html") {
      return new Response("google-site-verification: googlefa76c3e8fcf3b216.html", {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    if (url.pathname.startsWith("/api/public-data/")) {
      return fetchPublicData(request, env);
    }

    return fetchAsset(request, env);
  },
};

const ADS_TXT = "google.com, pub-5804969457082424, DIRECT, f08c47fec0942fa0\n";

function getLegacyRedirectPath(pathname) {
  const normalizedPath = pathname.replace(/\/$/, "");
  return {
    "/deploy-version.txt": "/articles/",
    "/adsense-setup.md": "/claim-guide",
    "/cloudflare-migration-checklist.md": "/claim-guide",
    "/search-console-fix-20260617.md": "/review-method",
    "/public-data-api-setup.md": "/articles/public-data-api-resource-list",
    "/local-secret-notes.md": "/articles/",
    "/ads.txt.template": "/ads.txt",
    "/404": "/articles/",
    "/404.html": "/articles/",
    "/medical-certificate-vs-visit-confirmation": "/articles/outpatient-claim-documents",
    "/articles/cloudflare-pages-adsense.html": "/claim-guide",
    "/articles/adsense-approval-checklist.html": "/claim-guide",
    "/articles/naver-google-seo.html": "/articles/insurer-app-homepage-claim",
    "/topics/adsense.html": "/claim-guide",
    "/topics/cloudflare.html": "/claim-guide",
    "/topics/seo.html": "/articles/insurer-app-homepage-claim",
    "/articles/static-insurance-portal-seo.html": "/articles/insurer-app-homepage-claim",
    "/cloudflare-migration.html": "/claim-guide",
  }[normalizedPath];
}

function isPrivateOrErrorPath(pathname) {
  return [
    "/issuespot-cloudflare-pages-20260610.zip",
    "/issuespot-cloudflare-pages-20260611.zip",
    "/issuespot-cloudflare-pages-20260612.zip",
    "/issuespot-cloudflare-pages-20260615.zip",
    "/issuespot-cloudflare-pages-20260616.zip",
    "/issuespot-cloudflare-pages-20260617.zip",
    "/issuespot-cloudflare-pages-20260618.zip",
    "/cloudflare-pages-site.zip",
  ].includes(pathname);
}

async function fetchAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404) {
    return response;
  }

  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") {
    return response;
  }
  if (url.pathname === "/" || url.pathname.endsWith("/") || url.pathname.includes(".")) {
    return response;
  }

  url.pathname = `${url.pathname}.html`;
  const htmlRequest = new Request(url.toString(), request);
  const htmlResponse = await env.ASSETS.fetch(htmlRequest);
  return htmlResponse.status === 404 ? response : htmlResponse;
}

const PUBLIC_DATA_ENDPOINTS = {
  "silson-insurance": {
    url: "https://apis.data.go.kr/1160100/service/GetMedicalReimbursementInsuranceInfoService/getInsuranceInfo",
    params: [
      "pageNo",
      "numOfRows",
      "resultType",
      "basDt",
      "beginBasDt",
      "endBasDt",
      "likeBasDt",
      "cmpyCd",
      "cmpyNm",
      "likeCmpyNm",
      "ptrn",
      "mog",
      "prdNm",
      "likePrdNm",
      "age",
      "ofrInstNm",
    ],
  },
  "auto-victim": {
    url: "https://apis.data.go.kr/1160100/GetAutoInsVicInfoService/getAutoInsVicMonthInfo",
    params: [
      "pageNo",
      "numOfRows",
      "resultType",
      "basYm",
      "beginBasYm",
      "endBasYm",
      "likeBasYm",
      "dthInjClsfNm",
      "impYn",
      "injLvlcntCd",
      "impLvlcntCd",
    ],
  },
  "silson24-hospitals": {
    url: "https://apis.data.go.kr/B552772/silson24/recuperation-institutions",
    params: [
      "pageNo",
      "numOfRows",
      "startDateTime",
      "endDateTime",
    ],
  },
};

async function fetchPublicData(request, env) {
  if (request.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const serviceKey = env.PUBLIC_DATA_SERVICE_KEY;
  if (!serviceKey) {
    return jsonResponse(
      {
        error: "missing_service_key",
        message: "Cloudflare Pages 환경변수 PUBLIC_DATA_SERVICE_KEY를 설정한 뒤 다시 조회해 주세요.",
      },
      503,
    );
  }

  const requestUrl = new URL(request.url);
  const slug = requestUrl.pathname.replace("/api/public-data/", "").replace(/\/$/, "");
  const endpoint = PUBLIC_DATA_ENDPOINTS[slug];

  if (!endpoint) {
    return jsonResponse({ error: "unknown_dataset" }, 404);
  }

  const upstreamParams = new URLSearchParams();
  for (const name of endpoint.params) {
    const value = requestUrl.searchParams.get(name);
    if (value !== null && value !== "") {
      upstreamParams.set(name, value.slice(0, 80));
    }
  }

  if (!upstreamParams.has("pageNo")) upstreamParams.set("pageNo", "1");
  if (!upstreamParams.has("numOfRows")) upstreamParams.set("numOfRows", "5");
  if (!upstreamParams.has("resultType")) upstreamParams.set("resultType", "json");

  const key = String(serviceKey).includes("%")
    ? String(serviceKey)
    : encodeURIComponent(String(serviceKey));
  const upstreamUrl = `${endpoint.url}?${upstreamParams.toString()}&serviceKey=${key}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      Accept: "application/json, application/xml;q=0.8, text/plain;q=0.5",
    },
  });

  const contentType = upstreamResponse.headers.get("content-type") || "text/plain; charset=utf-8";
  const body = await upstreamResponse.text();

  if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
    return jsonResponse(
      {
        error: "public_data_permission_denied",
        message: "공공데이터포털에서 API 활용 신청 또는 운영 권한을 확인한 뒤 다시 조회해 주세요.",
      },
      503,
    );
  }

  return new Response(body, {
    status: upstreamResponse.status,
    headers: {
      "content-type": contentType,
      "cache-control": upstreamResponse.ok ? "public, max-age=1800" : "no-store",
      "access-control-allow-origin": "https://issuespot.co.kr",
    },
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
