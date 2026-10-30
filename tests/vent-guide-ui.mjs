import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const root=resolve(process.env.PHA_TEST_ROOT||'.'),isSource=root===resolve('.');
const out=resolve('output/playwright/vent-guide',isSource?'source':'dist');
await mkdir(out,{recursive:true});
const guide=JSON.parse(await readFile(resolve(root,'data/vent_guide.json'),'utf8'));
const html=await readFile(resolve(root,'index.html'),'utf8'),gate=html.match(/const PASSWORD = ['"]([^'"]+)['"]/);
assert.ok(gate,'existing app gate fixture');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.glb':'model/gltf-binary','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(relative(root,file).startsWith('..')){res.writeHead(403).end();return;}
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],screenshots=[],openGeometry=[];
const record=name=>{checks.push(name);console.log('PASS',name);};
const state=page=>page.evaluate(()=>PHATroubleVisuals.getState());
const panel=(page,key='guide')=>page.locator('#tsv-panel-'+key);
const configs=['without_reverse','upstream_reverse'];
const symptoms=['particles','rpm_mi','rate_mi','pressure'];
async function unlock(page){
  if(await page.locator('#passwordGate').isVisible()){
    await page.locator('#passwordGateInput').fill(gate[1]);
    await page.locator('#passwordGateSubmit').click();
  }
}
async function enterTroubleshooting(page){
  if(await page.locator('.tab[data-tab="ts"]').isVisible())await page.locator('.tab[data-tab="ts"]').click();
  else{
    await page.locator('#moreBtn').tap();
    assert.equal(await page.locator('#moreBtn').getAttribute('aria-expanded'),'true');
    await page.locator('#morePopover [data-tab="ts"]').tap();
    assert.equal(await page.locator('#moreBtn').getAttribute('aria-expanded'),'false');
  }
  await page.waitForSelector('[data-ts-open="pha-kb-16"]');
}
async function app(context){
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://tars-api.sorisem98.workers.dev/api/grades',route=>route.fulfill({json:[]}));
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await unlock(page);await enterTroubleshooting(page);return page;
}
async function open(page,id='pha-kb-16'){
  await page.locator(`[data-ts-open="${id}"]`).first().click();
  await page.waitForFunction(id=>PHATroubleVisuals.getState()?.kbId===id,id);
  const geometry=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
    return{scrollTop:document.querySelector('#tsVisualDialog').scrollTop,width:innerWidth,height:innerHeight,dialog:rect('#tsVisualDialog'),title:rect('#tsVisualTitle'),close:rect('#tsVisualClose')};
  });
  assert.ok(geometry.scrollTop<=1,'fresh dialog opens at the top');
  for(const key of ['title','close']){
    const r=geometry[key],d=geometry.dialog;
    assert.ok(r.top>=Math.max(0,d.top)&&r.bottom<=Math.min(geometry.height,d.bottom),key+' is vertically visible on open');
    assert.ok(r.left>=Math.max(0,d.left)&&r.right<=Math.min(geometry.width,d.right),key+' is horizontally visible on open');
  }
  openGeometry.push({kbId:id,...geometry});
}
async function close(page){
  await page.locator('#tsVisualClose').click();
  await page.waitForFunction(()=>PHATroubleVisuals.getState()===null);
}
async function tab(page,key){
  await page.locator('#tsv-tab-'+key).click();
  assert.equal((await state(page)).tab,key);
  assert.equal(await panel(page,key).isVisible(),true);
}
async function ready(page,expected='ready'){
  await page.waitForFunction(()=>['ready','fallback'].includes(PHATroubleVisuals.getState()?.modelState));
  assert.equal((await state(page)).modelState,expected);
}
async function model(page,expected='ready'){
  await panel(page).locator('[data-ts-vent-model]').first().click();
  assert.equal((await state(page)).tab,'model');
  assert.equal((await state(page)).ventModel,true);
  await ready(page,expected);
}
async function configure(page,config,key='guide',touch=false){
  const control=panel(page,key).locator(`[data-ts-vent-config="${config}"]`);
  if(touch)await control.tap();else await control.click();
  assert.equal((await state(page)).ventConfig,config);
  assert.equal(await panel(page,key).locator(`[data-ts-vent-config="${config}"]`).getAttribute('aria-pressed'),'true');
}
async function phase(page,value){
  await page.locator('#tsModelPhase').evaluate((element,value)=>{element.value=value;element.dispatchEvent(new Event('input',{bubbles:true}));},value);
}
async function imageLoaded(locator){
  await locator.evaluate(image=>image.decode());
  assert.ok(await locator.evaluate(image=>image.complete&&image.naturalWidth>0));
}
async function capture(page,name,locator=page.locator('#tsVisualDialog')){
  await locator.scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);
  // A top-layer dialog stays fixed while background scroll anchoring can change.
  // Capture viewport coordinates rather than locator.screenshot's page clip.
  const path=resolve(out,name+'.png');await page.screenshot({path});screenshots.push(relative(resolve('.'),path));
}
async function noOverflow(page){
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page fits viewport');
  assert.ok(await page.locator('#tsVisualDialog').evaluate(dialog=>dialog.scrollWidth<=dialog.clientWidth+1),'dialog fits viewport');
}
async function keyboardTabs(page,expected){
  const buttons=page.locator('#tsVisualDialog [role="tablist"] [role="tab"]');
  const order=await buttons.evaluateAll(items=>items.map(item=>item.dataset.tsTab));
  assert.equal(order.length,expected);
  assert.equal(new Set(order).size,expected);
  assert.equal(order.includes('guide'),expected===4);
  await buttons.first().focus();await page.keyboard.press('End');
  assert.equal((await state(page)).tab,order.at(-1));
  assert.equal(await page.locator('#tsv-tab-'+order.at(-1)).evaluate(button=>button===document.activeElement),true);
  await page.keyboard.press('ArrowRight');assert.equal((await state(page)).tab,order[0]);
  await page.keyboard.press('ArrowLeft');assert.equal((await state(page)).tab,order.at(-1));
  await page.keyboard.press('Home');assert.equal((await state(page)).tab,order[0]);
}

try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'no-preference',serviceWorkers:'block'});
  const page=await app(context);await open(page);
  assert.equal((await state(page)).tab,'guide');
  assert.equal((await state(page)).ventConfig,'without_reverse');
  assert.equal((await state(page)).ventSymptom,'particles');
  assert.equal(await panel(page).locator('.vent-role-grid article').count(),2);
  assert.equal((await panel(page).locator('.vent-key-point').textContent()).trim(),guide.not_universal.ko);
  assert.equal((await panel(page).locator('.vent-comparison-note').textContent()).trim(),guide.configuration_comparison_note.ko);
  await imageLoaded(panel(page).locator('.vent-layout img'));
  await capture(page,'guide-ko');
  record('Actual KB16 card opens the two-vent guide with conditional layout comparison');

  for(const config of configs){
    await configure(page,config);
    const item=guide.configurations.find(item=>item.id===config);
    const article=panel(page).locator(`[data-ts-vent-config="${config}"]`).locator('..');
    await article.locator('summary').click();
    assert.equal(await article.locator('details').getAttribute('open'),'');
    assert.ok((await article.textContent()).includes(item.interpretation.ko));
    for(const check of item.check)assert.ok((await article.textContent()).includes(check.ko));
    assert.ok((await panel(page).locator('.vent-layout img').getAttribute('src')).includes(config+'_full.webp?v=36'));
  }
  for(const symptom of symptoms){
    await panel(page).locator(`[data-ts-vent-symptom="${symptom}"]`).click();
    assert.equal((await state(page)).ventSymptom,symptom);
    const item=guide.symptoms.find(item=>item.id===symptom),detail=panel(page).locator('#ventSymptomDetail');
    assert.equal((await detail.locator('h4').textContent()).trim(),item.label.ko);
    const text=await detail.textContent();
    for(const key of ['meaning','action','accept'])assert.ok(text.includes(item[key].ko),symptom+'/'+key);
    assert.equal(await panel(page).locator(`[data-ts-vent-symptom="${symptom}"]`).getAttribute('aria-pressed'),'true');
  }
  const temperature=panel(page).locator('.vent-temperature');
  await temperature.locator('summary').click();
  assert.equal(await temperature.getAttribute('open'),'');
  for(const key of ['when','trial','accept','revert'])assert.ok((await temperature.textContent()).includes(guide.temperature[key].ko));
  await capture(page,'temperature-ko',temperature);
  record('Both screw configurations, four symptom branches and conditional temperature trial details');

  await configure(page,'without_reverse');await model(page);
  assert.equal((await state(page)).playing,false);
  for(const config of configs){
    await configure(page,config,'model');await ready(page);
    assert.deepEqual((await state(page)).visibleGroups,[config+'_full']);
    await phase(page,10);const first=await state(page);
    await phase(page,37);const later=await state(page);
    for(const flow of ['solid','melt','atm_gas','vac_gas']){
      const before=first.nodes.find(node=>node.flow===flow);assert.ok(before,config+'/'+flow+' exists');
      const after=later.nodes.find(node=>node.name===before.name);assert.ok(after);
      assert.notDeepEqual(after.position,before.position,config+'/'+flow+' changes position');
    }
    const screws=first.nodes.filter(node=>!node.flow&&Array.isArray(node.quaternion));
    assert.ok(screws.length>=2,config+' two screw nodes');
    assert.equal(screws.length,2,config+' exactly two rotating shafts');
    for(const before of screws){
      const after=later.nodes.find(node=>node.name===before.name);
      assert.ok(after);
      const delta=2*Math.atan2(after.quaternion[0],after.quaternion[3])-2*Math.atan2(before.quaternion[0],before.quaternion[3]);
      const expected=-(.37-.10)*Math.PI*2;
      assert.ok(Math.abs(Math.atan2(Math.sin(delta-expected),Math.cos(delta-expected)))<1e-5,config+' both shafts rotate forward along their actual helix');
    }
    await capture(page,'model-'+config,page.locator('#tsModelViewport'));
  }
  for(const focus of ['atm','seal','vac']){
    const before=(await state(page)).camera;
    await page.locator(`[data-ts-camera="${focus}"]`).click();
    const camera=(await state(page)).camera;
    assert.notDeepEqual(camera,before,focus+' camera moves');assert.ok(camera.every(Number.isFinite));
    await capture(page,'model-focus-'+focus,page.locator('#tsModelViewport'));
  }
  await page.locator('[data-ts-camera="reset"]').click();
  await page.locator('#tsModelPhase').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
  assert.equal((await state(page)).phase,.01);
  await page.locator('[data-ts-play]').click();
  await page.waitForFunction(()=>PHATroubleVisuals.getState().phase>.015);
  await tab(page,'guide');assert.equal((await state(page)).playing,false);
  const held=(await state(page)).phase;await page.waitForTimeout(160);assert.equal((await state(page)).phase,held);
  await keyboardTabs(page,4);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>PHATroubleVisuals.getState()===null);
  assert.equal(await page.locator('#tsVisualDialog canvas').count(),0);
  record('Both actual GLB layouts animate screws and all four flow types; pause, tab and Escape lifecycle');

  await open(page,'pha-kb-9');assert.equal(await page.locator('#tsv-tab-guide').count(),0);
  await keyboardTabs(page,3);await close(page);
  await open(page);await page.evaluate(()=>setLanguage('en'));
  assert.equal((await panel(page).locator('.vent-lead h3').textContent()).trim(),guide.title.en);
  assert.equal((await panel(page).locator('.vent-key-point').textContent()).trim(),guide.not_universal.en);
  for(const config of configs){
    await configure(page,config);
    assert.equal((await panel(page).locator(`[data-ts-vent-config="${config}"]`).textContent()).trim(),guide.configurations.find(item=>item.id===config).title.en);
  }
  for(const symptom of symptoms){
    await panel(page).locator(`[data-ts-vent-symptom="${symptom}"]`).click();
    assert.equal((await panel(page).locator('#ventSymptomDetail h4').textContent()).trim(),guide.symptoms.find(item=>item.id===symptom).label.en);
  }
  await capture(page,'guide-en');await close(page);await context.close();
  record('Ordinary entries retain three keyboard tabs; the full vent guide supports KO and EN');

  for(const width of [390,320]){
    const mobile=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    const mp=await app(mobile);await open(mp);
    await configure(mp,'upstream_reverse','guide',true);
    await panel(mp).locator('[data-ts-vent-symptom="rpm_mi"]').tap();
    assert.equal((await state(mp)).ventSymptom,'rpm_mi');
    await noOverflow(mp);await model(mp);assert.equal((await state(mp)).playing,false);
    await configure(mp,'without_reverse','model',true);await ready(mp);
    await mp.locator('#tsModelPhase').scrollIntoViewIfNeeded();
    const slider=await mp.locator('#tsModelPhase').boundingBox();assert.ok(slider);
    await mp.touchscreen.tap(slider.x+slider.width*.55,slider.y+slider.height/2);
    assert.ok((await state(mp)).phase>.45&&(await state(mp)).phase<.65);
    for(const key of ['model','flow','compare','guide']){await tab(mp,key);await noOverflow(mp);}
    await capture(mp,'mobile-ko-'+width);
    await mp.evaluate(()=>setLanguage('en'));await noOverflow(mp);
    await panel(mp).locator('.vent-temperature summary').tap();await noOverflow(mp);
    await capture(mp,'mobile-en-'+width);await close(mp);await mobile.close();
  }
  record('390px and 320px touch controls, both languages and four tabs fit without horizontal overflow');

  for(const failure of ['webgl','glb']){
    const fc=await browser.newContext({viewport:{width:1280,height:1000},serviceWorkers:'block'});
    if(failure==='webgl')await fc.addInitScript(()=>{
      const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(kind,...args){return /^webgl/.test(kind)?null:original.call(this,kind,...args);};
    });
    if(failure==='glb')await fc.route('**/assets/troubleshooting/vent-guide.glb*',route=>route.fulfill({status:404,body:'Unavailable'}));
    const fp=await app(fc);await open(fp);await model(fp,'fallback');
    for(const config of configs){
      await configure(fp,config,'model');await ready(fp,'fallback');
      assert.equal(await fp.locator('#tsModelPoster').isVisible(),true);
      assert.ok((await fp.locator('#tsModelPoster').getAttribute('src')).includes('vent-guide-'+config+'_full.webp?v=36'));
      await imageLoaded(fp.locator('#tsModelPoster'));
    }
    await capture(fp,'fallback-'+failure);
    await tab(fp,'guide');assert.equal(await panel(fp).locator('.vent-guide').count(),1);
    assert.equal(await panel(fp).locator('.vent-symptom-detail').count(),1);await fc.close();
  }
  record('Unavailable WebGL or GLB retains each new layout poster and the source-linked guide');

  for(const mismatch of ['kb-fingerprint','guide-review']){
    const mc=await browser.newContext({viewport:{width:1280,height:1000},serviceWorkers:'block'});
    const mp=await app(mc);
    await mp.evaluate(kind=>{
      if(kind==='kb-fingerprint')window.tsData.find(item=>item.id==='pha-kb-16').diagnostics+=' changed regression fixture';
      else window.PHAVentGuideData.review_version+='-stale-fixture';
    },mismatch);
    await open(mp);
    assert.equal((await state(mp)).tab,'guide');
    assert.equal(await panel(mp).locator('.vent-guide').count(),0,mismatch+' hides guide actions');
    assert.equal(await panel(mp).locator('[data-ts-vent-model]').count(),0,mismatch+' hides guide model launch');
    assert.equal(await panel(mp).locator('.ts-visual-mismatch').count(),1,mismatch+' explains unavailable guidance');
    await close(mp);await mc.close();
  }
  record('KB fingerprint and guide review mismatches separately fail closed without main guide actions');

  const offline=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
  const op=await app(offline);
  await op.evaluate(()=>localStorage.setItem('vent-guide-retention-fixture','preserve'));
  await op.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await op.waitForFunction(async()=>{
    const cache=await caches.open('pha-cache-v36-cb0400a-proxy'),keys=await cache.keys();
    return ['vent-guide.glb','vent-guide-without_reverse_full.webp','vent-guide-upstream_reverse_full.webp','vent-guide-data.js','vent-guide.js','vent-guide.css','data/vent_guide.json'].every(asset=>keys.some(key=>key.url.endsWith('/'+asset+'?v=36')));
  },{},{timeout:60000});
  await op.reload({waitUntil:'domcontentloaded'});await unlock(op);await enterTroubleshooting(op);
  await op.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await offline.setOffline(true);await op.reload({waitUntil:'domcontentloaded'});await unlock(op);await enterTroubleshooting(op);await open(op);
  for(const lang of ['ko','en']){
    await op.evaluate(lang=>setLanguage(lang),lang);
    assert.equal((await panel(op).locator('.vent-lead h3').textContent()).trim(),guide.title[lang]);
    for(const config of configs){
      await configure(op,config);await imageLoaded(panel(op).locator('.vent-layout img'));
      await model(op);assert.deepEqual((await state(op)).visibleGroups,[config+'_full']);await tab(op,'guide');
    }
  }
  assert.equal(await op.evaluate(()=>localStorage.getItem('vent-guide-retention-fixture')),'preserve');
  await capture(op,'offline-en');await close(op);await offline.close();
  record('v36 service-worker offline reload covers both layouts and KO/EN guide while preserving local records');

  assert.deepEqual(errors,[]);
  const report={status:'passed',root:relative(resolve('.'),root)||'.',checks,screenshots,openGeometry,errors,productionDeployed:false};
  await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  await mkdir(resolve('docs/verification'),{recursive:true});
  await writeFile(resolve('docs/verification',isSource?'vent-guide-ui.json':'vent-guide-ui-dist.json'),JSON.stringify(report,null,2)+'\n');
  console.log('VENT_GUIDE_UI_OK',checks.length);
}finally{await browser.close();await new Promise(r=>server.close(r));}
