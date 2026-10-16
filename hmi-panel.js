/* Controller-style (HMI) view of the process conditions entered in the Process tab.
   Neutral by default and colour only for abnormal states (ISA-101 practice). Every number is either
   a user entry, a source/local reference band, or marked "not entered"; nothing is synthesised. */
(function(){
  'use strict';
  const state={page:'overview'};
  let host=null,observer=null;
  const lang=()=>typeof LANG!=='undefined'&&LANG==='en'?'en':'ko';
  const t=(ko,en)=>lang()==='en'?en:ko;
  const esc=value=>String(value).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);
  const fmt=value=>Number.isFinite(value)?(Math.abs(value)>=100?Math.round(value):Math.round(value*10)/10).toString():'—';
  // Temperature fields that touch the melt versus tooling/cooling surfaces get separate axes.
  const MELT=/^(zone\d|barrel\d|nozzle|die|head|accHead)$/,TOOLING=/^(mold|chill\w*|coolingRoll|airTemp)$/;

  function snapshot(){
    if(typeof SCHEMAS==='undefined'||typeof getReco!=='function'||typeof profileOf!=='function')return null;
    const proc=document.getElementById('process')?.value,grade=document.getElementById('grade')?.value,schema=SCHEMAS[proc];
    if(!schema)return null;
    let reco={};try{reco=getReco(profileOf(grade),proc)||{};}catch{}
    const fields=schema.map(field=>{
      const raw=document.getElementById('f_'+field.id)?.value??'',value=raw===''?null:Number(raw),range=reco[field.id]||null;
      const status=window.PHAEvidence?PHAEvidence.status(raw,range||['-','-']):'unknown';
      return {...field,label:lang()==='en'?field.en:field.ko,raw,value:Number.isFinite(value)?value:null,range,status};
    });
    return {proc,grade,fields,byId:Object.fromEntries(fields.map(field=>[field.id,field]))};
  }
  function statusText(status){
    return status==='ok'?t('범위 안','Within reference'):status==='empty'?t('미입력','Not entered'):status==='unknown'?t('근거 미확인','Unverified'):t('범위 밖','Outside reference');
  }
  const abnormal=status=>status==='warn'||status==='crit';
  // Charts are drawn at the panel's own pixel width so 10–11 px labels stay legible on desktop and phone.
  const room=()=>Math.max(300,Math.round((host?.clientWidth||700)-26));
  const svgOpen=(W,H,label)=>'<svg class="hmi-chart" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(label)+'">';
  // Axis maximum and step of 1, 2, 2.5 or 5 × 10^k, so ticks read as whole numbers.
  function niceScale(max,count=4){
    const raw=max/count,power=10**Math.floor(Math.log10(raw)),step=[1,2,2.5,5,10].map(m=>m*power).find(s=>s>=raw);
    return {step,max:Math.ceil(max/step)*step};
  }
  // Monospace estimate: Hangul is a full em, Latin/digits about 0.6 em.
  const textWidth=(text,size)=>[...text].reduce((sum,ch)=>sum+(ch.charCodeAt(0)>0x1100?size:size*.6),0);

  function readout(field){
    const range=field.range?fmt(field.range[0])+'–'+fmt(field.range[1]):t('참고 없음','No reference');
    return '<li class="hmi-readout'+(abnormal(field.status)?' is-abnormal':field.value==null?' is-empty':'')+'"><span>'+esc(field.label)+'</span><strong>'+(field.value==null?'—':esc(fmt(field.value)))+'<small>'+esc(field.unit||'')+'</small></strong><em>'+esc(range)+' · '+esc(statusText(field.status))+'</em></li>';
  }
  function overview(data){
    return '<ul class="hmi-readouts">'+data.fields.map(readout).join('')+'</ul>';
  }

  // Vertical band chart: grey reference band, dark set-point tick, hatched when not entered.
  function bandChart(title,fields){
    if(!fields.length)return '';
    const numbers=fields.flatMap(field=>[field.value,...(field.range||[])]).filter(Number.isFinite);
    let lo=numbers.length?Math.floor((Math.min(...numbers)-5)/10)*10:0,hi=numbers.length?Math.ceil((Math.max(...numbers)+5)/10)*10:100;
    if(hi-lo<20)hi=lo+20;
    const W=Math.min(room(),Math.max(300,fields.length*120+70)),H=214,top=24,bottom=174,left=46,step=(W-left-10)/fields.length,y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
    const ticks=[];for(let v=lo;v<=hi;v+=hi-lo>80?20:10)ticks.push(v);
    let svg=svgOpen(W,H,title);
    svg+=ticks.map(v=>'<line class="grid" x1="'+left+'" x2="'+(W-6)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text class="axis" x="'+(left-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+v+'</text>').join('');
    fields.forEach((field,i)=>{
      const x=left+i*step+step*.18,w=step*.64,cx=x+w/2;
      if(field.range)svg+='<rect class="band" x="'+x+'" y="'+y(field.range[1])+'" width="'+w+'" height="'+Math.max(2,y(field.range[0])-y(field.range[1]))+'"><title>'+esc(field.label+': '+t('참고 ','reference ')+fmt(field.range[0])+'–'+fmt(field.range[1])+' '+field.unit)+'</title></rect>';
      else svg+='<rect class="band none" x="'+x+'" y="'+top+'" width="'+w+'" height="'+(bottom-top)+'"/>';
      if(field.value==null)svg+='<rect class="missing" x="'+(x+w*.2)+'" y="'+(bottom-26)+'" width="'+(w*.6)+'" height="22"/><text class="mark" x="'+cx+'" y="'+(bottom-30)+'" text-anchor="middle">'+t('미입력','n/a')+'</text>';
      else{const vy=Math.min(bottom,Math.max(top,y(field.value)));svg+='<rect class="set'+(abnormal(field.status)?' abnormal':'')+'" x="'+(x-3)+'" y="'+(vy-2.5)+'" width="'+(w+6)+'" height="5"/><text class="value'+(abnormal(field.status)?' abnormal':'')+'" x="'+cx+'" y="'+(vy-8)+'" text-anchor="middle">'+fmt(field.value)+'</text>';}
      svg+='<text class="label" x="'+cx+'" y="'+(bottom+18)+'" text-anchor="middle">'+esc(field.label.replace(/ 온도$| Temp$/,''))+'</text>';
    });
    svg+='<text class="axis" x="'+(left-6)+'" y="'+(top-10)+'" text-anchor="end">°C</text></svg>';
    return '<figure class="hmi-figure"><figcaption>'+esc(title)+'</figcaption>'+svg+'</figure>';
  }
  function temperatures(data){
    const temps=data.fields.filter(field=>field.unit==='°C');
    const melt=temps.filter(field=>MELT.test(field.id)),tooling=temps.filter(field=>TOOLING.test(field.id)||!MELT.test(field.id));
    const order=data.proc==='injection'?t('배럴 1–3 번호의 위치(호퍼/노즐 쪽)는 장비마다 다릅니다. 3D의 온도 표시에서 현장 표기에 맞춰 선택하세요.','Barrel 1–3 numbering starts at the hopper or the nozzle depending on the machine; match your site convention in the 3D temperature view.'):t('존 번호는 호퍼 쪽부터 다이 방향으로 읽습니다.','Zones are read from the hopper toward the die.');
    return bandChart(t('용융 측 존 · 설정값과 참고 범위','Melt-side zones · set points and reference bands'),melt)+bandChart(t('금형·롤·냉각 · 설정값과 참고 범위','Mould, rolls and cooling · set points and reference bands'),tooling)
      +'<p class="hmi-note">'+esc(order)+' '+esc(t('막대는 입력한 설정값이며 실측 온도나 용융온도가 아닙니다. 회색 띠는 선택한 그레이드의 근거 또는 사용자 수정 범위입니다.','Ticks are entered set points, not measured or melt temperatures. Grey bands are the selected grade source or your edited ranges.'))+'</p>';
  }

  // Injection: holding-pressure set profile on a time axis. Fill duration has no input in this app,
  // so it is drawn as a hatched, unscaled segment instead of an invented time.
  function injectionProfile(data){
    const f=data.byId,num=id=>f[id]?.value;
    const holds=[];
    if(Number.isFinite(num('hold1P'))&&Number.isFinite(num('hold1T')))holds.push({p:num('hold1P'),t:num('hold1T'),label:t('보압 1','Hold 1')});
    if(Number.isFinite(num('hold2P'))&&Number.isFinite(num('hold2T')))holds.push({p:num('hold2P'),t:num('hold2T'),label:t('보압 2','Hold 2')});
    if(!holds.length&&Number.isFinite(num('packPressMPa'))&&Number.isFinite(num('packTime')))holds.push({p:num('packPressMPa'),t:num('packTime'),label:t('보압','Hold')});
    const cool=num('coolTime'),limit=num('injPressMPa');
    const timed=holds.reduce((sum,h)=>sum+h.t,0)+(Number.isFinite(cool)?cool:0);
    const W=Math.min(room(),760),H=234,left=52,right=14,top=26,bottom=180,fillW=84,plotW=W-left-right-fillW;
    const scaleT=timed>0?plotW/timed:0,axis=niceScale(Math.max(10,...holds.map(h=>h.p),Number.isFinite(limit)?limit:0)*1.08),pMax=axis.max,y=p=>bottom-p/pMax*(bottom-top);
    // Labels start right of their segment (never across the V/P line), step up when they would overlap
    // the previous label, and flip to end-anchored at the right edge.
    let prev=null;
    const label=(text,x,ly,cls)=>{
      const width=textWidth(text,11);
      if(prev&&x+4<prev.right&&Math.abs(ly-prev.y)<14)ly=prev.y-14;
      const end=x+4+width>W-right;
      prev={right:end?W-right:x+4+width,y:ly};
      return '<text class="'+cls+'" x="'+(end?W-right:x+4)+'" y="'+ly+'"'+(end?' text-anchor="end"':'')+'>'+esc(text)+'</text>';
    };
    let svg=svgOpen(W,H,t('보압 설정 프로파일','Holding set profile'));
    for(let p=0;p<=pMax+1e-9;p+=axis.step)svg+='<line class="grid" x1="'+left+'" x2="'+(W-right)+'" y1="'+y(p)+'" y2="'+y(p)+'"/><text class="axis" x="'+(left-6)+'" y="'+(y(p)+4)+'" text-anchor="end">'+fmt(p)+'</text>';
    svg+='<rect class="missing" x="'+left+'" y="'+top+'" width="'+fillW+'" height="'+(bottom-top)+'"/><text class="mark" x="'+(left+fillW/2)+'" y="'+(bottom-30)+'" text-anchor="middle">'+t('충전','Fill')+'</text><text class="mark small" x="'+(left+fillW/2)+'" y="'+(bottom-16)+'" text-anchor="middle">'+t('시간 미입력','time n/a')+'</text>';
    if(Number.isFinite(limit))svg+='<line class="limit" x1="'+left+'" x2="'+(left+fillW)+'" y1="'+y(limit)+'" y2="'+y(limit)+'"/><text class="limit-label" x="'+(left+4)+'" y="'+(y(limit)-5)+'">'+t('사출압 ','Inj. ')+fmt(limit)+'</text>';
    svg+='<line class="vp" x1="'+(left+fillW)+'" x2="'+(left+fillW)+'" y1="'+top+'" y2="'+bottom+'"/><text class="vp-label" x="'+(left+fillW)+'" y="'+(bottom+14)+'" text-anchor="middle">V/P</text>';
    let x=left+fillW,elapsed=0;
    for(const hold of holds){const w=hold.t*scaleT;svg+='<rect class="hold" x="'+x+'" y="'+y(hold.p)+'" width="'+Math.max(1,w)+'" height="'+(bottom-y(hold.p))+'"/>'+label(hold.label+' '+fmt(hold.p)+' MPa · '+fmt(hold.t)+' s',x,y(hold.p)-6,'value');x+=w;elapsed+=hold.t;}
    if(Number.isFinite(cool)){const w=cool*scaleT;svg+='<rect class="cool" x="'+x+'" y="'+(bottom-4)+'" width="'+Math.max(1,w)+'" height="4"/>'+label(t('냉각 ','Cooling ')+fmt(cool)+' s',x,bottom-12,'value');x+=w;elapsed+=cool;}
    svg+='<text class="axis" x="'+(left-6)+'" y="'+(top-10)+'" text-anchor="end">MPa</text><text class="axis" x="'+(W-right)+'" y="'+(H-14)+'" text-anchor="end">'+(timed>0?t('V/P 이후 ','After V/P ')+fmt(elapsed)+' s':t('보압·냉각 시간 미입력','Hold/cooling times not entered'))+'</text></svg>';
    const readouts=['injSpeed','injPressMPa','backPressBar','screwRPM','packPressMPa','packTime','coolTime'].map(id=>f[id]).filter(Boolean);
    return '<figure class="hmi-figure"><figcaption>'+esc(t('보압 설정 프로파일 (시간 기준, 입력값)','Holding set profile (time axis, entered values)'))+'</figcaption>'+svg+'</figure><ul class="hmi-readouts compact">'+readouts.map(readout).join('')+'</ul>'
      +'<p class="hmi-note">'+esc(t('냉각 시간은 보압 이후의 잔여 타이머로 그립니다. 위치 기준 다단 사출 속도와 실측 압력 곡선은 입력 항목이 없어 그리지 않으며, 사출압은 보압과 다른 상한선(점선)입니다. 사출기 유압·수지압 기준이 같은지 확인하세요.','Cooling is drawn as the remaining timer after holding. Position-based speed stages and measured pressure traces have no inputs here and are not drawn; injection pressure is a separate limit (dashed). Check that hydraulic and specific pressure bases match.'))+'</p>';
  }
  function drives(data){
    const ids=['screwRPM','meltPressBar','lineSpeed','rollRPM','takeup','bur','flh','dieGap','targetThickness','blowPressBar','preBlowBar','coolTime'];
    const list=ids.map(id=>data.byId[id]).filter(Boolean);
    return '<ul class="hmi-readouts">'+list.map(readout).join('')+'</ul><p class="hmi-note">'+esc(t('입력한 값과 근거 범위만 표시합니다. 토출량·비에너지·체류시간은 측정값이 있을 때 계산기 탭에서 따로 확인하세요.','Shows entered values and reference bands only. Throughput, specific energy and residence time need measured inputs in the calculator tab.'))+'</p>';
  }

  function pages(proc){
    const list=[['overview',t('개요','Overview')],['temps',t('온도 프로파일','Temperatures')]];
    list.push(proc==='injection'?['inject',t('사출·보압','Injection & hold')]:['drives',t('구동·라인','Drives & line')]);
    return list;
  }
  function render(){
    if(!host?.isConnected)return;
    const data=snapshot();
    if(!data){host.hidden=true;return;}
    host.hidden=false;
    const list=pages(data.proc);if(!list.some(([key])=>key===state.page))state.page='overview';
    const entered=data.fields.filter(field=>field.value!=null).length,outside=data.fields.filter(field=>abnormal(field.status)).length;
    const body=state.page==='temps'?temperatures(data):state.page==='inject'?injectionProfile(data):state.page==='drives'?drives(data):overview(data);
    host.innerHTML='<div class="hmi-status"><span class="hmi-tag">'+esc(t('입력값 · 실측 아님','Entered values · not measured'))+'</span><span>'+esc(data.grade||'')+' · '+esc(document.getElementById('process')?.selectedOptions?.[0]?.textContent||data.proc)+'</span><span>'+esc(t('입력 ','Entered '))+entered+'/'+data.fields.length+(outside?' · <b class="hmi-alarm">'+esc(t('범위 밖 ','Outside ')+outside)+'</b>':'')+'</span></div>'
      +'<div class="hmi-pages" role="tablist" aria-label="'+esc(t('공정 조건 화면','Process condition pages'))+'">'+list.map(([key,label])=>'<button type="button" role="tab" data-hmi-page="'+key+'" aria-selected="'+(key===state.page)+'">'+esc(label)+'</button>').join('')+'</div>'
      +'<div class="hmi-body" role="tabpanel">'+body+'</div>';
  }
  function attach(){
    host=document.getElementById('hmiPanel');if(!host)return;
    host.addEventListener('click',event=>{const button=event.target.closest('[data-hmi-page]');if(!button)return;state.page=button.dataset.hmiPage;render();host.querySelector('[data-hmi-page="'+state.page+'"]')?.focus();});
    const fields=document.getElementById('dynamicFields');
    // The form is rebuilt on grade/process/import/reset; re-render whenever its inputs are replaced.
    if(fields){observer=new MutationObserver(()=>render());observer.observe(fields,{childList:true});fields.addEventListener('input',render);}
    document.addEventListener('click',event=>{if(event.target.closest?.('#modalSaveBtn'))setTimeout(render,0);});
    window.addEventListener('pha-language-change',()=>requestAnimationFrame(render));
    // Charts take the panel width at render time, so redraw when it changes noticeably.
    if(typeof ResizeObserver==='function'){
      let width=0;
      new ResizeObserver(()=>{if(Math.abs(host.clientWidth-width)>24){width=host.clientWidth;render();}}).observe(host);
    }
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
  window.PHAHmiPanel={render,getState:()=>({...state,visible:!!host&&!host.hidden})};
})();
