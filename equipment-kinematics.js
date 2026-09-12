/* Unit-explicit ideal kinematics. No rheology, heat transfer or process setpoints. */
(function(root){
  'use strict';
  const number=value=>typeof value==='number'&&Number.isFinite(value);
  const nonnegative=value=>number(value)&&value>=0;
  const positive=value=>number(value)&&value>0;
  function rpm(speedMMin,diameterMm){return nonnegative(speedMMin)&&positive(diameterMm)?1000*speedMMin/(Math.PI*diameterMm):null;}
  function cuts(speedMMin,pitchMm){return nonnegative(speedMMin)&&positive(pitchMm)?1000*speedMMin/pitchMm:null;}
  function travel(strokeMm,velocityMmS){return nonnegative(strokeMm)&&positive(velocityMmS)?strokeMm/velocityMmS:null;}
  function degrees(rpmValue,seconds,scale=1){return nonnegative(rpmValue)&&nonnegative(seconds)&&positive(scale)?6*rpmValue*seconds*scale:null;}
  const api={rpm,cuts,travel,degrees};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.PHAKinematics=api;
})(typeof window!=='undefined'?window:globalThis);
