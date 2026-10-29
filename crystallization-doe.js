/* DOE for the crystallization presets: temperature-only screening, then speed ramp; choose the condition
   with the highest sustained speed (injection: shortest cycle) that passes every spec at 0 h, 24 h and 7 d.
   Work order chapter 8 (2026-10-29). */
(function (root) {
  'use strict';
  const finite = x => typeof x === 'number' && Number.isFinite(x);
  const msg = (ko, en) => ({ ko, en });

  const COLUMNS = ['run_id', 'date', 'process', 'grade', 'lot', 'factor_1', 'factor_1_unit', 'factor_2', 'factor_2_unit', 'speed', 'speed_unit', 'rep', 'pass_t0', 'pass_24h', 'pass_7d', 'dim_1', 'dim_1_unit', 'note'];
  const FIXED = [msg('같은 lot', 'Same lot'), msg('같은 배합', 'Same formulation'), msg('같은 건조 조건', 'Same drying'), msg('같은 용융 이력(다이 온도, 체류시간)', 'Same melt history (die temperature, residence)'), msg('현행 조건 = control', 'Current condition = control'), msg('같은 conditioning으로 즉시·24 h·7 d 측정', 'Measure at 0 h, 24 h and 7 d with the same conditioning')];
  const DESIGNS = {
    straw: {
      hypothesis: msg('1차 30–40°C 통과 후 2차 70–75°C 재가열이 같은 속도에서 치수 안정을 높인다', 'Passing 30–40 °C in bath 1 then reheating to 70–75 °C in bath 2 improves dimensional stability at the same speed'),
      factors: [{ name: 'bath1_C', unit: '°C', levels: [30, 35, 40] }, { name: 'bath2_C', unit: '°C', levels: [70, 75] }],
      responses: [msg('낙하·찢김', 'Drop and tear'), msg('타원도', 'Ovality'), msg('외경', 'Outer diameter')],
      speedUnit: 'ea/min', objective: 'max_speed',
    },
    injection: {
      hypothesis: msg('65°C 부근에서 최소 양품 cycle이 나온다', 'The shortest good-part cycle occurs near 65 °C'),
      factors: [{ name: 'moldSurface_C', unit: '°C', levels: [60, 65, 70] }],
      responses: [msg('flash', 'Flash'), msg('탈형 변형', 'Demold deformation'), msg('cycle', 'Cycle')],
      speedUnit: 's', objective: 'min_cycle',
    },
    sheet: {
      hypothesis: msg('R2 상승이 결정화를 높이되 sticking 상한이 있다', 'Raising R2 increases crystallization up to a sticking limit'),
      factors: [{ name: 'R2_C', unit: '°C', levels: [65, 70, 75] }],
      fixed: { R1_C: 60, R3_C: 40 },
      responses: [msg('curl', 'Curl'), msg('blocking', 'Blocking'), msg('sticking', 'Sticking'), msg('두께', 'Thickness')],
      speedUnit: 'm/min', objective: 'max_speed',
    },
  };

  function screening(process, opts) {
    const o = opts || {};
    const d = DESIGNS[process];
    if (!d) return { error: 'process' };
    const reps = Number.isInteger(o.reps) && o.reps > 0 ? o.reps : 1;
    const combos = d.factors.reduce((acc, f) => acc.flatMap(c => f.levels.map(l => c.concat([[f, l]]))), [[]]);
    const rows = [];
    const add = (label, pairs, isControl) => {
      for (let r = 1; r <= reps; r++) {
        const row = Object.fromEntries(COLUMNS.map(c => [c, '']));
        row.run_id = `${process}-${label}-r${r}`; row.process = process; row.grade = o.grade || ''; row.lot = o.lot || '';
        pairs.forEach(([f, l], i) => { row[`factor_${i + 1}`] = l; row[`factor_${i + 1}_unit`] = f.unit; });
        row.speed_unit = d.speedUnit; row.rep = r; row.note = isControl ? 'control' : '';
        rows.push(row);
      }
    };
    const ctrl = o.control || {};
    add('control', d.factors.map(f => [f, finite(ctrl[f.name]) ? ctrl[f.name] : 'current']), true);
    combos.forEach(c => add(c.map(([, l]) => l).join('-'), c, false));
    return { process, design: 'full_factorial', hypothesis: d.hypothesis, factors: d.factors, fixed: Object.assign({}, d.fixed), fixedConditions: FIXED,
      responses: d.responses, conditions: combos.length + 1, reps, rows };
  }
  function speedRamp(start, step, max) {
    if (!(finite(start) && finite(step) && step > 0 && finite(max) && max >= start)) return { error: msg('시작 속도, 단계 폭, 최대 속도를 입력하세요', 'Enter start speed, step and maximum') };
    const steps = []; for (let v = start; v <= max + 1e-9; v += step) steps.push(+v.toFixed(6));
    return { steps, rule: msg('첫 불합격 직전 속도를 기록', 'Record the last speed before the first failure') };
  }
  // Central composite design (rotatable, α = (2^k)^(1/4)) for k ≥ 2 significant factors.
  function ccd(factors, centerPoints) {
    if (!Array.isArray(factors) || factors.length < 2) return { error: msg('유의한 인자가 2개 이상일 때만 RSM을 생성', 'RSM is generated only for two or more significant factors') };
    const k = factors.length, alpha = Math.pow(Math.pow(2, k), 0.25);
    const n0 = Number.isInteger(centerPoints) && centerPoints > 0 ? centerPoints : 3;
    const coded = [];
    for (let i = 0; i < (1 << k); i++) coded.push(factors.map((_, j) => (i >> j) & 1 ? 1 : -1).concat(['factorial']));
    for (let j = 0; j < k; j++) for (const s of [-alpha, alpha]) coded.push(factors.map((_, m) => m === j ? s : 0).concat(['axial']));
    for (let i = 0; i < n0; i++) coded.push(factors.map(() => 0).concat(['center']));
    const runs = coded.map(c => {
      const type = c.pop();
      return Object.assign({ type }, Object.fromEntries(factors.map((f, j) => [f.name, (f.low + f.high) / 2 + c[j] * (f.high - f.low) / 2])), { coded: c });
    });
    return { design: 'CCD', alpha, centerPoints: n0, runs };
  }

  /* ---------- 8.4 decision ---------- */
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = a => a.length < 2 ? null : Math.sqrt(a.reduce((s, x) => s + (x - mean(a)) ** 2, 0) / (a.length - 1));
  function betacf(a, b, x) {
    let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; let h = d;
    for (let m = 1; m <= 200; m++) {
      const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function lgamma(x) {
    const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); let ser = 1.000000000190015;
    for (const c of g) ser += c / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function welch(a, b) {
    if (a.length < 2 || b.length < 2) return null;
    const va = sd(a) ** 2 / a.length, vb = sd(b) ** 2 / b.length;
    if (va + vb === 0) return { t: mean(a) === mean(b) ? 0 : Infinity, df: a.length + b.length - 2, p: mean(a) === mean(b) ? 1 : 0 };
    const t = (mean(a) - mean(b)) / Math.sqrt(va + vb);
    const df = (va + vb) ** 2 / (va * va / (a.length - 1) + vb * vb / (b.length - 1));
    return { t, df, p: ibeta(df / 2, 0.5, df / (df + t * t)) };
  }
  const truthy = v => v === true || v === 1 || v === '1' || /^(true|pass|ok|y|yes|o)$/i.test(String(v).trim());
  // rows: [{condition, speed (sustained speed, or cycle s for injection), pass_t0, pass_24h, pass_7d, isControl?}]
  function decide(rows, opts) {
    const o = opts || {};
    const objective = o.objective || (o.process === 'injection' ? 'min_cycle' : 'max_speed');
    const delta = finite(o.practicalDelta_pct) ? o.practicalDelta_pct : null;
    const groups = new Map();
    rows.forEach(r => {
      const key = String(r.condition);
      if (!groups.has(key)) groups.set(key, { condition: key, isControl: !!r.isControl || /control/i.test(key), runs: [] });
      groups.get(key).runs.push({ speed: Number(r.speed), t0: truthy(r.pass_t0), h24: truthy(r.pass_24h), d7: truthy(r.pass_7d) });
    });
    const summary = [...groups.values()].map(g => {
      const ok = g.runs.filter(r => r.t0 && r.h24 && r.d7 && finite(r.speed));
      const speeds = ok.map(r => r.speed);
      const lateOnly = g.runs.some(r => r.t0 && (!r.h24 || !r.d7));
      return { condition: g.condition, isControl: g.isControl, n: speeds.length, nTotal: g.runs.length, mean: speeds.length ? mean(speeds) : null, sd: sd(speeds), speeds,
        allPass: ok.length === g.runs.length, lateOnlyFailure: lateOnly && g.runs.every(r => r.t0),
        decidable: speeds.length >= 3, label: speeds.length >= 3 ? null : msg('결정 불가 (n < 3)', 'Undecidable (n < 3)') };
    });
    const control = summary.find(s => s.isControl) || null;
    const better = (a, b) => objective === 'min_cycle' ? a < b : a > b;
    const eligible = summary.filter(s => !s.isControl && s.decidable && s.allPass);
    let best = null; eligible.forEach(s => { if (!best || better(s.mean, best.mean)) best = s; });
    let improvement_pct = null, stats = null, outcome = 'undecidable';
    if (best && control && control.mean) {
      improvement_pct = (objective === 'min_cycle' ? (control.mean - best.mean) : (best.mean - control.mean)) / control.mean * 100;
      stats = welch(best.speeds, control.speeds);
      outcome = delta !== null && improvement_pct > delta ? 'new_standard_candidate' : 'no_difference';
    } else if (best) outcome = 'no_control';
    const late = summary.filter(s => !s.isControl && s.lateOnlyFailure);
    const actions = {
      new_standard_candidate: msg('신규 기준 후보로 올리고 lot 변경 시 재확인', 'Promote as a new standard candidate; recheck on lot change'),
      no_difference: msg('control과 차이 없음: 핵제 지배 배합 가능성. 1차 체류 단축 방향을 다음 시험으로 제안', 'No difference from control: the nucleant may dominate. Next, try a shorter bath-1 dwell'),
      undecidable: msg('결정 불가: 조건별 독립 운전 3회 이상 필요', 'Undecidable: at least 3 independent runs per condition'),
      no_control: msg('control 결과가 없어 개선 판정 불가', 'No control results: improvement cannot be judged'),
    };
    return { objective, practicalDelta_pct: delta, summary, best, control, improvement_pct, stats, outcome, action: actions[outcome],
      secondaryCrystallization: late.map(s => ({ condition: s.condition, text: msg('24 h·7 d에서만 불합격: 2차 결정화·후수축 문제. 후처리·포장 조건 검토', 'Fails only at 24 h / 7 d: secondary crystallization or post-shrinkage. Review post-treatment and packaging') })) };
  }
  function toCSV(rows) {
    const esc = v => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return [COLUMNS.join(',')].concat(rows.map(r => COLUMNS.map(c => esc(r[c])).join(','))).join('\n') + '\n';
  }

  const api = { COLUMNS, DESIGNS, FIXED, screening, speedRamp, ccd, decide, welch, toCSV };
  root.PHACrystalDOE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
