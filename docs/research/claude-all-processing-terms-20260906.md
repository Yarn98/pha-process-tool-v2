# Claude terminology review — 2026-09-06

User-authorized second opinion; only the proposed wording was sent. No file/tool access and no independent source verification by Claude.

검수 결과입니다. 제시된 문구만을 대상으로 했고, 판단 근거는 일반적인 고분자 가공 용어 관행이며 외부 자료나 프로젝트 파일은 확인하지 않았습니다. 대부분 의미가 정확하고, **의미 오류는 없으나 KO/EN 비대칭 3건(3, 6, 9번)과 과장 우려 표현 1건(4번 '실제')**이 있습니다.

| # | 판정 | 권장 문구 (변경분만) | 이유 |
|---|---|---|---|
| 1 | 적합 | 유지. EN은 "Feed rate (kg/h)"로 축약 가능 | '사료율' 삭제 타당(축산 용어 오역). 압출 현장 표준은 공급량/feed rate |
| 2 | 적합 | EN을 "…is not a substitute for measuring residual pellet moisture"로 | KO "대체 측정값이 아닙니다"와 EN "does not measure"의 뉘앙스 정렬. 이슬점=건조공기 성능 지표라는 취지는 정확 |
| 3 | ⚠️ 비대칭 | KO 후반을 "건조감량법(LOD)은 수분 특이적 방법과 대조 검증하세요(휘발분을 수분으로 오인 가능)"로 | KO는 "구별하는지 확인"(판단 기준), EN은 "validate against water-specific measurement"(조치)로 서로 다른 지시. EN 쪽이 실행 가능하므로 KO를 EN에 맞추는 최소 변경 권장. '감량법'만 쓰면 모호하므로 '건조감량법' 명시 |
| 4 | ⚠️ 표현 | "실제 용융온도" → **"측정 용융온도"** | EN "Measured"와 정렬되고, 검수 기준에 있는 '실측/실제'류 단정 표현 회피. 프로브로 잰 값도 위치·접촉에 따라 편차가 있어 '실제'는 과대 주장 소지 |
| 5 | 권장 수정 | "결정화 상태" → "결정화 지연(부족)" / EN "crystallization" → "slow or incomplete crystallization" | 롤 점착의 원인 후보로는 '상태'보다 '지연/부족'이 조치 방향(롤 온도 상·하향 판단)과 직결됨. PHA는 결정화가 느린 편이라는 일반 지식에 근거한 추정이며, 앱의 원인 분류 체계에 따라 조정 필요 |
| 6 | ⚠️ 비대칭 | EN 앞에 "Do not specify V/P transfer as simply 'earlier/later';" 추가 | KO 첫 문장("더 빠르게/느리게만으로 지시하지 마세요")이 EN에 없음. 이 문장이 핵심 경고이므로 누락 시 EN 사용자가 오해. "position convention"은 "screw-position sign convention"이 더 명확 |
| 7 | 적합 | EN "measurements" → "measurements to check" (선택) | KO "확인할 측정값"과 정렬. 4단계 순서 자체는 명확 |
| 8 | 적합 | "스크류 조합" → "스크류 구성" (선택) | "screw configuration"의 통용 역어는 '구성'. 의미 오류는 아님 |
| 9 | ⚠️ 비대칭 | EN에 "Do not use glass transition and crystallization interchangeably." 추가 | KO 마지막 문장("유리전이와 결정화를 동일하게 쓰지 않습니다")의 EN 쌍이 없음. 이 구분은 PHA 형상 고정 논리의 핵심이므로 반드시 양쪽에 존재해야 함 |
| 10 | 적합 | EN "MFR or viscosity" → "MFR or viscosity **trends**" | KO "추이"가 EN에 빠짐. 단일 측정이 아닌 추이 비교라는 취지 유지. '일정한 시험조건' 단서는 정확하고 중요 |

**과장 표현 점검**: '안전', '최적', '양품 보장'은 10개 항목 어디에도 없습니다. '실측'도 없으나 4번의 '실제'가 같은 계열의 단정 표현이므로 위와 같이 '측정'으로 교체를 권장합니다.

**불확실성 명시**: 5번의 '결정화 지연' 제안은 일반적인 PHA 가공 지식에 기반한 추정입니다. 앱이 이 항목을 원인 후보 목록으로 쓰는지, 상태 설명으로 쓰는지에 따라 원문 유지가 맞을 수도 있습니다. 6번의 스크류 위치 부호 규약, 3번의 오븐-Karl Fischer 표기(하이픈 여부)는 장비·표준 문서 확인 없이는 단정할 수 없어 문구 수준에서만 검수했습니다. 공정 숫자는 추가하지 않았습니다.
