/* Local Blender GLB player for seven educational process lines; the stage comes from machine-viewer.js. */
(function(){
  'use strict';
  const VERSION='?v=26',viewer=()=>window.PHAMachineViewer;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),saved=new Map(),cache=new Map();
  let host=null,meta=null,state=null,asset=null,engine=null,enginePending=null,onStage=()=>{};
  let locale='ko',token=0,raf=0,lastTick=0,unwatch=null,studyPanel=null,pendingPaint=0;
  const t=(ko,en)=>locale==='en'?en:ko,text=pair=>pair[locale==='en'?1:0];
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  // Whole turns a spin clip makes per loop: from the rig metadata, else the older rigs' two turns
  // (one for winders, cutters and the straw line).
  const turnsOf=key=>meta.turns?.[key]??(meta.id==='straw'||key==='winder'||key==='cutter'?1:2);
  window.phaSyncMachineOverlay=()=>document.body.classList.toggle('pha-machine-manual',!!document.querySelector('.tabpage.active :is(.equipment-motion,.injection-motion):not(.is-study-photo) .motion-manual:not([hidden]),.tabpage.active .equipment-study[open]'));

  function initial(definition){
    const values=Object.fromEntries(definition.controls.map(control=>[control.key,definition.initial?.[control.key]||0]));
    return {time:.7,speed:1,playing:!reduced.matches,mode:'cycle',focus:'all',visible:false,ready:false,frames:0,actual:{...values},target:{...values},released:false,drop:0};
  }
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;lastTick=0;}
  function changing(){return state?.mode==='manual'&&meta.controls.some(c=>Math.abs(state.actual[c.key]-state.target[c.key])>.001);}
  function canRun(){return !!(engine&&asset&&host?.isConnected&&!host.classList.contains('is-study-photo')&&state?.ready&&state.visible&&document.visibilityState==='visible'&&(state.playing||state.studyPlaying||changing()));}
  function schedule(){if(canRun()&&!raf)raf=requestAnimationFrame(tick);else if(!canRun())stop();}
  function enabled(key){
    if(meta.id!=='blowmolding')return true;
    const a=state.actual,b=state.target;
    if(key==='parison')return a.mold>99.99&&b.mold>99.99&&a.pin<.01&&b.pin<.01&&!state.released;
    if(key==='mold')return a.pin<.01&&b.pin<.01;
    if(key==='pin')return a.mold<.01&&b.mold<.01&&a.parison>99.99&&!state.released;
    if(key==='inflate')return a.mold<.01&&b.mold<.01&&a.pin>99.99&&b.pin>99.99&&a.parison>99.99&&!state.released;
    return true;
  }
  function manualStep(dt){
    for(const control of meta.controls){
      const key=control.key,difference=state.target[key]-state.actual[key];
      state.actual[key]=Math.abs(difference)<.01?state.target[key]:state.actual[key]+difference*(1-Math.exp(-14*dt));
    }
    if(meta.id==='blowmolding'&&state.actual.inflate>99.5&&state.actual.pin<.01&&state.actual.mold>55){
      state.released=true;state.drop=Math.max(state.drop,clamp((state.actual.mold-55)/45,0,1));
    }
  }
  function pose(){
    for(const [key,group] of asset.groups){
      let second=state.time;
      if(state.mode==='study'){
        const drive=state.study;
        second=drive?.type==='spin'&&key===drive.group?(drive.angle/360/turnsOf(key)%1)*group.duration:0;
      }
      if(state.mode==='manual'||state.mode==='study'&&state.study?.type==='travel'){
        const control=meta.controls.find(c=>c.key===key);
        // Angles of rigs with metadata turns map through those turns; other controls span their range.
        second=!control?0:meta.turns?.[key]&&control.unit==='°'?(state.actual[key]/360/meta.turns[key]%1)*group.duration
          :control.range[0]+(control.range[1]-control.range[0])*state.actual[key]/control.max;
      }
      group.mixer.setTime(clamp(second,0,group.duration-.00001));
    }
    if(meta.id==='blowmolding'){
      // Shuttle positions, take-out drop and blow-air window come from the rig metadata (meta.blow).
      const nodes=asset.nodes,a=state.actual,blow=meta.blow;
      for(const name of ['ParisonLength','InflatedBody','ReleasedBottle'])if(nodes[name])nodes[name].visible=true;
      if(state.mode==='manual'||state.mode==='study'){
        // Once the closed mould holds a full parison it is cut and shuttled to the blow station.
        const captured=(a.mold<.1&&a.parison>99.99)||a.pin>.01||a.inflate>.01||state.released;
        asset.groups.get('shuttle')?.mixer.setTime(captured?blow.shuttle.station:blow.shuttle.head);
        nodes.ParisonLength.visible=!captured;
        nodes.ParisonLength.scale.set(1,Math.max(.001,a.parison/100),1);
        nodes.InflatedBody.visible=captured&&!state.released;
        nodes.InflatedBody.scale.set(1,1,1);
        nodes.ReleasedBottle.visible=state.released;
        nodes.ReleasedBottle.scale.set(1,1,1);
        const f=state.drop*state.drop*(3-2*state.drop),[x0,y0,z0]=blow.release.from,[x1,y1,z1]=blow.release.to;
        nodes.ReleasedBottle.position.set(x0+(x1-x0)*f,y0+(y1-y0)*f,z0+(z1-z0)*f);
        asset.members.air?.forEach(node=>{node.visible=a.inflate>0&&a.pin>99;});
      }else asset.members.air?.forEach(node=>{node.visible=state.time>=blow.air[0]&&state.time<blow.air[1];});
    }
  }
  // frameTime marks a playback frame; its following tick measures the frame cost.
  function paint(frameTime){
    if(!engine||!asset||!host?.isConnected)return;
    pose();engine.scene.updateMatrixWorld(true);engine.governor.render(engine.camera,frameTime||performance.now(),!!frameTime);state.frames++;
  }
  // Orbit drags fire many change events; draw at most once per animation frame.
  function paintSoon(){if(!pendingPaint)pendingPaint=requestAnimationFrame(()=>{pendingPaint=0;paint();});}
  // A rig with a non-uniform cycle (blow moulding) states its own stage segments and seek times; continuous
  // lines split the loop into four equal parts.
  function stage(){
    const segment=meta.stage_segments?.find(([a,b])=>state.time>=a&&state.time<b);
    return segment?segment[2]:Math.min(3,Math.floor(state.time/meta.duration*4));
  }
  function stageStart(index){return meta.stage_starts?meta.stage_starts[index]:index*meta.duration/4+.25;}
  function update(){
    if(!host||!state)return;
    const manual=state.mode==='manual',phase=stage();
    const layoutChanged=host.classList.contains('is-manual')!==manual;
    host.classList.toggle('is-manual',manual);
    const play=host.querySelector('[data-eq="play"]');
    play.textContent=state.playing?t('일시정지','Pause'):t('재생','Play');play.setAttribute('aria-pressed',String(state.playing));
    host.querySelector('[data-eq="manual"]').textContent=manual?t('자동 공정으로 돌아가기','Return to cycle'):t('직접 조작','Manual controls');
    host.querySelector('[data-eq="manual"]').setAttribute('aria-pressed',String(manual));
    host.querySelector('.motion-manual').hidden=!manual;
    window.phaSyncMachineOverlay();state.phase=phase;
    host.querySelector('.motion-phase').textContent=state.mode==='study'?t('계산 동작 · 선택한 기구만 표시','Calculated motion · Selected mechanism'):manual?t('직접 조작 · 모형의 상대 위치','Manual · Relative model position'):String(phase+1).padStart(2,'0')+' · '+text(meta.stages[phase]);
    const progress=host.querySelector('[data-eq="progress"]');progress.value=String(state.time/meta.duration*100);progress.setAttribute('aria-valuetext',text(meta.stages[phase]));
    for(const key of ['play','speed','progress'])host.querySelector('[data-eq="'+key+'"]').disabled=!state.ready||manual;
    for(const control of meta.controls){
      const input=host.querySelector('[data-eq-axis="'+control.key+'"]'),value=state.actual[control.key].toFixed(control.unit==='°'?0:1)+control.unit;
      input.disabled=!state.ready||!enabled(control.key);input.value=String(state.target[control.key]);input.setAttribute('aria-valuetext',value);
      host.querySelector('[data-eq-value="'+control.key+'"]').textContent=value;
    }
    const notice=host.querySelector('.motion-interlock');
    if(meta.id==='blowmolding'){
      const a=state.actual;
      const message=state.released?t('제품 배출 완료 · 처음부터 조작하려면 초기 위치로 돌아가세요.','Part discharged. Reset the model to start again.'):a.pin>.01?t('핀을 복귀해야 금형을 열 수 있습니다. 삽입 완료 후 팽창을 조작하세요.','Retract the pin before opening the mold. Inflation is enabled after full pin insertion.'):a.mold>.01?t('금형이 완전히 열린 상태에서 패리슨을 토출한 뒤 금형을 닫으세요.','Extrude the parison with the mold fully open, then close the mold.'):t('패리슨 토출이 완료되면 블로우 핀을 삽입할 수 있습니다.','Insert the blow pin after the parison is fully extruded.');
      if(notice.textContent!==message)notice.textContent=message;
    }else notice.textContent=t('슬라이더 또는 키보드 화살표로 부품과 흐름 표시를 조절합니다.','Use sliders or keyboard arrows to move the mechanisms and flow markers.');
    host.querySelectorAll('[data-eq-stage]').forEach(button=>button.setAttribute('aria-pressed',String(!manual&&Number(button.dataset.eqStage)===phase)));
    if(layoutChanged&&state.ready)resize();
    if(state.mode==='cycle')onStage(phase);
  }
  function stopStudy(){if(!state)return;state.studyPlaying=false;stop();studyPanel?.clearStatus();if(state.mode==='study')paint();}
  function leaveStudy(){if(state.mode==='study'){stopStudy();state.mode='cycle';}}
  function startStudy(drive){
    stopStudy();state.playing=false;state.mode='study';state.study={...drive,angle:0,elapsed:0};state.studyPlaying=drive.type==='travel'||drive.rpm>0;
    if(drive.type==='travel')for(const control of meta.controls)state.actual[control.key]=state.target[control.key]=meta.initial?.[control.key]||0;
    state.released=false;state.drop=0;advanceStudy(0);paint();update();schedule();
  }
  function advanceStudy(dt){
    const drive=state.study;if(!drive||!state.studyPlaying)return;
    drive.elapsed+=dt*drive.scale;
    if(drive.type==='spin')drive.angle=PHAKinematics.degrees(drive.rpm,drive.elapsed);
    else{
      const fraction=drive.seconds===0?0:Math.min(1,drive.elapsed/drive.seconds);
      state.actual.mold=state.target.mold=100*(1-fraction);
      if(drive.seconds===0||fraction===1){state.studyPlaying=false;drive.onComplete?.();}
    }
  }
  function tick(now){
    raf=0;if(!canRun()){lastTick=0;return;}
    engine.governor.observe(now);
    if(lastTick){const dt=Math.min((now-lastTick)/1000,.10);if(state.mode==='study')advanceStudy(dt);else if(state.mode==='manual')manualStep(dt);else state.time=(state.time+dt*state.speed)%meta.duration;}
    // Time and pose follow the wall clock every tick; only drawing is skipped while the governor
    // protects input handling.
    lastTick=now;if(engine.governor.due(now)){paint(now);update();}else{pose();engine.scene.updateMatrixWorld(true);}if(canRun())raf=requestAnimationFrame(tick);else{lastTick=0;paint();update();}
  }
  function seek(second){stopStudy();state.mode='cycle';state.playing=false;state.time=clamp(second,0,meta.duration-.001);stop();paint();update();}
  function resetManual(){
    for(const control of meta.controls)state.actual[control.key]=state.target[control.key]=meta.initial?.[control.key]||0;
    state.released=false;state.drop=0;stop();paint();update();
  }
  function resetView(key='all',side=false){
    if(!engine||!meta)return;
    const view=meta.views.find(v=>v.key===key)||meta.views[0],center=view.center;
    engine.camera.position.set(center[0]+(side?0:5),center[1]+(side?1:4),side?16:14);
    engine.controls.target.set(...center);engine.camera.zoom=view.zoom;engine.camera.updateProjectionMatrix();engine.controls.update();
    state.focus=view.key;host.querySelector('[data-eq="focus"]').value=view.key;paint();
  }
  function resize(){
    if(!engine||!asset||!host?.isConnected)return;
    const viewport=host.querySelector('.motion-viewport'),width=viewport.clientWidth;if(!width)return;
    const compact=(state.mode==='manual'||host.classList.contains('is-study-open'))&&matchMedia('(max-width:760px)').matches;
    const height=Math.round(compact?Math.min(width*.55,220):width*(width<480?.72:meta.heightRatio||.5));viewport.style.height=height+'px';
    engine.renderer.setSize(width,height,false);
    viewer().frameOrtho(engine.camera,width,height,meta.span[0],meta.span[1],1.08);paint();
  }
  async function ensureEngine(){
    if(engine)return;
    enginePending||=viewer().createStage({ground:true,exposure:1.08,zoom:[.7,6],polar:[.20,Math.PI/1.95],onContextLost:()=>fallback()});
    const stage=await enginePending;
    if(engine)return;
    stage.controls.addEventListener('change',()=>{if(!canRun())paintSoon();});
    stage.governor=viewer().createGovernor(stage,{onQualityChange:()=>resize()});
    engine=stage;
  }
  async function load(definition){
    if(cache.has(definition.id)){const entry=cache.get(definition.id);cache.delete(definition.id);cache.set(definition.id,entry);return entry;}
    const gltf=await engine.loader.loadAsync('./'+definition.model+VERSION),THREE=engine.THREE;
    viewer().prepareModel(gltf.scene);
    const nodes={},members={};
    gltf.scene.traverse(node=>{nodes[node.name]=node;if(node.userData.motion_group)(members[node.userData.motion_group]||=[]).push(node);});
    const groups=viewer().groupClips(THREE,gltf.scene,gltf.animations);
    const missing=definition.controls.filter(control=>!groups.has(control.key)).map(control=>control.key);
    if(missing.length)throw new Error('Missing Blender mechanism animation: '+missing.join(', '));
    const loaded={model:gltf.scene,groups,nodes,members};cache.set(definition.id,loaded);return loaded;
  }
  function trimCache(){
    while(cache.size>2){
      const entry=[...cache].find(([,value])=>value!==asset);if(!entry)break;
      const [key,old]=entry;
      old.groups.forEach(group=>group.mixer.stopAllAction());
      viewer().disposeModel(old.model);cache.delete(key);
    }
  }
  function fallback(){
    stop();if(!host)return;state.ready=false;host.dataset.motionState='fallback';
    host.querySelector('.motion-viewport').hidden=true;host.querySelector('.motion-poster').hidden=false;
    const message=host.querySelector('.motion-load');message.hidden=false;message.textContent=t('3D를 열지 못했습니다. 설비 그림과 공정 설명을 확인하세요.','3D could not load. The equipment image and process explanations remain available.');
    host.querySelectorAll('button,input,select').forEach(element=>element.disabled=true);
    state.studyPlaying=false;
    host.querySelectorAll('.study-viewbar button,.equipment-study input,.equipment-study select,.equipment-study [data-study-stop]').forEach(el=>el.disabled=false);studyPanel?.refresh();
  }
  function detach(){
    token++;stopStudy();stop();if(state)state.visible=false;unwatch?.();unwatch=null;
    engine?.renderer.domElement.remove();host=null;onStage=()=>{};window.phaSyncMachineOverlay();
  }
  async function mount(element,options={}){
    const definition=window.PHAEquipmentModels?.[options.kind||element.dataset.equipmentModel];if(!definition)return;
    const prior=meta?.id;detach();host=element;meta=definition;locale=options.locale||'ko';onStage=options.onStage||(()=>{});const current=token;
    if(!saved.has(meta.id))saved.set(meta.id,initial(meta));state=saved.get(meta.id);state.ready=false;
    host.dataset.motionState='loading';
    host.innerHTML=`<div class="motion-load" role="status">${t('움직이는 설비 불러오는 중…','Loading the animated equipment…')}</div><img class="motion-poster" src="${meta.poster+VERSION}" width="1280" height="720" alt="${t('내부 구조와 수지 경로를 보여주는 설비 개념도','Equipment concept showing internal mechanisms and the polymer path')}"><div class="motion-viewport" hidden></div>
      <div class="motion-toolbar"><button type="button" data-eq="play" disabled>${t('재생','Play')}</button><label>${t('재생 속도','Playback speed')}<select data-eq="speed" aria-label="${t('설명 재생 속도','Illustration playback speed')}" disabled><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label><button type="button" data-eq="manual" aria-pressed="false" disabled>${t('직접 조작','Manual controls')}</button><label>${t('관찰 부위','View')}<select data-eq="focus" aria-label="${t('관찰 부위','Inspection area')}" disabled>${meta.views.map(view=>'<option value="'+view.key+'">'+text(view.label)+'</option>').join('')}</select></label><button type="button" data-eq="side" disabled>${t('측면 보기','Side view')}</button><button type="button" data-eq="view" disabled>${t('시점 초기화','Reset view')}</button><span class="motion-phase"></span></div>
      <label class="motion-progress">${t('공정 진행 위치','Cycle position')}<input type="range" data-eq="progress" min="0" max="100" step=".1" aria-label="${t('공정 진행 위치','Cycle position')}" disabled></label><p class="motion-hint">${t('드래그 회전 · 휠/두 손가락 확대 · ','Drag to rotate · Wheel/pinch to zoom · ')}${meta.amberFlow?t('호박색 고리는 흐름 방향 표시','Amber rings mark the flow direction'):t('밝은 초록 점은 흐름 방향 표시','Bright green markers show flow direction')}</p>
      <div class="motion-manual" hidden><p class="motion-manual-intro">${meta.id==='blowmolding'?t('패리슨 토출 → 금형 닫힘 → 핀 삽입 → 팽창 → 핀 복귀 → 금형 개방 순서로 조작하세요.','Extrude the parison → close the mold → insert the pin → inflate → retract the pin → open the mold.'):t('부품별로 회전·이동을 멈춰 관찰하거나 위치를 직접 바꿔보세요.','Inspect individual mechanisms at rest or adjust their positions directly.')}</p><div class="motion-axes">${meta.controls.map(control=>'<label class="motion-axis"><span>'+text(control.label)+'<output aria-live="off" data-eq-value="'+control.key+'"></output></span><input type="range" data-eq-axis="'+control.key+'" min="0" max="'+control.max+'" step="'+control.step+'" aria-label="'+text(control.label)+'" disabled></label>').join('')}</div><p class="motion-interlock" role="status"></p><div class="motion-manual-footer"><button type="button" data-eq="reset" disabled>${t('초기 위치','Reset model')}</button><small>${t('각도·%는 모형 위치입니다. 실제 RPM·속도·생산 설정값이 아닙니다.','Angles and % are model positions, not real RPM, speeds or production settings.')}</small></div></div>
      ${options.stages!==false?'<div class="motion-stages">'+meta.stages.map((name,index)=>'<button type="button" data-eq-stage="'+index+'" aria-pressed="false">'+String(index+1).padStart(2,'0')+' · '+text(name)+'</button>').join('')+'</div>':''}`;
    studyPanel=window.PHAEquipmentStudy?.mount(host,{kind:meta.id,locale,start:startStudy,stop:stopStudy,pause:()=>{state.playing=false;stop();update();}});
    host.querySelector('.motion-toolbar').addEventListener('click',leaveStudy,true);
    host.querySelector('.motion-toolbar').addEventListener('change',leaveStudy,true);
    try{
      await ensureEngine();const loaded=await load(definition);if(current!==token||!host?.isConnected){trimCache();return;}
      if(asset?.model)engine.scene.remove(asset.model);asset=loaded;engine.scene.add(asset.model);viewer().fitShadows(engine,asset.model);
      await viewer().warm(engine,asset.model);engine.governor.reset();if(current!==token||!host?.isConnected)return;
      trimCache();state.ready=true;
      // Real-scale rigs (32 mm twin screws, 80 mm feed rolls) need closer inspection than the teaching-scale lines.
      [engine.controls.minZoom,engine.controls.maxZoom]=meta.zoom||[.7,6];
      host.querySelector('.motion-viewport').appendChild(engine.renderer.domElement);host.querySelector('.motion-viewport').hidden=false;host.querySelector('.motion-poster').hidden=true;host.querySelector('.motion-load').hidden=true;host.dataset.motionState='ready';
      engine.renderer.domElement.setAttribute('aria-label',t('설비 부품과 수지 이동을 보여주는 조작 가능한 3D 모델','Interactive 3D equipment model showing mechanisms and polymer movement'));
      host.querySelectorAll('button,input,select').forEach(element=>element.disabled=false);
      studyPanel?.refresh();
      host.querySelector('[data-eq="speed"]').value=String(state.speed);host.querySelector('[data-eq="focus"]').value=state.focus;
      host.querySelector('[data-eq="play"]').onclick=()=>{state.playing=!state.playing;update();schedule();};
      host.querySelector('[data-eq="speed"]').onchange=event=>{state.speed=Number(event.target.value);};
      host.querySelector('[data-eq="progress"]').oninput=event=>seek(Number(event.target.value)/100*meta.duration);
      host.querySelector('[data-eq="view"]').onclick=()=>resetView();host.querySelector('[data-eq="side"]').onclick=()=>resetView('all',true);
      host.querySelector('[data-eq="focus"]').onchange=event=>resetView(event.target.value);
      host.querySelector('[data-eq="manual"]').onclick=()=>{state.playing=false;stop();if(state.mode==='manual'){state.mode='cycle';paint();update();}else{state.mode='manual';resetManual();host.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});}};
      host.querySelector('[data-eq="reset"]').onclick=resetManual;
      host.querySelectorAll('[data-eq-axis]').forEach(input=>input.oninput=event=>{
        const control=meta.controls.find(c=>c.key===input.dataset.eqAxis),value=Number(event.target.value);
        if(state.mode!=='manual'||!enabled(control.key)||!Number.isFinite(value)){update();return;}
        state.target[control.key]=clamp(value,0,control.max);if(reduced.matches){manualStep(10);paint();}else schedule();update();
      });
      host.querySelectorAll('[data-eq-stage]').forEach(button=>button.onclick=()=>seek(stageStart(Number(button.dataset.eqStage))));
      unwatch=viewer().watch(host,{onResize:resize,onVisible:visible=>{state.visible=visible;schedule();},threshold:.01});
      if(prior!==meta.id||!engine.camera.position.lengthSq())resetView(state.focus);resize();paint();update();
    }catch(error){if(current===token){state.error=String(error);fallback();}}
  }
  function syncSurface(){
    const element=[...document.querySelectorAll('[data-equipment-model]')].find(node=>node.closest('.tabpage.active'));
    if(!element){detach();return;}
    if(host===element){update();schedule();return;}
    if(element.id==='processEquipmentMotion'){window.renderProcessAtlas?.();return;}
    mount(element,{kind:element.dataset.equipmentModel,locale:typeof LANG!=='undefined'?LANG:'ko'});
  }
  document.addEventListener('visibilitychange',schedule);
  window.addEventListener('pha-language-change',()=>requestAnimationFrame(syncSurface));
  reduced.addEventListener('change',event=>{if(event.matches&&state){state.playing=false;stopStudy();stop();if(state.mode==='manual'){manualStep(10);paint();}update();}});
  window.PHAEquipmentMotion={mount,detach,syncSurface,seekStage(index){if(meta&&index>=0&&index<4)seek(stageStart(index));},getState(){return state?{...state,kind:meta.id,actual:{...state.actual},target:{...state.target}}:null;}};
  if(['localhost','127.0.0.1'].includes(location.hostname))window.__phaEquipmentTest=()=>({
    ...window.PHAEquipmentMotion.getState(),cached:[...cache.keys()],groups:asset?Object.fromEntries([...asset.groups].map(([key,group])=>[key,{duration:group.duration,tracks:group.tracks}])):{},
    nodes:asset?Object.fromEntries(Object.entries(asset.members).map(([group,nodes])=>[group,nodes.map(node=>({name:node.name,position:node.position.toArray(),world:node.getWorldPosition(new engine.THREE.Vector3()).toArray(),rotation:node.quaternion.toArray(),scale:node.scale.toArray(),visible:node.visible,morph:node.morphTargetInfluences||null}))])):{},
    camera:engine?{zoom:engine.camera.zoom,target:engine.controls.target.toArray()}:null,
    quality:engine?{level:engine.governor.level,cost:engine.governor.cost}:null
  });
})();
