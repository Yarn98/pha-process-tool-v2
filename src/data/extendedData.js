// 추가 기능 데이터 - Analytics 및 Field DOE Kit
// 원본 기능을 확장하여 정량 분석 및 현장 지원 기능 제공

export const DEGRADATION_THRESHOLD = 180

export const fieldKitResources = [
  {
    name: 'DOE CSV 템플릿',
    file: 'doe_injection_flash_template.csv',
    summary: '**S1000P/A1000P 사출 Flash 최소화 & 용접선 강도 확보 DOE** 입력용 템플릿입니다.',
    bullets: [
      'UTF-8 CSV, 헤더 고정 (run_id~scrap_flag)',
      'Flash/용접선/압력/프리즈/사이클 데이터를 실험 후 즉시 기록',
      'scrap_flag: 양품=0, 불량=1'
    ]
  },
  {
    name: '분석 파이썬 스크립트',
    file: 'analyze_doe_flash.py',
    summary: '반응표면(2차 RSM) + **LASSO 변수선택**으로 플래시 최소 권장조건을 산출합니다.',
    bullets: [
      '의존성: python>=3.9, pandas, numpy, scikit-learn, scipy',
      '입력 CSV → results/recommendations.txt & model_report.json 출력',
      '용접선 강도/사출압 제약을 자동 반영'
    ]
  },
  {
    name: '현장 SOP 체크리스트',
    file: 'SOP_field_run_checklist.md',
    summary: '현장 실험 전·중·후 **체크리스트 & 데이터 품질 가이드**입니다.',
    bullets: [
      '사전 점검, 실험 설계(Box–Behnken), 데이터 기록 항목 포함',
      '냉각 단축, 유속 보정 등 실행 팁 정리',
      '재검증 → 데이터 재투입 반복 절차 안내'
    ]
  }
]

export const quickLoop = [
  '템플릿 CSV에 실험값 기록 후 빈칸 응답을 채움',
  '`python analyze_doe_flash.py doe_injection_flash_template.csv` 실행',
  'results/recommendations.txt 조건으로 5주기 재검증',
  '재검증 데이터를 CSV에 추가 후 스크립트를 재실행'
]

export const analyticsMeta = {
  crystallizationWindow: {
    label: 'Crystallization Window (Tm − Tg)',
    unit: '°C',
    description:
      'Tm과 Tg 차이가 클수록 **가공 윈도우**가 넓어지고 치수 안정성이 높아집니다. A1000P는 완전 비결정성으로 해당 지표가 정의되지 않습니다.'
  },
  modulusRetention: {
    label: 'Modulus Retention @100°C',
    unit: '%',
    description: '25°C 대비 100°C에서의 저장 탄성률 비율로, **고온 형상 유지성**을 의미합니다.'
  },
  modulusDrop: {
    label: 'Modulus Drop 25→100°C',
    unit: '%',
    description: '온도 상승 시 탄성률 하락폭으로 **열 민감도**를 확인합니다.'
  },
  tanDeltaPeak: {
    label: 'tan δ Peak',
    unit: '',
    description: '**완화 거동**의 정점으로, 고온 충격 감쇠 성능을 가늠합니다.'
  },
  safetyMargin: {
    label: 'Degradation Safety Margin',
    unit: '°C',
    description: '권장 Melt 조건과 180°C 열분해 한계 사이의 **안전 여유**를 나타냅니다.'
  },
  normalizedStrength: {
    label: 'Tensile Strength / Density',
    unit: 'MPa·cm³/g',
    description: '밀도당 인장강도로 **비강도 비교**에 활용합니다.'
  },
  shrinkageEstimate: {
    label: 'Estimated Mold Shrinkage',
    unit: '%',
    description: '결정화도가 높은 등급일수록 수축률이 커지는 경험식을 적용했습니다 (0.2% + 0.016×Crystallinity%).'
  }
}
