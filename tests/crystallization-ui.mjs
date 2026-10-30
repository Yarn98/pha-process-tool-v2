import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

// Crystallization-history panel in the Process tab: Korea straw example with test-only k, ρ, h,
// KO/EN switching, mobile stacking and no change to the existing Process tab fields.
const root = resolve(process.env.PHA_TEST_ROOT || '.');
const shots = resolve(root, 'output/playwright/crystallization');
await mkdir(shots, { recursive: true });
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const gate = html.match(/const PASSWORD = ['"]([^'"]+)['"]/);
assert.ok(gate, 'Local access gate could not be resolved');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (relative(root, path).startsWith('..')) { res.writeHead(403).end(); return; }
    res.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
let failures = 0;
const record = (ok, text) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${text}`); if (!ok) failures++; };

async function open(viewport) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.locator('#passwordGateInput').fill(gate[1]);
  await page.locator('#passwordGateSubmit').click();
  await page.waitForSelector('#passwordGate', { state: 'hidden' });
  return { context, page, errors };
}
async function fill(page, values) {
  for (const [id, v] of Object.entries(values)) await page.locator('#xtal_' + id).fill(String(v));
}

try {
  const { context, page, errors } = await open({ width: 1360, height: 1000 });
  const fieldsBefore = await page.$$eval('#dynamicFields input, #dynamicFields select', els => els.map(e => e.id));
  assert.ok(await page.locator('#proc #xtalPanel').count() === 1, 'panel is inside the Process tab');
  await page.locator('#xtalPanel summary').first().click();
  await page.locator('#xtal_process').selectOption('straw');
  // Start conditions are prefilled and badged; k, ρ, h are empty.
  assert.equal(await page.locator('#xtal_b1_T_C').inputValue(), '35');
  assert.equal(await page.locator('#xtal_b2_T_C').inputValue(), '75');
  assert.equal(await page.locator('#xtal_k_W_mK').inputValue(), '');
  await page.locator('[data-xtal-act="run"]').click();
  let text = await page.locator('#xtalResult').innerText();
  record(/W03/.test(text) || /라인 속도|생산량/.test(text), 'missing k, ρ, h or speed stops the calculation and asks for input');
  await fill(page, { k_W_mK: 0.2, rho_kg_m3: 1250, dieExit_C: 180, wall_mm: 0.2, output_ea_min: 400, cutLength_m: 0.26, targetOutput_ea_min: 600,
    b1_L_m: 1.0, b1_T_C: 22, b1_h: 800, b2_L_m: 3.3, b2_T_C: 60, b2_h: 800 });
  await page.locator('[data-xtal-act="run"]').click();
  await page.waitForSelector('#xtalResult svg.xtal-chart');
  text = await page.locator('#xtalResult').innerText();
  record(/104 m\/min/.test(text) && /0\.577 s/.test(text) && /1\.904 s/.test(text), 'Korea line: 104 m/min, 0.577 s and 1.904 s residence');
  record(/3\.3 → 4\.95 m/.test(text) && /5–5\.5 m/.test(text), 'same-residence lengthening 3.3 → 4.95 m shown against the 5.0–5.5 m plan');
  record(/W13/.test(text) && /W09/.test(text) && !/W02/.test(text) && /60 °C 실측 t½ 1점 보정 · lot 3ACF240209 25\.0 s/.test(text), 'S1000P shows the measured 60 °C t½ banner with W13 and W09');
  record(/상온 2차 결정화 진행/.test(text), 'secondary-crystallization badge with aging checks');
  record(await page.locator('#xtalResult .xtal-chart rect').count() >= 3, 'chart shades the 30–40, 60–70 and 80–90 °C bands');
  await page.locator('#xtalPanel').screenshot({ path: resolve(shots, 'straw-desktop.png') });

  // Grade branch: A1000P disables the module.
  await page.locator('#xtal_grade').selectOption('A1000P');
  await page.locator('[data-xtal-act="run"]').click();
  text = await page.locator('#xtalResult').innerText();
  record(/W10/.test(text) && !/구간 체류/.test(text), 'A1000P disables the crystallization judgement (W10)');
  await page.locator('#xtal_grade').selectOption('CA1180P');
  await page.locator('[data-xtal-act="run"]').click();
  text = await page.locator('#xtalResult').innerText();
  record(/W14/.test(text) && !/W02/.test(text) && /PLA 매트릭스: 대상 외 · PLA 80 \/ A1000P 20, Talc 10 phr/.test(text) && !/구간 체류/.test(text), 'CA1180P is a PLA-matrix compound outside the judgement (W14)');
  await page.locator('#xtal_grade').selectOption('CB0400A');
  await page.locator('[data-xtal-act="run"]').click();
  text = await page.locator('#xtalResult').innerText();
  record(/W15/.test(text) && !/W02/.test(text) && /결정상 판정 · 유사 배합 대리값 \(판단됨\) · CB0190PN25 26\.9 s @ 60 °C/.test(text) && /구간 체류/.test(text), 'CB0400A straw runs on the CB0190PN25 proxy t½ (W15)');
  await page.locator('#xtal_grade').selectOption('S1000P');

  // English.
  await page.evaluate(() => setLanguage('en'));
  await page.locator('[data-xtal-act="run"]').click();
  text = await page.locator('#xtalPanel').innerText();
  record(/Crystallization history/.test(text) && /Zone residence/.test(text) && /Warnings/.test(text), 'English labels after switching language');
  await page.evaluate(() => setLanguage('ko'));

  // Injection: setpoint only gives W11; sheet runs with three rolls.
  await page.locator('#xtal_process').selectOption('injection');
  await fill(page, { k_W_mK: 0.2, rho_kg_m3: 1250, melt_C: 170, moldSurface_C: '', moldSetpoint_C: 65, wall_mm: 2, fillTime_s: 1, holdTime_s: 5, coolingTime_s: 20, band_C: 5 });
  await page.locator('[data-xtal-act="run"]').click();
  text = await page.locator('#xtalResult').innerText();
  record(/W11/.test(text) && /W07/.test(text), 'injection: setpoint-only mold gives W11; cycle presets side by side (W07)');
  await page.locator('#xtal_process').selectOption('sheet');
  await fill(page, { k_W_mK: 0.2, rho_kg_m3: 1250, dieExit_C: 175, thickness_mm: 0.5, lineSpeed_m_min: 20, R1_D: 400, R1_wrap: 10, R2_D: 400, R2_wrap: 180, R3_D: 400, R3_wrap: 180, stickingControl_R2_C: 55 });
  await page.locator('[data-xtal-act="run"]').click();
  text = await page.locator('#xtalResult').innerText();
  record(/R2 70 °C: 1\.885 s/.test(text) && /H1/.test(text) && /H4/.test(text), 'sheet: R2 contact 1.885 s, curl index and R2 control');

  // DOE.
  await page.locator('#xtalDoe summary').click();
  await page.locator('#xtal_delta').fill('5');
  await page.locator('#xtal_doe_results').fill('condition,speed,pass_t0,pass_24h,pass_7d\ncontrol,10,1,1,1\ncontrol,11,1,1,1\ncontrol,10.5,1,1,1\n70,12,1,1,1\n70,12.5,1,1,1\n70,12.2,1,1,1');
  await page.locator('[data-xtal-act="doe-decide"]').click();
  text = await page.locator('#xtalDoeOut').innerText();
  record(/신규 기준 후보/.test(text) && /Welch/.test(text), 'DOE decision promotes the faster condition with mean ± SD and Welch t');

  const fieldsAfter = await page.$$eval('#dynamicFields input, #dynamicFields select', els => els.map(e => e.id));
  await page.locator('#process').selectOption('injection');
  record(JSON.stringify(fieldsBefore) === JSON.stringify(fieldsAfter), 'existing Process tab fields unchanged');
  record(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await context.close();

  // Mobile: cards stack in one column and the panel does not scroll horizontally.
  const m = await open({ width: 390, height: 860 });
  await m.page.evaluate(() => { localStorage.removeItem('pha_xtal_inputs'); });
  await m.page.locator('#xtalPanel summary').first().click();
  await fill(m.page, { k_W_mK: 0.2, rho_kg_m3: 1250, dieExit_C: 180, wall_mm: 0.2, output_ea_min: 400, cutLength_m: 0.26, b1_L_m: 1.0, b1_T_C: 22, b1_h: 800, b2_L_m: 3.3, b2_T_C: 60, b2_h: 800 });
  await m.page.locator('[data-xtal-act="run"]').click();
  await m.page.waitForSelector('#xtalResult svg.xtal-chart');
  const layout = await m.page.evaluate(() => {
    const cards = [...document.querySelectorAll('.xtal-card')].map(c => c.getBoundingClientRect());
    const panel = document.getElementById('xtalPanel');
    return { oneColumn: cards.every(c => Math.abs(c.left - cards[0].left) < 1), overflow: panel.scrollWidth - panel.clientWidth, docOverflow: document.documentElement.scrollWidth - window.innerWidth };
  });
  record(layout.oneColumn && layout.overflow <= 1, `mobile: cards stack and the panel has no horizontal overflow (${layout.overflow}px)`);
  await m.page.locator('#xtalPanel').screenshot({ path: resolve(shots, 'straw-mobile.png') });
  record(m.errors.length === 0, 'mobile: no page errors');
  await m.context.close();
} catch (error) {
  record(false, String(error.message || error));
} finally {
  await browser.close();
  server.close();
}
console.log(failures ? `CRYSTAL_UI_FAIL ${failures}` : 'CRYSTAL_UI_OK');
process.exit(failures ? 1 : 0);
