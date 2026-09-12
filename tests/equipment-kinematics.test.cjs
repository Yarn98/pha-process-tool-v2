const test=require('node:test');
const assert=require('node:assert/strict');
const {rpm,cuts,travel,degrees}=require('../equipment-kinematics.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('m/min and millimetres round-trip through no-slip roll circumference',()=>{
  for(const speed of [0,.01,6,135])for(const diameter of [10,200,1000])near(rpm(speed,diameter)*Math.PI*diameter/1000,speed);
  near(rpm(6,200),30/Math.PI);
});
test('cutting rate is per strand; four-edge rotor and one-edge straw cutter',()=>{
  assert.equal(cuts(6,200),30);
  assert.equal(cuts(6,3)/4,500);
  assert.equal(cuts(0,200),0);
});
test('travel uses seconds and rotation accounts for explicit slow display',()=>{
  assert.equal(travel(100,50),2);
  assert.equal(travel(0,50),0);
  assert.equal(degrees(30,2),360);
  assert.equal(degrees(30,2,.1),36);
});
test('missing, non-finite, negative and zero denominators cannot produce a result',()=>{
  for(const invalid of ['',null,undefined,NaN,Infinity,-1]){
    assert.equal(rpm(invalid,200),null);assert.equal(cuts(invalid,200),null);
    assert.equal(travel(100,invalid),null);assert.equal(degrees(invalid,2),null);
  }
  assert.equal(rpm(6,0),null);assert.equal(cuts(6,0),null);assert.equal(travel(100,0),null);assert.equal(degrees(30,1,0),null);
});
