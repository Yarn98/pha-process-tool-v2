# Claude 쉬운 용어·문장 검수 — 2026-09-15

사용자의 명시적 요청에 따라 새 Flash 가이드 전체의 8개 경로·그레이드 설명·체크리스트·용어집·UI 문구를 전달했습니다. 전송 자료는 21106문자이며 생산 기록·키·비밀번호를 포함하지 않습니다. Claude는 문구만 검수했고 도구·파일·웹 접근은 사용하지 않았습니다.

로컬 반영: 17개 제안은 채택, 8개는 기술적 뜻을 보존해 조정했습니다. 쿠션은 사이클 중 최전진 위치에서 전진 한계까지 남은 거리/체적이며, 보압 종료 시점의 잔류 질량으로 한정하지 않습니다. 공극은 제품 내부 빈 공간이며 기포와 같은 원인으로 단정하지 않습니다. 게이트 고화와 밸브의 기계적 닫힘, 두 보압 구간, MI의 시험 조건을 구분했습니다. 숫자·출처·분기 ID는 유지했습니다.

## 반환 원문

## 1) 전체 판정

전반적으로 조건부 표현·모형/실물 구분·과장 금지 원칙이 잘 지켜져 있습니다(텍스트 검토 기준이며, 출처 원문의 과학적 타당성을 별도로 검증한 것은 아닙니다). 반영이 필요한 부분은 세 갈래입니다: ① 처음 읽는 작업자를 위한 전문용어 첫 등장 시 짧은 풀이 부재(V/P 전환, 쿠션, 캐비티, 벤트 랜드, 형체력, MI, 쇼트/싱크/공극, mold breathing, P1/P2), ② 한 문장 안에 판단 기준이 압축돼 이해 부담이 큰 문장 2곳(inspect.verify, 쿠션 정의), ③ KO/EN 라벨 불일치·행동 예측이 어려운 버튼 3곳("관찰부터 해결까지"↔"OBSERVE → VERIFY", "충전만 비교"↔"Separate filling", "틈 확대"). 보압 발생 시점 문구 1곳은 "보압 중"과 "보압 적용 후"가 섞여 읽힐 수 있어 명확화가 필요합니다.

## 2) 반영 항목 (25건)

```json
[
  {"target":"routes.pack.when.ko","old":"충전만 한 제품에는 없던 버가 보압을 적용한 뒤 생길 때입니다.","replacement":"충전만 한 제품에는 없던 버가, 보압까지 적용한 제품에서 보일 때입니다.","reason":"'적용한 뒤'가 보압 종료 후로 오독될 수 있어 비교 대상(충전만 vs 보압까지)을 명시"},
  {"target":"routes.pack.when.en","old":"Use this when flash appears after packing but is absent from the fill-only comparison.","replacement":"Use this when flash appears on packed parts but not on the fill-only comparison parts.","reason":"'after packing'의 시점 모호성 제거, KO 수정과 일치"},
  {"target":"routes.fill.when.ko","old":"충전만 한 제품에도 버가 있거나 충전 말기·V/P 전환에 압력 피크가 보일 때입니다.","replacement":"충전만 한 제품에도 버가 있거나, 충전 말기나 V/P 전환(속도 제어에서 압력 제어로 바꾸는 시점)에서 압력이 급히 오를 때입니다.","reason":"V/P 첫 등장에 짧은 풀이, '압력 피크'를 쉬운 말로"},
  {"target":"routes.fill.when.en","old":"Use this if flash is present on fill-only parts or pressure peaks occur near end of fill or V/P transfer.","replacement":"Use this if flash is present on fill-only parts, or pressure spikes near the end of fill or at V/P transfer (the switch from speed control to pressure control).","reason":"V/P 첫 등장 풀이, KO와 대응"},
  {"target":"routes.inspect.check.ko","old":"버의 위치·캐비티 번호를 표시합니다. 충전 형상, 쿠션과 압력 기록을 확인하고 핀 자국·취출 찢김과 구분합니다.","replacement":"버의 위치와 캐비티(제품이 만들어지는 금형 공간) 번호를 표시합니다. 충전 형상, 쿠션(사출 후 스크류 앞에 남는 수지량)과 압력 기록을 확인하고 핀 자국·취출 찢김과 구분합니다.","reason":"캐비티·쿠션 첫 등장에 짧은 풀이(용어집은 화면 하단이라 첫 독자가 놓치기 쉬움)"},
  {"target":"routes.inspect.verify.ko","old":"각 캐비티의 버·충전과 중량을 비교합니다. 냉각 후 중량 비율을 전환 순간 체적 충전율로 읽지 않습니다.","replacement":"각 캐비티의 버·충전 상태·중량을 비교합니다. 식은 제품의 중량 비율을, 전환 순간에 캐비티가 얼마나 찼었는지로 그대로 읽지 않습니다.","reason":"'체적 충전율' 압축 표현이 처음 읽는 작업자에게 난해"},
  {"target":"routes.inspect.verify.en","old":"Compare flash, fill and mass for each cavity. Cooled-part mass percentage is not the volume fill percentage at transfer.","replacement":"Compare flash, fill and mass for each cavity. The mass percentage of a cooled part does not show how full the cavity was at the moment of transfer.","reason":"KO 수정과 동일한 취지의 평이화"},
  {"target":"routes.fill.stop.ko","old":"조기 전환으로 말단이 얼거나 쇼트·가스 탄 자국이 늘면 복귀합니다. 버가 계속되는 국부 접촉면은 정비를 확인합니다.","replacement":"조기 전환으로 흐름 끝이 굳거나 미충전(쇼트)·가스 탄 자국이 늘면 이전 조건으로 복귀합니다. 같은 자리에 버가 계속되면 금형 접촉면 정비를 확인합니다.","reason":"'쇼트' 첫 등장 풀이, '국부 접촉면' 명확화, 복귀 대상 명시"},
  {"target":"routes.fill.stop.en","old":"Revert if earlier transfer freezes the flow front or increases shorts/burns. Persistent local flash calls for a tool-contact check.","replacement":"Revert if earlier transfer freezes the flow front or increases short shots (incomplete parts) or burn marks. Persistent flash at the same spot calls for a tool-contact check.","reason":"'shorts/burns' 약칭을 첫 독자용으로 풀어 표기"},
  {"target":"routes.pack.check.ko","old":"전환 전 과충전, 전환 압력 응답과 보압 전달을 확인합니다. 열 게이트 고화와 밸브 게이트 닫힘은 구분합니다.","replacement":"전환 전 과충전, 전환 시 압력 응답과 보압 전달(보압이 캐비티 안까지 미치는지)을 확인합니다. 열 게이트의 고화(수지가 굳어 막힘)와 밸브 게이트의 기계적 닫힘은 구분합니다.","reason":"'보압 전달'·'고화' 첫 등장에 짧은 풀이"},
  {"target":"routes.pack.action.ko","old":"과도한 보압이 확인되면 보압을 낮추는 비교부터 진행합니다. 시간은 필요한 게이트 씰에 맞춰 검토하며 P1/P2 비율을 고정 처방하지 않습니다.","replacement":"과도한 보압이 확인되면 보압을 낮추는 비교부터 진행합니다. 보압 시간은 게이트가 굳어 닫히는 데(게이트 씰) 필요한 시간에 맞춰 검토하며, P1/P2(1차/2차 보압) 비율을 고정 처방하지 않습니다.","reason":"'시간'의 대상 명시, 게이트 씰·P1/P2 짧은 풀이"},
  {"target":"routes.pack.verify.ko","old":"시간별 중량 안정화와 함께 캐비티별 버·치수·싱크·내부 공극을 확인합니다.","replacement":"보압 시간에 따른 중량 안정화와 함께 캐비티별 버·치수·싱크(표면 꺼짐)·내부 공극(기포)을 확인합니다.","reason":"싱크·공극 첫 등장 풀이, '시간별'의 기준 명시"},
  {"target":"routes.pack.verify.en","old":"Check mass stabilization versus hold time together with cavity-specific flash, dimensions, sinks and internal voids.","replacement":"Check mass stabilization versus hold time together with cavity-specific flash, dimensions, sink marks (surface depressions) and internal voids (bubbles).","reason":"sinks/voids 첫 독자용 풀이"},
  {"target":"routes.parting.check.ko","old":"이물·마모·손상·접촉 상태, 금형 지지·정렬과 실제 형체력을 확인합니다. 분해 점검은 정지·격리 후 진행합니다.","replacement":"이물·마모·손상·접촉 상태, 금형 지지·정렬과 실제 형체력(금형을 닫아 누르는 힘)을 확인합니다. 분해 점검은 설비 정지·격리 후 진행합니다.","reason":"형체력 첫 등장 풀이, 정지 대상(설비) 명시"},
  {"target":"routes.parting.verify.en","old":"Check flash and mold breathing together with venting, burns and tool load. Maximum tonnage is not the goal.","replacement":"Check flash and slight mold opening (mold breathing) together with venting, burn marks and tool load. Maximum tonnage is not the goal.","reason":"'mold breathing'을 풀이와 병기(KO는 이미 '미세 벌어짐'으로 평이함)"},
  {"target":"routes.vent.check.ko","old":"벤트 랜드·깊이·마모·오염과 수리 이력을 원래 승인된 형상과 비교합니다. 말단 쇼트·탄 자국도 함께 봅니다.","replacement":"벤트 랜드(배기 홈이 얕고 평평하게 이어지는 구간)·깊이·마모·오염과 수리 이력을 원래 승인된 형상과 비교합니다. 흐름 끝의 미충전(쇼트)·탄 자국도 함께 봅니다.","reason":"벤트 랜드는 용어집에도 없는 전문용어라 첫 등장 풀이 필수"},
  {"target":"routes.vent.check.en","old":"Compare vent land/depth, wear, contamination and repair history with the approved geometry. Also check end-of-fill shorts and burns.","replacement":"Compare the vent land (the shallow flat section of the vent) and its depth, wear, contamination and repair history with the approved geometry. Also check end-of-fill short shots and burn marks.","reason":"vent land 풀이, shorts/burns 풀어 표기"},
  {"target":"routes.heat.when.ko","old":"가열·대기 후 버가 늘거나 실제 수지온도·MI 변화가 함께 보일 때 확인할 가설입니다.","replacement":"가열·대기 후 버가 늘거나 실제 수지온도·MI(용융지수: 수지가 얼마나 잘 흐르는지 나타내는 값) 변화가 함께 보일 때 확인할 가설입니다.","reason":"MI 첫 등장 풀이(용어집에도 없음)"},
  {"target":"routes.heat.when.en","old":"Consider this hypothesis if flash grows after heating/idle time or accompanies changes in actual melt temperature or MI.","replacement":"Consider this hypothesis if flash grows after heating/idle time or accompanies changes in actual melt temperature or MI (melt flow index, a measure of how easily the resin flows).","reason":"MI 첫 등장 풀이"},
  {"target":"routes.resistance.check.ko","old":"실제 온도·히터/온조기, 러너·게이트 제한·배기·캐비티 균형을 확인합니다. 손상된 틈새와 과열 저점도 문제를 먼저 구분합니다.","replacement":"실제 온도와 히터·온조기, 러너(수지가 지나가는 금형 통로)·게이트의 막힘, 배기, 캐비티 균형을 확인합니다. 금형 틈새 손상 문제와 과열로 점도가 낮아진 문제를 먼저 구분합니다.","reason":"러너 첫 등장 풀이, '과열 저점도' 압축 표현 평이화"},
  {"target":"glossary[쿠션].definition.ko","old":"스크류가 가장 전진했을 때 전진 한계까지 남는 거리 또는 그에 대응하는 수지 체적입니다. 측정 영점·단위와 변동을 확인합니다.","replacement":"사출이 끝나 스크류가 가장 앞으로 갔을 때, 스크류 앞에 남아 있는 거리(또는 그만큼의 수지량)입니다. 측정 영점·단위와 샷마다의 변동을 확인합니다.","reason":"이중 한정('전진했을 때 전진 한계까지')이 첫 독자에게 난해"},
  {"target":"glossary[쿠션].definition.en","old":"The remaining screw travel to its forward limit at the furthest-forward position, or the corresponding melt volume. Check measurement zero, units and variation.","replacement":"The distance (or the equivalent amount of melt) left in front of the screw at its furthest-forward position after injection. Check the measurement zero, units and shot-to-shot variation.","reason":"KO 수정과 동일한 취지의 평이화"},
  {"target":"ui['관찰부터 해결까지'].en","old":"OBSERVE → VERIFY","replacement":"From observation to resolution","reason":"KO '관찰부터 해결까지'와 의미 불일치(VERIFY≠해결), 기호식 표기 제거"},
  {"target":"ui['충전만 비교'].en","old":"Separate filling","replacement":"Compare fill-only parts","reason":"'Separate filling'만으로는 단계의 실제 행동(충전만 한 제품 비교)을 예측할 수 없음"},
  {"target":"ui['틈 확대'].ko","old":"틈 확대","replacement":"틈 확대해 보기","reason":"'틈 확대'가 물리적으로 틈을 키우는 조작으로 오독될 수 있음(EN 'Inspect gap'과 정합)"}
]
```

## 3) 유지해야 할 조건·유의점

1. **조건부·가설 어조를 그대로 유지**: "확인되면", "가설입니다", "확정 진단이 아닌 조건부 점검", "선택만으로 실제 원인을 판정하지 않습니다" 같은 문구는 평이화 과정에서 단정형으로 바꾸지 마세요. 이번 검토는 문구 검토이며 13개 출처의 과학적 타당성 검증이 아니므로, 근거 강도를 올리는 수정은 하면 안 됩니다.
2. **키/ID/숫자·그레이드 범위 불변**: routes/checklist의 id, sources 배열, CB0104A(June 2026 TDS)·CA1180P의 그레이드별 서술 범위를 유지하고, 보편적 온도·속도·보압비·벤트 깊이 숫자를 새로 넣지 마세요("출처 없는 숫자는 비워 둡니다" 원칙 유지).
3. **모형·실물 구분 고지 유지**: "금형 열기는 내부 관찰용", "과장 표현", "생성 이미지·치수 기준 아님", "계산값을 기계 설정으로 바로 쓰지 않습니다" 등의 한계 고지는 삭제·축약 대상이 아닙니다. 인라인 풀이는 각 용어의 첫 등장 1회만 넣고, 상세 정의의 기준은 용어집(glossary)으로 유지하세요.
