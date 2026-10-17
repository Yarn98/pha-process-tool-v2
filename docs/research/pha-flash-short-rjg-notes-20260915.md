# 플래시·숏샷 동시 발생: 사출 제어 원문 대조

검토일: 2026-09-15. 현장 적용 순서는 [통합 조사 가이드](PHA_FLASH_SHORT_SHOT_20260915.md)에 있다. 이 문서는 일반적인 속도제어 충전 → 압력제어 보압의 근거와 적용 한계만 기록한다.

| 구분 | 직접 확인한 원문과 핵심 | 적용 한계 |
|---|---|---|
| 금형 접촉 | [RJG — Two Causes of Flash](https://rjginc.com/the-two-causes-of-flash/): 금형 맞춤면 문제와 압력에 의한 누출을 구분 | 플래시 위치만으로 원인을 확정하지 않는다 |
| 실제 충전 속도 | [RJG — Short Shots](https://rjginc.com/short-shots-whats-the-deal/): 점도 상승으로 압력 상한에 걸리면 설정 속도를 유지하지 못할 수 있음 | 설정 속도 상승이나 압력 상한 해제가 해결을 보장하지 않는다 |
| 국부 유동 저항 | [Autodesk 용어집](https://help.autodesk.com/cloudhelp/2026/ENU/Inventor-Help/files/GUID-63A5DCE8-2B43-494F-8F56-7A7CBBAD41FC.htm): 콜드 슬러그, 유동 정체, 국부 과충전, 압력 구배 | 일반 열가소성 용어이며 PHA 온도 범위를 제공하지 않는다 |
| 충전전용 시험 | [RJG — Fill-Only](https://rjginc.com/establishing-a-fill-only-part-sometimes-easier-said-than-done/): 중량과 체적 충전율의 차이, 이른 전환으로 박육부가 굳는 예외 | 고정 95–98%를 모든 제품에 적용하지 않는다 |
| 보압 단계 속도 | [RJG — Second Stage Speed, PDF 1–2쪽](https://rjginc.com/wp-content/uploads/2018/09/How_Second_Stage_Speed_Influences_Your_Process.pdf): 보압 도달 속도가 압력 응답에 관여. 일부 장비는 마지막 충전 속도를 이어 사용 | 지나친 말기 감속과 보압 응답 저하를 분리 확인. 원문 예제 속도는 재사용하지 않는다 |
| 전환 순간 압력 | [ARBURG — Filling multi-cavity moulds, 2024-12-12](https://www.arburg.com/en/gb/company/news-press-releases/detail/filling-multi-cavity-moulds/): 전환 피크는 플래시, 목표 보압 아래 함몰은 유동 지연에 영향 | 특정 OEM 기능의 소개다. 다른 장비에 같은 제어 기능·효과가 있다고 주장하지 않는다 |
| 캐비티 균형 | [ARBURG today 64/2017, PDF 27쪽](https://www.arburg.com/media/daten/publications/today/Arburg_today64_2017_681763_en_gb.pdf#page=27): 전환 램프가 충전 균형을 도울 수 있지만 잘 균형 잡힌 금형을 대신하지 않음 | 전체 평균보다 캐비티별 결과를 확인한다. 개선율을 일반화하지 않는다 |
| 보압 전달·시간 | [Autodesk — Packing profiles](https://help.autodesk.com/cloudhelp/2016/ENU/MoldflowComm/files/GUID-927CDD74-5892-4FA5-85D3-E0354F8A5654.htm), [Hold pressure result](https://help.autodesk.com/cloudhelp/2015/ENU/MoldflowComm/files/GUID-EB62DC0B-3FE4-4F42-8DF2-D5A1E71E66AA.htm): 게이트 고화·압력 전달·중량과 유지시간 관계 | 해석 지침의 메커니즘이며 실제 금형 해석 결과가 아니다. 고정 보압비·시간을 전용하지 않는다 |

HTML 본문과 두 RJG/ARBURG PDF의 관련 본문을 직접 확인했다. BASF 공식 PDF 재조회는 서버 오류로 실패하여 이번 신규 결론의 근거로 추가하지 않았다. 사용자 수지의 그레이드·배합과 실제 온도·압력·속도는 미확인이다. 생산 조건 확정이나 설비 시험을 수행하지 않았다.
