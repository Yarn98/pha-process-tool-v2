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

// 데이터 임포트 - 원본 및 확장 데이터 통합
import {
  thermalData,
  mechanicalComparison,
  processingData,
  crystallinityEffects,
  applicationSuitability,
  polymerSpecs
} from '../data/polymerData'

import { fieldKitResources, quickLoop, analyticsMeta } from '../data/extendedData'

// 유틸리티 임포트
import { renderMarkdown, md } from '../utils/markdown'
import { computeDerivedMetrics, formatMetricValue, downloadThermalData } from '../utils/metrics'

const PHAPropertiesDashboard = () => {
  const [selectedPolymer, setSelectedPolymer] = useState('S1000P')

  const derived = useMemo(() => computeDerivedMetrics(selectedPolymer), [selectedPolymer])

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
              <button
                onClick={() => downloadThermalData(selectedPolymer)}
                className="mt-2 sm:mt-0 px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
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
