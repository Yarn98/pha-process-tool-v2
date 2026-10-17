import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
// Real-scale GLBs (up to ~4 MB) load and compile slowly on software WebGL; 30 s was intermittently tight.
const MODEL_READY_MS=90000;

const root=resolve(process.env.PHA_TEST_ROOT||'.'),out=resolve('output/playwright/equipment-study');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(relative(root,file).startsWith('..')){res.writeHead(403).end();return;}res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const html=await readFile(resolve(root,'index.html'),'utf8'),gate=html.match(/const PASSWORD = ['"]([^'"]+)['"]/);assert.ok(gate);
const kinds=['injection','extrusion','sheet','castfilm','blownfilm','blowmolding','compounding','straw'],checks=[],errors=[];
async function login(page){if(await page.locator('#passwordGateInput').isVisible()){await page.fill('#passwordGateInput',gate[1]);await page.click('#passwordGateSubmit');}}
async function open(context){const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));await page.route('https://tars-api.sorisem98.workers.dev/api/grades',r=>r.fulfill({json:[]}));await page.goto(origin,{waitUntil:'networkidle'});await login(page);return page;}
async function select(page,kind,ready=true){
  if(['compounding','straw'].includes(kind))await page.evaluate(k=>switchTab(k),kind);
  else{await page.evaluate(()=>switchTab('proc'));await page.selectOption('#process',kind);}
  const panel=page.locator(kind==='injection'?'#injectionMotion':`.tabpage.active [data-equipment-model="${kind}"]`);
  await page.waitForFunction(kind=>{const el=kind==='injection'?document.querySelector('#injectionMotion'):document.querySelector(`.tabpage.active [data-equipment-model="${kind}"]`);return ['ready','fallback'].includes(el?.dataset.motionState);},kind,{timeout:MODEL_READY_MS});
  await panel.evaluate(el=>el.scrollIntoView({block:'nearest',behavior:'instant'}));
  assert.equal(await panel.getAttribute('data-motion-state'),ready?'ready':'fallback');return panel;
}
async function data(page,kind){return page.evaluate(kind=>kind==='injection'?__phaInjectionMotionTest():__phaEquipmentTest(),kind);}
async function fields(panel,values){for(const [key,value] of Object.entries(values)){const input=panel.locator(`[data-study-input="${key}"]`);if(key==='scale')await input.selectOption(String(value));else await input.fill(String(value));}}
async function imageReady(panel){await panel.locator('.study-photo img').waitFor({state:'visible'});await panel.page().waitForFunction(()=>[...document.querySelectorAll('.tabpage.active .study-photo:not([hidden]) img')].some(img=>img.complete&&img.naturalWidth===1600));}
try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),page=await open(context);
  for(const kind of kinds){
    let panel=await select(page,kind);
    await panel.locator('[data-study-view="photo"]').click();
    await imageReady(panel);
    assert.equal(await panel.locator('.study-photo img').evaluate(img=>img.naturalWidth),1600);
    assert.equal(await panel.locator('.motion-viewport').isVisible(),false);
    const held=(await data(page,kind)).frames;
    await page.waitForTimeout(120);assert.equal((await data(page,kind)).frames,held,'Photo pauses WebGL '+kind);
    await panel.screenshot({path:resolve(out,kind+'-unreal.png')});
    await panel.locator('[data-study-view="model"]').click();
    assert.equal(await panel.locator('.motion-viewport canvas').isVisible(),true);
    await panel.locator('.equipment-study summary').click();
    if(kind==='blowmolding'){
      await fields(panel,{stroke:10,velocity:20,scale:1});
      assert.match(await panel.locator('.study-result').textContent(),/0\.500 s/);
      await panel.locator('[data-study-run]').click();
      await page.waitForFunction(()=>PHAEquipmentMotion.getState().study?.elapsed>=.5);
      const s=await data(page,kind);assert.equal(s.actual.mold,0);assert.equal(s.actual.pin,0);assert.equal(s.actual.inflate,0);assert.equal(s.studyPlaying,false);
      await fields(panel,{stroke:0});await panel.locator('[data-study-run]').click();
      const stationary=await data(page,kind);assert.equal(stationary.actual.mold,100);assert.equal(stationary.studyPlaying,false);
    }else{
      await fields(panel,{rpm:20,scale:1});
      await panel.locator('[data-study-run]').click();
      await page.waitForFunction(kind=>{const s=kind==='injection'?PHAInjectionMotion.getState():PHAEquipmentMotion.getState();return s.study?.elapsed>.15;},kind);
      await panel.locator('[data-study-stop]').click();
      const s=await data(page,kind),angle=120*s.study.elapsed;
      const q=kind==='injection'?s.nodes.ScrewSpin.quaternion:s.nodes.screw[0].rotation;
      // Preserve the sign: equal rotation magnitude can hide reverse conveying. Every screw turns
      // negatively about +X to convey toward the die.
      const rendered=2*Math.atan2(q[0],q[3]);
      const expected=-angle*Math.PI/180;
      assert.ok(Math.abs(Math.atan2(Math.sin(rendered-expected),Math.cos(rendered-expected)))<.025,kind+' signed quaternion follows forward rotation, RPM and elapsed time');
      if(kind==='compounding'){
        const screws=s.nodes.screw.filter(node=>['ScrewA','ScrewB'].includes(node.name));assert.equal(screws.length,2);
        for(const node of screws){const a=2*Math.atan2(node.rotation[0],node.rotation[3]);assert.ok(Math.abs(Math.atan2(Math.sin(a-expected),Math.cos(a-expected)))<.025,'Both compounding screws co-rotate forward under RPM control');}
      }
      await fields(panel,{rpm:0});await panel.locator('[data-study-run]').click();
      await page.waitForTimeout(100);await panel.locator('[data-study-stop]').click();
      const zero=await data(page,kind);
      assert.equal(kind==='injection'?zero.manual.rotation:zero.study.angle,0,kind+' zero RPM');
      await fields(panel,{rpm:''});assert.equal(await panel.locator('[data-study-run]').isDisabled(),true);
      await fields(panel,{rpm:30});
    }
    checks.push(kind+': 1600×900 Unreal image, pause/resume and physical-unit motion on real GLB nodes');
    await page.locator('[data-lang-choice="en"]').click();panel=await select(page,kind);
    assert.equal(await panel.locator('.equipment-study').evaluate(el=>el.open),true);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,kind+' mobile overflow');
    assert.equal(await page.locator('.fab').isVisible(),false,kind+' study controls are not covered by floating save');
    assert.equal(await page.locator('#mobileTabBar').isVisible(),false,kind+' bottom tabs do not cover study controls');
    await panel.locator('[data-study-view="photo"]').click();
    await imageReady(panel);
    await panel.screenshot({path:resolve(out,kind+'-mobile-en.png')});
    await panel.locator('[data-study-view="model"]').click();
    await page.setViewportSize({width:1440,height:1100});await page.locator('[data-lang-choice="ko"]').click();
  }
  let panel=await select(page,'straw');
  await panel.locator('[data-study-drive]').selectOption('cutter');await fields(panel,{speed:6,pitch:200,scale:1});
  assert.match(await panel.locator('.study-result').textContent(),/30\.00 rpm.*30\.00/);
  await panel.locator('[data-study-run]').click();await page.waitForFunction(()=>PHAEquipmentMotion.getState().study?.elapsed>.1);
  assert.equal((await data(page,'straw')).study.rpm,30);
  await panel.locator('[data-study-stop]').click();
  panel=await select(page,'castfilm');await panel.locator('[data-study-drive]').selectOption('roll');await fields(panel,{speed:6,diameter:200});
  assert.match(await panel.locator('.study-result').textContent(),/9\.55 rpm/);
  await fields(panel,{diameter:0});assert.equal(await panel.locator('[data-study-run]').isDisabled(),true);
  await fields(panel,{diameter:200});
  await fields(panel,{scale:1});await panel.locator('[data-study-run]').click();await page.waitForFunction(()=>PHAEquipmentMotion.getState().study?.elapsed>.12);await panel.locator('[data-study-stop]').click();
  const cast=await data(page,'castfilm'),guide=cast.nodes.roll.find(n=>n.name==='FilmGuideRoll');
  // Rolls turn about their own axis from a rest pose turned 90 deg about the vertical: q_rel = conj(rest) * q.
  const s45=Math.SQRT1_2,[x,y,z,w]=guide.rotation,rel=[s45*x-s45*z,s45*y-s45*w,s45*z+s45*x,s45*w+s45*y];
  const mm=await page.evaluate(()=>PHAEquipmentModels.castfilm.teaching.roll_mm);
  const guideAngle=2*Math.acos(Math.min(1,Math.abs(rel[3]))),expectedGuide=Math.acos(Math.cos(cast.study.angle*Math.PI/180*mm.chill/mm.guide));
  assert.ok(Math.abs(guideAngle-expectedGuide)<.025,'Smaller guide roll turns faster at the same surface speed');
  panel=await select(page,'injection');await panel.locator('[data-study-drive]').selectOption('travel');await fields(panel,{stroke:10,velocity:20,scale:1});await panel.locator('[data-study-run]').click();
  await page.waitForFunction(()=>PHAInjectionMotion.getState().study?.elapsed>=.5);
  const injected=await data(page,'injection');assert.equal(injected.manual.screw,0);assert.equal(injected.manual.fill,100);assert.equal(injected.manual.mold,0);
  await fields(panel,{stroke:0});await panel.locator('[data-study-run]').click();
  const noTravel=await data(page,'injection');assert.equal(noTravel.manual.screw,100);assert.equal(noTravel.manual.fill,0);assert.equal(noTravel.studyPlaying,false);
  checks.push('Straw cut length drives 30 cuts/min; roll circumference gives 9.55 RPM; invalid and blank fields block playback');
  checks.push('Guide roll diameter ratio preserves surface speed; injection completes the specified one-way stroke with mold closed');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await login(page);
  for(const kind of kinds){panel=await select(page,kind);await panel.locator('[data-study-view="photo"]').click();await imageReady(panel);}
  checks.push('All eight Unreal images and models remain available after offline reload');
  await context.close();
  const fallbackContext=await browser.newContext({reducedMotion:'reduce',serviceWorkers:'block'}),fallbackPage=await open(fallbackContext);
  await fallbackPage.route('**/*-motion.glb*',route=>route.abort());
  panel=await select(fallbackPage,'sheet',false);await panel.locator('[data-study-view="photo"]').click();await imageReady(panel);
  await panel.locator('.equipment-study summary').click();assert.equal(await panel.locator('[data-study-run]').isDisabled(),true);
  checks.push('Failed GLB keeps the Unreal image and calculator usable while disabling motion');
  panel=await select(fallbackPage,'injection');
  await panel.locator('.motion-viewport canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  assert.equal(await panel.getAttribute('data-motion-state'),'fallback');
  await panel.locator('[data-study-view="photo"]').click();await imageReady(panel);
  checks.push('WebGL context loss leaves the Unreal detail button available');
  assert.deepEqual(errors,[]);
  await fallbackContext.close();
  await writeFile(resolve(out,'report.json'),JSON.stringify({ok:true,checks},null,2)+'\n');
  console.log('EQUIPMENT_STUDY_OK',checks.length,JSON.stringify(checks));
}finally{await browser.close();server.close();}
