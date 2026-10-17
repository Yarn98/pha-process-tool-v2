import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root=resolve(process.env.PHA_TEST_ROOT||'.'),out=resolve('output/playwright/troubleshooting-visuals');await mkdir(out,{recursive:true});
const data=JSON.parse(await readFile(resolve(root,'data/troubleshooting_visuals.json'),'utf8')),kb=JSON.parse(await readFile(resolve(root,'data/troubleshooting_kb.json'),'utf8'));
const html=await readFile(resolve(root,'index.html'),'utf8'),gate=html.match(/const PASSWORD = ['"]([^'"]+)['"]/);assert.ok(gate);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.glb':'model/gltf-binary','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(relative(root,file).startsWith('..')){res.writeHead(403).end();return;}res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],snapshots=[];
const record=name=>{checks.push(name);console.log('PASS',name);};
const state=page=>page.evaluate(()=>PHATroubleVisuals.getState());
async function unlock(page){if(await page.locator('#passwordGate').isVisible()){await page.locator('#passwordGateInput').fill(gate[1]);await page.locator('#passwordGateSubmit').click();}}
async function app(context){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.route('https://tars-api.sorisem98.workers.dev/api/grades',r=>r.fulfill({json:[]}));await page.goto(origin,{waitUntil:'domcontentloaded'});await unlock(page);if(await page.locator('.tab[data-tab="ts"]').isVisible())await page.locator('.tab[data-tab="ts"]').click();else{await page.locator('#moreBtn').tap();assert.equal(await page.locator('#moreBtn').getAttribute('aria-expanded'),'true');await page.locator('#morePopover [data-tab="ts"]').tap();assert.equal(await page.locator('#moreBtn').getAttribute('aria-expanded'),'false');}await page.waitForSelector('[data-ts-open]');return page;}
async function open(page,id,tab='compare',caseId){await page.evaluate(({id,tab,caseId})=>PHATroubleVisuals.open(id,{tab,caseId}),{id,tab,caseId});}
async function ready(page,expected='ready'){await page.waitForFunction(()=>['ready','fallback'].includes(PHATroubleVisuals.getState()?.modelState));assert.equal((await state(page)).modelState,expected);}
async function close(page){await page.locator('#tsVisualClose').click();await page.waitForFunction(()=>PHATroubleVisuals.getState()===null);}
async function images(page){await page.waitForFunction(()=>[...document.querySelectorAll('#tsVisualDialog img')].every(img=>img.complete&&img.naturalWidth>0));}
async function phase(page,value){await page.locator('#tsModelPhase').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);}
try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce',serviceWorkers:'block'}),page=await app(context);
  assert.equal(await page.locator('.ts-visual-entry').count(),16);
  await page.locator('[data-ts-open="pha-kb-9"]').first().click();await images(page);
  await page.locator('#tsVisualDialog').screenshot({path:resolve(out,'comparison-ko.png')});await close(page);
  record('16 actual card entry points and click-to-open comparison');
  for(const entry of data.entries){
    for(const c of entry.cases){
      await open(page,entry.kb_id,'model',c.id);await ready(page);
      let s=await state(page);assert.ok(s.compatible,entry.kb_id+' reviewed KB identity');
      assert.deepEqual(s.visibleGroups,[c.state+(c.default_section?'_section':'_full')]);
      await page.locator('[data-ts-normal]').check();assert.deepEqual((await state(page)).visibleGroups,[c.normal+(c.default_section?'_section':'_full')]);
      await page.locator('[data-ts-normal]').uncheck();
      if(c.section){await page.locator('[data-ts-section]').check();assert.deepEqual((await state(page)).visibleGroups,[c.state+'_section']);await page.locator('[data-ts-section]').uncheck();}
      const before=(await state(page)).camera;await page.locator('[data-ts-camera="left"]').click();assert.notDeepEqual((await state(page)).camera,before);await page.locator('[data-ts-camera="reset"]').click();
      if(c.default_section)await page.locator('[data-ts-section]').check();
      await page.locator('#tsModelViewport').screenshot({path:resolve(out,c.id+'.png')});
      snapshots.push({id:c.id,modelState:(await state(page)).modelState,visibleGroups:(await state(page)).visibleGroups});
      await page.locator('[data-ts-tab="flow"]').click();
      assert.ok((await page.locator('.ts-flow-stop').textContent()).includes(kb.find(x=>x.id===entry.kb_id).stop_conditions_ko));
      await close(page);
    }
    console.log('MODEL_CASES_OK',entry.kb_id,entry.cases.length);
  }
  record('All 25 real GLB cases, normal comparison, available cutaways, camera and exact KO stop criteria');

  await open(page,'pha-kb-11','model','thermo-crack');await ready(page);
  await page.locator('#tsModelPhase').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');assert.equal((await state(page)).phase,.01);
  await phase(page,0);const start=await state(page),firstPlug=start.nodes.find(n=>n.role==='plug'),firstSheet=start.nodes.find(n=>n.role==='sheet');assert.equal(firstSheet.morphs[0],0);
  await phase(page,60);const formed=await state(page);assert.ok(formed.nodes.find(n=>n.role==='plug').position[1]<firstPlug.position[1]-2.9);assert.ok(Math.abs(formed.nodes.find(n=>n.role==='sheet').morphs[0]-1)<1e-9);
  for(const p of [20,35,50,55,60,80,90,100]){
    await phase(page,p);const pose=await state(page),plug=pose.nodes.find(n=>n.role==='plug'),sheet=pose.nodes.find(n=>n.role==='sheet');
    const sheetFloor=2.15-1.82*sheet.morphs[0]+sheet.position[1];assert.ok(plug.position[1]>=sheetFloor-.0001,'plug does not pass through the cup floor at phase '+p);
  }
  await phase(page,98);const released=await state(page);assert.ok(Math.abs(released.nodes.find(n=>n.role==='plug').position[1]-firstPlug.position[1])<1e-6);
  assert.ok(released.nodes.find(n=>n.role==='sheet').position[1]>.3);assert.ok(released.nodes.filter(n=>n.role==='clamp').every(n=>n.position[1]>2.8));
  await page.locator('[data-ts-camera="detail"]').click();await page.locator('#tsVisualDialog').screenshot({path:resolve(out,'thermoforming-controls.png')});
  await page.locator('[data-ts-play]').click();await page.waitForFunction(()=>PHATroubleVisuals.getState().phase<.5);await page.locator('[data-ts-play]').click();assert.equal((await state(page)).playing,false);
  const held=(await state(page)).frames;await page.waitForTimeout(150);assert.equal((await state(page)).frames,held);
  await page.locator('#tsv-tab-model').focus();await page.keyboard.press('ArrowRight');assert.equal((await state(page)).tab,'flow');await page.keyboard.press('Escape');await page.waitForFunction(()=>PHATroubleVisuals.getState()===null);
  assert.equal(await page.locator('#tsVisualDialog canvas').count(),0);
  record('Thermoforming heater/plug/sheet motion, pause, reduced-motion start, keyboard tabs and Escape disposal');

  await open(page,'pha-kb-15','model');await ready(page);await page.locator('[data-ts-context="true"]').click();await ready(page);assert.equal((await state(page)).context,true);
  await phase(page,10);const contextState=await state(page);await phase(page,80);assert.ok((await state(page)).frames>contextState.frames);
  await page.locator('#tsVisualDialog').screenshot({path:resolve(out,'straw-reused-equipment.png')});await close(page);
  record('Existing straw-line equipment loads with its Blender animation');

  await page.evaluate(()=>setLanguage('en'));
  for(const entry of data.entries){await open(page,entry.kb_id,'flow');assert.ok((await page.locator('.ts-flow-stop').textContent()).includes(kb.find(x=>x.id===entry.kb_id).stop_conditions));assert.equal(await page.locator('#tsVisualClose').textContent(),'Close ×');await close(page);}
  await open(page,'pha-kb-11','compare','thermo-whitening');await images(page);assert.ok((await page.locator('#tsVisualDialog').textContent()).includes('Local whitening during thermoforming'));await page.locator('#tsVisualDialog').screenshot({path:resolve(out,'comparison-en.png')});await close(page);
  await page.evaluate(()=>setLanguage('ko'));await page.locator('#tsProcessFilter').selectOption('thermoforming');assert.equal(await page.locator('.ts-visual-entry').count(),1);await page.locator('#tsProcessFilter').selectOption('all');await page.locator('#tsSearch').fill('벤트 역류');assert.equal(await page.locator('.ts-visual-entry').count(),1);assert.equal(await page.locator('.ts-kb-detail[open]').count(),1);await page.locator('#tsSearch').fill('');
  record('All 16 EN action flows, new terminology, KO/EN switching and original filters');

  await page.evaluate(()=>{window.tsData.find(x=>x.id==='pha-kb-9').diagnostics+=' changed fixture';});await open(page,'pha-kb-9','flow');assert.equal(await page.locator('.ts-visual-mismatch').count(),1);assert.equal(await page.locator('.ts-flow-stop').count(),0);await close(page);
  record('Mismatched KB content does not present a stale action infographic');
  await context.close();

  for(const width of [390,320]){
    const mobile=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),mp=await app(mobile);
    await mp.locator('#tsProcessFilter').selectOption('thermoforming');await mp.locator('[data-ts-open="pha-kb-11"]').first().tap();await mp.locator('#tsv-tab-model').tap();await ready(mp);await mp.locator('#tsModelPhase').scrollIntoViewIfNeeded();const slider=await mp.locator('#tsModelPhase').boundingBox();await mp.touchscreen.tap(slider.x+slider.width*.55,slider.y+slider.height/2);assert.ok((await state(mp)).phase>.45&&(await state(mp)).phase<.65);await mp.locator('[data-ts-camera="detail"]').tap();
    for(const tab of ['model','flow','compare']){await mp.locator('#tsv-tab-'+tab).tap();assert.ok(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await mp.locator('#tsVisualDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));}
    if(width===390){await mp.locator('#tsv-tab-model').tap();await mp.screenshot({path:resolve(out,'mobile-390.png')});}
    await close(mp);await mp.evaluate(()=>setLanguage('en'));await open(mp,'pha-kb-11','model');await ready(mp);assert.ok(await mp.locator('#tsVisualDialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1));if(width===320)await mp.screenshot({path:resolve(out,'mobile-en-320.png')});
    await mobile.close();
  }
  record('390px and 320px touch operation with no horizontal overflow');

  for(const fail of ['webgl','glb','module']){
    const fc=await browser.newContext({viewport:{width:1200,height:950},serviceWorkers:'block'});
    if(fail==='webgl')await fc.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /^webgl/.test(kind)?null:original.call(this,kind,...args);};});
    if(fail==='glb')await fc.route('**/assets/troubleshooting/*.glb*',r=>r.fulfill({status:404,body:'Unavailable'}));
    if(fail==='module')await fc.route('**/troubleshooting-viewer.js*',r=>r.abort());
    const fp=await app(fc);await open(fp,'pha-kb-9','model');await ready(fp,'fallback');assert.equal(await fp.locator('#tsModelPoster').isVisible(),true);await fp.locator('[data-ts-section]').check();assert.ok((await fp.locator('#tsModelPoster').getAttribute('src')).includes('_section'));await fp.locator('#tsv-tab-flow').click();assert.equal(await fp.locator('.ts-flow-stop').count(),1);await fc.close();
  }
  record('WebGL, model fetch and dynamic-module failures retain imagery and reviewed actions');

  const oc=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'}),op=await app(oc);
  await op.evaluate(()=>localStorage.setItem('ts-visual-retention-fixture','preserve'));
  await op.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await op.waitForFunction(async()=>{const cache=await caches.open('pha-cache-v29-startup-sequence');const keys=await cache.keys();return keys.some(k=>k.url.includes('thermoforming.glb?v=29'))&&keys.some(k=>k.url.includes('troubleshooting-viewer.js?v=29'));},{},{timeout:60000});
  await op.reload({waitUntil:'domcontentloaded'});await unlock(op);await op.locator('.tab[data-tab="ts"]').click();await op.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await oc.setOffline(true);await op.reload({waitUntil:'domcontentloaded'});await unlock(op);await op.locator('.tab[data-tab="ts"]').click();
  for(const entry of data.entries){await open(op,entry.kb_id,'model');await ready(op);assert.ok((await state(op)).compatible);await close(op);}
  assert.equal(await op.evaluate(()=>localStorage.getItem('ts-visual-retention-fixture')),'preserve');await oc.close();
  record('Service-worker offline reload covers all 16 models and preserves local records');
  assert.deepEqual(errors,[]);
  const report={status:'passed',root:relative(resolve('.'),root)||'.',checks,visualCases:snapshots,errors,productionDeployed:false};
  await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  await mkdir(resolve('docs/verification'),{recursive:true});await writeFile(resolve('docs/verification',root===resolve('.')?'troubleshooting-ui.json':'troubleshooting-ui-dist.json'),JSON.stringify(report,null,2)+'\n');
  console.log('TROUBLESHOOTING_VISUAL_UI_OK',checks.length);
}finally{await browser.close();await new Promise(r=>server.close(r));}
