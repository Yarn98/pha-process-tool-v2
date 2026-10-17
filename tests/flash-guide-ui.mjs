import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=resolve(process.env.PHA_TEST_ROOT||'.'),kind=root===resolve('.')?'source':'dist';
const output=resolve('output/playwright/flash-guide',kind);await mkdir(output,{recursive:true});
const html=await readFile(resolve(root,'index.html'),'utf8'),gate=html.match(/const PASSWORD = ['"]([^'"]+)['"]/);assert.ok(gate);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),p=resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(relative(root,p).startsWith('..'))return res.writeHead(403).end();res.writeHead(200,{'content-type':mime[extname(p)]||'application/octet-stream','cache-control':'no-store'}).end(await readFile(p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[];const record=message=>{checks.push(message);console.log('PASS',message);};
async function app(context){
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://tars-api.sorisem98.workers.dev/api/grades',r=>r.fulfill({json:[]}));
  await page.goto(origin,{waitUntil:'load'});if(await page.locator('#passwordGate').isVisible()){await page.fill('#passwordGateInput',gate[1]);await page.click('#passwordGateSubmit');}
  await page.evaluate(()=>switchTab('flash'));await page.waitForSelector('#fg-results');return page;
}
const tab=(page,i)=>page.locator('#flash .flash-tab').nth(i).click();
const state=page=>page.evaluate(()=>PHAFlashGuide.snapshot());
async function slider(page,id,value){await page.locator('#'+id).evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function model(page){await tab(page,0);if(!await page.locator('#fg-model-details').evaluate(d=>d.open))await page.locator('#fg-model-details>summary').click();await page.waitForFunction(()=>PHAFlashGuide.snapshot().model||PHAFlashGuide.snapshot().failed);await page.locator('#fg-canvas').scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));if(!(await state(page)).failed)await page.waitForFunction(()=>PHAFlashGuide.snapshot().model?.frames>0);}
async function shot(page,name){await page.screenshot({path:resolve(output,name+'.png'),fullPage:true,animations:'disabled'});}
try{
  const context=await browser.newContext({viewport:{width:1360,height:980},acceptDownloads:true});
  const page=await app(context);
  await page.waitForFunction(()=>document.querySelector('#fg-image-open img').naturalWidth>1000);
  assert.equal(await page.locator('#flash .flash-tab[role=tab]').count(),8);
  assert.equal(await page.locator('#fg-results [data-route=inspect]').count(),1);
  for(const location of ['parting','vent','ejector','unknown'])for(const timing of ['unknown','fill','pack']){
    await page.locator(`[data-fg-choice=location][data-value=${location}]`).click();await page.locator(`[data-fg-choice=timing][data-value=${timing}]`).click();
    const ids=await page.locator('#fg-results [data-route]').evaluateAll(nodes=>nodes.map(n=>n.dataset.route));
    assert.ok(ids.includes(timing==='unknown'?'inspect':timing));
    if(location==='vent'||location==='ejector')assert.equal(ids[0],location);
    assert.ok(await page.locator('#fg-results a[href^="https://"]').count());
  }
  await page.selectOption('#fg-thermal','heat');assert.equal(await page.locator('#fg-results [data-route=heat]').count(),1);
  await page.selectOption('#fg-thermal','resistance');assert.equal(await page.locator('#fg-results [data-route=resistance]').count(),1);
  await page.selectOption('#fg-thermal','none');await page.locator('[data-fg-choice=location][data-value=parting]').click();await page.locator('[data-fg-choice=timing][data-value=unknown]').click();
  await page.click('#fg-image-open');assert.equal(await page.locator('dialog.fg-image-dialog').isVisible(),true);await page.keyboard.press('Escape');await page.locator('dialog.fg-image-dialog').waitFor({state:'detached'});
  await shot(page,'overview-ko');record('12 location/onset combinations, separate heat branches, source links and keyboard image enlargement');
  await model(page);assert.ok((await state(page)).model);
  const low=await state(page);await slider(page,'fg-opening',95);const open=await state(page);
  assert.ok(open.model.nodes.find(n=>n.role==='upper_mold').position[1]-low.model.nodes.find(n=>n.role==='upper_mold').position[1]>.5);
  await slider(page,'fg-progress',20);const partial=await state(page);await slider(page,'fg-progress',55);const filled=await state(page);
  assert.notDeepEqual(partial.model.nodes.filter(n=>n.role==='cavity'),filled.model.nodes.filter(n=>n.role==='cavity'));
  await page.selectOption('#fg-onset','fill');await slider(page,'fg-progress',60);let s=await state(page);assert.ok(s.model.nodes.some(n=>n.role==='flash'&&n.morphs.FlashGrow>0));
  await page.selectOption('#fg-onset','pack');s=await state(page);assert.equal(s.model.nodes.some(n=>n.role==='flash'),false);
  await slider(page,'fg-progress',90);s=await state(page);assert.ok(s.model.nodes.some(n=>n.role==='flash'&&n.morphs.FlashGrow>0));
  await page.locator('[data-fg-camera=left]').click();const camera=(await state(page)).model.camera;await slider(page,'fg-progress',85);assert.deepEqual((await state(page)).model.camera,camera,'scrubbing retains camera');
  for(const location of ['parting','vent','ejector']){
    await page.locator(`[data-fg-choice=location][data-value=${location}]`).click();s=await state(page);assert.deepEqual(s.model.visibleGroups,[location]);assert.ok(s.model.nodes.some(n=>n.role==='flash'&&n.location===location));
    await page.check('#fg-normal');s=await state(page);assert.deepEqual(s.model.visibleGroups,['normal']);assert.equal(s.model.nodes.some(n=>n.role==='flash'),false);await page.uncheck('#fg-normal');
  }
  await page.click('#fg-play');await page.waitForFunction(()=>PHAFlashGuide.snapshot().playing);const p0=(await state(page)).progress;await page.waitForTimeout(220);assert.notEqual((await state(page)).progress,p0);await page.click('#fg-play');assert.equal((await state(page)).playing,false);
  await page.click('#fg-play');await tab(page,5);assert.equal((await state(page)).playing,false);await tab(page,0);await model(page);await shot(page,'model-ko');record('Actual GLB opening, fill morphs, onset-dependent flash, three defect groups, clean comparison, orbit retention and playback lifecycle');
  await tab(page,4);await page.locator('[data-fg-check]').first().check();await page.fill('#fg-baseline','same cavity / measured baseline');await page.fill('#fg-change','one controlled change');await page.fill('#fg-observed','flash improved; dimensions checked');
  await page.locator('[data-lang-choice=en]').click();assert.equal(await page.locator('[data-fg-check]').first().isChecked(),true);assert.equal(await page.inputValue('#fg-change'),'one controlled change');
  const downloadPromise=page.waitForEvent('download');await page.click('#fg-download');const download=await downloadPromise;assert.match(await readFile(await download.path(),'utf8'),/one controlled change/);
  await tab(page,2);assert.equal(await page.locator('#flash-tab-2 input').evaluateAll(nodes=>nodes.every(n=>n.labels.length>0)),true);
  await page.fill('#flash-p-avg','980.665');await page.fill('#flash-a-proj','1');await page.evaluate(()=>calculateFlashClampTonnage());assert.equal(await page.locator('#flash-clamp-value').innerText(),'1.0 tf');assert.doesNotMatch(await page.locator('#flash-tab-2').innerText(),/\+20|Auto-Split|Runner Protection/);
  await page.fill('#flash-p-inj-peak','1000');await page.fill('#flash-pack-r1','40');await page.fill('#flash-pack-r2','20');await page.evaluate(()=>calculateFlashPackingPressure());await page.locator('[data-lang-choice=ko]').click();assert.equal(await page.inputValue('#flash-pack-r1'),'40');assert.match(await page.locator('#flash-packing-value').innerText(),/400/);record('New checklist and trial drafts survive language changes; downloads and labeled calculations retain correct units');
  await tab(page,6);await page.evaluate(()=>{const base=ensureCurrentBatchSession();setCurrentBatchSession({...base,batch_id:'flash-fixture',status:'running',started_at:new Date().toISOString(),events:[]});renderBatchEventPanel();selectBatchEventKind('anomaly');});
  await page.fill('#eventCommonNote','unsaved bilingual draft');await page.fill('#eventAnomalyAction','observe first');await page.selectOption('#eventAnomalySeverity','high');await page.fill('#eventStatePressure','777');
  await page.locator('[data-lang-choice=en]').click();assert.equal(await page.inputValue('#eventCommonNote'),'unsaved bilingual draft');assert.equal(await page.inputValue('#eventAnomalyAction'),'observe first');assert.equal(await page.inputValue('#eventAnomalySeverity'),'high');assert.equal(await page.inputValue('#eventStatePressure'),'777');
  assert.equal(await page.locator('[data-event-kind=anomaly]').getAttribute('class').then(x=>x.includes('active')),true);
  await page.evaluate(()=>selectBatchEventKind('temp_reading'));await page.fill('#eventStateSpeed','120');await page.fill('#eventStatePressure','700');
  page.once('dialog',d=>d.dismiss());assert.equal(await page.evaluate(()=>buildBatchEventPayload()),null,'missing actual RPM cannot masquerade as travel speed');
  await page.fill('#eventStateScrewRpm','0');const payload=await page.evaluate(()=>buildBatchEventPayload());assert.equal(payload.state_snapshot.rpm,0);assert.equal(payload.process_snapshot.injectionSpeed,120);assert.equal('torque_pct' in payload.state_snapshot,false);assert.equal('melt_temp_c' in payload.state_snapshot,false);assert.equal('die_pressure_bar' in payload.state_snapshot,false);
  await page.fill('#eventStateScrewRpm','');await page.evaluate(()=>selectBatchEventKind('note'));assert.equal((await page.evaluate(()=>buildBatchEventPayload())).kind,'note');
  await page.evaluate(()=>{processLogData=[{timestamp:'2026-09-15T01:00:00Z',note:'new fixture',injectionPressure:900},{timestamp:'2026-09-14T01:00:00Z',note:'older fixture',injectionPressure:700}];saveProcessLog();renderProcessLog();generateFlashRecommendations();updateCharts();});assert.match(await page.locator('#recommendationContent').innerText(),/900/);
  const literal='new fixture </textarea><b id="unwanted-log-markup">literal</b>';await page.evaluate(note=>{processLogData[0].note=note;renderProcessLog();},literal);assert.equal(await page.locator('#processLogBody textarea').first().inputValue(),literal);assert.equal(await page.locator('#unwanted-log-markup').count(),0);
  await page.evaluate(()=>{processLogData[0].injectionPressure=0;generateFlashRecommendations();});assert.equal(await page.locator('#flashRecommendations').isVisible(),false);assert.equal(await page.locator('#recommendationContent').innerText(),'');
  await page.fill('#filterKeyword','no-matching-entry');await page.evaluate(()=>filterProcessLog());assert.equal(await page.locator('#processLogBody textarea').count(),0);assert.match(await page.locator('#processLogBody').innerText(),/No logs match/);
  await page.fill('#filterKeyword','fixture');await page.evaluate(()=>filterProcessLog());page.once('dialog',d=>d.accept());await page.locator('#processLogBody .btn-delete-log').first().click();assert.equal(await page.locator('#processLogBody textarea').count(),1);assert.match(await page.locator('#recommendationContent').innerText(),/700/);
  assert.equal(await page.evaluate(()=>processChart.data.labels.length),1);page.once('dialog',d=>d.accept());await page.locator('#processLogBody .btn-delete-log').first().click();assert.equal(await page.locator('#flashRecommendations').isVisible(),false);assert.equal(await page.evaluate(()=>processChart.data.labels.length),0);
  record('Unsaved batch event survives KO/EN; zero-valued/deleted logs clear stale guidance and charts; zero-result filters stay empty');
  for(const width of [390,320]){await page.setViewportSize({width,height:900});for(const locale of ['ko','en']){await page.locator(`[data-lang-choice=${locale}]`).click();for(let i=0;i<8;i++){await tab(page,i);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,`${width}/${locale}/tab${i}`);}await tab(page,0);await model(page);assert.ok((await state(page)).model);assert.equal(await page.locator('#fg-opening').isVisible(),true);await shot(page,`mobile-${locale}-${width}`);}}
  record('All eight Flash subtabs fit 320/390px in Korean/English with usable 3D controls');
  for(const fallback of ['glb','webgl']){const c=await browser.newContext({viewport:{width:390,height:900}});if(fallback==='webgl')await c.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});else await c.route('**/assets/flash-control/mold-detail.glb*',r=>r.abort());const p=await app(c);await model(p);assert.equal((await state(p)).failed,true);for(const location of ['parting','vent','ejector']){await p.locator(`[data-fg-choice=location][data-value=${location}]`).click();await p.waitForFunction(()=>document.querySelector('#fg-poster').complete&&document.querySelector('#fg-poster').naturalWidth>0);assert.match(await p.locator('#fg-poster').getAttribute('src'),new RegExp(location));}assert.equal(await p.locator('#fg-progress').isDisabled(),true);await shot(p,'fallback-'+fallback);await c.close();}
  record('Unavailable WebGL and failed GLB retain all three Blender posters and source-linked solutions');
  await page.setViewportSize({width:1360,height:980});await page.waitForFunction(async()=>!!navigator.serviceWorker.controller&&(await caches.keys()).includes('pha-cache-v26-realistic-equipment'),{},{timeout:60000});
  assert.ok(await page.evaluate(async()=>!!await caches.match('./troubleshooting-viewer.js?v=26')),'the static viewer dependency is precached');
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  await page.evaluate(()=>localStorage.setItem('flash-guide-retention-fixture','retain-local-records'));await context.setOffline(true);await page.reload({waitUntil:'load'});await page.evaluate(()=>switchTab('flash'));await model(page);assert.ok((await state(page)).model);assert.equal(await page.evaluate(()=>localStorage.getItem('flash-guide-retention-fixture')),'retain-local-records');await page.waitForFunction(()=>document.querySelector('#fg-image-open img').naturalWidth>0);await shot(page,'offline');await context.setOffline(false);record('v26 service worker reloads guide, original image and GLB offline while preserving local records');
  assert.deepEqual(errors,[]);record('No uncaught browser errors');await context.close();
  await mkdir('docs/verification',{recursive:true});await writeFile(`docs/verification/flash-guide-ui${kind==='dist'?'-dist':''}.json`,JSON.stringify({status:'passed',root:kind,checks,errors},null,2)+'\n');
}finally{await browser.close();server.close();}
console.log('FLASH_GUIDE_UI_OK',checks.length);
