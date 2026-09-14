# PHA Process Tool — 공정 조건·기록

PHA 가공의 **초기 시운전 참고 조건, 계산, 현장 기록**을 제공하는 정적 웹앱입니다. 그레이드·공정에 대응하는 제조사 원문과 사용자가 저장한 범위를 구분하며, 출처가 없는 조건은 비워 둡니다. 성형품의 실측 결과를 학습해 양품 생산을 보장하는 최적화 모델은 아닙니다.

검토 기준: **2026-09-06**. 프로젝트 코드와 질문을 GPT-6 Pro에 전달하고 완료 답변을 제조사 원문·코드와 대조했습니다. [전체 가공 검토와 반영 보고서](docs/ALL_PROCESSING_REVIEW_20260906.md) / [1차 리뷰 기록](docs/PROCESS_REVIEW_20260906.md).

**2026-09-13 설비 개선:** 사출·압출·시트·캐스트 필름·블로운 필름·압출 블로우 성형·컴파운딩·스트로 8종에 **Unreal 상세 이미지**와 **회전수·속도 계산에 따른 3D 동작**을 연결했습니다. 스트로는 Straw Optimizer v2의 완료된 환형 다이 이미지를 그대로 차용하고, 다른 7종은 기존 Blender 설비를 Unreal 5.8.2에서 새로 렌더링했습니다. [설비별 검토·재생성·검증](docs/UNREAL_EQUIPMENT_20260913.md).

**2026-09-14 트러블슈팅 시각 가이드:** 16개 점검 항목에 25개 대표 결함 형상, 정상 비교, 확대 이미지, 3D·단면과 기존 KB의 확인·조치 흐름을 연결했습니다. **열성형 설비를 신규 제작**해 히터·플러그·시트 성형·클램프·이형을 단계별로 조작합니다. [제작·출처·검증](docs/TROUBLESHOOTING_VISUALS_20260914.md).

**2026-09-14 벤트 집중 가이드:** ‘벤트 역류·스트랜드 기포’에서 **벤트 가이드·3D 보기**를 열면 앞쪽 대기 벤트와 뒤쪽 진공 벤트의 역할, 역이송 제거/벤트 전 배치 비교, 덩어리·RPM/토출량 변경 후 MI 상승의 점검 순서를 볼 수 있습니다. 제조사 원문과 완료된 GPT-6 Pro 조사를 검토해 조건부 가이드로 반영했습니다. 승온 폭이나 스크류 개수를 자동 처방하지 않습니다. 새 Blender 모형에서 두 배치, 스크류 회전·수지/가스 이동, ATM·씰·VAC 확대를 조작합니다. 첨부 슬라이드는 앱 이미지로 재사용하지 않았습니다. [조사 내용](docs/research/PHA_VENT_FLOODING_20260914.md) / [구현·검증](docs/VENT_GUIDE_20260914.md).

## GitHub에서 받아 로컬로 실행

[저장소 전체 ZIP](https://github.com/Yarn98/pha-process-tool-v2/archive/refs/heads/main.zip)을 받거나 [저장소](https://github.com/Yarn98/pha-process-tool-v2)의 **Code → Download ZIP**을 선택합니다. ZIP 내부의 `pha-process-tool-v2-main` 폴더 전체를 사용하세요. [GitHub 다운로드 안내](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives).

저장 위치는 자유입니다. 예를 들어 폴더 이름을 바꿔 `D:\PHA-Process\index.html`이 보이도록 압축을 풉니다. `index.html`, 루트의 JS·CSS 파일, `assets/`, `data/`, `icons/`, `vendor/`, `sw.js`, `manifest.webmanifest`의 상대 위치를 유지해야 합니다. `index.html` 하나만 받으면 3D·가이드가 완성되지 않습니다.

Python 3가 설치된 PC의 PowerShell에서 실행합니다.

```powershell
Set-Location 'D:\PHA-Process'
python -m http.server 8097 --bind 127.0.0.1
```

브라우저에서 **http://127.0.0.1:8097/** 을 여세요. 서버 창은 실행 중 유지하고 종료할 때 `Ctrl+C`를 누릅니다. `index.html` 더블클릭보다 로컬 HTTP 실행을 사용하세요. 루트에 실행용 JS·3D 파일이 포함되어 있으므로 단순 사용에는 Node.js·Blender·Unreal 설치나 재빌드가 필요하지 않습니다.

현재 개발 PC의 저장소 위치는 `D:\My_PJT\Application\pha_optimizer_convertor`입니다. 이 PC에서는 해당 폴더에서 같은 서버 명령으로 실행합니다. GitHub에는 `dist/`를 올리지 않습니다. 실행 파일만 따로 전달하려면 개발 PC에서 `npm run build` 후 생성되는 **`dist/` 전체 내용**을 새 폴더로 복사하세요. 공정 기록·개인 API 설정은 브라우저에 저장되므로 저장소 ZIP에 포함되지 않습니다.

## 실행과 검증

```powershell
python -m http.server 8097 --bind 127.0.0.1
# http://127.0.0.1:8097/
npm run test:process
npm run test:ui
npm run test:myai
npm run test:motion
npm run test:equipment
npm run test:kinematics
npm run test:study
npm run check:kb
npm run check:ts-visuals
npm run test:ts-visuals
npm run check:vent-guide
npm run test:vent-guide
npm run build
# 배포용 파일을 대상으로 UI 검사
$env:PHA_TEST_ROOT='dist'; npm run test:ui
```

계산 검사는 Node.js, 브라우저 검사는 기존 Playwright/Chromium을 사용합니다. 검사는 독립 브라우저·임시 서버에서 실행하며 사용자 브라우저 기록·API 키를 사용하지 않습니다. build.js는 정적 파일을 dist/에 모읍니다. Blender 편집 원본은 배포에서 제외합니다.

## 화면 사용

| 화면 | 기능 | 해석 |
|---|---|---|
| 공정 조건 | 그레이드·6개 공정, 전 공정 설비의 3D 동작·직접 조작, 입력과 범위 비교 | 제조사 원문 / 현장 수정 / 근거 미확인을 구분 |
| 트러블슈팅 | 16개 한영 점검 항목, 25개 형상, 확대 이미지, 정상/단면/3D·설비 조작, 공정·증상 검색 | 검토 KB의 진단 → 조건부 조치 → 중단·복귀 기준 → 재검사 |
| 이력·분석 | 조건 저장, JSON/CSV 교환, 트렌드 | 다른 그레이드·설비 기록의 단순 비교에 유의 |
| 계산기 | 평균 체류시간, 평판 냉각, 필름 단층 두께 | 단위와 모델 가정 확인 |
| 물성 DB | 로컬 물성 편집·교환, 제조사 시험조건 | MFR 온도·하중, 충격 단위·노치 조건 보존 |
| 플래시 제어 | 점검 순서, 형체력·압력·전단률·보압비 계산, 배치 로그 | 압력 역산은 사출기 설정값이 아님 |
| 컴파운딩·스트로 | 전용 3D 설비 조작, 배합 합계·개념 배치 선택, 다열 스트로 생산량·수조 체류 계산 | 배치 선택은 OEM 확인, 최소 체류시간은 시험 입력 필요 |
| My AI | 사용자 제공 API/LM Studio와 앱 도구 연동 | 키 저장은 사용자 선택; 물리 계산은 같은 정의 사용 |

CA1180P 사출의 일반 금형 / 고내열 시험 모드를 분리합니다. 수정값은 그레이드·공정·해당 금형 모드별로 저장합니다. 이전 프로파일×공정 공통 수정값은 보존하되 자동 입력값이 섞였을 수 있어 자동 적용하지 않습니다. 근거 패널에서 확인 후 재검토하세요.

범위 안은 참고 범위와의 수치 비교이며 성형 가능·안전·양품 판정과 다릅니다. 속도 %는 장비 상대값입니다. 원료와 제조된 컴파운드의 건조자료를 구분하세요.

S1000P, A1000P, CA1180P, CB0104A, CB0400A, CA1165A, CA1670P, CA1680P, CA1270P의 개별 문서를 연결했습니다. 기능별 배럴 온도는 별도 원문 표로 표시하고 장비의 번호별 구간에 자동 대응하지 않습니다. CA1670P/CA1680P의 ISBM 자료를 압출 블로우 성형(EBM)에 적용하지 않으며, 기존 `CA1680` 기록은 `CA1680P`로 자동 변경하지 않습니다.

## 계산 정의

| 계산 | 식과 가정 |
|---|---|
| 평균 체류시간 | 60 × 체류 질량(kg) / 토출량(kg/h) → min. 질량 미입력 시 밀도(kg/m³) × 용적(L) / 1000. 정체부·정지는 별도 |
| 냉각 | 전체 두께 d인 평판 중심부 1차 근사: d²/(π²α) × ln[(4/π)(T_initial−T_mold)/(T_eject−T_mold)]. 초기 수지온도는 재료 융점이 아님. 두께·열확산율 > 0, T_initial > T_eject > T_mold |
| 필름 두께 | Q/(ρ × π × D_die × BUR × v), 단위 환산 후 µm. 최종 필름 밀도·단층 기준 |
| 갭 교차확인 | g/(BUR × DDR). 다이·최종 필름 동일 밀도, 얇은 환형 갭 근사. 독립 예측이 아님 |
| 형체력 | 총 투영 면적(cm²) × 캐비티 평균압력(bar) / 980.665 → metric tf. 모든 캐비티와 러너 포함 |
| 캐비티 압력 역산 | 형체력(tf) × 980.665 × 이용률 / 총 면적(cm²), 0 < 이용률 ≤ 1. 유압·노즐 수지압 설정값과 구분 |
| 보압 환산 | 사용자가 입력한 P1/P2 비율 × 같은 압력 기준의 피크압력. 비율·시간을 자동 추천하지 않음 |
| 샷 중량 | 제품 1개 중량 × 정수 캐비티 수 + 전체 러너 중량. 입력 밀도 기준 체적은 스크류 계량체적·스트로크와 구분 |
| 스트로 | 라인 속도 = 수조 길이 / 입력 체류시간. 전체 절단 생산량 = 가닥 수 × 라인 속도 / 절단 피치. 피치에는 절단 여유 포함. 제품 질량유량과 실제 압출기 토출량 구분 |

냉각 근사는 일정 표면온도·열확산율을 가정하며 결정화 잠열·접촉저항·냉각회로·후육부를 반영하지 않습니다. 짧은 시간 영역에서는 1차항 근사의 오차가 커집니다. 실제 냉각 타이머와 탈형·치수·품질 결과를 따로 검증해야 합니다.

## Web TARS와 자료

- [PHA Process](https://pha-process.tarspolymer.com/) / [Web TARS 사출 참고](https://p34hb.tarspolymer.com/#inj).
- /api/grades는 배포 환경에서 같은 출처 프록시, 로컬에서 TARS Worker 공개 목록을 읽습니다. 물성은 설정값의 출처가 아니며 Tm+5나 임의 건조조건을 생성하지 않습니다.
- 4HB의 tars-composition-v1 JSON·URL 전달을 받아 tars-batch-v1 세션으로 기록합니다. planning → running → finalized 상태를 유지합니다.
- 확인한 원문은 process-evidence.js에 revision·링크·적용 공정과 함께 고정합니다. 숫자 필드에는 페이지·단위·기준·현장 미검증 상태를 포함합니다. 미기재 변수는 빈칸이며 임의 혼합 평균을 만들지 않습니다.
- [전체 가공 Pro 질문](docs/research/all-processing-pro-question-20260906.md) / [완료 답변](output/gpt-pro-review-packs/pha-all-processing-gpt6-pro-20260906/provider_answer.md) / [제조사 원문 대조](docs/research/primary-source-check-20260906.md).
- [Claude 한영 용어 검수](docs/research/claude-all-processing-terms-20260906.md)는 제공한 문구에 대한 검토입니다.

## 구조와 시각자료

| 파일 | 역할 |
|---|---|
| index.html | 셸·기존 계산/기록/My AI |
| process-evidence.js | 원문 참고 데이터·물리 계산·범위 상태 |
| process-atlas.js / .css | 단계 설명·출처 패널·형상 예시 |
| injection-motion.js / vendor/three-0.185.1/ | Blender GLB 재생·단계 이동·회전·확대, 로컬 3D 렌더러 |
| equipment-motion.js / equipment-models.js | 나머지 7개 공정의 부품별 조작·동작 그룹·관찰 시점 |
| equipment-study.js / equipment-kinematics.js | 8종 설비의 Unreal/3D 전환, 단위가 명확한 계산과 선택 기구 동작 |
| assets/equipment/unreal/ / scripts/unreal/ | 1600×900 WebP 8장·원본 해시, Blender→Unreal 렌더링·패키징 스크립트 |
| pha-integration.js | 가이드 연결·재료 분류·TARS 읽기 |
| custom.js / glossary.js / data/ | 물성·용어·트러블슈팅 원본 JSON |
| troubleshooting-data.js / scripts/sync-troubleshooting.cjs | JSON에서 생성하는 동일한 오프라인 KB와 검사 |
| troubleshooting-visuals.js / .css / troubleshooting-viewer.js | 증상별 공유 확대창, 정상·단면·설비 관찰과 단계 조작 |
| data/troubleshooting_visuals.json / troubleshooting-visuals-data.js | 16개 항목·25개 형상의 한영 설명, KB 내용/검토 버전과 자산 연결 |
| data/vent_guide.json / vent-guide-data.js / vent-guide.js / .css | 출처가 연결된 두 벤트·역이송 비교·증상별 가이드, 공통 확대창의 3D 연결 |
| scripts/create_vent_guide_model.py / tests/blender-vent-guide.py | 두 배치의 새 Blender 원본·GLB·포스터 제작과 기능별 형상 검증 |
| assets/troubleshooting/ / art/troubleshooting/ | 웹용 GLB·WebP / 배포에서 제외되는 Blender·생성 이미지 편집 원본과 프롬프트 |
| compounding-guide.js / straw-guide.js | 공정 참고 가이드 |
| assets/equipment/ | 8개 공정의 GLB·편집 원본·대체 포스터, 기존 PNG 보존 |
| scripts/render_equipment.py | 설비도 재생성 |
| scripts/create_line_models.py | 신규 6개 동작 설비 제작·Straw Optimizer 원본의 조작 모델 변환 |
| assets/flash-example.png | 생성 플래시 형상 |
| functions/ 및 배포 설정 | 기존 접근 게이트·API 프록시 |

```powershell
blender --background --factory-startup --python scripts/render_equipment.py
```

설비도는 개념도이며 기계 도면·유동해석이 아닙니다. 생성 플래시는 실측 불량이나 원인 증거가 아닙니다. [제작 내역](docs/VISUAL_ASSETS_20260906.md).

사출은 **공정 조건의 설비 흐름**과 **플래시 제어 → 공정 흐름**에서 움직이는 절개 모델을 제공합니다. 스크류 회전·후퇴/전진, 수지 이동과 캐비티 충전, 금형 개폐·이젝터·제품 취출을 볼 수 있습니다. 재생/일시정지, 0.5×/1×/1.5× 재생, 단계 이동, 회전·확대를 지원합니다. 기기의 동작 줄이기 설정에서는 일시정지로 시작하며, 보이지 않는 탭에서는 재생을 멈춥니다. 3D 로드 실패 시 설명용 그림을 유지합니다.

**직접 조작**에서는 스크류·금형·이젝터를 상대 이동값으로 조절하고 충전·취출을 확인할 수 있습니다. 금형 개방 후 이젝터 전진, 이젝터 복귀 후 금형 닫힘 순서가 연결됩니다. 관찰 부위 선택으로 스크류나 금형을 확대합니다. Blender의 BoltFactory 체결부와 드라이버를 사용하며, 원본 `MachineControls`에서도 기계 축을 조절할 수 있습니다.

**회전수·속도 계산과 동작 확인**을 펼치면 RPM, 선속도·현재 롤 직경, 절단 길이·피치, 이동 거리·평균 속도를 입력할 수 있습니다. 선택한 기구를 0.1×/0.25×/1×로 표시합니다. 스트로는 1날, 펠릿 절단기는 4날 모형 기준이며 절단 횟수는 스트랜드 1개당입니다. 이동은 일정 평균 속도의 편도 동작입니다. 예제 입력값을 생산 추천값으로 저장하지 않으며, 유변학·열전달·냉각/보압 시간은 이 기능에서 계산하지 않습니다. 기존 TARS/제조사 공정 근거와 계산기는 별도로 유지합니다.

```powershell
blender --background --factory-startup --python scripts/create_injection_motion.py
```

재생 시간은 설명용이며 실제 사이클·수지 유동해석과 다릅니다. 계량과 냉각의 실제 중첩은 모델에서 동작을 구별하기 위해 단순화했습니다. [사출 동작 제작·검증](docs/INJECTION_MOTION_20260906.md).

일반 압출·시트·캐스트 필름·블로운 필름·압출 블로우 성형은 **공정 조건**에서, 이축 컴파운딩·스트로는 각 전용 탭에서 같은 재생·관찰·직접 조작 기능을 사용합니다. 스크류, 사이드 피더, 롤, 권취축, 벨트, 절단날과 수지 표시를 부품별로 조작합니다. 블로우 성형은 패리슨 토출 → 금형 닫힘 → 핀 삽입 → 팽창 → 핀 복귀 → 금형 개방·배출 순서를 연결합니다.

스트로는 `D:/My_PJT/Application/straw-optimizer-v2`의 작업 중 Blender 설비를 복사해 중공 다이·수조·벨트·절단기 구조를 차용했습니다. 이 프로젝트의 복사본에 조작과 절단물 배출을 추가했으며, 원본의 출처·스냅샷 해시를 보존했습니다. 나머지 6개 라인은 새로 제작했습니다. [전체 설비의 조작·출처·검증 기록](docs/ALL_EQUIPMENT_MOTION_20260906.md).

```powershell
blender --background --factory-startup --python-exit-code 1 --python scripts/create_line_models.py
blender --background --factory-startup --python-exit-code 1 --python tests/blender-line-models.py
# 특정 모델만 재생성할 때
blender --background --factory-startup --python-exit-code 1 --python scripts/create_line_models.py -- sheet straw
```

회전각은 1°, 상대 위치는 0.1% 단위로 조작합니다. 이 값은 모형의 위치이며 실제 RPM·토출량·온도·BUR·생산 조건과 연결되지 않습니다. 수지 표시는 이동 방향을 설명하며, 필름 두께·열전달·체적 보존을 계산하지 않습니다.

## 저장·오프라인

이력·배치·템플릿·물성은 브라우저 로컬 저장소에, 일부 사진은 IndexedDB와 별도 localStorage 갤러리에 저장합니다. 기기 간 자동 동기화되지 않습니다. JSON/CSV로 백업하세요. 업데이트를 위해 웹사이트 데이터를 지우면 현장 기록도 삭제될 수 있습니다.

서비스워커는 HTML network-first, 버전 자산 precache를 사용합니다. v=23 / pha-cache-v23-vent-guide. 첫 정상 로드와 캐시 준비 후 로컬 자료·8개 기존 설비·16개 결함 모형 및 새 두 벤트 모형의 3D 조작·계산을 사용할 수 있습니다. 외부 TARS API와 CDN Chart.js는 오프라인에서 제한됩니다. file://보다 로컬 HTTP 실행을 권장합니다.

기존 체크리스트·시험 로그는 유지합니다. 의미가 바뀐 컴파운딩 체크 두 항목은 새 키를 사용하며, 이전 완료 표시는 과거 기록으로 남깁니다.

검토·실행 검증 시점은 보고서에 기록하고, 이후 변경·푸시 이력은 Git에서 확인합니다. 실제 서비스 배포 완료는 별도로 확인해야 합니다.
