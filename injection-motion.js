/* Blender-authored injection machine motion on the shared stage (machine-viewer.js).
   This is a teaching sequence, not process simulation. */
(function () {
  'use strict';
  const viewer=()=>window.PHAMachineViewer;
  // Shares the service worker's precached asset version (sw.js ASSET_V).
  const VERSION='?v=36',MODEL='./assets/equipment/injection-motion.glb'+VERSION;
  // Timing, strokes, part path and views come from the GLB (MachineControls.pha_machine).
  let STARTS=[0,4,6,10],DURATION=14,meta=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const state={time:1.2,speed:1,playing:!reduced.matches,phase:0,ready:false,visible:false,frames:0,mode:'cycle',focus:'all'};
  const axes=['screw','rotation','mold','ejector'];
  const manual={screw:100,rotation:0,mold:0,ejector:0,fill:0,released:false,fall:0,releaseAt:null,flow:''};
  const target={screw:100,rotation:0,mold:0,ejector:0};
  let host=null,locale='ko',onStage=()=>{},runtime=null,loading=null,token=0,raf=0,lastTick=0,failed=false;
  let unwatch=null,studyPanel=null,pendingPaint=0,chart=null;
  const t=(ko,en)=>locale==='en'?en:ko;
  // Steady cycle: stages are not time-ordered (dosing for the next shot overlaps cooling).
  const phaseAt=time=>{
    const segment=meta?.stage_segments?.find(([a,b])=>time>=a&&time<b);
    return segment?segment[2]:STARTS.reduce((phase,start,i)=>time>=start?i:phase,0);
  };
  // Every sub-step running at this time (e.g. cooling and next-shot dosing), in table order.
  const stepAt=time=>(meta?.steps||[]).filter(([a,b])=>time>=a&&time<b).map(row=>row[locale==='en'?3:2]).join(' · ');
  const names=[['가소화·계량','Plasticize & meter'],['형폐·충전','Close & fill'],['보압·냉각','Pack & cool'],['금형 개방·취출','Open & eject']];
  /* Barrel/nozzle/mould temperature overlay. Values are the user's entered set points (#f_barrel1 ...),
     never measured melt temperatures; reference bands are the selected grade's source or local ranges. */
  const heat={on:false,order:'hopper'};
  try{heat.order=localStorage.getItem('pha_heat_barrel1')==='nozzle'?'nozzle':'hopper';}catch{}
  const heatZoneLabel=key=>({Z1:['Z1','Z1'],Z2:['Z2','Z2'],Z3:['Z3','Z3'],nozzle:['노즐','Nozzle'],mold:['금형','Mould']})[key]||[key,key];
  // Zone key -> input field, honouring which end of the barrel the site calls "barrel 1".
  function heatFields(){
    const spec=meta.heat,order=heat.order==='nozzle'?[...spec.barrel_fields].reverse():spec.barrel_fields;
    const map=Object.fromEntries(spec.barrel_order.map((zone,i)=>[zone,order[i]]));
    for(const zone of spec.zones)if(zone.field)map[zone.key]=zone.field;
    return map;
  }
  // Zones with the field each one reads, its colour group and label (mould halves share one row).
  function heatZones(){
    const fields=heatFields();
    return meta.heat.zones.map(zone=>({...zone,field:fields[zone.key],group:zone.field==='mold'?'tool':'melt',
      label:heatZoneLabel(zone.field==='mold'?'mold':zone.key)}));
  }
  function refreshHeat(){
    if(!runtime?.heat||!host)return;
    const grade=document.getElementById('grade')?.value;
    let reco={};try{reco=typeof getReco==='function'&&typeof profileOf==='function'?getReco(profileOf(grade),'injection'):{};}catch{}
    const zones=heatZones(),rows=viewer().heatRows(zones,field=>document.getElementById('f_'+field)?.value??'',field=>reco[field]||null);
    for(const row of rows)row.fieldLabel=row.field.replace('barrel',t('배럴 ','Barrel ')).replace('nozzle',t('노즐','Nozzle')).replace('mold',t('금형','Mould'));
    // Melt-side zones and the mould sit ~100 °C apart, so each gets its own fixed comparison range.
    const scales=viewer().heatScales(rows);
    runtime.heat.update(viewer().heatValues(zones,rows,scales));runtime.heat.setVisible(heat.on);
    const panel=host.querySelector('.motion-heat');if(!panel)return;
    panel.hidden=!heat.on;
    panel.querySelector('[data-heat="order"]').value=heat.order;
    viewer().renderHeatPanel(panel,{rows,scales,colorOf:runtime.heat.colorOf,locale,scaleLabels:{melt:['배럴·노즐','Barrel & nozzle'],tool:['금형','Mould']}});
    const toggle=host.querySelector('[data-motion="heat"]');if(toggle)toggle.setAttribute('aria-pressed',String(heat.on));
    paint();
  }

  function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;lastTick=0;}
  function movingManual(){return state.mode==='manual'&&(axes.some(key=>Math.abs(manual[key]-target[key])>.001)||(manual.released&&manual.fall<1));}
  function canRun(){return !!(runtime&&state.ready&&(state.playing||state.studyPlaying||movingManual())&&state.visible&&host?.isConnected&&!host.classList.contains('is-study-photo')&&document.visibilityState==='visible');}
  function canJog(axis){
    if(axis==='ejector')return manual.mold>=99.99&&target.mold>=99.99;
    if(axis==='mold')return manual.ejector<.01&&target.ejector<.01;
    return manual.mold<.01&&target.mold<.01&&manual.ejector<.01&&target.ejector<.01;
  }
  // Part position while it is still carried by the moving half (three.js coordinates).
  function carried(){
    const s=meta.strokes_m,g=meta.part.gate;
    return [g[0]+s.mold*manual.mold/100-s.ejector*manual.ejector/100,g[1],g[2]];
  }
  function stepManual(dt){
    const before=manual.screw,angle=manual.rotation;
    for(const key of axes){
      const delta=target[key]-manual[key];
      manual[key]=Math.abs(delta)<.01?target[key]:manual[key]+delta*(1-Math.exp(-dt*14));
    }
    manual.flow=manual.screw<before-.0001?'fill':manual.screw>before+.0001||Math.abs(manual.rotation-angle)>.0001?'meter':'';
    if(manual.flow==='fill')manual.fill=Math.max(manual.fill,100-manual.screw);
    if(!manual.released&&manual.ejector>=meta.part.release_ejector&&manual.fill>.1){manual.released=true;manual.releaseAt=carried();}
    if(manual.released)manual.fall=Math.min(1,manual.fall+dt*1.1);
  }
  function along(points,f){
    const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1],p[2]-points[i][2]));
    let remaining=f*lengths.reduce((a,b)=>a+b,0);
    for(let i=0;i<lengths.length;i++){
      if(remaining<=lengths[i]||i===lengths.length-1){const k=lengths[i]?Math.min(1,remaining/lengths[i]):0;return points[i].map((v,j)=>v+(points[i+1][j]-v)*k);}
      remaining-=lengths[i];
    }
    return points[points.length-1];
  }
  function applyManual(){
    const n=runtime.nodes,s=meta.strokes_m,screw=s.screw*manual.screw/100;
    n.ScrewSlide.position.x=-screw;n.ScrewSpin.rotation.set(-manual.rotation*Math.PI/180,0,0);
    n.Ejector.position.x=manual.mold>=95?-s.ejector*manual.ejector/100:0;
    n.MeltReservoir.scale.x=s.cushion+screw;
    const drop=manual.fall*manual.fall,offset=manual.released?along(meta.part.drop_path,drop):[0,0,0];
    const base=manual.released?manual.releaseAt:carried();
    n.MoldedPart.position.set(base[0]+offset[0],base[1]+offset[1],base[2]+offset[2]);
    n.MoldedPart.rotation.set(manual.released?1.22*drop:0,0,0);
    n.MoldedPart.scale.set(1,1,1);n.MoldedPart.visible=manual.fill>.01;
    n.PartFill.scale.set(1,Math.max(.001,manual.fill/100),1);
    n.RunnerFill.scale.set(1,1,1);n.RunnerFill.visible=manual.fill>.01;
    runtime.particles.forEach(node=>{node.visible=node.name.startsWith('FillFlow')?manual.flow==='fill':manual.flow==='meter';});
  }
  // frameTime marks a playback frame; its following tick measures the frame cost.
  // Scene pose from the current state (cheap CPU work); paint() also draws it.
  function pose(){
    const posed=state.mode==='manual'||state.mode==='study';
    // Particles and the check ring replay the dosing/fill windows; the clamp follows its sweep segment.
    const [d0,d1]=meta.windows.dosing,[f0,f1]=meta.windows.fill;
    const poseTime=posed?(manual.flow==='meter'?d0+(manual.rotation/180+manual.screw*.03)%(d1-d0-.05):f0+(100-manual.screw)/100*(f1-f0-.01)):state.time;
    const [a,b]=meta.sweeps.mold_opening,machineTime=Math.min(DURATION-.001,Math.max(0,poseTime));
    const clampTime=posed?Math.min(b-.001,a+(b-a)*manual.mold/100):Math.min(DURATION-.001,state.time);
    for(const [key,group] of runtime.groups)group.mixer.setTime(key==='clamp'?clampTime:machineTime);
    if(posed)applyManual();
    runtime.scene.updateMatrixWorld(true);
  }
  function paint(frameTime){
    if(!runtime||!host?.isConnected)return;
    pose();runtime.governor.render(runtime.camera,frameTime||performance.now(),!!frameTime);
    state.frames++;
  }
  // Orbit drags fire many change events; draw at most once per animation frame.
  function paintSoon(){if(!pendingPaint)pendingPaint=requestAnimationFrame(()=>{pendingPaint=0;paint();});}
  function update(){
    const phase=phaseAt(state.time);state.phase=phase;
    if(!host)return;
    const button=host.querySelector('[data-motion="play"]');
    if(button){button.textContent=state.playing?t('일시정지','Pause'):t('재생','Play');button.setAttribute('aria-pressed',String(state.playing));}
    const progress=host.querySelector('[data-motion="progress"]');
    if(progress){progress.value=String(Math.round(state.time/DURATION*1000)/10);progress.setAttribute('aria-valuetext',names[phase][locale==='en'?1:0]);}
    const status=host.querySelector('.motion-phase');
    const step=stepAt(state.time);
    if(status)status.textContent=state.mode==='manual'?t('직접 조작 · 금형 개방 ','Manual · Mold opening ')+manual.mold.toFixed(1)+'% · '+t('충전 ','Fill ')+manual.fill.toFixed(1)+'%':String(phase+1).padStart(2,'0')+' · '+names[phase][locale==='en'?1:0]+(step?' — '+step:'');
    host.querySelectorAll('[data-motion-stage]').forEach(button=>button.setAttribute('aria-pressed',String(state.mode==='cycle'&&Number(button.dataset.motionStage)===phase)));
    const isManual=state.mode==='manual';
    const toggle=host.querySelector('[data-motion="manual"]');
    if(toggle){toggle.setAttribute('aria-pressed',String(isManual));toggle.textContent=isManual?t('자동 공정으로 돌아가기','Return to cycle'):t('직접 조작','Manual controls');}
    const panel=host.querySelector('.motion-manual');if(panel)panel.hidden=!isManual;
    if(window.phaSyncMachineOverlay)window.phaSyncMachineOverlay();else document.body.classList.toggle('pha-machine-manual',isManual);
    for(const key of ['play','speed','progress']){const input=host.querySelector('[data-motion="'+key+'"]');if(input)input.disabled=!state.ready||isManual;}
    host.querySelectorAll('[data-axis]').forEach(input=>{
      const key=input.dataset.axis;input.disabled=!state.ready||!canJog(key);input.value=String(target[key]);
      const value=manual[key].toFixed(key==='rotation'?0:1)+(key==='rotation'?'°':'%');
      input.setAttribute('aria-valuetext',value);
      host.querySelector('[data-axis-value="'+key+'"]').textContent=value;
    });
    const lock=host.querySelector('.motion-interlock');
    const message=manual.ejector>.01||target.ejector>.01?t('이젝터를 0%로 복귀하면 금형을 닫을 수 있습니다.','Retract the ejector to 0% before closing the mold.'):manual.mold<99.99?t('금형을 100% 열면 이젝터를 조작할 수 있습니다.','Open the mold to 100% to operate the ejector.'):t('이젝터를 100% 전진시키면 제품이 분리됩니다.','Advance the ejector to 100% to release the part.');
    if(lock&&lock.textContent!==message)lock.textContent=message;
    if(state.mode==='study'&&status)status.textContent=t('계산 동작 · 선택한 기구만 표시','Calculated motion · Selected mechanism');
    if(state.mode==='cycle')onStage(phase);
    chart?.setTime(state.time);host.querySelector('.motion-cycle')?.classList.toggle('is-idle',state.mode!=='cycle');
  }
  function stopStudy(){state.studyPlaying=false;cancel();studyPanel?.clearStatus();if(state.mode==='study')paint();}
  function leaveStudy(){if(state.mode==='study'){stopStudy();leaveManual();}}
  function startStudy(drive){
    stopStudy();state.playing=false;prepareShot();state.mode='study';state.study={...drive,elapsed:0};state.studyPlaying=drive.type==='travel'||drive.rpm>0;
    advanceStudy(0);paint();update();schedule();
  }
  function advanceStudy(dt){
    const drive=state.study;if(!drive||!state.studyPlaying)return;
    drive.elapsed+=dt*drive.scale;
    if(drive.type==='spin'){manual.rotation=PHAKinematics.degrees(drive.rpm,drive.elapsed)%720;manual.flow='meter';}
    else{
      const fraction=drive.seconds===0?0:Math.min(1,drive.elapsed/drive.seconds);
      manual.screw=100*(1-fraction);manual.fill=100*fraction;manual.flow=drive.seconds>0&&fraction<1?'fill':'';
      if(drive.seconds===0||fraction===1){state.studyPlaying=false;drive.onComplete?.();}
    }
  }
  function tick(now){
    raf=0;
    if(!canRun()){lastTick=0;return;}
    runtime.governor.observe(now);
    if(lastTick){const dt=Math.min((now-lastTick)/1000,.1);if(state.mode==='study')advanceStudy(dt);else if(state.mode==='manual')stepManual(dt);else state.time=(state.time+dt*state.speed)%DURATION;}
    // Time and pose follow the wall clock every tick; only drawing is skipped while the governor
    // protects input handling.
    lastTick=now;if(runtime.governor.due(now)){paint(now);update();}else if(host?.isConnected)pose();
    // A skipped frame must not leave the final pose undrawn when the loop stops.
    if(canRun())raf=requestAnimationFrame(tick);else{lastTick=0;manual.flow='';paint();update();}
  }
  function schedule(){if(canRun()&&!raf)raf=requestAnimationFrame(tick);else if(!canRun())cancel();}
  function leaveManual(){
    state.mode='cycle';
    if(runtime){for(const name of ['MoldedPart','RunnerFill'])runtime.nodes[name].visible=true;runtime.particles.forEach(node=>node.visible=true);}
  }
  function seek(time){stopStudy();leaveManual();state.time=Math.min(DURATION-.001,Math.max(0,time));state.playing=false;cancel();paint();update();}
  function prepareShot(){
    Object.assign(manual,{screw:100,rotation:0,mold:0,ejector:0,fill:0,released:false,fall:0,releaseAt:null,flow:''});
    Object.assign(target,{screw:100,rotation:0,mold:0,ejector:0});cancel();paint();update();
  }
  function toggleManual(){
    state.playing=false;cancel();
    if(state.mode==='manual'){leaveManual();paint();update();}
    else{state.mode='manual';prepareShot();}
  }
  function resetView(front=false){
    if(!runtime)return;
    const view=meta.view;
    runtime.camera.position.set(...(front?view.side_position:view.position));
    runtime.camera.zoom=1;runtime.camera.updateProjectionMatrix();
    runtime.controls.target.set(...view.target);runtime.controls.update();paint();
    state.focus='all';const selector=host?.querySelector('[data-motion="focus"]');if(selector)selector.value='all';
  }
  function focusView(kind){
    if(!runtime)return;
    const focus=meta.focus[kind];
    if(!focus){resetView();return;}
    // A close-up may carry its own camera position; otherwise reuse the overview direction.
    const view=meta.view,direction=view.position.map((v,i)=>v-view.target[i]);
    runtime.controls.target.set(...focus.target);
    runtime.camera.position.set(...(focus.position||focus.target.map((v,i)=>v+direction[i])));
    runtime.camera.zoom=focus.zoom;runtime.camera.updateProjectionMatrix();
    runtime.controls.update();state.focus=kind;paint();
  }
  function resize(){
    if(!runtime||!host?.isConnected)return;
    const viewport=host.querySelector('.motion-viewport');
    const width=viewport?.clientWidth||0;if(!width)return;
    const compact=host.classList.contains('is-study-open')&&matchMedia('(max-width:760px)').matches;
    const height=Math.round(compact?Math.min(width*.55,220):width*(width<480?.66:.50));
    viewport.style.height=height+'px';
    runtime.renderer.setSize(width,height,false);
    viewer().frameOrtho(runtime.camera,width,height,meta.view.span);paint();
    const cycleHost=host.querySelector('.cycle-host');
    if(chart&&cycleHost?.clientWidth){chart.render(cycleHost.clientWidth);chart.setTime(state.time);}
  }
  async function create(){
    const stage=await viewer().createStage({onContextLost:()=>fallback(),zoom:[.8,4]});
    try{
      stage.controls.addEventListener('change',()=>{if(!canRun())paintSoon();});
      const gltf=await stage.loader.loadAsync(MODEL);
      if(!gltf.animations.length)throw new Error('Missing Blender animation');
      meta=viewer().prepareModel(gltf.scene);
      if(meta?.schema!=='pha-machine-v1')throw new Error('Missing machine metadata');
      STARTS=meta.stage_starts;DURATION=meta.cycle_seconds;
      stage.scene.add(gltf.scene);viewer().fitShadows(stage,gltf.scene);
      // Clamp-unit tracks sample the mold sweep in manual mode; every other group follows the cycle.
      const groups=viewer().groupClips(stage.THREE,gltf.scene,gltf.animations,'machine');
      const nodes=Object.fromEntries(['ScrewSlide','ScrewSpin','MovingMold','Ejector','MoldedPart','PartFill','RunnerFill','MeltReservoir','Crosshead'].map(name=>[name,gltf.scene.getObjectByName(name)]));
      if(Object.values(nodes).some(node=>!node)||!groups.get('clamp')?.tracks)throw new Error('Missing machine rig node');
      const particles=[];gltf.scene.traverse(node=>{if(/^(FeedPellet|BarrelFlow|FillFlow)/.test(node.name))particles.push(node);});
      const governor=viewer().createGovernor(stage,{onQualityChange:()=>resize()});
      const heatOverlay=meta.heat?viewer().createHeatOverlay(stage,gltf.scene,meta.heat.zones):null;
      await viewer().warm(stage,gltf.scene);
      runtime={...stage,groups,governor,heat:heatOverlay,model:gltf.scene,nodes,particles};
      resetView();state.ready=true;
    }catch(error){stage.renderer.dispose();throw error;}
  }
  function fallback(){
    failed=true;state.ready=false;cancel();
    if(!host)return;
    host.dataset.motionState='fallback';
    const message=host.querySelector('.motion-load');
    if(message){message.hidden=false;message.textContent=t('이 기기에서 3D를 열지 못했습니다. 설비 그림과 단계 설명을 확인하세요.','3D could not be opened on this device. The equipment image and stage descriptions remain available.');}
    host.querySelector('.motion-viewport')?.setAttribute('hidden','');
    const poster=host.querySelector('.motion-poster');if(poster)poster.hidden=false;
    host.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);
    state.studyPlaying=false;
    host.querySelectorAll('.study-viewbar button,.equipment-study input,.equipment-study select,.equipment-study [data-study-stop]').forEach(el=>el.disabled=false);studyPanel?.refresh();
  }
  function detach(){
    token++;stopStudy();cancel();state.visible=false;
    runtime?.renderer.domElement.remove();
    if(window.phaSyncMachineOverlay)window.phaSyncMachineOverlay();else document.body.classList.remove('pha-machine-manual');
    unwatch?.();unwatch=null;host=null;onStage=()=>{};chart=null;
  }
  async function mount(targetHost,options={}){
    detach();host=targetHost;locale=options.locale||'ko';onStage=options.onStage||(()=>{});const current=token;
    host.dataset.motionState='loading';
    host.innerHTML=`<div class="motion-load" role="status">${t('움직이는 사출 설비 불러오는 중…','Loading the animated injection machine…')}</div>
      <img class="motion-poster" src="assets/equipment/injection-motion-poster.png${VERSION}" width="1280" height="640" alt="${t('토글 형체부, 절개한 배럴·스크류와 금형을 갖춘 사출기 모델','Injection machine model with a toggle clamp and a cutaway barrel, screw and mold')}">
      <div class="motion-viewport" hidden></div>
      <div class="motion-toolbar"><button type="button" data-motion="play" disabled>${t('재생','Play')}</button><label>${t('재생 속도','Playback speed')} <select data-motion="speed" aria-label="${t('설명 재생 속도','Illustration playback speed')}" disabled><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label><button type="button" data-motion="manual" aria-pressed="false" disabled>${t('직접 조작','Manual controls')}</button><label>${t('관찰 부위','View')} <select data-motion="focus" aria-label="${t('관찰 부위','Inspection area')}" disabled><option value="all">${t('전체','Whole machine')}</option><option value="screw">${t('스크류','Screw')}</option><option value="mold">${t('금형·취출','Mold & ejector')}</option></select></label><button type="button" data-motion="front" disabled>${t('측면 보기','Side view')}</button><button type="button" data-motion="view" disabled>${t('시점 초기화','Reset view')}</button><button type="button" data-motion="heat" aria-pressed="false" disabled>${t('온도 표시','Temperatures')}</button><span class="motion-phase"></span></div>
      <label class="motion-progress">${t('공정 진행 위치','Cycle position')}<input type="range" min="0" max="100" step="0.1" data-motion="progress" aria-label="${t('공정 진행 위치','Cycle position')}" disabled></label>
      <figure class="motion-cycle" hidden><div class="cycle-host"></div><figcaption>${t('장비별 사이클 단계 · 가로축은 재생 시간(초) · 누르거나 끌면 그 시점으로 이동','Cycle by actuator · horizontal axis in playback seconds · press or drag to jump there')}</figcaption></figure>
      <p class="motion-hint">${t('정상 연속 사이클: 14초 재생 = 예시 30초 사이클, 다음 샷 계량은 냉각 중 진행 · 드래그 회전 · 휠/두 손가락 확대 · 초록색은 수지 · 단계 선택 시 일시정지','Steady cycle: 14 s playback = 30 s example cycle; next-shot dosing runs during cooling · Drag to rotate · Wheel/pinch to zoom · Green is polymer · Stage selection pauses playback')}</p>
      <div class="motion-heat" hidden><div class="heat-head"><strong>${t('배럴·노즐·금형 온도 (입력한 설정값)','Barrel, nozzle and mould temperatures (entered set points)')}</strong><label>${t('배럴 1 위치','Barrel 1 is at')} <select data-heat="order" aria-label="${t('배럴 1 위치','Barrel 1 position')}"><option value="hopper">${t('호퍼 쪽','Hopper end')}</option><option value="nozzle">${t('노즐 쪽','Nozzle end')}</option></select></label></div><ol class="heat-zones"></ol><div class="heat-scale"></div><p class="heat-note">${t('공정 조건에 입력한 설정값을 존별 색으로 표시합니다. 배럴 설정값이며 실제 용융온도나 실측값이 아닙니다. 참고 범위는 선택한 그레이드의 근거 또는 사용자 수정 범위이고, 굵은 테두리는 범위 밖, 빗금은 미입력입니다. 배럴 1이 어느 쪽인지는 장비마다 다르므로 현장 표기에 맞춰 선택하세요.','Colours show the set points entered under process conditions. They are barrel set points, not melt or measured temperatures. Reference bands come from the selected grade source or your edits; a heavy outline marks values outside the band and hatching marks missing values. Machines number barrel zones from different ends, so match your site convention.')}</p></div>
      <div class="motion-manual" hidden><p class="motion-manual-intro">${t('계량 완료 상태입니다. 후퇴량을 100→0%로 줄여 스크류를 전진시키고, 금형을 연 뒤 취출하세요.','The shot is metered. Move the screw forward (retraction 100→0%) to fill, then open the mold and eject.')}</p><div class="motion-axes">${[
        ['screw','스크류 후퇴량','Screw retraction',100,.1],['rotation','스크류 회전각','Screw rotation',720,1],['mold','금형 개방량','Mold opening',100,.1],['ejector','이젝터 전진량','Ejector advance',100,.1]
      ].map(([key,ko,en,max,step])=>'<label class="motion-axis"><span>'+t(ko,en)+'<output data-axis-value="'+key+'"></output></span><input type="range" data-axis="'+key+'" min="0" max="'+max+'" step="'+step+'" aria-label="'+t(ko,en)+'" disabled></label>').join('')}</div><p class="motion-interlock" role="status"></p><div class="motion-manual-footer"><button type="button" data-motion="shot" disabled>${t('새 샷 준비','Prepare new shot')}</button><small>${t('%는 모형의 이동 비율입니다. 실제 장비 설정값이 아닙니다.','% is model travel, not a real machine setting.')}</small></div></div>
      ${options.stages?'<div class="motion-stages">'+names.map((name,i)=>'<button type="button" data-motion-stage="'+i+'" aria-pressed="false">'+String(i+1).padStart(2,'0')+' · '+name[locale==='en'?1:0]+'</button>').join('')+'</div>':''}`;
    host.querySelector('[data-motion="speed"]').value=String(state.speed);
    host.querySelector('[data-motion="focus"]').value=state.focus;
    studyPanel=window.PHAEquipmentStudy?.mount(host,{kind:'injection',locale,start:startStudy,stop:stopStudy,pause:()=>{state.playing=false;cancel();update();}});
    host.querySelector('.motion-toolbar').addEventListener('click',leaveStudy,true);
    host.querySelector('.motion-toolbar').addEventListener('change',leaveStudy,true);
    if(failed){fallback();return;}
    try{
      if(!loading)loading=create();await loading;
      if(current!==token||!host?.isConnected)return;
      host.querySelector('.motion-viewport').appendChild(runtime.renderer.domElement);
      runtime.renderer.domElement.setAttribute('aria-label',t('수지 이동, 스크류 회전·전진, 토글 형체와 금형 개폐·취출을 보여주는 3D 애니메이션','3D animation of polymer flow, screw rotation/advance, toggle clamping, mold opening and ejection'));
      host.querySelector('.motion-viewport').hidden=false;host.querySelector('.motion-poster').hidden=true;
      host.querySelector('.motion-load').hidden=true;host.dataset.motionState='ready';
      host.querySelectorAll('button,input,select').forEach(el=>el.disabled=false);
      studyPanel?.refresh();
      if(meta.lanes){
        chart=viewer().createCycleChart(host.querySelector('.cycle-host'),meta,{locale,stageNames:names.map(name=>name[locale==='en'?1:0]),onSeek:seek});
        host.querySelector('.motion-cycle').hidden=false;
      }
      host.querySelector('[data-motion="play"]').onclick=()=>{state.playing=!state.playing;update();schedule();};
      host.querySelector('[data-motion="speed"]').onchange=event=>{state.speed=Number(event.target.value);};
      host.querySelector('[data-motion="progress"]').oninput=event=>seek(Number(event.target.value)/100*DURATION);
      host.querySelector('[data-motion="front"]').onclick=()=>resetView(true);
      host.querySelector('[data-motion="view"]').onclick=()=>resetView();
      host.querySelector('[data-motion="focus"]').onchange=event=>focusView(event.target.value);
      host.querySelector('[data-motion="manual"]').onclick=toggleManual;
      host.querySelector('[data-motion="shot"]').onclick=prepareShot;
      host.querySelector('[data-motion="heat"]').onclick=()=>{heat.on=!heat.on;refreshHeat();};
      host.querySelector('[data-heat="order"]').onchange=event=>{
        heat.order=event.target.value==='nozzle'?'nozzle':'hopper';
        try{localStorage.setItem('pha_heat_barrel1',heat.order);}catch{}
        refreshHeat();
      };
      host.querySelectorAll('[data-axis]').forEach(input=>input.oninput=event=>{
        const axis=input.dataset.axis,value=Number(event.target.value);
        if(state.mode!=='manual'||!canJog(axis)||!Number.isFinite(value)){update();return;}
        target[axis]=Math.min(axis==='rotation'?720:100,Math.max(0,value));
        if(reduced.matches){stepManual(10);manual.flow='';paint();}else schedule();
        update();
      });
      host.querySelectorAll('[data-motion-stage]').forEach(button=>button.onclick=()=>seek(STARTS[Number(button.dataset.motionStage)]+.35));
      unwatch=viewer().watch(host,{onResize:resize,onVisible:visible=>{state.visible=visible;schedule();}});
      resize();update();refreshHeat();
    }catch(error){if(current===token)fallback();}
  }
  document.addEventListener('visibilitychange',schedule);
  function syncSurface(){
    const flash=document.querySelector('#flash.tabpage.active #flash-tab-3.active #flashInjectionMotion');
    if(flash){if(host!==flash)mount(flash,{locale:typeof LANG!=='undefined'?LANG:'ko',stages:true});return;}
    const main=document.querySelector('#proc.tabpage.active #injectionMotion');
    if(main&&document.getElementById('process')?.value==='injection'){
      if(host!==main)window.renderProcessAtlas?.();
    }else detach();
  }
  window.addEventListener('pha-language-change',()=>requestAnimationFrame(syncSurface));
  // Entered set points, grade/mould-mode changes and saved reference edits update the heat map at once.
  document.addEventListener('input',event=>{if(heat.on&&event.target.closest?.('#dynamicFields'))refreshHeat();});
  document.addEventListener('change',event=>{if(heat.on&&['grade','moldMode','process'].includes(event.target.id))setTimeout(refreshHeat,0);});
  document.addEventListener('click',event=>{if(heat.on&&event.target.closest?.('#modalSaveBtn'))setTimeout(refreshHeat,0);});
  reduced.addEventListener('change',event=>{if(event.matches){state.playing=false;stopStudy();cancel();if(state.mode==='manual'){stepManual(10);manual.flow='';paint();}update();}});
  window.PHAInjectionMotion={mount,detach,syncSurface,seekStage(index){if(index>=0&&index<4)seek(STARTS[index]+.35);},getState:()=>({...state,manual:{...manual},target:{...target}})};
  if(['localhost','127.0.0.1'].includes(location.hostname))window.__phaInjectionMotionTest=()=>{
    const world=name=>{const n=runtime?.model.getObjectByName(name);return n?n.getWorldPosition(new runtime.THREE.Vector3()).toArray():null;};
    const tip=(name,length)=>{const n=runtime?.model.getObjectByName(name);return n?n.localToWorld(new runtime.THREE.Vector3(length,0,0)).toArray():null;};
    return {
      ...state,manual:{...manual},target:{...target},meta,camera:runtime?{zoom:runtime.camera.zoom,target:runtime.controls.target.toArray()}:null,
      clips:runtime?[...runtime.groups].map(([name,group])=>({name,duration:group.duration,tracks:group.tracks})):[],
      quality:runtime?{level:runtime.governor.level,cost:runtime.governor.cost}:null,
      heat:{on:heat.on,order:heat.order,zones:runtime?.heat?Object.fromEntries(runtime.heat.keys.map(key=>{const mesh=runtime.model.getObjectByName('PHAHeat_'+key);return [key,mesh?{visible:mesh.visible,color:'#'+mesh.material.color.getHexString(),hatched:!!mesh.material.map,outline:!!mesh.children[0]?.visible,parent:mesh.parent?.name}:null];})):null},
      nodes:Object.fromEntries(['ScrewSlide','ScrewSpin','MovingMold','Ejector','MoldedPart','PartFill','RunnerFill','FeedPellet00','FillFlow00','MeltReservoir','Crosshead','ToggleRearUpper','Carriage','CheckRing'].map(name=>{const n=runtime?.model.getObjectByName(name);return [name,n?{position:n.position.toArray(),quaternion:n.quaternion.toArray(),scale:n.scale.toArray(),visible:n.visible}:null];})),
      linkage:runtime?{kneeUpper:world('ToggleKneeUpper'),frontTipUpper:tip('ToggleFrontUpper',meta.toggle.L2),kneeLower:world('ToggleKneeLower'),frontTipLower:tip('ToggleFrontLower',meta.toggle.L2),pinUpper:world('ToggleCrossPinUpper'),crossTipUpper:tip('ToggleCrossLinkUpper',meta.toggle.L3)}:null
    };
  };
})();
