/* Shared three.js stage for the Blender equipment players (window.PHAMachineViewer).
   Owns what every machine view needs: renderer, studio lighting and contact shadows,
   GLB loading with machine metadata, motion-group animation clips, orthographic
   framing, visibility/resize observation and disposal. Players keep their own UI. */
(function(){
  'use strict';
  const VENDOR='./vendor/three-0.185.1/';
  let imports=null;
  function modules(){
    imports||=Promise.all([import('three'),import(VENDOR+'examples/jsm/loaders/GLTFLoader.js'),import(VENDOR+'examples/jsm/controls/OrbitControls.js')])
      .then(([THREE,{GLTFLoader},{OrbitControls}])=>({THREE,GLTFLoader,OrbitControls}));
    return imports;
  }
  // Soft studio reflections without an HDR download: a dim room with emissive softboxes.
  function studioEnvironment(THREE,renderer){
    const room=new THREE.Scene(),panel=(w,h,position,rotation,intensity)=>{
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));
      mesh.material.color.setScalar(intensity);mesh.position.set(...position);mesh.rotation.set(...rotation);room.add(mesh);
    };
    room.add(new THREE.Mesh(new THREE.BoxGeometry(14,7,14),new THREE.MeshBasicMaterial({color:0x8c8a84,side:THREE.BackSide})));
    panel(8,4,[0,3.4,0],[Math.PI/2,0,0],5);
    panel(4,2.4,[-6.9,1.4,0],[0,Math.PI/2,0],2.6);
    panel(4,2.4,[6.9,1.6,-1],[0,-Math.PI/2,0],2.2);
    panel(6,2,[0,1.4,6.9],[0,Math.PI,0],1.8);
    const generator=new THREE.PMREMGenerator(renderer),texture=generator.fromScene(room,.035).texture;
    generator.dispose();room.traverse(node=>{node.geometry?.dispose();node.material?.dispose();});
    return texture;
  }
  /* One WebGL stage per player. options: exposure, environment, onContextLost, zoom:[min,max], polar:[min,max],
     ground (adds a shadow-catching floor for models that do not carry their own). */
  async function createStage(options={}){
    const {THREE,GLTFLoader,OrbitControls}=await modules();
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    try{
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
      renderer.setClearColor(0xebe7dc);renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=options.exposure??1.05;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      const scene=new THREE.Scene();
      scene.environment=studioEnvironment(THREE,renderer);scene.environmentIntensity=options.environment??.9;
      scene.add(new THREE.HemisphereLight(0xfff7e8,0x7a837a,options.hemisphere??.6));
      const key=new THREE.DirectionalLight(0xfff6e7,options.key??2.2);key.position.set(-2.5,7,5);
      key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0004;key.shadow.normalBias=.02;
      Object.assign(key.shadow.camera,{left:-4.5,right:4.5,top:3.5,bottom:-3.5,near:.5,far:20});
      scene.add(key,key.target);
      let ground=null;
      if(options.ground){
        ground=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShadowMaterial({opacity:.16}));
        ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.name='PHAStageGround';scene.add(ground);
      }
      const camera=new THREE.OrthographicCamera(-3.6,3.6,1.8,-1.8,.01,150);
      const controls=new OrbitControls(camera,renderer.domElement);
      const [minZoom,maxZoom]=options.zoom||[.8,4],[minPolar,maxPolar]=options.polar||[.30,Math.PI/2.05];
      Object.assign(controls,{enablePan:false,enableZoom:true,enableDamping:false,minZoom,maxZoom,minPolarAngle:minPolar,maxPolarAngle:maxPolar});
      renderer.domElement.setAttribute('role','img');
      renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();options.onContextLost?.();});
      return {THREE,renderer,scene,camera,controls,keyLight:key,ground,loader:new GLTFLoader()};
    }catch(error){renderer.dispose();throw error;}
  }
  // Shadow flags and the Blender metadata contract (MachineControls.pha_machine) of a loaded GLB.
  function prepareModel(root){
    root.traverse(node=>{if(node.isMesh){node.castShadow=!node.material.transparent;node.receiveShadow=true;}});
    const raw=root.getObjectByName('MachineControls')?.userData.pha_machine;
    if(!raw)return null;
    try{return JSON.parse(raw);}catch{return null;}
  }
  // Fit the shadow frustum (and optional ground) to whatever model is on stage.
  function fitShadows(stage,root){
    const {THREE,keyLight,ground}=stage,box=new THREE.Box3().setFromObject(root);
    if(box.isEmpty())return;
    const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),reach=Math.max(size.x,size.z)*.62+.5;
    keyLight.target.position.copy(center);
    keyLight.position.copy(center).add(new THREE.Vector3(-.3,1,.62).normalize().multiplyScalar(reach*2.2));
    Object.assign(keyLight.shadow.camera,{left:-reach,right:reach,top:reach,bottom:-reach,near:.1,far:reach*4.5});
    keyLight.shadow.camera.updateProjectionMatrix();keyLight.target.updateMatrixWorld();
    if(ground){ground.position.set(center.x,box.min.y-.002,center.z);ground.scale.set(size.x*1.6+2,size.z*2.4+2,1);}
  }
  /* Regroup every track of every clip by the nearest ancestor's userData.motion_group.
     Blender exports one clip per animated object; groups let one mechanism be posed alone.
     Tracks without a group go to `fallback` when given, otherwise they are dropped. */
  function groupClips(THREE,root,clips,fallback){
    const byName=new Map();root.traverse(node=>{byName.set(node.name,node);byName.set(node.uuid,node);});
    const groupOf=node=>{while(node&&!node.userData.motion_group)node=node.parent;return node?.userData.motion_group||fallback;};
    const tracks={};
    for(const clip of clips)for(const track of clip.tracks){
      const key=groupOf(byName.get(THREE.PropertyBinding.parseTrackName(track.name).nodeName));
      if(key)(tracks[key]||=[]).push(track);
    }
    const groups=new Map();
    for(const [key,list] of Object.entries(tracks)){
      const clip=new THREE.AnimationClip(key,-1,list),mixer=new THREE.AnimationMixer(root);
      mixer.clipAction(clip).play();groups.set(key,{mixer,clip,duration:clip.duration,tracks:list.length});
    }
    return groups;
  }
  // Orthographic frustum that shows at least spanX wide and spanY tall, padded by `pad`.
  function frameOrtho(camera,width,height,spanX,spanY=0,pad=1){
    const ratio=width/height,vertical=Math.max(spanY,spanX/ratio)*pad;
    Object.assign(camera,{left:-vertical*ratio/2,right:vertical*ratio/2,top:vertical/2,bottom:-vertical/2});
    camera.updateProjectionMatrix();
  }
  // Resize + visibility observation for a player host; returns a disconnect function.
  function watch(host,{onResize,onVisible,threshold=.02}){
    const resize=new ResizeObserver(()=>onResize()),visible=new IntersectionObserver(entries=>onVisible(!!entries[0]?.isIntersecting),{threshold});
    resize.observe(host);visible.observe(host);
    return ()=>{resize.disconnect();visible.disconnect();};
  }
  function materialsOf(root){
    const materials=new Set();
    root.traverse(node=>{if(node.material)(Array.isArray(node.material)?node.material:[node.material]).forEach(mat=>materials.add(mat));});
    return materials;
  }
  function disposeModel(root){
    const geometries=new Set();root.traverse(node=>{if(node.geometry)geometries.add(node.geometry);});
    geometries.forEach(item=>item.dispose());materialsOf(root).forEach(item=>item.dispose());
  }
  /* Frame-cost governor. On software-rendered or weak GPUs the frame commit after a render can
     block the page for hundreds of milliseconds, freezing scrolling and clicks. The render call
     itself returns quickly, so the governor measures the real cost as the interval from a
     rendered frame to the next animation-frame tick (observe), ignoring the first frames after a
     model change (shader compilation). It steps quality down in proportion to that cost
     (resolution, then shadows, then frame pacing) and, once pacing is active, waits at least
     twice the frame cost between playback frames so input always gets a turn. Playback time
     still follows the wall clock, so motion speed is unchanged. */
  const QUALITY=[{shadows:true,dpr:1.5,pace:0},{shadows:true,dpr:1,pace:0},{shadows:false,dpr:1,pace:50},{shadows:false,dpr:.75,pace:120}];
  const STEP_MS=[28,60,160],WARMUP_FRAMES=4;
  function createGovernor(stage,{onQualityChange}={}){
    const {renderer,scene}=stage,state={level:0,cost:0,rendered:-Infinity,measure:false,warmup:WARMUP_FRAMES,samples:0};
    function apply(level){
      const quality=QUALITY[level];state.level=level;state.samples=0;
      if(renderer.shadowMap.enabled!==quality.shadows){
        renderer.shadowMap.enabled=quality.shadows;
        materialsOf(scene).forEach(mat=>{mat.needsUpdate=true;});
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio,quality.dpr));
      state.warmup=quality.shadows?state.warmup:2;   // material recompiles after a shadow toggle
      onQualityChange?.(level);
    }
    return {
      get level(){return state.level;},
      get cost(){return state.cost;},
      // Restart the warm-up window, e.g. after a new model enters the scene.
      reset(){state.warmup=WARMUP_FRAMES;state.measure=false;},
      // Call at the start of each animation-frame tick with its timestamp.
      observe(now){
        if(!state.measure)return;
        state.measure=false;
        if(state.warmup>0){state.warmup--;return;}
        const cost=now-state.rendered;
        state.cost=state.cost?state.cost*.7+cost*.3:cost;state.samples++;
        const wanted=state.cost>STEP_MS[2]?3:state.cost>STEP_MS[1]?2:state.cost>STEP_MS[0]?state.level+1:state.level;
        if(state.samples>=3&&wanted>state.level)apply(Math.min(QUALITY.length-1,wanted));
      },
      // True when the next playback frame may be drawn without starving input handling.
      due(now){const pace=QUALITY[state.level].pace;return !pace||now-state.rendered>=Math.max(pace,state.cost*2);},
      // `continuous` marks frames of an animation loop, whose next tick measures the frame cost.
      render(camera,now=performance.now(),continuous=false){
        renderer.render(scene,camera);state.rendered=now;state.measure=continuous;
      }
    };
  }
  // Compile shaders off the main thread where the driver allows it, before the first frame.
  async function warm(stage,root){
    try{await stage.renderer.compileAsync(root,stage.camera,stage.scene);}catch{}
  }
  /* Sequential, colour-vision-safe temperature scale (inferno family, light -> dark): lightness alone
     orders the values, so the map stays readable without hue discrimination. */
  const HEAT_STOPS=['#fcffa4','#f6d746','#fca50a','#f1711f','#cf4446','#a52c60'];
  function heatColor(THREE,t){
    const x=Math.min(1,Math.max(0,t))*(HEAT_STOPS.length-1),i=Math.min(HEAT_STOPS.length-2,Math.floor(x));
    return new THREE.Color(HEAT_STOPS[i]).lerp(new THREE.Color(HEAT_STOPS[i+1]),x-i);
  }
  const heatGradient=()=>'linear-gradient(90deg,'+HEAT_STOPS.join(',')+')';
  function hatchTexture(THREE){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
    const g=canvas.getContext('2d');g.fillStyle='#d9d5cb';g.fillRect(0,0,32,32);g.strokeStyle='#8f8b82';g.lineWidth=5;
    for(const o of [-32,0,32]){g.beginPath();g.moveTo(o,32);g.lineTo(o+32,0);g.stroke();}
    const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(6,2);texture.colorSpace=THREE.SRGBColorSpace;
    return texture;
  }
  // Concatenate non-indexed copies of simple geometries (positions and normals only).
  function mergeGeometries(THREE,parts){
    const flat=parts.map(part=>part.index?part.toNonIndexed():part),merged=new THREE.BufferGeometry();
    for(const name of ['position','normal']){
      const arrays=flat.map(part=>part.getAttribute(name).array),out=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));
      let offset=0;for(const array of arrays){out.set(array,offset);offset+=array.length;}
      merged.setAttribute(name,new THREE.BufferAttribute(out,3));
    }
    parts.forEach(part=>part.dispose());
    return merged;
  }
  /* Unlit data overlay for zone temperatures. Geometry comes from the GLB metadata in world
     coordinates of the rest pose and is parented to the moving node it belongs to, so bands follow
     the carriage or the moving mould. update(values) takes key -> {t: 0..1 | null, outline: bool};
     a null t is drawn grey-hatched ("not entered"), outline marks values outside the reference. */
  function createHeatOverlay(stage,root,zones){
    const {THREE}=stage,hatch=hatchTexture(THREE),items=[];
    for(const zone of zones){
      let geometry;const arc=zone.full?[0,Math.PI*2]:[Math.PI/2,Math.PI];
      if(zone.shape==='box'){
        const min=new THREE.Vector3(...zone.min),max=new THREE.Vector3(...zone.max),size=max.clone().sub(min);
        geometry=new THREE.BoxGeometry(Math.abs(size.x),Math.abs(size.y),Math.abs(size.z));
        geometry.translate(...min.clone().add(max).multiplyScalar(.5).toArray());
      }else if(zone.shape==='roll_ends'){
        // Two bands at the ends of a roll whose axis runs across the line (three.js Z): the face stays visible.
        const parts=[zone.z[0]+zone.width/2,zone.z[1]-zone.width/2].map(z=>{
          const band=new THREE.CylinderGeometry(zone.r,zone.r,zone.width,40,1,true);band.rotateX(Math.PI/2);band.translate(zone.x,zone.y,z);return band;
        });
        geometry=mergeGeometries(THREE,parts);
      }else if(zone.shape==='vband'){
        // Vertical band (annular die, parison head): the non-operator half, or all round (zone.full) on a solid body.
        geometry=new THREE.CylinderGeometry(zone.r,zone.r,zone.y[1]-zone.y[0],40,1,true,...arc);
        geometry.translate(zone.center[0],(zone.y[0]+zone.y[1])/2,zone.center[1]);
      }else{
        // Rear half only (three.js -Z is the machine's non-operator side), keeping the cutaway open; zone.full wraps
        // a part that has no cutaway.
        geometry=new THREE.CylinderGeometry(zone.r,zone.r,zone.x[1]-zone.x[0],40,1,true,...arc);
        geometry.rotateZ(-Math.PI/2);geometry.translate((zone.x[0]+zone.x[1])/2,zone.center[0],zone.center[1]);
      }
      const material=new THREE.MeshBasicMaterial({color:0xcccccc,transparent:true,opacity:.92,side:THREE.DoubleSide,toneMapped:false,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
      const mesh=new THREE.Mesh(geometry,material);mesh.name='PHAHeat_'+zone.key;mesh.renderOrder=5;mesh.visible=false;
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,25),new THREE.LineBasicMaterial({color:0x1a1814,toneMapped:false}));
      edges.visible=false;mesh.add(edges);
      (zone.parent&&root.getObjectByName(zone.parent)||root).add(mesh);
      items.push({key:zone.key,mesh,edges});
    }
    return {
      keys:items.map(item=>item.key),
      setVisible(on){items.forEach(item=>{item.mesh.visible=on;});},
      update(values){
        for(const item of items){
          const value=values[item.key],material=item.mesh.material;
          if(!value||value.t==null){material.map=hatch;material.color.set(0xffffff);}
          else{material.map=null;material.color.copy(heatColor(THREE,value.t));}
          material.needsUpdate=true;item.edges.visible=!!value?.outline;
        }
      },
      colorOf:t=>'#'+heatColor(THREE,t).getHexString(),
      dispose(){items.forEach(item=>{item.mesh.removeFromParent();item.mesh.geometry.dispose();item.mesh.material.dispose();item.edges.geometry.dispose();item.edges.material.dispose();});hatch.dispose();}
    };
  }
  /* Heat-map rows shared by every player. One row per input field, in zone order. read(field) returns the
     raw entry ('' = not entered); range(field) returns the reference [lo, hi] or null. Zones carry a group:
     "melt" (barrel, head, die, nozzle) or "tool" (mould, rolls, bath, cooling air); each group gets its own
     colour scale so a 40 °C mould does not compress the barrel colours. */
  function heatRows(zones,read,range){
    const rows=[],seen=new Set();
    for(const zone of zones){
      if(!zone.field||seen.has(zone.field))continue;seen.add(zone.field);
      const raw=String(read(zone.field)??'').trim(),value=raw===''?null:Number(raw),ref=range(zone.field)||null;
      const status=window.PHAEvidence?PHAEvidence.status(raw,ref||['-','-']):'unknown';
      rows.push({field:zone.field,group:zone.group||'melt',label:zone.label,value:Number.isFinite(value)?value:null,range:ref,status});
    }
    return rows;
  }
  function heatScale(rows){
    const numbers=rows.flatMap(row=>[row.value,...(row.range||[])]).filter(Number.isFinite);
    if(!numbers.length)return [150,200];
    const lo=Math.floor((Math.min(...numbers)-5)/10)*10,hi=Math.ceil((Math.max(...numbers)+5)/10)*10;
    return [lo,Math.max(hi,lo+20)];
  }
  function heatScales(rows){return {melt:heatScale(rows.filter(row=>row.group==='melt')),tool:heatScale(rows.filter(row=>row.group!=='melt'))};}
  // Overlay values per zone key: colour fraction on the zone's group scale and an outline when outside the reference.
  function heatValues(zones,rows,scales){
    const byField=Object.fromEntries(rows.map(row=>[row.field,row])),values={};
    for(const zone of zones){
      const row=byField[zone.field],[lo,hi]=scales[(zone.group||'melt')==='melt'?'melt':'tool'];
      values[zone.key]={t:row?.value==null?null:(row.value-lo)/(hi-lo),outline:row?.status==='warn'||row?.status==='crit'};
    }
    return values;
  }
  function heatStatusText(status,en){
    return status==='ok'?(en?'Within reference':'범위 안'):status==='empty'?(en?'Not entered':'미입력'):status==='unknown'?(en?'Unverified':'근거 미확인'):(en?'Outside reference':'범위 밖');
  }
  /* Zone list and colour-scale bars of a heat panel (.heat-zones / .heat-scale). With ``editable`` each row
     holds the set-point input itself (rigs whose tab has no process form). */
  function renderHeatPanel(panel,{rows,scales,colorOf,locale,scaleLabels,editable=false}){
    const en=locale==='en',esc=value=>String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);
    const groupOf=row=>row.group==='melt'?'melt':'tool',fraction=row=>{const [lo,hi]=scales[groupOf(row)];return (row.value-lo)/(hi-lo);};
    const bar=group=>'<b>'+esc(scaleLabels[group][en?1:0])+'</b><span>'+scales[group][0]+' °C</span><i style="background:'+heatGradient()+'"></i><span>'+scales[group][1]+' °C</span>';
    panel.querySelector('.heat-scale').innerHTML=[...new Set(rows.map(groupOf))].map(bar).join('');
    panel.querySelector('.heat-zones').innerHTML=rows.map(row=>{
      const label=row.label?row.label[en?1:0]:row.field,swatch=row.value==null?'is-missing':'',color=row.value==null?'':' style="background:'+colorOf(fraction(row))+'"';
      const range=row.range?(en?'Ref. ':'참고 ')+row.range[0]+'–'+row.range[1]+' °C':(en?'No reference':'참고 범위 없음');
      const value=editable?'<input type="number" inputmode="decimal" step="1" data-heat-field="'+esc(row.field)+'" value="'+(row.value??'')+'" aria-label="'+esc(label)+' (°C)">'
        :(row.value==null?(en?'—':'미입력'):row.value+' °C');
      return '<li class="heat-zone is-'+row.status+'"><i class="'+swatch+'"'+color+'></i><b>'+esc(label)+'</b><span>'+esc(row.fieldLabel||'')+'</span><strong>'+value+'</strong><small>'+range+' · '+heatStatusText(row.status,en)+'</small></li>';
    }).join('');
  }
  /* Swimlane chart of a teaching cycle: one row per actuator (meta.lanes), one bar per sub-step
     (meta.steps rows [start, end, ko, en, lane]) and the app stages (meta.stage_segments) on top.
     Neutral greys; the bars active at the playhead turn dark, so colour stays free for abnormal states
     (ISA-101). Pointer down/drag calls onSeek(time); keyboard users keep the player's range input. */
  const SVG_NS='http://www.w3.org/2000/svg';
  function createCycleChart(container,meta,{locale='ko',stageNames=[],onSeek}={}){
    const en=locale==='en',lanes=meta.lanes||[],steps=(meta.steps||[]).filter(row=>lanes.some(lane=>lane.key===row[4]));
    const duration=meta.cycle_seconds??meta.duration,labelW=en?104:84,right=12,stripH=18,laneH=24,axisH=20,plotBottom=stripH+lanes.length*laneH;
    const height=plotBottom+axisH;
    const name=(ko,english)=>en?english:ko;
    const node=(tag,attrs,parent,text)=>{const el=document.createElementNS(SVG_NS,tag);for(const key in attrs)el.setAttribute(key,attrs[key]);if(text!=null)el.textContent=text;parent?.appendChild(el);return el;};
    // Monospace estimate (Hangul a full em, Latin/digits about 0.6 em) to keep labels inside their bars.
    const fits=(text,width,size)=>[...text].reduce((sum,ch)=>sum+(ch.charCodeAt(0)>0x1100?size:size*.6),0)+8<=width;
    const span=(a,b)=>a.toFixed(2)+'–'+b.toFixed(2)+' s';
    let svg=null,heads=[],bars=[],stages=[],toX=()=>0,toTime=()=>0,dragging=false,last=null;
    function render(width){
      width=Math.max(280,Math.round(width||container.clientWidth||600));
      const plot=width-labelW-right;
      toX=time=>labelW+time/duration*plot;
      toTime=px=>Math.min(duration-.001,Math.max(0,(px-labelW)/plot*duration));
      container.textContent='';bars=[];stages=[];last=null;
      svg=node('svg',{class:'cycle-chart',width,height,viewBox:'0 0 '+width+' '+height,role:'img','aria-label':name('장비별 사이클 단계: ','Cycle by actuator: ')+lanes.map(lane=>name(lane.ko,lane.en)).join(', ')},container);
      node('desc',{},svg,steps.map(row=>name(row[2],row[3])+' '+span(row[0],row[1])).join('; '));
      // Labels sit in their own layer above the playhead so it never hides the active step's name.
      const labels=node('g',{class:'cycle-labels'});
      for(const [a,b,stage] of meta.stage_segments||[]){
        const w=toX(b)-toX(a),rect=node('rect',{class:'cycle-stage',x:toX(a),y:0,width:Math.max(1,w-1),height:stripH-4},svg);
        node('title',{},rect,String(stage+1).padStart(2,'0')+' · '+(stageNames[stage]||'')+' '+span(a,b));
        const label=String(stage+1).padStart(2,'0');
        const text=fits(label,w,10)?node('text',{class:'cycle-stage-label',x:toX(a)+w/2,y:stripH-8,'text-anchor':'middle'},labels,label):null;
        stages.push({a,b,rect,text});
      }
      node('text',{class:'cycle-lane',x:labelW-8,y:stripH-8,'text-anchor':'end'},svg,name('단계','Stage'));
      lanes.forEach((lane,i)=>{
        const y=stripH+i*laneH;
        node('line',{class:'cycle-grid',x1:0,x2:width,y1:y+laneH,y2:y+laneH},svg);
        node('text',{class:'cycle-lane',x:labelW-8,y:y+laneH/2+4,'text-anchor':'end'},svg,name(lane.ko,lane.en));
      });
      // Long bars first so short events (V/P transfer) stay visible on top of the bar they interrupt.
      for(const row of [...steps].sort((p,q)=>(q[1]-q[0])-(p[1]-p[0]))){
        const [a,b,ko,english,laneKey]=row,y=stripH+lanes.findIndex(lane=>lane.key===laneKey)*laneH;
        const x=toX(a),w=Math.max(2,toX(b)-x),label=name(ko,english).replace(/ \(.*\)$/,'');
        const rect=node('rect',{class:'cycle-bar',x,y:y+5,width:w,height:laneH-10},svg);
        node('title',{},rect,name(ko,english)+' '+span(a,b));
        const text=fits(label,w,10)?node('text',{class:'cycle-bar-label',x:x+4,y:y+laneH/2+3.5},labels,label):null;
        bars.push({a,b,rect,text});
      }
      for(let s=0;s<=duration+1e-9;s+=plot<420?4:2){
        node('line',{class:'cycle-tick',x1:toX(s),x2:toX(s),y1:plotBottom,y2:plotBottom+4},svg);
        node('text',{class:'cycle-axis',x:toX(s),y:plotBottom+15,'text-anchor':'middle'},svg,String(s));
      }
      // A light halo keeps the playhead visible where it crosses a dark (active) bar.
      heads=['cycle-head-halo','cycle-head'].map(cls=>node('line',{class:cls,x1:labelW,x2:labelW,y1:0,y2:plotBottom},svg));
      svg.appendChild(labels);
      if(onSeek){
        const seekAt=event=>{const box=svg.getBoundingClientRect();onSeek(toTime((event.clientX-box.left)*width/box.width));};
        svg.addEventListener('pointerdown',event=>{dragging=true;svg.setPointerCapture(event.pointerId);seekAt(event);});
        svg.addEventListener('pointermove',event=>{if(dragging)seekAt(event);});
        for(const type of ['pointerup','pointercancel'])svg.addEventListener(type,()=>{dragging=false;});
      }
    }
    function setTime(time){
      if(!heads.length||time===last)return;
      last=time;const x=toX(time);for(const line of heads){line.setAttribute('x1',x);line.setAttribute('x2',x);}
      for(const item of [...bars,...stages]){const now=time>=item.a&&time<item.b;item.rect.classList.toggle('is-now',now);item.text?.classList.toggle('is-now',now);}
    }
    return {render,setTime,dispose(){container.textContent='';svg=null;heads=[];bars=[];stages=[];}};
  }
  window.PHAMachineViewer={createStage,prepareModel,fitShadows,groupClips,frameOrtho,watch,disposeModel,createGovernor,warm,createHeatOverlay,heatGradient,heatRows,heatScales,heatValues,renderHeatPanel,createCycleChart};
})();
