const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('the offline fallback is the same reviewed bilingual knowledge base',()=>{
  const canonical=JSON.parse(fs.readFileSync(path.join(root,'data/troubleshooting_kb.json'),'utf8'));
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'troubleshooting-data.js'),'utf8'),context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.PHA_TROUBLESHOOTING_DATA)),canonical);
  assert.equal(new Set(canonical.map(d=>d.id)).size,canonical.length);
  const processes=new Set(canonical.map(d=>d.process));
  for(const p of ['injection','extrusion','sheet_film','blownfilm','blowmolding','castfilm','compounding','straw'])assert.ok(processes.has(p),p);
  for(const d of canonical){
    for(const key of ['symptom','diagnostics','notes','stop_conditions']){
      assert.ok(d[key]?.trim(),`${d.id}/${key}`);assert.ok(d[key+'_ko']?.trim(),`${d.id}/${key}_ko`);
    }
    for(const key of ['quick_fixes','root_fixes']){
      assert.ok(d[key].length>0);assert.equal(d[key].length,d[key+'_ko'].length);
    }
    assert.equal(d.evidence_level,'conditional_engineering_guidance');
    assert.ok(d.sources.every(s=>s.url.startsWith('https://')&&s.scope));
  }
});
