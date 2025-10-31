import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const DEGRADATION_THRESHOLD = 180

const renderMarkdown = (text) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

const md = (text) => ({ __html: renderMarkdown(text) })

// Helper functions to get static Tailwind classes based on color
const getProcessFlowClasses = (color) => {
  const classMap = {
    blue: 'bg-blue-50 border-blue-600',
    orange: 'bg-orange-50 border-orange-600',
    purple: 'bg-purple-50 border-purple-600',
    green: 'bg-green-50 border-green-600'
  }
  return classMap[color] || 'bg-gray-50 border-gray-600'
}

const getProcessFlowBadgeClasses = (color) => {
  const classMap = {
    blue: 'bg-gradient-to-br from-blue-600 to-blue-800',
    orange: 'bg-gradient-to-br from-orange-600 to-orange-800',
    purple: 'bg-gradient-to-br from-purple-600 to-purple-800',
    green: 'bg-gradient-to-br from-green-600 to-green-800'
  }
  return classMap[color] || 'bg-gradient-to-br from-gray-600 to-gray-800'
}

const getTroubleshootingClasses = (color) => {
  const classMap = {
    red: 'bg-gradient-to-r from-red-50 to-red-100 border-red-500',
    orange: 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-500',
    yellow: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-500',
    green: 'bg-gradient-to-r from-green-50 to-green-100 border-green-500',
    blue: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500'
  }
  return classMap[color] || 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-500'
}

const thermalData = {
  S1000P: [
    { temp: -50, modulus: 2800, tanDelta: 0.02 },
    { temp: -25, modulus: 2400, tanDelta: 0.03 },
    { temp: 0, modulus: 1800, tanDelta: 0.05 },
    { temp: 25, modulus: 1200, tanDelta: 0.08 },
    { temp: 50, modulus: 800, tanDelta: 0.12 },
    { temp: 75, modulus: 400, tanDelta: 0.18 },
    { temp: 100, modulus: 200, tanDelta: 0.25 },
    { temp: 125, modulus: 50, tanDelta: 0.35 },
    { temp: 150, modulus: 20, tanDelta: 0.28 },
    { temp: 175, modulus: 15, tanDelta: 0.15 }
  ],
  A1000P: [
    { temp: -50, modulus: 2200, tanDelta: 0.03 },
    { temp: -25, modulus: 1800, tanDelta: 0.04 },
    { temp: 0, modulus: 1400, tanDelta: 0.06 },
    { temp: 25, modulus: 900, tanDelta: 0.1 },
    { temp: 50, modulus: 400, tanDelta: 0.2 },
    { temp: 75, modulus: 150, tanDelta: 0.35 },
    { temp: 100, modulus: 80, tanDelta: 0.3 },
    { temp: 125, modulus: 40, tanDelta: 0.25 },
    { temp: 150, modulus: 25, tanDelta: 0.2 },
    { temp: 175, modulus: 20, tanDelta: 0.15 }
  ]
}

const mechanicalComparison = [
  { property: 'Tensile Strength', S1000P: 35, A1000P: 18, unit: 'MPa' },
  { property: 'Elongation at Break', S1000P: 8, A1000P: 450, unit: '%' },
  { property: "Young's Modulus", S1000P: 1200, A1000P: 12, unit: 'MPa' },
  { property: 'Impact Strength', S1000P: 3.5, A1000P: 25, unit: 'kJ/m²' },
  { property: 'Flexural Modulus', S1000P: 1400, A1000P: 15, unit: 'MPa' },
  { property: 'Shore D Hardness', S1000P: 65, A1000P: 35, unit: '' }
]

const processingData = [
  {
    parameter: 'Melt Temperature',
    S1000P_min: 155,
    S1000P_opt: 165,
    S1000P_max: 175,
    A1000P_min: 145,
    A1000P_opt: 155,
    A1000P_max: 165
  },
  {
    parameter: 'Mold Temperature',
    S1000P_min: 40,
    S1000P_opt: 60,
    S1000P_max: 80,
    A1000P_min: 20,
    A1000P_opt: 30,
    A1000P_max: 40
  },
  {
    parameter: 'Injection Pressure',
    S1000P_min: 80,
    S1000P_opt: 100,
    S1000P_max: 120,
    A1000P_min: 60,
    A1000P_opt: 80,
    A1000P_max: 100
  },
  {
    parameter: 'Cooling Time',
    S1000P_min: 20,
    S1000P_opt: 30,
    S1000P_max: 40,
    A1000P_min: 15,
    A1000P_opt: 20,
    A1000P_max: 30
  }
]

const crystallinityEffects = [
  { property: 'Tg', S1000P: 4, A1000P: -15 },
  { property: 'Tm', S1000P: 165, A1000P: 0 },
  { property: 'Crystallinity', S1000P: 45, A1000P: 0 },
  { property: 'Density', S1000P: 1.25, A1000P: 1.2 },
  { property: 'Water Uptake', S1000P: 0.2, A1000P: 0.4 },
  { property: 'Biodegradation Rate', S1000P: 100, A1000P: 150 }
]

const applicationSuitability = [
  { application: 'Rigid Packaging', S1000P: 95, A1000P: 20 },
  { application: 'Flexible Film', S1000P: 30, A1000P: 90 },
  { application: 'Injection Molding', S1000P: 90, A1000P: 40 },
  { application: 'Blow Molding', S1000P: 85, A1000P: 30 },
  { application: 'Thermoforming', S1000P: 80, A1000P: 85 },
  { application: 'Coating', S1000P: 25, A1000P: 95 },
  { application: '3D Printing', S1000P: 70, A1000P: 60 },
  { application: 'Fiber Spinning', S1000P: 75, A1000P: 35 }
]

const polymerSpecs = {
  S1000P: {
    name: 'P34HB S1000P',
    type: 'Semi-crystalline',
    fourHB: '2-5%',
    color: '#8b5cf6',
    characteristics: [
      '**High crystallinity** (45-50%)',
      '**Tg** = 4°C, **Tm** = 165°C',
      'Excellent **dimensional stability**',
      'Superior **chemical resistance**',
      'Optimal for **rigid applications**'
    ],
    tg: 4,
    tm: 165,
    crystallinity: 45,
    density: 1.25
  },
  A1000P: {
    name: 'P34HB A1000P',
    type: 'Amorphous',
    fourHB: '30%',
    color: '#06b6d4',
    characteristics: [
      '**Fully amorphous** structure',
      '**Tg** = -15°C, no melting point',
      'Outstanding **elongation** (>400%)',
      'Excellent **impact resistance**',
      'Superior **film clarity**'
    ],
    tg: -15,
    tm: null,
    crystallinity: 0,
    density: 1.2
  }
}

const fieldKitResources = [
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

const quickLoop = [
  '템플릿 CSV에 실험값 기록 후 빈칸 응답을 채움',
  '`python analyze_doe_flash.py doe_injection_flash_template.csv` 실행',
  'results/recommendations.txt 조건으로 5주기 재검증',
  '재검증 데이터를 CSV에 추가 후 스크립트를 재실행'
]

const analyticsMeta = {
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

const getThermalValue = (polymer, temp) => {
  const row = thermalData[polymer].find((entry) => entry.temp === temp)
  return row ? row.modulus : null
}

const computeDerivedMetrics = (polymer) => {
  const spec = polymerSpecs[polymer]
  const modulus25 = getThermalValue(polymer, 25)
  const modulus100 = getThermalValue(polymer, 100)
  const tanDeltaPeak = Math.max(...thermalData[polymer].map((entry) => entry.tanDelta))
  const meltOpt = processingData.find((row) => row.parameter === 'Melt Temperature')?.[`${polymer}_opt`]
  const tensile = mechanicalComparison.find((row) => row.property === 'Tensile Strength')?.[polymer]
  const density = spec.density ?? crystallinityEffects.find((row) => row.property === 'Density')?.[polymer]

  const modulusRetention = modulus25 ? (modulus100 / modulus25) * 100 : null
  const modulusDrop = modulus25 ? ((modulus25 - (modulus100 ?? 0)) / modulus25) * 100 : null
  const crystallizationWindow = spec.tm != null && spec.tg != null ? spec.tm - spec.tg : null
  const safetyMargin = meltOpt != null ? DEGRADATION_THRESHOLD - meltOpt : null
  const normalizedStrength = tensile != null && density ? tensile / density : null
  const shrinkageEstimate = spec.crystallinity != null ? 0.2 + 0.016 * spec.crystallinity : null

  return {
    crystallizationWindow,
    modulusRetention,
    modulusDrop,
    tanDeltaPeak,
    safetyMargin,
    normalizedStrength,
    shrinkageEstimate
  }
}

const formatMetricValue = (value, unit) => {
  if (value == null || Number.isNaN(value)) return '—'
  const digits = Math.abs(value) >= 100 ? 0 : 2
  const formatted = value.toFixed(digits)
  return unit ? `${formatted} ${unit}` : formatted
}

const PHAPropertiesDashboard = () => {
  const [selectedPolymer, setSelectedPolymer] = useState('S1000P')
  const [injectionTab, setInjectionTab] = useState(0)

  // Calculator states
  const [calcInputs, setCalcInputs] = useState({
    pAvg: 500,
    aProj: 2000,
    fClamp: 1200,
    aProj2: 2000,
    safetyFactor: 0.8,
    flowRate: 50,
    runnerRadius: 0.4,
    pInjPeak: 1500
  })

  const [calcResults, setCalcResults] = useState({
    clamp: null,
    pressure: null,
    shear: null,
    packing: null
  })

  const derived = useMemo(() => computeDerivedMetrics(selectedPolymer), [selectedPolymer])

  // Calculator functions
  const calculateClampTonnage = () => {
    const tonnage = (calcInputs.pAvg * calcInputs.aProj) / 1000
    const recommended = tonnage * 1.2
    setCalcResults(prev => ({
      ...prev,
      clamp: { tonnage, recommended }
    }))
  }

  const calculatePressureLimit = () => {
    // Validate inputs to prevent division by zero
    if (!calcInputs.aProj2 || calcInputs.aProj2 <= 0) {
      alert('오류: 투영 면적(A_proj)은 0보다 커야 합니다.')
      return
    }

    const pressureLimit = (calcInputs.safetyFactor * calcInputs.fClamp * 1000) / calcInputs.aProj2
    setCalcResults(prev => ({
      ...prev,
      pressure: { pressureLimit, safetyFactor: calcInputs.safetyFactor }
    }))
  }

  const calculateShearRate = () => {
    // Validate inputs to prevent division by zero
    if (!calcInputs.runnerRadius || calcInputs.runnerRadius <= 0) {
      alert('오류: 러너 반경은 0보다 커야 합니다.')
      return
    }

    const shearRate = (4 * calcInputs.flowRate) / (Math.PI * Math.pow(calcInputs.runnerRadius, 3))
    setCalcResults(prev => ({
      ...prev,
      shear: { shearRate }
    }))
  }

  const calculatePackingPressure = () => {
    const p1Min = calcInputs.pInjPeak * 0.30
    const p1Max = calcInputs.pInjPeak * 0.45
    const p2Min = calcInputs.pInjPeak * 0.15
    const p2Max = calcInputs.pInjPeak * 0.30
    setCalcResults(prev => ({
      ...prev,
      packing: { p1Min, p1Max, p2Min, p2Max }
    }))
  }

  const downloadThermalData = () => {
    const headers = ['temp', 'modulus', 'tanDelta']
    const rows = thermalData[selectedPolymer]
      .map(({ temp, modulus, tanDelta }) => `${temp},${modulus},${tanDelta}`)
      .join('\n')
    const csv = `${headers.join(',')}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedPolymer}_thermal_data.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2" dangerouslySetInnerHTML={md('**P34HB** Polymer Properties Analysis')} />
        <p className="text-gray-600">Comprehensive characterization of semi-crystalline and amorphous variants</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
        {Object.entries(polymerSpecs).map(([key, spec]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all ${selectedPolymer === key ? 'ring-2 ring-offset-2 ring-offset-slate-50' : ''}`}
            style={{ borderColor: selectedPolymer === key ? spec.color : '' }}
            onClick={() => setSelectedPolymer(key)}
          >
            <CardHeader className="pb-3">
              <CardTitle style={{ color: spec.color }}>{spec.name}</CardTitle>
              <CardDescription>
                {spec.type} • {spec.fourHB} 4HB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {spec.characteristics.map((char, idx) => (
                  <div key={idx} dangerouslySetInnerHTML={{ __html: renderMarkdown(char) }} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="thermal" className="w-full">
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="thermal">Thermal</TabsTrigger>
          <TabsTrigger value="mechanical">Mechanical</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="crystallinity">Structure</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="fieldKit">Field DOE Kit</TabsTrigger>
          <TabsTrigger value="injectionGuide">사출 가이드</TabsTrigger>
        </TabsList>

        <TabsContent value="thermal">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Dynamic Mechanical Analysis</CardTitle>
                <CardDescription dangerouslySetInnerHTML={md('Temperature-dependent **viscoelastic** behavior')} />
              </div>
              <button onClick={downloadThermalData} className="mt-2 sm:mt-0 px-3 py-1 text-sm border rounded hover:bg-gray-50">
                Download CSV
              </button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={thermalData[selectedPolymer]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="temp" label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -5 }} />
                  <YAxis yAxisId="left" label={{ value: 'Storage Modulus (MPa)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'tan δ', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="modulus"
                    stroke={polymerSpecs[selectedPolymer].color}
                    name="E' (MPa)"
                    strokeWidth={2}
                  />
                  <Line yAxisId="right" type="monotone" dataKey="tanDelta" stroke="#ef4444" name="tan δ" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <div dangerouslySetInnerHTML={md('The **glass transition** manifests as a sharp drop in storage modulus accompanied by a **tan δ peak**.')} />
                <div
                  dangerouslySetInnerHTML={md(
                    selectedPolymer === 'S1000P'
                      ? 'The semi-crystalline structure maintains significant modulus above Tg due to **crystalline domains** acting as physical crosslinks.'
                      : 'The amorphous structure shows complete **viscous flow** above Tg with no crystalline reinforcement.'
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mechanical">
          <Card>
            <CardHeader>
              <CardTitle>Mechanical Properties Comparison</CardTitle>
              <CardDescription dangerouslySetInnerHTML={md('Quantitative analysis of **structure-property** relationships')} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mechanicalComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="property" angle={-45} textAnchor="end" height={100} />
                  <YAxis scale="log" domain={[0.1, 10000]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="S1000P" fill="#8b5cf6" />
                  <Bar dataKey="A1000P" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div
                  className="p-3 bg-purple-50 rounded"
                  dangerouslySetInnerHTML={md('<strong>S1000P:</strong> High **modulus** and **strength** from crystalline reinforcement. Limited elongation due to **restricted chain mobility**.')}
                />
                <div
                  className="p-3 bg-cyan-50 rounded"
                  dangerouslySetInnerHTML={md('<strong>A1000P:</strong> Exceptional **elongation** and **toughness** from amorphous chain entanglements. Low modulus enables **elastomeric** behavior.')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>Processing Windows</CardTitle>
              <CardDescription dangerouslySetInnerHTML={md('Optimal **thermomechanical** processing parameters')} />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {processingData.map((param) => (
                  <div key={param.parameter}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{param.parameter}</span>
                      <span className="text-sm text-gray-500">
                        {param.parameter.includes('Temperature') && '°C'}
                        {param.parameter.includes('Pressure') && 'bar'}
                        {param.parameter.includes('Time') && 's'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-sm">S1000P</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div
                            className="absolute h-6 bg-purple-400 rounded-full opacity-50"
                            style={{
                              left: `${(param.S1000P_min / 200) * 100}%`,
                              width: `${((param.S1000P_max - param.S1000P_min) / 200) * 100}%`
                            }}
                          />
                          <div className="absolute h-6 w-1 bg-purple-600" style={{ left: `${(param.S1000P_opt / 200) * 100}%` }} />
                        </div>
                        <span className="text-sm w-16">{param.S1000P_opt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-20 text-sm">A1000P</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div
                            className="absolute h-6 bg-cyan-400 rounded-full opacity-50"
                            style={{
                              left: `${(param.A1000P_min / 200) * 100}%`,
                              width: `${((param.A1000P_max - param.A1000P_min) / 200) * 100}%`
                            }}
                          />
                          <div className="absolute h-6 w-1 bg-cyan-600" style={{ left: `${(param.A1000P_opt / 200) * 100}%` }} />
                        </div>
                        <span className="text-sm w-16">{param.A1000P_opt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="mt-6 p-4 bg-amber-50 rounded-lg text-sm"
                dangerouslySetInnerHTML={md(
                  '<strong>Critical consideration:</strong> P34HB exhibits **thermal degradation** above 180°C. Maintain **residence time** below 5 minutes at processing temperature. A1000P requires lower **mold temperatures** to prevent sticking due to its **tacky** amorphous nature.'
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crystallinity">
          <Card>
            <CardHeader>
              <CardTitle>Structure-Property Correlations</CardTitle>
              <CardDescription dangerouslySetInnerHTML={md('Impact of **crystallinity** on material behavior')} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={crystallinityEffects}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="property" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="S1000P" fill="#8b5cf6" />
                  <Bar dataKey="A1000P" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3 text-sm">
                <div
                  className="p-3 bg-gray-50 rounded"
                  dangerouslySetInnerHTML={md('<strong>Glass transition (Tg):</strong> The **4HB comonomer** acts as an internal plasticizer, reducing Tg from 4°C (S1000P) to -15°C (A1000P) through enhanced **free volume**.')}
                />
                <div
                  className="p-3 bg-gray-50 rounded"
                  dangerouslySetInnerHTML={md('<strong>Melting behavior:</strong> S1000P exhibits a sharp **endotherm** at 165°C from P3HB crystallites. A1000P remains fully amorphous due to **sequence disruption** from high 4HB content.')}
                />
                <div
                  className="p-3 bg-gray-50 rounded"
                  dangerouslySetInnerHTML={md('<strong>Biodegradation kinetics:</strong> Amorphous regions undergo preferential **enzymatic hydrolysis**. A1000P degrades 50% faster despite identical **chemical composition**.')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Application Suitability Matrix</CardTitle>
              <CardDescription dangerouslySetInnerHTML={md('Performance evaluation across **converting technologies**')} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={applicationSuitability}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="application" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="S1000P" dataKey="S1000P" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  <Radar name="A1000P" dataKey="A1000P" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2 text-purple-600">S1000P Applications</h4>
                  <ul className="space-y-1 text-sm">
                    <li dangerouslySetInnerHTML={md('• **Injection molded** rigid containers')} />
                    <li dangerouslySetInnerHTML={md('• **Blow molded** bottles (carbonated beverages)')} />
                    <li dangerouslySetInnerHTML={md('• **Thermoformed** trays and clamshells')} />
                    <li dangerouslySetInnerHTML={md('• **3D printing** filaments (FDM/FFF)')} />
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-cyan-600">A1000P Applications</h4>
                  <ul className="space-y-1 text-sm">
                    <li dangerouslySetInnerHTML={md('• **Blown films** for agricultural mulch')} />
                    <li dangerouslySetInnerHTML={md('• **Coating** for paper and cardboard')} />
                    <li dangerouslySetInnerHTML={md('• **Hot melt adhesives** (pressure-sensitive)')} />
                    <li dangerouslySetInnerHTML={md('• **Elastomeric** compounds (TPE replacement)')} />
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Derived Analytics & Formulas</CardTitle>
              <CardDescription>
                {selectedPolymer} 기반 **정량 KPI**를 계산해 공정 민감도를 빠르게 검토합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(analyticsMeta).map(([key, meta]) => (
                  <Card key={key} className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{meta.label}</CardTitle>
                      <CardDescription className="text-xs uppercase tracking-wide text-slate-500">
                        {selectedPolymer}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatMetricValue(derived[key], meta.unit)}
                      </p>
                      <p className="text-xs text-slate-600" dangerouslySetInnerHTML={md(meta.description)} />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
                <p className="font-semibold">계산식 요약</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <span dangerouslySetInnerHTML={md('**Crystallization Window** = T<sub>m</sub> − T<sub>g</sub> (semi-crystalline에만 적용)')} />
                  </li>
                  <li>
                    <span dangerouslySetInnerHTML={md('**Modulus Retention** = E′<sub>100°C</sub> / E′<sub>25°C</sub> × 100')} />
                  </li>
                  <li>
                    <span dangerouslySetInnerHTML={md('**Safety Margin** = 180°C − Melt<sub>opt</sub>')} />
                  </li>
                  <li>
                    <span dangerouslySetInnerHTML={md('**Shrinkage Estimate** = 0.2% + 0.016 × Crystallinity%')} />
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fieldKit">
          <Card>
            <CardHeader>
              <CardTitle>Field DOE 실행 세트</CardTitle>
              <CardDescription dangerouslySetInnerHTML={md('CSV 템플릿·파이썬 스크립트·SOP까지 한 번에 제공합니다.')} />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {fieldKitResources.map((resource) => (
                  <Card key={resource.file} className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{resource.name}</CardTitle>
                      <CardDescription dangerouslySetInnerHTML={md(resource.summary)} />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {resource.bullets.map((line, idx) => (
                          <li key={idx} dangerouslySetInnerHTML={md(line)} />
                        ))}
                      </ul>
                      <a
                        href={`/${resource.file}`}
                        download
                        className="inline-flex items-center justify-center rounded border border-slate-400 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        파일 다운로드
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
                <p className="font-semibold">빠른 실행 루프</p>
                <ol className="list-decimal space-y-1 pl-5">
                  {quickLoop.map((step, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={md(step)} />
                  ))}
                </ol>
                <p className="text-xs text-slate-500">
                  TARS DOE 탭 루프 이슈가 있는 경우 <code>patches/tars_doe_autofit_loop_fix.patch</code>를 적용해 자동 재피팅을 차단할 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="injectionGuide">
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl mb-2">PHA 36-캐비티 플래시 제어 현장 가이드</CardTitle>
                  <CardDescription className="text-blue-100">
                    압력-동기형 4단 제어 + 러너 보호 통합 솔루션
                  </CardDescription>
                </div>
                <div className="text-right text-sm">
                  <div className="bg-white/20 px-3 py-1 rounded mb-1">재질: P3HB4 (S1000P/A1000P)</div>
                  <div className="bg-white/20 px-3 py-1 rounded mb-1">캐비티: 36-drop 멀티 캐비티</div>
                  <div className="bg-white/20 px-3 py-1 rounded">목표: 플래시 ≤0.02mm</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Sub-tabs Navigation */}
              <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
                {['📋 전체 개요', '⚙️ 기계 설정', '🧮 계산기', '📊 프로세스 플로우', '✅ 체크리스트', '🔧 문제 해결'].map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInjectionTab(idx)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      injectionTab === idx
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab 0: Overview */}
              {injectionTab === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4">제어 전략 핵심 개요</h2>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-l-4 border-green-500">
                    <h3 className="text-xl font-bold mb-3 text-green-800">🎯 제어 원칙</h3>
                    <p className="font-bold mb-2">"러너가 대부분 찰 때까지는 압력 제한으로 보호하고, 캐비티 충전 이후는 캐비티압 기반으로 달린다"</p>
                    <p className="text-sm text-green-800">플래시의 근본 원인은 금형 손상 또는 캐비티압이 클램프 한계를 초과하는 것입니다. 이 전략은 두 가지 원인을 모두 구조적으로 차단합니다.</p>
                  </div>

                  <h3 className="text-xl font-bold text-blue-900 mt-6 mb-4">4단 제어 로직</h3>

                  <div className="space-y-4">
                    {[
                      {
                        stage: 'V0',
                        title: 'Runner-Protect (압력 제한 속도 제어)',
                        desc: '러너 체적의 약 90%까지는 압력 상한을 걸어 중속으로 채웁니다. 상한은 클램프 대비 80% 이내로 설정하여 스프루 플래시와 전단발열을 차단합니다.'
                      },
                      {
                        stage: 'V1',
                        title: '캐비티 충전 고속 (92-96%)',
                        desc: '게이트 돌입 이후에는 얇은벽 충전성 확보를 위해 고속을 사용합니다. 단, 노즐/사출압 상한을 설정해 압력 폭주를 억제합니다.'
                      },
                      {
                        stage: 'V2',
                        title: 'EoF 브레이크 (종단 감속)',
                        desc: '충전 끝(End of Fill) 4-8mm 구간에서 선형 감속으로 압력 오버슈트를 제거합니다.'
                      },
                      {
                        stage: 'V3',
                        title: '보압 램프-인/조기 종료',
                        desc: '게이트 동결 시점을 산정하고 P1(짧게) → P2(낮게) 2단 램프로 유지한 뒤 동결 직후 즉시 종료합니다.'
                      }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow hover:shadow-lg transition-shadow">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0">
                          {item.stage}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-blue-900 mb-2">{item.title}</div>
                          <div className="text-gray-700 text-sm">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-xl font-bold text-blue-900 mt-6 mb-4">보조 제어 요소</h3>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                          <th className="p-3 text-left font-bold">구분</th>
                          <th className="p-3 text-left font-bold">제어 방법</th>
                          <th className="p-3 text-left font-bold">목적</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: '러너 전단 관리', method: '러너 R 증대 또는 V0 속도 하향', purpose: '전단률 억제로 전단발열·점도붕괴 방지' },
                          { name: '스프루 국부 냉각', method: '스프루/1차 분기에 -2~-5°C 저온 인서트', purpose: '파팅 라인에 씰링 스킨 조기 형성' },
                          { name: '게이트 동결 균질화', method: '게이트 구경 ±0.02mm 미세 조정', purpose: '동결 시간 편차 ≤0.1s로 균질화' },
                          { name: '용융 안정성', method: '최저 용융온도, 체류시간·rpm·백프레셔 저감', purpose: 'PHA β-elimination 열분해 억제, MW 보존' },
                          { name: '결정화 가속', method: 'BN·탈크 0.05-0.20 wt% 저농도 첨가', purpose: 'Tc 상승·t½ 단축으로 스킨 조기 형성' }
                        ].map((row, idx) => (
                          <tr key={idx} className="border-b hover:bg-blue-50 transition-colors">
                            <td className="p-3 font-semibold">{row.name}</td>
                            <td className="p-3">{row.method}</td>
                            <td className="p-3">{row.purpose}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border-l-4 border-red-500 mt-6">
                    <h3 className="text-xl font-bold mb-3 text-red-800">⚠️ PHA 재료 특성 주의사항</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong className="text-red-700">β-elimination 열분해:</strong> PHB 계열은 약 190°C 이상에서 급속 열분해가 발생하며 분자량이 하락합니다.</p>
                      <p><strong className="text-red-700">좁은 가공창:</strong> 융점 근처에서 가공해야 하며 과열 시 가스 발생과 점도 하락이 동반됩니다.</p>
                      <p><strong className="text-red-700">느린 결정화:</strong> 일반 PE/PP 대비 결정화 속도가 느려 게이트 동결 시간이 길어질 수 있습니다.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Machine Settings */}
              {injectionTab === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4">기계 설정 화면</h2>

                  {/* V0 Stage */}
                  <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-green-400 p-3 rounded mb-4 font-mono font-bold border-2 border-green-400 flex justify-between items-center">
                      <span>V0 STAGE: RUNNER PROTECTION</span>
                      <span className="text-sm opacity-80">러너 보호 구간</span>
                    </div>
                    <div className="bg-gray-800 text-yellow-400 p-3 rounded mb-4 font-bold border-2 border-yellow-400">
                      ▶ 설정 목적: 러너 체적 90%까지 압력 제한 중속 충전 - 스프루 플래시 방지
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Injection Velocity V0', value: '30-50 mm/s', note: '중속 설정 (러너 충전용)' },
                        { label: 'Pressure Limit', value: '0.8 × F_clamp/A_proj bar', note: '클램프 한계의 80% 이내' },
                        { label: 'Switchover Position', value: '0.9 × V_runner mm', note: '러너 체적의 90% 지점' },
                        { label: 'Shear Rate Control', value: 'γ̇ = 4Q/(πR³) s⁻¹', note: '러너 전단률 모니터링' }
                      ].map((param, idx) => (
                        <div key={idx} className="bg-gray-700 p-4 rounded border-2 border-gray-600 hover:border-green-400 transition-colors">
                          <div className="text-cyan-400 text-xs font-bold uppercase mb-2">{param.label}</div>
                          <div className="text-white text-2xl font-bold font-mono mb-1">{param.value}</div>
                          <div className="text-gray-400 text-xs italic">{param.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* V1 Stage */}
                  <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-green-400 p-3 rounded mb-4 font-mono font-bold border-2 border-green-400 flex justify-between items-center">
                      <span>V1 STAGE: HIGH-SPEED CAVITY FILL</span>
                      <span className="text-sm opacity-80">캐비티 고속 충전</span>
                    </div>
                    <div className="bg-gray-800 text-yellow-400 p-3 rounded mb-4 font-bold border-2 border-yellow-400">
                      ▶ 설정 목적: 얇은벽 충전성 확보 - 게이트 돌입 후 고속 충전
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Injection Velocity V1', value: '80-150 mm/s', note: '얇은벽 충전용 고속' },
                        { label: 'Injection Pressure Limit', value: '설정 유지 bar', note: '압력 폭주 방지' },
                        { label: 'Fill Range', value: '92-96 %', note: 'V1 작동 구간' },
                        { label: 'Cavity Pressure Sensor', value: 'dP/dt Peak 감지', note: '마지막 충전 캐비티 기준' }
                      ].map((param, idx) => (
                        <div key={idx} className="bg-gray-700 p-4 rounded border-2 border-gray-600 hover:border-green-400 transition-colors">
                          <div className="text-cyan-400 text-xs font-bold uppercase mb-2">{param.label}</div>
                          <div className="text-white text-2xl font-bold font-mono mb-1">{param.value}</div>
                          <div className="text-gray-400 text-xs italic">{param.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* V2 & V3 Stages */}
                  <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-green-400 p-3 rounded mb-4 font-mono font-bold border-2 border-green-400 flex justify-between items-center">
                      <span>V2 STAGE: END-OF-FILL DECELERATION</span>
                      <span className="text-sm opacity-80">충전 끝 감속</span>
                    </div>
                    <div className="bg-gray-800 text-yellow-400 p-3 rounded mb-4 font-bold border-2 border-yellow-400">
                      ▶ 설정 목적: 압력 오버슈트 제거 - EoF 구간 선형 감속
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Injection Velocity V2', value: '20-40 mm/s', note: '선형 감속 목표 속도' },
                        { label: 'Deceleration Start Point', value: 'EoF -4~-8 mm', note: '충전 끝 4-8mm 전' }
                      ].map((param, idx) => (
                        <div key={idx} className="bg-gray-700 p-4 rounded border-2 border-gray-600 hover:border-green-400 transition-colors">
                          <div className="text-cyan-400 text-xs font-bold uppercase mb-2">{param.label}</div>
                          <div className="text-white text-2xl font-bold font-mono mb-1">{param.value}</div>
                          <div className="text-gray-400 text-xs italic">{param.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold mb-3 text-blue-800">📌 게이트 동결(Gate Seal) 시험 방법</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
                      <li><strong>1단계:</strong> 보압 시간을 0.5초부터 시작하여 0.5초씩 증가시키면서 샷을 진행합니다.</li>
                      <li><strong>2단계:</strong> 각 샷마다 제품 무게를 정밀하게 측정합니다.</li>
                      <li><strong>3단계:</strong> 무게가 더 이상 증가하지 않는 시점이 게이트 동결 시점입니다.</li>
                      <li><strong>4단계:</strong> 최후 동결 캐비티 기준으로 보압 종료 시간을 설정합니다.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Tab 2: Calculator */}
              {injectionTab === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4">설정값 계산기</h2>

                  {/* Clamp Tonnage Calculator */}
                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">1. 클램프 톤수 계산기</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block font-bold mb-2 text-gray-700">캐비티 평균 압력 P_avg (bar):</label>
                        <input
                          type="number"
                          value={calcInputs.pAvg}
                          onChange={(e) => setCalcInputs(prev => ({ ...prev, pAvg: Number(e.target.value) }))}
                          className="w-full p-3 border-2 border-gray-300 rounded focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-2 text-gray-700">제품 투영 면적 A_proj (cm²):</label>
                        <input
                          type="number"
                          value={calcInputs.aProj}
                          onChange={(e) => setCalcInputs(prev => ({ ...prev, aProj: Number(e.target.value) }))}
                          className="w-full p-3 border-2 border-gray-300 rounded focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={calculateClampTonnage}
                      className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded font-bold hover:shadow-lg transition-shadow mr-2"
                    >
                      계산하기
                    </button>
                    {calcResults.clamp && (
                      <div className="mt-4 bg-white p-4 rounded border-2 border-blue-600">
                        <h4 className="font-bold text-blue-900 mb-2">계산 결과</h4>
                        <div className="text-3xl font-bold text-blue-700 my-2">{calcResults.clamp.tonnage.toFixed(1)} tf</div>
                        <p className="text-sm"><strong>권장 클램프 톤수 (20% 여유):</strong> {calcResults.clamp.recommended.toFixed(1)} tf</p>
                        <p className="text-sm mt-1">현재 기계의 클램프 톤수가 {calcResults.clamp.recommended.toFixed(1)} tf 이상인지 확인하세요.</p>
                      </div>
                    )}
                  </div>

                  {/* Pressure Limit Calculator */}
                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">2. V0 압력 리밋 계산기</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block font-bold mb-2 text-gray-700">클램프 한계 (ton-force):</label>
                        <input
                          type="number"
                          value={calcInputs.fClamp}
                          onChange={(e) => setCalcInputs(prev => ({ ...prev, fClamp: Number(e.target.value) }))}
                          className="w-full p-3 border-2 border-gray-300 rounded focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-2 text-gray-700">제품 투영 면적 A_proj (cm²):</label>
                        <input
                          type="number"
                          value={calcInputs.aProj2}
                          onChange={(e) => setCalcInputs(prev => ({ ...prev, aProj2: Number(e.target.value) }))}
                          className="w-full p-3 border-2 border-gray-300 rounded focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-2 text-gray-700">안전 계수 (권장: 0.8):</label>
                        <input
                          type="number"
                          step="0.05"
                          value={calcInputs.safetyFactor}
                          onChange={(e) => setCalcInputs(prev => ({ ...prev, safetyFactor: Number(e.target.value) }))}
                          className="w-full p-3 border-2 border-gray-300 rounded focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={calculatePressureLimit}
                      className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded font-bold hover:shadow-lg transition-shadow"
                    >
                      계산하기
                    </button>
                    {calcResults.pressure && (
                      <div className="mt-4 bg-white p-4 rounded border-2 border-blue-600">
                        <h4 className="font-bold text-blue-900 mb-2">V0 압력 리밋 설정값</h4>
                        <div className="text-3xl font-bold text-blue-700 my-2">{calcResults.pressure.pressureLimit.toFixed(1)} bar</div>
                        <p className="text-sm"><strong>V0 단계에서 이 값을 압력 리밋으로 설정하세요.</strong></p>
                        <p className="text-sm mt-1">이 값은 클램프 한계의 {(calcResults.pressure.safetyFactor * 100).toFixed(0)}%로 계산되어 스프루 플래시를 방지합니다.</p>
                      </div>
                    )}
                  </div>

                  {/* Shear Rate Calculator */}
                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">3. 러너 전단률 계산기</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block font-bold mb-2 text-gray-700">체적 유량 Q (cm³/s):</label>
                        <input
                          type="number"
                          value={calcInputs.flowRate}
                          onChange={(e) => setCalcInputs(prev => ({ ...prev, flowRate: Number(e.target.value) }))}
                          className="w-full p-3 border-2 border-gray-300 rounded focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-2 text-gray-700">러너 반경 R (cm):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={calcInputs.runnerRadius}
                          onChange={(e) => setCalcInputs(prev => ({ ...prev, runnerRadius: Number(e.target.value) }))}
                          className="w-full p-3 border-2 border-gray-300 rounded focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={calculateShearRate}
                      className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded font-bold hover:shadow-lg transition-shadow"
                    >
                      계산하기
                    </button>
                    {calcResults.shear && (
                      <div className="mt-4 bg-white p-4 rounded border-2 border-blue-600">
                        <h4 className="font-bold text-blue-900 mb-2">러너 벽면 전단률</h4>
                        <div className="text-3xl font-bold text-blue-700 my-2">{calcResults.shear.shearRate.toFixed(0)} s⁻¹</div>
                        {calcResults.shear.shearRate > 50000 ? (
                          <p className="text-sm text-red-600"><strong>⚠️ 경고:</strong> 전단률이 매우 높습니다. V0 속도를 낮추거나 러너 직경을 증대하세요.</p>
                        ) : calcResults.shear.shearRate > 20000 ? (
                          <p className="text-sm text-orange-600"><strong>⚡ 주의:</strong> 전단률이 높은 편입니다. 모니터링이 필요합니다.</p>
                        ) : (
                          <p className="text-sm text-green-600"><strong>✅ 양호:</strong> 전단률이 적정 범위입니다.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Packing Pressure Calculator */}
                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">4. 보압 설정값 계산기</h3>
                    <div className="mb-4">
                      <label className="block font-bold mb-2 text-gray-700">최대 사출압 P_inj_peak (bar):</label>
                      <input
                        type="number"
                        value={calcInputs.pInjPeak}
                        onChange={(e) => setCalcInputs(prev => ({ ...prev, pInjPeak: Number(e.target.value) }))}
                        className="w-full p-3 border-2 border-gray-300 rounded focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={calculatePackingPressure}
                      className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded font-bold hover:shadow-lg transition-shadow"
                    >
                      계산하기
                    </button>
                    {calcResults.packing && (
                      <div className="mt-4 bg-white p-4 rounded border-2 border-blue-600">
                        <h4 className="font-bold text-blue-900 mb-2">보압 설정 권장값</h4>
                        <div className="text-2xl font-bold text-blue-700 my-2">
                          P1: {calcResults.packing.p1Min.toFixed(0)} - {calcResults.packing.p1Max.toFixed(0)} bar<br/>
                          P2: {calcResults.packing.p2Min.toFixed(0)} - {calcResults.packing.p2Max.toFixed(0)} bar
                        </div>
                        <p className="text-sm mt-2"><strong>P1 단계:</strong> {calcResults.packing.p1Min.toFixed(0)}-{calcResults.packing.p1Max.toFixed(0)} bar를 0.1-0.3초간 유지합니다.</p>
                        <p className="text-sm"><strong>P2 단계:</strong> {calcResults.packing.p2Min.toFixed(0)}-{calcResults.packing.p2Max.toFixed(0)} bar를 게이트 동결까지 유지합니다.</p>
                        <p className="text-sm mt-1">게이트 시일 시험으로 정확한 종료 시점을 결정하세요.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Process Flow */}
              {injectionTab === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4">프로세스 플로우 다이어그램</h2>

                  <div className="bg-white p-6 rounded-lg border-2 border-gray-300">
                    <h3 className="text-center text-xl font-bold text-blue-900 mb-6">4단 제어 프로세스 흐름도</h3>
                    <div className="space-y-4">
                      {[
                        { stage: 'V0', title: 'Runner Protection', color: 'blue', details: ['압력 제한 중속 (0-90% 러너)', '속도: 30-50 mm/s', '압력: 0.8 × F_clamp/A_proj', '목적: 스프루 플래시 방지', '전단발열·점도붕괴 차단'] },
                        { stage: 'V1', title: 'High-Speed Cavity Fill', color: 'orange', details: ['캐비티 고속 충전 (90-96%)', '속도: 80-150 mm/s', '전환: 캐비티압 dP/dt 피크', '목적: 얇은벽 충전성 확보', '압력 상한 유지'] },
                        { stage: 'V2', title: 'End-of-Fill Deceleration', color: 'purple', details: ['충전 끝 감속 (96-100%)', '속도: 20-40 mm/s (선형 감속)', '시작: EoF -4~-8 mm', '목적: 압력 오버슈트 제거', '플래시 방지'] },
                        { stage: 'V3', title: 'Packing Pressure Control', color: 'green', details: ['보압 램프-인/조기 종료', 'P1: 30-45% × P_peak (0.1-0.3초)', 'P2: 15-30% × P_peak (게이트 동결까지)', '종료: 최후 동결 캐비티 기준', '목적: 과보압 방지'] }
                      ].map((item, idx) => (
                        <div key={idx} className={`${getProcessFlowClasses(item.color)} p-6 rounded-lg border-l-4 shadow-md`}>
                          <div className="flex items-center mb-3">
                            <div className={`${getProcessFlowBadgeClasses(item.color)} text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4`}>
                              {item.stage}
                            </div>
                            <h4 className="text-xl font-bold">{item.title}</h4>
                          </div>
                          <ul className="space-y-1 text-sm ml-16">
                            {item.details.map((detail, detailIdx) => (
                              <li key={detailIdx}>• {detail}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold mb-3 text-blue-800">📊 프로세스 해석</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong className="text-blue-700">V0 구간:</strong> 압력이 리밋 아래에서 완만하게 상승합니다. 러너 보호 단계로 과압을 구조적으로 차단합니다.</p>
                      <p><strong className="text-orange-700">V1 구간:</strong> 고속 충전으로 압력이 급상승하지만 여전히 리밋 이내를 유지합니다.</p>
                      <p><strong className="text-purple-700">V2 구간:</strong> 감속으로 압력 스파이크가 제어되며 완만하게 피크에 도달합니다.</p>
                      <p><strong className="text-green-700">V3 구간:</strong> 보압 단계로 압력이 점진적으로 감소하며 게이트 동결 후 종료됩니다.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Checklist */}
              {injectionTab === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4">현장 작업 체크리스트</h2>

                  {[
                    { title: '준비 단계 (Pre-Setup)', items: [
                      '재료 건조 확인: PHA 펠렛을 65-80°C에서 6-24시간 건조했는지 확인',
                      '러너 체적 계산: CAD 또는 금형 도면에서 러너 총 체적을 계산',
                      '투영 면적 측정: 36개 캐비티의 총 투영 면적 계산',
                      '클램프 톤수 확인: 필요 톤수를 산출하고 현재 기계 사양과 비교',
                      '금형 온도 설정: 캐비티는 기준 온도로, 스프루는 -2~-5°C 낮게 설정'
                    ]},
                    { title: 'V0 단계 설정 (Runner Protection)', items: [
                      'V0 속도 설정: 30-50 mm/s 범위에서 중속으로 설정',
                      '압력 리밋 설정: 계산기에서 산출한 값을 기계에 입력',
                      'V0→V1 전환점 설정: 러너 체적의 90% 지점을 스크류 위치로 설정',
                      '러너 전단률 확인: 계산기로 전단률을 계산하고 과도한 전단 확인'
                    ]},
                    { title: 'V1 단계 설정 (High-Speed Fill)', items: [
                      'V1 속도 설정: 얇은벽 충전을 위해 80-150 mm/s로 설정',
                      '사출압 상한 유지: V0에서 설정한 압력 리밋이 V1에서도 적용되는지 확인',
                      '캐비티압 센서 설치: 마지막으로 충전되는 캐비티에 센서 설치',
                      'v/p 전환 설정: 캐비티압 dP/dt 피크 또는 스크류 위치 96%로 설정'
                    ]},
                    { title: 'V2 단계 설정 (Deceleration)', items: [
                      'V2 속도 설정: 20-40 mm/s로 감속 목표 속도 설정',
                      '감속 시작점 설정: EoF 4-8mm 전부터 감속 시작',
                      '선형 램프 확인: 감속 프로파일이 선형으로 설정되어 있는지 확인'
                    ]},
                    { title: 'V3 단계 설정 (Packing)', items: [
                      'P1 보압 설정: 최대 사출압의 30-45%로 설정, 시간은 0.1-0.3초',
                      'P2 보압 설정: 최대 사출압의 15-30%로 낮게 설정',
                      '게이트 시일 시험 수행: 보압 시간을 변경하며 제품 무게 측정',
                      'P2 시간 설정: 최후 동결 캐비티 기준으로 게이트 시일 직후 종료'
                    ]},
                    { title: '검증 단계 (Verification)', items: [
                      '플래시 측정: 파팅라인과 스프루에서 플래시 높이 측정 (목표: 0.02mm 이하)',
                      '제품 무게 확인: 36개 캐비티의 제품 무게 측정 (변동 ±1% 이내)',
                      '치수 측정: 핵심 치수를 측정하고 규격 내 확인',
                      '사이클 타임 확인: 기준 대비 ±5% 이내인지 확인',
                      '타이바 점검: 타이바 변형이나 금형 개방 징후 육안 점검',
                      '압력 데이터 검토: 캐비티 압력 곡선 검토'
                    ]},
                    { title: '일일 점검 (Daily Check)', items: [
                      '재료 건조 상태: 건조기 온도와 시간 확인',
                      '금형 온도: 각 구역의 실제 온도가 설정값과 일치하는지 확인',
                      '스프루 부싱 점검: 마모나 손상 확인',
                      '파팅라인 청소: 이물질이나 잔류 플래시 확인',
                      '품질 샘플링: 주기적으로 샘플 채취하여 플래시와 치수 확인'
                    ]}
                  ].map((section, sectionIdx) => (
                    <div key={sectionIdx} className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-bold text-blue-900 mb-4">{section.title}</h3>
                      <div className="space-y-2">
                        {section.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-start bg-white p-3 rounded border hover:border-blue-600 transition-colors">
                            <input type="checkbox" className="w-5 h-5 mr-3 mt-0.5 cursor-pointer flex-shrink-0" />
                            <div className="text-sm">{item}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 5: Troubleshooting */}
              {injectionTab === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4">문제 해결 가이드</h2>

                  {[
                    { color: 'red', icon: '🔴', title: '스프루/러너 근처에 플래시 발생', solutions: [
                      'V0 압력 리밋이 너무 높음 → 압력 리밋을 70%로 낮추고 재시험',
                      '클램프 톤수 부족 → 계산기로 재확인하고 더 큰 기계로 전환 검토',
                      '스프루 부싱 마모/손상 → 스프루 부싱을 교체하고 시트 형상 점검',
                      '파팅라인 온도가 높음 → 국부 냉각을 -5°C까지 강화',
                      '러너 전단발열 → V0 속도를 낮추거나 러너 직경 증대'
                    ]},
                    { color: 'orange', icon: '🟠', title: '캐비티 충전 불완전 (Short Shot)', solutions: [
                      'V1 속도가 너무 낮음 → V1 속도를 단계적으로 증가',
                      'V0 구간이 너무 길음 → V0→V1 전환점을 85%로 앞당김',
                      '재료 온도가 너무 낮음 → 실린더 온도를 5-10°C 상승',
                      '금형 온도가 너무 낮음 → 캐비티 온도 상승 (단, 스프루는 저온 유지)',
                      '게이트 크기 부족 → 게이트 직경을 0.1-0.2mm 증대 검토'
                    ]},
                    { color: 'yellow', icon: '🟡', title: 'EoF에서 압력 스파이크 발생', solutions: [
                      'V2 감속이 없거나 불충분 → V2 감속 구간을 8mm로 연장',
                      '감속 프로파일이 급격함 → 선형 램프가 아닌 경우 설정 변경',
                      'V1 속도가 과도하게 높음 → V1 속도를 10-20% 감소',
                      '공기 포획(Air Trap) → 벤트 위치와 크기 점검'
                    ]},
                    { color: 'green', icon: '🟢', title: '캐비티 간 무게 편차가 큼', solutions: [
                      '러너 밸런싱 불량 → 러너 설계 재검토 또는 게이트 구경 미세 조정',
                      '게이트 동결 시간 편차 → 게이트 구경을 ±0.02mm 단위로 조정',
                      '금형 온도 불균일 → 각 구역의 실제 온도 측정 및 균일화',
                      '보압 시간이 최후 동결 캐비티 기준이 아님 → 게이트 시일 시험 재수행'
                    ]},
                    { color: 'blue', icon: '🔵', title: 'PHA 재료 열화 징후 (변색, 가스 발생)', solutions: [
                      '실린더 온도가 과도함 → 후방대 온도를 5-10°C 낮춤',
                      '체류시간이 길음 → 샷 크기 증대 또는 사이클 타임 단축',
                      '스크류 rpm이 높음 → rpm을 30-50% 감소',
                      '배압이 과도함 → 배압을 최소(5-10 bar)로 낮춤',
                      '재료 건조 불충분 → 건조 시간 연장 및 온도 확인'
                    ]}
                  ].map((problem, idx) => (
                    <div key={idx} className={`${getTroubleshootingClasses(problem.color)} p-6 rounded-lg border-l-4`}>
                      <h3 className="text-xl font-bold mb-3 flex items-center">
                        <span className="text-2xl mr-2">{problem.icon}</span>
                        <span>문제: {problem.title}</span>
                      </h3>
                      <p className="font-bold mb-2">가능 원인과 해결책:</p>
                      <ul className="space-y-2 ml-5">
                        {problem.solutions.map((solution, solIdx) => (
                          <li key={solIdx} className="text-sm">• {solution}</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold mb-3 text-blue-800">💡 예방 조치 (Preventive Actions)</h3>
                    <p className="font-bold mb-2">정기적으로 수행해야 할 작업:</p>
                    <ul className="space-y-1 ml-5 text-sm">
                      <li>• 주 1회: 스프루 부싱과 파팅라인의 마모/손상 점검</li>
                      <li>• 주 1회: 타이바 변형 측정 및 클램프 톤수 재확인</li>
                      <li>• 일 2회: 제품 무게와 치수 샘플링 (시작/종료 시)</li>
                      <li>• 일 1회: 캐비티 압력 데이터 검토 및 트렌드 분석</li>
                      <li>• 교대 시: 금형 온도 실측값 확인</li>
                      <li>• 로트 변경 시: 재료 건조 상태 재확인</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PHAPropertiesDashboard
