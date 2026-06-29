# AdSense 승인 실행 메모

## 지금 완료한 준비

- 개인정보처리방침에 제3자 광고 서비스와 쿠키 고지를 추가했습니다.
- 쿠키 및 광고 안내 페이지를 추가했습니다.
- 광고 및 제휴 고지 페이지를 추가했습니다.
- 모든 HTML 하단 메뉴에서 정책 문서로 이동할 수 있게 연결했습니다.
- 사이트맵에 새 정책 페이지를 추가했습니다.
- `ads.txt.template`를 준비했습니다.

## 발행자 ID를 받은 뒤 실행할 작업

1. Google AdSense에서 발행자 ID를 확인합니다.
   - 형식: `pub-0000000000000000`
2. `ads.txt.template`를 복사해 `ads.txt`를 만들고 아래 형식으로 교체합니다.
   - `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0`
3. AdSense에서 제공하는 사이트 연결 스크립트를 모든 HTML의 `</head>` 앞에 삽입합니다.
4. Cloudflare Pages에 다시 배포합니다.
5. 아래 URL이 열리는지 확인합니다.
   - `https://issuespot.co.kr/ads.txt`
   - `https://issuespot.co.kr/privacy.html`
   - `https://issuespot.co.kr/cookie-policy.html`
   - `https://issuespot.co.kr/advertising-policy.html`
6. AdSense Sites 메뉴에서 사이트 검토를 요청합니다.

## 주의

임의의 `pub-` 값을 넣은 `ads.txt`는 만들지 않습니다. Google 공식 안내상 `ads.txt`는 필수는 아니지만 강력히 권장되며, 잘못된 발행자 ID가 있으면 승인과 수익화 상태를 방해할 수 있습니다.
