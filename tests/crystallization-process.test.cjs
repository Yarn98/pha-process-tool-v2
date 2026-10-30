const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../crystallization-process.js');

const near = (actual, expected, tol, label) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} not within ${tol} of ${expected}`);
const codes = r => r.warnings.map(w => w.code);
// Test-only thermal inputs; the app has no defaults for k, ρ or h.
const thermal = { k_W_mK: 0.2, rho_kg_m3: 1250 };

test('grade branching: A1000P disables the crystallization module with W10', () => {
  const g = P.gradeProfile('A1000P');
  assert.equal(g.moduleOn, false);
  assert.ok(g.warnings.some(w => w.code === 'W10'));
  const r = P.straw({ gradeId: 'A1000P', output_ea_min: 400, cutLength_m: 0.26, wall_mm: 0.2, dieExit_C: 180,
    baths: [{ name: '1차', L_m: 1.0, Twater_C: 22, h_W_m2K: 800 }], thermal, handling_C: 40, tackSurface_C: 30 });
  assert.equal(r.history, null);
  assert.ok(r.amorphous && r.amorphous.handling);
  assert.ok(codes(r).includes('W10'));
});

test('grade branching: S1000P replaces only the t½ anchor with its measured 60 °C value (W13)', () => {
  const E = require('../crystallization-engine.js');
  const g = P.gradeProfile('S1000P');
  assert.equal(g.moduleOn, true); assert.equal(g.uncalibrated, false);
  assert.equal(g.kineticsSource, 'measured_anchor');
  assert.deepEqual([g.measuredAnchor.lot, g.measuredAnchor.T_C], ['3ACF240209', 60]);
  near(g.kinetics.anchors.t_half_min_s, 0.4166 * 60, 1e-9, 't½');
  assert.equal(g.kinetics.anchors.t_nuc_onset_min_s, 1);
  assert.deepEqual(g.kinetics.anchors.T_cryst_fastest_C, [60, 70]);
  assert.equal(E.kinetics('P3HB_REF_2026').anchors.t_half_min_s, 30, 'reference data is not mutated');
  assert.deepEqual(codes(g), ['W13']);
  // Measured curves still take precedence over the one-point anchor.
  const m = P.gradeProfile('S1000P', { measuredKinetics: { t_half: [{ T_C: 50, time_s: 20 }, { T_C: 70, time_s: 10 }] } });
  assert.equal(m.kineticsSource, 'measured');
  assert.equal(m.warnings.length, 0);
  assert.equal(P.gradeProfile('P3HB_REF_2026').uncalibrated, false);
});

test('grade branching: CB0400A uses the CB0190PN25 proxy t½ (W15); CB0104A stays on P3HB values (W02)', () => {
  const p = P.gradeProfile('CB0400A');
  assert.equal(p.mode, 'blend'); assert.equal(p.moduleOn, true); assert.equal(p.uncalibrated, false);
  assert.equal(p.kineticsSource, 'proxy_anchor');
  assert.deepEqual([p.measuredAnchor.proxyOf, p.measuredAnchor.evidence], ['CB0190PN25', 'judged']);
  near(p.kinetics.anchors.t_half_min_s, 0.4483 * 60, 1e-9, 'proxy t½');
  assert.deepEqual(codes(p), ['W15']);
  assert.match(p.warnings[0].detail, /^CB0190PN25 \(CB0190PN25_Ref_20\/250\) · t½ 26\.9 s @ 60 °C$/);
  const b = P.gradeProfile('CB0104A');
  assert.equal(b.uncalibrated, true); assert.deepEqual(codes(b), ['W02']);
});

test('grade branching: PLA-matrix grades are out of scope (W14)', () => {
  for (const id of ['CA1180P', 'CA1165A', 'CA1670P', 'CA1680P', 'CA1270P']) {
    const g = P.gradeProfile(id);
    assert.equal(g.mode, 'out_of_scope', id); assert.equal(g.moduleOn, false, id);
    assert.deepEqual(codes(g), ['W14'], id);
    assert.equal(g.display.ko, 'PLA 매트릭스: 대상 외', id);
  }
  assert.deepEqual(codes(P.gradeProfile('X', { matrix: 'PLA' })), ['W14']);
  const inj = P.injection({ gradeId: 'CA1180P', melt_C: 185, moldSurface_C: 115, wall_mm: 2, fillTime_s: 1, holdTime_s: 5, coolingTime_s: 30, thermal });
  assert.equal(inj.history, null);
  assert.ok(codes(inj).includes('W14') && !codes(inj).includes('W02'));
});

test('S1000P anchor ratio uses the measured t½ (25.0 s), not the P3HB 30 s', () => {
  const run = extra => P.injection(Object.assign({ melt_C: 170, moldSurface_C: 65, wall_mm: 2, fillTime_s: 1, holdTime_s: 5, coolingTime_s: 30, thermal }, extra));
  const s = run({ gradeId: 'S1000P' }).history.positions.center;
  const ref = run({ gradeId: 'P3HB_REF_2026' }).history.positions.center;
  near(s.residence.crystallization.total, ref.residence.crystallization.total, 1e-12, 'same thermal history');
  near(s.anchorRatio.crystallization, ref.anchorRatio.crystallization * 30 / (0.4166 * 60), 1e-9, 'ratio');
});

test('Tg-shift nucleation zone is estimated and off by default', () => {
  assert.equal(P.gradeProfile('S1000P').nucleationZone, null);
  const z = P.gradeProfile('S1000P', { tgShift: true, Tg_C: -6 }).nucleationZone;
  assert.deepEqual(z.value, [19, 29]); assert.equal(z.evidence, 'estimated');
});

const korea = { gradeId: 'S1000P', output_ea_min: 400, cutLength_m: 0.26, targetOutput_ea_min: 600, wall_mm: 0.2, dieExit_C: 180,
  baths: [{ name: '1차', L_m: 1.0, Twater_C: 22, h_W_m2K: 800 }, { name: '2차', L_m: 3.3, Twater_C: 60, h_W_m2K: 800 }], thermal };

test('straw: Korea line speed, residence and same-residence lengthening', () => {
  const r = P.straw(korea);
  near(r.lineSpeed_m_min, 104, 1e-9, 'v');
  near(r.residence[0].residence_s, 0.577, 0.005, 'bath1'); near(r.residence[1].residence_s, 1.904, 0.005, 'bath2');
  near(r.speedUp[1].L_new_m, 4.95, 1e-9, 'L2');
  assert.deepEqual(r.speedUpPlan.bath2Plan_L_m, [5.0, 5.5]);
  assert.equal(r.badge.ko, '상온 2차 결정화 진행');
  assert.equal(r.checks.length, 3);
  assert.ok(codes(r).includes('W09'));
  near(r.rules.find(x => x.rule === 'S5').ratio, 1.2, 1e-12, 'S5');
});

test('straw: S1 warns W01 when bath-1 exit is hotter than bath 2', () => {
  const hot = JSON.parse(JSON.stringify(korea));
  hot.baths[0].h_W_m2K = 50; hot.baths[1].Twater_C = 75;
  const r = P.straw(hot);
  const s1 = r.rules.find(x => x.rule === 'S1');
  assert.equal(s1.cooling, true);
  assert.ok(codes(r).includes('W01'));
  assert.equal(r.rules.find(x => x.rule === 'S2').path, 'continuous_cooling');
});

test('straw: a bath 1 long enough to reach 30–40 °C then a warm bath 2 classifies as nucleation --> reheat', () => {
  const r = P.straw(Object.assign({}, korea, { baths: [{ name: '1차', L_m: 3.0, Twater_C: 35, h_W_m2K: 3000 }, { name: '2차', L_m: 3.3, Twater_C: 75, h_W_m2K: 3000 }] }));
  assert.equal(r.rules.find(x => x.rule === 'S2').path, 'nucleation_reheat');
  assert.ok(!codes(r).includes('W01'));
});

test('straw: missing h stops heat transfer with W03 but keeps speed outputs', () => {
  const r = P.straw(Object.assign({}, korea, { baths: [{ name: '1차', L_m: 1.0, Twater_C: 22 }] }));
  assert.equal(r.stopped, true);
  assert.ok(codes(r).includes('W03'));
  near(r.residence[0].residence_s, 0.577, 0.005, 'bath1');
});

test('straw: required time longer than residence gives W06', () => {
  const r = P.straw(Object.assign({}, korea, { baths: [{ name: '1차', L_m: 1.0, Twater_C: 22, h_W_m2K: 800, tRequired_s: 2 }] }));
  assert.ok(codes(r).includes('W06'));
});

test('injection: setpoint-only mold gives W11 and no straw melt is copied', () => {
  const r = P.injection({ gradeId: 'CB0104A', moldSetpoint_C: 65, wall_mm: 2, fillTime_s: 1, holdTime_s: 5, coolingTime_s: 15, thermal });
  assert.ok(codes(r).includes('W11'));
  assert.equal(r.error, 'melt');
  assert.equal(r.profile, undefined);
});

test('injection: surface mold run computes the centre band time and shows conflicting cycle presets with W07', () => {
  const r = P.injection({ gradeId: 'CB0104A', melt_C: 170, moldSurface_C: 65, wall_mm: 2, fillTime_s: 1, holdTime_s: 5, coolingTime_s: 30, band_C: 5, purpose: 'cycle', thermal });
  assert.equal(P.injection({ purpose: 'HDT' }).warnings.some(w => w.code === 'W07'), false);
  assert.ok(!codes(r).includes('W11'));
  assert.ok(r.centerInBand.time_s > 0);
  assert.ok(r.history.positions.center.residence.crystallization.total > 0);
  assert.ok(codes(r).includes('W07'));
  assert.equal(P.injection({ flashTiming: 'fill', purpose: 'cycle' }).rules.find(x => x.rule === 'I2').actions.length, 4);
});

test('sheet: roll contact, curl index, R2 control and reheat survival', () => {
  const r = P.sheet({ gradeId: 'S1000P', dieExit_C: 175, thickness_mm: 0.5, lineSpeed_m_min: 20, thermal, stickingControl_R2_C: 55, postReheat_C: 125,
    rolls: [{ name: 'R1', D_mm: 400, wrap_deg: 10, T_C: 60, contact: 'both', T_opposite_C: 70 }, { name: 'R2', D_mm: 400, wrap_deg: 180, T_C: 70, contact: 'B' }, { name: 'R3', D_mm: 400, wrap_deg: 180, T_C: 40, contact: 'A' }] });
  near(r.rules.find(x => x.rule === 'H2').R2_contact_s, 1.885, 0.005, 'R2');
  assert.ok(Math.abs(r.rules.find(x => x.rule === 'H1').maxDeltaAB_C) > 0);
  assert.equal(r.rules.find(x => x.rule === 'H4').control_R2_C, 55);
  assert.ok(codes(r).includes('W07'));
  assert.equal(r.survival.status, 'partial_loss_risk');
  assert.ok(codes(r).includes('W04'));
  assert.equal(P.sheet({ matrix: 'PLA' }).grade.mode, 'out_of_scope');
});

test('extension processes give no recommendations', () => {
  for (const p of P.STUBS) { const r = P.run(p, {}); assert.equal(r.supported, false); assert.equal(r.recommendations, null); }
});
