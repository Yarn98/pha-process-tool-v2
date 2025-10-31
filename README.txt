PHA Optimizer – CA1180P Bundle (v2) — 2025-08-16T06:42:12

구성:
- index.html : CA1180P 자동 매핑/권장범위 로더 포함
- data/grades/CA1180P_talc10_wax0p3.json : 사출 가이드 JSON
- manifest.webmanifest / icons/* : PWA 자산
- sw.js : 간단한 프리캐시 서비스워커 (캐시키: pha-cache-v2)

Netlify 드롭인 배포:
1) 이 폴더 전체를 ZIP으로 압축 → Netlify Sites → Deploys → Upload deploy
2) 배포 후 iPhone에서 캐시 문제 시 주소에 ?v=숫자 를 붙이거나 Safari 웹사이트데이터 삭제

테스트 URL (배포 후 확인):
- /data/grades/CA1180P_talc10_wax0p3.json  (200 OK)
