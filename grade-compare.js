/* Grade comparison from the source registry (window.PHAGradeCompare; data: PHAEvidence.GRADES).
   - MFR as a dot plot split by test condition: values measured at different temperatures or loads are
     not comparable, so each condition gets its own panel. "<" bounds are drawn as an open-ended bar,
     ranges as intervals, "~" values as hollow dots.
   - Processing-temperature windows: each TDS stage as an interval within the grade's envelope; cold feed
     throat/feed rows are left out. Stage lists differ by process, so the scope is labelled.
   - Drying: temperature (with "<" bounds) and time per grade.
   No radar chart: unrelated axes on one polygon imply a comparability the sources do not support. */
(function(){
  'use strict';
  let host=null;
  const lang=()=>typeof LANG!=='undefined'&&LANG==='en'?'en':'ko';
  const t=(ko,en)=>lang()==='en'?en:ko;
  const esc=value=>String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);
  const SCOPE={general:['범용','General'],injection:['사출','Injection'],extrusion:['압출','Extrusion'],sheet:['시트','Sheet'],film:['필름','Film']};

  // '<4', '15–20', '~4', '7', '>5' -> {op, lo, hi}
  function parseValue(text){
    const match=String(text).trim().match(/^([<>~])?\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/);
    if(!match)return null;
    const lo=Number(match[2]),hi=match[3]?Number(match[3]):lo;
    return {op:match[1]||'',lo,hi,text:match[0].replace(/\s+/g,'')};
  }
  function mfrRows(grades){
    return Object.entries(grades).filter(([,g])=>g.mfr).map(([grade,g])=>{
      const [value,condition='']=g.mfr.split('·').map(part=>part.trim());
      return {grade,scope:g.scope,value:parseValue(value),condition};
    }).filter(row=>row.value);
  }
  function stageList(g){
    const stages=g.stages||Object.values(g.processStages||{})[0]||[];
    return stages.filter(([,,range])=>Math.max(...range)>60);   // cold feed throat / feed rows are not melt-side
  }
  function room(){return Math.max(300,Math.round((host?.clientWidth||700)-24));}

  /* A row chart: grade labels left, value text right, a shared numeric axis between them. */
  function rowChart({title,rows,domain,step,unit,draw,label}){
    const W=Math.min(room(),860),labelW=104,valueW=lang()==='en'?132:120,top=8,rowH=24,axisH=22;
    const H=top+rows.length*rowH+axisH,x0=labelW,x1=W-valueW,scale=v=>x0+(v-domain[0])/(domain[1]-domain[0])*(x1-x0);
    let svg='<svg class="grade-chart" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(title)+'">';
    for(let v=domain[0];v<=domain[1]+1e-9;v+=step)svg+='<line class="grid" x1="'+scale(v)+'" x2="'+scale(v)+'" y1="'+top+'" y2="'+(H-axisH)+'"/><text class="axis" x="'+scale(v)+'" y="'+(H-6)+'" text-anchor="middle">'+v+'</text>';
    svg+='<text class="axis" x="'+x1+'" y="'+(H-6)+'" dx="10">'+esc(unit)+'</text>';
    rows.forEach((row,i)=>{
      const y=top+i*rowH+rowH/2,selected=row.grade===selectedGrade();
      svg+='<g class="grade-row'+(selected?' is-selected':'')+'"><text class="name" x="6" y="'+(y+4)+'">'+esc(row.grade)+'</text>'
        +draw(row,scale,y)+'<text class="value" x="'+(W-6)+'" y="'+(y+4)+'" text-anchor="end">'+esc(label(row))+'</text></g>';
    });
    return '<figure class="grade-figure"><figcaption>'+esc(title)+'</figcaption>'+svg+'</svg></figure>';
  }
  function mfrPanels(grades){
    const rows=mfrRows(grades),conditions=[...new Set(rows.map(row=>row.condition))];
    // Highest test temperature first; the same scale in every panel, but panels are never merged.
    conditions.sort((a,b)=>parseFloat(b)-parseFloat(a)||a.localeCompare(b));
    const max=Math.ceil(Math.max(...rows.map(row=>row.value.hi))/5)*5+5;
    return conditions.map(condition=>rowChart({
      title:'MFR · '+condition,rows:rows.filter(row=>row.condition===condition),domain:[0,max],step:5,unit:'g/10 min',
      label:row=>row.value.text,
      draw:(row,x,y)=>{
        const v=row.value;
        if(v.op==='<')return '<line class="bound" x1="'+x(0)+'" x2="'+x(v.hi)+'" y1="'+y+'" y2="'+y+'"/><path class="bound-end" d="M'+x(v.hi)+' '+(y-6)+'V'+(y+6)+'"/>';
        if(v.op==='>')return '<line class="bound" x1="'+x(v.lo)+'" x2="'+x(max)+'" y1="'+y+'" y2="'+y+'"/><path class="bound-end" d="M'+x(v.lo)+' '+(y-6)+'V'+(y+6)+'"/>';
        if(v.hi>v.lo)return '<line class="interval" x1="'+x(v.lo)+'" x2="'+x(v.hi)+'" y1="'+y+'" y2="'+y+'"/>';
        return '<circle class="'+(v.op==='~'?'dot approx':'dot')+'" cx="'+x(v.lo)+'" cy="'+y+'" r="5"/>';
      }
    })).join('');
  }
  function temperaturePanel(grades){
    const rows=Object.entries(grades).map(([grade,g])=>({grade,scope:g.scope,stages:stageList(g)})).filter(row=>row.stages.length);
    const values=rows.flatMap(row=>row.stages.flatMap(([,,range])=>range));
    const domain=[Math.floor((Math.min(...values)-5)/10)*10,Math.ceil((Math.max(...values)+5)/10)*10];
    return rowChart({
      title:t('가공 온도 창 · TDS 단계별 설정 범위','Processing windows · TDS stage set ranges'),rows,domain,step:10,unit:'°C',
      label:row=>{const all=row.stages.flatMap(([,,r])=>r);return Math.min(...all)+'–'+Math.max(...all)+' · '+(SCOPE[row.scope]||[row.scope,row.scope])[lang()==='en'?1:0];},
      draw:(row,x,y)=>{
        const all=row.stages.flatMap(([,,r])=>r),lo=Math.min(...all),hi=Math.max(...all);
        let out='<rect class="envelope" x="'+x(lo)+'" y="'+(y-7)+'" width="'+Math.max(2,x(hi)-x(lo))+'" height="14"/>';
        row.stages.forEach(([ko,en,range],k)=>{
          const dy=(k-(row.stages.length-1)/2)*3.2;
          out+='<line class="stage" x1="'+x(range[0])+'" x2="'+(x(range[1])+(range[1]===range[0]?2:0))+'" y1="'+(y+dy)+'" y2="'+(y+dy)+'"><title>'+esc((lang()==='en'?en:ko)+' '+range[0]+'–'+range[1]+' °C')+'</title></line>';
        });
        return out;
      }
    });
  }
  function dryingPanel(grades){
    const rows=Object.entries(grades).filter(([,g])=>g.drying).map(([grade,g])=>({grade,temp:parseValue(g.drying.temperature),hours:g.drying.hours,
      moisture:g.processMoisturePpm?(g.moistureOperator||'')+g.processMoisturePpm+' ppm':''})).filter(row=>row.temp);
    return rowChart({
      title:t('건조 조건 · 온도(이하 표시는 상한)와 시간','Drying · temperature ("<" is an upper bound) and time'),rows,domain:[30,90],step:10,unit:'°C',
      label:row=>row.temp.text+' °C · '+row.hours+(row.moisture?' · '+row.moisture:''),
      draw:(row,x,y)=>{
        const v=row.temp;
        if(v.op==='<')return '<line class="bound" x1="'+x(30)+'" x2="'+x(v.hi)+'" y1="'+y+'" y2="'+y+'"/><path class="bound-end" d="M'+x(v.hi)+' '+(y-6)+'V'+(y+6)+'"/>';
        return '<circle class="dot" cx="'+x(v.lo)+'" cy="'+y+'" r="5"/>';
      }
    });
  }
  function selectedGrade(){return document.getElementById('mat_grade')?.value||document.getElementById('grade')?.value||'';}
  function render(){
    if(!host?.isConnected)return;
    const grades=window.PHAEvidence?.GRADES;
    if(!grades){host.hidden=true;return;}
    host.hidden=false;
    host.innerHTML='<div class="grade-compare-head"><h3>'+esc(t('그레이드 비교 · 공개 TDS 기준','Grade comparison · published TDS'))+'</h3><p>'+esc(t('선택한 그레이드는 진하게 표시합니다. MFR은 시험 온도·하중이 같은 것끼리만 한 패널에 놓습니다.','The selected grade is drawn dark. MFR panels group only values tested at the same temperature and load.'))+'</p></div>'
      +'<div class="grade-legend"><span><i class="dot"></i>'+esc(t('값','Value'))+'</span><span><i class="dot approx"></i>'+esc(t('약(~)','About (~)'))+'</span><span><i class="interval"></i>'+esc(t('범위','Range'))+'</span><span><i class="bound"></i>'+esc(t('이하(<) 상한','Below (<) bound'))+'</span><span><i class="envelope"></i>'+esc(t('단계 범위 전체','All stages'))+'</span></div>'
      +mfrPanels(grades)+temperaturePanel(grades)+dryingPanel(grades)
      +'<p class="grade-note">'+esc(t('공정 단계 범위는 배럴·다이 설정값이며 용융온도 실측값이 아닙니다. 그레이드마다 TDS의 단계 이름과 공정이 달라 같은 위치끼리 1:1로 대응하지 않습니다. 각 값은 물성 근거의 원문과 개정일을 확인하세요.','Stage ranges are barrel/die set points, not measured melt temperatures. Stage names and processes differ between TDS documents, so positions do not map one-to-one. Check each value against the source and revision under the material reference.'))+'</p>'
      +'<details class="grade-sources"><summary>'+esc(t('출처','Sources'))+'</summary><ul>'+Object.entries(grades).map(([grade,g])=>'<li><a href="'+esc(g.source)+'" target="_blank" rel="noopener noreferrer">'+esc(grade)+'</a> · '+esc(g.family)+' · '+esc(g.revision)+'</li>').join('')+'</ul></details>';
  }
  function attach(){
    host=document.getElementById('gradeCompare');if(!host)return;
    document.addEventListener('change',event=>{if(['mat_grade','grade'].includes(event.target.id))render();});
    window.addEventListener('pha-language-change',()=>requestAnimationFrame(render));
    if(typeof ResizeObserver==='function'){let width=0;new ResizeObserver(()=>{if(Math.abs(host.clientWidth-width)>24){width=host.clientWidth;render();}}).observe(host);}
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
  window.PHAGradeCompare={render,parseValue,mfrRows,stageList};
})();
