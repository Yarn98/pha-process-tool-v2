# Flash guide terminology review — 2026-09-15

Claude was asked to review supplied bilingual wording only. Tools and file access were disabled; this was not a new source review or a live app test. The prompt included the terms, timeline labels, conceptual-model disclosure and conditional temperature directions, with no production data or credentials.

Local acceptance: clarify around-ejector, packing-applied timing, stop/revert criteria, visualization labels. Keep simple 'Mold vent' rather than treating every observed burr as confirmed excessive vent-land depth. Retain the existing primary-source-based thermal conditions. Do not adopt the response as engineering validation.

## Returned wording review

검수 결과 요약: 기술적 정의(V/P 전환, 쿠션, 캐비티 평균압력, 게이트 씰)와 조건부 조치 문구 3건은 정확하고 보수적이라 유지해도 됩니다. 고칠 필요가 있는 것은 주로 **한↔영 불일치**와 **비표준 영어 용어** 7건입니다. 제공된 문구만 근거로 판단했으며, 웹 조사나 앱 실행은 하지 않았습니다.

## 1) 수정 필요 항목

| 현재 (KO / EN) | 수정안 (KO / EN) | 이유 |
|---|---|---|
| 벤트 끝 / Vent edge | 벤트(랜드) 구간 / Vent (land) | "vent edge"는 비표준. 플래시는 벤트 랜드 깊이 초과 시 발생하므로 "vent land"가 통용 용어 (추론: 일반 사출 용어 기준) |
| 이젝터 핀 둘레 / Ejector pin | 이젝터 핀 둘레(핀 틈새) / Around ejector pin (pin clearance) | KO는 "둘레", EN은 핀 자체만 지칭 → 불일치. 발생 위치는 핀 틈새(clearance) |
| 충전 때부터 / During filling | 충전 중부터 / From filling onward | KO "~부터"는 시작 시점, EN "during"은 기간 → 분류 기준이 어긋남. 시점 분류 목적이면 "from ~ onward"가 일치 |
| 보압을 넣은 뒤 / After packing | 보압 시작 후 / After packing starts | "After packing"은 보압 **종료** 후로 오독 가능. 원인 분류(충전기 vs 보압기 플래시)에 치명적 모호성 |
| 다시 확인 / Verify | 다시 확인 / Re-check (또는 KO를 "검증"으로) | 다시 확인=re-check, Verify=검증. 어느 쪽이든 한 방향으로 통일 필요 |
| 중단·복귀 기준 / Stop or revert | 중단·복귀 기준 / Stop/revert criteria | EN에 "기준(criteria)"이 누락되어 명령문("중단하라")으로 읽힘 |
| 금형 펼쳐 보기 / Open mold for inspection | 금형 펼쳐 보기(시각화) / Mold open view (visualization) | EN이 "금형을 실제로 열어 점검하라"는 작업 지시로 오독 가능. 후속 문장의 "관찰용" 고지와 제목을 일치시켜야 함 |

추가 소소한 일관성: 제목 "캐비티 **면적** 평균압력" vs 본문 "**투영면적**" → 제목을 "캐비티 투영면적 평균압력 / Cavity-average pressure (projected area)"로 통일 권장.

## 2) 유지 항목 (중대한 오해 없음)

- **플래시(버) 정의**: 정확. "버(burr)"는 원래 기계가공 용어지만 현장 통용어로 병기하는 것은 무방.
- **금형 맞댐면 / Parting line**: 대응 정확 ("파팅라인" 병기 여부는 현장 관례에 따라 선택).
- **V/P 전환 정의**: 속도 제어→압력 제어 전환 시점 + "장비별 전환 기준 확인" 안내 모두 정확하고 보수적.
- **쿠션 정의**: 최전진 위치와 전진 한계 사이 잔여 거리/체적, "임의 목표값 없음" — 정확.
- **게이트 씰**: 열 게이트 고화 vs 밸브 게이트 기계적 닫힘 구분 — 정확하고 구분이 유익.
- **색상 범례·과장 고지**: "진행률은 시간·충전 체적·해석값이 아님" — 시각화 한계를 명시한 좋은 문구. ("과장된 설명"→"과장된 표현"이 자연스러움, 선택 사항.)
- **저온·충전 저항 문구**: 그레이드 범위 내 비교 + "막힌 유로·금형 손상을 승온으로 가리지 않음" — 안전한 조건부 구조.
- **멀티캐비티 문구**: 일부 플래시+일부 미충전 시 전체 압력 상승 대신 캐비티별 균형 확인 — 기술적으로 옳고 과잉 조치를 막는 핵심 문구. 유지.

## 3) 위험·단정 표현에 대한 조건부 대안

1. **"해당 원인 복구"** (분해 문구): "복구"가 "손상된 재료를 복구한다"로 오독될 수 있는데, 바로 뒤 문장이 "손상 재료는 냉각으로 정상화 안 됨"이라 자기모순처럼 보일 수 있음. 대안: **"해당 원인을 제거한 뒤 재개 / Remove the confirmed cause before resuming"**. 재료가 아니라 원인을 고친다는 점이 명확해짐.
2. **"MI 증가 하나로 분해를 확정하지 않음"**: 방향은 옳으나 "그럼 무엇으로 판단하나"가 비어 있음. 이미 앞 문장(과열·체류·수분·점도 저하 동시 확인)이 기준이므로, "MI 단독이 아니라 위 조건이 함께 확인될 때 판단"처럼 앞 문장과 연결하면 단정 없이 완결됨.
3. **"Act when confirmed"**: 단정적이지는 않으나 KO("조건이 맞을 때")와 미묘하게 다름. **"Act when conditions are met"**이 KO와 정합.

전반적으로 설정값·승온 폭을 추천하지 않는다는 원칙이 전 문구에서 지켜지고 있고, 조건부("확인되면 ~") 구조도 일관됩니다. 위 표의 7건은 대부분 번역 정합성 문제이지 기술 오류가 아니므로, 수정 범위는 좁게 유지하는 것을 권합니다.
