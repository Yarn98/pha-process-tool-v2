# PHA Process 리뷰와 개선 — 2026-09-06

> 이 문서는 1차 검토 기록입니다. 이후 사용자 요청에 따라 GPT-6 Pro에 이 프로젝트의 8개 공정 조사를 새로 요청했고, 완료 답변을 받아 추가 수정·검증했습니다. 현재 상태는 [전체 가공 반영 보고서](ALL_PROCESSING_REVIEW_20260906.md)를 기준으로 합니다.

## 결론과 범위

이 앱은 참고표·규칙·계산·기록을 결합한 보조 도구입니다. 성형 결과에 대한 목적함수 최적화·양품 성공확률 검증은 확인되지 않았습니다. 제조사 원문과 미검증 참고값을 구분하고 잘못된 계산·자동 전이를 수정했습니다.

대상은 D:\My_PJT\Application\pha_optimizer_convertor 입니다. 시작 시 main...origin/main은 clean이었습니다. Web TARS 저장소는 근거 조회에만 사용하고 그쪽 작업물·모델 포인터를 변경하지 않았습니다. 배포·커밋·푸시는 실행하지 않았습니다.

## 발견과 조치

| 중요도 | 문제와 영향 | 조치 |
|---|---|---|
| P1 | CA1180P 로드시 talc 10 phr/wax 0.3 phr 예시를 영구 공통 override에 저장하여 다른 PLA/PHA에도 적용 | 자동 로더 제거. CA1180P 원문 우선. 이전 값 보존·자동 적용 중단. 새 값은 그레이드·공정·금형 모드별 |
| P1 | 형체력 역산을 V0 리밋으로 설정하면 플래시를 방지한다고 안내 | 평균 캐비티 압력 수용능력으로 정정. 유압·수지압과 구분. 정확한 /980.665 적용. README의 /98.0665 오류도 수정 |
| P1 | 모든 PHA를 65–80 °C 건조로 안내, A1000P Tm 칸에 연화 추정값, CB0104A를 단일 amorphous로 분류 | A1000P 본문/표 차이 명시. S1000P와 컴파운드 개별 자료 반영. 임의 배합비·단일상 자동입력 차단 |
| P1 | TARS 물성 Tm에서 배럴 Tm+5, 건조 60 °C × 6 h 생성. 미등록 재료에 기본 PHA 창 사용 | 물성과 공정 자료 분리. 근거 없는 설정값 생성 중단. 미확인 재료는 미확인 표시 |
| P2 | 갭식 g/2로 동일 질량수지 두께의 절반 출력 | g/(BUR×DDR). 단층·최종 필름 밀도·동일 밀도 가정 명시. My AI 동일 수정 |
| P2 | 역전된 냉각 온도도 Math.max로 결과 생성; 중심부 계수 누락 | 온도 순서 검증과 4/π 중심부 1차 근사. 전체 두께 정의·모델 한계 |
| P2 | 변수마다 다른 단위인데 10 이상 이탈=Critical, 범위 안=Normal | 중립 범위 상태로 변경. 고정 상한→즉시 설정 변경 지시를 관찰 기반 점검으로 수정 |
| P2 | f() 3/4인자 불일치로 단위 누락·영문 라벨 오류, CSS가 MPa/mm 대문자화 | 호환 스키마·한영 라벨·단위 보존. 언어 변경시 입력값 유지 |
| P2 | Flash 전역 선택자가 다른 가이드의 active 상태까지 변경 | #flash로 범위 제한 |
| P2 | 내장 물성이 매번 사용자 편집값을 덮어씀. MFR 조건 오표기와 Izod J/m→kJ/m² 오류 | 사용자 값 우선 보존. 잘못된 신규 기본값 제거. 별도 제조사 시험조건 표시. 과거 로컬 값은 삭제하지 않음 |
| P2 | 180 °C 벽·200 ppm 공통 기준, 함량으로 연속상/수조조건 확정, 절단 온도 SOP 단정 | 그레이드별 근거·열 이력 설명. 스크류·수조·절단 숫자는 내부 시험 참고 |
| P3 | 긴 고정 4단 지시표, 설비와 형상 설명 부족 | 점검 순서로 개편. Blender 설비 6종·단계 설명·생성 플래시 이미지 |

체류시간의 밀도(kg/m³) × 용적(L)/1000은 원래 맞았습니다. 최초 의심은 단위 확인 후 기각했습니다. 정상 식을 유지하고 양수·유한 입력만 검증했습니다.

## 원문과 적용

2026-09-06에 원문을 다시 확인했습니다. 정확히 대응하는 필드에만 제조사 출처를 붙이며 미기재 변수를 원문 수치라고 표시하지 않습니다.

| 자료 | 확인·반영 |
|---|---|
| [A1000P TDS 02/2024](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-A1000P.pdf) | amorphous. 건조 본문 <50 °C·4–6 h와 표 50 °C·5 h 구분. MFR 부등호·165 °C·5 kg 보존 |
| [S1000P TDS 3/2024](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-S1000P.pdf) | 개별 건조·일반 가공창. MFR 180 °C/2.16 kg, Izod J/m·노치 조건 |
| [CA1180P TDS 03/2023](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1180P.pdf) | 일반/고내열 금형·배럴·노즐·보압시간. 속도 %를 mm/s로 변환하지 않음. 구성과 정확한 배합비 구분 |
| [CB0104A TDS June 2026](https://cjbiomaterials.com/wp-content/uploads/2025/03/TDS-CB0104A.pdf) | scPHA+aPHA+CaCO3 사출 컴파운드, MFR 10 at 180 °C/2.16 kg, 건조·금형 |
| [CB0400A TDS June 2026](https://cjbiomaterials.com/wp-content/uploads/2024/11/PHACT%E2%84%A2-CB0400A.pdf) | 압출용 문서, MFR 3 at 175 °C/2.16 kg. 사출 근거로 승격하지 않음 |
| [RJG 형체력](https://rjginc.com/clamp-tonnage-more-is-better-right/) | 면적·캐비티 압력 관계; SI 단위환산 직접 검산 |
| [Coperion 엘리먼트](https://www.coperion.com/en/know-how/research-development/extrusion), [교육자료](https://coperion.com/media/3ebk3gnw/fes25_booklet-a4_web.pdf) | 니딩 90° 이송/혼합. ZME를 임의로 zone mixing·저전단으로 정의하지 않음 |
| [SPE IMD Spring 2017 p.7–8](https://www.injectionmoldingdivision.org/wp-content/uploads/2020/10/IMD-Spring-2017-Newsletter.pdf) | 냉각은 두께·열물성·금형·접촉·사이클 정의에 의존. 중심부 1차항을 전체 Fourier 급수로 교차검산 |

Web TARS injection_tab.js의 동일 자료 revision·조건 분리 방식을 확인했습니다. 참조 저장소 HEAD는 caa289acd3b8057d403191a46a4e0fe553ccdbaa 였습니다. 그 저장소는 다른 작업에서 변경될 수 있어 이번 수정은 원문과 이 프로젝트 코드를 기준으로 합니다.

TARS /api/grades 실조회: HTTP 200, 8종. 반환값은 재료명·물성·시험조건 등이며 공정 설정지는 없었습니다. 개발 화면의 실제 연결도 확인했습니다. 자동 회귀검사는 외부 변화와 분리하기 위해 명시적 API fixture를 사용합니다.

## GPT 조사와 Claude

완료된 [Injection 신뢰성 검토](https://chatgpt.com/c/6a9c1966-b144-83e9-9eee-167afaf539a6)를 회수해 [보존본](research/injection-review-retrieved-20260906.md)에 저장했습니다. Web TARS 이전 코드의 검토 결과이며 이 프로젝트 실행 결과는 아닙니다. 원문/보정/현장검증 분리와 압력·MFR 기준을 여기의 코드와 제조사 자료로 다시 검증했습니다.

2026-09-06 후속 확인에서 Web TARS의 [provider_session.json](D:/My_PJT/Application/4HB_P34HB-properties-modeling/output/gpt-pro-review-packs/injection-reliability-gpt6-pro-20260905/provider_session.json), 전송 기록, [답변 보존본](D:/My_PJT/Application/4HB_P34HB-properties-modeling/output/gpt-pro-review-packs/injection-reliability-gpt6-pro-20260905/provider_answer.md)을 대조했습니다. 기록에는 요청 모델 `GPT-6 Pro`, 전송 전 관찰 표시 `6 Pro`, 2026-09-05 22:30:07 KST 전송 1회, 완료 답변 회수 및 전사 대조 일치가 명시되어 있습니다. 따라서 위 사출 답변의 모델 근거를 확인했습니다. 당시 모델 표시를 이번에 직접 재관찰한 것은 아닙니다.

답변의 범위는 Web TARS **사출 탭 신뢰성 검토**입니다. 건조·MFR·실제 수지온도·체류시간·근거 표시 원칙은 다른 공정에도 참고할 수 있지만, 압출·시트·캐스트/블로운 필름·블로우 성형·컴파운딩 전체를 조사한 통합 결과는 아닙니다.

1차 검색 당시 별도의 전체 가공 조사본은 식별하지 못했습니다. 이후 사용자가 프로젝트 맞춤 조사 요청을 명시하여 [새 GPT-6 Pro 조사](https://chatgpt.com/g/g-p-67ac788743b88191b7ebf6f1377c1361-pha-gagong-jogeon/c/6a9cd7b7-31d0-83e8-ab94-e2b7d82887e1)를 한 번 전송했고, 6개 섹션의 완료 답변을 회수·검증·반영했습니다. 원문과 증거는 후속 보고서에 연결했습니다.

Claude 용어 검수는 실제 ask_claude 호출로 완료했습니다. [결과·채택 판단](research/claude-terminology-20260906.md)을 보존했습니다. 특히 압력 역산을 초기 기계 설정값으로 사용하라는 제안은 채택하지 않고 물리적으로 구분했습니다.

## 검증

- Node 핵심 검사 5개 통과: SI 형체력/역산, 질량보존·단층 두께, 냉각 확산 해·입력 순서, 그레이드/공정/모드 분리, 범위 판정.
- Playwright: 1440 px / 390 px × KO/EN × 6개 공정, 24개 조합에서 이미지·단계 버튼·페이지 가로 넘침 검사 통과.
- 이전 공통 수정값·사용자 밀도·이력 보존, 원문 우선, 미확인 API 재료, 배합 추정 차단, 언어 전환 입력 유지, UI/My AI 계산 일치, 하위 탭 분리, 수정값 격리 통과.
- 브라우저에서 잡히지 않은 JavaScript 오류 0.
- 기존 My AI 회귀검사 통과. 빌드/오프라인 최종 확인은 아래 완료 기록 참조.

기계 판독 결과: output/playwright/process-review-results.json. 화면: process-desktop-ko.png, process-mobile-ko.png, flash-shape-ko.png. 이는 독립 테스트 fixture 화면이며 사용자 현장 데이터가 아닙니다.

## 남은 실측 범위

실제 양품 성공률·공정창은 아직 검증하지 않았습니다. 1차 검토에 남았던 일반 계열 추천표·스크류 고정 온도·출처 없는 스트로 수조 숫자는 후속 전체 가공 검토에서 제거하거나 그레이드 원문으로 대체했습니다. 스크류 배치는 개념 설명으로 남습니다. 과거 로컬 물성에는 기존 시험조건 오류가 남아 있을 수 있어 원문과 비교해 사용자가 교정해야 합니다.

승격에 필요한 기록은 재료/lot/배합, 설비/금형, 실제 설정, 충전/보압/냉각 이력, 중량/치수/외관/기능입니다. 예측값으로 실측칸을 채우지 않습니다. 이번 작업에서 생산설비를 조작하거나 현장 시험을 수행하지 않았습니다.

## 1차 완료 기록

- 최종 dist 빌드 성공. 편집용 .blend 제외, 6개 설비 PNG와 생성 형상·새 JS/CSS 포함 확인.
- 최종 dist를 별도 서버로 실행한 24개 반응형/언어/공정 조합 검사 통과.
- 실제 서비스워커 설치 후 네트워크를 끈 재접속과 다른 공정 이미지 전환 통과.
- 그레이드 간 및 CA1180P 금형 모드 간 수정값 격리 통과.
- 새 설치의 S1000P/A1000P 밀도와 amorphous A1000P의 미지정 융점, 기존 사용자 값 보존을 각각 검사해 통과.
- 마지막 My AI 회귀검사 통과. 인라인 script 5개 구문 검사 및 git diff --check 통과.
- 로컬 완성 빌드를 Codex 브라우저에서 직접 확인. 기본 개발 서버는 127.0.0.1:8097, 미리보기 경로는 /dist/index.html.
- 파일 변경은 로컬에 남겨 검토 가능합니다. 커밋·푸시·배포 없음.
