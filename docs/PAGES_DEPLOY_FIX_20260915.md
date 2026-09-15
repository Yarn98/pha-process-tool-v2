# 플래시 보강본의 Cloudflare 배포 실패 수정 — 2026-09-15

사용자가 운영 사이트의 플래시 내용이 여전히 부실하다고 알려 실제 배포를 확인했습니다. 내용 보강은 `da7426c`에 커밋됐지만 Cloudflare 업로드가 실패했고, 운영 사이트는 스크류 수정 커밋 `bf7efef`에 머물러 있었습니다. Git 푸시와 로컬 검사만으로 운영 반영을 확인할 수 없다는 누락을 수정합니다.

## 확인한 증거

- 실패 배포: `f8ba5a44-1bb4-40d5-99a7-4e2814d38912`, 소스 `da7426c2272b8ead606012f8c7be6d48ae0eef6d`.
- Cloudflare 로그: 2026-09-15 01:29:24 UTC, `Pages only supports files up to 25 MiB in size` 및 `single-file/PHA-Process-Single.html is 50.6 MiB in size`.
- 수정 전 canonical production: `ec622dab-686e-4583-ac24-a8f9767a31d4`, 소스 `bf7efef2256dab66f80437d48f3199a71dc5079e`.
- 배포 명령은 이미 `npm ci && npm run build`였으나 `wrangler.toml`의 `pages_build_output_dir = "."`가 웹 실행 폴더 대신 저장소 전체를 업로드 대상으로 지정했습니다.
- 정상 접근 인증 후 운영 화면에서도 제목 `PHA 36-캐비티 플래시 제어 현장 가이드`, `전체 개요`, 짧은 `플래시 점검의 출발점` 설명을 확인했습니다. 새 `결함 알아보기`·생성 비교 이미지·금형 3D 가이드가 없는 구버전이었습니다.

## 수정

1. Pages 출력 경로를 `./dist`로 맞춥니다. 싱글 HTML·Blender 편집 원본·개발 자료는 웹 배포 대상에 포함하지 않습니다.
2. 기존 보안 응답 설정 `_headers`를 `dist`에도 복사합니다. 루트 `functions/`의 인증 미들웨어와 API 프록시는 Pages Functions로 유지하며 정적 파일로 복사하지 않습니다.
3. 빌드에서 모든 배포 파일의 크기를 검사해 25 MiB 초과 시 즉시 실패시킵니다.
4. 로컬용 싱글 파일은 GitHub 다운로드 파일로 유지합니다. 앱 내용과 싱글 파일 소스 해시는 이번 경로 수정의 영향을 받지 않습니다.

## 재발 방지 검사

```powershell
npm run build
node tests/pages-distribution.cjs
node scripts/build-single-file.cjs --check
```

배포 검사는 출력 경로, 필요한 가이드·3D·서비스워커 자산, 원본과 해시 일치, 보안 헤더, 개발/싱글 파일 제외, 과대 파일 거부를 확인합니다. Pages Functions 컴파일도 배포 전에 확인합니다. 이 변경은 공정 내용·기록 저장 스키마·인증 규칙을 수정하지 않습니다.

실행 결과: 배포 회귀 검사 4/4 통과, 186개 런타임 리소스 원본 일치, 실제 빌드의 25 MiB 허용/1바이트 초과 거부 통과. Wrangler 4.131.2로 인증 미들웨어·API를 성공적으로 컴파일했습니다. 싱글 파일의 기존 소스 해시·산출물 일치 검사도 통과했습니다.

푸시 후 GitHub의 Cloudflare 체크, canonical production 커밋, 인증된 운영 화면의 새 가이드와 3D를 확인해야 운영 반영이 완료됩니다. 확인 전 Git 푸시만으로 배포 성공이라고 보고하지 않습니다. 타입 검사기와 ESLint는 이 정적 JavaScript 프로젝트에 구성되어 있지 않습니다.

참고: [Cloudflare 배포 출력 경로](https://developers.cloudflare.com/pages/functions/wrangler-configuration/) · [Pages 제한](https://developers.cloudflare.com/pages/platform/limits/) · [실패 배포 로그](https://dash.cloudflare.com/bd6ae5a199903795d34f072006bb6918/pages/view/pha-process-tool-v2/f8ba5a44-1bb4-40d5-99a7-4e2814d38912).
