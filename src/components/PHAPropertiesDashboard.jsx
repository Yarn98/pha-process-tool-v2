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

  const derived = useMemo(() => computeDerivedMetrics(selectedPolymer), [selectedPolymer])

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
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="thermal">Thermal</TabsTrigger>
          <TabsTrigger value="mechanical">Mechanical</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="crystallinity">Structure</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="fieldKit">Field DOE Kit</TabsTrigger>
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
      </Tabs>
    </div>
  )
}

export default PHAPropertiesDashboard
