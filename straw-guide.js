/**
 * straw-guide.js
 * PHA straw extrusion guide — 5 sub-tabs rendered into #strawGuideContainer.
 * Entry point: initStrawGuide()
 * Depends on: global LANG ('ko'|'en'), localStorage key 'straw_checklist'
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
   * i18n helper
   * ───────────────────────────────────────── */
  function t(ko, en) {
    return (typeof LANG !== 'undefined' && LANG === 'en') ? en : ko;
  }

  /* ─────────────────────────────────────────
   * DOM helpers
   * ───────────────────────────────────────── */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'className') node.className = v;
        else if (k === 'style') node.style.cssText = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else node.setAttribute(k, v);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c != null) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  /* ─────────────────────────────────────────
   * Sub-tab switching (scoped to container)
   * ───────────────────────────────────────── */
  function showStrawTab(container, index) {
    container.querySelectorAll('.flash-tab').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });
    container.querySelectorAll('.flash-content').forEach((pane, i) => {
      pane.classList.toggle('active', i === index);
    });
  }

  /* ─────────────────────────────────────────
   * ST-1: Production Speed Calculator
   * ───────────────────────────────────────── */
  function buildST1() {
    const wrap=el('div',{className:'flash-content active',id:'straw-tab-0'});
    const fields=[
      ['sg-ls','절단 피치: 제품 길이 + 절단 손실 (mm)','Cut pitch: product length + cutting allowance (mm)',260],
      ['sg-lw','유효 수조 길이 (m)','Effective bath length (m)',8.5],
      ['sg-tcrit','시험으로 확인한 최소 체류시간 (s)','Trial-verified minimum residence time (s)',''],
      ['sg-ms','스트로 1개 질량 (g)','Mass per straw (g)',1.5],
      ['sg-lanes','동시에 생산하는 가닥 수','Number of simultaneous lanes',1],
      ['sg-ntarget','전체 목표 생산량 (개/min, 선택)','Total target output (pieces/min, optional)','']
    ];
    wrap.innerHTML=`<h3>${t('체류시간으로 비교하는 생산량','Output from residence time')}</h3><p>${t('절단 피치·질량 예시를 설비 값으로 바꾸고 해당 그레이드·수조 온도·두께의 시험에서 확인한 최소 체류시간을 입력하세요.','Replace example cut pitch and mass with line measurements; enter residence time established for the actual grade, bath temperature and wall thickness.')}</p><div class="weight-calc-grid">${fields.map(([id,ko,en,value])=>`<div class="weight-input-box"><label for="${id}">${t(ko,en)}</label><input type="number" id="${id}" value="${value}" min="${id==='sg-lanes'?1:0}" step="${id==='sg-lanes'?1:'any'}"></div>`).join('')}</div><p class="atlas-note">${t('같은 속도로 생산하는 n개 가닥을 가정합니다. 절단 손실은 피치에 포함하세요. 표시 질량은 제품 생산량이며 스크랩·정지·불량 손실을 더한 압출 토출량은 별도 확인합니다. 체류시간 충족은 결정화나 양품 판정이 아닙니다.','Assumes n lanes at equal speed. Include cutting allowance in the pitch. Displayed mass is product output; separately account for scrap, downtime and rejects when assessing extruder throughput. Meeting an entered residence time does not establish crystallization or product acceptance.')}</p><details><summary>${t('계산식과 단위','Equations and units')}</summary><div class="formula">v = (N_total / n) × L_pitch / 1000 (m/min)<br>t = 60 × L_w / v (s)<br>N_total,limit = 60 × L_w × n / (L_pitch/1000 × t_required)<br>Q = 0.06 × N_total × m_s (kg/h)</div></details><button class="calc-button" id="sg-calc">${t('계산','Calculate')}</button><div id="sg-result" aria-live="polite"></div>`;
    wrap.querySelector('#sg-calc').addEventListener('click',()=>{
      const v=fields.map(([id])=>wrap.querySelector('#'+id).value);
      const r=PHAEvidence.strawCapacity(...v.slice(0,5).map(Number),v[5]===''?undefined:Number(v[5]));
      const out=wrap.querySelector('#sg-result');
      if(r.error){out.innerHTML=`<p role="alert" class="atlas-note">${t('양의 유한값과 정수 가닥 수를 입력하세요. 최소 체류시간은 시험 결과가 필요합니다.','Enter finite positive values and an integer lane count. A trial-established minimum residence time is required.')}</p>`;return;}
      out.innerHTML=`<div class="calc-result"><h4>${t('입력한 체류시간 기준의 기하학적 한계','Geometric limit for the entered residence time')}</h4><p>${t('전체 생산량','Total output')}: <strong>${r.total_per_min.toFixed(1)}</strong> ${t('개/min','pieces/min')} · ${r.perLane_per_min.toFixed(1)} / ${t('가닥','lane')}</p><p>${r.lineSpeed_m_min.toFixed(2)} m/min · ${r.mass_kg_h.toFixed(2)} kg/h</p>${v[5]!==''?`<p>${t('목표 생산량에서 체류시간','Residence at target output')}: ${r.targetResidence_s.toFixed(2)} s · ${t('필요 유효 길이','Required effective length')}: ${r.requiredBath_m.toFixed(2)} m</p><p>${r.meetsEnteredResidence?t('입력한 체류시간 이상입니다. 제품 품질은 별도 확인하세요.','Meets the entered residence time; check product quality separately.'):t('입력한 체류시간에 못 미칩니다. 생산량과 유효 길이를 다시 검토하세요.','Below the entered residence time; review output and effective bath length.')}</p>`:''}</div>`;
    }); return wrap;
  }

  function buildST2() {
    const wrap=el('div',{className:'flash-content',id:'straw-tab-1'}),g=PHAEvidence.GRADES.CB0400A;
    const rows=[...g.stages,['다이 설정온도','Die set temperature',g.straw.die],['결정화 수조','Crystallization bath',g.straw.waterBath]];
    wrap.innerHTML=`<h3>CB0400A · ${t('제조사 압출 조건','Manufacturer extrusion conditions')}</h3><a href="${g.source}" target="_blank" rel="noopener noreferrer">PHACT CB0400A TDS · ${g.revision} ↗</a><p>${t('이 표는 CB0400A에 한정됩니다. 다른 PHA나 블렌드에 적용하기 전에 원료명·로트와 최신 가공 지침을 확인하세요.','This table applies to CB0400A. Confirm grade, lot and current processing instructions before using it for another PHA or blend.')}</p><div class="tablewrap"><table><thead><tr><th>${t('위치·역할','Location / role')}</th><th>°C</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${t(r[0],r[1])}</td><td>${r[2].join('–')}</td></tr>`).join('')}</tbody></table></div><p>${t('건조 75 °C × 4 h · 공정 투입 수분 <400 ppm. 건조공기 이슬점과 펠릿 수분량은 각각 확인합니다. 공급부 온도를 배럴 1번 설정값으로 자동 치환하지 않습니다.','Drying: 75 °C × 4 h; process moisture <400 ppm. Check drying-air dew point and pellet water separately. Do not automatically map feed temperature to barrel zone 1.')}</p><p class="atlas-note">${t('70–75 °C는 결정화 수조 조건이며 시트 칠롤 값이 아닙니다. 다이 설정온도와 측정 용융온도도 구분합니다. 이 TDS는 190 °C 초과와 고온 장기 체류에 따른 열화에 주의를 요구합니다.','The 70–75 °C bath supports crystallization; it is not a sheet chill-roll setting. Distinguish die setpoint from measured melt temperature. This TDS cautions about degradation above 190 °C and prolonged hot residence.')}</p><details><summary>${t('그레이드 전환·퍼지','Grade change / purging')}</summary><p>${t('CB0400A 문서는 현재 수지에 맞는 퍼지제를 우선하고 없을 때 LDPE를 대안으로 제시합니다. 이전 수지를 제거하고 배럴을 비운 뒤 CB0400A를 투입합니다. 장비·퍼지제의 온도 범위와 작업 절차를 함께 확인하세요.','The CB0400A document prefers a purge compound suited to the current material, with LDPE as its fallback. Remove previous material and empty the barrel before introducing CB0400A. Follow equipment and purge-material temperature limits and procedures.')}</p></details>`;
    return wrap;
  }

  function buildST3() {
    const wrap=el('div',{className:'flash-content',id:'straw-tab-2'});
    const ds=[
      ['표면 거칠음·샤크스킨','Rough surface / sharkskin','미용융·다이 오염·유량 변동·높은 다이 전단을 구분합니다. 표면 확대 관찰과 공급량·압력·측정 용융온도를 비교하고 낮은 토출량의 시험에서 개선되는지 확인하세요.','Distinguish unmelted material, die contamination, flow variation and high die shear. Compare magnified surfaces, feed rate, pressure and measured melt temperature; test whether lower output improves the surface.'],
      ['찢어짐·절단 균열','Tearing / cutting cracks','열화·불충분한 형상 고정·과도한 인취·칼날과 절단 동기화가 원인 후보입니다. 처음 발생하는 위치를 찾고 두께·체류시간·절단면·보관 후 변화를 비교하세요. 조성비만으로 연속상을 단정하거나 반응성 첨가제를 바로 투입하지 않습니다.','Possible causes include degradation, incomplete shape setting, excessive draw and cutter/blade issues. Locate the first defect and compare wall thickness, residence time, cut faces and post-storage changes. Composition alone does not identify the continuous phase or justify reactive additives.'],
      ['타원·치수 변동·휨','Ovality / dimensional variation / bending','인취·내부 공기압·사이징·냉각 비대칭·공급 변동을 구분합니다. 여러 방향의 외경·벽 두께와 시간별 변화를 기록하고 정렬·지지·접촉을 확인한 뒤 한 변수씩 조정하세요.','Distinguish haul-off, internal air pressure, sizing, asymmetric cooling and feed variation. Record diameter and wall thickness around the tube and over time; check alignment, support and contact before adjusting one variable.']
    ];
    wrap.innerHTML=`<h3>${t('원인을 확인한 뒤 조정','Diagnose before adjusting')}</h3>${ds.map(d=>`<details class="card"><summary>${t(d[0],d[1])}</summary><p>${t(d[2],d[3])}</p></details>`).join('')}<p class="atlas-note">${t('조건부 점검 절차입니다. 증상만으로 분자량 감소나 가교를 확정하지 않습니다. 잼·균열·치수 이탈이 증가하면 증속을 중단합니다. 막힘·과부하는 설비 절차에 따라 감압·정지 후 점검하고 회전부·벤트 안에 공구를 넣지 않습니다.','These are conditional checks; symptoms alone cannot establish molecular-weight loss or crosslinking. Stop increasing speed if jams, cracks or dimensional deviations worsen. For blockage/overload, depressurize and stop according to the equipment procedure before inspection; do not insert tools into moving equipment or vents.')}</p>`;
    return wrap;
  }

  function loadChecklistState() {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveChecklistState(state) {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
    } catch (_) { /* ignore quota errors */ }
  }

  function buildST4() {
    const wrap = el('div', { className: 'flash-content', id: 'straw-tab-3' });

    const heading = el('h3', { style: 'color:#1e3c72;margin-bottom:16px', text: t('운영자 체크포인트', 'Operator Checkpoints') });
    wrap.appendChild(heading);

    // Warning box
    const warnBox = el('div', {
      style: 'background:#fff3cd;border:1px solid #ffc107;border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:20px',
      html: `<strong>⚠️ ${t('주의', 'Warning')}</strong><br>
        ${t(
          '400 str/min 이상에서 문제 발생 시: 온도를 먼저 손대기보다 체류시간과 장력(draw tension)부터 다시 계산하는 것이 올바른 순서입니다.',
          'When issues occur above 400 str/min: The correct first step is to recalculate residence time and draw tension before adjusting temperature.'
        )}`,
    });
    wrap.appendChild(warnBox);

    const checkItems = [
      // Before Start
      { id: 'ck0', section: 'before', text: t('Screen pack 상태 확인', 'Verify screen pack condition') },
      { id: 'ck1', section: 'before', text: t('Die-bath gap 거리 확인', 'Check die-bath gap distance') },
      { id: 'ck2', section: 'before', text: t('Air pressure 설정 확인', 'Verify air pressure settings') },
      { id: 'ck3', section: 'before', text: t('커팅 동기화 점검', 'Inspect cutting synchronization') },
      // During Operation
      { id: 'ck4', section: 'during', text: t('다이 출구 온도의 측정 위치·방법 기록', 'Record die-exit temperature measurement location and method') },
      { id: 'ck5', section: 'during', text: t('압력 모니터링', 'Monitor pressure') },
      { id: 'ck6', section: 'during', text: t('표면 roughness 모니터링', 'Monitor surface roughness') },
      { id: 'ck7', section: 'during', text: t('물구간 체류시간 모니터링', 'Monitor water-bath residence time') },
    ];

    const state = loadChecklistState();

    function renderSection(title, items) {
      const section = el('div', { className: 'checklist', style: 'margin-bottom:20px' });
      section.appendChild(el('h4', { style: 'color:#1e3c72;margin-bottom:12px', text: title }));
      items.forEach(item => {
        const row = el('div', { className: 'checklist-item' + (state[item.id] ? ' checked' : ''), id: `straw-cl-${item.id}` });
        const cb = el('input', { type: 'checkbox', className: 'checklist-checkbox', id: `straw-cb-${item.id}` });
        if (state[item.id]) cb.checked = true;
        const label = el('label', { className: 'checklist-text', for: `straw-cb-${item.id}`, text: item.text });

        const toggle = () => {
          state[item.id] = cb.checked;
          saveChecklistState(state);
          row.classList.toggle('checked', cb.checked);
        };

        cb.addEventListener('change', toggle);
        row.addEventListener('click', (e) => {
          if (e.target !== cb) {
            cb.checked = !cb.checked;
            toggle();
          }
        });

        row.appendChild(cb);
        row.appendChild(label);
        section.appendChild(row);
      });
      return section;
    }

    wrap.appendChild(renderSection(
      t('가동 전 점검 (Before Start)', 'Before Start'),
      checkItems.filter(c => c.section === 'before')
    ));
    wrap.appendChild(renderSection(
      t('운전 중 점검 (During Operation)', 'During Operation'),
      checkItems.filter(c => c.section === 'during')
    ));

    // Reset button
    const resetBtn = el('button', { className: 'calc-button', text: t('체크리스트 초기화', 'Reset Checklist') });
    resetBtn.style.background = '#6b7280';
    resetBtn.addEventListener('click', () => {
      if (!confirm(t('모든 체크를 초기화하시겠습니까?', 'Reset all checkboxes?'))) return;
      checkItems.forEach(item => {
        state[item.id] = false;
        const cb = document.getElementById(`straw-cb-${item.id}`);
        const row = document.getElementById(`straw-cl-${item.id}`);
        if (cb) cb.checked = false;
        if (row) row.classList.remove('checked');
      });
      saveChecklistState(state);
    });
    wrap.appendChild(resetBtn);

    return wrap;
  }

  /* ─────────────────────────────────────────
   * ST-5: Temperature / shape Guide
   * ───────────────────────────────────────── */
  function buildST5() {
    const wrap=el('div',{className:'flash-content',id:'straw-tab-4'});
    wrap.innerHTML=`<h3>${t('온도와 형상 고정의 측정','Temperature and shape-setting measurements')}</h3><div class="atlas-steps">${[['다이 설정','Die setpoint'],['용융온도 측정','Melt measurement'],['수조·체류시간','Bath / residence'],['치수·결정화','Dimensions / crystallization']].map((r,i)=>`<div class="atlas-step"><span>${i+1}</span>${t(...r)}</div>`).join('')}</div><p>${t('생산속도만으로 다이 출구 온도를 계산할 수 없습니다. 그레이드·스크류·토출량·전단·체류시간·센서 위치가 달라지면 온도 응답도 달라집니다.','Production rate alone cannot determine die-exit temperature. Grade, screw geometry, output, shear, residence time and sensor position affect the response.')}</p><ul><li>${t('배럴·다이 설정값과 접촉식 용융온도 측정을 별도로 기록하세요. IR 표면값은 내부 용융온도와 구분하고 방사율·측정 위치를 기록합니다.','Record barrel/die settings separately from contact melt-temperature readings. Keep IR surface readings distinct from internal melt temperature; record emissivity and location.')}</li><li>${t('수조 설정값·측정값·유효 길이·인취 속도를 두께·외경·휨·절단 상태와 함께 기록합니다.','Record bath setpoint, measured temperature, effective length and haul-off speed alongside wall thickness, diameter, bending and cut quality.')}</li><li>${t('유리전이·고화·결정화를 같은 현상으로 취급하지 않습니다. 필요하면 DSC와 보관 후 치수·물성으로 확인합니다.','Do not use glass transition, solidification and crystallization interchangeably. Use DSC and dimensions/properties after conditioning where needed.')}</li></ul><p class="atlas-note">${t('보정 이력이 없는 속도–온도 회귀값과 출처 없는 “실측 온도 창”을 제공하지 않습니다. 시험 조건은 그레이드·설비·측정 방법과 함께 기록하세요.','No speed-temperature regression or measured temperature window is established without calibration history. Record trial conditions with grade, equipment and measurement method.')}</p>`;
    return wrap;
  }

  function initStrawGuide() {
    const root = document.getElementById('strawGuideContainer');
    if (!root) {
      console.error('[straw-guide] #strawGuideContainer not found');
      return;
    }

    const entered = Object.fromEntries([...root.querySelectorAll('input[type=number]')].map(i=>[i.id,i.value]));
    const priorTab = [...root.querySelectorAll('.flash-tab')].findIndex(b=>b.classList.contains('active'));
    const hadResult=!!root.querySelector('#sg-result .calc-result');
    root.innerHTML = '';

    // Page header
    root.appendChild(el('h2', {
      style: 'color:#1e3c72;margin-bottom:8px',
      text: t('PHA 스트로 압출 가이드', 'PHA Straw Extrusion Guide'),
    }));
    root.appendChild(el('figure',{className:'guide-equipment',html:`<div class="equipment-motion" data-equipment-model="straw"></div><figcaption>${t('Straw Optimizer V2의 Blender 원본을 활용한 조작 모델입니다. 다이 → 두 수조 → 벨트 인취 → 회전 절단. 호박색 고리는 흐름 방향 표시이며 실제 속도·냉각·절단 품질 해석이 아닙니다.','Interactive model adapted from the Straw Optimizer V2 Blender scene. Die → two baths → belt haul-off → rotary cutting. Amber rings show direction, not actual speed, cooling or cut-quality simulation.')}</figcaption>`}));
    root.appendChild(el('p', {
      style: 'color:#6b7280;margin-bottom:0',
      text: t(
        '그레이드의 근거 조건을 확인하고, 측정값과 형상으로 시험 결과를 비교합니다.',
        'Check grade-specific source conditions and compare trial results using measurements and product shape.'
      ),
    }));

    // Sub-tab nav
    const tabDefs = [
      { label: t('ST-1: 생산속도 계산기', 'ST-1: Production Speed Calc') },
      { label: t('ST-2: CB0400A 원문 조건', 'ST-2: CB0400A source conditions') },
      { label: t('ST-3: 트러블슈팅', 'ST-3: Troubleshooting') },
      { label: t('ST-4: 운영자 체크포인트', 'ST-4: Operator Checkpoints') },
      { label: t('ST-5: 온도·형상 측정', 'ST-5: Die-exit Temperature') },
    ];

    const tabNav = el('div', { className: 'flash-tabs' });
    tabDefs.forEach((td, i) => {
      const btn = el('button', { className: 'flash-tab' + (i === 0 ? ' active' : ''), text: td.label });
      btn.addEventListener('click', () => showStrawTab(root, i));
      tabNav.appendChild(btn);
    });
    root.appendChild(tabNav);

    // Panes
    root.appendChild(buildST1());
    root.appendChild(buildST2());
    root.appendChild(buildST3());
    root.appendChild(buildST4());
    root.appendChild(buildST5());
    Object.entries(entered).forEach(([id,value])=>{if(document.getElementById(id))document.getElementById(id).value=value;});
    if(priorTab>=0)showStrawTab(root,priorTab);
    if(hadResult)root.querySelector('#sg-calc').click();
    window.PHAEquipmentMotion?.syncSurface();
  }

  // Expose to global scope
  window.initStrawGuide = initStrawGuide;

})();
