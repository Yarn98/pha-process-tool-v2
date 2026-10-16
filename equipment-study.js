/* Shared image inspection and explicit-unit motion study for all eight rigs. */
(function(){
  'use strict';
  const saved=new Map();
  const descriptions={
    injection:['스크류·배럴 절개와 열린 금형, 타이바, 취출 구조를 확인하세요.','Inspect the cutaway screw/barrel, open mold, tie bars and ejection mechanism.'],
    extrusion:['단축 압출기 → 스트랜드 수조 → 인취 롤 → 펠릿 절단기 구성입니다.','Single-screw extruder → strand bath → puller rolls → pelletizer.'],
    sheet:['평다이와 3롤 업스택 배치의 예입니다. 실제 롤 배치는 설비마다 다릅니다.','A flat die and three-roll upstack example. Actual roll arrangements vary.'],
    castfilm:['평다이, 에어 갭, 칠 롤, 가이드 롤과 권취부의 경로를 확인하세요.','Trace the flat die, air gap, chill roll, guide rolls and winding path.'],
    blownfilm:['환형 다이와 에어링, 버블, 접힘부, 닙롤, 권취부의 구성입니다.','Annular die, air ring, bubble, collapsing frame, nip rolls and winder.'],
    blowmolding:['압출 블로우 성형의 패리슨, 분할 금형, 블로우 핀과 병 형상입니다.','Extrusion blow molding: parison, split mold, blow pin and formed bottle.'],
    compounding:['동방향 이축 스크류·혼련 디스크, 사이드 피더, 벤트와 펠릿화 후단입니다.','Co-rotating twin screws, kneading discs, side feeder, vent and pelletizing section.'],
    straw:['Straw Optimizer v2의 Unreal 환형 다이 이미지입니다. 스크린 팩, 맨드렐과 중공 출구를 보여줍니다.','Unreal annular-die image from Straw Optimizer v2: screen pack, mandrel and hollow outlet.']
  };
  function mount(host,{kind,locale,start,stop,pause}){
    const en=locale==='en',t=(ko,english)=>en?english:ko,model=window.PHAEquipmentModels?.[kind];
    // A rig may carry its own worked example (e.g. the compounding line's feed roll and pellet length).
    if(!saved.has(kind))saved.set(kind,{photo:false,open:false,drive:kind==='blowmolding'?'travel':'screw',rpm:30,speed:6,diameter:200,pitch:kind==='straw'?200:3,stroke:100,velocity:50,scale:.1,...model?.study});
    const state=saved.get(kind);
    const choices=kind==='blowmolding'?[['travel','금형 이동','Mold travel']]:[
      ['screw','스크류 회전','Screw rotation'],
      ...(kind==='injection'?[['travel','스크류 전진','Screw advance']]:
        [...(kind==='straw'?[]:[[kind==='sheet'||kind==='castfilm'?'roll':'haul','인취·냉각 롤','Puller / cooling roll']]),
          ...(['sheet','castfilm','blownfilm'].includes(kind)?[['winder','권취 롤','Winding roll']]:[]),
          ...(['straw','extrusion','compounding'].includes(kind)?[['cutter','절단날','Cutter']]:[])])
    ];
    const bar=document.createElement('div');bar.className='study-viewbar';
    bar.innerHTML=`<div role="group" aria-label="${t('설비 보기 방식','Equipment view')}"><button type="button" data-study-view="model">${t('3D 조작','Interactive 3D')}</button><button type="button" data-study-view="photo">${t('Unreal 상세 이미지','Unreal detail')}</button></div><span>${t('설비 구조 살펴보기','Equipment inspection')}</span>`;
    host.prepend(bar);
    const figure=document.createElement('figure');figure.className='study-photo';figure.hidden=true;
    figure.innerHTML=`<img src="assets/equipment/unreal/${kind}.webp?v=26" width="1600" height="900" decoding="async" alt="${descriptions[kind][en?1:0]}"><figcaption><span>${descriptions[kind][en?1:0]}</span><small>${t('Blender 형상 · Unreal 조명/재질 · 설명용 설비','Blender geometry · Unreal lighting/materials · Illustrative equipment')}</small></figcaption>`;
    bar.after(figure);
    const panel=document.createElement('details');panel.className='equipment-study';panel.open=state.open;
    panel.innerHTML=`<summary>${t('회전수·속도 계산과 동작 확인','Calculate motion and inspect operation')}</summary><p class="study-basis">${t('예제 입력값입니다. 실측값으로 바꿔 비교하세요. 이 계산은 생산 조건을 추천하지 않습니다.','Example inputs. Replace them with measured values to compare. These calculations do not recommend production conditions.')}</p><div class="study-fields"><label>${t('확인할 동작','Mechanism')}<select data-study-drive>${choices.map(([key,ko,english])=>`<option value="${key}">${t(ko,english)}</option>`).join('')}</select></label>${[
      ['rpm','스크류 회전수','Screw speed','rpm',0,3000,1],
      ['speed','제품 선속도','Product line speed','m/min',0,1000,.1],
      ['diameter','현재 롤 직경','Current roll diameter','mm',1,5000,1],
      ['pitch',kind==='straw'?'스트로 절단 길이':'펠릿 절단 피치',kind==='straw'?'Straw cut length':'Pellet cut pitch','mm',.1,10000,.1],
      ['stroke',kind==='blowmolding'?'금형 이동 거리':'스크류 전진 거리',kind==='blowmolding'?'Mold travel distance':'Screw forward stroke','mm',0,5000,1],
      ['velocity','평균 이동 속도','Mean travel velocity','mm/s',.1,5000,.1]
    ].map(([key,ko,english,unit,min,max,step])=>`<label data-study-field="${key}">${t(ko,english)} <small>${unit}</small><input type="number" inputmode="decimal" data-study-input="${key}" min="${min}" max="${max}" step="${step}" value="${state[key]}" aria-label="${t(ko,english)} (${unit})"></label>`).join('')}<label>${t('동작 표시 속도','Motion display speed')}<select data-study-input="scale" aria-label="${t('동작 표시 속도','Motion display speed')}"><option value="0.1">0.1×</option><option value="0.25">0.25×</option><option value="1">1×</option></select></label></div><output class="study-result" aria-live="polite"></output><p class="study-formula"></p><div class="study-actions"><button type="button" data-study-run>${t('계산값으로 동작 보기','Inspect calculated motion')}</button><button type="button" data-study-stop>${t('동작 멈춤','Stop motion')}</button><span class="study-status" role="status"></span></div><p class="study-limit"></p>`;
    host.append(panel);
    panel.querySelector('[data-study-drive]').value=state.drive;
    panel.querySelector('[data-study-input="scale"]').value=String(state.scale);
    let drive=null;
    const status=panel.querySelector('.study-status');
    const halted=()=>{stop();status.textContent='';};
    function view(photo){
      state.photo=photo;host.classList.toggle('is-study-photo',photo);figure.hidden=!photo;
      bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.studyView==='photo')===photo)));
      if(photo){halted();pause();}
      window.phaSyncMachineOverlay?.();
    }
    bar.querySelectorAll('button').forEach(button=>button.onclick=()=>view(button.dataset.studyView==='photo'));
    function calculate(){
      const motion=state.drive,linear=motion==='travel',cut=motion==='cutter';
      const required=linear?['stroke','velocity']:motion==='screw'?['rpm']:cut?['speed','pitch']:['speed','diameter'];
      panel.querySelectorAll('[data-study-field]').forEach(label=>label.hidden=!required.includes(label.dataset.studyField));
      const valid=[...required,'scale'].every(key=>{const input=panel.querySelector(`[data-study-input="${key}"]`);return input.value.trim()!==''&&input.checkValidity()&&Number.isFinite(Number(input.value));});
      const edges=model?.cut_edges??(kind==='straw'?1:4);
      let value=valid?(linear?PHAKinematics.travel(state.stroke,state.velocity):motion==='screw'?state.rpm:cut?PHAKinematics.cuts(state.speed,state.pitch)/edges:PHAKinematics.rpm(state.speed,state.diameter)):null;
      if(value!==null&&!Number.isFinite(value))value=null;
      drive=value===null?null:{group:motion==='screw'&&kind==='injection'?'rotation':motion,type:linear?'travel':'spin',rpm:linear?0:value,seconds:linear?value:0,scale:state.scale};
      panel.querySelector('[data-study-run]').disabled=!drive||host.dataset.motionState!=='ready';
      panel.querySelector('.study-result').textContent=value===null?t('입력 범위와 단위를 확인하세요.','Check the input range and units.'):
        linear?`${value.toFixed(3)} s · ${t('편도 이동','one-way travel')}`:
        `${value.toFixed(2)} rpm · ${(value*6).toFixed(2)} °/s`+(cut?` · ${(value*edges).toFixed(2)} ${t('회/분','cuts/min')}`:'');
      panel.querySelector('.study-formula').textContent=linear?'t = L / v':motion==='screw'?'ω = 6 × RPM':cut?`cuts/min = 1000 × v / L; RPM = cuts/min / ${edges}`:'RPM = 1000 × v / (π × D)';
      panel.querySelector('.study-limit').textContent=linear?t('모형의 전체 이동을 입력 거리에 대응시킨 편도 동작입니다. 일정 평균 속도를 가정하며 가감속·보압·냉각 시간은 제외합니다.','Input distance maps to the model’s full one-way travel at a constant mean velocity. Acceleration, packing and cooling are excluded.'):
        cut?t(`날 ${edges}개 모형 기준, 스트랜드 1개당 절단 횟수입니다. 수지 표시는 유동해석 결과가 아닙니다.`,`Based on the model’s ${edges} cutting edge(s), per strand. Resin markers are not a flow simulation.`):
        motion==='screw'?t('선택한 스크류의 회전만 연결합니다. 토출량·점도·발열을 예측하지 않습니다.','Only screw rotation is linked. Output, viscosity and heat generation are not predicted.'):
        t('미끄럼 없는 현재 롤 직경 기준입니다. 권취 직경 변화·필름 연신·장력은 계산하지 않습니다.','No slip, at the current roll diameter. Roll buildup, film draw and tension are not calculated.');
    }
    panel.querySelector('[data-study-drive]').onchange=event=>{halted();state.drive=event.target.value;calculate();};
    panel.querySelectorAll('[data-study-input]').forEach(input=>input.oninput=()=>{halted();state[input.dataset.studyInput]=input.value===''?'':Number(input.value);calculate();});
    panel.querySelector('[data-study-run]').onclick=()=>{
      calculate();if(!drive)return;view(false);
      start({...drive,onComplete:()=>{status.textContent=t('편도 이동 완료','One-way travel complete');}});
      status.textContent=drive.type==='travel'&&drive.seconds===0?t('이동 거리 0 · 정지','Zero distance · Stopped'):drive.type==='spin'&&drive.rpm===0?t('0 rpm · 정지','0 rpm · Stopped'):t('선택 동작 표시 중 · ','Showing selected motion · ')+state.scale+'×';
      host.querySelector('.motion-viewport')?.scrollIntoView({block:'nearest',behavior:'instant'});
    };
    panel.querySelector('[data-study-stop]').onclick=halted;
    function layout(){host.classList.toggle('is-study-open',panel.open);window.phaSyncMachineOverlay?.();}
    panel.ontoggle=()=>{state.open=panel.open;if(!panel.open)halted();layout();};
    figure.querySelector('img').onerror=()=>{figure.querySelector('figcaption small').textContent=t('상세 이미지를 열 수 없습니다. 3D 조작으로 돌아가세요.','Detail image unavailable. Return to Interactive 3D.');};
    calculate();view(state.photo);layout();
    return {refresh:calculate,clearStatus:()=>{status.textContent='';}};
  }
  window.PHAEquipmentStudy={mount};
})();
