# 사출가이드 배포 문제 해결 보고서

## 날짜: 2025-10-31

## 문제 요약
https://nkkks-pha-process-v1.netlify.app 사이트에 사출가이드 탭이 표시되지 않는 문제

## 원인 분석

### ✅ 확인된 사항
1. **코드 존재 확인**: 사출가이드 코드가 `src/components/PHAPropertiesDashboard.jsx`에 완전히 구현되어 있음 (라인 754-1318)
2. **Git 상태**: origin/main 브랜치에 사출가이드 코드가 존재함을 확인
3. **빌드 상태**: 로컬 빌드 성공 및 dist 폴더에 사출가이드 내용 포함 확인
4. **커밋 이력**:
   - c3a67f8: 사출가이드 추가 (PR #32)
   - b7e97d8: 버그 수정 (PR #33)
   - 58554e7: 배포 조사 보고서 추가 (PR #35)
   - 9d90786: 현재 origin/main HEAD

### ❌ 근본 원인
**Netlify 자동 배포 미실행**
- origin/main에 모든 코드가 있지만 Netlify가 최신 커밋을 배포하지 않음
- 가능한 원인:
  1. Netlify 자동 배포 설정이 비활성화되어 있을 수 있음
  2. Netlify가 GitHub webhook을 제대로 수신하지 못했을 수 있음
  3. 이전 배포가 완료되지 않아 대기 중일 수 있음

## 해결 방법

### 단계 1: 강제 재배포 트리거
`netlify.toml` 파일에 주석을 추가하여 변경사항을 생성:
```toml
# Force deployment - 2025-10-31
```

### 단계 2: 브랜치에 커밋 및 푸시
- 브랜치: `claude/fix-injection-guide-display-011CUesG1WLYh5rcTYjS7BPX`
- 커밋 메시지: "Force Netlify redeployment to fix injection guide display issue"
- 푸시 완료

### 단계 3: Pull Request 생성 및 병합 필요
**중요**: main 브랜치로 직접 푸시는 403 에러로 인해 불가능합니다.

다음 중 한 가지 방법으로 해결해야 합니다:

#### 방법 A: GitHub에서 PR 생성 및 병합 (권장)
1. GitHub 저장소 방문: https://github.com/Yarn98/pha-process-tool-v2
2. "Compare & pull request" 버튼 클릭
3. 또는 직접 PR 생성: https://github.com/Yarn98/pha-process-tool-v2/pull/new/claude/fix-injection-guide-display-011CUesG1WLYh5rcTYjS7BPX
4. PR 제목: "Fix: Force Netlify redeploy for injection guide"
5. PR 병합 후 Netlify가 자동으로 재배포됨

#### 방법 B: Netlify 대시보드에서 수동 배포 (빠른 해결)
1. https://app.netlify.com/ 접속
2. "nkkks-pha-process-v1" 사이트 선택
3. "Deploys" 탭 클릭
4. "Trigger deploy" > "Deploy site" 클릭
5. 또는 최근 배포를 선택하고 "Retry deploy" 클릭

## 사출가이드 내용 확인

### 구현된 기능
사출가이드는 6개의 하위 탭으로 구성되어 있습니다:

1. **📋 전체 개요**: 4단 제어 로직 및 제어 원칙
2. **⚙️ 기계 설정**: V0, V1, V2, V3 각 단계별 상세 설정
3. **🧮 계산기**:
   - 클램프 톤수 계산기
   - V0 압력 리밋 계산기
   - 러너 전단률 계산기
   - 보압 설정값 계산기
4. **📊 프로세스 플로우**: 4단 제어 프로세스 흐름도
5. **✅ 체크리스트**: 준비, 설정, 검증, 일일 점검 항목
6. **🔧 문제 해결**: 스프루 플래시, 충전 불완전, 압력 스파이크, 무게 편차, PHA 열화 등

### 주요 내용
- **제어 전략**: "러너가 대부분 찰 때까지는 압력 제한으로 보호하고, 캐비티 충전 이후는 캐비티압 기반으로 달린다"
- **4단 제어**:
  - V0: Runner-Protect (압력 제한 속도 제어)
  - V1: 캐비티 충전 고속 (92-96%)
  - V2: EoF 브레이크 (종단 감속)
  - V3: 보압 램프-인/조기 종료
- **PHA 재료 특성 주의사항**: β-elimination 열분해, 좁은 가공창, 느린 결정화

## 검증 방법

배포 완료 후 다음을 확인하세요:

1. https://nkkks-pha-process-v1.netlify.app 접속
2. 8개의 탭이 표시되는지 확인:
   - Thermal, Mechanical, Processing, Structure, Applications, Analytics, Field DOE Kit, **사출 가이드**
3. "사출 가이드" 탭 클릭
4. 6개의 하위 탭 확인: 전체 개요, 기계 설정, 계산기, 프로세스 플로우, 체크리스트, 문제 해결
5. 각 하위 탭의 내용이 정상적으로 표시되는지 확인

## 예방 조치

향후 유사한 문제를 방지하기 위해:

1. **Netlify 자동 배포 설정 확인**
   - Netlify 대시보드 > Site settings > Build & deploy
   - "Auto publishing" 활성화 확인
   - "Branch deploys" 설정에서 main 브랜치 활성화 확인

2. **배포 알림 설정**
   - Netlify 대시보드 > Site settings > Build & deploy > Deploy notifications
   - 배포 실패 시 알림 설정

3. **정기적인 배포 상태 확인**
   - 중요한 변경사항 병합 후 Netlify 배포 로그 확인
   - 배포 완료 시간과 최근 커밋 시간 비교

## 다음 단계

1. **즉시**: Netlify에서 수동 재배포 또는 GitHub PR 병합
2. **배포 완료 후**: 웹사이트에서 사출가이드 탭 확인
3. **확인 완료 후**: 브라우저 캐시 지우기 (Ctrl+Shift+R 또는 Cmd+Shift+R)
4. **최종 검증**: 모든 하위 탭의 내용이 정상적으로 표시되는지 확인

## 기술적 세부사항

### 빌드 설정
- 빌드 명령: `npm ci && npm run build`
- 게시 디렉토리: `dist`
- Node 버전: 18.20.4

### 파일 크기
- index.html: 0.40 kB
- index.css: 23.38 kB
- index.js: 545.18 kB (gzip: 164.78 kB)

### 커밋 정보
- 최신 커밋: b95b5bc
- 브랜치: claude/fix-injection-guide-display-011CUesG1WLYh5rcTYjS7BPX
- 변경 파일: netlify.toml (주석 1줄 추가)
