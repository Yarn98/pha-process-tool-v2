/* Targeted connection regressions beyond the existing full motion suites. */
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
// Real-scale GLBs (up to ~4 MB) load and compile slowly on software WebGL; 30 s was intermittently tight.
const MODEL_READY_MS=90000;

const root=resolve(process.env.PHA_TEST_ROOT||'.');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(relative(root,file).startsWith('..')){res.writeHead(403).end();return;}res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const html=await readFile(resolve(root,'index.html'),'utf8'),gate=html.match(/const PASSWORD = ['"]([^'"]+)['"]/);assert.ok(gate);
const checks=[],errors=[];
async function check(name,run){try{const evidence=await run();checks.push({name,status:'passed',evidence});console.log('PASS',name);}catch(error){checks.push({name,status:'failed',error:error.message});console.log('FAIL',name,error.message);}}
async function select(page,kind){
  if(['compounding','straw'].includes(kind))await page.evaluate(k=>switchTab(k),kind);
  else{await page.evaluate(()=>switchTab('proc'));await page.selectOption('#process',kind);}
  const panel=page.locator(kind==='injection'?'#injectionMotion':`.tabpage.active [data-equipment-model="${kind}"]`);
  await panel.waitFor();await page.waitForFunction(kind=>document.querySelector(kind==='injection'?'#injectionMotion':`.tabpage.active [data-equipment-model="${kind}"]`)?.dataset.motionState==='ready',kind,{timeout:MODEL_READY_MS});
  await panel.evaluate(el=>el.scrollIntoView({block:'nearest',behavior:'instant'}));
  if(!await panel.locator('.equipment-study').evaluate(el=>el.open))await panel.locator('.equipment-study summary').click();
  return panel;
}
const snapshot=(page,kind)=>page.evaluate(k=>k==='injection'?__phaInjectionMotionTest():__phaEquipmentTest(),kind);
async function fields(panel,values){for(const [key,value] of Object.entries(values)){const input=panel.locator(`[data-study-input="${key}"]`);if(key==='scale')await input.selectOption(String(value));else await input.fill(String(value));}}
try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://tars-api.sorisem98.workers.dev/api/grades',r=>r.fulfill({json:[]}));
  await page.goto(origin,{waitUntil:'networkidle'});await page.fill('#passwordGateInput',gate[1]);await page.click('#passwordGateSubmit');
  const drives={extrusion:['haul','cutter'],compounding:['haul','cutter'],sheet:['roll','winder'],castfilm:['winder'],blownfilm:['haul','winder']};
  await check('Previously untested roll, haul and winder selections affect real GLB nodes only',async()=>{
    const cases=[];
    for(const [kind,mechanisms] of Object.entries(drives)){
      const panel=await select(page,kind);
      for(const drive of mechanisms){
        await panel.locator('[data-study-drive]').selectOption(drive);
        await fields(panel,drive==='cutter'?{speed:6,pitch:50,scale:1}:{speed:6,diameter:200,scale:1});await panel.locator('[data-study-run]').click();
        const a=await snapshot(page,kind);
        await page.waitForFunction(elapsed=>PHAEquipmentMotion.getState().study.elapsed>elapsed+.15,a.study.elapsed);
        await panel.locator('[data-study-stop]').click();const b=await snapshot(page,kind);
        assert(b.nodes[drive]?.length,kind+' '+drive+' has no mechanism nodes');
        assert.notDeepEqual(b.nodes[drive],a.nodes[drive],kind+' '+drive+' did not move');
        for(const [group,nodes] of Object.entries(a.nodes))if(group!==drive)assert.deepEqual(b.nodes[group],nodes,kind+' '+drive+' also moved '+group);
        cases.push({kind,drive,rpm:b.study.rpm,elapsed:b.study.elapsed});
      }
    }
    return cases;
  });
  await check('Invalid active study input clears output, stops nodes and remains invalid after locale remount',async()=>{
    const panel=await select(page,'castfilm');await panel.locator('[data-study-drive]').selectOption('winder');
    await fields(panel,{speed:6,diameter:200,scale:1});await panel.locator('[data-study-run]').click();
    await page.waitForFunction(()=>PHAEquipmentMotion.getState().study?.elapsed>.1);
    await fields(panel,{diameter:''});assert.equal(await panel.locator('[data-study-run]').isDisabled(),true);
    assert.doesNotMatch(await panel.locator('.study-result').textContent(),/rpm|°\/s/);
    const held=(await snapshot(page,'castfilm')).nodes;await page.waitForTimeout(150);assert.deepEqual((await snapshot(page,'castfilm')).nodes,held);
    await page.evaluate(()=>setLanguage('en'));const translated=await select(page,'castfilm');
    assert.equal(await translated.locator('[data-study-input="diameter"]').inputValue(),'');
    assert.equal(await translated.locator('[data-study-run]').isDisabled(),true);
    assert.match(await translated.locator('.study-result').textContent(),/Check the input range/);
    await fields(translated,{diameter:200});assert.equal(await translated.locator('[data-study-run]').isDisabled(),false);
    return {invalidOutputCleared:true,motionStopped:true,blankInputRetained:true};
  });
  await check('Injection and blow-molding travel reject invalid velocity without retaining completed output',async()=>{
    for(const kind of ['injection','blowmolding']){
      const panel=await select(page,kind);await panel.locator('[data-study-drive]').selectOption('travel');
      await fields(panel,{stroke:10,velocity:20,scale:1});assert.match(await panel.locator('.study-result').textContent(),/0\.500 s/);
      await fields(panel,{velocity:0});assert.equal(await panel.locator('[data-study-run]').isDisabled(),true);assert.doesNotMatch(await panel.locator('.study-result').textContent(),/0\.500 s/);
      await fields(panel,{velocity:20});
    }
  });
  await check('Calculated motion suspends when the main tab becomes inactive',async()=>{
    const panel=await select(page,'straw');await panel.locator('[data-study-drive]').selectOption('cutter');await fields(panel,{speed:6,pitch:200,scale:1});
    await panel.locator('[data-study-run]').click();await page.waitForFunction(()=>PHAEquipmentMotion.getState().study?.elapsed>.1);
    await page.evaluate(()=>switchTab('calc'));const a=await snapshot(page,'straw');await page.waitForTimeout(150);const b=await snapshot(page,'straw');
    assert.equal(b.frames,a.frames);assert.equal(b.studyPlaying,false);assert.equal(b.visible,false);
    return {framesHeld:true,studyPlaying:false};
  });
  await check('Straw residence calculator clears stale results on edits and preserves inputs across locale',async()=>{
    await page.evaluate(()=>{switchTab('straw');setLanguage('ko');});await page.locator('#sg-tcrit').fill('20');await page.locator('#sg-calc').click();
    assert.equal(await page.locator('#sg-result .calc-result').count(),1);const original=await page.locator('#sg-result').textContent();
    await page.locator('#sg-tcrit').fill('');
    assert.equal(await page.locator('#sg-result .calc-result').count(),0,'Old production output remains after a required input was erased');
    await page.locator('#sg-tcrit').fill('20');await page.locator('#sg-calc').click();await page.locator('#sg-lw').fill('10');
    assert.equal(await page.locator('#sg-result .calc-result').count(),0,'Old result remains after a valid input changed');
    await page.evaluate(()=>setLanguage('en'));assert.equal(await page.locator('#sg-tcrit').inputValue(),'20');assert.equal(await page.locator('#sg-lw').inputValue(),'10');
    assert.equal(await page.locator('#sg-result .calc-result').count(),0);await page.locator('#sg-calc').click();assert.notEqual(await page.locator('#sg-result').textContent(),original);
    return {invalidEditClears:true,validEditClears:true,localeKeepsInputs:true};
  });
  await check('Compounding and straw sub-tabs remain scoped to their own guides',async()=>{
    await page.evaluate(()=>switchTab('compounding'));await page.locator('#cgSubTabs .flash-tab').nth(2).click();
    assert.equal(await page.locator('#cg-tab-2').isVisible(),true);await page.evaluate(()=>switchTab('straw'));
    await page.locator('#strawGuideContainer .flash-tabs .flash-tab').nth(1).click();assert.equal(await page.locator('#straw-tab-1').isVisible(),true);
    await page.evaluate(()=>switchTab('compounding'));assert.equal(await page.locator('#cg-tab-2').isVisible(),true);
    return {compoundingTab:2,strawTab:1};
  });
  await page.evaluate(()=>switchTab('ts'));
  const entry=await page.evaluate(()=>PHATroubleVisualData.entries.find(e=>e.cases.length>1&&e.equipment));
  await check('Keyboard focus remains on the selected troubleshooting case after rerender',async()=>{
    await page.evaluate(id=>PHATroubleVisuals.open(id,{tab:'model'}),entry.kb_id);await page.waitForFunction(()=>PHATroubleVisuals.getState()?.modelState==='ready');
    await page.locator('[data-ts-case="1"]').click();await page.waitForFunction(()=>PHATroubleVisuals.getState()?.modelState==='ready');
    const active=await page.evaluate(()=>({tag:document.activeElement.tagName,id:document.activeElement.id,selected:document.activeElement.dataset.tsCase}));
    assert.equal(active.selected,'1','Selected case lost focus: '+JSON.stringify(active));return active;
  });
  await check('Keyboard focus remains on equipment scope after switching from defect geometry',async()=>{
    await page.locator('[data-ts-context="true"]').click();await page.waitForFunction(()=>PHATroubleVisuals.getState()?.modelState==='ready');
    const active=await page.evaluate(()=>({tag:document.activeElement.tagName,id:document.activeElement.id,selected:document.activeElement.dataset.tsContext}));
    assert.equal(active.selected,'true','Equipment-scope button lost focus: '+JSON.stringify(active));return active;
  });
  await check('Troubleshooting animation pauses and closes when leaving its main tab',async()=>{
    await page.locator('[data-ts-play]').click();await page.waitForFunction(()=>PHATroubleVisuals.getState()?.playing);
    await page.evaluate(()=>switchTab('calc'));await page.waitForFunction(()=>PHATroubleVisuals.getState()===null);
    assert.equal(await page.locator('#tsVisualDialog canvas').count(),0);return {dialogDisposed:true};
  });
  await context.close();
  checks.push({name:'No uncaught browser errors',status:errors.length?'failed':'passed',errors});
}finally{
  await browser.close();server.close();
  const files=['equipment-study.js','equipment-motion.js','injection-motion.js','troubleshooting-visuals.js','straw-guide.js'],hashes={};
  for(const file of files)hashes[file]=createHash('sha256').update(await readFile(resolve(root,file))).digest('hex');
  const report={status:checks.some(c=>c.status==='failed')?'failed':'passed',root:relative(resolve('.'),root)||'.',checks,source_sha256:hashes,
    scope:'Supplementary local-browser connection audit. Existing signed-screw/full-equipment suites were not rerun. No process solver acceptance or production claim. Browser storage is isolated.'};
  await writeFile(resolve('docs/verification/equipment-connections.json'),JSON.stringify(report,null,2)+'\n');
  if(report.status==='failed')process.exitCode=1;
  console.log('EQUIPMENT_CONNECTIONS',report.status,checks.length);
}
