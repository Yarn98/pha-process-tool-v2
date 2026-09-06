const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../process-evidence.js');
test('clamping force uses exact SI conversion and its inverse',()=>{
  assert.equal(core.clamp(980.665,1).tf,1);
  assert.equal(core.cavityPressure(1,1,1).bar,980.665);
  assert.ok(core.clamp(-1,200).error);
  assert.ok(core.cavityPressure(200,0,.8).error);
  assert.ok(core.cavityPressure(200,100,1.2).error);
});
test('film estimate conserves mass, uses one wall, and gap cross-check agrees',()=>{
  const r=core.blownFilm(20,950,80,2.5,30,1);
  const massPerHour=r.thickness_um*1e-6 * Math.PI*.08*2.5 * 30*60 * 950;
  assert.ok(Math.abs(massPerHour-20)<1e-10);
  assert.ok(Math.abs(r.gap_based_thickness_um-r.thickness_um)<1e-10);
  assert.equal(core.blownFilm(40,950,80,2.5,30).thickness_um,2*r.thickness_um);
  for(const bad of [0,-1,Infinity,NaN])assert.ok(core.blownFilm(20,950,80,bad,30).error);
  assert.ok(core.blownFilm(20,950,80,2.5,30,0).error);
  assert.ok(core.blownFilm(20,950,80,2.5,30,Infinity).error);
  assert.ok(core.blownFilm(20,950,80,2.5,30,NaN).error);
  assert.ok(!core.blownFilm(20,950,80,2.5,30).error);
});
test('cooling respects temperature ordering and the slab diffusion solution',()=>{
  assert.ok(core.cooling(2,.12,170,60,30).error);
  assert.ok(core.cooling(2,.12,170,30,30).error);
  assert.ok(core.cooling(-2,.12,170,30,60).error);
  assert.ok(core.cooling(2,.12,170,0,60).seconds>0);
  const a=core.cooling(2,.12,170,30,60).seconds;
  const b=core.cooling(4,.12,170,30,60).seconds;
  assert.ok(Math.abs(b/a-4)<1e-12);
  // Independent full Fourier series at the predicted centreline time.
  let theta=0;for(let k=0;k<30;k++)theta+=4/Math.PI * (-1)**k/(2*k+1)*Math.exp(-(((2*k+1)*Math.PI)**2)*.12*a/4);
  assert.ok(Math.abs(theta-(60-30)/(170-30))<1e-6);
});
test('manufacturer references do not cross grade, process, or mold mode',()=>{
  assert.deepEqual(core.reference('CA1180P','injection','general').ranges.mold,[40,40]);
  assert.deepEqual(core.reference('CA1180P','injection','high_hdt').ranges.mold,[110,120]);
  assert.deepEqual(core.reference('CB0104A','injection').ranges.mold,[60,70]);
  assert.deepEqual(core.reference('CB0104A','sheet').ranges,{});
  assert.deepEqual(core.reference('CB0400A','injection').ranges,{});
  assert.deepEqual(core.reference('CB0400A','extrusion').ranges,{die:[160,165]});
  assert.deepEqual(core.reference('CB0400A','sheet').ranges,{});
  assert.equal(core.reference('S1000P','injection').ranges.barrel1,undefined);
  assert.deepEqual(core.reference('CB0400A','straw').ranges.waterBath,[70,75]);
  assert.deepEqual(core.reference('UNKNOWN','injection').ranges,{});
  assert.equal(core.GRADES.A1000P.drying.temperature,'<50 °C');
  assert.equal(core.GRADES.CA1180P.drying.temperature,'<60 °C');
  assert.equal(core.GRADES.CA1180P.drying.hours,'>5 h');
  assert.equal(core.GRADES.CA1680P.drying.temperature,'<40 °C');
  assert.equal(core.GRADES.CA1680P.drying.hours,'>12 h');
  assert.deepEqual(core.reference('CA1165A','injection').ranges.mold,[110,120]);
  assert.deepEqual(core.reference('CA1670P','blowmolding').ranges,{});
  assert.deepEqual(core.reference('CA1680','sheet').ranges,{});
  const film=core.reference('CA1270P','blownfilm');
  assert.deepEqual(film.ranges.dieGap,[1,1.5]);
  assert.equal(film.fields.dieGap.unit,'mm');
  assert.equal(film.fields.dieGap.page,2);
  assert.equal(film.fields.dieGap.field_validated,false);
  assert.match(core.GRADES.A1000P.mfr,/165 °C \/ 5 kg/);
});
test('straw geometry counts lanes without inferring temperature or crystallization',()=>{
  const one=core.strawCapacity(250,10,5,2,1,480);
  assert.equal(one.lineSpeed_m_min,120);
  assert.equal(one.total_per_min,480);
  assert.ok(Math.abs(one.mass_kg_h-57.6)<1e-10);
  const two=core.strawCapacity(250,10,5,2,2,480);
  assert.equal(two.total_per_min,960);
  assert.equal(two.lineSpeed_m_min,one.lineSpeed_m_min);
  assert.equal(two.targetResidence_s,10);
  assert.equal(two.requiredBath_m,5);
  assert.equal('temperature' in two,false);
  for(const v of [0,-1,NaN,Infinity])assert.ok(core.strawCapacity(250,10,v,2,1).error);
  assert.ok(core.strawCapacity(250,10,5,2,1.5).error);
  assert.ok(core.strawCapacity(250,10,5,2,1,-1).error);
});
test('range status cannot imply physical safety through a unit-free threshold',()=>{
  assert.equal(core.status('0',[0,1]),'ok');
  assert.equal(core.status('1000',[0,1]),'warn');
  assert.equal(core.status('',[0,1]),'empty');
  assert.equal(core.status(100), 'unknown');
  assert.equal(core.status(100,[101,99]), 'unknown');
  assert.equal(core.status(100,[100]), 'unknown');
  assert.equal(core.status(Infinity,[0,1]),'invalid');
});
test('shear and packing are calculations, with no assumed process limits or ratios',()=>{
  assert.ok(Math.abs(core.apparentShear(Math.PI,.5).rate_s_1-32)<1e-10);
  assert.ok(core.apparentShear(Infinity,.5).error);
  assert.deepEqual(core.packingPressures(1000,40,20),{p1_bar:400,p2_bar:200});
  assert.deepEqual(core.packingPressures(1000,0,0),{p1_bar:0,p2_bar:0});
  assert.ok(core.packingPressures(1000,undefined,20).error);
  assert.ok(core.packingPressures(1000,101,20).error);
});
test('shot mass does not invent density, cavity count or a melt metering volume',()=>{
  assert.deepEqual(core.shotWeight(2,8,36,1.25),{total_shot_weight_g:80,solid_volume_cm3:64});
  assert.deepEqual(core.shotWeight(2,0,1),{total_shot_weight_g:2,solid_volume_cm3:null});
  assert.ok(core.shotWeight(2,0,1.5,1.25).error);
  assert.ok(core.shotWeight(-2,8,36,1.25).error);
  assert.ok(core.shotWeight(2,8,36,0).error);
});
