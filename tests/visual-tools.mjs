/* Regression checks for the data visualisations added to the editorial UI:
   HMI view of the process conditions, troubleshooting decision flow and grade comparison. */
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root=resolve(process.env.PHA_TEST_ROOT||'.'),out=resolve('output/playwright/visual-tools');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.json':'application/json','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(relative(root,file).startsWith('..')){res.writeHead(403).end();return;}res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true});
const html=await readFile(resolve(root,'index.html'),'utf8'),gate=html.match(/const PASSWORD = ['"]([^'"]+)['"]/);assert.ok(gate);
const checks=[],errors=[];
try{
  const context=await browser.newContext({viewport:{width:1440,height:1050},serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://tars-api.sorisem98.workers.dev/api/grades',r=>r.fulfill({json:[]}));
  await page.goto(origin,{waitUntil:'networkidle'});await page.fill('#passwordGateInput',gate[1]);await page.click('#passwordGateSubmit');

  // HMI panel: entered values only, abnormal status in colour, injection profile on a time axis.
  await page.evaluate(()=>switchTab('proc'));
  await page.selectOption('#grade','CA1180P');await page.selectOption('#process','injection');
  for(const [id,value] of [['f_barrel1','150'],['f_barrel2','165'],['f_barrel3','178'],['f_nozzle','200'],['f_mold','40'],['f_injPressMPa','90'],['f_hold1P','55'],['f_hold1T','3'],['f_hold2P','40'],['f_hold2T','2'],['f_coolTime','20']])await page.fill('#'+id,value);
  const hmi=page.locator('#hmiPanel');
  assert.equal(await hmi.isVisible(),true);
  assert.match(await hmi.locator('.hmi-status').innerText(),/입력값 · 실측 아님[\s\S]*입력 11\/16 · 범위 밖 1/);
  assert.equal(await hmi.locator('.hmi-readout.is-abnormal').count(),1,'only the nozzle (200 °C, reference 175–190 °C) is outside');
  await hmi.locator('[data-hmi-page="inject"]').click();
  const ticks=await hmi.locator('svg text.axis').allTextContents();
  assert.deepEqual(ticks.slice(0,5),['0','25','50','75','100'],'pressure axis uses whole-number steps');
  const svgWidth=await hmi.locator('svg').evaluate(svg=>({attr:Number(svg.getAttribute('width')),shown:svg.getBoundingClientRect().width}));
  assert.ok(Math.abs(svgWidth.attr-svgWidth.shown)<1,'chart drawn at its pixel width, labels not scaled');
  await hmi.locator('[data-hmi-page="temps"]').click();
  assert.equal(await hmi.locator('figure').count(),2,'melt-side zones and tooling on separate axes');
  await hmi.screenshot({path:resolve(out,'hmi-temperatures.png')});
  checks.push('HMI: entered-value tag, single abnormal readout, whole-number pressure axis at pixel width, separate melt/tooling temperature charts');

  // Troubleshooting decision flow: every reviewed entry reachable from the tree; flow quotes that entry.
  await page.evaluate(()=>switchTab('ts'));
  const tree=page.locator('#tsTree');await tree.waitFor({state:'visible'});
  const kb=await page.evaluate(()=>(window.tsData||window.PHA_TROUBLESHOOTING_DATA).map(item=>({id:item.id,process:item.process,diagnostics:item.diagnostics_ko||item.diagnostics})));
  assert.equal(await tree.locator('[data-ts-tree]').count(),kb.length,'every KB entry is in the tree');
  const target=kb[4];
  await tree.locator(`[data-ts-tree="${target.id}"]`).click();
  assert.equal(await tree.locator(`[data-ts-tree="${target.id}"]`).getAttribute('aria-pressed'),'true');
  assert.equal(await tree.locator('.ts-flowchart>li').count(),7,'stop gate, 4 steps and 2 decisions');
  assert.ok((await tree.locator('.ts-node.is-measure').innerText()).includes(target.diagnostics.slice(0,20)),'measurement box quotes the reviewed diagnostics');
  await page.selectOption('#tsProcessFilter','injection');
  const injection=kb.filter(item=>item.process==='injection').length;
  assert.equal(await tree.locator('[data-ts-tree]').count(),injection,'the process filter applies to the tree');
  await page.fill('#tsSearch','zzzz-no-match');assert.equal(await tree.isHidden(),true,'no match hides the flow');
  await page.fill('#tsSearch','');await page.selectOption('#tsProcessFilter','all');
  await tree.screenshot({path:resolve(out,'troubleshooting-flow.png')});
  checks.push('Troubleshooting: all '+kb.length+' reviewed entries in the tree, flow quotes the entry, process filter and search apply');

  // Grade comparison: MFR only within the same test condition; selected grade drawn dark.
  await page.evaluate(()=>switchTab('props'));
  const compare=page.locator('#gradeCompare');await compare.waitFor({state:'visible'});
  const conditions=await page.evaluate(()=>[...new Set(PHAGradeCompare.mfrRows(PHAEvidence.GRADES).map(row=>row.condition))]);
  const titles=await compare.locator('figcaption').allTextContents();
  assert.equal(titles.filter(title=>title.startsWith('MFR · ')).length,conditions.length,'one MFR panel per test condition');
  for(const condition of conditions){
    const panel=compare.locator('figure',{has:page.locator('figcaption',{hasText:'MFR · '+condition})});
    const names=await panel.locator('text.name').allTextContents();
    const expected=await page.evaluate(condition=>PHAGradeCompare.mfrRows(PHAEvidence.GRADES).filter(row=>row.condition===condition).map(row=>row.grade),condition);
    assert.deepEqual(names,expected,'panel '+condition+' holds only grades tested at that condition');
  }
  const s1000=compare.locator('figure',{has:page.locator('figcaption',{hasText:'180 °C / 2.16 kg'})}).locator('.grade-row',{has:page.locator('text.name',{hasText:'S1000P'})});
  assert.equal(await s1000.locator('line.bound').count(),1,'"<4" is drawn as an upper bound, not a point');
  await page.selectOption('#mat_grade','CA1180P');
  assert.ok(await compare.locator('.grade-row.is-selected text.name',{hasText:'CA1180P'}).count()>=2,'selected grade highlighted in every chart it appears in');
  assert.equal(await compare.locator('svg polygon').count(),0,'no radar polygon');
  await compare.screenshot({path:resolve(out,'grade-compare.png')});
  checks.push('Grade comparison: '+conditions.length+' MFR panels by test condition, "<" bounds as bars, selected grade highlighted, no radar');

  // Mobile: no horizontal overflow from the new panels.
  await page.setViewportSize({width:390,height:844});
  for(const tab of ['props','ts','proc']){await page.evaluate(tab=>switchTab(tab),tab);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,tab+' mobile overflow');}
  checks.push('Mobile 390 px: process, troubleshooting and materials tabs without horizontal overflow');
  assert.deepEqual(errors,[]);checks.push('No uncaught browser errors');
  await writeFile(resolve(out,'results.json'),JSON.stringify({status:'pass',checks},null,2)+'\n');
  console.log('VISUAL_TOOLS_OK',checks.length,JSON.stringify(checks));
}finally{await browser.close();server.close();}
