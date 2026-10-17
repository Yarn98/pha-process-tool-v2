/* Audited reference data, not a fitted process optimizer. See docs/PROCESS_REVIEW_20260906.md. */
(function (root) {
  'use strict';
  const VERSION = '2026-09-06';
  const GRADES = {
    S1000P: {
      family: 'Semi-crystalline PHA', scope: 'general', revision: '3/2024',
      source: 'https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-S1000P.pdf',
      drying: { temperature: '80 °C', hours: '5 h' }, melt: [145,175],
      mfr: '<4 g/10 min · 180 °C / 2.16 kg', impact: '>28 J/m · notched (ASTM D256)',
      injection: { nozzle:[145,175], screwRPM:[80,150] },
      stages:[['공급부','Feed',[120,130]],['압축부','Compression',[145,175]],['용융온도 항목','Melt-temperature entry',[145,175]]]
    },
    A1000P: {
      family: 'Amorphous PHA', scope: 'general', revision: '02/2024',
      source: 'https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-A1000P.pdf',
      drying: { temperature: '<50 °C', hours:'4–6 h', noteKo:'본문은 50 °C 미만, 표는 50 °C × 5 h입니다. 50 °C를 목표값으로 자동 입력하지 않습니다.', noteEn:'Text: strictly below 50 °C; table: 50 °C × 5 h. Do not auto-fill 50 °C as a target.' },
      melt:[135,175], mfr:'<5 g/10 min · 165 °C / 5 kg',
      injection: { nozzle:[130,165], screwRPM:[80,150] },
      stages:[['공급부','Feed',[40,40]],['압축부','Compression',[130,165]],['용융온도 항목','Melt-temperature entry',[135,175]]]
    },
    CA1180P: {
      family: 'PLA + amorphous PHA compound', scope:'injection', revision:'03/2023',
      source:'https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1180P.pdf',
      drying:{temperature:'<60 °C',hours:'>5 h',noteKo:'본문은 60 °C 미만·5 h 초과, 표는 60 °C × 5 h입니다. 응집 방지를 위한 본문의 제한을 함께 확인하세요.',noteEn:'Text: below 60 °C for over 5 h; table: 60 °C × 5 h. Check the text restriction intended to prevent caking.'}, mfr:'7 g/10 min · 190 °C / 2.16 kg',
      impact:'63 kJ/m² · unnotched (ASTM D256)', tg:'−15 °C, 60 °C',
      injection:{nozzle:[175,190],mold:[40,40],packTime:[5,25]},
      stages:[['피드 스로트','Feed throat',[20,40]],['공급부','Feed zone',[155,175]],['압축부','Compression zone',[170,185]],['계량부','Metering zone',[175,185]]],
      highMold:[110,120], speedPct:[10,25]
    },
    CB0104A: {
      family:'scPHA + aPHA + CaCO₃ compound', scope:'injection', revision:'June 2026',
      source:'https://cjbiomaterials.com/wp-content/uploads/2025/03/TDS-CB0104A.pdf',
      drying:{temperature:'75 °C',hours:'4 h'}, mfr:'10 g/10 min · 180 °C / 2.16 kg',
      processMoisturePpm:400,moistureOperator:'<',
      injection:{nozzle:[165,175],mold:[60,70]},
      stages:[['공급부','Feed',[25,40]],['압축부','Compression',[165,175]],['용융온도 항목','Melt-temperature entry',[165,175]]]
    },
    CB0400A: {
      family:'scPHA + aPHA + mineral compound', scope:'extrusion', revision:'June 2026',
      source:'https://cjbiomaterials.com/wp-content/uploads/2024/11/PHACT%E2%84%A2-CB0400A.pdf',
      drying:{temperature:'75 °C',hours:'4 h'}, mfr:'3 g/10 min · 175 °C / 2.16 kg',
      processMoisturePpm:400, moistureOperator:'<',
      sourcePages:{extrusion:2,straw:2},
      extrusion:{die:[160,165]},
      straw:{die:[160,165],waterBath:[70,75]},
      stages:[['공급부','Feed',[25,40]],['고체 이송','Solid conveying',[165,175]],['압축·용융부','Compression / melting',[165,175]],['계량부','Metering',[165,165]]]
    },
    CA1165A:{
      family:'aPHA + PLA + minerals compound',scope:'injection',revision:'3/2025',
      source:'https://cjbiomaterials.com/wp-content/uploads/2024/04/PHACT%E2%84%A2-CA1165A-TDS.pdf',
      drying:{temperature:'60 °C',hours:'5 h'},processMoisturePpm:400,moistureOperator:'<',
      mfr:'15–20 g/10 min · 190 °C / 2.16 kg',tg:'−15 °C, 60 °C',
      injection:{nozzle:[180,185],mold:[110,120]},
      stages:[['공급부','Feed',[25,40]],['압축부','Compression',[175,185]],['용융온도 항목','Melt-temperature entry',[175,185]]],
      noteKo:'110–120 °C 금형은 결정화·고내열 목적의 원문 범위입니다. 저온 금형은 목적과 수축을 별도 확인합니다. 폴리올레핀 잔류물 제거와 전환 절차를 확인하세요.',
      noteEn:'The 110–120 °C mold range supports crystallization/high-heat uses. Cold-mold processing needs separate purpose and shrinkage checks. Verify polyolefin-residue removal and transition procedures.'
    },
    CA1670P:{
      family:'PLA + aPHA compound · sheet / thermoforming / ISBM',scope:'sheet',revision:'03/2023',
      source:'https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1670P.pdf',
      drying:{temperature:'<60 °C',hours:'>5 h'},mfr:'5–8 g/10 min · 190 °C / 2.16 kg',tg:'−16 °C, 57 °C',
      processStages:{sheet:[['공급부','Feed zone',[20,40]],['용융부','Melt zone',[165,175]],['혼합·이송부','Mixing / conveying',[175,185]],['노즐','Nozzle',[165,190]],['롤 온도','Roll temperature',[25,55]]]},
      noteKo:'시트 원문은 열화·황변을 줄이도록 165–175 °C의 온화한 압출 조건을 권고합니다. 표의 상단값을 보편 상한으로 해석하지 않습니다. 롤별 배정은 설비 접촉 위치·직경·속도를 확인하세요.',
      noteEn:'The sheet note advises mild extrusion conditions of 165–175 °C to reduce degradation/yellowing. Table upper values are not universal limits. Map individual rolls using contact position, diameter and speed.',
      blowProcess:'ISBM'
    },
    CA1680P:{
      family:'PLA + aPHA compound · sheet / thermoforming / ISBM',scope:'sheet',revision:'03/2023',
      source:'https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1680P.pdf',
      drying:{temperature:'<40 °C',hours:'>12 h'},mfr:'4–5 g/10 min · 190 °C / 2.16 kg',tg:'−16 °C, 57 °C',
      processStages:{sheet:[['공급부','Feed zone',[20,40]],['용융부','Melt zone',[165,175]],['혼합·이송부','Mixing / conveying',[175,185]],['노즐','Nozzle',[165,190]],['롤 온도','Roll temperature',[25,55]]]},
      noteKo:'건조 조건은 CA1670P와 다릅니다. 시트 원문은 열화·황변을 줄이도록 165–175 °C의 온화한 압출 조건을 권고합니다. 롤 온도는 롤별 배정이 없는 참고 범위입니다.',
      noteEn:'Drying differs from CA1670P. The sheet note advises mild extrusion conditions of 165–175 °C to reduce degradation/yellowing. The roll range does not prescribe individual roll settings.',
      blowProcess:'ISBM'
    },
    CA1270P:{
      family:'PLA + aPHA compound · blown / cast film',scope:'film',revision:'June 2026',
      source:'https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1270P.pdf',
      sourcePages:{blownfilm:2,castfilm:2},
      drying:{temperature:'75 °C',hours:'4 h',noteKo:'원문 건조공기 이슬점 −35 °C. 펠릿 수분과 별도 항목입니다.',noteEn:'Document drying-air dew point: −35 °C; separate from pellet water.'},
      processMoisturePpm:400,moistureOperator:'<',mfr:'~4 g/10 min · 190 °C / 2.16 kg',tg:'−17 °C, 60 °C',
      blownfilm:{die:[160,165],dieGap:[1,1.5],bur:[2,3]},castfilm:{die:[160,165]},
      processStages:{
        blownfilm:[['피드 스로트','Feed throat',[20,40]],['고체 이송','Solids conveying',[165,165]],['용융부','Melting',[165,165]],['계량부·어댑터','Metering / adapters',[170,170]]],
        castfilm:[['피드 스로트','Feed throat',[20,40]],['고체 이송','Solids conveying',[165,165]],['용융부','Melting',[165,165]],['계량부·어댑터','Metering / adapters',[170,170]]]
      },
      noteKo:'블로운 필름 지침은 low-stalk·dual-lip air ring 구성을 전제로 합니다. 장력 단위에 확인할 불일치가 있어 장력 추천값은 제공하지 않습니다. 이 문서로 EBM이나 스트로 수조 조건을 만들지 않습니다.',
      noteEn:'Blown-film guidance assumes a low-stalk configuration and dual-lip air ring. An unresolved tension-unit discrepancy prevents a tension recommendation. This document does not establish EBM or straw-bath settings.'
    }
  };
  const FIELD_EN = {zone1:'Zone 1 set temperature',zone2:'Zone 2 set temperature',zone3:'Zone 3 set temperature',zone4:'Zone 4 set temperature',zone5:'Zone 5 set temperature',die:'Die set temperature',screwRPM:'Screw speed',meltPressBar:'Melt pressure',coolingRoll:'Cooling roll temperature',lineSpeed:'Line speed',chillTop:'Top chill roll',chillMid:'Middle chill roll',chillBot:'Bottom chill roll',rollRPM:'Roll speed',targetThickness:'Target thickness',barrel1:'Barrel 1 set temperature',barrel2:'Barrel 2 set temperature',barrel3:'Barrel 3 set temperature',nozzle:'Nozzle set temperature',mold:'Mold temperature',injSpeed:'Injection speed',injPressMPa:'Injection pressure (plastic basis)',packPressMPa:'Packing pressure (plastic basis)',packTime:'Packing time',coolTime:'Cooling time',backPressBar:'Back pressure (confirm basis)',hold1P:'Packing stage 1 pressure',hold1T:'Packing stage 1 time',hold2P:'Packing stage 2 pressure',hold2T:'Packing stage 2 time',bur:'Blow-up ratio (BUR)',flh:'Frost-line height',takeup:'Haul-off speed',dieGap:'Die gap',airTemp:'Air-ring air temperature',head:'Head set temperature',accHead:'Accumulator head',blowPressBar:'Blowing air pressure',preBlowBar:'Pre-blowing air pressure'};
  function reference(grade, process, mode) {
    const g=GRADES[grade];
    const ranges=['injection','extrusion','straw','blownfilm','castfilm','sheet'].includes(process) && g?.[process] ? {...g[process]} : {};
    if(grade==='CA1180P' && process==='injection' && mode==='high_hdt') ranges.mold=g.highMold;
    const units={screwRPM:'rpm',packTime:'s',dieGap:'mm',bur:'dimensionless'};
    const fields=Object.fromEntries(Object.entries(ranges).map(([key,range])=>[key,{range:[...range],grade,process,source:g.source,revision:g.revision,page:g.sourcePages?.[process]||1,unit:units[key]||'°C',basis:key==='bur'?'bubble diameter / die diameter':key==='packTime'?'document holding time':key==='screwRPM'?'document screw speed':key==='dieGap'?'die gap':'document set-temperature reference',evidence:'manufacturer_reference',field_validated:false}]));
    return {grade,process,version:VERSION,record:g||null,ranges,fields,validated:false};
  }
  function overrideKey(grade,process,mode){return 'grade:'+grade+'__'+process+(grade==='CA1180P'&&process==='injection'?'__'+(mode||'general'):'');}
  function status(value, range) {
    if(value==='' || value==null) return 'empty';
    const v=Number(value);
    if(!Number.isFinite(v)) return 'invalid';
    if(!Array.isArray(range)||range.length!==2||!range.every(Number.isFinite)||range[0]>range[1]) return 'unknown';
    return v>=range[0]&&v<=range[1] ? 'ok':'warn';
  }
  function positive(values) {return values.every(v=>Number.isFinite(v)&&v>0);}
  function cooling(thickness,alpha,melt,mold,eject) {
    if(!positive([thickness,alpha])||![melt,mold,eject].every(Number.isFinite)||!(melt>eject&&eject>mold)) return {error:'Require positive thickness/alpha and melt > eject > mold.'};
    // First-term centreline solution for a slab of full thickness, constant surface temperature.
    const ratio=(4/Math.PI)*(melt-mold)/(eject-mold);
    return {seconds:thickness**2/(Math.PI**2*alpha)*Math.log(ratio)};
  }
  function blownFilm(output,density,diameter,bur,speed,gap) {
    if(!positive([output,density,diameter,bur,speed]) || (gap!=null&&(!Number.isFinite(gap)||gap<=0))) return {error:'All supplied inputs must be finite and positive; omit an unknown gap.'};
    const flow=output/density/3600, d=diameter/1000, v=speed/60;
    const thickness=flow/(Math.PI*d*bur*v)*1e6;
    const result={thickness_um:thickness};
    if(Number.isFinite(gap)) {
      const exitVelocity=flow/(Math.PI*d*gap/1000);
      result.ddr=v/exitVelocity;
      // Same-density thin-annulus approximation: g/(BUR*DDR), not g/2.
      result.gap_based_thickness_um=gap/1000/(bur*result.ddr)*1e6;
    }
    return result;
  }
  // 1 bar*cm² = 10 N; 1 metric tonne-force = 9806.65 N.
  const BAR_CM2_PER_TF=980.665;
  function clamp(pressure,area){return positive([pressure,area])?{tf:pressure*area/BAR_CM2_PER_TF}:{error:'Positive cavity pressure and projected area required.'};}
  function cavityPressure(force,area,fraction){return positive([force,area,fraction])&&fraction<=1?{bar:force*BAR_CM2_PER_TF*fraction/area}:{error:'Positive force/area and 0 < utilization ≤ 1 required.'};}
  function strawCapacity(lengthMm,bathM,residenceS,massG,lanes,targetPerMin) {
    if(!positive([lengthMm,bathM,residenceS,massG,lanes])||!Number.isInteger(lanes)||
      (targetPerMin!=null&&!positive([targetPerMin]))) return {error:'Use finite positive dimensions, a validated residence time, integer lane count and positive optional total output.'};
    // Each lane travels at the same speed; total cut-piece output includes all lanes.
    const lineSpeed=60*bathM/residenceS, perLane=lineSpeed/(lengthMm/1000), total=perLane*lanes;
    const result={lineSpeed_m_min:lineSpeed,perLane_per_min:perLane,total_per_min:total,mass_kg_h:.06*total*massG};
    if(targetPerMin!=null){
      result.targetLineSpeed_m_min=targetPerMin/lanes*lengthMm/1000;
      result.targetResidence_s=60*bathM/result.targetLineSpeed_m_min;
      result.requiredBath_m=result.targetLineSpeed_m_min*residenceS/60;
      result.meetsEnteredResidence=result.targetResidence_s>=residenceS;
    }
    return result;
  }
  function apparentShear(flowCm3S,radiusCm){return positive([flowCm3S,radiusCm])?{rate_s_1:4*flowCm3S/(Math.PI*radiusCm**3)}:{error:'Finite positive channel flow and radius are required.'};}
  function packingPressures(peakBar,p1Pct,p2Pct){
    if(!positive([peakBar])||![p1Pct,p2Pct].every(x=>Number.isFinite(x)&&x>=0&&x<=100))return {error:'Enter positive peak pressure and both user-selected percentages in 0–100.'};
    return {p1_bar:peakBar*p1Pct/100,p2_bar:peakBar*p2Pct/100};
  }
  function shotWeight(partG,runnerG,cavities,density){
    if(![partG,runnerG].every(x=>Number.isFinite(x)&&x>=0)||!Number.isInteger(cavities)||cavities<=0||(density!==undefined&&(!Number.isFinite(density)||density<=0)))return {error:'Nonnegative weights, positive integer cavities and positive supplied density required.'};
    const total=partG*cavities+runnerG;if(!(total>0))return {error:'Total shot weight must be positive.'};
    return {total_shot_weight_g:total,solid_volume_cm3:density===undefined?null:total/density};
  }
  const api={VERSION,GRADES,FIELD_EN,reference,overrideKey,status,cooling,blownFilm,clamp,cavityPressure,strawCapacity,apparentShear,packingPressures,shotWeight};
  root.PHAEvidence=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
