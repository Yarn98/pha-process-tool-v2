/* Blender-authored machine motion. This is a teaching sequence, not process simulation. */
(function () {
  'use strict';
  const VENDOR='./vendor/three-0.185.1/';
  const MODEL='./assets/equipment/injection-motion.glb?v=18';
  const STARTS=[0,4,6,10], DURATION=14;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const state={time:1.2,speed:1,playing:!reduced.matches,phase:0,ready:false,visible:false,frames:0,mode:'cycle',focus:'all'};
  const axes=['screw','rotation','mold','ejector'];
  const manual={screw:100,rotation:0,mold:0,ejector:0,fill:0,released:false,fall:0,releaseX:0,flow:''};
  const target={screw:100,rotation:0,mold:0,ejector:0};
  let host=null,locale='ko',onStage=()=>{},runtime=null,loading=null,token=0,raf=0,lastTick=0,failed=false;
  let resizeObserver=null,intersectionObserver=null;
  const t=(ko,en)=>locale==='en'?en:ko;
  const phaseAt=time=>time<4?0:time<6?1:time<10?2:3;
  const names=[['가소화·계량','Plasticize & meter'],['금형 충전','Fill the mold'],['보압·냉각','Pack & cool'],['금형 개방·취출','Open & eject']];

  function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;lastTick=0;}
  function movingManual(){return state.mode==='manual'&&(axes.some(key=>Math.abs(manual[key]-target[key])>.001)||(manual.released&&manual.fall<1));}
  function canRun(){return !!(runtime&&(state.playing||movingManual())&&state.visible&&host?.isConnected&&document.visibilityState==='visible');}
  function canJog(axis){
    if(axis==='ejector')return manual.mold>=99.99&&target.mold>=99.99;
    if(axis==='mold')return manual.ejector<.01&&target.ejector<.01;
    return manual.mold<.01&&target.mold<.01&&manual.ejector<.01&&target.ejector<.01;
  }
  function stepManual(dt){
    const before=manual.screw,angle=manual.rotation;
    for(const key of axes){
      const delta=target[key]-manual[key];
      manual[key]=Math.abs(delta)<.01?target[key]:manual[key]+delta*(1-Math.exp(-dt*14));
    }
    manual.flow=manual.screw<before-.0001?'fill':manual.screw>before+.0001||Math.abs(manual.rotation-angle)>.0001?'meter':'';
    if(manual.flow==='fill')manual.fill=Math.max(manual.fill,100-manual.screw);
    if(!manual.released&&manual.ejector>=99.9&&manual.fill>.1){
      manual.released=true;manual.releaseX=.8+manual.mold*.011-manual.ejector*.0032;
    }
    if(manual.released)manual.fall=Math.min(1,manual.fall+dt*1.7);
  }
  function applyManual(){
    const n=runtime.nodes,s=manual.screw*.0065,m=manual.mold*.011,e=manual.ejector*.0032;
    n.ScrewSlide.position.x=-s;n.ScrewSpin.rotation.set(-manual.rotation*Math.PI/180,0,0);
    n.MovingMold.position.x=m;n.Ejector.position.x=-e;
    n.ClampRod.position.x=(5.05+m)/2;n.ClampRod.scale.x=1.85-m;
    n.MeltReservoir.position.x=-.27-(.09+s)/2;n.MeltReservoir.scale.x=.09+s;
    const drop=manual.fall*manual.fall*(3-2*manual.fall);
    n.MoldedPart.position.set(manual.released?manual.releaseX:.8+m-e,.72-.15*drop,0);
    n.MoldedPart.rotation.set(0,0,-Math.PI/2*drop);
    n.MoldedPart.scale.set(1,Math.max(.001,manual.fill/100),1);
    n.MoldedPart.visible=manual.fill>.01;
    n.RunnerFill.visible=manual.fill>.01&&m<.001&&!manual.released;
    runtime.particles.forEach(node=>{node.visible=node.name.startsWith('FillFlow')?manual.flow==='fill':manual.flow==='meter';});
  }
  function paint(){
    if(!runtime||!host?.isConnected)return;
    const poseTime=state.mode==='manual'?(manual.flow==='meter'?(manual.rotation/180+manual.screw*.04)%3.99:4+(100-manual.screw)/100*1.99):state.time;
    runtime.mixer.setTime(Math.min(DURATION-.001,Math.max(0,poseTime)));
    if(state.mode==='manual')applyManual();
    runtime.scene.updateMatrixWorld(true);
    runtime.renderer.render(runtime.scene,runtime.camera);
    state.frames++;
  }
  function update(){
    const phase=phaseAt(state.time);state.phase=phase;
    if(!host)return;
    const button=host.querySelector('[data-motion="play"]');
    if(button){button.textContent=state.playing?t('일시정지','Pause'):t('재생','Play');button.setAttribute('aria-pressed',String(state.playing));}
    const progress=host.querySelector('[data-motion="progress"]');
    if(progress){progress.value=String(Math.round(state.time/DURATION*1000)/10);progress.setAttribute('aria-valuetext',names[phase][locale==='en'?1:0]);}
    const status=host.querySelector('.motion-phase');
    if(status)status.textContent=state.mode==='manual'?t('직접 조작 · 금형 개방 ','Manual · Mold opening ')+manual.mold.toFixed(1)+'% · '+t('충전 ','Fill ')+manual.fill.toFixed(1)+'%':String(phase+1).padStart(2,'0')+' · '+names[phase][locale==='en'?1:0];
    host.querySelectorAll('[data-motion-stage]').forEach(button=>button.setAttribute('aria-pressed',String(state.mode==='cycle'&&Number(button.dataset.motionStage)===phase)));
    const isManual=state.mode==='manual';
    document.body.classList.toggle('pha-machine-manual',isManual);
    const toggle=host.querySelector('[data-motion="manual"]');
    if(toggle){toggle.setAttribute('aria-pressed',String(isManual));toggle.textContent=isManual?t('자동 공정으로 돌아가기','Return to cycle'):t('직접 조작','Manual controls');}
    const panel=host.querySelector('.motion-manual');if(panel)panel.hidden=!isManual;
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
    if(!isManual)onStage(phase);
  }
  function tick(now){
    raf=0;
    if(!canRun()){lastTick=0;return;}
    if(lastTick){const dt=Math.min((now-lastTick)/1000,.1);if(state.mode==='manual')stepManual(dt);else state.time=(state.time+dt*state.speed)%DURATION;}
    lastTick=now;paint();update();
    if(canRun())raf=requestAnimationFrame(tick);else{lastTick=0;if(manual.flow){manual.flow='';paint();}}
  }
  function schedule(){if(canRun()&&!raf)raf=requestAnimationFrame(tick);else if(!canRun())cancel();}
  function leaveManual(){
    state.mode='cycle';
    if(runtime){runtime.nodes.MoldedPart.visible=true;runtime.nodes.RunnerFill.visible=true;runtime.particles.forEach(node=>node.visible=true);}
  }
  function seek(time){leaveManual();state.time=Math.min(DURATION-.001,Math.max(0,time));state.playing=false;cancel();paint();update();}
  function prepareShot(){
    Object.assign(manual,{screw:100,rotation:0,mold:0,ejector:0,fill:0,released:false,fall:0,releaseX:0,flow:''});
    Object.assign(target,{screw:100,rotation:0,mold:0,ejector:0});cancel();paint();update();
  }
  function toggleManual(){
    state.playing=false;cancel();
    if(state.mode==='manual'){leaveManual();paint();update();}
    else{state.mode='manual';prepareShot();}
  }
  function resetView(front=false){
    if(!runtime)return;
    runtime.camera.position.set(...(front?[-.25,3.1,14]:[6.7,6.2,12.5]));
    runtime.camera.zoom=1;runtime.camera.updateProjectionMatrix();
    runtime.controls.target.set(-.35,1.22,0);runtime.controls.update();paint();
    state.focus='all';const selector=host?.querySelector('[data-motion="focus"]');if(selector)selector.value='all';
  }
  function focusView(kind){
    if(!runtime)return;
    if(kind==='all'){resetView();return;}
    const center=kind==='screw'?[-2.25,1.42,0]:[1.25,1.24,0];
    runtime.controls.target.set(...center);
    runtime.camera.position.set(center[0]+(kind==='screw'?1.2:2.4),center[1]+2.3,9);
    runtime.camera.zoom=kind==='screw'?2:2.5;runtime.camera.updateProjectionMatrix();
    runtime.controls.update();state.focus=kind;paint();
  }
  function resize(){
    if(!runtime||!host?.isConnected)return;
    const viewport=host.querySelector('.motion-viewport');
    const width=viewport?.clientWidth||0;if(!width)return;
    const height=Math.round(width*(width<480?.66:.50));
    viewport.style.height=height+'px';
    runtime.renderer.setSize(width,height,false);
    const aspect=width/height,vertical=10.8/aspect;
    runtime.camera.left=-vertical*aspect/2;runtime.camera.right=vertical*aspect/2;
    runtime.camera.top=vertical/2;runtime.camera.bottom=-vertical/2;
    runtime.camera.updateProjectionMatrix();paint();
  }
  async function create(){
    const [THREE,{GLTFLoader},{OrbitControls}]=await Promise.all([
      import('three'),import(VENDOR+'examples/jsm/loaders/GLTFLoader.js'),import(VENDOR+'examples/jsm/controls/OrbitControls.js')
    ]);
    let renderer;
    try{
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
      renderer.setClearColor(0xebe7dc);renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
      const scene=new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xfff7e8,0x7a837a,2.6));
      const key=new THREE.DirectionalLight(0xfff6e7,3.0);key.position.set(-2,7,6);scene.add(key);
      const fill=new THREE.DirectionalLight(0xe4eeff,2.0);fill.position.set(5,4,-3);scene.add(fill);
      const camera=new THREE.OrthographicCamera(-5.4,5.4,2.7,-2.7,.01,100);
      const controls=new OrbitControls(camera,renderer.domElement);
      controls.enablePan=false;controls.enableZoom=true;controls.enableDamping=false;
      controls.minZoom=.8;controls.maxZoom=2.8;
      controls.minPolarAngle=.30;controls.maxPolarAngle=Math.PI/2.05;
      controls.addEventListener('change',()=>{if(!canRun())paint();});
      const gltf=await new GLTFLoader().loadAsync(MODEL);
      if(!gltf.animations.length)throw new Error('Missing Blender animation');
      scene.add(gltf.scene);
      const mixer=new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach(clip=>mixer.clipAction(clip).play());
      renderer.domElement.setAttribute('role','img');
      renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
      const nodes=Object.fromEntries(['ScrewSlide','ScrewSpin','MovingMold','Ejector','MoldedPart','ClampRod','MeltReservoir','RunnerFill'].map(name=>[name,gltf.scene.getObjectByName(name)]));
      if(Object.values(nodes).some(node=>!node))throw new Error('Missing machine rig node');
      const particles=[];gltf.scene.traverse(node=>{if(/^(FeedPellet|BarrelFlow|FillFlow)/.test(node.name))particles.push(node);});
      runtime={renderer,scene,camera,controls,mixer,model:gltf.scene,clips:gltf.animations,nodes,particles};
      resetView();state.ready=true;
    }catch(error){renderer?.dispose();throw error;}
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
  }
  function detach(){
    token++;cancel();state.visible=false;
    document.body.classList.remove('pha-machine-manual');
    resizeObserver?.disconnect();intersectionObserver?.disconnect();host=null;onStage=()=>{};
  }
  async function mount(targetHost,options={}){
    detach();host=targetHost;locale=options.locale||'ko';onStage=options.onStage||(()=>{});const current=token;
    host.dataset.motionState='loading';
    host.innerHTML=`<div class="motion-load" role="status">${t('움직이는 사출 설비 불러오는 중…','Loading the animated injection machine…')}</div>
      <img class="motion-poster" src="assets/equipment/injection-motion-poster.png?v=18" width="1280" height="640" alt="${t('내부 스크류와 금형을 드러낸 사출기 절개 모델','Cutaway injection machine showing its screw and mold')}">
      <div class="motion-viewport" hidden></div>
      <div class="motion-toolbar"><button type="button" data-motion="play" disabled>${t('재생','Play')}</button><label>${t('재생 속도','Playback speed')} <select data-motion="speed" aria-label="${t('설명 재생 속도','Illustration playback speed')}" disabled><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option></select></label><button type="button" data-motion="manual" aria-pressed="false" disabled>${t('직접 조작','Manual controls')}</button><label>${t('관찰 부위','View')} <select data-motion="focus" aria-label="${t('관찰 부위','Inspection area')}" disabled><option value="all">${t('전체','Whole machine')}</option><option value="screw">${t('스크류','Screw')}</option><option value="mold">${t('금형·취출','Mold & ejector')}</option></select></label><button type="button" data-motion="front" disabled>${t('측면 보기','Side view')}</button><button type="button" data-motion="view" disabled>${t('시점 초기화','Reset view')}</button><span class="motion-phase"></span></div>
      <label class="motion-progress">${t('공정 진행 위치','Cycle position')}<input type="range" min="0" max="100" step="0.1" data-motion="progress" aria-label="${t('공정 진행 위치','Cycle position')}" disabled></label>
      <p class="motion-hint">${t('드래그 회전 · 휠/두 손가락 확대 · 초록색은 수지 · 단계 선택 시 일시정지','Drag to rotate · Wheel/pinch to zoom · Green is polymer · Stage selection pauses playback')}</p>
      <div class="motion-manual" hidden><p class="motion-manual-intro">${t('계량 완료 상태입니다. 후퇴량을 100→0%로 줄여 스크류를 전진시키고, 금형을 연 뒤 취출하세요.','The shot is metered. Move the screw forward (retraction 100→0%) to fill, then open the mold and eject.')}</p><div class="motion-axes">${[
        ['screw','스크류 후퇴량','Screw retraction',100,.1],['rotation','스크류 회전각','Screw rotation',720,1],['mold','금형 개방량','Mold opening',100,.1],['ejector','이젝터 전진량','Ejector advance',100,.1]
      ].map(([key,ko,en,max,step])=>'<label class="motion-axis"><span>'+t(ko,en)+'<output data-axis-value="'+key+'"></output></span><input type="range" data-axis="'+key+'" min="0" max="'+max+'" step="'+step+'" aria-label="'+t(ko,en)+'" disabled></label>').join('')}</div><p class="motion-interlock" role="status"></p><div class="motion-manual-footer"><button type="button" data-motion="shot" disabled>${t('새 샷 준비','Prepare new shot')}</button><small>${t('%는 모형의 이동 비율입니다. 실제 장비 설정값이 아닙니다.','% is model travel, not a real machine setting.')}</small></div></div>
      ${options.stages?'<div class="motion-stages">'+names.map((name,i)=>'<button type="button" data-motion-stage="'+i+'" aria-pressed="false">'+String(i+1).padStart(2,'0')+' · '+name[locale==='en'?1:0]+'</button>').join('')+'</div>':''}`;
    host.querySelector('[data-motion="speed"]').value=String(state.speed);
    host.querySelector('[data-motion="focus"]').value=state.focus;
    if(failed){fallback();return;}
    try{
      if(!loading)loading=create();await loading;
      if(current!==token||!host?.isConnected)return;
      host.querySelector('.motion-viewport').appendChild(runtime.renderer.domElement);
      runtime.renderer.domElement.setAttribute('aria-label',t('수지 이동, 스크류 회전·전진, 금형 개폐·취출을 보여주는 3D 애니메이션','3D animation of polymer flow, screw rotation/advance, mold opening and ejection'));
      host.querySelector('.motion-viewport').hidden=false;host.querySelector('.motion-poster').hidden=true;
      host.querySelector('.motion-load').hidden=true;host.dataset.motionState='ready';
      host.querySelectorAll('button,input,select').forEach(el=>el.disabled=false);
      host.querySelector('[data-motion="play"]').onclick=()=>{state.playing=!state.playing;update();schedule();};
      host.querySelector('[data-motion="speed"]').onchange=event=>{state.speed=Number(event.target.value);};
      host.querySelector('[data-motion="progress"]').oninput=event=>seek(Number(event.target.value)/100*DURATION);
      host.querySelector('[data-motion="front"]').onclick=()=>resetView(true);
      host.querySelector('[data-motion="view"]').onclick=()=>resetView();
      host.querySelector('[data-motion="focus"]').onchange=event=>focusView(event.target.value);
      host.querySelector('[data-motion="manual"]').onclick=toggleManual;
      host.querySelector('[data-motion="shot"]').onclick=prepareShot;
      host.querySelectorAll('[data-axis]').forEach(input=>input.oninput=event=>{
        const axis=input.dataset.axis,value=Number(event.target.value);
        if(state.mode!=='manual'||!canJog(axis)||!Number.isFinite(value)){update();return;}
        target[axis]=Math.min(axis==='rotation'?720:100,Math.max(0,value));
        if(reduced.matches){stepManual(10);manual.flow='';paint();}else schedule();
        update();
      });
      host.querySelectorAll('[data-motion-stage]').forEach(button=>button.onclick=()=>seek(STARTS[Number(button.dataset.motionStage)]+.35));
      resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
      intersectionObserver=new IntersectionObserver(entries=>{state.visible=!!entries[0]?.isIntersecting;schedule();},{threshold:.02});
      intersectionObserver.observe(host);resize();update();
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
  reduced.addEventListener('change',event=>{if(event.matches){state.playing=false;cancel();if(state.mode==='manual'){stepManual(10);manual.flow='';paint();}update();}});
  window.PHAInjectionMotion={mount,detach,syncSurface,seekStage(index){if(index>=0&&index<4)seek(STARTS[index]+.35);},getState:()=>({...state,manual:{...manual},target:{...target}})};
  if(['localhost','127.0.0.1'].includes(location.hostname))window.__phaInjectionMotionTest=()=>({
    ...state,manual:{...manual},target:{...target},camera:runtime?{zoom:runtime.camera.zoom,target:runtime.controls.target.toArray()}:null,clips:runtime?.clips.map(c=>({name:c.name,duration:c.duration,tracks:c.tracks.length}))||[],
    nodes:Object.fromEntries(['ScrewSlide','ScrewSpin','MovingMold','Ejector','MoldedPart','FeedPellet00','FillFlow00','ClampRod','MeltReservoir'].map(name=>{const n=runtime?.model.getObjectByName(name);return [name,n?{position:n.position.toArray(),quaternion:n.quaternion.toArray(),scale:n.scale.toArray(),visible:n.visible}:null];}))
  });
})();
