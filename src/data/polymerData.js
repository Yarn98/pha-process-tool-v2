// 원본 PHA 폴리머 특성 데이터
// 원본 커밋 e233169에서 복원된 핵심 데이터

export const thermalData = {
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

export const mechanicalComparison = [
  { property: 'Tensile Strength', S1000P: 35, A1000P: 18, unit: 'MPa' },
  { property: 'Elongation at Break', S1000P: 8, A1000P: 450, unit: '%' },
  { property: "Young's Modulus", S1000P: 1200, A1000P: 12, unit: 'MPa' },
  { property: 'Impact Strength', S1000P: 3.5, A1000P: 25, unit: 'kJ/m²' },
  { property: 'Flexural Modulus', S1000P: 1400, A1000P: 15, unit: 'MPa' },
  { property: 'Shore D Hardness', S1000P: 65, A1000P: 35, unit: '' }
]

export const processingData = [
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

export const crystallinityEffects = [
  { property: 'Tg', S1000P: 4, A1000P: -15 },
  { property: 'Tm', S1000P: 165, A1000P: 0 },
  { property: 'Crystallinity', S1000P: 45, A1000P: 0 },
  { property: 'Density', S1000P: 1.25, A1000P: 1.2 },
  { property: 'Water Uptake', S1000P: 0.2, A1000P: 0.4 },
  { property: 'Biodegradation Rate', S1000P: 100, A1000P: 150 }
]

export const applicationSuitability = [
  { application: 'Rigid Packaging', S1000P: 95, A1000P: 20 },
  { application: 'Flexible Film', S1000P: 30, A1000P: 90 },
  { application: 'Injection Molding', S1000P: 90, A1000P: 40 },
  { application: 'Blow Molding', S1000P: 85, A1000P: 30 },
  { application: 'Thermoforming', S1000P: 80, A1000P: 85 },
  { application: 'Coating', S1000P: 25, A1000P: 95 },
  { application: '3D Printing', S1000P: 70, A1000P: 60 },
  { application: 'Fiber Spinning', S1000P: 75, A1000P: 35 }
]

export const polymerSpecs = {
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
