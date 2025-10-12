import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PHAPropertiesDashboard = () => {
  const [selectedPolymer, setSelectedPolymer] = useState('S1000P');
  const [uiMode, setUiMode] = useState('desktop');

  const DeviceIcon = ({ type }) => {
    const base = 'h-4 w-4';
    if (type === 'mobile') {
      return (
        <svg
          className={base}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="2" width="12" height="20" rx="3" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    }
    return (
      <svg
        className={base}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <line x1="8" y1="20" x2="16" y2="20" />
        <line x1="12" y1="16" x2="12" y2="20" />
      </svg>
    );
  };

  const uiViews = useMemo(
    () => ({
      desktop: {
        label: '데스크톱 UI',
        summary:
          '실험실 PC에서 전체 공정 데이터를 분석할 때 사용합니다. 넓은 화면에 맞춰 그래프와 수치를 병렬 배치해 빠르게 비교할 수 있습니다.',
        checklist: [
          'Thermal 탭에서 tan δ 피크와 저장 탄성률을 동시에 살펴본 뒤 Download CSV로 실험 데이터를 공유합니다.',
          'Mechanical 탭은 로그 스케일을 사용하므로 강성 차이를 직관적으로 비교하고 공정 조건을 결정합니다.',
          'Processing 탭에서 최적 온도/압력 지점을 확인한 뒤 공정 표준서에 바로 반영합니다.',
        ],
      },
      mobile: {
        label: '모바일 UI',
        summary:
          '현장 점검이나 고객 미팅에서 스마트폰으로 빠르게 확인할 때 적합한 배치입니다. 핵심 KPI만 위쪽에, 조정 레버는 스크롤 동선으로 구성했습니다.',
        checklist: [
          '필수 카드만 세로 스택으로 정리해 한 손 조작으로 Polymer 전환과 탭 이동을 끝낼 수 있습니다.',
          '그래프는 미니멀 모드로 축약되어 주요 트렌드만 표시하므로 현장에서 즉시 결정을 내릴 수 있습니다.',
          'Processing 탭에서는 각 공정 단계의 허용 범위를 색상 배지로 보여주어, 장비 화면 없이도 안전 영역을 인지할 수 있습니다.',
        ],
      },
    }),
    []
  );

  const polymerUiNotes = {
    S1000P: {
      desktop:
        'S1000P는 결정성이 높아 냉각/가공 조건을 동시에 추적해야 합니다. 데스크톱 화면에서 Thermal과 Processing 탭을 나란히 띄워 두면 결정화 지연을 조정하기 쉽습니다.',
      mobile:
        '현장에서는 냉각 시간과 금형 온도만 빠르게 확인하면 됩니다. 모바일 모드에서는 Processing 탭 상단에 두 지표가 강조되어 있어 점검 시간을 줄여 줍니다.',
    },
    A1000P: {
      desktop:
        'A1000P는 연신 및 필름 공정에서 물성 분포가 넓기 때문에 Mechanical 탭의 로그 스케일 그래프와 Applications 탭을 병행해 제품군을 조합하십시오.',
      mobile:
        '필름 샘플을 들고 고객을 만날 때 Applications 탭을 모바일 모드로 열면 추천 어플리케이션이 카드 형태로 정리되어 빠르게 설명할 수 있습니다.',
    },
  };

  const DeviceFrame = ({ mode }) => {
    const isDesktop = mode === 'desktop';
    const outerClass = isDesktop
      ? 'mx-auto flex h-64 w-full max-w-3xl items-center justify-center'
      : 'mx-auto flex h-96 w-full max-w-xs items-center justify-center';
    const frameClass = isDesktop
      ? 'relative h-full w-full rounded-3xl border border-slate-300 bg-slate-900/90 p-6'
      : 'relative h-full w-full rounded-[3rem] border border-slate-300 bg-slate-900/90 p-5 pt-8';

    return (
      <div className={outerClass}>
        <div className={frameClass}>
          {isDesktop ? (
            <>
              <div className="absolute inset-x-20 -top-3 h-2 rounded-full bg-slate-200" />
              <div className="grid h-full grid-cols-[1.6fr,1fr] gap-4">
                <div className="space-y-3">
                  <div className="h-10 w-40 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" />
                  <div className="h-36 rounded-2xl bg-gradient-to-br from-blue-500/80 to-indigo-500/60" />
                  <div className="grid h-16 grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-800/70" />
                    <div className="rounded-xl bg-slate-800/70" />
                    <div className="rounded-xl bg-slate-800/70" />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="h-20 rounded-2xl bg-slate-800/70" />
                  <div className="rounded-2xl border border-slate-700/70 bg-slate-800/50 p-3">
                    <div className="mb-2 h-2 rounded-full bg-slate-600" />
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-slate-700" />
                      <div className="h-2 rounded-full bg-slate-700/80" />
                      <div className="h-2 w-3/4 rounded-full bg-slate-700/60" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="absolute inset-x-[30%] top-2 h-2 rounded-full bg-slate-200" />
              <div className="flex h-full flex-col gap-4">
                <div className="h-10 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-500" />
                <div className="h-32 rounded-3xl bg-gradient-to-br from-blue-500/80 to-indigo-500/60" />
                <div className="rounded-3xl border border-slate-700/70 bg-slate-800/40 p-4">
                  <div className="mb-3 h-2 w-2/3 rounded-full bg-slate-600" />
                  <div className="space-y-2">
                    <div className="h-2 rounded-full bg-slate-700" />
                    <div className="h-2 rounded-full bg-slate-700/80" />
                    <div className="h-2 w-3/4 rounded-full bg-slate-700/60" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-14 rounded-3xl bg-slate-800/60" />
                  <div className="h-14 rounded-3xl bg-slate-800/60" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const toggleButtonClass = (mode) =>
    `flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition shadow-sm ${
      uiMode === mode
        ? 'bg-blue-600 text-white'
        : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
    }`;

  const renderMarkdown = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  const md = (text) => ({ __html: renderMarkdown(text) });

  const downloadThermalData = () => {
    const data = thermalData[selectedPolymer];
    if (!data) {
      alert('No thermal data available for the selected polymer.');
      return;
    }

    const headers = ['temp', 'modulus', 'tanDelta'];
    const rows = data
      .map(({ temp, modulus, tanDelta }) => `${temp},${modulus},${tanDelta}`)
      .join('\n');
    const csv = `${headers.join(',')}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedPolymer}_thermal_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Thermal Properties Data
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
      { temp: 25, modulus: 900, tanDelta: 0.10 },
      { temp: 50, modulus: 400, tanDelta: 0.20 },
      { temp: 75, modulus: 150, tanDelta: 0.35 },
      { temp: 100, modulus: 80, tanDelta: 0.30 },
      { temp: 125, modulus: 40, tanDelta: 0.25 },
      { temp: 150, modulus: 25, tanDelta: 0.20 },
      { temp: 175, modulus: 20, tanDelta: 0.15 }
    ]
  };

  // Mechanical Properties Comparison
  const mechanicalComparison = [
    { property: 'Tensile Strength', S1000P: 35, A1000P: 18, unit: 'MPa' },
    { property: 'Elongation at Break', S1000P: 8, A1000P: 450, unit: '%' },
    { property: 'Young\'s Modulus', S1000P: 1200, A1000P: 12, unit: 'MPa' },
    { property: 'Impact Strength', S1000P: 3.5, A1000P: 25, unit: 'kJ/m²' },
    { property: 'Flexural Modulus', S1000P: 1400, A1000P: 15, unit: 'MPa' },
    { property: 'Shore D Hardness', S1000P: 65, A1000P: 35, unit: '' }
  ];

  // Processing Window Data
  const processingData = [
    { 
      parameter: 'Melt Temperature',
      S1000P_min: 155, S1000P_opt: 165, S1000P_max: 175,
      A1000P_min: 145, A1000P_opt: 155, A1000P_max: 165
    },
    { 
      parameter: 'Mold Temperature',
      S1000P_min: 40, S1000P_opt: 60, S1000P_max: 80,
      A1000P_min: 20, A1000P_opt: 30, A1000P_max: 40
    },
    { 
      parameter: 'Injection Pressure',
      S1000P_min: 80, S1000P_opt: 100, S1000P_max: 120,
      A1000P_min: 60, A1000P_opt: 80, A1000P_max: 100
    },
    { 
      parameter: 'Cooling Time',
      S1000P_min: 20, S1000P_opt: 30, S1000P_max: 40,
      A1000P_min: 15, A1000P_opt: 20, A1000P_max: 30
    }
  ];

  // Crystallinity Effects Data
  const crystallinityEffects = [
    { property: 'Tg', S1000P: 4, A1000P: -15 },
    { property: 'Tm', S1000P: 165, A1000P: 0 },
    { property: 'Crystallinity', S1000P: 45, A1000P: 0 },
    { property: 'Density', S1000P: 1.25, A1000P: 1.20 },
    { property: 'Water Uptake', S1000P: 0.2, A1000P: 0.4 },
    { property: 'Biodegradation Rate', S1000P: 100, A1000P: 150 }
  ];

  // Radar Chart Data for Applications
  const applicationSuitability = [
    { application: 'Rigid Packaging', S1000P: 95, A1000P: 20 },
    { application: 'Flexible Film', S1000P: 30, A1000P: 90 },
    { application: 'Injection Molding', S1000P: 90, A1000P: 40 },
    { application: 'Blow Molding', S1000P: 85, A1000P: 30 },
    { application: 'Thermoforming', S1000P: 80, A1000P: 85 },
    { application: 'Coating', S1000P: 25, A1000P: 95 },
    { application: '3D Printing', S1000P: 70, A1000P: 60 },
    { application: 'Fiber Spinning', S1000P: 75, A1000P: 35 }
  ];

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
      ]
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
      ]
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          dangerouslySetInnerHTML={md('**P34HB** Polymer Properties Analysis')}
        />
        <p className="text-gray-600">
          Comprehensive characterization of semi-crystalline and amorphous variants
        </p>
      </div>

      <Card className="border-blue-100 bg-blue-50/40">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="space-y-1 text-left">
            <CardTitle className="text-xl">UI 모드 미리보기</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              데스크톱과 휴대폰 환경에서 대시보드가 어떻게 구성되는지 비교하고, 상황에 맞는 사용 전략을 선택하세요.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-3xl bg-white p-2 shadow-inner">
            <button
              type="button"
              className={toggleButtonClass('desktop')}
              onClick={() => setUiMode('desktop')}
            >
              <DeviceIcon type="desktop" />
              <span>데스크톱</span>
            </button>
            <button
              type="button"
              className={toggleButtonClass('mobile')}
              onClick={() => setUiMode('mobile')}
            >
              <DeviceIcon type="mobile" />
              <span>모바일</span>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
            <DeviceFrame mode={uiMode} />
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="text-base font-semibold text-blue-700">{uiViews[uiMode].label}</h3>
                <p className="mt-2 text-gray-700">{uiViews[uiMode].summary}</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">사용 체크리스트</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
                  {uiViews[uiMode].checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-gray-500">
                {polymerUiNotes[selectedPolymer]?.[uiMode]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Polymer Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(polymerSpecs).map(([key, spec]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all ${selectedPolymer === key ? 'ring-2 ring-offset-2' : ''}`}
            style={{ borderColor: selectedPolymer === key ? spec.color : '' }}
            onClick={() => setSelectedPolymer(key)}
          >
            <CardHeader className="pb-3">
              <CardTitle style={{ color: spec.color }}>{spec.name}</CardTitle>
              <CardDescription>{spec.type} • {spec.fourHB} 4HB</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {spec.characteristics.map((char, idx) => (
                  <div
                    key={idx}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(char) }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="thermal" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="thermal">Thermal</TabsTrigger>
          <TabsTrigger value="mechanical">Mechanical</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="crystallinity">Structure</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="thermal">
          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900">
            <h3 className="font-semibold">사용 방법</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>상단 카드에서 Polymer를 선택하면 그래프와 tan δ 데이터가 즉시 갱신됩니다.</li>
              <li>Download CSV 버튼으로 선택된 Polymer의 DMA 데이터를 내려받아 실험 보고서에 첨부하세요.</li>
              <li>tan δ 피크 위치가 모바일/데스크 모드에서도 동일하게 표시되는지 확인해 UI 미리보기와 비교할 수 있습니다.</li>
            </ul>
          </div>
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Dynamic Mechanical Analysis</CardTitle>
                <CardDescription dangerouslySetInnerHTML={md('Temperature-dependent **viscoelastic** behavior')} />
              </div>
              <button
                onClick={downloadThermalData}
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
                  <Line yAxisId="left" type="monotone" dataKey="modulus" stroke={polymerSpecs[selectedPolymer].color} name="E' (MPa)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="tanDelta" stroke="#ef4444" name="tan δ" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-gray-600">
                <span
                  dangerouslySetInnerHTML={md('The **glass transition** manifests as a sharp drop in storage modulus accompanied by a **tan δ peak**.')}
                />
                <span
                  dangerouslySetInnerHTML={md(
                    selectedPolymer === 'S1000P'
                      ? ' The semi-crystalline structure maintains significant modulus above Tg due to **crystalline domains** acting as physical crosslinks.'
                      : ' The amorphous structure shows complete **viscous flow** above Tg with no crystalline reinforcement.'
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mechanical">
          <div className="mb-4 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 text-sm text-purple-900">
            <h3 className="font-semibold">사용 방법</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>로그 스케일 축을 활용해 결정성(S1000P)과 비결정성(A1000P)의 강성 차이를 한눈에 파악합니다.</li>
              <li>데스크톱 모드에서는 그래프 옆 메모리 카드에 자동 생성된 설명을 복사해 보고서에 붙여넣을 수 있습니다.</li>
              <li>모바일 모드를 사용하면 스택형 카드가 요약 수치를 강조하여 현장에서 고객에게 빠르게 설명할 수 있습니다.</li>
            </ul>
          </div>
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
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
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
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
            <h3 className="font-semibold">사용 방법</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>막대의 양 끝은 허용 범위, 중앙 선은 권장 조건을 의미합니다. 모바일 모드에서는 범위가 배지 형태로 단순화되어 표시됩니다.</li>
              <li>Processing Data는 Polymer 선택값과 연동되므로, 카드 클릭 후 즉시 가공 조건을 조정하십시오.</li>
              <li>데스크톱 모드에서 Thermal 탭과 병행하면 과열에 따른 결정화 지연을 사전에 예측할 수 있습니다.</li>
            </ul>
          </div>
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
                          <div 
                            className="absolute h-6 w-1 bg-purple-600"
                            style={{ left: `${(param.S1000P_opt / 200) * 100}%` }}
                          />
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
                          <div 
                            className="absolute h-6 w-1 bg-cyan-600"
                            style={{ left: `${(param.A1000P_opt / 200) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm w-16">{param.A1000P_opt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="mt-6 p-4 bg-amber-50 rounded-lg text-sm"
                dangerouslySetInnerHTML={md('<strong>Critical consideration:</strong> P34HB exhibits **thermal degradation** above 180°C. Maintain **residence time** below 5 minutes at processing temperature. A1000P requires lower **mold temperatures** to prevent sticking due to its **tacky** amorphous nature.')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crystallinity">
          <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-sm text-cyan-900">
            <h3 className="font-semibold">사용 방법</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Structure 탭에서 Tg/Tm 변화를 확인한 뒤, UI 모드 미리보기에서 어떤 지표를 우선 배치할지 결정하세요.</li>
              <li>데이터 해석 노트를 복사하여 팀 지식 베이스나 README에 그대로 옮겨 적을 수 있습니다.</li>
              <li>모바일 모드에서는 카드가 세로 정렬되어 구조적 차이를 빠르게 브리핑하기 좋습니다.</li>
            </ul>
          </div>
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
          <div className="mb-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-sm text-teal-900">
            <h3 className="font-semibold">사용 방법</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Radar 차트에서 점수가 높은 영역을 확인한 뒤, 모바일 모드 카드에 요약된 추천 문구를 활용해 고객 피치를 준비하세요.</li>
              <li>데스크톱 모드에서는 Applications 목록을 복사해 제품 포트폴리오 자료를 작성하기 좋습니다.</li>
              <li>Polymer 전환 시 추천 애플리케이션과 점수가 즉시 갱신되어 비교 분석 시간을 단축합니다.</li>
            </ul>
          </div>
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
              <div className="mt-6 grid grid-cols-2 gap-4">
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
      </Tabs>
    </div>
  );
};

export default PHAPropertiesDashboard;
