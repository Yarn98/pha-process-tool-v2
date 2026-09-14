const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/vent_guide.json'), 'utf8'));
const sourceIds = new Set(data.sources.map(source => source.id));
const bilingual = (value, name) => {
  assert.deepEqual(Object.keys(value).sort(), ['en', 'ko'], name);
  for (const lang of ['ko', 'en']) {
    assert.equal(typeof value[lang], 'string', name + '/' + lang);
    assert.ok(value[lang].trim(), name + '/' + lang);
    assert.doesNotMatch(value[lang], /<\/?(?:script|iframe)|javascript:/i, name);
  }
};

test('browser and CommonJS use the reviewed source without fetch or divergence', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'vent-guide-data.js'), 'utf8'), context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.PHAVentGuideData)), data);
  assert.deepEqual(require('../vent-guide-data.js'), data);
  assert.match(execFileSync(process.execPath, ['scripts/sync-vent-guide.cjs', '--check'], { cwd: root, encoding: 'utf8' }), /VENT_GUIDE_DATA_OK/);
  const kb = JSON.parse(fs.readFileSync(path.join(root, 'data/troubleshooting_kb.json'), 'utf8'));
  assert.ok(kb.some(entry => entry.id === data.kb_id));
  assert.match(data.review_date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(data.review_version, '2026-09-14-vent-guide');
});

test('all selectable guides retain bilingual explanations, actions and acceptance criteria', () => {
  assert.deepEqual(data.vents.map(vent => vent.id), ['atm', 'vac']);
  assert.deepEqual(data.configurations.map(config => config.id), ['without_reverse', 'upstream_reverse']);
  assert.deepEqual(data.symptoms.map(symptom => symptom.id), ['particles', 'rpm_mi', 'rate_mi', 'pressure']);
  for (const key of ['title', 'summary', 'scope', 'vent_rationale', 'configuration_comparison_note', 'not_universal']) bilingual(data[key], key);
  for (const vent of data.vents) for (const key of ['title', 'purpose', 'state', 'if_missing']) bilingual(vent[key], vent.id + '/' + key);
  for (const config of data.configurations) {
    for (const key of ['title', 'summary', 'interpretation']) bilingual(config[key], config.id + '/' + key);
    assert.ok(config.check.length > 0);
    config.check.forEach(value => bilingual(value, config.id + '/check'));
  }
  for (const symptom of data.symptoms) {
    for (const key of ['label', 'meaning', 'action', 'accept']) bilingual(symptom[key], symptom.id + '/' + key);
    assert.ok(symptom.checks.length > 0);
    symptom.checks.forEach(value => bilingual(value, symptom.id + '/checks'));
  }
  for (const key of ['title', 'when', 'trial', 'accept', 'revert']) bilingual(data.temperature[key], 'temperature/' + key);
  assert.ok(data.sequence.length >= 3);
  data.sequence.forEach(step => ['title', 'body'].forEach(key => bilingual(step[key], 'sequence/' + key)));
  data.terms.forEach(term => ['term', 'meaning'].forEach(key => bilingual(term[key], 'terms/' + key)));
});

test('every conditional branch resolves to primary sources with disclosed scope', () => {
  assert.equal(sourceIds.size, data.sources.length);
  const used = new Set();
  for (const source of data.sources) {
    assert.ok(source.title.trim());
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(['www.4spe.org', 'www.coperion.com', 'entek.com', 'doi.org', 'www.iso.org', 'extruders.leistritz.com'].includes(url.hostname));
    bilingual(source.scope, source.id + '/scope');
  }
  for (const branch of [...data.vents, ...data.configurations, ...data.symptoms, data.temperature]) {
    assert.ok(branch.source_ids.length > 0);
    assert.equal(new Set(branch.source_ids).size, branch.source_ids.length);
    for (const id of branch.source_ids) {
      assert.ok(sourceIds.has(id), 'Unresolved source ' + id);
      used.add(id);
    }
  }
  assert.deepEqual(used, sourceIds, 'Do not ship unused decorative citations');
});

test('guide preserves conditional scope rather than fabricated settings or layout outcomes', () => {
  const text = JSON.stringify(data);
  assert.doesNotMatch(text, /"(?:setpoint|recommended_rpm|recommended_temperature|temperature_delta|recommended_reverse_count|predicted_mi|measured_mi|guaranteed)"\s*:/i);
  assert.doesNotMatch(text, /(?:\+|±)\s*5\s*°?\s*C|180\s*°\s*C|200\s*ppm/i);
  assert.match(data.configuration_comparison_note.en, /actual vent discharge, MI and quality under comparable conditions/);
  assert.doesNotMatch(text, /Current ·|Usual ·|현재 ·|평소 ·|not supplied|reported pattern|reported rate reduction/);
  assert.match(data.not_universal.en, /Not every PHA process requires exactly two/);
  assert.match(data.not_universal.en, /neutral 90° kneading is not a reverse-conveying element/);
  assert.match(data.vents.find(vent => vent.id === 'atm').state.en, /unmelted feed by design/);
  assert.match(data.symptoms.find(symptom => symptom.id === 'rate_mi').meaning.en, /do not assume that reducing throughput also reduces vent discharge/);
  assert.match(data.temperature.trial.en, /hold RPM, feed, formulation, screen, vacuum and downstream cooling fixed/);
  assert.match(data.temperature.revert.en, /cannot restore molecular weight/);
});
