import * as THREE from './vendor/three-0.185.1/build/three.module.js';
import {GLTFLoader} from './vendor/three-0.185.1/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from './vendor/three-0.185.1/examples/jsm/controls/OrbitControls.js';

const clamp=(x)=>Math.max(0,Math.min(1,x));
function disposeModel(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root?.traverse(obj=>{if(obj.geometry)geometries.add(obj.geometry);for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material]).filter(Boolean)){materials.add(mat);for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);}});
  geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());
}

export class TroubleshootingViewer{
  constructor(container){
    this.container=container;this.frames=0;this.destroyed=false;this.active=true;this.inView=true;
    this.renderer=new THREE.WebGLRenderer({antialias:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setClearColor(0xece9df);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-hidden','true');container.prepend(this.renderer.domElement);
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(38,1,.02,250);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=false;this.controls.enablePan=false;
    this.controls.addEventListener('change',()=>this.draw());
    this.scene.add(new THREE.HemisphereLight(0xfffaee,0x596453,1.4));
    const key=new THREE.DirectionalLight(0xfff5db,2.2);key.position.set(-4,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:.1,far:45});key.shadow.normalBias=.02;this.scene.add(key);
    const rim=new THREE.DirectionalLight(0xd5e5f8,2.2);rim.position.set(0,2,-7);this.scene.add(rim);
    this.floor=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:0xe4e1d7,roughness:1}));this.floor.rotation.x=-Math.PI/2;this.floor.receiveShadow=true;this.scene.add(this.floor);
    this.abort=new AbortController();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);
    this.intersection=new IntersectionObserver(entries=>{this.inView=entries[0]?.isIntersecting??true;if(this.inView)this.draw();},{threshold:.02});this.intersection.observe(container);
    this.resize();
  }
  async load(url,context=false){
    this.context=context;
    const response=await fetch(url,{signal:this.abort.signal});if(!response.ok)throw new Error('Model request failed');
    const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),'');
    if(this.destroyed){disposeModel(gltf.scene);return;}
    this.model=gltf.scene;this.scene.add(this.model);
    this.model.traverse(node=>{
      node.userData.basePosition=node.position.clone();node.userData.baseQuaternion=node.quaternion.clone();
      if(node.isMesh){node.castShadow=true;node.receiveShadow=false;}
    });
    if(context&&gltf.animations.length){
      this.mixer=new THREE.AnimationMixer(this.model);this.duration=Math.max(...gltf.animations.map(x=>x.duration));
      gltf.animations.forEach(clip=>this.mixer.clipAction(clip).play());
    }
  }
  select(group){
    if(!this.model)return;
    if(!this.context){
      if(!this.model.children.some(node=>node.name===group))throw new Error('Missing model state '+group);
      this.model.children.forEach(node=>{node.visible=node.name===group;});
    }
    this.group=group;this.draw();
  }
  pose(phase){
    if(!this.model)return;this.phase=clamp(phase);
    if(this.context){if(this.mixer)this.mixer.setTime(this.phase*(this.duration||0));}
    else this.model.traverse(node=>{
      const data=node.userData,base=data.basePosition;
      if(data.spin_axis){node.quaternion.copy(data.baseQuaternion);node.rotateOnAxis(new THREE.Vector3(1,0,0),Math.PI*2*this.phase);}
      const role=data.thermo_part;
      if(role==='heater'){node.position.copy(base);node.position.x=base.x+5.5*clamp((this.phase-.1)/.18);}
      if(role==='plug'){node.position.copy(base);node.position.y=base.y-3*clamp((this.phase-.2)/.35)*(1-clamp((this.phase-.76)/.18));}
      if(role==='rod'){const length=.5+3*clamp((this.phase-.2)/.35)*(1-clamp((this.phase-.76)/.18));node.scale.y=length/.5;node.position.y=5.5-length/2;}
      if(role==='clamp'){node.position.copy(base);node.position.y=base.y+.75*clamp((this.phase-.82)/.08);}
      if(role==='sheet'){node.position.copy(base);node.position.y=base.y+.45*clamp((this.phase-.93)/.07);}
      if(node.morphTargetDictionary){
        const form=node.morphTargetDictionary.Form,osc=node.morphTargetDictionary.Oscillate;
        if(form!==undefined)node.morphTargetInfluences[form]=clamp((this.phase-.2)/.35);
        if(osc!==undefined)node.morphTargetInfluences[osc]=(1-Math.cos(this.phase*Math.PI*2))/2;
      }
    });
    this.model.updateMatrixWorld(true);this.draw();
  }
  bounds(detail=false){
    const box=new THREE.Box3();let added=false;
    this.model?.traverseVisible(node=>{
      if(!node.isMesh)return;
      for(let parent=node;parent;parent=parent.parent)if(parent.userData.thermo_part==='heater')return;
      if(detail&&!node.userData.sectionable&&node.userData.thermo_part!=='sheet')return;
      node.geometry.computeBoundingBox();box.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld));added=true;
    });
    return added?box:(detail?this.bounds(false):new THREE.Box3(new THREE.Vector3(-3,0,-2),new THREE.Vector3(3,4,2)));
  }
  frame(detail=false,end=false){
    if(!this.model)return;
    const bounds=this.bounds(detail),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    this.floor.position.y=this.bounds(false).min.y-.06;
    this.frameSize=size;this.frameBox=bounds.clone();
    if(end){center.x=bounds.max.x;this.frameSize=new THREE.Vector3(1.6,Math.max(size.y,1),Math.max(size.z,1));this.frameBox=new THREE.Box3().setFromCenterAndSize(center,this.frameSize);}
    this.controls.target.copy(center);
    this.direction=(end?new THREE.Vector3(10,2.3,2.4):new THREE.Vector3(6,4,9)).normalize();
    this.fitDistance=0;this.resize(true);this.controls.update();this.draw();
  }
  resize(reset=false){
    if(this.destroyed||!this.container.clientWidth||!this.container.clientHeight)return;
    const w=this.container.clientWidth,h=this.container.clientHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
    if(this.frameSize){
      const offset=this.camera.position.clone().sub(this.controls.target);
      const zoom=!reset&&this.fitDistance?offset.length()/this.fitDistance:1;
      const direction=!reset&&this.fitDistance?offset.normalize():this.direction;
      const orientation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(direction,new THREE.Vector3(),new THREE.Vector3(0,1,0))).invert();
      const b=this.frameBox,tan=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));let fit=.5;
      for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
        const p=new THREE.Vector3(x,y,z).sub(this.controls.target).applyQuaternion(orientation);
        fit=Math.max(fit,p.z+Math.abs(p.y)/tan,p.z+Math.abs(p.x)/(tan*this.camera.aspect));
      }
      const distance=fit*1.14;
      this.fitDistance=distance;this.controls.minDistance=distance*.48;this.controls.maxDistance=distance*3;
      this.camera.position.copy(this.controls.target).add(direction.clone().multiplyScalar(distance*zoom));this.controls.update();
    }
    this.draw();
  }
  cameraAction(action){
    if(action==='reset'||action==='detail'||action==='end'){this.frame(action==='detail'||action==='end',action==='end');return;}
    const offset=this.camera.position.clone().sub(this.controls.target);
    if(action==='in'||action==='out')offset.multiplyScalar(action==='in'?.82:1.22);
    else offset.applyAxisAngle(new THREE.Vector3(0,1,0),(action==='left'?-1:1)*Math.PI/8);
    offset.clampLength(this.controls.minDistance,this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.draw();
  }
  draw(){if(this.destroyed||!this.active||!this.inView||document.hidden||!this.container.clientWidth)return;this.floor.visible=this.camera.position.y>this.floor.position.y+.1;this.renderer.render(this.scene,this.camera);this.frames++;}
  snapshot(){
    const nodes=[];this.model?.traverseVisible(node=>{if(node.userData.thermo_part||node.userData.spin_axis||node.morphTargetInfluences)nodes.push({name:node.name,role:node.userData.thermo_part,position:node.position.toArray(),quaternion:node.quaternion.toArray(),morphs:node.morphTargetInfluences?.slice()});});
    return {frames:this.frames,phase:this.phase,context:this.context,groups:this.model?.children.map(x=>x.name)||[],visibleGroups:this.model?.children.filter(x=>x.visible).map(x=>x.name)||[],camera:this.camera.position.toArray(),nodes};
  }
  dispose(){
    if(this.destroyed)return;this.destroyed=true;this.abort.abort();this.observer.disconnect();this.intersection.disconnect();this.controls.dispose();this.mixer?.stopAllAction();
    disposeModel(this.model);this.floor.geometry.dispose();this.floor.material.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();
  }
}
