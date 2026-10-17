/* Symptom-first troubleshooting navigator (window.PHATroubleTree).
   Left: the reviewed KB entries grouped by process (same filter and search as the cards below).
   Right: a decision flow for the chosen symptom, built only from that entry's reviewed fields — stop
   conditions, diagnostics, likely causes, actions after diagnosis and recurrence review. The decision
   points (stop limit near? cause confirmed? recurs?) are generic control logic, not new technical
   claims, and every action keeps the KB's own conditions. */
(function(){
  'use strict';
  const state={selected:null};
  let host=null;
  const lang=()=>typeof LANG!=='undefined'&&LANG==='en'?'en':'ko';
  const t=(ko,en)=>lang()==='en'?en:ko;
  const esc=value=>String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);
  const pick=(item,field)=>typeof tsFieldByLang==='function'?tsFieldByLang(item,field,lang()):item[field];
  const processLabel=proc=>typeof tsProcLabel==='function'?tsProcLabel(proc,lang()):proc;
  const lines=value=>(Array.isArray(value)?value:value?[value]:[]).filter(Boolean);

  // Same visibility rule as renderTS(): process filter and full-text search over the entry.
  function visibleItems(){
    const data=window.tsData||window.PHA_TROUBLESHOOTING_DATA||[];
    const chosen=document.getElementById('tsProcessFilter')?.value||'all';
    const term=(document.getElementById('tsSearch')?.value||'').trim().toLowerCase();
    return data.filter(item=>(chosen==='all'||item.process===chosen)&&(!term||JSON.stringify(item).toLowerCase().includes(term)));
  }
  function tree(items){
    const groups=new Map();
    for(const item of items){const key=item.process||'general';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
    return '<ul class="ts-tree">'+[...groups].map(([proc,rows])=>'<li><span class="ts-tree-process">'+esc(processLabel(proc))+'<small>'+rows.length+'</small></span><ul>'
      +rows.map(item=>'<li><button type="button" data-ts-tree="'+esc(item.id)+'" aria-pressed="'+(item.id===state.selected)+'">'+esc(pick(item,'symptom'))+'</button></li>').join('')+'</ul></li>').join('')+'</ul>';
  }
  const list=values=>values.length?'<ul>'+values.map(value=>'<li>'+esc(value)+'</li>').join('')+'</ul>':'<p class="ts-node-empty">'+esc(t('검토 자료에 항목이 없습니다.','No reviewed entry.'))+'</p>';
  const step=(kind,index,title,body)=>'<li class="ts-node is-'+kind+'"><span class="ts-node-index">'+index+'</span><div><strong>'+esc(title)+'</strong>'+body+'</div></li>';
  // A decision point: the question, then the branch that leaves the main path.
  const decision=(question,branch,body)=>'<li class="ts-decision"><span class="ts-diamond" aria-hidden="true"></span><div><strong>'+esc(question)+'</strong><p class="ts-branch"><b>'+esc(branch)+'</b></p>'+body+'</div></li>';
  function flow(item){
    const stop=pick(item,'stop_conditions');
    return '<div class="ts-flow-head"><p>'+esc(processLabel(item.process))+'</p><h3>'+esc(pick(item,'symptom'))+'</h3>'+(pick(item,'plain')?'<p class="ts-flow-plain">'+esc(pick(item,'plain'))+'</p>':'')+'</div>'
      +'<ol class="ts-flowchart">'
      +decision(t('정지 기준에 가까운가? (경보·한도·막힘)','Near a stop criterion? (alarm, limit, blockage)'),t('예 → 승인된 절차로 정지·감압 후 점검','Yes → stop and depressurise by the approved procedure, then inspect'),stop?'<p>'+esc(stop)+'</p>':'<p class="ts-node-empty">'+esc(t('이 항목의 정지 기준이 따로 없습니다. 설비 절차를 따르세요.','No entry-specific stop criterion. Follow the equipment procedure.'))+'</p>')
      +step('measure','1',t('관찰·측정','Observe & measure'),'<p>'+esc(pick(item,'diagnostics'))+'</p>')
      +step('causes','2',t('원인 후보 구분','Distinguish likely causes'),list(lines(pick(item,'likely_causes'))))
      +decision(t('원인이 확인되었는가?','Is the cause confirmed?'),t('아니오 → 1로 돌아가 같은 시간축 기록을 더 모읍니다','No → return to 1 and collect more time-aligned records'),'')
      +step('action','3',t('원인 확인 후 조치','Act after diagnosis'),list(lines(pick(item,'quick_fixes'))))
      +step('recheck','4',t('같은 조건에서 제품·공정 기록 재비교','Recheck parts and records under equal conditions'),'<p>'+esc(t('조치 하나씩 바꾸고, 제품 합격 기준과 공정 기록을 함께 비교합니다.','Change one action at a time and compare part acceptance with the process records.'))+'</p>')
      +decision(t('다시 발생하는가?','Does it recur?'),t('예 → 재발 방지 검토','Yes → recurrence review'),list(lines(pick(item,'root_fixes'))))
      +'</ol><p class="ts-flow-scope">'+esc(t('판단 지점은 일반적인 점검 순서이며, 각 칸의 내용은 검토된 점검 자료('+(item.review_version||'')+')에서 그대로 가져왔습니다. 조치 전 그레이드 한도와 설비 절차를 확인하세요.','Decision points are a generic check order; each box quotes the reviewed guide ('+(item.review_version||'')+'). Confirm grade limits and the equipment procedure before acting.'))+'</p>';
  }
  function render(){
    if(!host?.isConnected)return;
    const items=visibleItems();
    if(!items.length){host.hidden=true;return;}
    host.hidden=false;
    if(!items.some(item=>item.id===state.selected))state.selected=items[0].id;
    const item=items.find(entry=>entry.id===state.selected);
    host.innerHTML='<div class="ts-tree-head"><h3>'+esc(t('증상에서 조치까지 · 판단 흐름','From symptom to action · decision flow'))+'</h3><p>'+esc(t('증상을 고르면 정지 기준 → 관찰·측정 → 원인 구분 → 조치 → 재확인 순서로 보여줍니다.','Pick a symptom to follow stop criteria → measurement → causes → action → recheck.'))+'</p></div>'
      +'<div class="ts-tree-layout"><nav aria-label="'+esc(t('공정별 증상','Symptoms by process'))+'">'+tree(items)+'</nav><section class="ts-flow" aria-live="polite">'+flow(item)+'</section></div>';
  }
  function attach(){
    host=document.getElementById('tsTree');if(!host)return;
    host.addEventListener('click',event=>{
      const button=event.target.closest('[data-ts-tree]');if(!button)return;
      state.selected=button.dataset.tsTree;render();
      host.querySelector('[data-ts-tree="'+CSS.escape(state.selected)+'"]')?.focus();
    });
    // renderTS() rebuilds the cards on filter, search, language and KB load; follow it.
    const cards=document.getElementById('tsContainer');
    if(cards)new MutationObserver(()=>render()).observe(cards,{childList:true});
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
  window.PHATroubleTree={render,getState:()=>({...state,visible:!!host&&!host.hidden})};
})();
