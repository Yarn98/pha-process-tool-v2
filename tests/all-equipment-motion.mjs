import { createServer } from 'node:http';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve,relative,extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
// Real-scale GLBs (up to ~4 MB) load and compile slowly on software WebGL; 30 s was intermittently tight.
const MODEL_READY_MS=90000;

const root=resolve(process.env.PHA_TEST_ROOT||'.'),out=resolve('output/playwright/all-equipment');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.json':'application/json','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(relative(root,file).startsWith('..')){res.writeHead(403).end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const html=await readFile(resolve(root,'index.html'),'utf8'),gate=html.match(/const PASSWORD = ['"]([^'"]+)['"]/);assert.ok(gate);
const checks=[],errors=[];
async function open(context){const page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));await page.route('https://tars-api.sorisem98.workers.dev/api/grades',route=>route.fulfill({json:[]}));await page.goto(origin,{waitUntil:'networkidle'});await page.fill('#passwordGateInput',gate[1]);await page.click('#passwordGateSubmit');return page;}
async function select(page,kind,expected='ready'){
  if(['straw','compounding'].includes(kind))await page.evaluate(kind=>switchTab(kind),kind);
  else{await page.evaluate(()=>switchTab('proc'));await page.selectOption('#process',kind);}
  const panel=page.locator(`.tabpage.active [data-equipment-model="${kind}"]`);
  await panel.scrollIntoViewIfNeeded();
  await page.waitForFunction(kind=>{const el=document.querySelector(`.tabpage.active [data-equipment-model="${kind}"]`);return ['ready','fallback'].includes(el?.dataset.motionState);},kind,{timeout:MODEL_READY_MS});
  const data=await page.evaluate(()=>__phaEquipmentTest());
  assert.equal(await panel.getAttribute('data-motion-state'),expected,kind+': '+(data.error||'model state'));
  return panel;
}
async function jog(page,panel,key,value){
  await panel.locator(`[data-eq-axis="${key}"]`).evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await page.waitForFunction(key=>{const s=PHAEquipmentMotion.getState();return Math.abs(s.actual[key]-s.target[key])<.001;},key);
}
try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),page=await open(context);
  for(const kind of ['extrusion','sheet','castfilm','blownfilm','compounding','straw','blowmolding']){
    let panel=await select(page,kind),data=await page.evaluate(()=>__phaEquipmentTest());
    const controls=await page.evaluate(kind=>PHAEquipmentModels[kind].controls,kind);
    const duration=await page.evaluate(kind=>PHAEquipmentModels[kind].duration,kind);
    for(const control of controls){
      assert.ok(data.groups[control.key]?.tracks>0,kind+'/'+control.key+' real Blender tracks');
      assert.ok(Math.abs(data.groups[control.key].duration-duration)<.001,kind+'/'+control.key+' starts at zero and reaches the configured endpoint');
    }
    assert.equal(await page.locator('.motion-viewport canvas').count(),1,'Only the active machine owns a canvas');
    assert.ok(data.cached.length<=2,'Bounded GLB cache');
    await panel.locator('[data-eq="play"]').click();const first=data.time;
    await page.waitForFunction(first=>PHAEquipmentMotion.getState().time>first+.1,first);
    await panel.locator('[data-eq="play"]').click();
    // Every line's screw is a right-handed kit helix: it turns negatively about +X to convey toward the die.
    const afterPlay=await page.evaluate(()=>__phaEquipmentTest()),forwardSign=-1;
    const signedX=q=>2*Math.atan2(q[0],q[3]);
    const rotationStep=(a,b)=>Math.atan2(Math.sin(signedX(b)-signedX(a)),Math.cos(signedX(b)-signedX(a)));
    assert.ok(forwardSign*rotationStep(data.nodes.screw[0].rotation,afterPlay.nodes.screw[0].rotation)>0,kind+' automatic screw rotation matches its helix and feed-to-die direction');
    if(kind==='compounding'){
      const screws=afterPlay.nodes.screw.filter(node=>['ScrewA','ScrewB'].includes(node.name));assert.equal(screws.length,2);
      for(const node of screws)assert.ok(rotationStep(data.nodes.screw.find(before=>before.name===node.name).rotation,node.rotation)<0,'Both compounding screws co-rotate forward during playback');
    }
    await panel.locator('[data-eq="manual"]').click();
    if(kind==='blowmolding'){
      assert.equal(await panel.locator('[data-eq-axis="inflate"]').isDisabled(),true);
      await jog(page,panel,'parison',100);await jog(page,panel,'mold',0);await jog(page,panel,'pin',100);
      assert.equal(await panel.locator('[data-eq-axis="mold"]').isDisabled(),true);
      await jog(page,panel,'mold',100);assert.equal((await page.evaluate(()=>PHAEquipmentMotion.getState())).target.mold,0,'Cannot open mold with inserted pin');
      await jog(page,panel,'inflate',50);data=await page.evaluate(()=>__phaEquipmentTest());
      const expanding=data.nodes.inflate.find(node=>node.name==='FormedBottle');
      assert.ok(expanding.morph[0]>.45&&expanding.morph[0]<.55,'Real bottle mesh morphs from the parison profile');
      const blow=await page.evaluate(()=>PHAEquipmentModels.blowmolding.blow);
      assert.ok(expanding.world.every((value,i)=>Math.abs(value-blow.bottle[i])<.001),'Bottle stays in the mould at the blow station, in world coordinates');
      await jog(page,panel,'inflate',100);data=await page.evaluate(()=>__phaEquipmentTest());
      assert.ok(data.nodes.inflate.find(node=>node.name==='FormedBottle').morph[0]>.999);
      assert.ok(data.nodes.inflate.some(node=>node.scale[0]>.99&&node.visible));
      await panel.screenshot({path:resolve(out,'blowmolding-expanded.png')});
      await jog(page,panel,'pin',0);await jog(page,panel,'mold',100);
      data=await page.evaluate(()=>__phaEquipmentTest());assert.equal(data.released,true);assert.ok(data.drop>.99);
      assert.ok(data.nodes.release.some(node=>node.visible&&Math.abs(node.position[1]-blow.release.to[1])<.01),'Released bottle lands on the take-out conveyor');
      checks.push('Blow molding: parison, clamp, pin, inflation and product release interlocks affect real nodes');
    }else{
      for(const control of controls){
        const before=(await page.evaluate(()=>__phaEquipmentTest())).nodes[control.key];
        await jog(page,panel,control.key,control.unit==='°'?91:37.5);
        const after=(await page.evaluate(()=>__phaEquipmentTest())).nodes[control.key];
        assert.notDeepEqual(after,before,kind+'/'+control.key+' changes real mesh/bone transforms');
        if(control.key==='screw'){
          const a=2*Math.atan2(after[0].rotation[0],after[0].rotation[3]);
          assert.ok(Math.abs(a-forwardSign*91*Math.PI/180)<.025,kind+' manual screw angle increases in the forward direction');
          if(kind==='compounding')for(const node of after.filter(node=>['ScrewA','ScrewB'].includes(node.name)))assert.ok(Math.abs(2*Math.atan2(node.rotation[0],node.rotation[3])+91*Math.PI/180)<.025,'Both compounding screws follow manual forward angle');
        }
        if(kind==='compounding'&&control.key==='side'){
          // Each side-feeder screw turns about its own axis by the commanded angle, in the sense that the
          // Blender check proves conveys toward the main barrel. q_rel = conj(rest) * current, in the local frame.
          for(const name of ['SideScrewA','SideScrewB']){
            const [ax,ay,az,aw]=before.find(node=>node.name===name).rotation,[bx,by,bz,bw]=after.find(node=>node.name===name).rotation;
            const rel=[aw*bx-ax*bw-ay*bz+az*by,aw*by+ax*bz-ay*bw-az*bx,aw*bz-ax*by+ay*bx-az*bw,aw*bw+ax*bx+ay*by+az*bz];
            assert.ok(Math.abs(rel[1])<1e-3&&Math.abs(rel[2])<1e-3,name+' turns about its own axis');
            assert.ok(Math.abs(2*Math.atan2(rel[0],rel[3])+91*Math.PI/180)<.025,name+' follows the manual angle in its conveying sense');
          }
        }
      }
      const firstAxis=panel.locator('[data-eq-axis="'+controls[0].key+'"]');
      await firstAxis.focus();await page.keyboard.press('ArrowRight');
      const afterKey=await page.evaluate(()=>PHAEquipmentMotion.getState());assert.equal(afterKey.target[controls[0].key],92);
      checks.push(kind+': real motion, independent manual mechanisms and keyboard precision');
    }
    await panel.locator('[data-eq="focus"]').selectOption('finish');
    data=await page.evaluate(()=>__phaEquipmentTest());assert.ok(data.camera.zoom>1);
    const held={...data.actual};await page.locator('[data-lang-choice="en"]').click();panel=await select(page,kind);
    assert.deepEqual((await page.evaluate(()=>PHAEquipmentMotion.getState())).actual,held,kind+' language preserves manual axes');
    await panel.locator('[data-eq="view"]').click();await panel.screenshot({path:resolve(out,kind+'-desktop.png')});
    await page.setViewportSize({width:390,height:844});await page.locator('[data-lang-choice="ko"]').click();panel=await select(page,kind);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,kind+' mobile overflow');
    assert.equal(await page.locator('.fab').isVisible(),false,kind+' floating save does not obscure controls');
    assert.equal(await page.locator('#mobileTabBar').isVisible(),false,kind+' bottom navigation does not cover manual controls');
    const lastAxis=panel.locator('[data-eq-axis]:enabled').last();
    await lastAxis.evaluate(input=>input.scrollIntoView({block:'center',behavior:'instant'}));
    const visible=await panel.evaluate(panel=>{const model=panel.querySelector('.motion-viewport').getBoundingClientRect(),axis=[...panel.querySelectorAll('[data-eq-axis]:enabled')].at(-1).getBoundingClientRect();return {modelTop:model.top,modelBottom:model.bottom,axisMid:axis.top+axis.height/2,height:innerHeight};});
    assert.ok(visible.modelTop>=40&&visible.modelBottom<visible.axisMid&&visible.axisMid<visible.height-20,kind+' keeps the model visible above the active mobile slider: '+JSON.stringify(visible));
    if(kind==='straw')await page.screenshot({path:resolve(out,'straw-mobile-controls-visible.png')});
    await panel.screenshot({path:resolve(out,kind+'-mobile.png')});
    await panel.locator('[data-eq="reset"]').click();await panel.locator('[data-eq="manual"]').click();
    await page.setViewportSize({width:1440,height:1100});
  }
  checks.push('All seven lines: Korean/English, mobile model visible during manipulation, manual state retention, focus views and resets');
  // The process atlas and the blow-moulding rig's own stage segments describe the same re-based cycle.
  await select(page,'blowmolding');
  for(const step of [0,1,2,3]){
    await page.locator(`.atlas-step[data-step="${step}"]`).click();
    assert.equal((await page.evaluate(()=>PHAEquipmentMotion.getState())).phase,step,'atlas step '+step+' seeks the matching blow-moulding stage');
  }
  checks.push('Blow molding: each process-atlas step seeks the matching stage of the re-based cycle');
  // Zone heat maps: process-tab lines colour their zones from the process form against the grade reference;
  // compounding takes set points typed into the panel (no reference), straw too (against the CB0400A source).
  // Missing values hatch, outside values outline.
  // Few line processes have an audited reference, so the bands come from the app's own user-edit path (reco_overrides).
  await page.evaluate(()=>switchTab('proc'));await page.selectOption('#grade','CA1180P');
  for(const kind of ['extrusion','sheet','castfilm','blownfilm','blowmolding','compounding','straw']){
    const panel=await select(page,kind),heat=await page.evaluate(kind=>PHAEquipmentModels[kind].heat,kind);
    const fields=[...new Set(heat.zones.map(zone=>zone.field))],keysOf=field=>heat.zones.filter(zone=>zone.field===field).map(zone=>zone.key);
    await panel.locator('[data-eq="heat"]').click();
    let data=await page.evaluate(()=>__phaEquipmentTest());
    assert.equal(data.heat.on,true);assert.equal(await panel.locator('.motion-heat').isVisible(),true,kind+' heat panel shown');
    assert.equal(await panel.locator('.heat-zone').count(),fields.length,kind+' one panel row per input field');
    for(const zone of heat.zones)assert.ok(data.heat.zones[zone.key]?.visible,kind+'/'+zone.key+' overlay mesh shown in the model');
    if(heat.input==='process'){
      const [inside,missing]=fields,outside=fields.at(-1);
      await page.evaluate(({kind,inside,outside})=>{
        const grade=document.getElementById('grade').value,key=PHAEvidence.overrideKey(grade,kind,document.getElementById('moldMode')?.value);
        const overrides=JSON.parse(localStorage.getItem('reco_overrides')||'{}');overrides[key]={[inside]:[170,190],[outside]:[30,50]};
        localStorage.setItem('reco_overrides',JSON.stringify(overrides));
      },{kind,inside,outside});
      await page.fill('#f_'+inside,'180');await page.fill('#f_'+outside,'90');await page.fill('#f_'+missing,'');
      data=await page.evaluate(()=>__phaEquipmentTest());
      for(const key of keysOf(inside))assert.ok(!data.heat.zones[key].hatched&&!data.heat.zones[key].outline,kind+'/'+key+' in range: coloured, no outline');
      for(const key of keysOf(outside))assert.ok(!data.heat.zones[key].hatched&&data.heat.zones[key].outline,kind+'/'+key+' outside the reference: outlined');
      for(const key of keysOf(missing))assert.ok(data.heat.zones[key].hatched,kind+'/'+key+' not entered: hatched');
      assert.notEqual(data.heat.zones[keysOf(inside)[0]].color,data.heat.zones[keysOf(outside)[0]].color,kind+' different set points, different colours');
      assert.ok(await panel.locator('.heat-zone.is-ok').count()>=1&&await panel.locator('.heat-zone.is-empty').count()>=1,kind+' panel statuses');
    }else if(kind==='compounding'){
      const input=panel.locator('[data-heat-field="B2"]');await input.fill('205');
      data=await page.evaluate(()=>__phaEquipmentTest());
      assert.ok(!data.heat.zones.B2.hatched&&!data.heat.zones.B2.outline&&data.heat.zones.B3.hatched,'Compounding: typed block coloured, empty block hatched, no reference outline');
      assert.equal(await input.inputValue(),'205','typing keeps the panel input');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pha_heat_compounding')).B2),'205');
      assert.match(await panel.locator('.heat-zone').first().innerText(),/참고 범위 없음/);
    }else{
      // Straw: zone 1 inside the CB0400A solid-conveying stage (165-175 C), zone 3 above metering (165 C), head empty.
      await panel.locator('[data-heat-field="zone1"]').fill('170');await panel.locator('[data-heat-field="zone3"]').fill('185');
      data=await page.evaluate(()=>__phaEquipmentTest());
      assert.ok(!data.heat.zones.Z1.hatched&&!data.heat.zones.Z1.outline,'straw zone 1 in the source range');
      assert.ok(data.heat.zones.Z3.outline&&data.heat.zones.die.hatched,'straw zone 3 outlined above metering; empty head hatched');
      assert.match(await panel.locator('.heat-zone').first().innerText(),/참고 25–40 °C/);
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pha_heat_straw')).zone3),'185');
    }
    if(kind==='blowmolding'){
      assert.equal(data.heat.zones.mold_a.parent,'MoldLeft');assert.equal(data.heat.zones.mold_b.parent,'MoldRight');
      // Cycle chart: one bar per step; pressing the chart at 3 s seeks there and marks the hold-and-cool step.
      const chart=panel.locator('.motion-cycle');assert.equal(await chart.isVisible(),true,'blow-moulding cycle chart shown');
      assert.equal(await chart.locator('.cycle-bar').count(),await page.evaluate(()=>PHAEquipmentModels.blowmolding.steps.length));
      const svg=chart.locator('svg');await svg.scrollIntoViewIfNeeded();
      const box=await svg.boundingBox(),width=Number(await svg.getAttribute('width'));
      await svg.click({position:{x:(84+3/12*(width-84-12))*box.width/width,y:box.height/2}});
      const state=await page.evaluate(()=>PHAEquipmentMotion.getState());assert.ok(Math.abs(state.time-3)<.1&&state.mode==='cycle','chart press seeks the cycle: '+state.time);
      data=await page.evaluate(()=>__phaEquipmentTest());
      for(const step of ['보압·냉각','금형 닫힘 유지','패리슨 연속 성장'])assert.ok(data.chart.now.some(title=>title.startsWith(step)),'active at 3 s: '+step);
      await chart.screenshot({path:resolve(out,'blowmolding-cycle.png')});
    }
    await panel.screenshot({path:resolve(out,kind+'-heat.png')});
    await panel.locator('[data-eq="heat"]').click();
    assert.equal((await page.evaluate(()=>__phaEquipmentTest())).heat.zones[heat.zones[0].key].visible,false,kind+' heat overlay hides again');
  }
  checks.push('Heat maps on all seven lines: form or panel set points colour real zone meshes, missing values hatch, out-of-reference values outline (straw against CB0400A); mould overlays ride the moving halves');
  checks.push('Blow molding: cycle chart lanes match the timeline and seek the player');
  // Straw: real-scale four-lane line, one knife, 60 straws/min per lane at 12 m/min and 200 mm.
  let panel=await select(page,'straw');const straw=await page.evaluate(()=>PHAEquipmentModels.straw);
  assert.equal(straw.teaching.lanes,4);assert.equal(straw.cut_edges,1);assert.equal(straw.teaching.straws_per_min.lane,60);
  assert.equal(straw.source,undefined,'no borrowed rig metadata left');
  await panel.locator('[data-eq="play"]').click();await page.waitForFunction(()=>PHAEquipmentMotion.getState().visible);
  await page.evaluate(()=>switchTab('calc'));const heldTime=(await page.evaluate(()=>PHAEquipmentMotion.getState())).time;
  await page.waitForTimeout(250);assert.equal((await page.evaluate(()=>PHAEquipmentMotion.getState())).time,heldTime);
  checks.push('Straw line rate metadata and rendering suspension on inactive tabs');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload({waitUntil:'load'});
  for(const kind of ['straw','sheet','blownfilm'])await select(page,kind);
  checks.push('Offline service-worker reload loads the straw, roll and bubble GLBs');
  await context.close();
  const failContext=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce'});await failContext.route('**/sheet-motion.glb*',route=>route.abort());
  const failPage=await open(failContext),fallback=await select(failPage,'sheet','fallback');assert.equal(await fallback.locator('.motion-poster').isVisible(),true);
  await failPage.locator('.atlas-step[data-step="2"]').click();assert.equal(await failPage.locator('.atlas-step[data-step="2"]').getAttribute('aria-pressed'),'true');
  await select(failPage,'extrusion');await failContext.close();checks.push('A failed model retains its poster and explanations; another machine still loads');
  assert.deepEqual(errors,[]);checks.push('No uncaught browser errors');
  await writeFile(resolve(out,'results.json'),JSON.stringify({status:'pass',root,checks},null,2));console.log(JSON.stringify({status:'pass',checks},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
