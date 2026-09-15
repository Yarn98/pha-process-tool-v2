import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { copyFile, readFile, writeFile, mkdir, mkdtemp, rm, readdir } from 'node:fs/promises';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, relative, extname, join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { chromium } from 'playwright';

const root = resolve('.'), output = resolve('output/playwright/single-file');
await mkdir(output, { recursive: true });
const html = await readFile('index.html', 'utf8'), gate = html.match(/const PASSWORD = ['"]([^'"]+)['"]/);
assert.ok(gate, 'Existing local gate is available only to this isolated fixture');
const manifest = JSON.parse(await readFile('single-file/manifest.json', 'utf8'));
const artifact = Buffer.from((await readFile(manifest.artifact, 'utf8')).replace(/\r\n?/g, '\n'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(artifact), manifest.sha256);
assert.ok(artifact.length < 100000000, 'Portable HTML stays below the Git blob limit');
assert.ok(manifest.sources.every(file => !/\.(?:blend\d?|pdf)$/i.test(file.path) && !/^(?:art|output|docs)\//.test(file.path)));

// Run the real packer twice with in-memory LF / CRLF checkouts. No user file is rewritten.
const require = createRequire(import.meta.url), inputSnapshot = new Map();
for (const file of manifest.sources) inputSnapshot.set(resolve(file.path), await readFile(file.path));
const generator = (await readFile('scripts/build-single-file.cjs', 'utf8')).replace(/\r\n?/g, '\n');
function packWithEOL(eol) {
  const written = {}, processFixture = { argv: [], exitCode: 0 };
  const virtualFS = { ...fs, mkdirSync() {}, readFileSync(file) {
    const bytes = inputSnapshot.get(resolve(file)) || fs.readFileSync(file);
    return /\.(?:html|css|[cm]?js|json|svg|txt|md)$/i.test(file) || basename(file) === 'LICENSE'
      ? Buffer.from(bytes.toString('utf8').replace(/\r\n?/g, '\n').replace(/\n/g, eol)) : bytes;
  }, writeFileSync(file, bytes) { written[basename(file)] = hash(bytes); } };
  vm.runInNewContext(generator, { Buffer, __dirname: resolve('scripts'), process: processFixture, console: { log() {}, error(message, detail) { throw new Error(message + ': ' + detail); } }, require: name => name === 'node:fs' ? virtualFS : require(name) }, { timeout: 30000 });
  assert.equal(processFixture.exitCode, 0);
  return written;
}
assert.deepEqual(packWithEOL('\n'), packWithEOL('\r\n'), 'LF and CRLF inputs produce identical HTML and manifest hashes');

const temporary = await mkdtemp(join(tmpdir(), 'pha-single-file-'));
const movedFile = join(temporary, '이동한 PHA 오프라인 renamed.html');
await copyFile(resolve(manifest.artifact), movedFile);
assert.deepEqual(await readdir(temporary), ['이동한 PHA 오프라인 renamed.html']);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const file = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (relative(root, file).startsWith('..')) return response.writeHead(403).end();
    response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const checks = [], errors = [], unexpectedRequests = [], screenshots = [];
const record = message => { checks.push(message); console.log('PASS', message); };
record('Canonical LF and CRLF checkouts generate byte-identical HTML and manifest without changing source files');

async function fixture({ standalone = false, webgl = true } = {}) {
  const context = await browser.newContext({ viewport: { width: 1360, height: 980 }, offline: standalone, serviceWorkers: 'block', acceptDownloads: true });
  await context.addInitScript(({ standalone, webgl }) => {
    const fetch = window.fetch.bind(window); window.__singleRemoteAttempts = [];
    window.fetch = function (input, options) {
      const url = typeof input === 'string' ? input : input.url;
      if (/^https?:/i.test(url) && !/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\//.test(url)) {
        window.__singleRemoteAttempts.push(url);
        return standalone ? Promise.reject(new TypeError('Offline test fixture')) : Promise.resolve(new Response('[]', { headers: { 'content-type': 'application/json' } }));
      }
      return fetch(input, options);
    };
    if (!webgl) { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /webgl/i.test(type) ? null : get.call(this, type, ...args); }; }
  }, { standalone, webgl });
  await context.route(/^https?:\/\//, route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/')) return route.continue();
    if (!/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(url)) unexpectedRequests.push(url);
    return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (standalone && request.url().startsWith('file:') && request.url() !== pathToFileURL(movedFile).href) unexpectedRequests.push(request.url()); });
  await page.goto(standalone ? pathToFileURL(movedFile).href : origin, { waitUntil: 'load' });
  await unlock(page); return { page, context };
}
async function unlock(page) { if (await page.locator('#passwordGate').isVisible()) { await page.fill('#passwordGateInput', gate[1]); await page.click('#passwordGateSubmit'); } await page.locator('#passwordGate').waitFor({ state: 'hidden' }); }
async function locale(page, language) { await page.locator(`[data-lang-choice=${language}]`).click(); }
async function range(page, selector, value) { await page.locator(selector).evaluate((input, value) => { input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true })); }, value); }
async function screenshot(page, name) {
  const dialog = page.locator('dialog[open]').first();
  if (await dialog.count()) await dialog.evaluate(element => { element.scrollTop = 0; });
  const file = resolve(output, name + '.png'); await page.screenshot({ path: file }); screenshots.push(relative(root, file));
}
async function contentContract(page) {
  return page.evaluate(() => ({ language: document.documentElement.lang,
    tabs: [...document.querySelectorAll('button.tab[data-tab]')].map(button => [button.dataset.tab, button.textContent.trim()]),
    grades: [...document.querySelector('#grade').options].map(option => [option.value, option.textContent]),
    processes: [...document.querySelector('#process').options].map(option => [option.value, option.textContent]),
    knowledge: window.PHA_TROUBLESHOOTING_DATA.map(item => [item.id, item.review_version]),
    visualCount: window.PHATroubleVisualData.entries.length,
    flashTabs: [...document.querySelectorAll('#flash [role=tab]')].map(button => button.textContent.trim()), chartVersion: Chart.version }));
}
async function calculator(page) {
  await page.evaluate(() => { switchTab('flash'); showFlashTab(2); });
  await page.fill('#flash-p-avg', '980.665'); await page.fill('#flash-a-proj', '1');
  await page.locator('[onclick="calculateFlashClampTonnage()"]:visible').click();
  const value = await page.locator('#flash-clamp-value').innerText(); assert.equal(value, '1.0 tf'); return value;
}
async function flashModel(page) {
  await page.evaluate(() => { switchTab('flash'); showFlashTab(0); });
  if (!(await page.locator('#fg-model-details').evaluate(details => details.open))) await page.locator('#fg-model-details>summary').click();
  await page.waitForFunction(() => PHAFlashGuide.snapshot().model || PHAFlashGuide.snapshot().failed); return page.evaluate(() => PHAFlashGuide.snapshot());
}
async function ventGuide(page) { await page.evaluate(() => switchTab('ts')); await page.locator('[data-ts-open="pha-kb-16"]').first().click(); await page.waitForFunction(() => PHATroubleVisuals.getState()?.tab === 'guide'); }
async function loadVentModel(page) { await page.locator('#tsv-panel-guide [data-ts-vent-model]').first().click(); await page.waitForFunction(() => ['ready', 'fallback'].includes(PHATroubleVisuals.getState()?.modelState)); return page.evaluate(() => PHATroubleVisuals.getState()); }

try {
  const baseline = await fixture(), contracts = {};
  for (const language of ['ko', 'en']) { await locale(baseline.page, language); contracts[language] = await contentContract(baseline.page); }
  const baselineCalculation = await calculator(baseline.page); await baseline.context.close();
  // File edition tests continue with the HTTP server stopped as well as browser networking disabled.
  await new Promise(done => server.close(done));
  const { page, context } = await fixture({ standalone: true });
  assert.equal(await page.evaluate(() => location.protocol), 'file:');
  assert.equal(await page.evaluate(() => PHASingleFile.sourceHash), manifest.source_sha256);
  assert.equal(await page.locator('script[src],link[rel=stylesheet],link[rel=manifest]').count(), 0);
  assert.equal(artifact.includes(Buffer.from("serviceWorker.register('sw.js')")), false);
  for (const language of ['ko', 'en']) { await locale(page, language); assert.deepEqual(await contentContract(page), contracts[language]); }
  assert.equal(await calculator(page), baselineCalculation);
  record('Moved and renamed file:// HTML preserves source tabs, KO/EN, grades, knowledge and calculation results with the server stopped');

  await page.evaluate(() => switchTab('proc')); await page.selectOption('#process', 'injection');
  const injection = page.locator('#injectionMotion'); await injection.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#injectionMotion')?.dataset.motionState === 'ready');
  await injection.locator('[data-motion=manual]').click(); const injectionBefore = await injection.locator('canvas').screenshot();
  await range(page, '#injectionMotion [data-axis=rotation]', 91); await range(page, '#injectionMotion [data-axis=screw]', 0);
  await page.waitForFunction(() => Math.abs(PHAInjectionMotion.getState().manual.screw) < .001 && Math.abs(PHAInjectionMotion.getState().manual.rotation - 91) < .001);
  assert.notEqual(hash(await injection.locator('canvas').screenshot()), hash(injectionBefore)); await screenshot(page, 'injection-file');
  await page.evaluate(() => switchTab('compounding')); const compounding = page.locator('.tabpage.active [data-equipment-model=compounding]');
  await compounding.scrollIntoViewIfNeeded(); await page.waitForFunction(() => document.querySelector('.tabpage.active [data-equipment-model=compounding]')?.dataset.motionState === 'ready');
  await compounding.locator('[data-eq=manual]').click(); const compoundingBefore = await compounding.locator('canvas').screenshot();
  await range(page, '.tabpage.active [data-eq-axis=screw]', 91); await page.waitForFunction(() => Math.abs(PHAEquipmentMotion.getState().actual.screw - 91) < .001);
  assert.notEqual(hash(await compounding.locator('canvas').screenshot()), hash(compoundingBefore)); await screenshot(page, 'compounding-file');
  record('Embedded injection and compounding controls alter actual rendered geometry and manual-axis state');

  let flash = await flashModel(page); assert.ok(flash.model && !flash.failed);
  await page.locator('#fg-image-open img').evaluate(image => image.decode()); await range(page, '#fg-opening', 95);
  const opened = await page.evaluate(() => PHAFlashGuide.snapshot());
  assert.ok(opened.model.nodes.find(node => node.role === 'upper_mold').position[1] > flash.model.nodes.find(node => node.role === 'upper_mold').position[1] + .5);
  for (const location of ['parting', 'vent', 'ejector']) { await page.locator(`[data-fg-choice=location][data-value=${location}]`).click(); flash = await page.evaluate(() => PHAFlashGuide.snapshot()); assert.deepEqual(flash.model.visibleGroups, [location]); }
  await page.click('#fg-image-open'); await page.locator('dialog.fg-image-dialog img').evaluate(image => image.decode()); await page.keyboard.press('Escape'); await page.locator('dialog.fg-image-dialog').waitFor({ state: 'detached' });
  await page.locator('#fg-model-details').scrollIntoViewIfNeeded(); await screenshot(page, 'flash-file');
  record('Flash images, enlargement, three defect groups and mold-opening geometry remain interactive offline');

  await locale(page, 'ko'); await ventGuide(page);
  for (const symptom of ['particles', 'rpm_mi', 'rate_mi', 'pressure']) { await page.locator(`#tsv-panel-guide [data-ts-vent-symptom=${symptom}]`).click(); assert.equal(await page.evaluate(() => PHATroubleVisuals.getState().ventSymptom), symptom); assert.ok((await page.locator('#ventSymptomDetail').innerText()).length > 60); }
  for (const config of ['without_reverse', 'upstream_reverse']) { await page.locator(`#tsv-panel-guide [data-ts-vent-config=${config}]`).click(); await page.locator('#tsv-panel-guide .vent-layout img').evaluate(image => image.decode()); assert.equal(await page.evaluate(() => PHATroubleVisuals.getState().ventConfig), config); }
  let vent = await loadVentModel(page); assert.equal(vent.modelState, 'ready'); assert.deepEqual(vent.visibleGroups, ['upstream_reverse_full']);
  await range(page, '#tsModelPhase', 25); const before = await page.evaluate(() => PHATroubleVisuals.getState()); await range(page, '#tsModelPhase', 70); vent = await page.evaluate(() => PHATroubleVisuals.getState());
  assert.notDeepEqual(before.nodes, vent.nodes); assert.ok(vent.nodes.some(node => node.flow === 'atm_gas'));
  await page.locator('#tsv-panel-model [data-ts-vent-config=without_reverse]').click(); await page.waitForFunction(() => PHATroubleVisuals.getState().modelState === 'ready');
  assert.deepEqual(await page.evaluate(() => PHATroubleVisuals.getState().visibleGroups), ['without_reverse_full']); await screenshot(page, 'vent-file');
  await page.keyboard.press('Escape'); await page.waitForFunction(() => PHATroubleVisuals.getState() === null); await locale(page, 'en'); await ventGuide(page);
  assert.match(await page.locator('#tsv-panel-guide').innerText(), /vacuum/i); await page.keyboard.press('Escape');
  record('Vent guide retains both screw layouts, four symptom cards, bilingual explanations and moving screw/flow geometry');

  await page.evaluate(() => { switchTab('flash'); showFlashTab(6); }); await page.locator('#flash-tab-6 [onclick="addProcessLogEntry()"]').click();
  const row = page.locator('#processLogBody tr').first(); await row.locator('[onchange*="injectionPressure"]').fill('777'); await row.locator('textarea').fill('portable record fixture'); await row.locator('textarea').press('Tab');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('processLog'))[0].note), 'portable record fixture');
  await page.evaluate(() => localStorage.setItem('single-file-retention-fixture', 'retain')); await page.reload({ waitUntil: 'load' }); await unlock(page);
  await page.evaluate(() => { switchTab('flash'); showFlashTab(6); }); assert.equal(await page.locator('#processLogBody textarea').first().inputValue(), 'portable record fixture');
  assert.equal(await page.evaluate(() => processChart.data.labels.length), 1); assert.equal(await page.evaluate(() => localStorage.getItem('single-file-retention-fixture')), 'retain');
  const downloadPromise = page.waitForEvent('download'); await page.locator('#flash-tab-6 .btn-export-log').click(); const download = await downloadPromise;
  assert.match(await readFile(await download.path(), 'utf8'), /portable record fixture/); await locale(page, 'ko'); assert.equal(await page.locator('#processLogBody textarea').first().inputValue(), 'portable record fixture');
  record('Real log editing, reload, language changes, Chart.js graph and CSV export preserve isolated records');

  for (const width of [390, 320]) { await page.setViewportSize({ width, height: 900 }); for (const language of ['ko', 'en']) {
    await locale(page, language); await page.evaluate(() => { switchTab('flash'); showFlashTab(0); }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
    await ventGuide(page); assert.equal(await page.locator('#tsVisualDialog').evaluate(dialog => dialog.scrollWidth > dialog.clientWidth + 2), false);
    if (width === 320 && language === 'ko') await screenshot(page, 'vent-mobile-file'); await page.keyboard.press('Escape');
  } }
  record('System-font portable layout fits 320/390 px Flash and vent panels in Korean and English');

  const embedded = await page.evaluate(async () => {
    const result = [];
    for (const key of PHASingleFile.assetKeys.filter(key => !key.endsWith('.js'))) {
      const url = PHASingleFile.assetURL(key), response = await fetch(url), bytes = await response.arrayBuffer();
      if (/\.(png|webp|jpe?g|svg|ico)$/.test(key)) { const image = new Image(); image.src = url; await image.decode(); }
      if (key.endsWith('.glb') && new DataView(bytes).getUint32(0, true) !== 0x46546c67) throw new Error('Invalid GLB: ' + key);
      const sha = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join(''); result.push({ key, sha, bytes: bytes.byteLength });
    }
    return result;
  });
  for (const item of embedded) { const source = manifest.sources.find(source => source.path === item.key); assert.equal(item.sha, source.sha256, item.key); assert.equal(item.bytes, source.bytes); }
  assert.equal(embedded.filter(item => item.key.endsWith('.glb')).length, 26);
  assert.ok((await page.evaluate(() => window.__singleRemoteAttempts)).every(url => url === 'https://tars-api.sorisem98.workers.dev/api/grades'));
  record('Every embedded image decodes; 26 GLBs, JSON and licenses match canonical source hashes without external asset requests');
  await context.close();

  const fallback = await fixture({ standalone: true, webgl: false });
  assert.equal(await fallback.page.evaluate(() => localStorage.getItem('single-file-retention-fixture')), null);
  assert.equal((await flashModel(fallback.page)).failed, true); await fallback.page.locator('#fg-poster').evaluate(image => image.decode());
  await ventGuide(fallback.page); assert.equal((await loadVentModel(fallback.page)).modelState, 'fallback'); await fallback.page.locator('#tsModelPoster').evaluate(image => image.decode());
  await fallback.page.locator('#tsv-tab-guide').click(); assert.ok(await fallback.page.locator('#tsv-panel-guide [data-ts-vent-config]').count()); await screenshot(fallback.page, 'webgl-fallback-file'); await fallback.context.close();
  record('Unavailable WebGL keeps Flash/vent posters and guidance; new profiles contain no saved fixture records');
  assert.deepEqual(errors, []); assert.deepEqual(unexpectedRequests, []); record('No uncaught browser errors, sibling-file requests or external API calls');
  const report = JSON.stringify({ status: 'passed', artifact: manifest.artifact, bytes: artifact.length, sha256: manifest.sha256, sourceHash: manifest.source_sha256, hashBasis: manifest.hash_basis, checks, screenshots, errors, unexpectedRequests }, null, 2) + '\n';
  await writeFile(resolve(output, 'results.json'), report);
  await mkdir(resolve('docs/verification'), { recursive: true });
  await writeFile(resolve('docs/verification/single-file.json'), report);
} finally {
  await browser.close(); if (server.listening) await new Promise(done => server.close(done));
  const tempRelative = relative(resolve(tmpdir()), resolve(temporary)); assert.ok(tempRelative && !tempRelative.startsWith('..') && tempRelative.startsWith('pha-single-file-'));
  await rm(temporary, { recursive: true, force: true });
}
console.log('SINGLE_FILE_UI_OK', checks.length);
