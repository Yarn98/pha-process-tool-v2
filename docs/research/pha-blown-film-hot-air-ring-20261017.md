# PHA 블로운 필름 열풍 에어링 조사 (2026-10-17)

요청: 반결정성 PHA 블로운 필름은 열풍 에어링이 필요하다. 에어링 공기를 60 °C로 두면 결정화 속도가 최대가 되어 융착(블로킹) 없이 권취할 수 있다. 필요한 장비를 조사해 설비 모형에 추가한다.

근거 등급:
- A: 원문이 직접 말한 내용
- B: 공학 관계식으로 유도한 값
- C: 추론 또는 교육용 가정

**접근 한계.** 이번 환경에서는 원문 페이지를 열 수 없었습니다(WebFetch DNS 실패, 프록시 403). 아래 인용은 검색 결과에 노출된 초록과 특허·자료 발췌를 그대로 옮긴 것입니다. 교육 자료로 수치를 확정하기 전에 원문을 확인하세요.

## 1. 결정화 속도가 최대가 되는 온도

| 고분자 | 측정 항목 | 최대가 되는 온도 | 근거 |
|---|---|---|---|
| PHB | 구정 성장 속도 G (약 4 µm/s) | 80–90 °C | A: "The maximum growth rate of P3HB spherulites is about 4 μm/s at temperatures of 80–90 °C." [Macromolecules 59(1):379 (2026)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12805640/) |
| PHB | 전체 결정화 반감기 t½ (최소 약 30 s) | 60–70 °C | A: "a minimum of about 30 s at 60–70 °C" (FSC·DSC 등온, 용융에서 냉각) [같은 논문](https://pubs.acs.org/mamobx/article/59/1/379/5089866/Homogeneous-Crystal-Nucleation-of-Poly-3) |
| PHBV | G | 약 80 °C (353 K) | A: [Peng et al., Eur Polym J (2003)](https://research.polyu.edu.hk/en/publications/isothermal-crystallization-of-poly3-hydroxybutyrate-co-3-hydroxyv/) |
| PHBV | 결정화 속도 | 88 °C | A: [Wang et al., J Appl Polym Sci 117:838 (2010)](https://pure.psu.edu/en/publications/miscibility-crystallization-kinetics-and-mechanical-properties-of/) |
| PHBHHx (PHBH) | 냉각 후 결정화가 가장 잘 진행되는 온도 | 50–70 °C | A: "crystallization tends to most proceed when the cooling temperature after heat-melting is 50° C. to 70° C." [US 10030117](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10030117), [US 9340659](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9340659) |
| P(3HB-co-4HB), 4HB 2–10 mol% | 최대 온도 | 공개 측정값을 찾지 못함 | A(정성): 구정 성장 속도는 4HB 함량과 결정화 온도에 크게 좌우되며, 4HB가 늘수록 Tm·Tg·결정화도가 낮아집니다. [Wen et al., JTAC (2012)](https://link.springer.com/article/10.1007/s10973-011-1768-2) |

PHB는 핵생성이 낮은 온도에서 빨라서 전체 결정화 속도의 최대(t½ 최소, 60–70 °C)가 구정 성장 속도의 최대(80–90 °C)보다 낮습니다(B). 60 °C는 전체 결정화 속도 기준으로는 PHB·PHBH 자료와 같은 범위입니다. 구정 성장 속도 기준은 아니며, S1000P(4HB 2–5 mol%)에 대한 공개 측정값은 없습니다(C).

권장 확인 방법은 S1000P 등온 DSC입니다. 175–180 °C에서 1–3 min 용융한 뒤(분해와 용융 기억 때문에 짧게) 빠르게 냉각하고, 30–100 °C 각 온도에서 t½를 구해 결정화 온도에 대해 그립니다. POM으로 G도 측정합니다.

핵제(BN, cyanuric acid 등)는 P34HB의 결정화를 빠르게 합니다(A, [US 7718720](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7718720)). 같은 공기 온도라도 핵제와 용융 온도·체류시간에 따라 결과가 달라집니다.

## 2. PHA 블로운 필름의 융착·블로킹

- A: 잔류 점착으로 접힌 튜브가 서로 붙습니다. "Residual tack of the PHA can cause the tubular film to stick to itself after it has been cooled and collapsed for winding." [US 7208535](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7208535)
- A: 버블 냉각을 조절해 충분히 결정화시켜 블로킹을 막습니다. "The cooling rate (air flow), thickness, diameter and height of the bubble are adjusted so that the PHA tubular film is sufficiently crystalline to ... prevent sticking and blocking." [US 6620869](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6620869)
- A: 다이 위에 열풍을 불어 결정화 온도를 높인 실험 예가 있습니다. "Hot air is blown over the space located above the film blowing die in order to reach a higher crystallization temperature Tc." 다만 발췌에는 공기 온도 수치가 없습니다. [US 6825285](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6825285)
- A: 상용 라인은 dual-lip 에어링과 low-stalk 버블을 씁니다. [EP2291429B1](https://patents.google.com/patent/EP2291429B1/en)
- A: 핵제를 넣은 PHB/PHBV 캐스트 필름에서는 칠 롤 60 °C가 최적화한 조건이었습니다. 접촉 냉각이므로 공기와 같지는 않습니다. [Thellen et al. (2008)](https://dx.doi.org/10.1007/s10924-008-0079-6)
- 비결정성 PHA는 사정이 반대입니다. CJ의 비결정성 PHA/PLA 필름 등급 CA1240PF TDS는 에어링과 IBC에 냉각 공기를 권장합니다. 비결정성 A1000P는 열풍으로 결정화되지 않으므로 이 조건이 해당하지 않습니다(C). [TDS](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1240PF.pdf)

PHA 필름의 에어링 공기 온도 범위를 명시한 특허 청구항이나 TDS는 찾지 못했습니다. 60 °C는 사용자 사내 운전 기준으로 표시합니다.

## 3. 열풍 에어링 장비 구성

상용 "가열 에어링" 카탈로그 제품은 찾지 못했습니다. 실제로는 표준 dual-lip 에어링에 블로어 → 인라인 히터 → 단열 덕트를 연결해 구성합니다(C).

| 구성품 | 역할·교육용 사양 (C) | 근거 |
|---|---|---|
| 흡입 필터 | 먼지 유입 방지 | 일반 블로어 구성 |
| 원심 블로어 (VFD) | 0.75–1.5 kW, 150–300 m³/h | 에어링 공급 구성: [Davis-Standard](https://davis-standard.com/custom_blog/what-to-look-for-in-an-air-ring-blown-film-series-part-iv/) |
| 풍량 스위치 (차압) | 풍량이 확인되어야 히터 기동 허용 | A: "must always have sufficient airflow through the heater before applying power" [SureHeat MAX 매뉴얼](https://jobcosupply.com/wp-content/uploads/2015/06/SureHeat_MAX_Operating_Manual.pdf) |
| 인라인 전기 히터 | 약 6 kW, 400 V 3상 | 예: [Leister LHS 61S](https://www.leister.com/en-us/product/LHS-61S-System/145-734) (8.5 kW, 최소 풍량 650 l/min) |
| PID 온도 조절기 (SCR) | 설정 60 °C, 에어링 플레넘 센서(Pt100 또는 열전대) | — |
| 독립 과열 차단기 (수동 복귀) | 80–90 °C에서 히터 차단 | A: 덕트 히터는 팬 인터록과 자동·수동 과열 차단을 둡니다. [Indeeco](https://indeeco.com/tech-docs/duct-heaters-owners-manual). 71 °C 자동 차단 제품은 60 °C 설정과 너무 가깝습니다(B). |
| 단열 매니폴드·호스 | 120 °C 이상 정격, 길이를 같게 4가닥 | A: 덕트가 길거나 굽거나 단열이 없으면 성능이 떨어집니다. (Davis-Standard) |
| dual-lip 에어링 | OD 240 mm | 기존 모형 |
| 선택 | 버블 보온 커버, 프로스트 라인 위 IR 온도계, 냉각기 전환 댐퍼, IBC | C |

인터록은 다음과 같습니다.
- 히터는 블로어가 운전 중이고, 풍량 스위치가 켜져 있고, 과열 차단이 정상이고, 비상정지가 해제된 상태에서만 켜집니다.
- 히터가 꺼진 뒤에도 블로어는 잠시 더 돌아 히터를 식힙니다.

### 히터 용량 (B)

P = Q·ρ·c_p·ΔT로 계산했습니다. 가정은 ρ = 1.20 kg/m³, c_p = 1.006 kJ/(kg·K), ΔT = 40 K(20 → 60 °C)입니다.

| 풍량 (m³/h) | 필요 전력 (kW) |
|---|---|
| 100 | 1.35 |
| 200 | 2.7 |
| 300 | 4.0 |

덕트 손실과 승온 여유 25–50 %를 더하면, 150–300 m³/h 링에는 약 6 kW가 필요합니다(C).

산업 경험식 "다이 지름 1 inch당 50–150 CFM"([SPE](https://extrusion.4spe.org/wp-content/uploads/2019/01/Vol10-02-01-Blown-Film-Cooling-Air-Parameters-SPE-Extrusion-Division-1-0-Wiki.pdf))을 80 mm 다이에 적용하면 270–800 m³/h입니다. 실험실 링에는 과대한 값입니다(B).

## 4. 왜 따뜻한 공기가 도움이 되는가, 그리고 대가

- 40 µm 필름의 열 시정수는 약 1–2 s입니다(B). 프로스트 라인 위의 필름은 주변 공기 온도를 금방 따라갑니다.
- 모형의 프로스트 라인에서 닙까지는 2.18 m입니다. 2 m/min이면 약 65 s, 5 m/min이면 26 s, 10 m/min이면 13 s가 걸립니다(B). PHB의 최소 t½(약 30 s, 60–70 °C)와 같은 규모라서, 닙에 닿기 전에 결정화 최적 온도 근처에 머무는 것이 중요합니다(B/C).
- 대가는 냉각 능력 감소입니다. 다이 출구에서 용융체와 공기의 온도차가 약 150 K에서 약 110 K로 줄어 냉각 능력이 25–30 % 낮아집니다(B). 프로스트 라인이 올라가거나 토출을 줄여야 할 수 있습니다.
- 에어링 공기는 버블 아래쪽만 감쌉니다. 닙까지 60 °C 근처를 유지하려면 보온 커버나 가열 타워가 추가로 필요할 수 있습니다(C).
- 용융 온도는 낮게 유지합니다(약 150–175 °C). 높은 용융 온도는 결정화를 늦춥니다. A: [Janchai et al. (2023)](https://www.nature.com/articles/s41598-023-27595-3), [Zhang et al., Macromol Res (2023)](https://link.springer.com/article/10.1007/s13233-023-00205-x)

## 확인된 것, 사내 기준, 미확인 항목

- **확인됨:**
  - PHB의 전체 결정화 반감기 최소는 60–70 °C, 구정 성장 최대는 80–90 °C입니다.
  - PHBH는 50–70 °C로 냉각할 때 가장 잘 결정화됩니다.
  - PHA 필름은 잔류 점착으로 블로킹되며, 냉각 조건을 조절해 결정화시켜 막습니다.
  - 히터는 풍량 없이 켜면 안 됩니다.
- **사내 기준 (사용자 제공):** S1000P 블로운 필름의 에어링 공기는 60 °C입니다.
- **미확인:**
  - 4HB 2–5 mol% P3HB4HB의 결정화 속도 최대 온도
  - PHA 블로운 필름의 공개된 에어링 온도
  - 에어링만으로 닙까지 충분히 결정화되는지
  - 블로어·히터 용량(교육용 추정)
