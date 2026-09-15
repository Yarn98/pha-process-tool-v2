const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const guide=require('../flash-guide-data.js');
test('All conditional routes retain bilingual checks, actions, verification, stop criteria and valid source scopes',()=>{
  assert.deepEqual(guide.routes.map(r=>r.id),['inspect','fill','pack','parting','vent','ejector','heat','resistance']);
  for(const r of guide.routes){
    for(const key of ['title','when','check','action','verify','stop'])for(const lang of ['ko','en'])assert.ok(r[key][lang]?.length>8,`${r.id}/${key}/${lang}`);
    assert.ok(r.sources.length);for(const id of r.sources)assert.ok(guide.sources[id],id);
  }
  for(const s of Object.values(guide.sources)){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.scope.ko&&s.scope.en);}
  assert.equal(new Set(guide.checklist.map(x=>x.id)).size,guide.checklist.length);
});
test('Unknown observations do not infer a fill/pack result; local gap and thermal checks remain independent',()=>{
  const window={PHAFlashGuideData:guide};
  vm.runInNewContext(fs.readFileSync('flash-guide.js','utf8'),{window,document:{addEventListener(){} }});
  const routes=selection=>Array.from(window.PHAFlashGuide.routeIds(selection));
  assert.deepEqual(routes({location:'unknown',timing:'unknown',thermal:'none'}),['inspect']);
  assert.deepEqual(routes({location:'vent',timing:'pack',thermal:'heat'}),['vent','pack','heat']);
  assert.deepEqual(routes({location:'ejector',timing:'fill',thermal:'resistance'}),['ejector','fill','resistance']);
  assert.deepEqual(routes({location:'parting',timing:'unknown',thermal:'none'}),['inspect','parting']);
});
test('Browser and Node consume identical reviewed data, with separate grade scope',()=>{
  const browser={window:{}};vm.runInNewContext(fs.readFileSync('flash-guide-data.js','utf8'),browser);
  assert.deepEqual(JSON.parse(JSON.stringify(browser.window.PHAFlashGuideData)),guide);
  assert.match(guide.gradeNotes[0].text.en,/CB0104A|TDS/);
  assert.match(guide.gradeNotes[0].text.en,/not.*universal|not.*PHA/);
  const heat=guide.routes.find(r=>r.id==='heat'),resistance=guide.routes.find(r=>r.id==='resistance');
  assert.notEqual(heat.action.en,resistance.action.en);
});
