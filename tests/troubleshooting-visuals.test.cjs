const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const data=read('data/troubleshooting_visuals.json'),kb=read('data/troubleshooting_kb.json');
function gltf(file){const bytes=fs.readFileSync(path.join(root,file));assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);return JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8').trim());}
test('16 reviewed KB entries map to 25 bilingual visual cases and identical offline data',()=>{
  assert.equal(data.entries.length,16);assert.equal(data.entries.flatMap(e=>e.cases).length,25);
  assert.deepEqual(new Set(data.entries.map(e=>e.kb_id)),new Set(kb.map(e=>e.id)));
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'troubleshooting-visuals-data.js'),'utf8'),context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.PHATroubleVisualData)),data);
  for(const e of data.entries){const item=kb.find(x=>x.id===e.kb_id);assert.equal(item.review_version,e.kb_review_version||data.kb_review_version);assert.equal(item.related_images.length,e.cases.length);for(const c of e.cases){for(const key of ['label_ko','label_en','caption_ko','caption_en'])assert.ok(c[key]?.trim(),c.id+'/'+key);}}
});
test('all normal, defect and cutaway selections resolve to actual Blender GLB roots',()=>{
  for(const entry of data.entries){
    const model=gltf(entry.model),names=model.scenes[model.scene||0].nodes.map(i=>model.nodes[i].name);
    assert.deepEqual([...names].sort(),[...entry.states].sort(),entry.family);
    for(const c of entry.cases){for(const key of [c.state,c.normal])assert.ok(names.includes(key+'_full'));if(c.section){assert.ok(names.includes(c.state+'_section'));assert.ok(names.includes(c.normal+'_section'));}}
    for(const accessor of model.accessors){for(const bound of [accessor.min,accessor.max].filter(Boolean))assert.ok(bound.every(Number.isFinite),entry.family+' finite bounds');}
    assert.ok(fs.statSync(path.join(root,entry.model)).size<3*1024*1024,entry.family+' model budget');
  }
});
test('new thermoforming rig exports real heater, plug and sheet morph controls',()=>{
  const model=gltf('assets/troubleshooting/thermoforming.glb');
  for(const role of ['heater','plug','sheet'])assert.equal(model.nodes.filter(n=>n.extras?.thermo_part===role).length,3,role);
  assert.equal(model.nodes.filter(n=>n.extras?.thermo_part==='rod').length,3);
  assert.equal(model.nodes.filter(n=>n.extras?.thermo_part==='clamp').length,12);
  const sheets=model.nodes.filter(n=>n.extras?.thermo_part==='sheet');
  for(const sheet of sheets)assert.ok(model.meshes[sheet.mesh].extras.targetNames.includes('Form'));
  const crack=model.nodes.find(n=>n.name==='crack_full'),normal=model.nodes.find(n=>n.name==='normal_full');assert.ok(crack&&normal);
});
test('packaged assets have source provenance, valid hashes and a bounded web payload',()=>{
  const manifest=read('assets/troubleshooting/manifest.json');assert.equal(manifest.version,data.version);
  const unique=new Set();let bytes=0;
  for(const record of manifest.files){assert.ok(!unique.has(record.file));unique.add(record.file);const content=fs.readFileSync(path.join(root,record.file));assert.equal(crypto.createHash('sha256').update(content).digest('hex'),record.sha256);assert.equal(content.length,record.bytes);bytes+=content.length;}
  assert.ok(bytes<10*1024*1024);
  for(const entry of data.entries){assert.ok(unique.has(entry.model));assert.ok(unique.has(entry.thumbnail));for(const img of kb.find(x=>x.id===entry.kb_id).related_images)assert.ok(unique.has(img),img);}
});
test('offline manifest includes every public visual asset and excludes editable originals',()=>{
  const context={self:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'troubleshooting-visuals-sw.js'),'utf8'),context);
  const assets=context.self.PHA_TS_VISUAL_ASSETS;
  for(const entry of data.entries){assert.ok(assets.includes(entry.model));assert.ok(assets.includes(entry.thumbnail));}
  for(const asset of assets){assert.ok(!/\.blend|^art\/|^output\//.test(asset));assert.ok(fs.existsSync(path.join(root,asset)));}
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert.match(sw,/pha-cache-v34-crystallization-history/);assert.match(sw,/PHA_TS_VISUAL_ASSETS\.map/);
});
