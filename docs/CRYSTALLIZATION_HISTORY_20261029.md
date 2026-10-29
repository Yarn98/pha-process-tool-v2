# PHA 결정화 이력 — 수지 온도–시간 이력 판정 엔진과 용도별 프리셋

구현일: 2026-10-29. 근거는 「PHA 결정화 이력 기반 공정조건 코드 작업지시서」(2026-10-29)와 P3HB 균일 핵생성 논문이다(Jariyavidyanont, Zhang, Schick, Androsch, Macromolecules 2026, 59, 379–391, DOI 10.1021/acs.macromol.5c02381).

설비 온도가 아니라 수지가 각 온도대에 실제로 머문 시간으로 판정한다. 시작 조건은 S1000P 주성분 배합을 가정한 추정안이다. 그래서 화면에서는 항상 현행 control과 나란히 보인다. 논문값은 순수 P3HB 결과이므로 배합 grade에는 "미보정 참고값"으로 표시한다. S1000P는 2026-10-30부터 60 °C 실측 t½ 1점으로 앵커만 보정한다(아래 "기존 자료로 확인한 항목").

## 화면에서 확인하는 방법

**공정조건 탭 → HMI 보기 아래 "결정화 이력"**을 펼친다.

1. 공정(빨대 2단 수조, 사출, 시트 3롤)과 grade를 고른다.
2. 열전도도 k와 밀도 ρ, 수조·공기의 h를 입력한다. 이 값들은 기본값이 없으며, 비어 있으면 계산을 멈추고 W03을 표시한다.
3. 공정 입력을 채운다. 수온·금형·롤 온도에는 작업지시서 시작안이 "시작안" 배지와 함께 미리 들어 있다.
4. **계산**을 누르면 표면·중심·두께 평균의 T(t) 그래프가 나온다. 30–40, 60–70, 80–90°C 구간은 음영으로, 수조·롤 경계는 세로선으로 표시된다.
5. 결과 카드에서 구간 체류, CR1·CR2 비교, 앵커 비율 또는 N·P, 핵 생존, v_max·필요 길이, 판정 규칙, 경고를 확인한다.
6. 실측 kinetics CSV를 넣으면 곡선 모드로 바뀐다. DOE에서는 실험표 CSV를 내려받고, 결과 CSV를 붙여 넣어 판정한다.

KR/EN 전환을 지원하고, 모바일에서는 그래프와 카드를 세로로 쌓는다.

## 저장소 매핑표

작업지시서 0.1의 후보 구조(straw-optimizer-v2 계열 `ProcessConditions.jsx`·`ProcessLog.jsx`)는 이 저장소에 없다. 이 저장소는 빌드 도구 없이 root에 UMD 스크립트를 두는 정적 PWA다. 그래서 신규 모듈도 같은 방식으로 root에 두었다.

| 작업지시서 항목 | 기존 파일 | 신규 모듈 | 연결 방식 |
|---|---|---|---|
| grade library | `process-evidence.js` `GRADES`, `index.html` `GRADES`·`MAT_DEFAULT`, `custom.js` `MATERIAL_CARDS`, `pha-integration.js` 레지스트리 | `data/process/crystallization_presets.json` `grades` | 기존 객체는 수정하지 않고 grade id로 결정화 분류를 따로 조회 |
| kinetics 상수 | 없음 | `data/crystallization/p3hb_ref_2026.json` → `crystallization-data.js` | `scripts/sync-crystallization.cjs`로 생성, `npm run check:crystal`로 확인 |
| 공정조건 화면 | `index.html` `#proc` 탭, `hmi-panel.js` | `crystallization-panel.js`, `crystallization-panel.css` | `#hmiPanel` 바로 뒤에 `#xtalPanel` 삽입 |
| 계산기 | `process-evidence.js` `cooling`·`strawCapacity`, `straw-guide.js` ST-1, `equipment-kinematics.js` | `crystallization-engine.js` | 기존 계산기는 그대로 두고 별도 함수 제공 |
| 공정 규칙 | `straw-guide.js`, `process-atlas.js` | `crystallization-process.js` | 빨대 S1–S7, 사출 I1–I6, 시트 H1–H6 |
| 트러블슈팅 | `troubleshooting-data.js`, `flash-guide.js` | 사출 I2 flash 분기 | 기존 KB는 수정하지 않음 |
| 공정 기록 | `index.html` `pha_hist`(`collectEntry`), Flash `processLog`, `tars-batch-schema.js` | `crystallization-doe.js` | DOE 결과는 별도 localStorage 키 `pha_xtal_doe`에 저장(아래 미구현 참조) |
| KR/EN | `index.html` `I18N`, 모듈별 `t(ko,en)` | 패널 내부 `t(ko,en)` | `pha-language-change` 이벤트로 다시 그림 |
| 모바일 | `index.html` `@media (max-width:768px)`, `.force-mobile` | `crystallization-panel.css` | 같은 768px 경계와 `.force-mobile`에서 카드 1열 |
| 배포 등록 | `build.js`, `sw.js`, `scripts/build-single-file.cjs` | 6개 파일 등록 | cache `pha-cache-v34-crystallization-history`(2026-10-30 반영분은 `pha-cache-v35-crystal-measured-anchor`), single file 재생성 |

## 파일별 변경 요약

| 파일 | 내용 |
|---|---|
| `data/crystallization/p3hb_ref_2026.json` | 1장 상수(kinetics, 서론 문헌값, 핵 안정성, CNT Table 1), 엔진용 anchors·curves·survival |
| `data/crystallization/curves_template.csv` | Fig. 3b·6c 디지타이즈와 실측 DSC 입력 형식 |
| `data/process/crystallization_presets.json` | 구간 정의, grade 분류, 빨대·사출·시트 시작 조건과 control, 충돌 목록 C1–C7 |
| `scripts/sync-crystallization.cjs`, `crystallization-data.js` | JSON → 브라우저 모듈 생성과 동기화 확인 |
| `crystallization-engine.js` | thermal1d, 구간 체류, CR1·CR2, 앵커 비율·N·P, 핵 생존, 속도·체류, 임계 반경, 경고 W01–W14 |
| `crystallization-process.js` | grade 분기(7장), 빨대·사출·시트 모듈, 확장 공정 스텁 |
| `crystallization-doe.js` | screening 실험표, 속도 상승 단계, CCD, 판정(평균 ± SD, n, Welch t) |
| `crystallization-panel.js`, `crystallization-panel.css` | 공정조건 탭 패널 |
| `index.html`, `build.js`, `sw.js` | 신규 파일 등록, `?v=34` |
| `equipment-*.js`, `flash-*.js`, `injection-motion.js`, `troubleshooting-visuals.js`, `vent-guide.js`, 기존 테스트, `README.md` | cache 이름·`?v=` 토큰만 v33 → v34 |
| `single-file/*` | 재생성 |
| `tests/crystallization-*.test.cjs`, `tests/crystallization-ui.mjs` | 단위 47건, 브라우저 16건 (2026-10-30 기준) |

## 기존 코드값과 신규값 충돌 (W07, 병기)

덮어쓰지 않고 출처와 함께 병기했다. 화면의 "W07 · 기존값과 신규값 병기"에서도 같은 목록을 볼 수 있다.

| 항목 | 작업지시서 | 기존 값과 위치 |
|---|---|---|
| 빨대 다이 출구 | 170–190°C (첨부 2), EB melt 178–180°C | CB0400A TDS 빨대 die 160–165°C (`process-evidence.js`) |
| 60°C 결정화 반감기 | P3HB t1/2 최소 약 30 s | 사내 DSC: S1000P 4HB 3.3–5.3 %의 60 °C 반결정화 시간 7–28초 (`equipment-models.js`, 블로운 필름). 원자료는 lot 4개 4HB 3.3–5.1 mol%에서 7.10–27.50 s. S1000P 앵커를 대표 lot 25.0 s로 대체(2026-10-30) |
| 사출 금형 | 60·65·70°C (CB0104A TDS 60–70°C) | CA1180P 40°C, CA1180P high_hdt·CA1165A 110–120°C (`process-evidence.js`) |
| 시트 R2 sticking | R2 65·70·75°C screening | "R2 50–60°C, 55°C 유지"는 이 저장소 코드에 없음. 같은 수치가 Sheet process 저장소에 롤 표면 engineering prior로 있음. 현행 R2를 control로 입력 |
| 빨대 2차 수조 | 75°C (70–75°C) | 한국 라인 현행 2단 60°C (사내 계획 2026-09) |
| 수조 체류 | 400 ea/min × 0.26 m = 104 m/min, 1단 0.577 s, 2단 1.904 s | 첨부 2 예시 3 m·10 s → 18 m/min |
| 1차 수조 수지 목표 | 30–40°C | 첨부 2 "약 35–45°C" |

60°C 반감기 충돌은 S1000P kinetics를 정할 때 가장 직접적인 근거다(판단됨). 사내 DSC 원자료를 CSV 형식으로 넣으면 곡선 모드에서 이 값이 논문값을 대체한다.

## 기존 자료로 확인한 항목 (2026-10-30)

처음 구현 때 "확인 필요"로 남긴 항목은 사용자 DB와 TARS 자료로 답이 있었다. 사용자에게 새로 묻지 않고 아래 근거로 반영했다.

| 항목 | 반영 내용 | 근거 |
|---|---|---|
| 4HB 함량 단위 | mol%. 값은 그대로(S1000P 2–5, A1000P 30) | TARS DB `grades.hb4_mol_pct`(S1000P 3.5, A1000P 30), TARS README "confirmed 3.3 mol%". 사내 실험 기록의 A1000P는 34 |
| CA1180P, CA1165A, CA1670P, CA1680P, CA1270P | PLA + aPHA 배합. `out_of_scope`(PLA 매트릭스), W14 표시 | CJ TDS(`process-evidence.js`) family. 조성은 TARS formulations(CA1180P PLA 80 / A1000P 20 + Talc 10 phr, CA1165A PLA 약 70 / A1000P 약 20 + CaCO₃ 20 phr + Talc 10 phr)와 사내 실험 기록(CA1680 PLA 80 / aPHA 20) |
| CA1680, CA1170A | CA1680은 CA1680P로 판단. CA1170A는 어디에도 없고 사내 기록에 CA1170P(PLA 75 / aPHA 25 + Talc)만 있어 추가하지 않음 | TARS raw `Data_all1230` row 479–486 |
| 시트 R2 50–60 °C·55 °C | 출처 문구만 보강. 시작 조건은 바꾸지 않음 | Sheet process `src/materials.js` `processPrior`: 롤 표면 첫 시험 50–60 °C, 선호 55 °C, R2 출구 시트 평균 60–65 °C. engineering prior, 실측 근거 미기재 |
| S1000P 60 °C t½ | 대표 lot 3ACF240209 값 0.4166 min(25.0 s)으로 결정화 앵커 `t_half_min_s`만 대체, W13 표시 | `PHA_물성_통합정리.xlsx` 원본데이터 → TARS `workbook-raw-extract.json` |

S1000P 60 °C 등온 DSC 반결정화 시간(첫 peak):

| lot | 4HB (mol%) | 냉각 Tc (°C) | t½ (min) | t½ (s) | 시트 |
|---|---|---|---|---|---|
| 3ACF240209 (대표, 560 kDa) | 3.6 | 91.35 | 0.4166 | 25.0 | 4HB 함량별 물성 평가 (5.31) |
| 3A3CF231219 | 3.3 | 89.1 | 0.4583 | 27.5 | S1000P 평가 (03.07) |
| 2A3CF231229 | 4.1 | 104.17 | 0.1183 | 7.1 | S1000P 평가 (03.07) |
| 2A3CF240120 | 5.1 | 82.22 | 0.4083 | 24.5 | S1000P 평가 (03.07), 4HB 범위를 0.1 넘음, 두 번째 peak 1.3983 min |
| 1A3CF240111 | 6.8 | 71.34 | 0.4783 | 28.7 | S1000P 평가 (03.07), 4HB 범위 밖 |

- 대표 lot은 Sheet process가 S1000P cooling Tc nominal로 쓰는 lot과 같다.
- 60 °C 한 점이라 곡선 모드에는 쓸 수 없다. 결정화 구간(60–70 °C), 핵생성 onset 1 s, 핵 생존 기준은 P3HB 논문값 그대로다.
- 배합 grade(CB0400A·CB0104A)는 필러·핵제로 kinetics가 바뀌므로 S1000P 값을 물려받지 않고 W02를 유지한다.
- 용융 온도·유지 시간·냉각 속도는 원자료에 기록이 없다.
- TARS 예측 도구는 Tc(DSC 냉각 peak), Tm, Tg, ΔH, Xc를 예측하지만 반결정화 시간은 예측하지 않는다. TARS는 t½를 학습에서 의도적으로 제외한다(`ingest_inhouse_formulation_panel_20260518.py`, sidecar-only).

## 검증

| 시험 | 결과 |
|---|---|
| `npm run test:crystal` | 45 pass. 9.3 검증값 14건과 1장 snapshot 포함 |
| `npm run check:crystal` | 생성 모듈과 JSON 일치 |
| `npm run test:crystal-ui` | 15/15 pass. 한국 빨대 예제, A1000P 분기, EN, 사출 W11, 시트 R2 1.885 s, DOE, 모바일 390 px |
| thermal1d 해석해 비교 | 평판 양면 고정온도, 1 mm, 0.5 s: 중심 오차 0.17 K(21격자), 0.04 K(41격자) |
| 기존 단위·정적 점검 | `test:process`, `test:single`, `pages-distribution`, troubleshooting·vent·flash·kinematics 데이터 테스트, KB·visual·vent sync check 통과 |
| 기존 브라우저 회귀 (통과) | `test:ui`, `test:vent-guide`, `test:ts-visuals`, `test:myai`, `test:tools`, `test:motion`, `test:kinematics`, `test:study`, `test:equipment` |
| 기존 브라우저 회귀 (로컬 재확인) | `tests/tab-connections.mjs` 16/16 pass, `test:flash-guide` 데이터 3/3·UI 8/8 pass. 클라우드 실패는 컨테이너 환경 문제로 확인되어 코드 수정과 `origin/main` 비교는 하지 않았다 |
| single-file 산출물 (로컬 재빌드) | 00d4b88의 `single-file/` 산출물은 `package.json`에 `test:crystal-ui`가 추가되기 전에 빌드되어 `build-single-file.cjs --check`가 stale로 실패했다(내장 `package.json` 1875 B, 현재 1935 B). `npm run build:single`로 다시 빌드한 뒤 `test:single` 10/10 pass |
| 2026-10-30 반영분 | `test:crystal` 47/47(S1000P 앵커 대체·참조값 불변·W13/W14·배합 W02 유지), `test:crystal-ui` 16/16(S1000P W13 배너, CA1180P W14 조성 표시) |
| 2026-10-30 회귀 (cache v35 `pha-cache-v35-crystal-measured-anchor`) | `check:crystal`, `test:process` 9/9, `check:kb`·`check:ts-visuals`·`check:vent-guide`, `test:kinematics` 4/4, troubleshooting·vent·flash 데이터 5/4/3, `pages-distribution` 4/4, `test:single` 10/10, flash-guide UI 8/8, vent-guide UI 8/8, troubleshooting-visuals UI 9/9, `test:ui` pass, `tab-connections` 16/16. Windows 11, Playwright 1.59.1, Chromium 147.0.7727.15 |
| 패널 열림 상태 경합 수정 | 패널을 연 직후 공정을 바꾸면 비동기 toggle 저장보다 다시 그리기가 먼저 실행되어 패널이 닫혔다. `readInputs()`가 DOM의 열림 상태를 읽도록 고쳤다. 수정 전 UI 테스트는 첫 계산 클릭에서 2회 연속 timeout |

브라우저 회귀는 클라우드 컨테이너(Linux, Playwright 1.56.1, Chromium 1194, 2026-10-29)에서 실행했다. 실행 중 다시 그려진 장비 3D 스크린샷과 측정값만 바뀐 결과 파일은 이번 변경의 증거가 아니므로 commit하지 않았다.

로컬 재확인은 Windows 11 Pro 10.0.26300, Node 22.16.0, Playwright 1.59.1, Chromium 147.0.7727.15(revision 1217)에서 2026-10-29에 실행했다. 같은 환경에서 `check:crystal`, `test:crystal` 45/45, `test:crystal-ui` 15/15도 다시 통과했다.

## 미구현과 가정

- DOE 결과 필드는 Flash `processLog` 스키마에 넣지 않았다. 그 기록은 사출 flash 배합 조성 기록이라 공정 DOE와 섞지 않고, 별도 키 `pha_xtal_doe`에 저장한다.
- Fig. 3b·6c 곡선은 디지타이즈 전이라 비어 있다. 그동안 엔진은 앵커 모드로 동작하며, 앵커 비율은 순위 지표이지 결정화도가 아니다. S1000P 곡선 모드에는 60 °C 외 온도(예: 50·70 °C)의 등온 DSC t½가 더 필요하다.
- 결정화 발열(W09 상시 표시), 사출 금형 접촉저항, 열분해 속도식은 넣지 않았다(작업지시서 3장·5.1).
- cp는 P3HB Tm0 값(용융 2.073, 고화 1.858 J/g/K)을 임시로 쓴다. Tm을 입력하지 않으면 2.073을 전 구간에 쓴다.
- 4HB 함량은 mol%로 저장한다(2026-10-30, TARS DB 근거). 배합의 PHA 평균 4HB(wt% 가중)는 계산하지 않는다.
- CA grade는 PLA 매트릭스로 분류해 결정화 판정에서 뺐다. PLA 결정화(예: CA1165A·CA1180P 고내열 110–120 °C 금형)는 이 엔진이 모델링하지 않는다.
- 빨대 1차 필요시간은 thermal1d로 중심이 40°C에 도달하는 시간을 추정해 표시한다(추정됨). 2차 필요시간은 실측 입력이 있을 때만 쓴다.
- 시트 첫 nip은 R1 면과 반대면(R2 온도)이 동시에 닿는 고정온도 경계로 모델링했다.
