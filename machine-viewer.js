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
  window.PHAMachineViewer={createStage,prepareModel,fitShadows,groupClips,frameOrtho,watch,disposeModel,createGovernor,warm};
})();
