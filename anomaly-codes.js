(function (global) {
  const ANOMALY_CODES = Object.freeze([
    { code: 'color_shift', label_en: 'Color shift', label_ko: '변색', severity_default: 'medium' },
    { code: 'surging', label_en: 'Surging', label_ko: '서징', severity_default: 'medium' },
    { code: 'torque_spike', label_en: 'Torque spike', label_ko: '토크 급등', severity_default: 'high' },
    { code: 'melt_temp_high', label_en: 'Melt temp excursion', label_ko: '용융온도 편차', severity_default: 'high' },
    { code: 'die_pressure_drop', label_en: 'Die pressure drop', label_ko: '다이 압력 급락', severity_default: 'high' },
    { code: 'gate_seal_late', label_en: 'Late gate seal', label_ko: '게이트 동결 지연', severity_default: 'medium' },
    { code: 'flash', label_en: 'Flash defect', label_ko: '플래시 결함', severity_default: 'medium' },
    { code: 'short_shot', label_en: 'Short shot', label_ko: '미충전', severity_default: 'high' },
    { code: 'burn_mark', label_en: 'Burn mark', label_ko: '번 마크', severity_default: 'high' },
    { code: 'void_bubble', label_en: 'Voids / bubbles', label_ko: '기포', severity_default: 'medium' },
    { code: 'other', label_en: 'Other (freeform)', label_ko: '기타', severity_default: 'low' },
  ]);

  const codeSet = new Set(ANOMALY_CODES.map(item => item.code));

  function getAnomalyCodeMeta(code) {
    if (!code) return undefined;
    return ANOMALY_CODES.find(item => item.code === code);
  }

  global.TarsAnomalyCodes = Object.freeze({
    ANOMALY_CODES,
    getAnomalyCodeMeta,
    has(code) {
      return typeof code === 'string' && codeSet.has(code);
    },
  });
})(window);
