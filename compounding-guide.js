/**
 * compounding-guide.js
 * PHA Compounding Guide – 4 sub-tabs rendered inside #compGuideContainer
 *
 * Entry point: initCompoundingGuide()
 * Dependencies: global LANG ('ko'|'en'), existing CSS classes from index.html
 * Storage: localStorage keys 'comp_doe_checklist', 'comp_trial_log'
 */

/* ─────────────────────────────────────────────────────────────────────────
   CONSTANTS / DATA
───────────────────────────────────────────────────────────────────────── */

const CG_SCREW_TYPES = {
  A: {
    label: 'Type A',
    reason_ko: '상류 공급·용융·혼합의 개념 배치',
    reason_en: 'Conceptual upstream feeding, melting and mixing',
    zones: [
      { name_ko: 'Feed',              name_en: 'Feed',              temp: null  },
      { name_ko: 'Melting',           name_en: 'Melting',           temp: null },
      { name_ko: 'Mixing',            name_en: 'Mixing',            temp: null },
      { name_ko: 'Melt-conveying',    name_en: 'Melt-conveying',    temp: null },
      { name_ko: 'Devolatilization',  name_en: 'Devolatilization',  temp: null },
      { name_ko: 'Die',               name_en: 'Die',               temp: null },
    ]
  },
  B: {
    label: 'Type B',
    reason_ko: '분리 공급의 효과를 시험할 때 비교할 개념 배치',
    reason_en: 'Conceptual layout for testing the effect of split feeding',
    zones: [
      { name_ko: 'Main-feed',          name_en: 'Main-feed',          temp: null  },
      { name_ko: 'Melting',            name_en: 'Melting',            temp: null },
      { name_ko: 'Pre-mix',            name_en: 'Pre-mix',            temp: null },
      { name_ko: 'Side-feed',          name_en: 'Side-feed',          temp: null  },
      { name_ko: 'Distributive-mix',   name_en: 'Distributive-mix',   temp: null },
      { name_ko: 'Melt-conveying',     name_en: 'Melt-conveying',     temp: null },
      { name_ko: 'Devolatilization',   name_en: 'Devolatilization',   temp: null },
      { name_ko: 'Die',                name_en: 'Die',                temp: null },
    ]
  },
  C: {
    label: 'Type C',
    reason_ko: '추가 공급·탈가스 위치를 비교할 개념 배치',
    reason_en: 'Conceptual layout for comparing additional feed and vent positions',
    zones: [
      { name_ko: 'Main-feed',                  name_en: 'Main-feed',                  temp: null  },
      { name_ko: 'Melting',                    name_en: 'Melting',                    temp: null },
      { name_ko: 'Pre-mix',                    name_en: 'Pre-mix',                    temp: null },
      { name_ko: 'Side-feed-1',                name_en: 'Side-feed-1',                temp: null  },
      { name_ko: 'Kneading',                   name_en: 'Kneading',                   temp: null },
      { name_ko: 'Side-feed-2/Vent',           name_en: 'Side-feed-2/Vent',           temp: null  },
      { name_ko: 'Melt-conveying',             name_en: 'Melt-conveying',             temp: null },
      { name_ko: 'Vacuum-devolatilization',    name_en: 'Vacuum-devolatilization',    temp: null },
      { name_ko: 'Die',                        name_en: 'Die',                        temp: null },
    ]
  }
};

const CG_DOE_STEPS = [
  {
    step: 0,
    title_ko: 'Step 0: 준비',
    title_en: 'Step 0: Preparation',
    items_ko: ['조성 분류(H/S/F/R)', '연속상 가설·확인 방법 기록', '건조 분리 확인', '수분 ppm 확인', '스크류 타입 결정', '장비 점검'],
    items_en: ['Classify composition (H/S/F/R)', 'Record matrix hypothesis and verification method', 'Confirm separate drying', 'Check moisture ppm', 'Determine screw type', 'Equipment inspection'],
  },
  {
    step: 1,
    title_ko: 'Step 1: 1차 DOE',
    title_en: 'Step 1: 1st DOE',
    items_ko: ['screw 구성을 먼저 고정', 'feed order만 변수화', 'temp gradient 설정', '체류 시간 기준으로 throughput 결정', '0-position 확인', 'torque 모니터링 시작', '초기 샘플 채취'],
    items_en: ['Fix the screw layout first', 'Vary only feed order', 'Set the temperature gradient', 'Determine throughput from residence-time target', 'Confirm 0-position', 'Start torque monitoring', 'Collect the first samples'],
  },
  {
    step: 2,
    title_ko: 'Step 2: 2차 미용융 대응',
    title_en: 'Step 2: 2nd – Unmelted Countermeasures',
    items_ko: ['미용융 여부 확인', 'melting zone의 KB (혼합 블록) 조정', 'barrel peak 미세 조정', '재샘플링'],
    items_en: ['Check for unmelted resin', 'Adjust the melting-zone KB', 'Fine-tune the barrel peak', 'Re-sample'],
  },
  {
    step: 3,
    title_ko: 'Step 3: 3차 분산 개선',
    title_en: 'Step 3: 3rd – Dispersion Improvement',
    items_ko: ['Mw 안정 확인', 'KB90 추가 여부 검토', '분산 개선 확인'],
    items_en: ['Confirm Mw stability', 'Review whether KB90 is needed', 'Confirm dispersion improvement'],
  },
  {
    step: 4,
    title_ko: 'Step 4: 4차 Chemistry',
    title_en: 'Step 4: 4th – Chemistry',
    items_ko: ['Morphology 확인', 'Compatibilizer 필요성·적용 요건 검토', 'Chain extender 검토'],
    items_en: ['Confirm morphology', 'Review compatibilizer need and application requirements', 'Review chain extender'],
  },
  {
    step: 5,
    title_ko: 'Step 5: 시험 기록',
    title_en: 'Step 5: Test Records',
    items_ko: ['DSC 측정', 'MFR 측정', 'GPC 측정', 'SEM 관찰', '배합 wt%/vol% 기록', '사진 촬영', '결과 종합 기록'],
    items_en: ['DSC measurement', 'MFR measurement', 'GPC measurement', 'SEM observation', 'Record blend wt%/vol%', 'Photography', 'Compile comprehensive record'],
  },
];

const CG_REF_SECTIONS = [["재료 분류와 연속상","Material groups and continuous phase","H/S/F는 입력을 정리하는 분류입니다. 중량비로 연속상을 선언하지 마세요. 혼합물의 점도비·계면·혼합 이력과 현미경 관찰 등으로 형태를 확인합니다.","H/S/F organizes material inputs. Weight fractions do not establish the continuous phase. Check viscosity ratio, interfaces, mixing history and morphology measurements."],["건조와 수분 측정","Drying and water measurement","별도 원료인 S1000P와 A1000P는 건조 온도 범위가 다릅니다. 이미 혼련된 컴파운드는 그 컴파운드의 지침을 따릅니다. 건조공기 이슬점은 펠릿 수분량의 대체 측정값이 아닙니다.","Separate S1000P and A1000P feedstocks have different drying temperature limits. For pre-compounded pellets, use that compound’s instructions. Drying-air dew point is not a substitute for pellet water measurement."],["공급·벤트·용융 씰","Feeding, venting and melt seals","사이드 피드·벤트는 포트 역할이며 배럴 설정온도가 아닙니다. 진공 벤트 전 용융 씰과 벤트의 충만도를 장비·스크류 도면에서 확인하세요. 이송 엘리먼트를 길게 하는 것만으로 씰 형성을 보장하지 않습니다.","Side feeders and vents describe port functions, not barrel setpoints. Check the upstream melt seal and vent fill level against the equipment/screw drawing. Longer conveying elements alone do not establish a melt seal."],["토크·압력·열 이력","Torque, pressure and thermal history","토크·압력 감소만으로 분자량 감소를 확정하지 않습니다. 공급량·충만도·측정 용융온도·체류 이력을 확인하고 같은 조건에서 MFR 또는 점도 추이를 비교합니다. RPM과 토출량은 각각 시험하며 무조건 한쪽을 올리는 규칙은 없습니다.","Torque or pressure reduction alone does not prove molecular-weight loss. Check feeding, fill level, measured melt temperature and residence history; compare MFR or viscosity trends under consistent conditions. Trial RPM and output separately; neither has a universal adjustment direction."],["필러·반응성 첨가제","Fillers and reactive additives","표면 처리·흡착 수분·입도·열/화학 안정성·투입량과 최종 용도를 함께 평가합니다. OH기 존재만으로 적합성을 서열화하지 않습니다. 상용화제·사슬연장제는 반응과 잔류물·물성·적용 요건을 확인한 별도 배합 시험으로 검토합니다.","Evaluate surface treatment, adsorbed water, particle size, thermal/chemical stability, loading and final use together. OH groups alone do not rank compatibility. Evaluate compatibilizers/chain extenders through separate formulation trials covering reaction, residues, properties and use requirements."],["퍼지와 작업 전환","Purging and transitions","이전 수지와 다음 그레이드, 장비·퍼지제의 온도 범위에 맞는 절차를 확인합니다. CA1180P의 PET/PA/HDPE 후 전환은 단계적 절차이고, CB0400A는 적합 퍼지제 우선·LDPE 대안을 제시합니다. PLA·PETG·HDPE를 범용 퍼지 수지로 지정하지 않습니다.","Match the procedure to previous and next resins, equipment and purge-material temperature limits. CA1180P specifies staged transitions after PET/PA/HDPE; CB0400A prefers a suitable purge compound with LDPE as a fallback. PLA, PETG and HDPE are not universal purge recommendations."]].map((r,i)=>({id:'R-'+(i+1),title_ko:r[0],title_en:r[1],render:ko=>'<p>'+r[ko?2:3]+'</p>'+(i===1?Object.entries(PHAEvidence.GRADES).map(([grade,g])=>'<p><a target="_blank" rel="noopener noreferrer" href="'+g.source+'">'+grade+' TDS</a>: '+g.drying.temperature+' × '+g.drying.hours+'</p>').join(''):'')}));

/** Stored checklist keys and trial rows remain compatible with previous versions. */
let cgDoeChecklist = [];

/** @type {Array<Object>} */
let cgTrialLog = [];

/* ─────────────────────────────────────────────────────────────────────────
   ENTRY POINT
───────────────────────────────────────────────────────────────────────── */

function initCompoundingGuide() {
  const container = document.getElementById('compGuideContainer');
  if (!container) return;

  const entered=Object.fromEntries([...container.querySelectorAll('.cg-comp-input')].map(i=>[i.id,i.value]));
  const previousLayout=container.querySelector('#cg-layout')?.value;
  const previousTab=[...container.querySelectorAll('#cgSubTabs .flash-tab')].findIndex(b=>b.classList.contains('active'));
  _cgLoadStorage();

  const ko = (typeof LANG !== 'undefined' ? LANG : 'ko') === 'ko';

  container.innerHTML = `
    <h2 style="color:#1e3c72;margin-bottom:16px">
      🧪 ${ko ? 'PHA 컴파운딩 가이드' : 'PHA Compounding Guide'}
    </h2>
    <figure class="guide-equipment"><img src="assets/equipment/compounding.png?v=18" width="1280" height="640" alt="${ko?'두 스크류와 상류 공급·사이드 피드·벤트·다이·펠릿 절단을 보여주는 개념도':'Conceptual twin screws, upstream/side feeding, vent, die and pellet cutter'}"><figcaption>${ko?'공급 → 용융·혼합 → 탈가스 → 다이 → 펠릿. 포트 위치와 수지 흐름을 이해하기 위한 개념도이며 실제 스크류 도면·온도 해석이 아닙니다.':'Feed → melt/mix → vent → die → pellets. Conceptual port locations and polymer path; not an OEM screw drawing or thermal simulation.'}</figcaption></figure>
    <p style="color:#6b7280;line-height:1.7;margin:0 0 16px">
      ${ko
        ? '이 가이드는 PHA · PHA 블렌드 컴파운딩에서 현장 엔지니어가 가장 자주 보는 4가지만 묶었습니다: 스크류 설계, 존 온도 프로파일, 탈가스, 퍼지 SOP.'
        : 'This guide covers the four items field compounders hit most often with PHA and PHA blends: screw design, zone-temperature profile, devolatilization, and purge SOP.'}
    </p>

    <p class="atlas-note">${ko ? '스크류 배치는 기능을 이해하기 위한 개념도입니다. 배합비만으로 연속상·분산·안정성을 확정하지 않습니다. 제조사 도면·TDS와 실제 용융온도·토크·제품을 대조하세요.' : 'Screw layouts illustrate functions. Composition alone does not establish morphology, dispersion or stability. Check manufacturer drawings/TDS against measured melt temperature, torque and product.'}</p>
    <div class="flash-tabs" id="cgSubTabs">
      <button class="flash-tab active" onclick="cgShowTab(0)">
        ST-1: ${ko ? '배합 확인·스크류 배치' : 'Composition / screw layout'}
      </button>
      <button class="flash-tab" onclick="cgShowTab(1)">
        ST-2: ${ko ? '트러블슈팅' : 'Troubleshooting'}
      </button>
      <button class="flash-tab" onclick="cgShowTab(2)">
        ST-3: ${ko ? 'DOE 체크리스트' : 'DOE Checklist'}
      </button>
      <button class="flash-tab" onclick="cgShowTab(3)">
        ST-4: ${ko ? '레퍼런스' : 'Reference'}
      </button>
    </div>

    <div class="flash-content active" id="cg-tab-0">${_cgBuildST1(ko)}</div>
    <div class="flash-content"        id="cg-tab-1">${_cgBuildST2(ko)}</div>
    <div class="flash-content"        id="cg-tab-2">${_cgBuildST3(ko)}</div>
    <div class="flash-content"        id="cg-tab-3">${_cgBuildST4(ko)}</div>
  `;

  _cgBindGlossary(container, ko);
  Object.entries(entered).forEach(([id,value])=>{if(document.getElementById(id))document.getElementById(id).value=value;});
  if(previousLayout)document.getElementById('cg-layout').value=previousLayout;
  _cgInitST1Events();
  if(previousTab>=0)cgShowTab(previousTab);
  _cgRenderDoeChecklist();
  _cgRenderTrialLog();
}

function _cgBindGlossary(root, ko) {
  const lang = ko ? 'ko' : 'en';
  if (!root) return;
  if (typeof window.glossFirstInRoot === 'function') window.glossFirstInRoot(root, lang);
  if (typeof window.glossAttach === 'function') {
    root.querySelectorAll('[data-cg-gloss]').forEach(node => {
      window.glossAttach(node, node.dataset.cgGloss, lang);
    });
  }
}

function _cgBuildScrewGlossary(ko) {
  const lang = ko ? 'ko' : 'en';
  const rows = [
    { key: 'ce', code: 'CE', desc_ko: '이송·충만도에 관여; 피치·운전 조건 확인', desc_en: 'Conveying/fill depend on pitch and operation' },
    { key: 'kb90', code: 'KB90', desc_ko: '중립 니딩 · 혼합/발열은 구성 의존', desc_en: 'Neutral kneading; mixing/heat depend on configuration' },
    { key: 'kb45', code: 'KB45', desc_ko: '45° 니딩; 폭·방향·조합·운전 조건에 따라 응답 변화', desc_en: '45° kneading; response depends on width, direction, layout and operation' },
    { key: 'kb30', code: 'KB30', desc_ko: '30° 니딩; 각도만으로 전단·분산을 확정하지 않음', desc_en: '30° kneading; angle alone does not establish shear/dispersion' },
    { key: 'le', code: 'LE', desc_ko: '역류 유도, 충전 밀도 상승', desc_en: 'Backflow for higher fill density' },
    { key: 'zme', code: 'ZME', desc_ko: '혼합용 · 제조사 도면 확인', desc_en: 'Mixing; verify manufacturer geometry' }
  ];
  const glossary = window.GLOSSARY_PHA || {};
  return `
    <div class="card" data-glossary-skip="true" style="margin:0 0 16px;border-left-color:#2C5D3F">
      <div style="font-weight:800;color:#2C5D3F;margin-bottom:6px">${ko ? '스크류 코드 용어표' : 'Screw-code glossary'}</div>
      <div style="color:#6b7280;line-height:1.65;margin-bottom:10px">
        ${ko
          ? '코드부터 읽고 시작하세요. 이후 본문에서 나오는 CE · KB · LE · ZME는 제조사별 코드·피치·방향을 도면으로 확인하세요.'
          : 'Start with the code chart. Later mentions of CE, KB, LE, and ZME require verification against the manufacturer code and geometry.'}
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr>
            <th>${ko ? '코드' : 'Code'}</th>
            <th>${ko ? '풀네임' : 'Long form'}</th>
            <th>${ko ? '현장 설명' : 'Field note'}</th>
          </tr></thead>
          <tbody>
            ${rows.map(row => {
              const entry = glossary[row.key];
              const label = entry ? entry.label[lang] : row.code;
              const desc = ko ? row.desc_ko : row.desc_en;
              return `<tr>
                <td><abbr data-cg-gloss="${row.key}">${row.code}</abbr></td>
                <td>${label}</td>
                <td>${desc}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────────────────
   TAB NAVIGATION
───────────────────────────────────────────────────────────────────────── */

function cgShowTab(index) {
  const tabs = document.querySelectorAll('#cgSubTabs .flash-tab');
  const contents = [
    document.getElementById('cg-tab-0'),
    document.getElementById('cg-tab-1'),
    document.getElementById('cg-tab-2'),
    document.getElementById('cg-tab-3'),
  ];
  tabs.forEach((t, i) => t.classList.toggle('active', i === index));
  contents.forEach((c, i) => { if (c) c.classList.toggle('active', i === index); });
}

/* ─────────────────────────────────────────────────────────────────────────
   ST-1: SCREW RECOMMENDER
───────────────────────────────────────────────────────────────────────── */

function _cgBuildST1(ko) {
  const lbl = (k, e) => ko ? k : e;
  return `
    <h3 style="color:#1e3c72;margin:16px 0 12px">${lbl('배합 확인·스크류 배치', 'Composition / screw layout')}</h3>
    <p style="color:#6b7280;line-height:1.7;margin:0 0 12px">
      ${ko
        ? '배합 합계를 확인하고 비교할 개념 배치를 선택하세요. 조성비만으로 스크류 구성·연속상·설정온도를 확정하지 않습니다.'
        : 'Check the composition total and select a conceptual layout for comparison. Fractions alone do not establish screw configuration, continuous phase or set temperatures.'}
    </p>
    ${_cgBuildScrewGlossary(ko)}

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:16px">

      <!-- Hard Phase -->
      <div class="card" style="border-left-color:#ef4444;margin:0">
        <div style="font-weight:800;color:#ef4444;margin-bottom:10px">H – ${lbl('고강성 재료군', 'Stiffer material group')}</div>
        ${['S1000P','P3HB','PLA'].map(n => `
          <div class="calc-input-group" style="margin-bottom:8px">
            <label>${n} (wt%)</label>
            <input type="number" min="0" max="100" step="0.1" value="0"
                   id="cg_h_${n.toLowerCase().replace(/[^a-z0-9]/g,'')}"
                   class="cg-comp-input" data-phase="hard" data-name="${n}"
                   oninput="cgUpdateComposition()">
          </div>`).join('')}
      </div>

      <!-- Soft Phase -->
      <div class="card" style="border-left-color:#3b82f6;margin:0">
        <div style="font-weight:800;color:#3b82f6;margin-bottom:10px">S – ${lbl('유연 재료군', 'Flexible material group')}</div>
        ${['A1000P','PBAT','PBS','PBSA'].map(n => `
          <div class="calc-input-group" style="margin-bottom:8px">
            <label>${n} (wt%)</label>
            <input type="number" min="0" max="100" step="0.1" value="0"
                   id="cg_s_${n.toLowerCase().replace(/[^a-z0-9]/g,'')}"
                   class="cg-comp-input" data-phase="soft" data-name="${n}"
                   oninput="cgUpdateComposition()">
          </div>`).join('')}
      </div>

      <!-- Filler -->
      <div class="card" style="border-left-color:#10b981;margin:0">
        <div style="font-weight:800;color:#10b981;margin-bottom:10px">F – ${lbl('Filler', 'Filler')}</div>
        ${['Talc','CaCO₃','Other Filler'].map(n => `
          <div class="calc-input-group" style="margin-bottom:8px">
            <label>${n} (wt%)</label>
            <input type="number" min="0" max="100" step="0.1" value="0"
                   id="cg_f_${n.toLowerCase().replace(/[^a-z0-9₃]/g,'').replace('₃','3')}"
                   class="cg-comp-input" data-phase="filler" data-name="${n}"
                   oninput="cgUpdateComposition()">
          </div>`).join('')}
      </div>
    </div>

    <!-- Sum bar -->
    <div style="background:#f3f4f6;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-weight:700">${lbl('합계', 'Total')}: <span id="cg_sum_val">0.0</span> wt%</span>
        <span id="cg_sum_badge"></span>
      </div>
      <div id="cg_hsf_bar" style="display:flex;height:14px;border-radius:6px;overflow:hidden;background:#e5e7eb">
        <div id="cg_bar_h" style="background:#ef4444;height:100%;width:0%;transition:.3s"></div>
        <div id="cg_bar_s" style="background:#3b82f6;height:100%;width:0%;transition:.3s"></div>
        <div id="cg_bar_f" style="background:#10b981;height:100%;width:0%;transition:.3s"></div>
      </div>
      <div style="display:flex;gap:16px;font-size:12px;margin-top:4px">
        <span><span style="color:#ef4444">■</span> H: <span id="cg_pct_h">0</span>%</span>
        <span><span style="color:#3b82f6">■</span> S: <span id="cg_pct_s">0</span>%</span>
        <span><span style="color:#10b981">■</span> F: <span id="cg_pct_f">0</span>%</span>
      </div>
    </div>

    <label for="cg-layout">${ko?'비교할 개념 배치':'Conceptual layout to compare'}</label><select id="cg-layout" onchange="cgUpdateComposition()"><option value="A">A · ${ko?'상류 공급':'Upstream feed'}</option><option value="B">B · ${ko?'분리 공급':'Split feed'}</option><option value="C">C · ${ko?'추가 공급·탈가스':'Additional feed / vent'}</option></select>
    <!-- Warnings -->
    <div id="cg_warnings"></div>

    <!-- Result card -->
    <div id="cg_result" style="display:none"></div>

    <!-- Zone table -->
    <div id="cg_zone_table" style="display:none;margin-top:16px"></div>
  `;
}

function _cgInitST1Events() {
  cgUpdateComposition();
}

function cgUpdateComposition() {
  const inputs = document.querySelectorAll('.cg-comp-input');
  if (!inputs.length) return;

  const ko = (typeof LANG !== 'undefined' ? LANG : 'ko') === 'ko';

  let hardTotal = 0, softTotal = 0, fillerTotal = 0;
  let a1000p = 0, s1000p = 0, p3hb = 0, talc = 0, otherFiller = 0;

  inputs.forEach(inp => {
    const val = inp.value==='' ? 0 : Number(inp.value);
    const phase = inp.dataset.phase;
    const name = inp.dataset.name;
    if (phase === 'hard')   { hardTotal   += val; if (name === 'S1000P') s1000p = val; if (name === 'P3HB') p3hb = val; }
    if (phase === 'soft')   { softTotal   += val; if (name === 'A1000P') a1000p = val; }
    if (phase === 'filler') { fillerTotal += val; if (name === 'Talc') talc = val; if (name === 'Other Filler') otherFiller = val; }
  });

  const total = hardTotal + softTotal + fillerTotal;
  const nonTalcFiller = fillerTotal - talc;

  // Sum display
  const sumEl = document.getElementById('cg_sum_val');
  const sumBadge = document.getElementById('cg_sum_badge');
  if (sumEl) sumEl.textContent = total.toFixed(1);
  if (sumBadge) {
    if (Math.abs(total - 100) < 0.5) {
      sumBadge.innerHTML = `<span class="badge ok">100%</span>`;
    } else if (total > 100) {
      sumBadge.innerHTML = `<span class="badge crit">${ko ? '초과' : 'Over'} ${total.toFixed(1)}%</span>`;
    } else {
      sumBadge.innerHTML = `<span class="badge warn">${total.toFixed(1)}%</span>`;
    }
  }

  const invalid=[...inputs].some(inp=>inp.value!==''&&(!Number.isFinite(Number(inp.value))||Number(inp.value)<0||Number(inp.value)>100));
  if(invalid || Math.abs(total-100)>0.05){
    sumEl.textContent=Number.isFinite(total)?total.toFixed(1):'—';
    sumBadge.textContent=ko?'입력 확인':'Check inputs';
    document.getElementById('cg_result').style.display='none';
    document.getElementById('cg_zone_table').style.display='none';
    document.getElementById('cg_warnings').textContent=ko?'각 성분을 0–100 wt%로 입력하고 합계를 100 wt%로 맞추세요.':'Enter each component in 0–100 wt% and make the total 100 wt%.';
    ['h','s','f'].forEach(k=>{document.getElementById('cg_bar_'+k).style.width='0%';document.getElementById('cg_pct_'+k).textContent='0';});
    return;
  }

  // H/S/F ratio bar
  if (total > 0) {
    const hPct = (hardTotal / total * 100).toFixed(1);
    const sPct = (softTotal / total * 100).toFixed(1);
    const fPct = (fillerTotal / total * 100).toFixed(1);
    const barH = document.getElementById('cg_bar_h');
    const barS = document.getElementById('cg_bar_s');
    const barF = document.getElementById('cg_bar_f');
    if (barH) barH.style.width = hPct + '%';
    if (barS) barS.style.width = sPct + '%';
    if (barF) barF.style.width = fPct + '%';
    const ph = document.getElementById('cg_pct_h');
    const ps = document.getElementById('cg_pct_s');
    const pf = document.getElementById('cg_pct_f');
    if (ph) ph.textContent = hPct;
    if (ps) ps.textContent = sPct;
    if (pf) pf.textContent = fPct;
  }

  const screwType=document.getElementById('cg-layout')?.value||'A';

  // Warnings
  const warnings = [];
  if (a1000p > 0 && s1000p > 0) {
    warnings.push(ko
      ? '별도 A1000P·S1000P 원료는 각 건조 지침을 따릅니다. 이미 혼련된 컴파운드는 해당 컴파운드 지침을 확인하세요.'
      : 'Separate A1000P/S1000P feedstocks follow their own drying instructions. For compounded pellets, use that compound’s guidance.');
  }
  if (p3hb > 0) {
    warnings.push(ko
      ? 'P3HB의 등급별 용융·열화 범위와 체류시간을 확인한 뒤 투입 위치를 시험하세요.'
      : 'For P3HB, review the grade’s melting/degradation response and residence time before testing a feed position.');
  }
  if (fillerTotal > 0) {
    warnings.push(ko
      ? '필러는 표면 처리·수분·입도·열/화학 안정성·최종 용도로 적합성을 확인하세요.'
      : 'Check filler surface treatment, moisture, particle size, thermal/chemical stability and final-use requirements.');
  }

  const warningsEl = document.getElementById('cg_warnings');
  if (warningsEl) {
    warningsEl.innerHTML = warnings.length
      ? warnings.map(w =>
          `<div class="card" style="border-left-color:#f59e0b;margin:4px 0;padding:10px 14px;font-size:13px">${w}</div>`
        ).join('')
      : '';
  }

  // Result card
  const typeData = CG_SCREW_TYPES[screwType];
  const resultEl = document.getElementById('cg_result');
  if (resultEl) {
    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="atlas-note" style="margin:12px 0">
        <h3>${ko ? '선택한 개념 배치' : 'Selected conceptual layout'}: <strong>${typeData.label}</strong></h3>
        <p style="margin-top:6px">→ ${ko ? typeData.reason_ko : typeData.reason_en}</p>
      </div>
    `;
  }

  // Zone table
  const zoneEl = document.getElementById('cg_zone_table');
  if (zoneEl) {
    zoneEl.style.display = 'block';
    zoneEl.innerHTML = `
      <h4 style="color:#1e3c72;margin-bottom:8px">${ko ? '존 구성표' : 'Zone Configuration'} – ${typeData.label}</h4>
      <div class="tablewrap">
        <table>
          <thead><tr>
            <th>#</th>
            <th>${ko ? '존 이름' : 'Zone Name'}</th>
            <th>${ko ? '온도 근거' : 'Temperature basis'}</th>
            <th>${ko ? '확인 사항' : 'Check'}</th>
          </tr></thead>
          <tbody>
            ${typeData.zones.map((z, i) => {
              const name = ko ? z.name_ko : z.name_en;
              const bar = ko ? '장비 도면·그레이드 TDS 대응 확인' : 'Map equipment drawing to grade TDS';
              return `<tr>
                <td>${i + 1}</td>
                <td>${name}</td>
                <td>${ko?'미확인':'Not established'}</td>
                <td style="width:160px">${bar}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

/**
 * Returns a CSS-only colored bar for temperature visualization.
 * Red/orange ≥160°C, blue ≤150°C, gray for 25°C (room temp).
 */
function _cgBuildST2(ko) {
  const data=window.PHA_TROUBLESHOOTING_DATA||window.tsData||[];
  const selected=data.filter(d=>['compounding','extrusion'].includes(d.process));
  return '<h3>'+(ko?'원인 후보와 조건부 조치':'Possible causes and conditional actions')+'</h3>'+selected.map(d=>'<details class="card"><summary>'+_cgEsc(ko?d.symptom_ko:d.symptom)+'</summary><p>'+_cgEsc(ko?d.diagnostics_ko:d.diagnostics)+'</p><ul>'+(ko?d.quick_fixes_ko:d.quick_fixes).map(s=>'<li>'+_cgEsc(s)+'</li>').join('')+'</ul><p>'+_cgEsc((ko?d.root_fixes_ko:d.root_fixes).join(' '))+'</p><p class="atlas-note"><strong>'+(ko?'복귀·중단: ':'Revert / stop: ')+'</strong>'+_cgEsc(ko?d.stop_conditions_ko:d.stop_conditions)+'</p></details>').join('');
}

function cgToggleSym(id) {
  const body  = document.getElementById(`cg_sym_body_${id}`);
  const arrow = document.getElementById(`cg_sym_arrow_${id}`);
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display  = open ? 'none' : 'block';
  if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)';
}

/* ─────────────────────────────────────────────────────────────────────────
   ST-3: DOE CHECKLIST + TRIAL LOG
───────────────────────────────────────────────────────────────────────── */

function _cgBuildST3(ko) {
  const stepsHtml = CG_DOE_STEPS.map(step => {
    const title = ko ? step.title_ko : step.title_en;
    const items = ko ? step.items_ko : step.items_en;
    const itemsHtml = items.map((item, idx) => {
      const key = _cgCheckKey(step.step,idx);
      return `
        <div class="checklist-item" id="cg_chk_wrap_${key}" onclick="cgToggleCheck('${key}')">
          <input type="checkbox" class="checklist-checkbox" id="cg_chk_${key}"
                 onclick="event.stopPropagation();cgToggleCheck('${key}')">
          <span class="checklist-text">${item}</span>
        </div>`;
    }).join('');

    return `
      <div class="card" style="margin:8px 0">
        <div style="font-weight:700;color:#1e3c72;margin-bottom:8px">${title}</div>
        <div class="checklist">${itemsHtml}</div>
      </div>`;
  }).join('');

  const logCols = ko
    ? ['일시','연속상 수지','Feed order','Barrel peak(°C)','RPM','Throughput(kg/h)','Torque(%)','Die pressure(bar)','Pellet 외관','비고']
    : ['Date/Time','Matrix Resin','Feed Order','Barrel Peak(°C)','RPM','Throughput(kg/h)','Torque(%)','Die Pressure(bar)','Pellet Appearance','Notes'];

  return `
    <h3 style="color:#1e3c72;margin:16px 0 8px">${ko ? 'DOE 체크리스트' : 'DOE Checklist'}</h3>

    <div style="background:#f3f4f6;border-radius:8px;padding:12px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:13px;font-weight:700">${ko ? '전체 진행률' : 'Overall Progress'}: <span id="cg_doe_pct">0</span>%</span>
        <button class="btn secondary" style="padding:6px 12px;font-size:12px" onclick="cgResetDoe()">
          ${ko ? '초기화' : 'Reset'}
        </button>
      </div>
      <div style="background:#e5e7eb;border-radius:999px;height:10px;overflow:hidden">
        <div id="cg_doe_bar" style="background:var(--secondary);height:100%;width:0%;border-radius:999px;transition:.4s"></div>
      </div>
    </div>

    ${cgDoeChecklist.some(k=>['s0_1','s4_1'].includes(k))?`<details><summary>${ko?'이전 체크 기록':'Earlier checklist records'}</summary><p>${ko?'의미가 바뀐 연속상·상용화제 검토 항목은 다시 확인합니다. 기존 체크 기록은 보존했습니다.':'Recheck the revised matrix/compatibilizer review items. Earlier check records are retained.'}</p><ul>${cgDoeChecklist.includes('s0_1')?'<li>'+(ko?'연속상 선언: 이전 체크됨':'Declare matrix: previously checked')+'</li>':''}${cgDoeChecklist.includes('s4_1')?'<li>'+(ko?'상용화제 도입: 이전 체크됨':'Introduce compatibilizer: previously checked')+'</li>':''}</ul></details>`:''}
    <div id="cg_doe_steps">${stepsHtml}</div>

    <h3 style="color:#1e3c72;margin:24px 0 8px">${ko ? '시험 로그' : 'Trial Log'}</h3>

    <div class="log-container">
      <div class="log-header">
        <h4 style="color:#1e3c72;margin:0">${ko ? '컴파운딩 시험 기록' : 'Compounding Trial Log'}</h4>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn-log-action btn-add-log"    onclick="cgAddTrialRow()">➕ ${ko ? '추가' : 'Add'}</button>
          <button class="btn-log-action btn-export-log" onclick="cgExportTrialLog()">📥 ${ko ? 'CSV' : 'CSV'}</button>
          <button class="btn-log-action btn-clear-log"  onclick="cgClearTrialLog()">🗑️ ${ko ? '전체 삭제' : 'Clear'}</button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="log-table" id="cg_trial_table">
          <thead>
            <tr>${logCols.map(c => `<th style="min-width:110px;white-space:nowrap">${c}</th>`).join('')}<th style="min-width:70px">${ko ? '삭제' : 'Del'}</th></tr>
          </thead>
          <tbody id="cg_trial_body"></tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── DOE Checklist helpers ── */

function _cgLoadStorage() {
  try {
    const raw = localStorage.getItem('comp_doe_checklist');
    const parsed=raw?JSON.parse(raw):[];cgDoeChecklist=Array.isArray(parsed)?parsed:[];
  } catch (_) { cgDoeChecklist = []; }

  try {
    const raw = localStorage.getItem('comp_trial_log');
    cgTrialLog = raw ? JSON.parse(raw) : [];
  } catch (_) { cgTrialLog = []; }
}

function _cgSaveDoe() {
  try { localStorage.setItem('comp_doe_checklist', JSON.stringify(cgDoeChecklist)); } catch (_) {}
}

function _cgSaveTrialLog() {
  try { localStorage.setItem('comp_trial_log', JSON.stringify(cgTrialLog)); } catch (_) {}
}

function _cgCheckKey(step,index){return step===0&&index===1?'matrix-review-v2':step===4&&index===1?'compatibility-review-v2':`s${step}_${index}`;}

function _cgAllCheckKeys() {
  const keys = [];
  CG_DOE_STEPS.forEach(step => {
    const items = step.items_ko;
    items.forEach((_, idx) => keys.push(_cgCheckKey(step.step,idx)));
  });
  return keys;
}

function _cgRenderDoeChecklist() {
  const allKeys = _cgAllCheckKeys();
  let checkedCount = 0;
  allKeys.forEach(key => {
    const checked = cgDoeChecklist.includes(key);
    const wrap  = document.getElementById(`cg_chk_wrap_${key}`);
    const input = document.getElementById(`cg_chk_${key}`);
    if (wrap) wrap.classList.toggle('checked', checked);
    if (input) input.checked = checked;
    if (checked) checkedCount++;
  });
  const pct = allKeys.length ? Math.round(checkedCount / allKeys.length * 100) : 0;
  const pctEl = document.getElementById('cg_doe_pct');
  const barEl = document.getElementById('cg_doe_bar');
  if (pctEl) pctEl.textContent = pct;
  if (barEl) barEl.style.width = pct + '%';
}

function cgToggleCheck(key) {
  const idx = cgDoeChecklist.indexOf(key);
  if (idx === -1) {
    cgDoeChecklist.push(key);
  } else {
    cgDoeChecklist.splice(idx, 1);
  }
  _cgSaveDoe();
  _cgRenderDoeChecklist();
}

function cgResetDoe() {
  const ko = (typeof LANG !== 'undefined' ? LANG : 'ko') === 'ko';
  if (!confirm(ko ? '체크리스트를 초기화할까요?' : 'Reset the DOE checklist?')) return;
  cgDoeChecklist = [];
  _cgSaveDoe();
  _cgRenderDoeChecklist();
}

/* ── Trial Log helpers ── */

function _cgRenderTrialLog() {
  const tbody = document.getElementById('cg_trial_body');
  if (!tbody) return;

  const ko = (typeof LANG !== 'undefined' ? LANG : 'ko') === 'ko';

  if (!cgTrialLog.length) {
    tbody.innerHTML = `<tr><td colspan="11" class="log-empty">${ko ? '기록이 없습니다. "➕ 추가" 버튼을 눌러 시작하세요.' : 'No records. Click "➕ Add" to start.'}</td></tr>`;
    return;
  }

  const fields = ['matrixResin','feedOrder','barrelPeak','rpm','throughput','torque','diePressure','pelletAppearance','notes'];

  tbody.innerHTML = cgTrialLog.map((row, i) => {
    const cells = fields.map(f => `
      <td>
        <input type="${['barrelPeak','rpm','throughput','torque','diePressure'].includes(f) ? 'number' : 'text'}"
               value="${_cgEsc(row[f] !== undefined ? String(row[f]) : '')}"
               style="width:100%;padding:6px;border:2px solid #ced4da;border-radius:4px;font-size:13px;color:#212529;background:#fff;min-width:90px"
               oninput="cgUpdateTrialField(${i},'${f}',this.value)"
               placeholder="${f}">
      </td>`).join('');

    return `<tr>
      <td style="white-space:nowrap;font-size:12px;color:#6b7280">${_cgEsc(row.timestamp)}</td>
      ${cells}
      <td><button class="btn-delete-log" onclick="cgDeleteTrialRow(${i})">🗑️</button></td>
    </tr>`;
  }).join('');
}

function cgAddTrialRow() {
  const now = new Date().toLocaleString(
    (typeof LANG !== 'undefined' && LANG === 'en') ? 'en-US' : 'ko-KR',
    { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12: false }
  );
  cgTrialLog.unshift({
    timestamp: now,
    matrixResin: '', feedOrder: '', barrelPeak: '', rpm: '', throughput: '',
    torque: '', diePressure: '', pelletAppearance: '', notes: ''
  });
  _cgSaveTrialLog();
  _cgRenderTrialLog();
}

function cgUpdateTrialField(index, field, value) {
  if (!cgTrialLog[index]) return;
  cgTrialLog[index][field] = value;
  _cgSaveTrialLog();
}

function cgDeleteTrialRow(index) {
  cgTrialLog.splice(index, 1);
  _cgSaveTrialLog();
  _cgRenderTrialLog();
}

function cgClearTrialLog() {
  const ko = (typeof LANG !== 'undefined' ? LANG : 'ko') === 'ko';
  if (!confirm(ko ? '시험 로그를 모두 삭제할까요?' : 'Delete all trial log entries?')) return;
  cgTrialLog = [];
  _cgSaveTrialLog();
  _cgRenderTrialLog();
}

function cgExportTrialLog() {
  const ko = (typeof LANG !== 'undefined' ? LANG : 'ko') === 'ko';
  const headers = ko
    ? ['일시','연속상 수지','Feed order','Barrel peak(°C)','RPM','Throughput(kg/h)','Torque(%)','Die pressure(bar)','Pellet 외관','비고']
    : ['Date/Time','Matrix Resin','Feed Order','Barrel Peak(°C)','RPM','Throughput(kg/h)','Torque(%)','Die Pressure(bar)','Pellet Appearance','Notes'];
  const fields = ['timestamp','matrixResin','feedOrder','barrelPeak','rpm','throughput','torque','diePressure','pelletAppearance','notes'];

  const rows = [headers.join(',')].concat(
    cgTrialLog.map(row =>
      fields.map(f => `"${String(row[f] !== undefined ? row[f] : '').replace(/"/g, '""')}"`).join(',')
    )
  );

  const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `compounding_trial_log_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────────────────────
   ST-4: REFERENCE (ACCORDION)
───────────────────────────────────────────────────────────────────────── */

function _cgBuildST4(ko) {
  const sections = CG_REF_SECTIONS.map(sec => {
    const title = ko ? sec.title_ko : sec.title_en;
    const body  = sec.render(ko);
    return `
      <div class="card" style="margin:8px 0">
        <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer"
             onclick="cgToggleRef('${sec.id}')">
          <strong style="font-size:14px">${title}</strong>
          <span id="cg_ref_arrow_${sec.id}" style="font-size:18px;transition:.2s">▼</span>
        </div>
        <div id="cg_ref_body_${sec.id}" style="display:none;margin-top:8px">
          ${body}
        </div>
      </div>`;
  }).join('');

  return `
    <h3 style="color:#1e3c72;margin:16px 0 12px">${ko ? '레퍼런스' : 'Reference'}</h3>
    ${sections}
  `;
}

function cgToggleRef(id) {
  const body  = document.getElementById(`cg_ref_body_${id}`);
  const arrow = document.getElementById(`cg_ref_arrow_${id}`);
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display  = open ? 'none' : 'block';
  if (arrow) arrow.style.transform = open ? '' : 'rotate(180deg)';
}

/* ─────────────────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────────────────── */

function _cgEsc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Expose globally for cross-module use
if (typeof window !== 'undefined') window._cgEsc = _cgEsc;
