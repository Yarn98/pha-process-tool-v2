# 1. 직접 판정과 우선순위별 수정사항

## [요약]

**현재 버전은 ‘그레이드별 최초 가공조건 추천기’로 배포하기 전에 수정이 필요함.** 핵심 문제는 최신 TDS의 일부 값을 가져온 뒤, 나머지 항목을 근거 없는 family 조건으로 채우는 구조임. CB0104A를 비정질 PHA로 분류하는 오류와 blend 조건의 일괄 산술평균이 실제 출력에 영향을 주고 있음. 반면 형체력 환산, 블로운 필름의 단층 질량수지, 평판 중심부 냉각 근사식은 현재 구현을 유지할 수 있음.

**우선 차단할 대상은 잘못된 숫자의 자동 출력이지, 계산기와 정성적 지침 전체가 아님.** 스트로 온도 경험식, 검증되지 않은 생산속도 기록, 이축의 고정 온도표는 추천 경로에서 제거해야 함. 정확한 그레이드·공정에 대응하는 제조사 값은 조건부 최초 시험 근거로 유지하는 것이 타당함. 제조사 자료에서도 CB0104A의 사출 조건과 CA1165A의 조건은 분명히 다르게 제시되어 있음. 

## [검토 범위와 전제]

[첨부 검토팩](sandbox:/mnt/data/pha-all-processing-gpt6-pro-20260906.zip)의 `report.md`를 먼저 읽었음. 이후 본문 파일 5개, 코드 발췌 7개, 기존 테스트를 검토하였음. 검토 질문은 **적용 그레이드 → 수치·계산 → 원인·대책 → 검증·기록 보존**으로 구분하였음.

대상은 `local working tree 2026-09-06, not deployed`임. 아래 코드 위치는 첨부된 원본 파일의 행 번호임. 다만 전체 저장소가 아닌 발췌팩이므로, 미첨부 함수와 실제 브라우저 동작까지 확인한 것으로 확대하지 않았음.

| 구분    | 이번 검토에서 확인한 범위                                                      |
| ----- | ------------------------------------------------------------------- |
| 코드 사실 | 첨부 파일의 정적 검토와 원본 계산·추천 조립 함수의 제한적 실행                                |
| 외부 근거 | 제조사 공개 TDS, 장비사·공정기술 자료, 원저 논문                                      |
| 미확인   | 고객 설비, 실제 불량률, 실제 melt temperature, 내부 실측·보정 데이터                    |
| 판정 표현 | **확인됨**: 코드·출처 사실 / **판단됨**: 근거에 따른 수정 판단 / **미확인**: 출력 근거 부족       |
| 처리 기준 | **유지**: 현재 기능 유지 / **수정**: 근거·조건·표현 변경 / **미산출**: 해당 추천 숫자를 출력하지 않음 |

## 1.1 우선순위별 오류와 코드 위치

아래 우선순위는 현장 오사용 가능성과 부작용을 기준으로 한 판단임.

| 우선순위   | 코드 위치                                                                                        | 확인된 문제                                                        | 구체적 처리                                                           |
| ------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| **P0** | `index.html:1862–1875`, `getReco()`                                                          | TDS에 없는 항목을 `RECO`로 보충함. 결과적으로 한 화면에 제조사 값과 무근거 값이 섞임         | **field별 출처가 없는 추천값은 미산출**. `...base`에 의한 보충을 제거함                |
| **P0** | `index.html:1617`, `1649–1656`                                                               | CB0104A가 `PHA_AMOR` 조건을 상속함                                   | 독립 compound record로 변경함. 단순히 `PHA_SEMI`로 바꾸는 것으로 끝내지 않음          |
| **P0** | `index.html:1862`, `1867–1869`                                                               | 모든 blend 조건을 50:50으로 평균함. `Math.round()`가 die gap 등 소수값도 정수화함 | **공정조건 산술평균 폐기**. 실제 배합비를 넣은 평균식으로 고치는 것도 부적절함                   |
| **P0** | `straw-guide.js:98–103, 129–142, 612, 649`                                                   | `T_die=171.1+0.034N`과 190/200°C 색상 판정의 보정 데이터가 없음             | 온도 예측·색상·추천 경로에서 제거함. 감사 이력에는 ‘근거 미확인으로 철회’만 남김                  |
| **P0** | `straw-guide.js:315–335, 585–603`                                                            | 안정 생산속도와 ‘실측’ 온도가 제시되지만 실측 자료가 첨부되지 않음                        | 실측·장기 안정·최대속도 주장을 삭제함. 역사적 실험으로도 표현하지 않음                         |
| **P0** | `compounding-guide.js:14–59, 631–655`                                                        | side-feed/vent의 25°C가 **배럴 설정온도**로 출력됨                        | 고온 배럴, feedstock, feed throat/port 냉각을 별도 필드로 분리함                |
| **P0** | `troubleshooting_kb.json:2–100`; `compounding-guide.js:103–106`                              | feeder 우회, solvent flush, vent 청소에 정지·감압·격리 조건이 없음            | 조성 제어와 안전 조건을 포함하여 재작성함. 운전 중 분해·수동 청소 지침으로 읽히지 않게 함             |
| **P1** | `index.html:1622–1624, 1711–1713`                                                            | CA1670P·CA1680의 “Blow Molding”이 EBM으로 연결될 수 있음                | 제조사 자료의 **ISBM과 EBM을 분리**함. `CA1680` 명칭은 `CA1680P`와 동일성 확인 후 이관함 |
| **P1** | `index.html:1628–1629`; `pha-integration.js:83–101`                                          | PHA/PBSA가 순수 PBSA 조건을 상속함. 일반 PHA 표기가 S1000P로 해석될 수 있음        | generic blend는 성분 식별과 공정 근거가 없으면 숫자 미산출함                         |
| **P1** | `process-evidence.js:20–25`                                                                  | CA1180P 건조를 60°C × 5 h로 단정함                                   | 표와 본문의 **<60°C, >5 h** 차이를 병기함. 60°C 자동 목표값을 막음                  |
| **P1** | `index.html:2232–2249`                                                                       | P1 30–45%, P2 15–30%를 계산한 뒤 실제 보압 유지 지침으로 제시함                 | 고정 비율 추천을 제거함. 사용자 지정 비율 계산과 gate-seal 시험을 분리함                   |
| **P1** | `compounding-guide.js:243–293, 581–606`                                                      | filler 안정성 순위, 조성 임계값, torque/pressure 감소를 통한 분해 확정이 무검증임     | 후보 원인·검증항목으로 변경함. CaCO₃ 우선, soft phase 분리투입을 보편 규칙으로 두지 않음       |
| **P1** | `process-evidence.js:47–52, 61–70`; `straw-guide.js:123–137`; `compounding-guide.js:536–589` | 잘못된 range 길이, 비정상 gap, `Infinity`, 불완전 배합에서도 출력 가능함           | 입력 오류와 결측을 분리함. 오류 상태에서는 이전 결과까지 숨김                              |
| **P1** | `custom.js:677–730`; `index.html:1719–1727`                                                  | 온라인 JSON과 fallback의 의미 일치가 보장되지 않음                            | 하나의 canonical KB에서 양쪽을 생성하고 한영 동등성을 시험함                          |
| **P2** | `index.html:2213–2226`                                                                       | 20,000/50,000 s⁻¹ 판정 분기가 남아 있으나 후속 문구로 덮어씀                    | 현재 활성 오류로 과장하지 않음. 재활성화를 막기 위해 dead code를 삭제함                    |

CB0104A는 S1000P·A1000P·CaCO₃ compound로 명시되어 있음. CA1670P·CA1680P의 별도 성형 조건은 **Injection Stretch Blow Molding**으로 제시되어 있음. 따라서 위 분류 수정에는 직접적인 제조사 근거가 있음. 

## 1.2 원본 함수 실행으로 재현한 결과

다음은 현장 시험이 아닌 **첨부 코드의 합성 입력 실행 결과**임.

| 실행 조건                          | 현재 출력                                                                         | 판정                                         |
| ------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------ |
| CB0104A / injection            | 배럴1 140–155°C, 배럴3 155–165°C, 속도 30–120 mm/s, 사출압 50–100 MPa 등이 TDS 값과 함께 출력됨 | 비정질 family의 잔여 조건이 실제로 유입됨                 |
| CB0400A / extrusion            | die 165–180°C, RPM 40–90, pressure 60–150 bar, cooling roll 15–25°C           | CB0400A 전용 extrusion record가 아닌 일반 PHA 조건임 |
| CA1270P / blown film           | die 180–188°C, die gap **1–2 mm**                                             | 평균·반올림 결과임. 제조사 die gap 1.0–1.5 mm와 다름     |
| PLA/aPHA 90/10과 80/20          | 사출 추천 객체가 완전히 동일함                                                             | 배합비를 반영하지 않는 것이 확인됨                        |
| PHA/PBSA 70/30과 순수 PBSA        | 압출 추천 객체가 완전히 동일함                                                             | 순수 수지 조건의 잘못된 상속이 확인됨                      |
| `blownFilm(..., gap=Infinity)` | 오류 없이 두께 18.6146… µm 출력                                                       | 잘못된 입력이 ‘gap 미입력’처럼 처리됨                    |
| `status(0.5,[0,1,2])`          | `ok`                                                                          | range 구조 검증이 부족함                           |

CA1270P의 제조사 자료에서 die gap 1.0–1.5 mm와 BUR 2.0–3.0이 확인됨. 현재 BUR가 우연히 이 범위와 같더라도, 평균 생성 로직의 타당성을 뜻하지 않음. 

---

# 2. 8개 공정 전체 검토표

| 공정            | 유지 가능한 내용                                                          | 잘못되었거나 근거 부족한 조건                                                       | 대체 규칙·현장 확인 항목                                                                | 근거 수준                 |
| ------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------- |
| **사출**        | 실제 melt와 setpoint 구분, 충전·보압 분리, 형체력 계산, CB0104A·CA1180P의 직접 TDS 항목 | CB0104A의 비정질 상속, 범용 속도·압력·냉각시간, 고정 P1/P2 비율                            | grade 전용 TDS 필드만 출력함. fill-only, cavity balance, gate seal, 탈형 변형으로 조정함       | 직접 TDS 확인. 양품 조건은 미검증 |
| **일반 압출**     | 건조·공급 안정, 평균 체류시간, 실제 melt·압력 추세 관찰                                | 모든 형상에 같은 die·RPM·압력·roll 조건 적용                                        | strand/pellet, profile/tube 등 실제 후단 구성을 선택함. 없는 roll·accumulator 필드는 숨김       | 장비 구성에 따른 해석          |
| **시트**        | 두께·폭·속도·토출의 질량수지, roll 접촉·냉각 균일성                                   | 모든 PHA의 3-roll 15–25°C, 공통 line speed와 roll RPM                        | CA1670P·CA1680P는 해당 sheet TDS로 분리함. roll별 설정은 접촉 위치·직경·속도와 함께 기록함             | 직접 sheet TDS 있음       |
| **블로운 필름**    | 단층 두께 계산, BUR, 동일 밀도 가정하의 DDR                                      | 범용 FLH 200–600 mm, air 15–25°C, take-up 10–60 m/min, A1000P 전 공정 적합 판정 | CA1270P는 gap 1.0–1.5 mm·BUR 2–3을 해당 grade에 한해 유지함. bubble 안정·두께·blocking을 확인함 | 직접 film TDS 있음        |
| **압출 블로우 성형** | parison 형상·처짐·pinch-off·blow timing을 분리하는 진단                       | 범용 blow 6–12 bar, mold 20–35°C, cool 20–80 s, ISBM grade의 자동 전용        | 정확한 EBM grade·head 구조가 없으면 숫자 미산출함. hanging time, wall map, weld, 누설·낙하를 평가함  | 일반 EBM 원리만 간접 적용      |
| **캐스트 필름**    | free-standing film의 질량수지, pinning·air gap·roll 접촉 검토               | 전 grade의 chill roll 10–18°C, 코팅용 조건의 직접 전용                             | grade-specific film TDS만 적용함. neck-in, draw resonance, 박리, 권취 blocking으로 검증함  | 직접 film TDS와 원저 사례 있음 |
| **이축 컴파운딩**   | 용융·혼합·분리투입·탈기·압력 형성의 기능 구분, 시험기록                                   | 고정 40/44/48D, 145–165°C profile, side-feed 25°C, 조성만으로 Type 확정         | Type A/B/C를 **구성 후보**로 유지함. 설비·feedability·실제 melt·분산·분해를 확인해 선택함             | 장비사 원리 + 조성별 원저       |
| **스트로**       | 길이·개수·질량으로 계산하는 선속도·토출량·물구간 통과시간                                   | 온도–개수 경험식, 4.2 s 보편 기준, 수지 함량별 bath train, booster·peroxide·PLA 단정     | lane 수와 실제 유효 길이를 반영함. 수온은 grade별 자료로 제한함. sizing·ovalization·절단·후수축을 평가함     | 기하 계산 유지. 열·품질 모델 미확인 |

시트와 캐스트 필름을 무조건 저온 roll로 묶을 근거는 없음. CA1670P·CA1680P의 sheet TDS는 roll 25–55°C를 제시함. 별도 원저에서는 PHA cast film을 roll 60°C에서 제조하였음. 다만 후자의 수치를 S1000P 또는 임의 blend의 대체 기본값으로 복사해서는 안 됨. 

A1000P를 모든 성형 공정에서 ‘부적합’으로 바꾸는 것도 타당하지 않음. 제조사는 여러 가공 용도를 제시하고 있음. 그러나 이것이 neat A1000P의 안정 bubble, EBM parison 또는 자립형 스트로를 보증하지는 않음. **용도 소개와 특정 형상의 공정 검증을 분리해야 함.** ([CJ 바이오소재][1])

---

# 3. 현재값 → 수정값·문구 → 정확한 근거

## 3.1 숫자를 유지하거나 대체할 수 있는 항목

여기서 ‘즉시 적용’은 **앱의 출처 기반 표시를 수정할 수 있음**을 의미함. 해당 숫자로 현장에서 양품이 확보되었다는 의미는 아님.

| 대상·현재값                                                | 수정값 또는 표시 방식                                                                                                                                                            | 출처·개정·위치                                          | 처리                                     |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| **S1000P**: TDS 일부와 family 사출값 혼합                     | 건조 **80°C × 5 h** 유지. Feed **120–130°C**, TDS의 Melt/Compression/Nozzle **145–175°C**, screw **80–150 rpm**을 원래 항목명으로 보존함. 사출압·속도·금형·냉각시간은 보충하지 않음                       | S1000P TDS, **3/2024**, pp.1–2                    | 즉시 표시 수정. 일반 processing 자료임을 명시        |
| **A1000P**: 건조 `<50°C`는 이미 반영됨                        | 본문 **<50°C, 4–6 h**를 유지함. 표의 **50°C × 5 h**와 차이를 계속 표시함. Feed **40°C**, Melt **135–175°C**, Compression/Nozzle **130–165°C**를 구분함                                       | A1000P TDS, **02/2024**, pp.1–2                   | 현재 엄격 부등호 유지. 전 공정 숫자 상속 차단            |
| **CB0104A**: 배럴1 140–155°C 등이 추가됨                     | **Feed 25–40°C**, Melt/Compression/Nozzle **165–175°C**, Mold **60–70°C**, 건조 **75°C × 4 h**. 임의 배럴3·압력·속도 범위는 삭제함                                                      | CB0104A TDS, **June 2026**, p.1; 건조·주의 p.2        | 즉시 적용                                  |
| **CA1180P**: 건조 60°C × 5 h로 단정                        | 건조 표 **60°C × 5 h**와 본문 **<60°C, >5 h**를 병기함. Feed throat **20–40°C**, Feed **155–175°C**, Compression **170–185°C**, Metering **175–185°C**, Nozzle **175–190°C**를 분리함 | CA1180P TDS, **03/2023**, pp.1–2                  | 즉시 표시 수정. 건조 목표값 자동 입력 금지              |
| **CA1180P**: 범용 속도 30–120 mm/s                        | TDS의 **10–25%**만 별도 표기함. 기계의 % 기준을 모르면 mm/s로 환산하지 않음. Mold **40°C**와 고내열 목적 **110–120°C**는 모드 분리를 유지함                                                                   | 동일 TDS, p.1                                       | 즉시 적용. 속도·보압 종료는 현장 확인                 |
| **CA1165A**: PLA/aPHA 평균 조건                           | 건조 **60°C × 5 h**, Feed **25–40°C**, Melt/Compression **175–185°C**, Nozzle **180–185°C**, Mold **110–120°C**를 전용 record로 등록함                                           | CA1165A TDS, **3/2025**, pp.1–2                   | 즉시 적용. 저온 금형은 별도 목적·수축 검증 필요           |
| **CA1670P·CA1680P / sheet**: 평균 profile, roll 15–25°C | Feed **20–40°C**, Melt zone **165–175°C**, Mixing/Conveying **175–185°C**, Nozzle **165–190°C**, Roll **25–55°C**를 해당 sheet 용도로 표시함                                     | 각 TDS, **03/2023**, p.1                           | 즉시 표시 수정. 실제 zone 대응은 설비별 확인           |
| **CA1670P·CA1680P / EBM**                             | EBM 추천 미산출. 제조사 별도 성형표는 **ISBM**임                                                                                                                                       | 각 TDS, p.2                                        | 즉시 분류 수정                               |
| **CA1670P·CA1680P / drying**: 같은 family 건조로 묶일 가능성    | CA1670P는 **<60°C, >5 h**, CA1680P는 **<40°C, >12 h**로 각각 보존함                                                                                                             | 각 TDS, **03/2023**, p.3                           | 즉시 분리. 서로 같게 정규화하지 않음                  |
| **CA1270P / blown film**: gap 1–2 mm                  | **1.0–1.5 mm**, BUR **2.0–3.0**으로 수정함. low-stalk·dual-lip air ring은 적용 조건으로 표시함                                                                                         | CA1270P 공개 TDS, **June 2026**, p.2; 렌더에서도 해당 값 확인 | 즉시 적용                                  |
| **generic PBS**: 일괄 160–170°C 등                       | 실제 grade가 **BioPBS FZ91PM/FZ91PB**일 때만 processing **140–160°C**, gap **0.8–1.0 mm**, blown BUR **2–4**를 제시함                                                             | PTT MCC TDS **No.299**, 개정일 미표기, p.2              | 정확한 grade 선택 후 적용. PBSA·PHA/PBS로 전용 금지 |

위 숫자는 각 제조사 자료에서 확인하였음. S1000P·A1000P는 일반 processing 항목이고, CB0104A·CA1165A는 사출용 항목임. 따라서 항목 이름이 비슷하다는 이유로 같은 zone 번호에 직접 넣어서는 안 됨. ([CJ 바이오소재][2])

CA1670P·CA1680P의 sheet 표에는 상기 범위와 함께 165–175°C의 온화한 가공을 권하는 주석이 있음. 이 주석을 삭제하거나 nozzle 190°C를 보편 허용 상한으로 바꾸면 안 됨. 두 grade의 건조 조건도 원문상 다르므로 각각 보존해야 함. 

### 공개 PDF의 판독 불일치로 별도 관리해야 하는 항목

**CB0400A와 CA1270P에서는 추출 본문과 일부 페이지 렌더가 서로 다른 내용을 반환하였음.** CB0104A 등 다른 자료와 달리, 아래 항목은 동일 개정본의 일관된 페이지 확인이 완료되지 않았음. 이를 제조사의 오류로 단정하지는 않음. 다만 이 상태에서 ‘최신 PDF 표까지 모두 교차검증됨’으로 기록할 수는 없음.

| 대상                            | 공개 본문에서 확인된 대체 후보                                                                                                                                    | 교차확인 문제                                   | 앱 반영 판단                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| **CB0400A / extrusion·straw** | June 2026 본문 p.2: Feed **25–40°C**, Solid conveying·Compression/Melting **165–175°C**, Metering **165°C**, Die **160–165°C**, Water bath **70–75°C** | 렌더 p.2는 온도표 대신 구형 형태의 startup 지침을 반환함     | 현재 family 추천은 즉시 차단함. **위 값은 원문 확인 후보로 보존하고 동일본 PDF 확인 후 활성화** |
| **CA1270P / extrusion**       | June 2026 본문 p.2: Feed throat **20–40°C**, Solids conveying·Melting **165°C**, Metering·Adapters **170°C**, Die **160–165°C**                        | p.1·p.3은 June 2026 형식이나 p.2 렌더는 다른 배치·내용임 | 평균 profile은 즉시 제거함. 온도표 활성화는 동일본 확인 후 진행                       |
| **CA1270P / drying**          | **75°C × 4 h**, dew point **−35°C**, 가공 전 moisture **<400 ppm**                                                                                      | 이 건조 내용은 추출 본문과 렌더에서 일치함                  | 표시 가능함. neat A1000P의 건조조건으로 대체하지 않음                            |
| **CA1270P / web tension**     | 현재 문서에 **28–40 N/mm**가 기재됨. 2023 문서는 이를 **0.25–0.35 pli**와 병기함                                                                                       | 두 단위값이 일치하지 않음                            | **장력 추천 미산출**. 어느 단위가 오기인지 임의 수정하지 않음                          |

CB0400A의 구형 렌더에 있는 motor 300–400 rpm도 새로운 권장값으로 복구하면 안 됨. 최신 추출 본문은 저속에서 시작하여 압출·인취·절단을 동기화하도록 변경되어 있음. 두 표현의 버전 차이를 먼저 해결해야 함. 

CA1270P의 장력 단위 불일치는 수학적으로 확인됨. `pli=lbf/in`일 때 0.25–0.35 pli는 약 **0.0438–0.0613 N/mm**임. 이는 원문의 28–40 N/mm와 같지 않지만, 계산된 환산값을 곧바로 권장 장력으로 채택할 수는 없음. 

## 3.2 근거가 없어 숫자를 철회해야 하는 항목

| 현재 주장·값                                              | 수정값 또는 조건부 문구                                             | 판단 근거                                            | 처리                      |
| ---------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------ | ----------------------- |
| 모든 PLA/PHA/PBAT/PBS/PBSA의 family 공정표                 | “정확한 grade·공정의 수치 근거가 없어 추천값을 산출하지 않음”                    | 서로 다른 제조사·grade의 자료를 하나의 범위로 취급할 수 없음            | 자동 숫자 미산출. 수동 기록 기능 유지  |
| 스트로 `T_die=171.1+0.034N`                             | “개수 생산속도만으로 die-exit 온도를 예측하지 않음”                         | 보정 자료·설비·조성·적용영역 미첨부                             | 계산·색상·가이드에서 제거          |
| `tcrit=4.2 s`, “충분”, “물구간 연장 필요”                     | `tcrit` 기본값 제거. “사용자 지정 통과시간 기준 충족 여부”로 변경                | 통과시간 충족과 냉각·결정화·절단 적합성은 다름                       | 시간 기준이 없으면 N 상한 미산출     |
| 400 str/min 이상 열화, 457 str/min 한계                    | “현재 line의 한계속도는 확인되지 않음”                                  | 해당 실측·연속운전 자료 없음                                 | 삭제                      |
| PHB-rich booster 12–20 wt%, silicone/silica 0.15 wt% | 첨가제 identity·active content·carrier·시험결과가 있을 때만 별도 시험안 표시 | 함량과 개선 효과의 근거 없음                                 | 기본 처방 삭제                |
| 이축 Type A/B/C의 고정 온도·L/D                             | 기능 배치 후보만 표시. 온도·element geometry는 grade·설비 근거가 있을 때 입력   | 실제 PHBV/A1000P compounding에 **33D**를 사용한 원저도 존재함 | 무조건 40D 이상·44D 필수 규칙 삭제 |
| torque −15%, pressure −20% → 분해                      | “공급량·온도·충전율 변화와 분해 가능성을 함께 확인함”                           | torque·pressure는 분자량의 전용 측정값이 아님                 | 확정 진단과 고정 threshold 삭제  |
| RPM↓, Q↑, side feed가 항상 유리                           | 용융 부족·분산·torque·vent flooding·체류 꼬리와 함께 판단함               | 장비사도 premix와 split-feed를 용도별로 구분함                | 조건부 후보로 유지              |
| 모든 PHA moisture ≤500 또는 ≤200 ppm                     | grade별 기준과 측정법을 따름                                        | 공급·가공 기준이 grade마다 다름                             | 공통 합격선 삭제               |
| PLA는 190°C 미만이어야 함                                   | 해당 PLA grade TDS를 따름. PHA blend는 별도 확인함                   | Ingeo 4032D의 명시된 melt 조건은 **210±8°C**임           | 보편 온도 제한 삭제             |
| annealing → 충격강도 개선                                  | 치수·결정화 목적과 충격·신율 변화를 각각 평가함                               | 결정화 증가가 인성 개선과 동의어는 아님                           | 자동 해결책에서 제외             |

33D compounding 사례는 Y1000P/A1000P **60/40 wt%**, 25 mm 이축, 8 kg/h, 150 rpm의 특정 실험임. 이는 고정 L/D 규칙을 반박하는 근거이며, 그 조건을 다른 배합에 그대로 추천하는 근거는 아님. 논문이 사용한 건조조건도 현재 A1000P 제조사 지침보다 우선하지 않음. ([Wiley Online Library][3])

Ingeo 4032D의 210±8°C는 해당 PLA film grade의 반례임. 이를 PHA 함유 compound에 적용하라는 의미는 아님. 또한 이 TDS의 다른 표 항목에는 단위·라벨 이상이 있으므로 표 전체를 무검증으로 가져오지 않는 것이 타당함. ([NatureWorks][4])

## 3.3 계산식은 무엇을 유지하고 무엇을 제한해야 하는가

| 계산·위치                                  | 판정                                                     | 필요한 수정·경계                                                                                         |
| -------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 평균 체류시간, `index.html:1957–1961`        | **유지**: \(\bar t=60m/Q\), m kg, Q kg/h이면 min임          | 실제 hold-up mass를 사용함. 밀도·용적으로 계산할 때는 melt density와 실제 점유 용적을 구분함. 평균은 RTD 꼬리·dead spot 시간을 뜻하지 않음 |
| 평판 중심부 냉각, `process-evidence.js:55–59` | **유지**: full thickness 기준 계수가 맞음                       | 일정 표면온도·열확산율·1차원 전도·1항 근사임. 결정화 잠열·접촉저항·탈형 강성은 포함하지 않음                                            |
| 블로운 필름 두께, `:61–70`                    | **유지**: single-wall 질량수지가 맞음                           | 두 겹 layflat이라는 이유로 다시 2로 나누지 않음. multilayer이면 해당 층 또는 전체 토출·밀도 기준을 구분함                            |
| DDR·gap 식                              | **조건부 유지**                                             | 현재 두께와 gap 식은 같은 질량수지에서 유도됨. **독립 검증이 아니라 대수적 일관성 확인**임. 실제 DDR에는 melt/solid 밀도 차이가 필요함           |
| 형체력, `:74–77`                          | **유지**: \(F_{\rm tf}=P_{\rm bar}A_{\rm cm^2}/980.665\) | 모든 cavity와 runner의 투영면적 및 금형 개방력에 대응하는 평균압력을 사용함                                                  |
| 형체력 역산                                 | **유지**                                                 | 사출기 plastic pressure·hydraulic pressure로 직접 입력하지 않는 현재 경고를 유지함                                    |
| 형체력 ×1.2, `index.html:2177–2182`       | **수정**                                                 | 20%를 보편 권장으로 고정하지 않음. 사용자 지정 여유율과 산술 결과로 표시함. 이용률 0.8과 ×1.2는 정확한 역관계가 아님                          |
| 원형 유로 shear, `:2203–2229`              | **유지**: \(\dot\gamma_{\rm app}=4Q/(\pi R^3)\)          | 분기별 Q, 원형 유로, apparent shear임을 유지함. 비뉴턴·slip·입구효과 보정은 없음                                          |
| P1/P2 비율, `:2232–2249`                 | **추천 미산출**                                             | peak pressure만으로 보압을 결정하지 않음. 사용자가 비율을 지정한 경우에만 단순 계산으로 제공함                                       |
| shot mass UI, `index.html:1237–1255`   | 입력 구조는 검토 가능                                           | 실제 계산 함수는 미첨부임. 개수×제품질량+runner는 질량수지이나 screw stroke까지 검증한 것은 아님                                   |

냉각식은 다음과 같음.

$$
t_c=
\frac{d^2}{\pi^2\alpha}
\ln\left[
\frac{4}{\pi}
\frac{T_{\mathrm{initial}}-T_{\mathrm{surface}}}
{T_{\mathrm{target}}-T_{\mathrm{surface}}}
\right]
$$

`d`는 **전체 두께**이며, mm를 사용하면 `α`는 mm²/s이어야 함. 입력의 `Tm`은 이 식에서는 melting point가 아니라 **초기 수지온도**임. 함수와 UI 이름을 `initialMeltTemperature`로 바꾸는 것이 적절함. 짧은 시간 영역에서는 1항 근사 오차도 별도 경고해야 함.

스트로 계산은 아래처럼 확장하는 것이 타당함.

$$
V=\frac{N_{\mathrm{total}}L_{\mathrm{pitch}}}{1000n_{\mathrm{lanes}}},
\qquad
t_{\mathrm{water}}=\frac{60L_{\mathrm{effective}}}{V},
\qquad
Q_{\mathrm{product}}=0.06N_{\mathrm{total}}m_{\mathrm{straw}}
$$

`Ntotal`은 전체 lane의 개수/min, `Lpitch`는 mm, `mstraw`는 g임. 실제 절단 간격·kerf·폐기물이 있으면 제품 길이와 구분함. 이 식으로 선속도와 제품 질량 생산량은 계산할 수 있음. **온도·장력·결정화 완료·최대 양품속도는 계산할 수 없음.**

## 3.4 물성과 가공조건의 경계

`MAT_DEFAULT`의 S1000P 밀도 1.24를 곧바로 ‘틀린 측정값’으로 바꾸면 안 됨. 공개 TDS의 specific gravity 1.23과 local record 1.24를 서로 다른 출처로 표시해야 함. A1000P의 Tm 미산출과 MFR 시험조건 분리는 유지할 가치가 있음. CA1180P는 두 Tg와 unnotched impact 조건을 보존해야 함. ([CJ 바이오소재][2])

또한 열중량분석의 중량감소와 가공 중 분자량 저하는 같은 지표가 아님. P34HB 원저는 온도·시간·조성에 따라 유변·결정화 거동이 달라짐을 보여줌. 2026년 melt-memory 논문도 온도 이력과 분해의 영향을 분리하여 다룸. 이 자료들로 보편 안전온도나 새로운 온도 경험식을 생성해서는 안 됨. ([Polymer Journal][5])

---

# 4. 주요 트러블슈팅 한영 수정안

아래는 **구현용 조건부 문구 제안**임. 특정 불량의 원인이 현장에서 확정되었다는 의미는 아님. 기존 JSON 11개 항목을 모두 반영하고, 부족한 blown film·EBM·straw 진단을 추가하였음.

## 4.1 모든 공정에 적용할 purge·정지 경계

**한국어**

> Purge resin은 현재 수지, 다음 수지, 전환 온도와 설비의 승인 절차에 따라 선택함. PETG·HDPE·PLA를 보편 대체재로 지정하지 않음. 고온 수지 제거 단계에서는 PHA가 해당 고온에 노출되지 않도록 전환 순서를 확인함. Screen·die·vent의 분해와 수동 청소는 정지, 잔압 해소, 에너지 격리 후 수행함. 운전 중 feeder 우회 공급이나 임의 solvent 주입은 권고하지 않음.

**English**

> Select the purge resin according to the current resin, next resin, transition temperatures and an equipment-approved procedure. Do not specify PETG, HDPE or PLA as universal substitutes. During removal of a high-temperature resin, verify the transition sequence so that PHA is not exposed to that high-temperature stage. Disassemble or manually clean screens, dies and vents only after shutdown, pressure release and energy isolation. Do not recommend bypass feeding during operation or unapproved solvent injection.

**PETG 자체를 금지하는 수정에는 동의하지 않음.** CA1180P 등의 제조사 자료는 특정 전환 순서에서 PETG를 제시함. 문제는 물질명이 아니라 사용 온도·순서·잔류물 제거 조건을 생략하는 것임. 정비·청소의 격리 조건은 공식 안전자료와 함께 적용해야 함. ([CJ 바이오소재][6])

## 4.2 기존 KB 및 전용 가이드의 대체 문구

| 대상·코드 위치                                                                          | 한국어 수정안                                                                                                                                                                                              | English replacement                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **수분·splay·기포**<br>KB `2–50`, `302–350`                                           | Dew point는 건조 공기의 상태이며 pellet 수분값이 아님. 기포·splay 발생 시 잔류 수분, 공기 혼입, 휘발물과 열이력을 구분함. 해당 grade의 건조조건으로 비교한 뒤 수분값과 불량 위치를 함께 확인함. 지속적인 gas·변색 또는 공정한계 이탈 시 시험을 중단하고 원인을 확대 확인함.                           | Dew point describes the drying air, not pellet moisture content. When bubbles or splay occur, distinguish residual moisture from entrained air, volatiles and thermal history. Compare results using the grade-specific drying procedure, and check both moisture results and defect location. Stop the trial and escalate if persistent gas, discoloration or operating-limit violations occur.                                             |
| **이축 torque 상승·feeding 불안정**<br>KB `2–50`; CG `61–120`                            | 실제 공급량, screw speed, melt temperature와 압력의 변화를 먼저 확인함. 과공급·용융 부족·막힘이 확인되면 해당 원인만 조정함. 공급량 감소가 체류시간을 늘릴 수 있으므로 토크 감소만으로 개선을 판정하지 않음. 설비 torque·pressure 한계 접근 시 승인된 정지 절차를 적용함.                       | Check actual feed rate, screw speed, melt temperature and pressure trends first. Adjust only the identified cause, such as overfeeding, incomplete melting or a restriction. Do not judge improvement from lower torque alone, because reducing feed rate can increase residence time. Use the approved shutdown procedure when equipment torque or pressure limits are approached.                                                          |
| **gel·미용융·이물**<br>KB `52–100`; CG `61–96`                                         | 입자를 채취하여 미용융 수지, filler 응집체, 이물과 변성 수지를 구분함. 가수분해 또는 열분해를 gel·가교의 확정 원인으로 표시하지 않음. 입자 특성에 따라 용융·분산·청소 중 한 조치를 선택하고 입자 수와 압력을 비교함. RPM 증가나 미세 screen 적용으로 압력·열부하가 커지면 복귀 또는 중단함.                      | Collect particles and distinguish unmelted resin, filler agglomerates, contamination and altered polymer. Do not label hydrolysis or thermal degradation as confirmed gel formation or crosslinking. Select a melting, dispersion or cleaning action according to the particle evidence, then compare particle counts and pressure. Revert or stop if higher RPM or finer screens increase pressure or thermal load excessively.             |
| **die drool·sharkskin·die line**<br>KB `102–150`; `index.html:1720`; SG `367–376` | 표면 거칠음, 고정 die line, lip 부착물을 먼저 구분함. 온도 불균일·표면 손상·deposit이 있으면 이를 우선 처리함. 유동 불안정이 의심될 때만 grade 범위 안에서 토출·die 조건을 한 항목씩 시험함. 온도 상승·하강의 방향을 미리 고정하지 않으며 미용융·압력 상승·변색이 생기면 복귀함.                        | First distinguish surface roughness, fixed die lines and deposits on the lip. Address temperature nonuniformity, surface damage or deposits when present. Only when flow instability is suspected, test output or die conditions one factor at a time within the grade-specific range. Do not prescribe a universal temperature direction; revert if unmelted material, rising pressure or discoloration appears.                            |
| **sheet·cast film roll sticking**<br>KB `152–200`                                 | 수지온도, roll 접촉 상태, 결정화·고화와 표면 부착을 구분함. Air knife는 일반적으로 roll 접촉을 돕는 장치이며 접촉 지연용으로 설명하지 않음. Roll 온도·접촉시간·pinning 중 한 변수를 바꾸고 박리·표면·후수축을 확인함. 점착 또는 변형이 악화되면 복귀하며 즉시 핵제를 추가하지 않음.                       | Distinguish polymer temperature, roll contact, crystallization or solidification, and surface adhesion. An air knife generally promotes contact with the roll; do not describe it as a device for delaying contact. Change one variable among roll temperature, contact time and pinning, then check release, surface quality and post-shrinkage. Revert if sticking or distortion worsens, and do not add a nucleating agent automatically. |
| **두께 편차**<br>KB `202–250`                                                         | MD 시간변동과 TD 고정 편차를 분리함. MD는 토출·인취 변동을, TD는 die gap·온도·냉각 분포를 우선 확인함. 평균 두께 조정과 편차 개선을 별도 평가함. Die bolt 조정은 OEM 절차에 따르며 압력·lip 손상 위험이 있으면 중단함.                                                        | Separate time-dependent MD variation from fixed TD variation. For MD variation, first check output and haul-off stability; for TD variation, check die gap, temperature and cooling distribution. Evaluate mean-thickness adjustment separately from variation reduction. Adjust die bolts only under the OEM procedure, and stop if pressure or lip-damage risks arise.                                                                     |
| **short shot**<br>KB `252–300`                                                    | Fill-only 형상, pressure limit 도달, cushion·check-ring 상태와 vent를 먼저 확인함. 충전 중 동결이 확인되면 허용 범위에서 충전 또는 열조건을 조정함. 말단 air trap이면 vent와 말기 속도를 검토함. Flash·burn mark가 증가하면 조건을 복귀하고, short를 보압 증가만으로 해결하지 않음. | First check the fill-only pattern, pressure limiting, cushion, check-ring behavior and venting. If freezing during filling is confirmed, adjust filling or thermal conditions within the permitted range. For end-of-fill air trapping, review venting and late-stage speed. Revert if flash or burn marks increase, and do not try to solve short shots solely by increasing packing pressure.                                              |
| **flash·short 동시 발생**<br>KB `352–400`; flash 가이드                                  | Flash가 충전 중인지 보압 중인지 구분함. 부분 충전에서도 발생하면 parting line·지지·runner/cavity balance를 먼저 확인함. 보압 단계에서만 발생하면 V/P 전환과 보압을 검토함. 형체력 증가는 금형·설비 허용 범위 안에서만 수행하며 sealing면 손상이 의심되면 정비로 전환함.                       | Determine whether flash occurs during filling or packing. If it occurs before full filling, first inspect the parting line, support and runner-to-cavity balance. If it occurs only during packing, review V/P transfer and packing conditions. Increase clamp force only within mold and machine limits, and escalate to maintenance when sealing-surface damage is suspected.                                                              |
| **sink·internal void**<br>KB `402–450`                                            | 수축공과 gas bubble을 먼저 구분함. 수축이 원인이면 gate seal 전의 압력 전달과 보압시간을 확인함. 제품질량의 안정화와 sink·void 변화를 함께 비교함. V/P 조기 전환을 보편 해법으로 두지 않으며, flash·잔류응력·탈형 문제가 증가하면 복귀함.                                             | First distinguish shrinkage voids from gas bubbles. If shrinkage is responsible, check pressure transmission and packing time before gate seal. Compare stabilization of part mass with changes in sinks and voids. Do not use earlier V/P transfer as a universal remedy; revert if flash, residual stress or ejection problems increase.                                                                                                   |
| **warpage·충격 저하**<br>KB `452–500`; legacy TS                                      | 불균일 냉각, 배향, 보압 분포와 후결정화를 구분함. 조건을 바꾸기 전과 후에 같은 conditioning으로 치수·충격·신율을 비교함. Annealing과 filler 추가는 별도 소재·후처리 시험으로 취급함. 치수 개선과 동시에 인성이 저하되면 개선으로 승인하지 않음.                                             | Distinguish uneven cooling, orientation, packing distribution and post-crystallization. Compare dimensions, impact strength and elongation before and after changes using the same conditioning. Treat annealing and filler addition as separate material or post-treatment trials. Do not approve the change when dimensional improvement is accompanied by unacceptable toughness loss.                                                    |
| **thermoforming 불량**<br>KB `502–551`                                              | 표면온도뿐 아니라 두께 방향 가열과 sheet 이력을 확인함. 미가열과 과열·sag를 구분한 뒤 가열·plug·vacuum timing을 조정함. IR 측정은 emissivity와 반사 영향을 확인함. 국부 박육·찢김·scorch가 증가하면 가열 증가를 중단함.                                                   | Check through-thickness heating and sheet history, not surface temperature alone. Distinguish underheating from overheating or sag before adjusting heating, plug action or vacuum timing. Verify emissivity and reflection effects when using IR measurements. Stop increasing heat if local thinning, tearing or scorching worsens.                                                                                                        |
| **blown film bubble 불안정·blocking**<br>canonical KB 추가                             | 토출 맥동, air ring·IBC 변동, 누기와 냉각 부족을 구분함. 공급·air 제어·인취 중 원인에 대응하는 한 변수를 조정함. Bubble 형상, FLH, MD/TD 두께와 권취 후 blocking을 함께 확인함. Bubble 파단이나 장력 불안정이 악화되면 속도 증가를 중단함.                                     | Distinguish output pulsation, air-ring or IBC fluctuations, leakage and insufficient cooling. Adjust one corresponding variable in feeding, air control or haul-off. Check bubble shape, frost-line height, MD/TD gauge and blocking after winding. Stop increasing speed if bubble breaks or tension instability worsens.                                                                                                                   |
| **EBM parison sag·pinch-off 누설**<br>canonical KB 추가                               | Parison 온도, 지지되지 않은 시간과 wall distribution을 확인함. Sag와 pinch-off 용착 불량을 구분하여 extrusion timing 또는 금형·blow 조건을 조정함. 바닥 weld와 최소 벽두께를 함께 확인함. 누설·blowout이 지속되면 압력 증가로 밀어붙이지 않고 재료 적합성과 tooling을 재검토함.     | Check parison temperature, unsupported hanging time and wall distribution. Distinguish sag from poor pinch-off welding before adjusting extrusion timing or mold and blowing conditions. Check the bottom weld and minimum wall thickness together. If leakage or blowouts persist, do not keep increasing pressure; reassess material suitability and tooling.                                                                              |
| **스트로 변형·절단 불량**<br>SG `367–410, 490–503`                                         | 물구간 통과시간, sizing 지지, 내외경·편육과 cutter 동기를 확인함. 눌림과 취성 파단을 구분한 뒤 냉각·인취·절단 중 한 변수를 조정함. 절단면, ovality, 후수축과 실제 수지온도를 함께 기록함. Jam·균열·치수 이탈이 증가하면 증속을 중단하며 PLA·peroxide를 원인으로 단정하지 않음.                      | Check water-bath transit time, sizing support, inner and outer diameters, wall eccentricity and cutter synchronization. Distinguish collapse from brittle fracture before adjusting cooling, haul-off or cutting. Record the cut surface, ovality, post-shrinkage and measured polymer temperature. Stop increasing speed if jams, cracks or dimensional deviations increase, and do not assume that PLA or peroxide is the cause.           |

Dew point와 pellet 수분을 분리하는 수정은 장비사 설명과 일치함. 수분 측정에는 ASTM **D6869-25**의 Karl Fischer 방법과 **D6980-25**의 loss-in-weight 방법이 존재함. 따라서 loss-in-weight를 무조건 부적합으로 배제할 필요는 없음. 다만 실제 compound에서 수분 외 휘발·열분해의 영향을 검증하고 방법 간 동등성을 확인해야 함. ([Conair][7])

Air knife의 roll 접촉 촉진, MD/TD 두께 편차 구분, fill-only와 packing 분리는 각각 직접 공정기술 자료로 뒷받침됨. 위 문구는 이 원리를 PHA의 열이력·grade 제약과 결합한 제안임. ([Extrusion][8])

EBM의 pinch-off 문제는 냉각 부족, 형상, 과도한 blow 조건 등으로도 발생할 수 있음. LyondellBasell 자료는 이러한 원인 구분의 근거로 사용하였음. **PE용 금형 치수나 온도 증분은 PHA 값으로 전용하지 않았음.** ([LyondellBasell][9])

---

# 5. 현장 검증 및 코드 회귀 계획

## 5.1 현재 동작 중 유지해야 하는 부분

| 현재 기능                                                                       | 판단                                                 |
| --------------------------------------------------------------------------- | -------------------------------------------------- |
| `PHAEvidence.reference()`가 CB0104A sheet, CB0400A injection 등에 직접 범위를 주지 않음 | **유지**. 문제는 이후 `getReco()`가 family 값을 다시 채우는 단계임   |
| A1000P 건조 `<50°C` 표시                                                        | **유지**. 현재 코드가 이미 개선한 부분임                          |
| CA1180P 일반·고내열 mold mode 구분                                                 | **유지**                                             |
| grade·process·mode별 override key                                            | **유지**. 이전 family override를 자동 재사용하지 않는 현재 방향이 적절함 |
| TARS의 자동 온도 제안 `null`                                                       | **유지**. 물성 데이터에서 가공 setpoint를 만들어내지 않음             |
| 형체력·단층 필름·냉각 근사 계산                                                          | **유지**. 앞서 설명한 입력·적용범위만 보완함                        |
| 평균 cavity pressure를 machine pressure로 입력하지 말라는 경고                           | **유지**                                             |
| CG의 복수 징후를 함께 보도록 개선된 문구 `723–725`                                          | **유지**. 이전의 단일 torque 감소 확정 문구와 통일함                |
| 생성 그림을 실제 불량 사진과 구분하는 표시                                                    | **유지**                                             |

기존 테스트는 경로만 첨부 위치에 맞춰 메모리에서 연결하여 실행하였음. **5개 테스트 모두 통과하였음.** 테스트 내용과 원본 소스는 수정하지 않았음. 다만 이 테스트들은 전체 추천 조립, 한영 KB, 브라우저 저장 이관과 현장 품질을 검증하지 않음.

## 5.2 수정 후 반드시 통과해야 할 회귀 시험

| 시험군                  | 구체적 기대 결과                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **추천 조립**            | CB0104A 선택 시 PHA_AMOR 잔여 필드가 없어야 함. 출처 없는 pressure·speed·cooling은 `null/미산출`이어야 함                   |
| **grade·process 적용** | CA1670P·CA1680P의 ISBM 근거가 EBM으로 연결되지 않아야 함. CA1270P는 film·straw 용도와 공정별 숫자 근거를 구분해야 함               |
| **blend**            | 순수 PBSA와 PHA/PBSA의 추천 객체를 공유하지 않아야 함. 임의 blend는 숫자를 평균 생성하지 않아야 함                                   |
| **정밀도**              | die gap 1.0–1.5 mm가 1–2 mm로 바뀌지 않아야 함. 범위와 strict inequality를 보존해야 함                                |
| **입력 검증**            | 빈칸, 0, 음수, `NaN`, `Infinity`, 역전 range, 원소 수가 다른 range를 구분해야 함. 배합 합계 오류 시 screw 추천을 숨겨야 함          |
| **물리 계산**            | 질량수지, 두께의 제곱에 따른 냉각시간 변화, 형체력 역산이 유지되어야 함. gap 미입력은 허용하되 잘못된 입력은 오류여야 함                             |
| **스트로**              | 온도식과 190/200°C 안전색이 모든 활성 경로에서 사라져야 함. lane 수가 바뀌면 V·통과시간이 올바르게 변해야 함                               |
| **KB·언어**            | 온라인 JSON 실패 시에도 동일한 진단·조치가 나와야 함. `<`와 `≤`, 증감 방향, 정지 조건이 한영에서 같아야 함                                |
| **저장·이관**            | `reco_overrides`, `comp_doe_checklist`, `comp_trial_log` 및 기존 시험기록을 보존해야 함. grade명 변경은 이관 내역을 남겨야 함 |

KB에는 현재 안정적인 `id`가 없음. 항목 순서 대신 `process + symptom_id`로 식별하는 구조를 권장함. 체크리스트 순서 변경으로 과거 완료 상태가 다른 항목에 붙지 않도록 해야 함. 제조사 기준을 갱신하더라도 기존 사용자 설정과 실측 기록을 덮어쓰면 안 됨.

권장 데이터 구분은 다음과 같음.

> **제조사 원문값 → 적용범위 확인값 → 사용자 설정값 → 실제 측정값 → 품질 판정값**

각 필드는 source URL, revision, page, unit, pressure/temperature basis를 가져야 함. `manufacturer_reference`와 `field_validated`는 별도 상태여야 함. TDS가 있다고 해서 현장 검증 상태를 `true`로 바꾸면 안 됨.

## 5.3 작은 현장 검증 계획

다음 반복 수와 순서는 **제안 시험계획**이며 실측 결과가 아님.

| 단계            | 최소 수행내용                                                           | 판정 기준                          |
| ------------- | ----------------------------------------------------------------- | ------------------------------ |
| **기준 조건 확보**  | grade·lot·배합·재가공 이력, 건조조건·수분, 설비·die/mold, 현재 설정과 실제 melt를 기록함    | 승인된 기존 조건 또는 정확한 TDS 범위에서 시작함  |
| **단일 가설 시험**  | 기준 → 한 변수 변경 → 기준 복귀 순으로 비교함. 안정화 후 서로 떨어진 시점에서 3회 이상 채취하는 안을 사용함 | 조건 효과와 시간 경과·열화 효과를 구분함        |
| **가공 건전성 확인** | 실제 토출량, torque, pressure, melt temperature, 불량 양상과 위치를 함께 기록함     | torque 감소나 외관 개선 하나만으로 승인하지 않음 |
| **재료 손상 확인**  | 필요한 경우 동일 시험조건의 MFR, GPC/SEC, DSC cooling·2nd heating을 비교함        | 시험 온도·하중·전처리·반복 수를 같게 함        |
| **조건 확대**     | 단일 변수 screening 후 필요한 상호작용만 작은 factorial 시험으로 확인함                 | 공정 안정과 제품 규격을 함께 충족한 영역만 확대함   |

공정별 최종 승인 항목은 다음처럼 달라야 함.

| 공정     | 최소 품질 확인                                                  |
| ------ | --------------------------------------------------------- |
| 사출     | cavity별 충전·질량, flash, sink/void, 탈형 변형, conditioning 후 치수 |
| 일반 압출  | 실제 kg/h, 압력 안정, strand/profile 연속성, 미용융·이물                |
| 시트     | MD/TD 두께, roll release, flatness, 후수축, 후속 성형성             |
| 블로운 필름 | bubble 안정, 두께 분포, 권취 blocking, 목적에 따른 seal·tear           |
| EBM    | 최소 벽두께, pinch-off weld, 누설, 목적에 따른 drop·압축                |
| 캐스트 필름 | neck-in, draw resonance, 표면, 두께, 권취·박리                    |
| 이축     | 조성·분산, 실제 melt, MFR/GPC 변화, pellet 상태, vent 안정            |
| 스트로    | OD/ID·편육·ovality, 절단면, jam, 후수축, 사용 중 강성·균열               |

정지 기준은 설비의 승인된 torque·pressure·temperature 한계를 우선함. 비정상 gas·지속적 변색, vent 토출, 반복 파단·jam 등도 중단·격리 사유로 정의해야 함. 제품 합격선은 고객 규격과 기준품으로 사전에 정함. **모든 grade에 공통인 양품률, 허용 분자량 감소율 또는 안전온도는 이번 자료로 정할 수 없음.**

---

# 6. 출처와 남은 불확실성

## 6.1 출처 목록

조회 기준일은 **2026-09-06**임. URL의 업로드 연도와 PDF의 실제 개정 표기는 구분하였음. 표의 페이지는 PDF 페이지이며, 별도 인쇄 쪽수가 있는 자료는 함께 표시하였음.

| 번호  | 직접 출처                                                                                                                                                                                                         | 개정·확인 위치                                                                            | 적용범위·제한                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| C0  | [첨부 검토팩](sandbox:/mnt/data/pha-all-processing-gpt6-pro-20260906.zip)                                                                                                                                          | 2026-09-06 working tree; 본문 5개·발췌 7개·테스트                                            | 코드 사실의 기준. 현장 데이터 아님                                                                |
| R1  | [CJ S1000P TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-S1000P.pdf)                                                                                                                   | **3/2024**, pp.1–2                                                                  | 일반 processing·건조·물성. 특정 사출품 성공조건 아님                                                 |
| R2  | [CJ A1000P TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-A1000P.pdf)                                                                                                                   | **02/2024**, pp.1–2                                                                 | 건조 부등호와 표 차이 확인. neat 성형 적합성 확대 금지                                                  |
| R3  | [CJ CB0104A TDS](https://cjbiomaterials.com/wp-content/uploads/2025/03/TDS-CB0104A.pdf)                                                                                                                       | **June 2026**, pp.1–2                                                               | 사출 compound 직접 근거                                                                   |
| R4  | [CJ CB0400A TDS](https://cjbiomaterials.com/wp-content/uploads/2024/11/PHACT%E2%84%A2-CB0400A.pdf)                                                                                                            | 추출 본문 **June 2026**, pp.1–3                                                         | 일부 렌더와 본문 불일치. extrusion 표 활성화 전 동일본 확인 필요                                          |
| R5  | [CJ CA1180P TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1180P.pdf)                                                                                                                 | **03/2023**, pp.1–2                                                                 | 사출·건조·전환 purge. 공개 자료의 현행 적용 여부는 공급사 확인 대상                                          |
| R6  | [CJ CA1165A TDS](https://cjbiomaterials.com/wp-content/uploads/2024/04/PHACT%E2%84%A2-CA1165A-TDS.pdf)                                                                                                        | **3/2025**, pp.1–2                                                                  | 사출·고온 금형·건조 직접 근거                                                                   |
| R7  | [CJ CA1670P TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1670P.pdf)                                                                                                                 | **03/2023**, pp.1–3                                                                 | sheet·thermoforming·ISBM. EBM 근거 아님                                                 |
| R8  | [CJ CA1680P TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1680P.pdf)                                                                                                                 | **03/2023**, pp.1–3                                                                 | sheet·ISBM·별도 건조조건                                                                  |
| R9  | [CJ CA1270P TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1270P.pdf)                                                                                                                 | **June 2026**, pp.1–3                                                               | film 근거. p.2 판독 불일치와 장력 단위 문제를 별도 관리                                                |
| R10 | [CJ Film guide](https://cjbiomaterials.com/wp-content/uploads/2023/08/2023-0822-CJBMS_Datasheet_Film-F-23V4.6.pdf)                                                                                            | **TDS-F-23V4.6**, pp.4–5                                                            | 과거 film 조건과 장력 단위 병기 확인. 최신값 대신 자동 사용하지 않음                                          |
| R11 | [CJ 공정별 제품 안내](https://cjbiomaterials.com/by-manufacturing-process/)                                                                                                                                          | 조회일 현재 웹페이지                                                                         | CA1270P film·straw, CA1670P·CA1680P ISBM 분류                                         |
| R12 | [PTT MCC BioPBS FZ91PM/FZ91PB TDS](https://www.pttmcc.com/file_upload/tds/TDS-FZ91PM_PB.pdf)                                                                                                                  | **No.299**, 개정일 미표기, pp.1–2                                                         | PBS blown/cast film. PBSA나 PHA blend로 전용 금지                                         |
| R13 | [NatureWorks Ingeo 4032D TDS](https://natureworksllc.com/getContentAsset/19802f14-3f36-4013-b97e-758c79194496/53ffd608-340f-457b-b656-6b8cc0000bd4/TechnicalDataSheet_4032D_films.pdf?language=en)            | **NW4032D_150518V1**, p.1                                                           | ‘PLA는 항상 <190°C’의 반례. 다른 표 항목의 단위 이상은 전용하지 않음                                       |
| R14 | [Toriseva et al., 2025](https://onlinelibrary.wiley.com/doi/full/10.1002/app.57851)                                                                                                                           | **2025-08-15**, §2.2·§2.4·§2.5, Tables 2–3                                          | *Extrusion Coating of PHAs and Blends…*. HTML 원문 확인. compounding·cast·coating 조건 분리 |
| R15 | [P34HB 열분해 원저, Polymer Korea](https://journal.polymer-korea.or.kr/journal/archive/view/4300)                                                                                                                  | **2022**, 46(6), 757–765; DOI 10.7317/pk.2022.46.6.757                              | 조성·시간·온도에 따른 열·유변 변화. 보편 안전온도 근거 아님                                                 |
| R16 | [Geeraert et al., 저자기관 기록](https://researchportal.vub.be/en/publications/consequences-of-melt-memory-and-thermal-degradation-for-poly3-hyd/)                                                                  | **2026-01-27**, *Macromolecules* 59(3), 1554–1567; DOI 10.1021/acs.macromol.5c02581 | 초록·서지 확인. 전체 실험표·보충자료는 검증하지 못하였음                                                    |
| R17 | [Coperion Masterbatch Compounding](https://www.coperion.com/media/5833/masterbatch_en.pdf)                                                                                                                    | **A-800153-en 2016-07**, pp.4–5                                                     | premix·split-feed의 기능 근거. PHA 전용 수치 아님                                              |
| R18 | [ENTEK Extrusion Solutions](https://entek.com/wp-content/uploads/2021/06/ExtrusionSolutions_July_2021.pdf)                                                                                                    | **July 2021**, pp.3–5                                                               | vent·feeding·설비 운영의 조건부 원리                                                          |
| R19 | [Film and Sheet Pinning Techniques](https://extrusion.4spe.org/wp-content/uploads/2019/01/Vol16-01-03-Film-and-Sheet-Pinning-Techniques-to-Promote-Heat-Transfer-to-Cooling-Rolls-SPE-Extrusion-Division.pdf) | **Vol.16 No.1, February 1989**, pp.1–2                                              | air knife·roll 접촉·열전달 원리. URL의 2019는 발행연도 아님                                        |
| R20 | [LyondellBasell Blown Film Problems](https://www.lyondellbasell.com/globalassets/lyb/our-solutions/products/documents/polymers-technical-literature/blown_film_problems.pdf)                                  | 문서 코드 **6483/0599**; MD/TD pp.23–25                                                 | 일반 film 진단. PHA 온도·속도값으로 전용하지 않음                                                    |
| R21 | [LyondellBasell Blow Molding Problems](https://www.lyondellbasell.com/link/7736399b03fc48bfba2d01256c41f90d.aspx)                                                                                             | **6088/0715**; 인쇄 pp.3–10                                                           | EBM·pinch-off·parison 진단. PE용 수치 전용 금지                                              |
| R22 | [RJG Fill-only 진단](https://rjginc.com/establishing-a-fill-only-part-sometimes-easier-said-than-done/), [Cavity Pressure Control](https://rjginc.com/cavity-pressure-control/)                                 | 웹 본문 해당 절                                                                           | 충전·packing·gate seal·압력 구분                                                          |
| R23 | [Conair Dew Point 설명](https://www.conairgroup.com/resources/resource/whats-the-difference-between-humidity-and-dew-point-and-why-is-low-dew-point-air-so-important-to-resin-drying/)                          | 웹 본문                                                                                | 건조 공기와 pellet 수분의 구분                                                                |
| R24 | [ASTM D6869-25](https://store.astm.org/d6869-25.html), [ASTM D6980-25](https://store.astm.org/d6980-25.html)                                                                                                  | **2025판**, 공식 표준 설명                                                                 | Karl Fischer·loss-in-weight 방법 구분. 유료 전문 전체를 읽은 것으로 표현하지 않음                         |
| R25 | [WorkSafe: Plastics extrusion presses](https://www.worksafe.govt.nz/topic-and-industry/machinery/working-safely-with-plastic-production-machinery/plastics-extrusion-presses/)                                | 공식 machinery safety guidance                                                        | 청소·정비·격리 원칙. 한국 법규 적합성 판단을 대신하지 않음                                                  |

## 6.2 남은 불확실성과 결론에 미치는 영향

| 남은 항목                              | 현재 결론에 미치는 영향                                  |
| ---------------------------------- | ---------------------------------------------- |
| CB0400A·CA1270P 일부 PDF 본문/렌더 불일치   | 기존 family값을 유지할 이유는 아님. 대체 온도표의 자동 활성화만 보류해야 함 |
| CA1170A의 정확한 현행 grade·공정 자료 미확인    | 다른 CA grade의 조건으로 채우지 않음. 부적합·단종으로 단정하지도 않음    |
| neat A1000P의 각 형상별 실증 미첨부          | 전 공정 적합 판정을 막되, 모든 성형이 불가능하다고 판단하지 않음          |
| `TS_DATA`·`TS_KO` 전체와 일부 UI 함수 미첨부 | fallback 의미 일치와 해당 함수 동작은 회귀시험 완료 전 미확인 상태임    |
| 실제 설비·lot·열이력·품질 데이터 미첨부           | 압력·RPM·냉각시간·첨가량의 새로운 경험식을 만들 수 없음              |
| 2026년 ACS 논문의 전체 본문·SI 검증 미완료      | 초록의 melt-memory 시사점만 사용함. 수치 모델·임계온도는 채택하지 않음  |

## [최종 통합 결론·구현 체크리스트]

1. **`getReco()`의 family 보충·blend 평균, 스트로 온도식, 이축 고정 온도표와 무검증 생산기록을 활성 추천 경로에서 우선 제거해야 함.**
2. **그레이드·공정·기능별 TDS record를 도입하고, 직접 확인된 값은 유지하되 결측은 미산출하며 기존 사용자 기록은 보존해야 함.**
3. **조건부 한영 KB와 위 회귀시험을 적용한 뒤, 기준 복귀를 포함한 소규모 현장 시험으로 실제 품질·열이력·재현성을 확인하는 것이 타당함.**

[1]: https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-A1000P.pdf "https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-A1000P.pdf"
[2]: https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-S1000P.pdf "https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-S1000P.pdf"
[3]: https://onlinelibrary.wiley.com/doi/full/10.1002/app.57851 "Journal of Applied Polymer Science | Wiley Online Library"
[4]: https://natureworksllc.com/getContentAsset/19802f14-3f36-4013-b97e-758c79194496/53ffd608-340f-457b-b656-6b8cc0000bd4/TechnicalDataSheet_4032D_films.pdf?language=en "https://natureworksllc.com/getContentAsset/19802f14-3f36-4013-b97e-758c79194496/53ffd608-340f-457b-b656-6b8cc0000bd4/TechnicalDataSheet_4032D_films.pdf?language=en"
[5]: https://journal.polymer-korea.or.kr/journal/archive/view/4300 "https://journal.polymer-korea.or.kr/journal/archive/view/4300"
[6]: https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1180P.pdf "https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1180P.pdf"
[7]: https://www.conairgroup.com/resources/resource/whats-the-difference-between-humidity-and-dew-point-and-why-is-low-dew-point-air-so-important-to-resin-drying/ "Resin Drying and the Importance of ‘Low Dew Point Air’ | Conair"
[8]: https://extrusion.4spe.org/wp-content/uploads/2019/01/Vol16-01-03-Film-and-Sheet-Pinning-Techniques-to-Promote-Heat-Transfer-to-Cooling-Rolls-SPE-Extrusion-Division.pdf "https://extrusion.4spe.org/wp-content/uploads/2019/01/Vol16-01-03-Film-and-Sheet-Pinning-Techniques-to-Promote-Heat-Transfer-to-Cooling-Rolls-SPE-Extrusion-Division.pdf"
[9]: https://www.lyondellbasell.com/link/7736399b03fc48bfba2d01256c41f90d.aspx "H:\Documents\Pagemaker\Blow Mol"
