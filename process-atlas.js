/* Process learning surface; captions are explanatory, never measured equipment data. */
(function () {
  'use strict';
  const t=(ko,en)=>typeof LANG!=='undefined'&&LANG==='en'?en:ko;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const steps={
    injection:[['공급·가소화','Feed & plasticize','건조 이력, 배럴 설정온도와 실제 용융온도를 구분합니다.','Separate drying history, barrel set temperatures and measured melt temperature.'],['충전·V/P 전환','Fill & V/P transfer','짧게 충전한 제품의 형상·중량과 압력 응답으로 전환점을 확인합니다.','Use fill-only part shape, weight and pressure response to establish transfer.'],['보압·냉각','Pack & cool','게이트 고화 전 수지를 보충하고, 중량·치수로 보압시간을 확인합니다.','Pack before the gate freezes; confirm packing time with weight and dimensions.'],['탈형·검사','Eject & inspect','플래시, 표면 꺼짐, 휨과 탈형 손상을 같은 기준으로 비교합니다.','Compare flash, sinks, warpage and ejection damage using consistent criteria.']],
    extrusion:[['건조·정량 공급','Dry & meter','원료와 이미 혼련한 컴파운드의 건조조건을 구분합니다.','Distinguish raw-resin drying from compound-pellet drying.'],['용융·혼련','Melt & mix','이송·니딩 엘리먼트와 토출량, 토크, 실제 용융온도를 함께 봅니다.','Review conveying/kneading elements, output, torque and measured melt temperature together.'],['다이·냉각','Die & cool','스트랜드가 끊기는 위치와 다이 압력 변화를 기록합니다.','Record strand-break location and changes in die pressure.'],['절단·펠릿','Cut & pelletize','칼날, 인취 속도와 스트랜드 상태를 보고 펠릿 형상을 확인합니다.','Check pellet shape against blade condition, haul-off speed and strand state.']],
    sheet:[['공급·용융','Feed & melt','수분과 고온 체류 이력을 확인합니다.','Check moisture and time spent at high temperature.'],['평다이','Flat die','다이 폭 방향 유량과 온도 균일성이 두께 편차에 영향을 줍니다.','Flow and temperature uniformity across the die affect thickness variation.'],['3롤 냉각·인취','Three-roll cooling','롤 설정온도와 표면온도는 다릅니다. 접촉·감김·결정화 상태를 봅니다.','Roll setpoint and surface temperature differ. Check contact, wrap and crystallization.'],['시트·두께 검사','Sheet inspection','두께 분포, 컬과 표면 전사를 확인합니다.','Inspect thickness distribution, curl and surface replication.']],
    blownfilm:[['용융 공급','Melt feed','토출량·실제 용융온도·압력의 안정성을 확인합니다.','Check stability of output, measured melt temperature and pressure.'],['환형 다이·버블','Annular die & bubble','BUR은 버블 직경/다이 직경입니다. 블로우 성형 금형 직경과 다릅니다.','BUR is bubble diameter divided by die diameter. This is not a blow-mold cavity diameter.'],['냉각·인취','Cool & haul off','프로스트 라인, 버블 흔들림과 인취 속도를 함께 기록합니다.','Record frost-line height, bubble motion and haul-off speed together.'],['접힘·권취','Collapse & wind','두께 계산은 한 겹 기준입니다. 접힌 튜브는 두 겹입니다.','Calculated thickness is for one wall. A collapsed tube has two walls.']],
    blowmolding:[['용융·헤드','Melt & head','헤드 안의 수지 체류와 패리슨 토출 안정성을 확인합니다.','Check melt residence in the head and stable parison extrusion.'],['패리슨','Parison','중공 튜브의 처짐과 벽 두께를 확인합니다.','Check sag and wall thickness of the hollow tube.'],['금형·공기 팽창','Mold & inflate','블로우 공기압은 사출 수지압과 다른 변수입니다.','Blowing air pressure is distinct from injection plastic pressure.'],['냉각·트리밍','Cool & trim','핀치오프, 누설, 제품의 두께 분포를 검사합니다.','Inspect pinch-off, leakage and wall-thickness distribution.']],
    castfilm:[['용융 공급','Melt feed','유량 변동과 필터 전후 압력을 확인합니다.','Check flow variation and pressure across the filter.'],['평다이·에어갭','Flat die & air gap','다이부터 롤까지의 거리와 폭 수축을 확인합니다.','Check die-to-roll distance and neck-in.'],['칠롤·냉각','Chill roll','필름과 롤의 접촉, 표면온도와 박리 상태를 봅니다.','Review film/roll contact, surface temperature and release.'],['인취·권취','Haul off & wind','두께, 가장자리와 권취 주름을 함께 확인합니다.','Check thickness, edges and winding wrinkles together.']]
  };
  let selectedStep=0,lastProcess='';
  function referenceTag(key,grade,proc){
    const local=readOverrides()[PHAEvidence.overrideKey(grade,proc,document.getElementById('moldMode')?.value)]||{};
    if(local[key]) return t('현장 수정값','Local override');
    const ref=PHAEvidence.reference(grade,proc,document.getElementById('moldMode')?.value).fields[key];
    return ref?t('제조사 원문','Manufacturer reference')+' · p.'+ref.page:t('조건 근거 미확인','No verified condition');
  }
  function readOverrides(){try{return JSON.parse(localStorage.getItem('reco_overrides')||'{}');}catch{return {};}}
  window.phaReferenceTag=referenceTag;
  window.renderProcessAtlas=function(){
    const proc=document.getElementById('process')?.value||'injection';
    const grade=document.getElementById('grade')?.value||'';
    const panel=document.getElementById('processAtlas');if(!panel)return;
    if(proc!==lastProcess)selectedStep=0;lastProcess=proc;
    const sequence=steps[proc]||steps.extrusion, g=PHAEvidence.GRADES[grade];
    const stageRows=g?.processStages?.[proc]||((g?.scope==='general'||g?.scope===proc)?g?.stages:[])||[];
    const en=typeof LANG!=='undefined'&&LANG==='en';
    const choices=sequence.map((s,i)=>`<button type="button" class="atlas-step${i===selectedStep?' selected':''}" data-step="${i}" aria-pressed="${i===selectedStep}"><span>${String(i+1).padStart(2,'0')}</span>${esc(s[en?1:0])}</button>`).join('');
    const known=g?`<a href="${g.source}" target="_blank" rel="noopener noreferrer">${esc(grade)} TDS · ${esc(g.revision)} ↗</a>`:t('선택 재료의 원문 공정 자료 미확인','No verified processing document for this grade');
    const drying=g?`<div class="atlas-reading"><span>${t('건조 참고','Drying reference')}</span><strong>${esc(g.drying.temperature)} <small>· ${esc(g.drying.hours)}</small></strong></div>`:'';
    const mode=document.getElementById('moldModeWrap');if(mode)mode.hidden=!(grade==='CA1180P'&&proc==='injection');
    const legacy=readOverrides()[typeof profileOf==='function'?profileOf(grade)+'__'+proc:''];
    window.PHAInjectionMotion?.detach();
    panel.innerHTML=`<div class="atlas-heading"><div><span class="atlas-eyebrow">${t('설비와 수지의 흐름','Equipment & polymer flow')}</span><h2>${t('설비 흐름과 점검 위치','Equipment flow and checkpoints')}</h2></div><span class="atlas-state">${proc==='injection'?t('3D 공정 동작','3D process motion'):t('현장 검증 전','Trial reference')}</span></div>
      <div class="atlas-layout"><div class="atlas-visual">${proc==='injection'?'<div id="injectionMotion" class="injection-motion"></div>':`<img src="assets/equipment/${proc}.png?v=18" width="1280" height="640" alt="${esc(t('초록색 수지 흐름을 표시한 '+(sequence.map(s=>s[0]).join(' → ')),sequence.map(s=>s[1]).join(' → ')))}">`}<div class="atlas-steps" aria-label="${t('공정 단계','Process stages')}">${choices}</div><div class="atlas-explanation" aria-live="off"><strong>${esc(sequence[selectedStep][en?1:0])}</strong><p>${esc(sequence[selectedStep][en?3:2])}</p></div><p class="atlas-caption">${proc==='injection'?t('동작 순서를 보여주는 절개 모델입니다. 실제 장비에서는 계량과 냉각이 겹칠 수 있습니다. 재생 시간·유동·치수는 생산 조건이나 해석 결과가 아닙니다.','Cutaway model of the operating sequence. Metering and cooling can overlap on a real machine. Playback timing, flow and dimensions are illustrative, not production settings or simulation results.'):t('초록색: 수지 경로 · 설비 배치는 이해를 위한 개념도입니다. 치수·성형 해석을 나타내지 않습니다.','Green: polymer path. Conceptual equipment arrangement; not dimensional CAD or a forming simulation.')}</p></div>
      <aside class="atlas-evidence"><h3>${t('이 조건의 근거','Basis for these conditions')}</h3><p>${known}</p>${g?`<p>${esc(g.family)}</p>`:''}${drying}${stageRows.length?`<details ${g.processStages?.[proc]?'open':''}><summary>${t('원문의 기능별 온도 · 장비 존 대응 확인','Document stage temperatures · map to your machine')}</summary><ul>${stageRows.map(s=>`<li>${esc(en?s[1]:s[0])}: ${s[2].join('–')} °C</li>`).join('')}</ul><p>${t('TDS의 기능 구분을 배럴 존 번호로 자동 치환하지 않습니다. 공급부·피드 스로트·배럴·용융온도 측정 위치를 설비에서 확인하세요.','TDS functional stages are not mapped automatically to barrel zone numbers. Identify feed, throat, barrel and melt-measurement locations on your equipment.')}</p></details>`:''}${g?.processMoisturePpm?`<p>${t('공정 투입 수분','Process moisture')}: ${g.moistureOperator}${g.processMoisturePpm} ppm · ${t('펠릿 측정값 기준','pellet measurement')}</p>`:''}${g?.drying.noteKo?`<p class="atlas-note">${esc(en?g.drying.noteEn:g.drying.noteKo)}</p>`:''}
      ${g?.noteKo?`<p class="atlas-note">${esc(en?g.noteEn:g.noteKo)}</p>`:''}
      ${g?.blowProcess==='ISBM'&&proc==='blowmolding'?`<p class="atlas-note"><strong>${t('ISBM과 EBM은 다른 공정입니다.','ISBM and EBM are different processes.')}</strong> ${t('이 그레이드 문서의 블로우 표는 사출 연신 블로우용입니다. 현재 압출 블로우 화면에 조건을 전용하지 않습니다.','The grade document specifies injection stretch blow molding. Those values are not transferred to this extrusion blow-molding view.')}</p>`:''}
      ${grade==='CA1180P'&&proc==='injection'?`<p class="atlas-note">${t('원문 사출 속도 10–25%는 장비 상대값입니다. mm/s로 직접 변환하지 않습니다. 일반 금형 40 °C와 고내열 모드 110–120 °C를 구분합니다.','The document speed of 10–25% is machine relative, not a direct mm/s conversion. General mold: 40 °C; high-heat mode: 110–120 °C.')}</p>`:''}
      ${g?.scope==='extrusion'&&proc==='injection'?`<p class="atlas-note">${t('이 그레이드의 공개 자료는 압출용입니다. 사출 조건은 확인되지 않아 자동 제시하지 않습니다.','This grade document is for extrusion; no verified injection conditions are supplied.')}</p>`:''}
      <p>${t('입력 아래에 조건의 출처를 표시합니다. 근거가 없는 항목은 비워 두며, 블렌드 조성비로 공정 조건을 평균내지 않습니다. 범위 안이라는 표시는 양품 판정이 아닙니다.','Fields identify their source. Unsupported conditions stay blank; blend fractions are not used to average process settings. Being within a reference range does not establish part quality.')}</p>
      ${legacy?`<details><summary>${t('이전 공통 수정값 보존됨','Legacy shared overrides retained')}</summary><p>${t('과거 자동 입력값과 사용자 값이 섞여 있을 수 있어 자동 적용하지 않습니다. 이 값들을 검토한 뒤 현재 재료에 따로 저장하세요.','Past automatic values may be mixed with user entries. Review them before saving an override for this grade.')}</p><pre>${esc(JSON.stringify(legacy,null,2))}</pre></details>`:''}
      <a class="atlas-web-link" href="https://p34hb.tarspolymer.com/#inj" target="_blank" rel="noopener noreferrer">${t('Web TARS 사출 근거 보기','Web TARS injection references')} ↗</a><p id="atlas-api-status" class="atlas-caption"></p></aside></div>`;
    const selectStep=index=>{
      selectedStep=index;
      panel.querySelectorAll('[data-step]').forEach(btn=>{const active=Number(btn.dataset.step)===index;btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active));});
      const explanation=panel.querySelector('.atlas-explanation');
      explanation.querySelector('strong').textContent=sequence[index][en?1:0];
      explanation.querySelector('p').textContent=sequence[index][en?3:2];
    };
    panel.querySelectorAll('[data-step]').forEach(btn=>btn.addEventListener('click',()=>{
      const index=Number(btn.dataset.step);selectStep(index);
      if(proc==='injection')window.PHAInjectionMotion?.seekStage(index);
    }));
    if(proc==='injection'&&document.getElementById('proc')?.classList.contains('active'))window.PHAInjectionMotion?.mount(panel.querySelector('#injectionMotion'),{locale:en?'en':'ko',onStage:index=>{if(selectedStep!==index)selectStep(index);}});
    else window.PHAInjectionMotion?.syncSurface();
    window.renderPhaApiStatus();
  };
  window.renderPhaApiStatus=function(){const node=document.getElementById('atlas-api-status');if(!node)return;const s=window.PHA_TARS_STATUS;node.textContent=s?.ok?t(`TARS 재료 목록 연결 · ${s.count}종. 물성 데이터는 공정 설정값이 아닙니다.`,`TARS material catalog connected · ${s.count} grades. Properties are not process setpoints.`):t('TARS 연결 확인 중 또는 오프라인 · 원문 참고자료는 로컬에서 사용합니다.','TARS pending or offline · local document references remain available.');};
  window.renderPhaMaterialReference=function(){
    const target=document.getElementById('materialReference');if(!target)return;
    const g=PHAEvidence.GRADES[document.getElementById('mat_grade')?.value];
    target.innerHTML=g?`<h3>${t('제조사 시험조건','Manufacturer test conditions')}</h3><p><strong>MFR</strong> ${esc(g.mfr)}</p>${g.tg?`<p><strong>Tg</strong> ${esc(g.tg)}</p>`:''}${g.impact?`<p><strong>Izod</strong> ${esc(g.impact)}</p>`:''}<a href="${g.source}" target="_blank" rel="noopener noreferrer">TDS · ${esc(g.revision)} ↗</a><p>${t('아래 로컬 기록은 별도입니다. 시험온도·하중·충격시험 단위와 노치 조건이 다르면 직접 비교하지 마세요.','Local records below are separate. Different temperature, load, impact units or notch conditions are not directly comparable.')}</p>`:'';
  };
  function defect(){const node=document.getElementById('defectVisual');if(!node)return;node.innerHTML=`<details class="atlas-defect"><summary>${t('형상으로 이해하기 · 플래시(버)','Recognize the shape · flash (burr)')}</summary><div><img src="assets/flash-example.png" width="1536" height="1024" loading="lazy" alt="${t('트레이 하단 파팅라인 밖으로 얇은 수지가 나온 플래시 예시','Illustration of thin flash extending from the lower parting line of a tray')}"><section><h3>${t('파팅라인 밖의 얇은 수지','Thin polymer outside the parting line')}</h3><p>${t('충전 중 생겼는지, 보압 중 생겼는지 먼저 구분하세요. 금형 접촉면·벤트·압력 응답을 함께 확인합니다.','First distinguish flash formed during filling from flash formed during packing. Check the parting surface, vents and pressure response together.')}</p><p class="atlas-caption">${t('이미지 생성 예시입니다. 실측 불량 사진이나 원인 판정 근거가 아닙니다.','Generated illustration. Not an actual defect photo or evidence of root cause.')}</p></section></div></details>`;}
  window.addEventListener('load',()=>{renderProcessAtlas();renderPhaMaterialReference();defect();});
  window.addEventListener('pha-language-change',()=>{renderProcessAtlas();renderPhaMaterialReference();defect();});
})();
