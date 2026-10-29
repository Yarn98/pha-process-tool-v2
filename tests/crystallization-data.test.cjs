const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../crystallization-data.js');

const root = path.resolve(__dirname, '..');
const ref = JSON.parse(fs.readFileSync(path.join(root, 'data/crystallization/p3hb_ref_2026.json'), 'utf8'));
const presets = JSON.parse(fs.readFileSync(path.join(root, 'data/process/crystallization_presets.json'), 'utf8'));
const EVIDENCE = new Set(['confirmed', 'judged', 'estimated', 'measured']);

// Snapshot of work-order chapter 1 (Macromolecules 2026, 59, 379–391). A changed character fails here.
const CHAPTER1 = {
  Tm0_C: [195, '°C', '§1, Table 1'],
  Tg_C: [[5, 0], '°C', '§3.1 / §1'],
  CR1_K_s: [2, 'K/s', 'Fig. 1b'],
  CR2_K_s: [[70, 100], 'K/s', 'Fig. 2b / 초록·결론'],
  T_cryst_fastest_C: [[60, 70], '°C', 'Fig. 3b'],
  t_half_min_s: [30, 's', 'Fig. 3b'],
  T_nuc_fastest_C: [[30, 40], '°C', 'Fig. 6c, 초록'],
  t_nuc_onset_min_s: [1, 's', 'Fig. 6b–c'],
  T_growth_max_C: [[80, 90], '°C', '§1 선행연구 인용'],
  G_max_um_s: [4, 'μm/s', '§1'],
  growth_stage: [[70, 5], '°C, s', '§3.2–3.3'],
  crystStudyRange_C: [[[10, 80], [110, 130]], '°C', '§3.2'],
  nucStudyRange_C: [[0, 50], '°C', '§3.3'],
};

test('generated module matches both JSON sources', () => {
  assert.deepEqual(data.reference.P3HB_REF_2026, ref);
  assert.deepEqual(data.presets, presets);
});

test('chapter 1 kinetics constants match the work order exactly', () => {
  assert.deepEqual(Object.keys(ref.kinetics), Object.keys(CHAPTER1));
  for (const [key, [value, unit, source]] of Object.entries(CHAPTER1)) {
    assert.deepEqual(ref.kinetics[key].value, value, key);
    assert.equal(ref.kinetics[key].unit, unit, key);
    assert.equal(ref.kinetics[key].source, source, key);
  }
  assert.equal(ref.citation.doi, '10.1021/acs.macromol.5c02381');
  assert.equal(ref.citation.pages, '379–391');
});

test('CNT Table 1 parameters match the work order exactly', () => {
  const c = ref.cnt;
  assert.equal(c.Tm0_K.value, 468);
  assert.equal(c.sigma_J_m2.value, 0.044);
  assert.equal(c.dhm_J_mol.value, 12570);
  assert.equal(c.dhm_J_m3.value, 1.85e8);
  assert.equal(c.dsm_J_K_mol.value, 26.859);
  assert.equal(c.cp_solid_J_gK.value, 1.858);
  assert.equal(c.cp_liquid_J_gK.value, 2.073);
  assert.equal(c.V_m3_mol.value, 7.5e-5);
  assert.equal(c.repeatUnit_g_mol.value, 86.09);
});

test('engine anchors and survival follow section 4.3', () => {
  assert.deepEqual(ref.engine.anchors, {
    T_cryst_fastest_C: [60, 70], t_half_min_s: 30,
    T_nuc_fastest_C: [30, 40], t_nuc_onset_min_s: 1,
    T_growth_max_C: [80, 90], G_max_um_s: 4,
    CR1_K_s: 2, CR2_K_s: [70, 100],
    crystStudyRange_C: [10, 130], nucStudyRange_C: [0, 50],
  });
  assert.deepEqual(ref.engine.survival, { T_keep_C: 120, T_loss_C: [130, 140], exposure_s: 0.01, formedAt_C: [0, 30] });
  assert.deepEqual(ref.engine.curves, { t_half: [], t_nuc_onset: [] });
});

test('every quantity carries value, unit, source and a valid evidence grade', () => {
  const quantities = [];
  const walk = node => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    if ('value' in node && 'unit' in node) quantities.push(node);
    Object.values(node).forEach(walk);
  };
  walk(ref); walk(presets);
  assert.ok(quantities.length > 30);
  for (const q of quantities) {
    assert.ok(q.source, JSON.stringify(q));
    assert.ok(EVIDENCE.has(q.evidence), JSON.stringify(q));
  }
});

test('grade classification follows chapter 7 and keeps existing grades as unknown', () => {
  const g = presets.grades;
  assert.equal(g.P3HB_REF_2026.mode, 'crystallizable');
  assert.equal(g.S1000P.mode, 'crystallizable');
  assert.equal(g.S1000P.kineticsRef, null);
  assert.equal(g.A1000P.mode, 'amorphous');
  assert.deepEqual(g.A1000P.Tg_C.value, [-17, -15]);
  for (const id of ['CA1180P', 'CA1165A', 'CA1670P', 'CA1680P', 'CA1270P']) assert.equal(g[id].mode, 'unknown');
});

test('no thermal property defaults without a source', () => {
  const text = JSON.stringify(presets);
  assert.ok(!/"k_W_mK"|"rho_kg_m3"|"h_W_m2K"/.test(text));
});
