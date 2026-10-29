const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../crystallization-engine.js');

const near = (actual, expected, tol, label) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} not within ${tol} of ${expected}`);

// Section 9.3 verification values.
test('sensibleHeatRatio 190, 170, 70 °C = 1.20', () => near(E.sensibleHeatRatio(190, 170, 70), 1.2, 1e-12, 'ratio'));
test('vmax_m_min L 3 m, t 10 s = 18 m/min', () => assert.equal(E.vmax_m_min([{ L_m: 3, tRequired_s: 10 }]), 18));
test('rollContact_s 400 mm, 180°, 20 m/min = 1.885 s', () => near(E.rollContact_s(400, 180, 20), 1.885, 0.005, 'contact'));
test('lineSpeed_m_min 450 ea/min × 0.26 m = 117 m/min', () => near(E.lineSpeed_m_min(450, 0.26), 117, 1e-9, 'speed'));
test('lineSpeed_m_min 400 ea/min × 0.26 m = 104 m/min', () => near(E.lineSpeed_m_min(400, 0.26), 104, 1e-9, 'speed'));
test('residence_s 1.0 m at 104 m/min = 0.577 s', () => near(E.residence_s(1.0, 104), 0.577, 0.005, 'res'));
test('residence_s 3.3 m at 104 m/min = 1.904 s', () => near(E.residence_s(3.3, 104), 1.904, 0.005, 'res'));
test('same-residence speed-up 3.3 m, 400 --> 600 ea/min = 4.95 m', () => near(E.sameResidenceLength_m(3.3, 400, 600), 4.95, 1e-9, 'L'));
test('criticalRadius 25 °C, Δhm 1.85e8 J/m³ = 1.50 nm', () => near(E.criticalRadius_nm(25), 1.50, 0.02, 'Rc'));
test('criticalRadius 25 °C, 12,570 J/mol ÷ 7.5e-5 m³/mol = 1.65 nm', () => near(E.criticalRadius_nm(25, { dhm: 'molar' }), 1.65, 0.02, 'Rc'));
test('criticalRadius 140 °C, Δhm 1.85e8 J/m³ = 4.23 nm', () => near(E.criticalRadius_nm(140), 4.23, 0.05, 'Rc'));
test('nucleiSurvival T_peak 75 / 125 / 145 °C = keep / partial_loss_risk / lost', () => {
  assert.equal(E.judgeSurvival(75).status, 'keep');
  assert.equal(E.judgeSurvival(125).status, 'partial_loss_risk');
  assert.equal(E.judgeSurvival(145).status, 'lost');
  assert.deepEqual(E.judgeSurvival(125).warnings.map(w => w.code), ['W04']);
  assert.deepEqual(E.judgeSurvival(145).warnings.map(w => w.code), ['W05']);
});

const solid = { k_W_mK: 0.2, rho_kg_m3: 1200 };
test('thermal1d converges to the boundary temperature and shrinks an oversized Δt', () => {
  const r = E.thermal1d(Object.assign({ thickness_mm: 1, T0_C: 180, dt_s: 10, segments: [
    { name: 'mold', duration_s: 120, A: { type: 'fixed', T_C: 65 }, B: { type: 'fixed', T_C: 65 } }] }, solid));
  assert.ok(!r.error);
  assert.equal(r.dtReduced, true);
  assert.ok(r.dt_s < 10);
  const last = r.t_s.length - 1;
  for (const key of ['T_surfaceA', 'T_surfaceB', 'T_center', 'T_mean']) near(r[key][last], 65, 0.05, key);
  assert.equal(r.nodes, 21);
  assert.ok(r.warnings.some(w => w.code === 'W09'));
});
test('thermal1d convective cooling converges to the fluid temperature and stays bounded', () => {
  const r = E.thermal1d(Object.assign({ thickness_mm: 0.2, T0_C: 180, segments: [
    { duration_s: 60, A: { type: 'convective', h_W_m2K: 1000, Tinf_C: 25 }, B: { type: 'adiabatic' } }] }, solid));
  const last = r.t_s.length - 1;
  near(r.T_center[last], 25, 0.1, 'center');
  assert.ok(r.T_center.every(T => T <= 180 + 1e-9 && T >= 25 - 1e-9));
});
test('thermal1d stops and lists missing k, ρ, h (W03)', () => {
  const r = E.thermal1d({ thickness_mm: 1, T0_C: 180, segments: [{ duration_s: 1, A: { type: 'convective', Tinf_C: 25 } }] });
  assert.equal(r.error, 'W03');
  assert.deepEqual(r.missing, ['k', 'ρ', 'h']);
});

test('zoneTime splits cooling and reheating time inside a band', () => {
  const z = E.zoneTime([0, 10, 20], [50, 30, 50], 30, 40);
  near(z.cooling, 5, 1e-9, 'cooling'); near(z.reheating, 5, 1e-9, 'reheating');
});
test('history: anchor ratios and CR1 comparison from a linear ramp', () => {
  // 180 --> 0 °C at 4 K/s: 60–70 °C takes 2.5 s, 30–40 °C takes 2.5 s.
  const t = [], T = [];
  for (let i = 0; i <= 450; i++) { t.push(i * 0.1); T.push(180 - 4 * i * 0.1); }
  const h = E.history({ t_s: t, T_surfaceA: T, T_center: T, T_mean: T });
  const c = h.positions.center;
  assert.equal(h.mode, 'anchor');
  near(c.residence.crystallization.cooling, 2.5, 1e-6, 'cryst');
  near(c.anchorRatio.crystallization, 2.5 / 30, 1e-6, 'ratio');
  near(c.anchorRatio.nucleation, 2.5, 1e-6, 'nuc ratio');
  near(c.CR1.rate_K_s, 4, 1e-6, 'CR1'); assert.equal(c.CR1.suppressed, true);
  near(c.CR2.rate_K_s, 4, 1e-6, 'CR2'); assert.equal(c.CR2.suppressed, false);
  assert.equal(c.CR2.threshold_K_s, 100); assert.equal(c.CR2.thresholdAlt_K_s, 70);
});
test('history: curve mode integrates N and P and flags extrapolation (W08)', () => {
  const t = [0, 10, 20], T = [65, 65, 150];
  const kin = JSON.parse(JSON.stringify(E.kinetics()));
  kin.curves.t_half = [{ T_C: 60, time_s: 30 }, { T_C: 70, time_s: 30 }];
  const h = E.history({ t_s: t, T_surfaceA: T, T_center: T, T_mean: T }, { kinetics: kin });
  assert.equal(h.mode, 'curve');
  near(h.positions.center.P.value, 10 / 30, 1e-9, 'P');
  assert.ok(h.warnings.some(w => w.code === 'W08'));
});
test('nucleiSurvival finds the peak after the last 0–50 °C visit and flags long exposure', () => {
  const r = E.nucleiSurvival([0, 1, 2, 3], [40, 60, 125, 80]);
  assert.equal(r.status, 'partial_loss_risk');
  assert.ok(r.warnings.some(w => w.code === 'W12'));
  assert.equal(E.nucleiSurvival([0, 1], [180, 70]).status, 'not_applicable');
});
test('speedCheck flags W06 when residence is shorter than required time', () => {
  const r = E.speedCheck([{ name: '2차', L_m: 3.3, tRequired_s: 5 }], 104);
  assert.equal(r.rows[0].ok, false);
  assert.ok(r.warnings.some(w => w.code === 'W06'));
  near(r.rows[0].Lrequired_m, 5 * 104 / 60, 1e-9, 'Lreq');
});
