/* Symptom imagery and explanation, connected to the reviewed KB by stable ID. */
(() => {
  'use strict';
  const VERSION='?v=35',data=window.PHATroubleVisualData;
  if(!data?.entries?.length)return;
  const entries=new Map(data.entries.map(entry=>[entry.kb_id,entry]));
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const locale=()=>document.documentElement.lang==='en'?'en':'ko';
  const txt=(ko,en)=>locale()==='ko'?ko:en;
  const local=(obj,key)=>obj[key+'_'+locale()]??obj[key]??'';
  const kbItem=id=>(window.tsData||window.PHA_TROUBLESHOOTING_DATA||[]).find(item=>item.id===id);
  const kbField=(item,key)=>locale()==='ko'?(item?.[key+'_ko']??item?.[key]):item?.[key];
  const fields=['id','review_version','symptom','symptom_ko','likely_causes','likely_causes_ko','diagnostics','diagnostics_ko','quick_fixes','quick_fixes_ko','root_fixes','root_fixes_ko','stop_conditions','stop_conditions_ko'];
  function signature(item){const value=JSON.stringify(fields.map(f=>item?.[f]));let n=2166136261;for(let i=0;i<value.length;i++)n=Math.imul(n^value.charCodeAt(i),16777619);return (n>>>0).toString(16);}
  let current,viewer,loadToken=0,modulePromise,animation,previousTime=0;
  const dialog=document.createElement('dialog');dialog.id='tsVisualDialog';dialog.className='ts-visual-dialog';dialog.setAttribute('aria-labelledby','tsVisualTitle');document.body.append(dialog);
  const $=selector=>dialog.querySelector(selector);
  const asset=path=>path+VERSION;
  const selected=()=>current.entry.cases[current.caseIndex];
  const hasGuide=(entry=current?.entry)=>!!window.PHAVentGuide&&entry?.kb_id===window.PHAVentGuideData?.kb_id;
  const guideTabs=()=>[...(hasGuide()?[['guide',txt('벤트 가이드','Vent guide')]]:[]),['compare',txt('외관 비교','Comparison')],['model',txt('3D·설비','3D & equipment')],['flow',txt('확인·조치 흐름','Checks & actions')]];
  const stateGroup=(normal=current.normal)=>current.ventModel?current.ventConfig+'_full':((normal?selected().normal:selected().state)+(current.section&&selected().section?'_section':'_full'));
  function poster(normal=false){return 'assets/troubleshooting/'+current.entry.family+'-'+(normal?selected().normal:selected().state)+(current.section&&selected().section?'_section':'_full')+'.webp';}
  function modelPoster(){return current.ventModel?window.PHAVentGuide.poster(current.ventConfig):(current.context?contextPoster():poster(current.normal));}
  function modelCaption(){return current.ventModel?window.PHAVentGuideData.configurations.find(c=>c.id===current.ventConfig).summary[locale()]:(current.context?txt('기존 Blender 설비의 설명용 동작입니다. 실제 운전값 조작은 원래 설비 화면에서 수행합니다.','Educational motion of the existing Blender equipment. Use the original equipment screen for its operating-value controls.'):local(selected(),'caption'));}
  function contextModel(){const kind=current.entry.equipment;return kind==='injection'?'assets/equipment/injection-motion.glb':window.PHAEquipmentModels?.[kind]?.model;}
  function contextPoster(){return 'assets/equipment/unreal/'+current.entry.equipment+'.webp';}
  function compatible(){const item=kbItem(current.entry.kb_id);return !!item&&item.review_version===(current.entry.kb_review_version||data.kb_review_version)&&signature(item)===current.entry.kb_signature;}
  function guideCompatible(){return hasGuide()&&compatible()&&kbItem(current.entry.kb_id).review_version===window.PHAVentGuideData.review_version;}
  function guidePanel(){return guideCompatible()?window.PHAVentGuide.render(locale(),current.ventConfig,current.ventSymptom):`<p class="ts-visual-mismatch" role="status">${txt('벤트 가이드와 점검 자료의 검토 버전이 다릅니다. 최신 자료가 함께 로드된 뒤 확인하세요.','The vent guide and reviewed checks do not match. Load the current resources together before using this guide.')}</p>`;}
  function mediaButton(path,alt,source,type){return `<figure><button type="button" class="ts-image-button" data-ts-zoom="${type}" aria-label="${escape(txt('이미지 확대: ','Enlarge image: ')+alt)}"><img src="${asset(path)}" alt="${escape(alt)}" width="960" height="640"></button><figcaption>${escape(source)}</figcaption></figure>`;}
  function card(item,lang){
    const entry=entries.get(item.id);if(!entry)return '';
    const ko=lang==='ko',vent=hasGuide(entry);
    return `<div class="ts-visual-entry"><button type="button" class="ts-thumb" data-ts-open="${escape(item.id)}" aria-label="${escape((ko?'형상 가이드 열기: ':'Open visual guide: ')+(ko?item.symptom_ko:item.symptom))}"><img loading="lazy" decoding="async" src="${asset(vent?window.PHAVentGuide.poster('without_reverse'):entry.thumbnail)}" alt="${escape(vent?(ko?'대기·진공 벤트의 새 개념 모형':'New atmospheric and vacuum vent model'):local(entry.cases[0],'label'))}" width="360" height="240"></button><div><p>${escape(vent?(ko?'두 벤트의 역할 · 역이송 유무 · MI와 조정 가이드':'Two vent roles · reverse-element comparison · MFR and adjustment guidance'):(ko?entry.cases.length+'개 형상 · 정상 비교 · 3D · 확인 순서':entry.cases.length+' visual cases · comparison · 3D · checks'))}</p><button type="button" class="btn ts-open" data-ts-open="${escape(item.id)}">${vent?(ko?'벤트 가이드·3D 보기':'Open vent guide & 3D'):(ko?'형상·해결 순서 보기':'View shapes & actions')} ↗</button><span class="ts-media-label">${ko?'교육용 예시':'Educational examples'}</span></div></div>`;
  }
  function stop(){cancelAnimationFrame(animation);animation=undefined;previousTime=0;if(current)current.playing=false;const button=$('[data-ts-play]');if(button){button.textContent=txt('재생','Play');button.setAttribute('aria-pressed','false');}}
  function dispose(){stop();loadToken++;viewer?.dispose();viewer=undefined;}
  function close(){if(dialog.open)dialog.close();else dispose();}
  dialog.addEventListener('close',()=>{const id=current?.entry.kb_id;dispose();current=undefined;document.querySelector(`[data-ts-open="${id}"]`)?.focus();});
  function open(id,options={}){
    const entry=entries.get(id);if(!entry)return;
    dispose();current={entry,caseIndex:Math.max(0,entry.cases.findIndex(c=>c.id===options.caseId)),tab:options.tab||(hasGuide(entry)?'guide':'compare'),normal:false,section:false,context:false,ventModel:false,ventConfig:'without_reverse',ventSymptom:'particles',phase:.98,playing:false,modelState:'idle',flowStep:0};
    current.section=!!selected().default_section;
    render();if(!dialog.open)dialog.showModal();$('#tsVisualClose').focus();if(current.tab==='model')loadModel();
  }
  function render(){
    if(!current)return;
    const c=selected(),item=kbItem(current.entry.kb_id);
    dialog.classList.toggle('has-vent-guide',hasGuide());
    dialog.innerHTML=`<header class="ts-visual-head"><div><p>${escape(txt('트러블슈팅 · 형상 가이드','Troubleshooting · visual guide'))}</p><h2 id="tsVisualTitle">${escape(kbField(item,'symptom')||local(c,'label'))}</h2></div><button id="tsVisualClose" type="button" data-ts-close>${txt('닫기','Close')} ×</button></header>
      <div class="ts-visual-tabs" role="tablist" aria-label="${txt('가이드 보기','Guide view')}">${guideTabs().map(([key,label])=>`<button type="button" role="tab" id="tsv-tab-${key}" aria-controls="tsv-panel-${key}" aria-selected="${current.tab===key}" tabindex="${current.tab===key?0:-1}" data-ts-tab="${key}">${label}</button>`).join('')}</div>
      ${current.entry.cases.length>1?`<div class="ts-case-options" role="group" ${current.tab==='guide'||(current.tab==='model'&&current.ventModel)?'hidden':''} aria-label="${txt('결함 형상 선택','Select defect case')}">${current.entry.cases.map((item,index)=>`<button type="button" aria-pressed="${index===current.caseIndex}" data-ts-case="${index}">${escape(local(item,'label'))}</button>`).join('')}</div>`:''}
      ${hasGuide()?`<section id="tsv-panel-guide" class="ts-visual-panel" role="tabpanel" aria-labelledby="tsv-tab-guide" ${current.tab!=='guide'?'hidden':''}>${guidePanel()}</section>`:''}
      <section id="tsv-panel-compare" class="ts-visual-panel" role="tabpanel" aria-labelledby="tsv-tab-compare" ${current.tab!=='compare'?'hidden':''}>${comparison()}</section>
      <section id="tsv-panel-model" class="ts-visual-panel" role="tabpanel" aria-labelledby="tsv-tab-model" ${current.tab!=='model'?'hidden':''}>${modelPanel()}</section>
      <section id="tsv-panel-flow" class="ts-visual-panel" role="tabpanel" aria-labelledby="tsv-tab-flow" ${current.tab!=='flow'?'hidden':''}>${flowPanel(item)}</section>`;
    bindImageFallbacks();
  }
  function comparison(){
    const c=selected();
    if(current.zoom){const path=current.zoom==='normal'?poster(true):(c.image?'assets/troubleshooting/'+c.image+'-example.webp':poster(false));return `<button type="button" data-ts-zoom-close>← ${txt('비교로 돌아가기','Back to comparison')}</button><figure class="ts-expanded"><img src="${asset(path)}" alt="${escape(local(c,'label'))}"><figcaption>${escape(local(c,'caption'))}</figcaption></figure>`;}
    const normalTitle=c.comparison==='inspection'?txt('기준 위치도','Reference layout'):txt('정상 기준 형상','Reference shape');
    const image=c.image?'assets/troubleshooting/'+c.image+'-example.webp':poster(false);
    return `<p class="ts-case-caption">${escape(local(c,'caption'))}</p><div class="ts-compare-grid"><div><h3>${normalTitle}</h3>${mediaButton(poster(true),normalTitle,txt('Blender 개념 모형','Blender teaching model'),'normal')}</div><div><h3>${escape(local(c,'label'))}</h3>${mediaButton(image,local(c,'caption'),c.image?txt('이미지 생성 예시 · 실측 시편 아님','Generated illustration · not a measured sample'):txt('Blender 개념 모형 · 크기·색상 강조','Blender teaching model · scale and colour emphasized'),'defect')}</div></div><p class="ts-visual-scope">${txt('외관만으로 원인을 확정하지 않습니다. 이미지와 모형은 교육용 표현이며 치수·물성 비교용 시편이 아닙니다.','Appearance alone does not establish the cause. Images and models are educational representations, not specimens for dimensional or property comparison.')}</p><button type="button" class="btn" data-ts-tab="model">${txt('3D로 관찰하기','Inspect in 3D')} →</button>`;
  }
  function modelPanel(){
    const c=selected(),moves=!!current.entry.motion||current.context||current.ventModel;
    return `<div class="ts-model-options">${current.entry.equipment?`<div role="group" aria-label="${txt('관찰 범위','Viewing scope')}"><button type="button" data-ts-context="false" aria-pressed="${!current.context&&!current.ventModel}">${txt('결함 확대','Defect detail')}</button><button type="button" data-ts-context="true" aria-pressed="${current.context}">${txt('기존 설비 보기','Existing equipment')}</button>${hasGuide()?`<button type="button" data-ts-vent-model aria-pressed="${current.ventModel}">${txt('두 벤트 배치','Two-vent layout')}</button>`:''}</div>`:''}
      ${current.ventModel?`<div class="vent-config-controls" role="group" aria-label="${txt('역이송 배치 비교','Compare reverse-element layouts')}">${window.PHAVentGuideData.configurations.map(config=>`<button type="button" data-ts-vent-config="${config.id}" aria-pressed="${current.ventConfig===config.id}">${escape(config.title[locale()])}</button>`).join('')}</div>`:''}
      ${!current.context&&!current.ventModel?`<label><input type="checkbox" data-ts-normal ${current.normal?'checked':''}>${c.comparison==='inspection'?txt('기준 위치도','Reference layout'):txt('정상 기준','Reference shape')}</label>${c.section?`<label><input type="checkbox" data-ts-section ${current.section?'checked':''}>${current.entry.family==='straw'?txt('길이 방향 단면','Longitudinal cutaway'):txt('단면 보기','Cutaway')}</label>`:''}`:''}</div>
      <div class="ts-model-viewport" data-model-state="idle" role="img" aria-label="${txt('회전·확대 가능한 3D. 아래 버튼으로 시점을 조작할 수 있습니다.','Rotatable 3D view. Use the buttons below to control the camera.')}" id="tsModelViewport"><img id="tsModelPoster" src="${asset(modelPoster())}" alt="${escape(modelCaption())}"><p id="tsModelStatus" role="status">${txt('3D 불러오는 중…','Loading 3D…')}</p></div>
      ${current.ventModel?`<div class="vent-model-legend"><span class="vent-atm"><i aria-hidden="true"></i>${txt('ATM · 원료 쪽 공기 배출','ATM · feed-side air relief')}</span><span class="vent-vac"><i aria-hidden="true"></i>${txt('VAC · 용융수지 탈기','VAC · melt degassing')}</span><span class="vent-melt"><i aria-hidden="true"></i>${txt('수지 이동 · 설명용','Resin movement · illustrative')}</span></div>`:''}
      <p class="ts-model-caption" id="tsModelCaption" aria-live="polite">${escape(modelCaption())}</p>
      <div class="ts-camera-tools" role="group" aria-label="${txt('시점 조작','Camera controls')}">${[['left','왼쪽','Left'],['right','오른쪽','Right'],['in','확대','Zoom in'],['out','축소','Zoom out'],['reset','전체','Fit view'],...(current.ventModel?[['atm','대기 벤트','ATM vent'],['seal','씰 구간','Seal region'],['vac','진공 벤트','VAC vent']]:[['detail','제품 확대','Part detail']]),...(current.entry.family==='straw'&&!current.context?[['end','끝단 보기','End view']]:[])].map(([key,ko,en])=>`<button type="button" data-ts-camera="${key}" disabled>${txt(ko,en)}</button>`).join('')}</div>
      ${moves?`<div class="ts-motion-controls"><button type="button" data-ts-play aria-pressed="false" disabled>${txt('재생','Play')}</button><label for="tsModelPhase">${txt('설명용 장면 진행','Educational sequence')} <output id="tsPhaseValue">${Math.round(current.phase*100)}%</output></label><input id="tsModelPhase" type="range" min="0" max="100" step="1" value="${Math.round(current.phase*100)}" disabled><span id="tsPhaseLabel" aria-live="polite"></span></div>`:''}
      <p class="ts-visual-scope">${txt('드래그: 회전 · 휠/두 손가락: 확대. 색·변형·재생 시간은 설명용이며 공정 조건이나 유동·결정화 해석 결과가 아닙니다.','Drag to rotate; scroll or pinch to zoom. Colour, deformation and timing are illustrative, not process settings or flow/crystallization predictions.')}</p>`;
  }
  function paragraph(value){return Array.isArray(value)?'<ul>'+value.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ul>':'<p>'+escape(value)+'</p>';}
  function flowPanel(item){
    if(!compatible())return `<p class="ts-visual-mismatch" role="status">${txt('점검 가이드와 시각자료의 검토 버전이 달라 조치 흐름을 표시하지 않습니다. 이 창을 닫고 최신 점검 가이드를 확인하세요.','The reviewed guide and visual data do not match. Close this window and check the current guide before using an action flow.')}</p>`;
    const steps=[['diagnostics','관찰·측정','Observe & measure'],['likely_causes','원인 후보 구분','Distinguish possible causes'],['quick_fixes','원인 확인 후 조치','Act after diagnosis'],['root_fixes','재발 방지 검토','Review recurrence prevention']];
    return `<p class="ts-flow-intro">${txt('선택한 형상을 확인한 뒤, 아래 순서로 점검합니다. 각 조치의 적용 조건을 먼저 확인하세요.','After inspecting the selected shape, follow these checks. Confirm each action’s conditions before applying it.')}</p><ol class="ts-flow-grid">${steps.map(([field,ko,en],i)=>`<li class="${current.flowStep===i?'is-active':''}"><button type="button" data-ts-step="${i}" aria-pressed="${current.flowStep===i}"><span>${String(i+1).padStart(2,'0')}</span>${txt(ko,en)}</button>${paragraph(kbField(item,field))}</li>`).join('')}</ol><div class="ts-flow-stop"><strong>${txt('복귀·중단 기준','Revert / stop criteria')}</strong>${paragraph(kbField(item,'stop_conditions'))}</div><p class="ts-flow-recheck">${txt('시험 후 같은 조건에서 제품과 공정 기록을 다시 비교합니다.','After a trial, compare parts and process records under equivalent conditions.')}</p><details class="ts-visual-sources"><summary>${txt('근거·적용 범위','Sources & scope')}</summary>${(item.sources||[]).filter(x=>/^https:\/\//.test(x.url)).map(x=>`<p><a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a><br>${escape(x.scope||'')}</p>`).join('')}<p>${escape(item.review_version)}</p></details>`;
  }
  function bindImageFallbacks(){dialog.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;let note=img.parentElement.querySelector('.ts-image-missing');if(!note){note=document.createElement('p');note.className='ts-image-missing';note.textContent=txt('이미지를 불러올 수 없습니다. 아래 설명과 점검 순서를 확인하세요.','Image unavailable. Use the description and checks below.');img.parentElement.append(note);}}, {once:true}));}
  async function loadModel(){
    if(!current||current.tab!=='model')return;
    dispose();const token=loadToken;current.modelState='loading';
    try{
      modulePromise??=import('./troubleshooting-viewer.js'+VERSION).catch(error=>{modulePromise=undefined;throw error;});
      const {TroubleshootingViewer}=await modulePromise;if(token!==loadToken||!current||!dialog.open)return;
      const instance=new TroubleshootingViewer($('#tsModelViewport'));viewer=instance;
      await instance.load(asset(current.ventModel?window.PHAVentGuide.model:(current.context?contextModel():current.entry.model)),current.context);
      if(token!==loadToken||!current||!dialog.open){instance.dispose();return;}
      instance.select(stateGroup());instance.pose(current.phase);instance.frame();current.modelState='ready';
      $('#tsModelViewport').dataset.modelState='ready';$('#tsModelPoster').hidden=true;
      $('#tsModelStatus').textContent=txt('드래그하여 관찰','Drag to inspect');
      dialog.querySelectorAll('[data-ts-camera], [data-ts-play], #tsModelPhase').forEach(el=>el.disabled=false);phaseLabel();
    }catch(error){
      if(token!==loadToken||!current||!dialog.open)return;
      viewer?.dispose();viewer=undefined;current.modelState='fallback';$('#tsModelViewport').dataset.modelState='fallback';$('#tsModelPoster').hidden=false;
      $('#tsModelStatus').textContent=txt('3D 대신 형상 이미지로 표시합니다.','Showing the shape image because 3D is unavailable.');
    }
  }
  function phaseLabel(){
    if(!current)return;
    if($('#tsPhaseValue'))$('#tsPhaseValue').textContent=Math.round(current.phase*100)+'%';
    if($('#tsModelPhase'))$('#tsModelPhase').value=Math.round(current.phase*100);
    if($('#tsPhaseLabel')){
      const stage=current.phase<.20?txt('가열·준비','Heat / prepare'):current.phase<.55?txt('플러그 하강','Plug descends'):current.phase<.76?txt('진공 성형·냉각 유지','Vacuum form / cooling hold'):current.phase<.93?txt('플러그 복귀·클램프 개방','Plug retracts / clamps open'):txt('이형 · 성형품 상승','Release / part lifts');
      $('#tsPhaseLabel').textContent=current.entry.motion==='forming'&&!current.context?stage:txt('실제 사이클 시간이 아닌 관찰 단계','Viewing sequence, not actual cycle time');
    }
  }
  function tick(time){
    if(!current?.playing||current.tab!=='model'||!viewer||!dialog.open||document.hidden||!viewer.inView){stop();return;}
    const delta=previousTime?Math.min(.1,(time-previousTime)/1000):0;previousTime=time;
    current.phase=(current.phase+delta/10)%1;viewer.pose(current.phase);phaseLabel();animation=requestAnimationFrame(tick);
  }
  function selectTab(tab,focus=false){
    if(!current||!guideTabs().some(([key])=>key===tab))return;stop();current.tab=tab;
    dialog.querySelectorAll('[role="tab"]').forEach(button=>{const yes=button.dataset.tsTab===tab;button.setAttribute('aria-selected',String(yes));button.tabIndex=yes?0:-1;if(yes&&focus)button.focus();});
    for(const panel of dialog.querySelectorAll('[role="tabpanel"]'))panel.hidden=panel.id!=='tsv-panel-'+tab;
    const cases=$('.ts-case-options');if(cases)cases.hidden=tab==='guide'||(tab==='model'&&current.ventModel);
    if(tab==='guide')refreshGuide();
    if(viewer){viewer.active=tab==='model';if(viewer.active)viewer.resize();}
    if(tab==='model'&&!viewer)loadModel();
  }
  function updateShape(){
    if(viewer){viewer.select(stateGroup());viewer.pose(current.phase);}
    const image=$('#tsModelPoster');if(image){image.src=asset(modelPoster());image.alt=modelCaption();}
    if($('#tsModelCaption'))$('#tsModelCaption').textContent=modelCaption();
  }
  function refreshGuide(focusSelector){
    const panel=$('#tsv-panel-guide');if(!panel)return;
    const expanded=[...panel.querySelectorAll('details')].map(el=>el.open);
    panel.innerHTML=guidePanel();panel.querySelectorAll('details').forEach((el,i)=>el.open=!!expanded[i]);
    bindImageFallbacks();if(focusSelector)panel.querySelector(focusSelector)?.focus({preventScroll:true});
  }
  dialog.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||!current)return;
    const d=button.dataset;
    if('tsClose' in d){close();return;}
    if(d.tsVentConfig&&guideCompatible()){
      current.ventConfig=window.PHAVentGuide.configuration(d.tsVentConfig);
      if(current.ventModel)updateShape();
      dialog.querySelectorAll('[data-ts-vent-config]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tsVentConfig===current.ventConfig)));
      refreshGuide(current.tab==='guide'?`[data-ts-vent-config="${current.ventConfig}"]`:null);return;
    }
    if(d.tsVentSymptom&&guideCompatible()){
      if(!window.PHAVentGuideData.symptoms.some(item=>item.id===d.tsVentSymptom))return;
      current.ventSymptom=d.tsVentSymptom;refreshGuide(`[data-ts-vent-symptom="${current.ventSymptom}"]`);return;
    }
    if('tsVentModel' in d&&guideCompatible()){
      if(current.ventModel){selectTab('model',true);return;}
      dispose();current.ventModel=true;current.context=false;current.tab='model';render();$('#tsv-tab-model').focus();loadModel();return;
    }
    if(d.tsTab){selectTab(d.tsTab,true);return;}
    if('tsCase' in d){dispose();current.ventModel=false;current.caseIndex=Number(d.tsCase);current.normal=false;current.section=!!selected().default_section;current.zoom=undefined;render();$(`[data-ts-case="${current.caseIndex}"]`)?.focus({preventScroll:true});if(current.tab==='model')loadModel();return;}
    if(d.tsContext!==undefined){dispose();current.ventModel=false;current.context=d.tsContext==='true';render();$(`[data-ts-context="${current.context}"]`)?.focus({preventScroll:true});loadModel();return;}
    if(d.tsCamera){viewer?.cameraAction(d.tsCamera);return;}
    if('tsPlay' in d){if(current.playing){stop();}else if(viewer){current.playing=true;button.textContent=txt('일시정지','Pause');button.setAttribute('aria-pressed','true');animation=requestAnimationFrame(tick);}return;}
    if(d.tsZoom){current.zoom=d.tsZoom;$('#tsv-panel-compare').innerHTML=comparison();bindImageFallbacks();$('[data-ts-zoom-close]').focus();return;}
    if('tsZoomClose' in d){current.zoom=undefined;$('#tsv-panel-compare').innerHTML=comparison();bindImageFallbacks();$('[data-ts-zoom="defect"]').focus();return;}
    if(d.tsStep!==undefined){current.flowStep=Number(d.tsStep);dialog.querySelectorAll('[data-ts-step]').forEach(b=>{const yes=b===button;b.setAttribute('aria-pressed',String(yes));b.closest('li').classList.toggle('is-active',yes);});}
  });
  dialog.addEventListener('input',event=>{
    if(!current)return;
    if(event.target.matches('[data-ts-normal]')){current.normal=event.target.checked;updateShape();}
    if(event.target.matches('[data-ts-section]')){current.section=event.target.checked;updateShape();}
    if(event.target.id==='tsModelPhase'){stop();current.phase=Number(event.target.value)/100;viewer?.pose(current.phase);phaseLabel();}
  });
  dialog.addEventListener('keydown',event=>{
    if(event.target.getAttribute('role')!=='tab')return;
    const tabs=guideTabs().map(([key])=>key);let index=tabs.indexOf(current.tab);
    if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;
    event.preventDefault();selectTab(tabs[index],true);
  });
  document.addEventListener('click',event=>{const button=event.target.closest('[data-ts-open]');if(button)open(button.dataset.tsOpen);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>stop());
  window.addEventListener('pha-language-change',()=>{if(current){dispose();render();if(current.tab==='model')loadModel();}});
  const ts=document.getElementById('ts');if(ts)new MutationObserver(()=>{if(dialog.open&&!ts.classList.contains('active'))close();}).observe(ts,{attributes:true,attributeFilter:['class']});
  window.PHATroubleVisuals={card,open,close,signature,getState:()=>current?{kbId:current.entry.kb_id,caseId:selected().id,tab:current.tab,normal:current.normal,section:current.section,context:current.context,ventModel:current.ventModel,ventConfig:current.ventConfig,ventSymptom:current.ventSymptom,phase:current.phase,playing:current.playing,modelState:current.modelState,compatible:compatible(),...viewer?.snapshot()}:null};
})();
