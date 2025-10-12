export const PROCESS_PRESETS = [
  { id: 'CA1180P_INJ', label: 'CA1180P (PLA/aPHA – Injection)' },
];

export const PROCESS_TYPES = [
  { id: 'injection', label: '사출 성형 (Injection)' },
  { id: 'extrusion', label: '압출 (Extrusion)' },
];

export const DEFAULT_GUIDE = {
  zone1: [140, 155],
  zone2: [150, 165],
  zone3: [160, 170],
  zone4: [165, 175],
  die: [165, 180],
  screw: [40, 90],
  meltP: [60, 150],
  tankT: [15, 25],
  lineV: [5, 30],
};

export const LABELS = {
  zone1: 'Zone 1 온도 (°C)',
  zone2: 'Zone 2 온도',
  zone3: 'Zone 3 온도',
  zone4: 'Zone 4 온도',
  die: '다이 온도',
  screw: '스크류 속도 (rpm)',
  meltP: '용융 압력 (bar)',
  tankT: '쿨링탱크 온도 (°C)',
  lineV: '라인 속도 (m/min)',
};
