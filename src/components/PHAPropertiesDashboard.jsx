import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PHAPropertiesDashboard = () => {
  const [selectedPolymer, setSelectedPolymer] = useState('S1000P');

  const renderMarkdown = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  const md = (text) => ({ __html: renderMarkdown(text) });

  const downloadThermalData = () => {
    const headers = ['temp', 'modulus', 'tanDelta'];
    const rows = thermalData[selectedPolymer]
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