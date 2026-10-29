const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../crystallization-doe.js');

test('screening designs follow section 8.2', () => {
  const s = D.screening('straw', { grade: 'CB0400A', lot: 'L1' });
  assert.equal(s.conditions, 7); // 3 × 2 + control
  assert.deepEqual(s.rows.slice(1).map(r => [r.factor_1, r.factor_2]), [[30, 70], [30, 75], [35, 70], [35, 75], [40, 70], [40, 75]]);
  assert.equal(s.rows[0].note, 'control');
  assert.deepEqual(D.screening('injection').rows.slice(1).map(r => r.factor_1), [60, 65, 70]);
  const sh = D.screening('sheet');
  assert.deepEqual(sh.rows.slice(1).map(r => r.factor_1), [65, 70, 75]);
  assert.deepEqual(sh.fixed, { R1_C: 60, R3_C: 40 });
  assert.equal(D.toCSV(s.rows).split('\n')[0], D.COLUMNS.join(','));
  assert.equal(D.screening('straw', { reps: 3 }).rows.length, 21);
});

test('speed ramp needs a user-defined step', () => {
  assert.deepEqual(D.speedRamp(400, 50, 600).steps, [400, 450, 500, 550, 600]);
  assert.ok(D.speedRamp(400, 0, 600).error);
});

test('CCD is generated only for two or more factors', () => {
  assert.ok(D.ccd([{ name: 'a', low: 30, high: 40 }]).error);
  const c = D.ccd([{ name: 'bath1_C', low: 30, high: 40 }, { name: 'bath2_C', low: 70, high: 75 }], 3);
  assert.equal(c.runs.length, 4 + 4 + 3);
  assert.ok(Math.abs(c.alpha - Math.SQRT2) < 1e-12);
});

const run = (condition, speeds, flags = [1, 1, 1], isControl = false) =>
  speeds.map(s => ({ condition, speed: s, pass_t0: flags[0], pass_24h: flags[1], pass_7d: flags[2], isControl }));

test('decision: highest sustained speed passing all three time points, practical threshold', () => {
  const rows = [].concat(run('control', [400, 410, 405], undefined, true), run('35/75', [460, 470, 465]), run('30/70', [500, 510]), run('40/75', [520, 530, 525], [1, 1, 0]));
  const d = D.decide(rows, { process: 'straw', practicalDelta_pct: 5 });
  assert.equal(d.best.condition, '35/75');
  assert.equal(d.summary.find(s => s.condition === '30/70').label.ko, '결정 불가 (n < 3)');
  assert.ok(d.improvement_pct > 14 && d.improvement_pct < 15);
  assert.equal(d.outcome, 'new_standard_candidate');
  assert.ok(d.stats.p < 0.01);
  assert.deepEqual(d.secondaryCrystallization.map(s => s.condition), ['40/75']);
  assert.equal(D.decide(rows, { process: 'straw', practicalDelta_pct: 20 }).outcome, 'no_difference');
});

test('decision: injection minimizes cycle', () => {
  const rows = [].concat(run('control', [30, 31, 29], undefined, true), run('65', [25, 26, 24]), run('70', [27, 27, 28]));
  const d = D.decide(rows, { process: 'injection', practicalDelta_pct: 5 });
  assert.equal(d.best.condition, '65');
  assert.ok(Math.abs(d.improvement_pct - 100 * 5 / 30) < 1e-9);
});

test('Welch t-test matches a reference value', () => {
  // a = [1..5], b = [3..7]: t = -2, df = 8, two-sided p ≈ 0.0805
  const w = D.welch([1, 2, 3, 4, 5], [3, 4, 5, 6, 7]);
  assert.ok(Math.abs(w.t + 2) < 1e-12); assert.ok(Math.abs(w.df - 8) < 1e-9); assert.ok(Math.abs(w.p - 0.0805) < 0.0005);
});
