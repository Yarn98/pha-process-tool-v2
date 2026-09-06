# Retrieved research: Injection 신뢰성 검토

Retrieved 2026-09-06 from ChatGPT conversation https://chatgpt.com/c/6a9c1966-b144-83e9-9eee-167afaf539a6 . This is a completed prior research answer about the Web TARS injection tab, not a fresh local execution or an all-process PHA survey. The connector does not expose model identity or resolve the answer's historical citation tokens. Primary sources are independently checked in the accompanying project review before implementation.

Follow-up provenance check on 2026-09-06: the existing Web TARS [provider_session.json](D:/My_PJT/Application/4HB_P34HB-properties-modeling/output/gpt-pro-review-packs/injection-reliability-gpt6-pro-20260905/provider_session.json) records requested model `GPT-6 Pro`, observed composer label `6 Pro`, one send at `2026-09-05T13:30:07.070Z`, completed-answer retrieval, and a matching transcription check. Its conversation ID matches this retrieved answer. This verifies the historical model evidence from the saved session; the model selector was not directly re-observed in this follow-up. The associated [provider_answer.md](D:/My_PJT/Application/4HB_P34HB-properties-modeling/output/gpt-pro-review-packs/injection-reliability-gpt6-pro-20260905/provider_answer.md) also preserves resolved source links. The answer body below is unchanged.

## [요약]

**현재 Injection tab은 ‘공정 최적화기’가 아니라, 제조사 표와 고정 보정식으로 시작 조건을 만드는 도구로 판단됨.** 확인한 추천 경로에는 성형품 결과를 이용한 목적함수 최적화가 없음. 표시된 target도 각 범위의 중간값임.〔로컬 근거: `I:195–197, 683–800`〕

**제조사 권고창은 유용하지만, 현재 출력 전체를 그대로 신뢰하기는 어려움.** 순수 A1000P의 manual 모드 건조조건은 원문과 충돌함. CB0104A와 CB0400A에는 최신 TDS와 다른 MFR 기준값이 남아 있음. citeturn547172view2turn547172view1turn547172view0

**`0.95 / High`는 성형 성공확률이 아니라, 출처 분류에 부여한 고정 점수임.** 실제 금형·설비·lot·성형 결과가 없어도 동일하게 출력됨. 소프트웨어 테스트 통과는 계산 실행을 확인할 뿐, 양품 생산을 입증하지 못함.〔`I:857–865`; `T:1–155`〕

**판정은 ‘현 상태의 신뢰등급 승격 보류, 오류 수정 후 1차 시험용 활용 유지’임.** 선택 입력이 부족하다는 이유로 유용한 범위를 삭제할 필요는 없음. 다만 첫 조건 성공률이나 process window 개선 주장은 현장 검증 이후에만 가능함.

## [배경]

검토 기준은 첨부팩의 `main@7ac33195c41068810de7677737a8b57e09569134`임. `report.md`, 제공된 snippet, synthetic JSON을 검토하였음. 외부 자료는 2026-09-05 기준으로 제조사 원문과 표·페이지를 확인하였음.

첨부 JSON에서 canonical과 `for_LLM`의 기록된 결과는 일치하였음. 이는 새로운 엔진 실행이나 실험 검증이 아님. 테스트 **9/9 통과**와 live script 동일성은 첨부팩의 보고 결과임.

이하 `I`는 `injection_tab.js`, `T`는 `test/injection_engine.test.js`임. `A`는 `tars-integration.5df0cb6.js`, `P`는 `runtime_probe.json`임. 행 번호는 snippet 내부에 표시된 원본 기준임.

## [본론]

### 1. Merge 전 필수 수정 항목 — 우선순위순

#### 1) 순수 A1000P의 재료 식별과 건조조건을 먼저 수정해야 함

**동일 재료가 입력 모드에 따라 다른 건조창을 받는 문제가 확인됨.** Manual의 순수 A1000P가 일반 `PHA_dominant` 표로 들어감. 이 표의 건조조건이 A1000P 개별 권고보다 우선 적용됨.〔`I:278–294, 584–636, 720`; `P:surfaces.canonical.edgeCases`〕

| 비교 대상 | 건조조건 | 판정 |
|---|---:|---|
| 현재 순수 A1000P manual 결과 | **70–80°C, 4–5 h** | 개별 재료 원문과 충돌함 |
| 현재 A1000P preset 결과 | **50°C, 4–6 h** | 원문 표·본문의 차이를 별도 표시해야 함 |
| A1000P TDS, 02/2024, p.1 | **50°C, 5 h** | 원문 표에 기재됨 |
| 동일 TDS, p.2 | **50°C 미만, 4–6 h** | 건조 본문의 권고임 |
| 동일 TDS, p.2 | 습한 조건의 **60°C** 노출에서 응집 경고 | 건조 상한 관리의 직접 근거임 |

원문 내부에도 표의 `50°C`와 본문의 `50°C 미만` 차이가 있음. 따라서 preset의 50°C 자체를 명백한 오기라고 단정해서는 안 됨. 반면 manual의 70–80°C는 유지할 근거가 없음. 제조사 확인 전에는 본문의 더 제한적인 조건을 우선 표시하는 것이 타당함. citeturn628382view2turn547172view2

**수정 방향:** `injBuildState()`에서 명시된 순수 grade를 보존해야 함. Manual 모드에서 비활성 preset 선택값을 다시 사용하는 방식은 금지해야 함. Dry blend와 이미 제조된 compound pellet의 건조 근거도 구분해야 함.

이는 응집이 실제 발생했다는 진단이 아님. **응집 위험에 영향을 줄 수 있는 추천 경로의 오류가 확인된 것임.**

#### 2) 오래된 MFR 기준값을 갱신하고, 미검증 온도·속도 보정과 분리해야 함

**수치 갱신과 MFR 추정 구조 수정은 별개의 작업임.** 기준값만 고쳐도 혼합 조건, 하중 누락, 부등호 소실 문제는 남음. MFR은 아래와 같이 원값과 시험조건을 함께 보존해야 함.

| Grade | 확인한 제조사 원문: MFR, g/10 min | 현재 코드 | 수정 사항 |
|---|---|---|---|
| CB0104A | **10**, 180°C / 2.16 kg; June 2026, p.1 | `[25,30]`; 혼합 추정 경로에는 `27`도 존재 | DB와 별도 anchor를 함께 갱신함 |
| CB0400A | **3**, 175°C / 2.16 kg; June 2026, p.1 | `5`, 190°C / 2.16 kg | 값과 시험온도를 함께 갱신함 |
| A1000P | **<5**, 165°C / 5 kg; 02/2024, p.1 | DB는 `~5`, 추정에는 `5` 사용 | 부등호와 하중을 보존함 |
| S1000P | **<4**, 180°C / 2.16 kg; 3/2024, p.1 | DB의 `<`가 추정 단계에서 소실됨 | 상한값을 정확한 측정값으로 취급하지 않음 |

근거는 `I:3–68, 638–674`와 제조사 원문임. CB0400A는 값과 시험온도가 동시에 바뀌었으므로 점도 변화로 단순 해석할 수 없음. 문서 개정의 이유와 기존 공급 lot에 대한 적용 범위는 별도 확인 사항임. citeturn547172view1turn547172view0turn628382view2turn752462view9

현재 `injMfiReference()`는 서로 다른 조건의 값을 weighted median으로 묶음. 일부 조성에서는 A1000P와 PLA/aPHA anchor의 가중 대상도 겹침. `injEstimateMfiAtTemp()`는 고정 기울기로 온도 환산 후 공정 보정에 사용함. 이는 측정된 shear-viscosity curve가 아님.〔`I:638–681, 789–795`〕

ASTM D1238-26의 공개 설명도 MFR을 경험적 지표로 규정함. 시험조건과 실제 가공조건의 차이로 직접적인 가공성 상관이 성립하지 않을 수 있음. 따라서 현재 합성값으로 melt temperature와 속도를 자동 변경하는 근거는 부족함. citeturn127256view0

**수정 방향:** 원문 MFR과 기존 flow 지표는 모두 표시하되 구분해야 함. 검증되지 않은 합성값에 의한 자동 온도·속도 보정은 기본 추천에서 분리해야 함. 실측 MFR 입력에는 온도·하중·시험법을 저장해야 함.

한 가지 중요한 반론도 있음. 현행 식을 유지하면 CB0104A의 170°C 환산값은 약 **16.57 → 6.03**으로 바뀜. 그러나 둘 다 보정 문턱인 `<4`, `>25`에 해당하지 않음. **따라서 MFR 갱신만으로 기본 온도·속도 recipe가 개선되는 것은 아님.**〔`I:657–674, 789–795`; 현행 식 재계산〕

#### 3) 원문 범위, 조건부 보정, 신뢰도 표시를 분리해야 함

**상용 grade의 원문 범위를 변경한 뒤에도 `TDS_DIRECT`가 유지됨.** 또한 복합 grade의 proxy 조성을 실제 배합처럼 공정 보정에 사용함. 이미 해당 grade에 대한 권고창에 포함된 효과를 다시 더할 가능성이 있음.〔`I:35–101, 683–800, 887–895`〕

| 사례 | 제조사 기준 또는 코드 기준 | Synthetic 출력 | 문제와 영향 |
|---|---|---|---|
| CB0104A mold | TDS **60–70°C** | **69–79°C** | CaCO₃ 보정 +5°C와 결정성 보정 +4°C가 누적됨 |
| CA1180P high-HDT mold | TDS **110–120°C** | **115–125°C** | 고온 mode 선택 후 내열 우선 보정이 다시 추가됨 |
| CA1180P injection speed | TDS **10–25%** | 최종 **29–54%** | 공통 preset 25–50%에 낮은 추정 MFR 보정이 추가됨 |
| CA1180P hold time | TDS **5–25 s** | **5–14 s** | Grade 고유 범위가 공통 기본값으로 대체됨 |
| A1000P nozzle | TDS **130–165°C** | **126–161°C** | A1000P 비율 보정으로 원문 범위가 이동됨 |

근거는 `I:689–715, 754–795`와 `P`의 preset·edge case 결과임. 원문 온도·속도·시간은 제조사 표에서 확인됨. citeturn547172view1turn547172view3turn628382view2

여기서 **CA1180P의 고온 금형 mode 자체는 오류가 아님.** 제조사가 일반용과 고내열용을 구분하고 있음. 문제는 고온 mode에 보정을 중복 적용하는 경로임. 또한 장비 `%`가 같아도 실제 속도가 같다는 보장은 없으므로, 출력 비율만으로 유량 차이를 단정해서는 안 됨. citeturn547172view3turn752462view6

**상용 preset에는 원문 기준을 기본으로 유지해야 함.** 추가 충진제 등 실제 변경분에만 별도 보정을 적용하는 구조가 타당함. 원문을 벗어나는 후보는 `조건부 시험 제안`으로 표시해야 함. TDS 권고 범위와 절대적인 안전 한계도 동일시해서는 안 됨.

신뢰도 역시 분리해야 함. 현재 `0.95`는 출처 가중합이며, 일부 family 전이 표도 `TDS_DIRECT`임. 이를 **출처 수준 / 적용 일치도 / 현장 검증 상태**로 나누는 것이 타당함.〔`I:721–723, 857–865`〕

기존 UI에 ‘시작창’이라는 설명은 이미 존재함. 따라서 전체 UI가 최적화를 보장한다고 비판하는 것도 부정확함. 다만 “시작하는 것이 안전합니다”라는 문구는 현재 근거 수준보다 강함. 중간값은 `범위 중간값`으로 표시하고 `최적값`으로 해석되지 않도록 해야 함.〔`I:125–149, 195–197, 988–1006`〕

#### 4) 입력의 실제 역할과 물리적 단위를 정리해야 함

**모든 입력이 무효인 것은 아니지만, 설비 맞춤 추천처럼 보이는 정도에 비해 반영 범위가 좁음.** 첨부 sensitivity 결과는 아래와 같음.

| 입력군 | 첨부 진단에서 확인된 반응 | 필요한 조치 |
|---|---|---|
| Tonnage, screw diameter, gate, runner, hot runner | Recipe·confidence·risk 변화 없음 | 계산·호환성 검사·기록 중 실제 역할을 명시함 |
| Zone count, mold controller, reverse-profile, V/P 센서 선호 | 동일하게 변화 없음 | 미반영 입력을 맞춤 보정 근거로 표시하지 않음 |
| 최소·최대 두께 | 변화 없음 | 평균 두께만 반영한다는 한계를 표시함 |
| 평균 두께 | 얇은/두꺼운 두 구간의 계단식 보정 | 연속적인 두께 최적화로 표현하지 않음 |
| `residenceShots` | 경고만 변경됨 | 체류시간 계산값과 구분함 |
| 실측 MFR 입력 | 일부 melt·속도 변경 | 시험조건과 적용 근거를 함께 관리함 |

근거는 `I:732–814, 828–854`와 `P:surfaces.canonical.sensitivities`임. 추가로 0·음수 두께도 recipe가 생성됨. 평균 두께 3 mm와 8 mm의 시간 recipe도 동일함. 전자는 입력 검증 결함이며, 후자는 현행 두께 모델의 해상도 한계임.

**Tonnage가 온도에 영향을 주지 않는 것 자체는 결함이 아님.** 모든 입력에 임의 계수를 붙이는 방식은 피해야 함. Screw diameter는 속도·유량 환산에 활용할 수 있음. 장비 압력은 hydraulic/plastic pressure 기준을 구분해야 함. citeturn752462view6turn752462view7

즉시 검증할 조건은 양의 두께와 입력 간 순서임. 선택값 미입력은 0으로 치환하지 않고 `unknown`으로 관리해야 함. Controller의 yes/no만으로 고온 mode의 실행 가능성을 단정해서도 안 됨. 실제 설비 한계가 확인된 경우에만 해당 mode의 비호환성을 표시해야 함.

#### 5) Feedback 저장과 검증 범위를 실제 시험 기록에 맞춰야 함

**현재 저장 payload는 시험 결과가 아니라 pending 메모에 가까움.** Grade, application, pending verdict, 고정 문장만 전송함. 실제 설정지·성형 결과·수동 조성이 저장되지 않음. 확인한 `injPredict()`에는 feedback 조회 경로도 없음.〔`A:865–896`; `I:828–925`〕

현재 버튼은 초안 저장으로는 사용할 수 있음. 그러나 이를 학습 또는 추천 개선의 증거로 볼 수는 없음. Manual 모드에서도 선택된 preset 명칭을 저장할 위험이 있음. 저장할 재료 식별자는 계산에 실제 사용한 state에서 가져와야 함.

**API 등록 경로의 실제 동작은 추가 확인이 필요함.** `A:731–742`는 `INJ_GRADE_DB`를 직접 참조함. 반면 제공된 `I:1–2`의 DB는 closure 내부 선언임. 공개 연결 코드가 첨부 범위 밖에 있어, API 기본값이 live 추천에 적용된다고 단정할 수 없음.

부모 agent는 **등록 → 선택 → state → recipe** 경로를 시험해야 함. 이 경로가 활성화된다면 `Tm`만으로 만든 온도 범위도 검증해야 함. 단순 정상 실행 테스트와 물리적 타당성 테스트를 구분해야 함. 기존 `T:1–155`는 주로 실행·조성·경도 정합성 검사임.

### 2. 파라미터별 추천 계약

**기존 값을 지우기보다, 어떤 종류의 값인지 명확히 하는 것이 우선임.** 아래의 공통 preset 수치는 `I:703–715` 기준임. 각 family의 기존 범위도 같은 원칙으로 유지할 수 있음.

| 파라미터 | 계속 표시할 값·범위 | 적용 조건과 필요한 실측 |
|---|---|---|
| **Drying** | S1000P **80°C, 5 h**; CB0104A **75°C, 4 h**; A1000P는 앞서 구분한 원문 표·본문 | Grade별 조건을 우선함. Dry blend와 compound를 구분함. 실제 건조 이력·dew point·가능한 경우 수분을 기록함 |
| **Barrel / melt** | S1000P melt **145–175°C**, A1000P **135–175°C**, CB0104A **165–175°C** 등 원문 profile | Barrel 설정과 실제 melt temperature를 분리함. Feed throat와 feed zone을 구분함. Zone 수는 장비별 위치 대응에 사용함 |
| **Mold temperature** | CB0104A **60–70°C**; CA1180P 일반 **40°C**, 고내열 **110–120°C** | Controller 설정과 실제 금형 표면온도를 구분함. 순수 A1000P의 기존 **55–70°C**는 직접 TDS가 아닌 미검증 family 참고값으로만 표시함 |
| **Speed / fill time** | CA1180P **10–25%** 원문 우선. 공통 **25–50% / 12–30%**, **0.7–1.5 s**는 미검증 기본창으로 구분함 | `%`를 장비 간 직접 전송하지 않음. 가능한 경우 mm/s 또는 cm³/s와 단계 종료 위치를 기록함. 실제 fill time으로 조정함 |
| **V/P 전환** | 기존 **94–97% fill**을 충전 목표 참고값으로 유지함 | Screw stroke의 동일 %로 변환하지 않음. Fill-only 부품·중량·cushion·압력 응답으로 위치를 정함. Cavity sensor는 선택 사항임 |
| **Hold pressure / time** | 기존 **30–45% / 18–30% of peak**; CA1180P 시간은 **5–25 s** 우선 | Peak의 측정 구간과 pressure basis를 정의함. 실제 압력과 각 단계 시간을 기록함. Gate-seal 시험으로 총시간을 정함 |
| **Cooling / cycle** | 공통 **10–20 s / 18–34 s**는 잠정 시작창으로 유지함 | Cooling timer의 시작점과 hold·recovery 중첩을 정의함. Cycle은 실제 동작 시간표로 검증함. 후육부 탈형·변형·치수 안정성을 확인함 |
| **Residence** | 현행 장기 체류 경고를 유지함 | `2.5 shots`를 검증된 한계로 표시하지 않음. 실제 고온 수지 inventory·shot mass·cycle·정지 시간을 구분함 |

제조사 온도·건조 기준은 각 TDS에 근거함. 실제 melt temperature, 금형 표면온도, fill time과 압력 기준의 구분은 RJG의 장비 독립 설정 자료에서도 강조됨. citeturn752462view9turn628382view2turn547172view1turn547172view3turn752462view6turn752462view7turn752462view8

Gate seal은 적절한 fill·pack 조건에서 보압시간을 늘려 중량 plateau를 확인하는 방식이 타당함. 다만 plateau만으로 전체 품질이 검증되는 것은 아님. 치수·외관·기능과 함께 판정해야 함. citeturn127256view2

Residence의 정상상태 평균은 아래 물질수지로 추정할 수 있음.

\[
\bar t_{\mathrm{res}}
\approx
\frac{M_{\mathrm{hot}}}{\dot m}
=
\frac{M_{\mathrm{hot}}}{M_{\mathrm{shot}}}\,t_{\mathrm{cycle}}
\]

여기서 \(M_{\mathrm{hot}}\)은 고려한 유로 내 고온 수지 inventory임. 최대 shot capacity나 cushion과 동일한 값이 아님. 이 계산도 평균값일 뿐 정체부·정지 시간의 영향을 대체하지 못함. 제조사 역시 고온 장기 체류에 대한 주의를 별도로 제시함. citeturn628382view1

출력 데이터는 최소한 아래 항목을 분리하는 것이 권장됨.

`원문 범위 → 적용 조건 → 보정 내역 → 시험 제안 범위 → 시작값 선정 방식 → 현장 검증 상태`

선택 입력의 누락은 설명과 불확실성을 추가하는 사유임. **전체 recipe를 공란으로 만드는 사유가 아님.** 불가능한 입력이나 확인된 비호환성은 해당 항목에서 차단해야 함. 물리적 범위를 제시할 근거가 없는 경우에도 원문 참고값과 정성 지침은 남길 수 있음.

### 3. 실용적인 단계별 개선 설계

#### 3.1 지금 가능한 개선과 저입력 추천

**첫 단계는 새로운 모델보다 원문·규칙·표시의 정합성 수정임.** `INJ_GRADE_DB`, `injBuildState()`, `injMfiReference()`를 먼저 정리해야 함. 이후 `injBaseRecipe()`와 `injAdjustRecipe()`에서 원문과 보정을 분리해야 함. `injPredict()`와 UI·JSON에는 동일한 출처 상태가 전달되어야 함.

저입력 추천은 기존 grade/조성·application·두께 입력을 유지하는 방식이 타당함. Dry blend 여부는 건조조건에 영향을 줄 때만 확인하면 됨. 설비 상세값은 속도 환산이나 호환성 판단이 필요할 때 단계적으로 요청할 수 있음.

시작값은 무조건 중간값으로 고정할 필요가 없음. 동일 조건의 승인된 설정지가 있으면 그 근거를 우선 제시할 수 있음. 그렇지 않으면 grade 원문과 기존 family 창을 사용하면 됨. CB0104A처럼 저속 권고가 있으면 이를 시작값 선택 근거로 명시해야 함. citeturn628382view1

#### 3.2 실제 보정에 필요한 최소 현장 증거

다음은 **미리보기의 필수 입력이 아니라, 현장 보정 기록의 최소 구성**임.

| 기록 묶음 | 확보할 내용 |
|---|---|
| 재료 | Grade·lot·배합 기준·추가 첨가제·dry blend/compound 구분·건조 이력 |
| 금형·설비 | 식별 ID·cavity 수·대표 및 문제부 두께·gate/runner·사용 장비와 pressure basis |
| 실제 공정 | 추천 snapshot과 실제 설정지·fill time·V/P·cushion·압력·hold·cooling·cycle·가능한 실제 melt/금형 온도 |
| 결과 | Shot/cavity별 중량·불량 유형·치수·외관·기능 판정·conditioning·조정 순서·폐기 및 중단 기록 |

측정하지 못한 값은 추정치로 채우지 않아야 함. MFR을 보정 변수로 사용할 때만 해당 온도·하중의 실측값이 필요함. 수분이나 온도를 측정하지 못했다면 결측 상태를 저장해야 함. 결과 해석의 범위도 그만큼 제한해야 함.

#### 3.3 권장 시험 순서와 판정 기준

아래는 **아직 수행하지 않은 권장 시험 설계**임.

| 순서 | 시험 내용 | 판정·후속 의사결정 |
|---|---|---|
| 1. 기준 조건 고정 | 원문 오류를 수정한 추천 또는 승인된 현장 조건을 control로 지정함 | 도면·외관·기능·cycle 기준을 시험 전에 확정함. 문제가 확인된 과거 조건을 비교 목적으로 재사용하지 않음 |
| 2. Fill / V/P 설정 | 열적 안정화 후 가용 범위에서 fill-only 평가를 수행함 | 충전 상태·cavity 균형·압력 제한·cushion 반복성을 보고 전환점을 정함 |
| 3. Hold 설정 | Fill 조건을 고정하고 보압시간을 단계적으로 변경함 | 중량 plateau와 치수·외관을 함께 확인함. 필요한 압력과 시간의 조합을 정함 |
| 4. Cooling 설정 | 충전·보압을 고정하고 냉각시간을 평가함 | 탈형 손상·변형·conditioning 후 치수를 확인함. Cycle 단축과 품질의 절충점을 정함 |
| 5. 국소 DOE | 가용 범위의 세 인자로 **2³ factorial 8조건 + center point 3조건**을 검토함 | 예시는 melt·mold·fill rate임. 초기 선형·교호작용을 평가하고 곡률이 있으면 RSM으로 확장함 |

Gate-seal 평가 방법은 Beaumont 자료에 근거함. Center point를 통한 곡률·drift 확인은 NIST 지침에 근거함. 위 **11조건 구성은 본 검토의 제안**이며 이미 입증된 최적 설계가 아님. citeturn127256view2turn354105view1turn354105view2

초기에는 조건별 연속 5 cycle을 측정하는 소규모 pilot을 검토할 수 있음. 이는 독립 campaign 5회의 반복을 뜻하지 않음. 금형온도 변경이 어려우면 block으로 관리해야 함. CA1180P의 일반·고내열 mode는 별도 범주로 평가해야 함.

온도·속도·보압·냉각의 조치는 각각 부작용도 기록해야 함. 충전 개선과 함께 flash나 압력 상승 여부를 확인해야 함. 냉각시간 증가는 생산성과 고온 체류에 미치는 영향도 평가해야 함. 어느 한 물성이나 외관만 개선되었다고 전체 조건을 승격해서는 안 됨.

**성공률의 정의부터 고정해야 함.** 최초 추천 조건의 안정화 후 통과와 실제 첫 shot 통과를 분리해야 함. 조정 후 얻은 양품을 최초 조건 성공으로 소급 집계해서는 안 됨. 중단·실패 campaign도 분모에 포함해야 함.

검증 데이터는 shot을 무작위 분할하는 방식만으로 충분하지 않음. 동일 금형의 새 campaign, 새 lot, 새 금형을 각각 분리하여 검증해야 함. 금형 하나만 시험했다면 일반화 주장도 그 범위로 제한해야 함. 필요한 반복 수는 실제 편차와 검출하려는 개선폭을 바탕으로 정해야 함.

### 4. 후순위로 둘 수 있는 항목 — 순서대로

| 순위 | 후순위 항목 | 선행 조건 |
|---|---|---|
| 1 | 전체 형상 기반 CFD·정밀 충전/냉각 해석 | 기본 추천의 필수 전제로 두지 않음. 난이도 높은 금형부터 선택 적용함 |
| 2 | 범용 rheology·결정화 모델과 전면적인 ML 보정 | 조건이 정리된 실제 데이터와 단순 모델의 기준 성능을 먼저 확보함 |
| 3 | 자동 feedback 학습·성공확률 표시·자동 추천 승격 | Snapshot과 결과 데이터의 신뢰성 및 독립 검증을 먼저 확보함 |

**현장 검증 자체는 후순위가 아님.** 위 항목은 자문형 오류 수정 merge 이후로 미룰 수 있음. 반면 성공률·공정창 개선을 주장하려면 앞서 제시한 검증이 필요함.

### 5. 부모 agent의 정확한 다음 작업

| 순서 | 작업 | 완료 판정 |
|---|---|---|
| **1** | 확인한 TDS의 URL·개정일·페이지·파일 hash와 원문값을 저장함 | CB0104A·CB0400A 변경 및 A1000P/S1000P 부등호가 추적 가능함 |
| **2** | 재료 routing, MFR 참조, preset 보정, provenance를 수정함 | 순수 A1000P의 모드별 충돌이 해소됨. 원문값이 무표시 변경되지 않음 |
| **3** | 회귀 테스트와 synthetic probe를 확장함 | 0·음수 두께, MFR 하중·부등호, CA1180P mode, 장비 단위, UI/JSON 일치가 검증됨 |
| **4** | API 등록 경로와 trial 저장 경로를 검증함 | 실제 사용 state·추천 version·설정 snapshot을 저장함. Pending과 실측 결과가 구분됨 |
| **5** | 사용자 실제 campaign 기록을 받아 현장 시험계획을 확정함 | 합격 기준·control·시험 순서·hold-out 범위를 사전 문서화함 |

## [결론]

**즉시 수정할 핵심은 A1000P 건조 routing, 최신 TDS 반영, 원문과 보정의 분리임.**

**기존 범위는 1차 시험용으로 유지하되, `0.95 / High`를 성형 신뢰도로 제시해서는 안 됨.**

**실제 금형·설비·lot·설정지·결과가 확보되어야 첫 조건 성공률과 process-window 개선을 검증할 수 있음.**

## [출처]

| 자료 | 개정·페이지 | 본 검토에서 사용한 근거 |
|---|---|---|
| :chatgpt-content-reference{index="13"} | 생성일 2026-09-05 | 원본 행 번호, synthetic probe, 테스트·live 동일성 보고 |
| [CJ Biomaterials CB0104A TDS](https://cjbiomaterials.com/wp-content/uploads/2025/03/TDS-CB0104A.pdf) | **June 2026**, pp.1–2 | MFR, 건조·금형·melt 조건, 저속 사출 및 장기 체류 주의 |
| [CJ Biomaterials A1000P TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-A1000P.pdf) | **02/2024**, pp.1–2 | MFR 부등호·하중, 건조 표·본문 차이, 응집 경고 |
| [CJ Biomaterials CA1180P TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1180P.pdf) | **03/2023**, pp.1–2 | 속도·hold time·온도 profile·일반/고내열 금형 mode |
| [CJ Biomaterials CB0400A TDS](https://cjbiomaterials.com/wp-content/uploads/2024/11/PHACT%E2%84%A2-CB0400A.pdf) | **June 2026**, p.1 | MFR 3 및 175°C / 2.16 kg 조건 |
| [CJ Biomaterials S1000P TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-S1000P.pdf) | **3/2024**, p.1 | MFR `<4`, 건조·melt 권고 |
| [ASTM D1238-26](https://store.astm.org/d1238-26.html) | **2026**, 공개 설명 §5.1–5.3 | MFR의 경험적 성격과 실제 가공성 해석의 한계. 유료 본문은 미열람 |
| [RJG — Revalidation Using Universal Setup Data](https://rjginc.com/wp-content/uploads/2018/09/revalidation_using_machine_independent_data.pdf) | 문서 개정일 미표기, PDF pp.3–5 | 실제 melt·금형 온도, fill time, 장비 독립 속도·압력 |
| [Beaumont — Gate Seal](https://www.beaumontinc.com/injection-molding-glossary/gate-seal/) | 개정일·페이지 미표기, Gate Seal 절 | 보압시간 증가와 성형품 중량 plateau 평가 |
| [NIST — Factorial Center Points](https://www.itl.nist.gov/div898/handbook/pri/section3/pri337.htm), [Response Surface Designs](https://www.itl.nist.gov/div898/handbook/pri/section3/pri336.htm) | 개정일·페이지 미표기, §5.3.3.7 및 §5.3.3.6 | Center point, 곡률 확인, 후속 RSM 설계 |
