/* Crystallization-history engine. Judges the resin temperature–time history, not equipment setpoints.
   Constants come from crystallization-data.js (Macromolecules 2026, 59, 379–391, pure P3HB).
   See data/crystallization/p3hb_ref_2026.json and the crystallization work order (2026-10-29). */
(function (root) {
  'use strict';
  const VERSION = '2026-10-29';
  const K0 = 273.15;

  const WARNINGS = {
    W01: { ko: '2차 수조가 가열이 아니라 냉각으로 작동', en: 'Bath 2 is cooling the resin, not reheating it' },
    W02: { ko: '논문 P3HB 참고값 사용 중 (미보정)', en: 'Using pure-P3HB literature values (not calibrated for this grade)' },
    W03: { ko: '열전달 계산 중단: k, ρ, h 입력 필요', en: 'Heat-transfer calculation stopped: enter k, ρ and h' },
    W04: { ko: '균일 핵 부분 소실 위험 (핵생성 후 최고 120–140°C)', en: 'Risk of partial loss of homogeneous nuclei (peak 120–140 °C after nucleation)' },
    W05: { ko: '균일 핵 소실 (핵생성 후 최고 > 140°C)', en: 'Homogeneous nuclei lost (peak > 140 °C after nucleation)' },
    W06: { ko: '필요시간 > 체류시간: 속도 상한 초과', en: 'Required time exceeds residence: above the speed limit' },
    W07: { ko: '기존 코드값과 신규값 불일치: 병기, 출처 확인', en: 'Existing value differs from the new value: both shown, check sources' },
    W08: { ko: '측정 범위 밖 온도: 외삽', en: 'Temperature outside the measured range: extrapolation' },
    W09: { ko: '결정화 발열 무시: 실제 냉각이 더 느릴 수 있음', en: 'Crystallization exotherm ignored: real cooling may be slower' },
    W10: { ko: 'A1000P 단독: 결정화 판정 비활성', en: 'A1000P alone: crystallization judgement disabled' },
    W11: { ko: '금형 설정값만 입력: cavity 표면 실측 필요', en: 'Only the mold setpoint was entered: measure the cavity surface' },
    W12: { ko: '100°C 이상 노출 > 0.01 s: 핵 생존 장시간 미검증', en: 'Exposure above 100 °C exceeds 0.01 s: long-exposure survival not verified' },
    W13: { ko: '60°C 실측 t½ 1점 보정: 구간·핵생성·핵 생존 기준은 P3HB 논문값', en: 'Calibrated with one measured t½ at 60 °C: zones, nucleation and nuclei survival stay on pure-P3HB values' },
    W14: { ko: 'PLA 매트릭스 배합: P3HB 결정화 판정 대상 외 (PLA 결정화는 미모델)', en: 'PLA-matrix compound: outside the P3HB crystallization judgement (PLA crystallization is not modelled)' },
    W15: { ko: '유사 배합 실측 t½ 대리값 1점 보정 (판단됨): 구간·핵생성·핵 생존 기준은 P3HB 논문값', en: 'Calibrated with one measured t½ from a similar compound (judged proxy): zones, nucleation and nuclei survival stay on pure-P3HB values' },
  };
  function warning(code, detail) { return Object.assign({ code }, WARNINGS[code], detail ? { detail } : {}); }

  function dataRoot() {
    if (root.PHACrystalData) return root.PHACrystalData;
    if (typeof require === 'function') { try { return require('./crystallization-data.js'); } catch (e) { /* browser */ } }
    return null;
  }
  function kinetics(ref) {
    const d = dataRoot();
    const entry = d && d.reference[ref || 'P3HB_REF_2026'];
    return entry ? entry.engine : null;
  }
  const finite = x => typeof x === 'number' && Number.isFinite(x);
  const range = v => Array.isArray(v) ? v : [v, v];

  /* ---------- 5.1 thermal1d: explicit FD across the thickness ---------- */
  // bc: {type:'convective', h_W_m2K, Tinf_C} | {type:'fixed', T_C} | {type:'adiabatic'}
  function thermal1d(input) {
    const p = input || {};
    const missing = [];
    if (!(finite(p.k_W_mK) && p.k_W_mK > 0)) missing.push('k');
    if (!(finite(p.rho_kg_m3) && p.rho_kg_m3 > 0)) missing.push('ρ');
    const segs = Array.isArray(p.segments) ? p.segments : [];
    segs.forEach(s => ['A', 'B'].forEach(side => {
      const bc = s[side];
      if (bc && bc.type === 'convective' && !(finite(bc.h_W_m2K) && bc.h_W_m2K > 0) && !missing.includes('h')) missing.push('h');
      if (bc && bc.type === 'convective' && !finite(bc.Tinf_C) && !missing.includes('T∞')) missing.push('T∞');
    }));
    if (missing.length) return { error: 'W03', missing, warnings: [warning('W03', missing.join(', '))] };
    if (!(finite(p.thickness_mm) && p.thickness_mm > 0) || !segs.length || !finite(p.T0_C)) {
      return { error: 'input', message: 'thickness_mm, T0_C and at least one segment are required' };
    }
    const n = Math.max(21, Math.round(p.nodes || 21));
    const L = p.thickness_mm / 1000, dx = L / (n - 1);
    const cpS = 1000 * ((p.cp && p.cp.solid) || 1.858), cpL = 1000 * ((p.cp && p.cp.liquid) || 2.073);
    const Tm = p.cp && finite(p.cp.Tm_C) ? p.cp.Tm_C : null;
    const cpAt = T => (Tm === null || T >= Tm) ? cpL : cpS;
    const k = p.k_W_mK, rho = p.rho_kg_m3, cpMin = Math.min(cpS, Tm === null ? cpL : cpS);
    let hMax = 0;
    segs.forEach(s => ['A', 'B'].forEach(side => { const bc = s[side]; if (bc && bc.type === 'convective') hMax = Math.max(hMax, bc.h_W_m2K); }));
    // Interior Δt ≤ Δx²/(2α); a convective half-cell needs Δt ≤ ρc·Δx²/(2(k+hΔx)).
    const dtLimit = 0.9 * rho * cpMin * dx * dx / (2 * (k + hMax * dx));
    const requested = finite(p.dt_s) && p.dt_s > 0 ? p.dt_s : dtLimit;
    const dt = Math.min(requested, dtLimit);
    const total = segs.reduce((a, s) => a + s.duration_s, 0);
    const steps = Math.ceil(total / dt);
    const every = Math.max(1, Math.floor(steps / (p.maxPoints || 4000)));
    const T = new Array(n).fill(p.T0_C), Tn = new Array(n);
    const out = { t_s: [], T_surfaceA: [], T_surfaceB: [], T_center: [], T_mean: [], segments: [] };
    const mid = (n - 1) / 2;
    const record = t => {
      let sum = 0; for (let i = 0; i < n - 1; i++) sum += (T[i] + T[i + 1]) / 2;
      out.t_s.push(t); out.T_surfaceA.push(T[0]); out.T_surfaceB.push(T[n - 1]);
      out.T_center.push(Number.isInteger(mid) ? T[mid] : (T[Math.floor(mid)] + T[Math.ceil(mid)]) / 2);
      out.T_mean.push(sum / (n - 1));
    };
    // Half-cell energy balance at a surface node i with neighbour j over step h.
    const boundaryStep = (bc, i, j, h) => {
      const c = rho * cpAt(T[i]) * dx / 2;
      if (!bc || bc.type === 'adiabatic') return T[i] + h * (k * (T[j] - T[i]) / dx) / c;
      if (bc.type === 'fixed') return bc.T_C;
      return T[i] + h * (bc.h_W_m2K * (bc.Tinf_C - T[i]) + k * (T[j] - T[i]) / dx) / c;
    };
    let t = 0, step = 0;
    segs.forEach((s, si) => {
      if (s.A && s.A.type === 'fixed') T[0] = s.A.T_C;
      if (s.B && s.B.type === 'fixed') T[n - 1] = s.B.T_C;
      if (si === 0) record(0);
      const start = t, end = start + s.duration_s;
      while (t < end - 1e-12) {
        const h = Math.min(dt, end - t);
        for (let i = 1; i < n - 1; i++) Tn[i] = T[i] + h * k * (T[i + 1] - 2 * T[i] + T[i - 1]) / (rho * cpAt(T[i]) * dx * dx);
        Tn[0] = boundaryStep(s.A, 0, 1, h); Tn[n - 1] = boundaryStep(s.B, n - 1, n - 2, h);
        for (let i = 0; i < n; i++) T[i] = Tn[i];
        t += h; step++;
        if (step % every === 0 || t >= end - 1e-12) record(t);
      }
      out.segments.push({ name: s.name || ('S' + (si + 1)), start_s: start, end_s: end });
    });
    out.dt_s = dt; out.dtRequested_s = requested; out.dtReduced = requested > dtLimit; out.nodes = n;
    out.warnings = [warning('W09')];
    if (Tm === null) out.cpNote = 'cp liquid 2.073 J/g/K used for all temperatures (no Tm entered)';
    out.cpWarning = 'P3HB Tm0 값, 배합 미보정 / P3HB values at Tm0, not calibrated for the compound';
    return out;
  }

  /* ---------- 5.2 zone residence, cooling rates, progress indices ---------- */
  function zoneTime(t, T, lo, hi) {
    const r = { cooling: 0, reheating: 0, hold: 0 };
    for (let i = 0; i < t.length - 1; i++) {
      const dt = t[i + 1] - t[i], a = T[i], b = T[i + 1];
      if (dt <= 0) continue;
      if (a === b) { if (a >= lo && a <= hi) r.hold += dt; continue; }
      const low = Math.min(a, b), high = Math.max(a, b);
      const overlap = Math.max(0, Math.min(high, hi) - Math.max(low, lo));
      const time = dt * overlap / (high - low);
      if (b < a) r.cooling += time; else r.reheating += time;
    }
    r.total = r.cooling + r.reheating + r.hold;
    return r;
  }
  function crossing(t, T, from, level, dir) { // first time after index `from` at which T reaches `level` moving in `dir`
    for (let i = from; i < t.length - 1; i++) {
      const a = T[i], b = T[i + 1];
      if (dir < 0 ? (a >= level && b <= level && a !== b) : (a <= level && b >= level && a !== b)) {
        return { time: t[i] + (t[i + 1] - t[i]) * (a - level) / (a - b), index: i };
      }
      if (a === level && (dir < 0 ? b < a : b > a)) return { time: t[i], index: i };
    }
    return null;
  }
  function coolingRate(t, T, from_C, to_C) {
    const startIdx = T.findIndex(x => x >= from_C);
    if (startIdx < 0) return { applicable: false, reason: 'below_start', from_C, to_C };
    const a = crossing(t, T, startIdx, from_C, -1);
    if (!a) return { applicable: false, reason: 'no_crossing', from_C, to_C };
    const b = crossing(t, T, a.index, to_C, -1);
    if (b) return { applicable: true, rate_K_s: (from_C - to_C) / (b.time - a.time), from_C, to_C, reached: true };
    let minT = Infinity, minTime = a.time;
    for (let i = a.index + 1; i < t.length; i++) if (T[i] < minT) { minT = T[i]; minTime = t[i]; }
    if (!(minT < from_C) || minTime <= a.time) return { applicable: false, reason: 'no_cooling', from_C, to_C };
    return { applicable: true, rate_K_s: (from_C - minT) / (minTime - a.time), from_C, to_C: minT, reached: false, lowest_C: minT };
  }
  function interpLogTime(curve, T) { // curve: [{T_C, time_s}] sorted; returns null outside the measured range
    if (!curve || curve.length < 2) return null;
    const pts = curve.slice().sort((a, b) => a.T_C - b.T_C);
    if (T < pts[0].T_C || T > pts[pts.length - 1].T_C) return null;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      if (T >= p.T_C && T <= q.T_C) {
        const f = q.T_C === p.T_C ? 0 : (T - p.T_C) / (q.T_C - p.T_C);
        return Math.pow(10, Math.log10(p.time_s) + f * (Math.log10(q.time_s) - Math.log10(p.time_s)));
      }
    }
    return null;
  }
  function progressIndex(t, T, curve) {
    let value = 0, excluded = 0;
    for (let i = 0; i < t.length - 1; i++) {
      const dt = t[i + 1] - t[i], tau = interpLogTime(curve, (T[i] + T[i + 1]) / 2);
      if (tau === null) excluded += dt; else value += dt / tau;
    }
    return { value, excluded_s: excluded };
  }
  function history(profile, opts) {
    const o = opts || {};
    const kin = o.kinetics || kinetics(o.kineticsRef);
    if (!kin) return { error: 'kinetics_missing' };
    const a = kin.anchors;
    const nucHi = finite(o.nucleationMax_C) ? Math.min(Math.max(o.nucleationMax_C, a.T_nuc_fastest_C[1]), 45) : a.T_nuc_fastest_C[1];
    const zones = {
      nucleation: o.nucleationZone_C || [a.T_nuc_fastest_C[0], nucHi],
      crystallization: o.crystallizationZone_C || a.T_cryst_fastest_C,
      growth: a.T_growth_max_C,
    };
    const Tg = finite(o.Tg_C) ? o.Tg_C : 0;
    const CR2 = range(a.CR2_K_s);
    const curves = kin.curves || {};
    const curveMode = (curves.t_half && curves.t_half.length >= 2) || (curves.t_nuc_onset && curves.t_nuc_onset.length >= 2);
    const warnings = [warning('W09')];
    const positions = {};
    const series = { surface: profile.T_surfaceA, center: profile.T_center, mean: profile.T_mean };
    if (profile.T_surfaceB && o.includeSurfaceB) series.surfaceB = profile.T_surfaceB;
    let extrapolated = false;
    for (const [pos, T] of Object.entries(series)) {
      if (!T) continue;
      const t = profile.t_s;
      const res = {};
      for (const [z, [lo, hi]] of Object.entries(zones)) res[z] = zoneTime(t, T, lo, hi);
      const cr1 = coolingRate(t, T, 140, 60);
      const cr2 = coolingRate(t, T, 70, Tg);
      const r = {
        residence: res,
        CR1: Object.assign(cr1, cr1.applicable ? { threshold_K_s: a.CR1_K_s, suppressed: cr1.rate_K_s >= a.CR1_K_s } : {}),
        CR2: Object.assign(cr2, cr2.applicable ? { threshold_K_s: CR2[1], thresholdAlt_K_s: CR2[0], suppressed: cr2.rate_K_s >= CR2[1], suppressedAlt: cr2.rate_K_s >= CR2[0] } : {}),
        minT_C: Math.min(...T), maxT_C: Math.max(...T),
      };
      if (curveMode) {
        r.mode = 'curve';
        if (curves.t_nuc_onset && curves.t_nuc_onset.length >= 2) r.N = progressIndex(t, T, curves.t_nuc_onset);
        if (curves.t_half && curves.t_half.length >= 2) r.P = progressIndex(t, T, curves.t_half);
        if ((r.N && r.N.excluded_s > 0) || (r.P && r.P.excluded_s > 0)) extrapolated = true;
      } else {
        r.mode = 'anchor';
        r.anchorRatio = {
          crystallization: res.crystallization.total / a.t_half_min_s,
          nucleation: res.nucleation.total / a.t_nuc_onset_min_s,
          note: 'rank index, not crystallinity',
        };
      }
      positions[pos] = r;
    }
    const study = a.nucStudyRange_C;
    if (zones.nucleation[0] < study[0] || zones.nucleation[1] > study[1]) extrapolated = true;
    if (extrapolated) warnings.push(warning('W08'));
    return { zones, Tg_C: Tg, mode: curveMode ? 'curve' : 'anchor', positions, warnings };
  }

  /* ---------- 5.3 nuclei survival (absolute-temperature rule) ---------- */
  function survivalClass(Tpeak_C, s) {
    const keep = s ? s.T_keep_C : 120, loss = s ? range(s.T_loss_C)[1] : 140;
    if (Tpeak_C <= keep) return 'keep';
    if (Tpeak_C <= loss) return 'partial_loss_risk';
    return 'lost';
  }
  function nucleiSurvival(t, T, opts) {
    const o = opts || {};
    const s = (o.kinetics || kinetics(o.kineticsRef) || {}).survival || { T_keep_C: 120, T_loss_C: [130, 140], exposure_s: 0.01 };
    const lo = 0, hi = 50;
    let last = -1;
    for (let i = 0; i < T.length; i++) if (T[i] >= lo && T[i] <= hi) last = i;
    if (last < 0) return { status: 'not_applicable', reason: 'resin never entered 0–50 °C', warnings: [] };
    let peak = -Infinity, above100 = 0;
    for (let i = last; i < T.length; i++) {
      peak = Math.max(peak, T[i]);
      if (i < T.length - 1) above100 += zoneTime([t[i], t[i + 1]], [T[i], T[i + 1]], 100, Infinity).total;
    }
    return judgeSurvival(peak, above100, s, o.heterogeneous);
  }
  function judgeSurvival(Tpeak_C, exposureAbove100_s, s, heterogeneous) {
    const surv = s || { T_keep_C: 120, T_loss_C: [130, 140], exposure_s: 0.01 };
    const status = survivalClass(Tpeak_C, surv);
    const warnings = [];
    if (status === 'partial_loss_risk') warnings.push(warning('W04'));
    if (status === 'lost') warnings.push(warning('W05'));
    if (finite(exposureAbove100_s) && exposureAbove100_s > surv.exposure_s) warnings.push(warning('W12'));
    return { status, T_peak_after_C: Tpeak_C, exposureAbove100_s, homogeneousOnly: true, heterogeneous: !!heterogeneous, warnings };
  }

  /* ---------- 5.4 line speed and residence ---------- */
  const lineSpeed_m_min = (output_ea_min, cutLength_m) => output_ea_min * cutLength_m;
  const residence_s = (L_m, v_m_min) => 60 * L_m / v_m_min;
  const vmax_m_min = (segments) => Math.min(...segments.map(s => 60 * s.L_m / s.tRequired_s));
  const Lrequired_m = (tRequired_s, v_m_min) => tRequired_s * v_m_min / 60;
  const rollContact_s = (D_mm, wrap_deg, v_m_min) =>
    (wrap_deg / 360) * Math.PI * (D_mm / 1000) / (v_m_min / 60);
  // 비열 일정, 결정화 발열 제외 조건의 현열비
  const sensibleHeatRatio = (Tdie1_C, Tdie2_C, Ttarget_C) => (Tdie1_C - Ttarget_C) / (Tdie2_C - Ttarget_C);
  const sameResidenceLength_m = (L_old_m, v_old, v_new) => L_old_m * v_new / v_old;
  function speedCheck(segments, v_m_min) { // segments: [{name, L_m, tRequired_s}] with tRequired_s from thermal1d or measurement
    const rows = segments.map(s => {
      const res = residence_s(s.L_m, v_m_min);
      const ok = finite(s.tRequired_s) ? res >= s.tRequired_s : null;
      return { name: s.name, L_m: s.L_m, residence_s: res, tRequired_s: s.tRequired_s ?? null,
        Lrequired_m: finite(s.tRequired_s) ? Lrequired_m(s.tRequired_s, v_m_min) : null, ok };
    });
    const known = segments.filter(s => finite(s.tRequired_s) && s.tRequired_s > 0);
    const vmax = known.length ? vmax_m_min(known) : null;
    const warnings = rows.some(r => r.ok === false) ? [warning('W06')] : [];
    return { v_m_min, vmax_m_min: vmax, rows, warnings };
  }

  /* ---------- 5.5 CNT critical radius (display only) ---------- */
  function criticalRadius_nm(T_C, opts) {
    const o = opts || {};
    const d = dataRoot();
    const c = d ? d.reference.P3HB_REF_2026.cnt : null;
    const Tm0 = c ? c.Tm0_K.value : 468, sigma = c ? c.sigma_J_m2.value : 0.044;
    const dsm = c ? c.dsm_J_K_mol.value : 26.859, M = c ? c.repeatUnit_g_mol.value : 86.09;
    const cpS = c ? c.cp_solid_J_gK.value : 1.858, cpL = c ? c.cp_liquid_J_gK.value : 2.073;
    const dhm = o.dhm === 'molar' ? (c ? c.dhm_J_mol.value / c.V_m3_mol.value : 12570 / 7.5e-5) : (c ? c.dhm_J_m3.value : 1.85e8);
    const T = T_C + K0, dT = Tm0 - T;
    const dcp = (cpL - cpS) * M; // J/mol/K
    const dg = dhm * dT / Tm0 * (1 - (dcp / dsm) * dT / (2 * Tm0));
    if (!(dg > 0)) return null;
    return 2 * sigma / dg * 1e9;
  }

  const api = { VERSION, WARNINGS, warning, kinetics, thermal1d, zoneTime, coolingRate, interpLogTime, history,
    survivalClass, nucleiSurvival, judgeSurvival,
    lineSpeed_m_min, residence_s, vmax_m_min, Lrequired_m, rollContact_s, sensibleHeatRatio, sameResidenceLength_m, speedCheck,
    criticalRadius_nm };
  root.PHACrystalEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
