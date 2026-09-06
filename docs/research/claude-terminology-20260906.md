# Claude terminology review

Requested by the user; only the focused non-secret glossary/copy draft was sent through ask_claude. No repository access or tools were enabled for Claude. Result received 2026-09-06.

Local validation: CE correction and neutral reference wording adopted. Claude's suggestion to treat clamp inversion as an initial machine setting was NOT adopted: it is mean cavity-pressure capacity, not a machine setpoint. A1000P and CB0104A were checked against manufacturer TDS independently. No new process numbers were taken from the terminology review.

## (a) 우선 수정 오류 (우선순위순)

1. **"전도 엘리먼트" (CE)** — 오역. CE = conveying element = **이송 엘리먼트**. "전도"는 열전도로 오독됨.
2. **"PHA는 180°C 벽을 넘으면 열분해"** — 과잉 확신. 열분해는 온도×체류시간 누적 효과이며 등급별로 다름. "특정 온도 벽" 표현 삭제 → "온도가 높을수록·체류가 길수록 분해가 가속됨(등급별 상이)".
3. **"클램프 역산값을 리밋으로 설정하면 플래시 방지"** — "방지" 보장 불가. 출발점(starting point)일 뿐임. "플래시 위험을 줄이는 초기 설정값이며, 방지를 보장하지 않음"으로 수정. "V0"가 사내 코드라면 화면에는 "1단 사출압력 리밋" 등 일반 명칭 병기.
4. **"범위에서 10만큼 벗어남 = 위험/Critical"** — 임의 수치. 변수마다 단위·민감도가 달라 일괄 "10" 기준은 근거 없음. 이분법(Normal/Critical) 대신 **범위 안/범위 밖 + 적용 근거 미확인** 중립 표시로 교체.
5. **"PHA/PLA 모두 200ppm 이하 건조가 기본"** — 일반화 오류. 권장 수분치는 수지·등급·공정별로 다름. 수치를 단정하지 말고 "제조사 권장값 확인" + 해당 등급 자료 출처 표시로 변경.
6. **"cutter temperature 25±5°C이면 무조건 좋은 절단"** — "무조건" 삭제. 절단 품질은 스트랜드 온도·결정화 상태·칼날 상태 등에 좌우됨.
7. **"KB90 = 가장 강한 분산 혼합, 최대 전단 발열"** — 최상급 단정 부적절. 혼합 강도는 디스크 폭·블록 구성에 따라 달라짐. "혼합이 강하고 전단 발열이 큰 편(구성에 따라 다름)"으로 완화.
8. **A1000P "~100 (soft)"을 Tm 열에 표시** — 연화 관련 값을 융점 열에 넣으면 오독 유발. Tm 열에는 미기재하고 "제조사 표기값(연화 특성)" 별도 표기 + 검증 전 라벨. 새 수치를 만들어 넣지 말 것.
9. **CB0104A "아모르퍼스 P34HB 단일 soft phase"** — 형태학적 단정. 제조사 자료 근거가 화면에 없으면 "제조사 자료 기준" 라벨을 붙이고, 미확인이면 "적용 근거 미확인" 표시.
10. **"KB = 혼합 블록"** — 오류는 아니나 현장 통용어와 어긋남. **니딩 블록(혼련 블록)**으로 표기. LE/ZME 항목의 "(제조사별 코드 차이 있음)" 주석은 괄호가 아니라 항상 보이는 고정 문구로 승격 권장.

## (b) 권장 KO/EN 용어표 (수정 필요 항목만; 나머지 후보안은 그대로 사용 가능)

| 제안된 표기 | 권장 표기 | 이유 |
|---|---|---|
| 전도 엘리먼트 / CE | 이송 엘리먼트 / Conveying element (CE) | 오역 수정 |
| 혼합 블록 / KB | 니딩 블록(혼련 블록) / Kneading block (KB) | 현장 통용어 |
| 공정 시작 조건 / Trial starting conditions | 초기 시운전 조건 / Trial starting conditions | KO–EN 의미 일치 |
| 형체력 / Clamp force | 형체력 / Clamping force | EN 표준 표기 |
| 수지압 / Plastic pressure | 수지압(용융 수지 압력) / Plastic (melt) pressure | 초보자 이해 보조 |
| 가장자리 얇은 수지(플래시) / Flash | 플래시(버) — 파팅라인으로 밀려나온 얇은 수지 / Flash (burr) | 현장에서 "버"가 통용 |
| 배럴 내 수지 체류량 / Hot-polymer hold-up | 배럴 내 수지 체류량 / Barrel hold-up (melt inventory) | EN 명확화 |
| 블로업비(BUR) | 블로우업 비(BUR) / Blow-up ratio (BUR) | 통용 표기 |
| 게이트 고화 확인 / Gate-seal study | 게이트 고화(실) 확인 / Gate-seal study | 현장 용어 병기 |

미성형(쇼트 샷)/Short shot, 표면 꺼짐(싱크 마크)/Sink mark, 충전→보압 전환/V/P transfer, 인취 속도/Haul-off speed, 환형 다이/Annular die, 건조 공기 이슬점/Drying-air dew point, 실제 용융온도/Measured melt temperature, 범위 안·밖, 현장 수정값/Local override, 적용 근거 미확인/Applicability unverified 등 나머지 후보는 적절합니다.

## (c) 바로 쓸 수 있는 안내문 4개

1. **참고 범위 면책**
   - KO: 이 범위는 제조사 자료와 범용 참고값을 정리한 초기 시운전 조건입니다. 이 설비·금형에서는 아직 검증되지 않았으므로, 현장 확인 후 수정값을 저장해 사용하세요.
   - EN: These ranges are trial starting conditions compiled from manufacturer data and generic references. They are not validated on this machine and mold — verify on-site and save your local overrides.

2. **범위 밖 표시**
   - KO: "범위 밖"은 고장이나 불량을 뜻하지 않습니다. 참고 범위를 벗어났다는 표시이며, 판단은 실측 용융온도·성형품 상태와 함께 하세요.
   - EN: "Outside reference range" does not mean a fault or defect. It only flags a deviation from the reference — judge together with measured melt temperature and part quality.

3. **열분해 주의**
   - KO: PHA는 용융 상태에서 온도가 높을수록, 체류시간이 길수록 분해가 빨라집니다. 특정 온도 하나가 안전선을 뜻하지 않으며, 등급별 제조사 권장 조건을 확인하세요.
   - EN: In the melt, PHA degrades faster at higher temperatures and longer residence times. No single temperature is a safe limit — check the manufacturer's recommendation for your grade.

4. **예시 이미지 안내**
   - KO: 플래시 형상 이미지는 이해를 돕기 위해 생성한 예시이며, 실제 불량 사진이나 원인 판정 근거가 아닙니다.
   - EN: The flash illustration is a generated example for explanation only — it is not an actual defect photo or evidence of root cause.

**불확실성 메모**: 항목 6·7(A1000P, CB0104A)은 제조사 데이터시트를 확인하지 못한 상태의 검수이므로, 화면에는 값 자체를 수정하기보다 "제조사 자료 / 적용 근거 미확인" 라벨을 붙이는 방식을 권장합니다.
