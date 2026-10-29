import {TroubleshootingViewer} from './troubleshooting-viewer.js?v=34';
import * as THREE from './vendor/three-0.185.1/build/three.module.js';

const groups=['normal','parting','vent','ejector'];
const clamp=value=>Math.max(0,Math.min(1,value));
const finite=(value,fallback)=>Number.isFinite(Number(value))?clamp(Number(value)):fallback;

export class FlashMoldViewer extends TroubleshootingViewer{
  constructor(container){
    super(container);
    this.state={progress:1,opening:.62,onset:'pack'};
  }
  async load(url){
    await super.load(url,false);
    if(this.destroyed)return;
    if(!groups.every(name=>this.model.children.some(node=>node.name===name)))throw new Error('Incomplete flash mold model');
    this.select('normal');
  }
  select(group){
    if(!groups.includes(group))throw new Error('Unknown flash mold state');
    super.select(group);
    this.setState(this.state);
    this.frame(false);
  }
  setState(next={}){
    this.state={progress:finite(next.progress??this.state.progress,this.state.progress),
      opening:finite(next.opening??this.state.opening,this.state.opening),
      onset:['fill','pack'].includes(next.onset)?next.onset:this.state.onset};
    if(!this.model||this.destroyed)return;
    const {progress,opening,onset}=this.state;
    this.phase=progress;
    this.model.traverse(node=>{
      const data=node.userData,dict=node.morphTargetDictionary;
      if(data.flash_role==='upper_mold'){
        node.position.copy(data.basePosition);
        const vector=data.flash_open_vector||[0,2.25,0];
        node.position.x+=vector[0]*opening;node.position.y+=vector[1]*opening;node.position.z+=vector[2]*opening;
      }
      if(!dict)return;
      node.morphTargetInfluences.fill(0);
      if(Number.isFinite(data.flash_fill_start)&&Number.isFinite(data.flash_fill_end)){
        const amount=clamp((progress-data.flash_fill_start)/(data.flash_fill_end-data.flash_fill_start));
        const steps=data.flash_morph_count||6,f=amount*steps,low=Math.floor(f),fraction=f-low;
        if(low>0&&dict['Fill'+low]!==undefined)node.morphTargetInfluences[dict['Fill'+low]]=1-fraction;
        if(low<steps&&dict['Fill'+(low+1)]!==undefined)node.morphTargetInfluences[dict['Fill'+(low+1)]]=fraction;
        node.visible=amount>0;
      }else if(dict.FlashGrow!==undefined){
        const amount=onset==='fill'?clamp((progress-.55)/.10):clamp((progress-.70)/.25);
        node.morphTargetInfluences[dict.FlashGrow]=amount;
        node.visible=amount>0;
      }
    });
    this.model.updateMatrixWorld(true);
    this.draw();
  }
  pose(progress){this.setState({progress});}
  bounds(detail=false){
    if(!detail)return super.bounds(false);
    const box=new THREE.Box3();let found=false;
    this.model?.children.find(node=>node.name===this.group)?.traverse(node=>{
      const role=node.userData.flash_role;
      if(!node.geometry||!(['cavity','flash'].includes(role)||(role==='ejector_pin'&&this.group==='ejector')))return;
      node.geometry.computeBoundingBox();box.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld));found=true;
    });
    return found?box:super.bounds(false);
  }
  frame(detail=false,end=false){
    if(!this.model)return;
    const opening=this.state.opening;
    if(!detail)this.setState({opening:1});
    super.frame(detail,end);
    if(!detail)this.setState({opening});
  }
  snapshot(){
    const base=super.snapshot(),nodes=[];
    this.model?.traverseVisible(node=>{
      if(!node.userData.flash_role)return;
      const morphs={};
      for(const [name,index] of Object.entries(node.morphTargetDictionary||{}))morphs[name]=node.morphTargetInfluences[index];
      nodes.push({name:node.name,role:node.userData.flash_role,location:node.userData.flash_location,
        position:node.position.toArray(),morphs});
    });
    return {...base,state:{...this.state},stage:this.state.progress<.65?'fill':'pack',nodes};
  }
}
