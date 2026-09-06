import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root=resolve(process.env.PHA_TEST_ROOT||'.');
const out=resolve('output/playwright');await mkdir(out,{recursive:true});
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');const path=resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(relative(root,path).startsWith('..')){res.writeHead(403).end();return;}const data=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream','cache-control':'no-store'}).end(data);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});
const checks=[];
try {
 const context=await browser.newContext({viewport:{width:1440,height:1050}});
 // Isolated browser fixture: no user storage or external writes.
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const legacy={'PHA_PLA__injection':{mold:[1,2],injSpeed:[55,110]}};
 await page.addInitScript(({legacy})=>{
   if(!sessionStorage.getItem('review-seeded')){
    localStorage.setItem('reco_overrides',JSON.stringify(legacy));
    localStorage.setItem('mat_db',JSON.stringify({CA1180P:{density_g_cm3:1.31},S1000P:{density_g_cm3:1.24}}));
    localStorage.setItem('comp_doe_checklist',JSON.stringify(['s0_0','s0_1','s4_1']));
    localStorage.setItem('comp_trial_log',JSON.stringify([{timestamp:'2026-09-01',notes:'retain-comp-trial'}]));
    localStorage.setItem('pha_hist',JSON.stringify([{ts:'2026-09-01T00:00:00Z',grade:'CA1180P',proc:'injection',params:{mold:40},notes:'retention fixture'}]));
    sessionStorage.setItem('review-seeded','1');
   }
 },{legacy});
 await page.route('https://tars-api.sorisem98.workers.dev/api/grades',route=>route.fulfill({json:[{name:'UNVERIFIED-API',polymer_type:'PHA',tm_c:170}]}));
 await page.goto(origin,{waitUntil:'networkidle'});
 // Use the repo's existing local access gate, without exposing its value in reports.
 const html=await readFile(resolve(root,'index.html'),'utf8');const gate=html.match(/const PASSWORD = ['"]([^'"]+)['"]/);assert.ok(gate);
 await page.locator('#passwordGateInput').fill(gate[1]);await page.locator('#passwordGateSubmit').click();
 await page.waitForSelector('#passwordGate', {state:'hidden'});
 let result=await page.evaluate(()=>({reco:getReco(profileOf('CA1180P'),'injection'),legacy:JSON.parse(localStorage.getItem('reco_overrides')),density:getMatDB().CA1180P.density_g_cm3,hist:JSON.parse(localStorage.getItem('pha_hist'))}));
 assert.deepEqual(result.reco.mold,[40,40]);assert.deepEqual(result.legacy,legacy);assert.equal(result.density,1.31);assert.equal(result.hist[0].notes,'retention fixture');checks.push('manufacturer precedence; legacy ranges, material measurements and history retained');
 await page.selectOption('#grade','CB0104A');assert.match(await page.locator('#f_mold + .range-hint').innerText(),/60–70/);
 await page.selectOption('#grade','A1000P');assert.match(await page.locator('.atlas-evidence').innerText(),/<50 °C/);
 result=await page.evaluate(()=>({unknown:PHA_DATA_BRIDGE.getTempSuggestion('UNVERIFIED-API'),ca:PHA_DATA_BRIDGE.classifyForCompounding('CA1180P'),cb:PHA_DATA_BRIDGE.classifyForCompounding('CB0104A')}));
 assert.equal(result.unknown.barrelPeak,null);assert.equal(result.ca.components.length,0);assert.equal(result.cb.components.length,0);
 await page.selectOption('#grade','UNVERIFIED-API');assert.equal(await page.locator('#f_nozzle').getAttribute('placeholder'),'');checks.push('known grades, compound identity, unknown API material and no Tm-derived setpoints');
 await page.selectOption('#grade','CA1180P');await page.selectOption('#moldMode','high_hdt');assert.match(await page.locator('#f_mold + .range-hint').innerText(),/110–120/);await page.selectOption('#moldMode','general');
 await page.fill('#f_mold','42');await page.locator('[data-lang-choice="en"]').click();assert.equal(await page.locator('#f_mold').inputValue(),'42');assert.match(await page.locator('label[for="f_mold"]').innerText(),/Mold temperature.*°C/);checks.push('mold modes and language switch preserve entered values and units');
 for(const width of [1440,390]){
   await page.setViewportSize({width,height:1050});
   for(const lang of ['ko','en']){
     await page.locator(`[data-lang-choice="${lang}"]`).click();
     for(const proc of ['injection','extrusion','sheet','blownfilm','blowmolding','castfilm']){
       await page.selectOption('#process',proc);
       await page.locator('.atlas-step[data-step="2"]').click();
       assert.equal(await page.locator('.atlas-step[data-step="2"]').getAttribute('aria-pressed'),'true');
       await page.waitForFunction(()=>{const i=document.querySelector('.atlas-visual img');return i.complete&&i.naturalWidth>0;});
       const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,`${width}/${lang}/${proc}: horizontal overflow`);
     }
   }
 }checks.push('24 desktop/mobile x KO/EN x process views: images, stage interactions, no page overflow');
 await page.setViewportSize({width:1440,height:1050});await page.locator('[data-lang-choice="ko"]').click();await page.selectOption('#process','injection');await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(out,'process-desktop-ko.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(out,'process-mobile-ko.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:1050});await page.evaluate(()=>switchTab('calc'));
 for(const [id,value] of Object.entries({kpi_rho:1100,kpi_holdVol:2.5,kpi_rate:15,bf_Q:20,bf_rho:950,bf_D:80,bf_BUR:2.5,bf_v:30,bf_gap:1,cool_t:2,cool_alpha:.12,cool_Tm:170,cool_Tmold:30,cool_Te:60}))await page.locator('#'+id).fill(String(value));
 result=await page.evaluate(()=>{calcResidence();calcBlownFilm();calcCooling();const h=__phaMyAITestHooks;return {res:document.querySelector('#kpi_res_out').textContent,film:document.querySelector('#bf_out').textContent,cool:document.querySelector('#cool_out').textContent,apiFilm:h.calcBlownFilm({}),apiCool:h.calcCooling({}),invalidCool:h.calcCooling({eject_temp_c:10}),clamp:h.calcFlashClamp({avg_pressure_bar:980.665,projected_area_cm2:1}),pressure:h.calcFlashPressure({clamp_tf:1,projected_area_cm2:1,safety_factor:1})};});
 assert.match(result.res,/11\.00/);assert.equal(result.apiFilm.results.thickness_um,result.apiFilm.results.gap_based_thickness_um);assert.ok(result.film.includes(result.apiFilm.results.thickness_um.toFixed(1)));assert.ok(result.cool.includes(result.apiCool.results.cooling_s.toFixed(1)));assert.ok(result.invalidCool.error);assert.equal(result.clamp.results.clamp_tf,1);assert.equal(result.pressure.machine_setpoint,false);checks.push('UI and My AI calculation parity; correct residence units; invalid cooling rejection');
 result=await page.evaluate(()=>{const h=__phaMyAITestHooks;return {units:h.calcResidence({density_kg_m3:1000,holdup_cc:2000,rate_g_s:2}),badMass:h.calcResidence({holdup_kg:Infinity}),badRate:h.calcResidence({rate_kg_h:'invalid'}),badCool:h.calcCooling({initial_polymer_temp_c:Infinity}),badDensity:h.calcShotWeight({part_weight_g:2,runner_weight_g:0,cavity_count:1,density_g_cm3:Infinity})};});
 assert.equal(result.units.results.residence_min,16.667);for(const key of ['badMass','badRate','badCool','badDensity'])assert.ok(result[key].error);checks.push('My AI explicit units override UI defaults; invalid supplied values are rejected');
 await page.evaluate(()=>{switchTab('compounding');cgShowTab(1);switchTab('flash');showFlashTab(2);});
 assert.equal(await page.locator('#cg-tab-1').getAttribute('class').then(c=>c.includes('active')),true);checks.push('Flash subtabs do not deactivate Compounding tabs');
 assert.doesNotMatch(await page.locator('#flash-tab-0').innerText(),/원인은 딱 두|설계 단계에서 차단/);
 await page.evaluate(()=>switchTab('ts'));await page.locator('#defectVisual summary').click();await page.waitForFunction(()=>document.querySelector('#defectVisual img').naturalWidth>0);await page.screenshot({path:resolve(out,'flash-shape-ko.png')});checks.push('generated defect illustration and educational disclosure load');
 // Grade-local override must not change a second grade in the same family.
 await page.evaluate(()=>switchTab('proc'));await page.selectOption('#grade','CA1180P');await page.locator('button[onclick="openRecoEditor()"]').click();await page.fill('#ov_mold_min','41');await page.fill('#ov_mold_max','43');await page.locator('#modalSaveBtn').click();
 assert.match(await page.locator('#f_mold + .range-hint').innerText(),/41–43/);await page.selectOption('#moldMode','high_hdt');assert.match(await page.locator('#f_mold + .range-hint').innerText(),/110–120/);await page.selectOption('#grade','PLA_aPHA_90_10');assert.equal(await page.locator('#f_mold').getAttribute('placeholder'),'');checks.push('range override isolation across grades and mold modes; unsupported blend conditions stay blank');
 await page.selectOption('#grade','CB0400A');await page.selectOption('#process','extrusion');assert.match(await page.locator('#f_die + .range-hint').innerText(),/160–165/);assert.equal(await page.locator('#f_coolingRoll').getAttribute('placeholder'),'');
 await page.selectOption('#process','sheet');assert.equal(await page.locator('#f_die').getAttribute('placeholder'),'');checks.push('CB0400A extrusion die source stays separate from sheet and roll conditions');
 await page.selectOption('#grade','CA1270P');await page.selectOption('#process','blownfilm');assert.match(await page.locator('#f_dieGap + .range-hint').innerText(),/1–1.5/);assert.match(await page.locator('#f_die + .range-hint').innerText(),/160–165/);
 await page.selectOption('#grade','CA1680P');assert.match(await page.locator('.atlas-evidence').innerText(),/<40 °C/);await page.selectOption('#process','sheet');assert.match(await page.locator('.atlas-evidence').innerText(),/25–55/);
 await page.selectOption('#process','blowmolding');assert.equal(await page.locator('#f_blowPressBar').getAttribute('placeholder'),'');assert.match(await page.locator('.atlas-evidence').innerText(),/ISBM.*EBM/);
 result=await page.evaluate(()=>({generic:PHA_DATA_BRIDGE.classifyForCompounding('PHA_PBSA_70_30'),measured:getMatDB().S1000P.density_g_cm3}));assert.equal(result.generic.components.length,0);assert.equal(result.measured,1.24);checks.push('Pro follow-up: film precision, distinct drying, ISBM/EBM scope, generic PHA identity and retained measurement');
 await page.evaluate(()=>switchTab('straw'));assert.equal(await page.locator('#sg-tcrit').inputValue(),'');await page.locator('#sg-calc').click();assert.ok(await page.locator('#sg-result [role="alert"]').count());
 for(const [id,value] of Object.entries({'sg-ls':250,'sg-lw':10,'sg-tcrit':5,'sg-ms':2,'sg-lanes':2,'sg-ntarget':480}))await page.locator('#'+id).fill(String(value));
 await page.locator('#sg-calc').click();let straw=await page.locator('#sg-result').innerText();for(const value of ['960.0','115.20','10.00','5.00'])assert.ok(straw.includes(value));
 await page.locator('[data-lang-choice="en"]').click();assert.equal(await page.locator('#sg-lanes').inputValue(),'2');assert.match(await page.locator('#sg-result').innerText(),/Geometric limit/);checks.push('straw: required trial residence, lane count, mass balance and values preserved across language switch');
 await page.evaluate(()=>{switchTab('compounding');cgShowTab(0);});await page.fill('#cg_h_s1000p','80');await page.fill('#cg_s_a1000p','20');await page.selectOption('#cg-layout','B');assert.match(await page.locator('#cg_result').innerText(),/Type B/);assert.doesNotMatch(await page.locator('#cg_zone_table').innerText(),/25|160|165/);
 await page.fill('#cg_s_a1000p','-1');assert.equal(await page.locator('#cg_result').isVisible(),false);await page.fill('#cg_s_a1000p','10');assert.equal(await page.locator('#cg_result').isVisible(),false);await page.fill('#cg_s_a1000p','20');
 await page.locator('[data-lang-choice="ko"]').click();assert.equal(await page.locator('#cg_h_s1000p').inputValue(),'80');assert.equal(await page.locator('#cg-layout').inputValue(),'B');checks.push('compounding: invalid/incomplete composition gate; explicit layout selection; no invented zone settings; language retention');
 result=await page.evaluate(()=>({checks:JSON.parse(localStorage.getItem('comp_doe_checklist')),trial:JSON.parse(localStorage.getItem('comp_trial_log')),old:document.querySelector('#cg_chk_s0_0').checked,new:document.querySelector('#cg_chk_matrix-review-v2').checked}));assert.deepEqual(result.checks,['s0_0','s0_1','s4_1']);assert.equal(result.trial[0].notes,'retain-comp-trial');assert.equal(result.old,true);assert.equal(result.new,false);checks.push('existing compounding trial/checklist preserved; revised meaning does not reuse an old completion');
 for(const width of [1440,390]){await page.setViewportSize({width,height:1050});for(const lang of ['ko','en']){await page.locator(`[data-lang-choice="${lang}"]`).click();for(const section of ['compounding','straw']){await page.evaluate(section=>switchTab(section),section);await page.waitForFunction(section=>{const img=document.getElementById(section==='straw'?'strawGuideContainer':'compGuideContainer')?.querySelector('.guide-equipment img');return img?.complete&&img.naturalWidth>0;},section);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,`${width}/${lang}/${section}: overflow`);}}}checks.push('8 additional desktop/mobile x KO/EN compounding/straw views');
 await page.evaluate(()=>{switchTab('flash');showFlashTab(Number(document.getElementById('flash-pack-r1').closest('.flash-content').id.split('-').pop()));});
 assert.equal(await page.locator('#flash-pack-r1').inputValue(),'');
 result=await page.evaluate(()=>({missing:__phaMyAITestHooks.calcFlashPacking({peak_pressure_bar:1000}),shear:__phaMyAITestHooks.calcFlashShear({flow_cm3_s:1000,runner_radius_cm:.01})}));
 assert.ok(result.missing.error);assert.equal('status' in result.shear.results,false);
 await page.fill('#flash-p-inj-peak','1000');await page.fill('#flash-pack-r1','40');await page.fill('#flash-pack-r2','20');
 await page.evaluate(()=>calculateFlashPackingPressure());assert.match(await page.locator('#flash-packing-value').innerText(),/P1: 400 bar/);
 result=await page.evaluate(()=>__phaMyAITestHooks.calcFlashPacking({}));assert.deepEqual(result.results,{p1_bar:400,p2_bar:200});
 await page.locator('[data-lang-choice="ko"]').click();assert.equal(await page.locator('#flash-pack-r1').inputValue(),'40');
 await page.evaluate(()=>switchTab('proc'));await page.selectOption('#grade','CA1180P');await page.evaluate(()=>{switchTab('flash');showFlashTab(Number(document.getElementById('partWeight').closest('.flash-content').id.split('-').pop()));});
 for(const [id,value] of Object.entries({partWeight:2,runnerWeight:8,cavityCount:36}))await page.fill('#'+id,String(value));
 await page.locator('button[onclick="loadDensityFromGrade()"]').click();assert.equal(await page.locator('#materialDensity').inputValue(),'1.31');assert.equal(await page.locator('#totalShotWeight').innerText(),'80.00');
 await page.fill('#cavityCount','1.5');await page.evaluate(()=>calculateShotWeight());assert.equal(await page.locator('#shotWeightResult').isVisible(),false);
 await page.fill('#cavityCount','36');await page.fill('#materialDensity','');await page.evaluate(()=>calculateShotWeight());assert.equal(await page.locator('#shotVolume').innerText(),'—');
 result=await page.evaluate(()=>__phaMyAITestHooks.calcShotWeight({part_weight_g:2,runner_weight_g:8,cavity_count:36}));assert.equal(result.results.solid_volume_cm3,null);
 checks.push('UI/My AI packing ratios, no shear safety label, language retention and measured-density lookup/unknown-density handling');
 await page.locator('[data-lang-choice="en"]').click();
 await page.evaluate(()=>switchTab('ts'));await page.selectOption('#tsProcessFilter','blowmolding');assert.match(await page.locator('#tsContainer').innerText(),/Parison/);assert.doesNotMatch(await page.locator('#tsContainer').innerText(),/Short shot/);
 await page.selectOption('#tsProcessFilter','all');await page.fill('#tsSearch','Karl Fischer');assert.match(await page.locator('#tsContainer').innerText(),/not a substitute/);await page.fill('#tsSearch','');
 const liveKB=await page.evaluate(()=>window.tsData);await page.route('**/data/troubleshooting_kb.json',route=>route.abort());await page.evaluate(()=>loadTroubleshootingKB());assert.deepEqual(await page.evaluate(()=>window.tsData),liveKB);checks.push('process/search filters and identical embedded KB when JSON fetch fails');
 await page.evaluate(()=>switchTab('proc'));
 await page.evaluate(()=>switchTab('calc'));await page.fill('#bf_gap','');
 result=await page.evaluate(()=>({missing:__phaMyAITestHooks.calcBlownFilm({}),invalid:__phaMyAITestHooks.calcBlownFilm({die_gap_mm:Infinity})}));assert.ok(result.missing.results.thickness_um>0);assert.ok(result.invalid.error);checks.push('missing film gap and invalid supplied gap remain distinct in My AI');
 await page.setViewportSize({width:1440,height:1050});await page.locator('[data-lang-choice="ko"]').click();
 for(const section of ['compounding','straw']){await page.evaluate(section=>switchTab(section),section);await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(section=>{const panel=document.getElementById(section);const img=panel?.querySelector('.guide-equipment img');return panel&&getComputedStyle(panel).opacity==='1'&&img?.complete&&img.naturalWidth>0;},section);await page.screenshot({path:resolve(out,section+'-review-ko.png'),fullPage:false,animations:'disabled'});}
 await page.evaluate(()=>switchTab('proc'));
 // Exercise the real service worker against the built/static app, without network availability.
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);await page.reload({waitUntil:'load'});
 await page.waitForFunction(()=>document.querySelector('.atlas-visual img')?.naturalWidth>0);
 await page.selectOption('#process','blownfilm');await page.waitForFunction(()=>document.querySelector('.atlas-visual img')?.naturalWidth>0);
 assert.match(await page.locator('.atlas-explanation').innerText(),/토출량|output/);checks.push('real service-worker offline reload and second equipment view');
 assert.equal(await page.evaluate(()=>window.tsData.length),16);await page.evaluate(()=>switchTab('straw'));assert.equal(await page.locator('#sg-tcrit').inputValue(),'');checks.push('offline reload retains reviewed KB and does not supply a default crystallization time');
 const fresh=await browser.newContext();const freshPage=await fresh.newPage();
 await freshPage.route('https://tars-api.sorisem98.workers.dev/api/grades',route=>route.fulfill({json:[]}));
 await freshPage.goto(origin,{waitUntil:'networkidle'});
 const freshMaterials=await freshPage.evaluate(()=>({s:getMatDB().S1000P,a:getMatDB().A1000P}));
 assert.equal(freshMaterials.s.density_g_cm3,1.23);assert.equal(freshMaterials.a.density_g_cm3,1.23);assert.equal(freshMaterials.a.Tm_C,null);
 await fresh.close();checks.push('fresh-install material defaults do not override source data with old placeholders');
 assert.deepEqual(errors,[]);checks.push('no uncaught browser errors');
 await writeFile(resolve(out,'process-review-results.json'),JSON.stringify({status:'pass',checks},null,2));console.log(JSON.stringify({status:'pass',checks},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
