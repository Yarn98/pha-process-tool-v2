import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

// Isolated fixtures only: no saved browser profile, provider calls, or real records.
// A test-only bridge exposes the existing private local tool dispatcher. Its code
// is unchanged, and no chat/backend function is called by this suite.
const root = resolve(process.env.PHA_TEST_ROOT || '.');
const evidencePath = resolve(root, 'docs/verification/tab-connections.json');
const previousEvidence = await readFile(evidencePath, 'utf8').then(JSON.parse).catch(() => null);
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const customSource = await readFile(resolve(root, 'custom.js'));
const hookMarker = 'renderMarkdownLite: myaiRenderMarkdownLite,';
assert.ok(html.includes(hookMarker), 'Local My AI test hook marker was not found');
const servedHtml = html.replace(hookMarker, 'execLocalTool: myaiExecTool,\n        ' + hookMarker);
const gate = html.match(/const PASSWORD = ['"]([^'"]+)['"]/);
assert.ok(gate, 'Local access gate could not be resolved');
assert.match(html, /<script src="\.\/vendor\/chart-4\.4\.0\/chart\.umd\.min\.js\?v=\d+" defer><\/script>/, 'Chart.js must load from the vendored offline asset');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (relative(root, path).startsWith('..')) { res.writeHead(403).end(); return; }
    const data = path === resolve(root, 'index.html') ? servedHtml : path === resolve(root, 'custom.js') ? customSource : await readFile(path);
    res.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const cases = [];
const fixtureRows = [
  { ts: '2026-09-01T00:00:00Z', grade: 'CA1180P', proc: 'injection', params: { mold: '40', nozzle: '171' }, notes: 'fixture A' },
  { ts: '2026-09-02T00:00:00Z', grade: 'CA1180P', proc: 'injection', params: { mold: '42' }, notes: 'fixture B' }
];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aUioAAAAASUVORK5CYII=', 'base64');

async function runCase(id, description, seed, work) {
  const entry = { id, description, status: 'running', observations: {}, pageErrors: [], blockedExternalRequests: [] };
  cases.push(entry);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  const dialogs = [];
  page.on('pageerror', error => entry.pageErrors.push(String(error)));
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  await context.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/')) return route.continue();
    entry.blockedExternalRequests.push(new URL(url).origin);
    // Empty grade registry is an explicit fixture, never a live API read.
    if (url === 'https://tars-api.sorisem98.workers.dev/api/grades') return route.fulfill({ json: [] });
    return route.abort();
  });
  await page.addInitScript(storage => {
    if (!sessionStorage.getItem('tab-audit-seeded')) {
      for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, JSON.stringify(value));
      sessionStorage.setItem('tab-audit-seeded', '1');
    }
  }, { pha_hist: [], pha_photos: [], ...seed });
  try {
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.locator('#passwordGateInput').fill(gate[1]);
    await page.locator('#passwordGateSubmit').click();
    await page.waitForSelector('#passwordGate', { state: 'hidden' });
    assert.equal(await page.evaluate(() => Chart.version), '4.4.0');
    await work(page, entry.observations, dialogs);
    assert.deepEqual(entry.pageErrors, [], 'Unexpected page errors');
    entry.status = 'passed';
  } catch (error) {
    entry.status = 'failed';
    entry.error = String(error.message || error);
  } finally {
    entry.blockedExternalRequests = [...new Set(entry.blockedExternalRequests)];
    await context.close();
    console.log(`${entry.status.toUpperCase()} ${id}: ${entry.error || description}`);
  }
}

try {
  await runCase('process-reference-preserves-draft', 'Editing reference ranges preserves entered process values and notes', {}, async (page, observed) => {
    await page.selectOption('#grade', 'CA1180P');
    await page.selectOption('#process', 'injection');
    await page.fill('#f_nozzle', '171');
    await page.fill('#notes', 'unsaved process draft');
    await page.click('button[onclick="openRecoEditor()"]');
    await page.fill('#ov_mold_min', '41');
    await page.fill('#ov_mold_max', '43');
    await page.click('#modalSaveBtn');
    observed.nozzle = await page.inputValue('#f_nozzle');
    observed.notes = await page.inputValue('#notes');
    assert.equal(observed.nozzle, '171', 'Reference Save discarded entered nozzle temperature');
    assert.equal(observed.notes, 'unsaved process draft');
    await page.selectOption('#grade', 'CB0104A');
    assert.equal(await page.inputValue('#f_nozzle'), '', 'A different grade inherited the previous grade draft');
  });

  await runCase('history-literal-notes', 'Saved and exported history retains literal operator notes', {}, async (page, observed) => {
    const notes = 'trial, 2 mm "hold" <sample>';
    await page.selectOption('#process', 'extrusion');
    await page.fill('#notes', notes);
    await page.fill('#f_die', '161');
    await page.click('button[onclick="saveEntry()"]');
    await page.evaluate(() => switchTab('hist'));
    observed.saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pha_hist'))[0]);
    observed.displayedNotes = await page.locator('#histBody tr td').last().innerText();
    assert.equal(observed.saved.notes, notes);
    assert.equal(observed.displayedNotes, notes, 'History treated operator notes as HTML');
    await page.evaluate(() => switchTab('proc'));
    const downloadReady = page.waitForEvent('download');
    await page.click('button[onclick="exportHistory()"]');
    const download = await downloadReady;
    const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(exported[0].notes, notes);
  });

  await runCase('history-csv-quoted-fields', 'CSV import preserves commas, escaped quotes, and newlines in notes', {}, async (page, observed) => {
    const notes = 'trial, 2 mm "hold"\nsecond line';
    const csv = '\uFEFFts,grade,proc,notes,die\r\n2026-09-01T00:00:00Z,CA1180P,extrusion,"trial, 2 mm ""hold""\nsecond line",161\r\n';
    await page.locator('#importCSV').setInputFiles({ name: 'fixture.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('pha_hist') || '[]').length > 0);
    observed.rows = await page.evaluate(() => JSON.parse(localStorage.getItem('pha_hist')));
    assert.equal(observed.rows.length, 1);
    assert.equal(observed.rows[0].notes, notes, 'CSV quoted notes were split into columns');
    assert.equal(observed.rows[0].params.die, '161');
  });

  await runCase('history-invalid-import-atomic', 'Malformed history rows cannot overwrite or poison usable saved history', { pha_hist: [fixtureRows[0]] }, async (page, observed, dialogs) => {
    const before = await page.evaluate(() => localStorage.getItem('pha_hist'));
    const count = dialogs.length;
    const notified = page.waitForEvent('dialog');
    await page.locator('#importJSON').setInputFiles({ name: 'invalid-record.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify([fixtureRows[1], { ts: '2026-09-03T00:00:00Z', grade: 'CA1180P', proc: 'injection' }])) });
    await notified;
    observed.storagePreserved = (await page.evaluate(() => localStorage.getItem('pha_hist'))) === before;
    observed.dialogs = dialogs.slice(count);
    observed.storedRows = await page.evaluate(() => JSON.parse(localStorage.getItem('pha_hist')));
    assert.equal(observed.storagePreserved, true, 'Invalid row was persisted before validation');
    await page.reload({ waitUntil: 'networkidle' });
    assert.ok(await page.evaluate(() => !!window.__phaMyAITestHooks), 'History import broke next app startup');
  });

  await runCase('history-valid-import-metadata', 'Valid imported records retain optional metadata, custom identifiers, zero values and existing rows', { pha_hist: [fixtureRows[0]] }, async (page, observed) => {
    const row = { ts: 0, grade: 'LOCAL_FIXTURE', proc: 'legacy_process', params: { measured: 0, blank: '', unset: null }, notes: null, metadata: { batch: 'audit', tags: ['original'] } };
    const notified = page.waitForEvent('dialog');
    await page.locator('#importJSON').setInputFiles({ name: 'valid-record.json', mimeType: 'application/json', buffer: Buffer.from('\uFEFF' + JSON.stringify([row])) });
    await notified;
    observed.rows = await page.evaluate(() => JSON.parse(localStorage.getItem('pha_hist')));
    assert.deepEqual(observed.rows, [fixtureRows[0], row]);
  });

  await runCase('history-existing-malformed-preserved', 'Already stored malformed rows do not break navigation or get silently removed', { pha_hist: [fixtureRows[0], null, { ts: '2026-09-03', grade: 'LOCAL', proc: 'injection', params: null }] }, async (page, observed) => {
    const original = await page.evaluate(() => localStorage.getItem('pha_hist'));
    await page.click('.tabs [data-tab="hist"]');
    observed.rows = await page.locator('#histBody tr').count();
    await page.click('.tabs [data-tab="ana"]');
    await page.locator('[data-lang-choice="en"]').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('pha_hist')), original);
    assert.equal(observed.rows, 3);
    assert.ok(await page.evaluate(() => !!window.__phaMyAITestHooks));
  });

  await runCase('history-malformed-container-recoverable', 'A malformed stored history container remains recoverable through export', { pha_hist: { recovery_fixture: true } }, async (page, observed) => {
    const original = await page.evaluate(() => localStorage.getItem('pha_hist'));
    await page.click('.tabs [data-tab="ana"]');
    observed.message = await page.locator('#anaText').innerText();
    assert.match(observed.message, /보존|preserved/);
    await page.click('.tabs [data-tab="proc"]');
    const downloadReady = page.waitForEvent('download');
    await page.click('button[onclick="exportHistory()"]');
    const download = await downloadReady;
    assert.equal(await readFile(await download.path(), 'utf8'), original);
    assert.equal(await page.evaluate(() => localStorage.getItem('pha_hist')), original);
  });

  await runCase('analysis-single-observation-filter', 'Selecting a one-record parameter leaves the selector usable and does not show an old curve', { pha_hist: fixtureRows }, async (page, observed) => {
    await page.evaluate(() => switchTab('ana'));
    observed.initial = await page.evaluate(() => ({ parameter: $('anaParamSelect').value, values: Chart.getChart($('anaChart'))?.data.datasets[0].data }));
    assert.deepEqual(observed.initial.values, [40, 42]);
    const option = page.locator('#anaParamSelect option[value="nozzle"]');
    if (await option.count() && !(await option.isDisabled())) {
      await page.selectOption('#anaParamSelect', 'nozzle');
      observed.selectorVisible = await page.locator('#anaParamSelect').isVisible();
      observed.values = await page.evaluate(() => Chart.getChart($('anaChart'))?.data.datasets[0].data || []);
      assert.equal(observed.selectorVisible, true, 'Single-record selection hid the selector itself');
      assert.notDeepEqual(observed.values, [40, 42], 'Previous parameter curve remains after selection');
      await page.selectOption('#anaParamSelect', 'mold');
      assert.equal(await page.locator('#anaChart').isVisible(), true);
    } else observed.sparseParameterExcluded = true;
  });

  await runCase('analysis-language-current', 'Changing language refreshes the active analysis summary and axes', { pha_hist: fixtureRows }, async (page, observed) => {
    await page.evaluate(() => switchTab('ana'));
    await page.locator('[data-lang-choice="en"]').click();
    observed = Object.assign(observed, await page.evaluate(() => ({ summary: $('anaText').textContent, xTitle: Chart.getChart($('anaChart'))?.options.scales.x.title.text, parameter: $('anaParamSelect').value })));
    assert.match(observed.summary, /Last:/, 'Active analysis summary stayed in the previous language');
    assert.equal(observed.xTitle, 'Time', 'Active chart axis stayed in the previous language');
    assert.equal(observed.parameter, 'mold');
  });

  await runCase('analysis-zero-is-data-and-empty-clears', 'Measured zero remains data; empty and nonnumeric fields are excluded; empty history clears the previous chart', { pha_hist: fixtureRows.map(row => ({ ...row, params: { measured: 0, blank: '', invalid: 'unknown' } })) }, async (page, observed) => {
    await page.click('.tabs [data-tab="ana"]');
    observed = Object.assign(observed, await page.evaluate(() => ({ values: Chart.getChart($('anaChart')).data.datasets[0].data, options: Array.from($('anaParamSelect').options, option => option.value) })));
    assert.deepEqual(observed.values, [0, 0]);
    assert.deepEqual(observed.options, ['measured']);
    await page.evaluate(() => { localStorage.setItem('pha_hist', '[]'); analyze(); });
    assert.equal(await page.evaluate(() => !!Chart.getChart($('anaChart'))), false);
    assert.equal(await page.locator('#anaChartContainer').isVisible(), false);
  });

  await runCase('materials-import-selectable', 'Imported local material grades are selectable without inventing manufacturer references', {}, async (page, observed) => {
    await page.evaluate(() => { switchTab('props'); importMatJSON(); });
    await page.locator('#mat_file').setInputFiles({ name: 'material-fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ AUDIT_NEW_GRADE: { density_g_cm3: 1.29, tensile_MPa: 33 } })) });
    await page.waitForFunction(() => !!getMatDB().AUDIT_NEW_GRADE);
    observed.stored = await page.evaluate(() => getMatDB().AUDIT_NEW_GRADE);
    observed.selectable = await page.locator('#mat_grade option[value="AUDIT_NEW_GRADE"]').count();
    assert.equal(observed.selectable, 1, 'Imported material was stored but cannot be selected');
    await page.selectOption('#mat_grade', 'AUDIT_NEW_GRADE');
    assert.match(await page.locator('#mat_tbody').innerText(), /1\.29/);
  });

  await runCase('materials-clear-current-editor', 'Clear current grade updates the open editor so Save does not resurrect cleared values', { mat_db: { CA1180P: { density_g_cm3: 1.31, tensile_MPa: 54 } } }, async (page, observed) => {
    await page.evaluate(() => switchTab('props'));
    await page.selectOption('#mat_grade', 'CA1180P');
    await page.click('button[onclick="editMat()"]');
    await page.click('#modalResetCurrentBtn');
    observed.editorDensityAfterReset = await page.inputValue('#mat_density_g_cm3');
    observed.dbAfterReset = await page.evaluate(() => getMatDB().CA1180P);
    await page.click('#modalSaveBtn');
    observed.dbAfterSave = await page.evaluate(() => getMatDB().CA1180P);
    assert.deepEqual(observed.dbAfterSave, {}, 'Save restored values that Clear current grade had removed');
    assert.equal(observed.editorDensityAfterReset, '');
  });

  await runCase('main-calculators-invalid-replaces-result', 'Main calculators reject invalid inputs and local My AI returns the same valid results', {}, async (page, observed) => {
    await page.evaluate(() => switchTab('calc'));
    for (const [id, value] of Object.entries({ kpi_rho: 1100, kpi_holdVol: 2.5, kpi_rate: 15, cool_t: 2, cool_alpha: 0.12, cool_Tm: 170, cool_Tmold: 30, cool_Te: 60, bf_Q: 20, bf_rho: 950, bf_D: 80, bf_BUR: 2.5, bf_v: 30, bf_gap: 1 })) await page.fill('#' + id, String(value));
    await page.click('button[onclick="calcResidence()"]');
    await page.click('button[onclick="calcCooling()"]');
    await page.click('button[onclick="calcBlownFilm()"]');
    observed.valid = await page.evaluate(() => ({ residence: $('kpi_res_out').textContent, cooling: $('cool_out').textContent, film: $('bf_out').textContent, local: __phaMyAITestHooks.calcResidence({}) }));
    assert.match(observed.valid.residence, /11\.00/);
    assert.equal(observed.valid.local.results.residence_min, 11);
    await page.fill('#kpi_rate', '0'); await page.click('button[onclick="calcResidence()"]');
    await page.fill('#cool_Te', '20'); await page.click('button[onclick="calcCooling()"]');
    await page.fill('#bf_v', '0'); await page.click('button[onclick="calcBlownFilm()"]');
    observed.invalid = await page.evaluate(() => ({ residence: $('kpi_res_out').textContent, cooling: $('cool_out').textContent, film: $('bf_out').textContent }));
    for (const key of Object.keys(observed.invalid)) assert.notEqual(observed.invalid[key], observed.valid[key], `${key}: old valid output remained after invalid calculation`);
    assert.doesNotMatch(JSON.stringify(observed.invalid), /NaN|Infinity/);
  });

  await runCase('photos-upload-preview-delete-persist', 'Photo gallery uploads, previews, deletes and reloads isolated images', {}, async (page, observed) => {
    await page.evaluate(() => switchTab('photos'));
    await page.locator('#photoUpload').setInputFiles([{ name: 'fixture-a.png', mimeType: 'image/png', buffer: png }, { name: 'fixture-b.png', mimeType: 'image/png', buffer: png }]);
    await page.waitForFunction(() => document.querySelectorAll('#photoGrid .photo').length === 2);
    await page.locator('#photoGrid img').first().click();
    assert.equal(await page.locator('#lightbox').isVisible(), true);
    await page.locator('.lightbox-close').click();
    await page.locator('#photoGrid .photo button').first().click();
    observed.remaining = await page.locator('#photoGrid .photo').count();
    assert.equal(observed.remaining, 1);
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => switchTab('photos'));
    assert.equal(await page.locator('#photoGrid .photo').count(), 1);
    observed.persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('pha_photos')).map(photo => photo.name));
    assert.equal(observed.persisted.length, 1);
  });

  await runCase('myai-local-tab-context-and-control', 'My AI local tools read current inputs, preserve the work tab, and honor control permission', { pha_hist: [fixtureRows[0]] }, async (page, observed) => {
    await page.click('.tabs [data-tab="calc"]');
    await page.fill('#kpi_rate', '17');
    await page.click('.tabs [data-tab="myai"]');
    observed.initial = await page.evaluate(() => __phaMyAITestHooks.execLocalTool('get_current_tab_context', {}));
    observed.blocked = await page.evaluate(() => __phaMyAITestHooks.execLocalTool('set_tab_inputs', { tab: 'calc', values: { kpi_rate: 20 } }));
    assert.ok(observed.blocked.error);
    await page.check('#myaiAllowControl');
    observed.changed = await page.evaluate(() => __phaMyAITestHooks.execLocalTool('set_tab_inputs', { tab: 'calc', values: { kpi_rate: 20 } }));
    assert.equal(observed.changed.changed.find(field => field.id === 'kpi_rate').after, '20');
    assert.equal(await page.inputValue('#kpi_rate'), '20');
    observed.history = await page.evaluate(() => __phaMyAITestHooks.execLocalTool('get_history', { limit: 1 }));
    assert.equal(observed.history.count, 1);
    assert.equal(observed.history.rows[0].notes, fixtureRows[0].notes);
    assert.equal(observed.initial.tab, 'calc', 'First My AI visit lost the previous work tab');
    assert.equal(observed.initial['입력'].find(input => input.id === 'kpi_rate').value, '17');
  });

  await runCase('myai-first-visit-mobile-context', 'First mobile My AI visit remembers the calculator tab from actual navigation buttons', {}, async (page, observed) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const calcButton = page.locator('.mtb-item[data-tab="calc"]');
    if (await calcButton.isVisible()) await calcButton.click();
    else { await page.click('#moreBtn'); await page.click('#morePopover [data-tab="calc"]'); }
    await page.fill('#kpi_rate', '19');
    await page.click('#moreBtn');
    await page.click('#morePopover [data-tab="myai"]');
    observed.context = await page.evaluate(() => __phaMyAITestHooks.execLocalTool('get_current_tab_context', {}));
    assert.equal(observed.context.tab, 'calc');
    assert.equal(observed.context['입력'].find(input => input.id === 'kpi_rate').value, '19');
  });
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
  const report = {
    reviewed: new Date().toISOString(), scope: ['proc', 'hist', 'ana', 'calc', 'props', 'photos', 'myai-local'],
    excluded: ['flash', 'equipment/3D', 'single-file bundle', 'external AI/API behavior'],
    isolation: 'Fresh browser contexts and synthetic localStorage/files. All browser external requests blocked or fulfilled with fixtures. Vendored Chart.js is served locally; no external network, provider request or credential used.',
    testOnlyInstrumentation: 'Expose unchanged myaiExecTool in the existing localhost-only test hook; no production file altered.',
    chartVersion: '4.4.0', sourceSha256: { 'index.html': createHash('sha256').update(html).digest('hex'), 'custom.js': createHash('sha256').update(customSource).digest('hex') },
    baseline: previousEvidence?.baseline || (previousEvidence?.failed ? { reviewed: previousEvidence.reviewed, sourceSha256: previousEvidence.sourceSha256, failed: previousEvidence.failed, failures: previousEvidence.cases.filter(item => item.status === 'failed') } : null),
    passed: cases.filter(item => item.status === 'passed').length, failed: cases.filter(item => item.status === 'failed').length, cases
  };
  await mkdir(resolve(root, 'docs/verification'), { recursive: true });
  await writeFile(evidencePath, JSON.stringify(report, null, 2) + '\n');
  console.log(`Tab connections: ${report.passed} passed, ${report.failed} failed. Evidence: docs/verification/tab-connections.json`);
  if (report.failed) process.exitCode = 1;
}
