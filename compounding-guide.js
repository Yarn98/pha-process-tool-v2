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
    label: 'Type A (40D)',
    reason_ko: 'hard phase 중심 조성이라 표준 혼합만으로 충분',
    reason_en: 'Hard-dominant recipe; standard mixing is enough',
    zones: [
      { name_ko: 'Feed',              name_en: 'Feed',              temp: 25  },
      { name_ko: 'Melting',           name_en: 'Melting',           temp: 160 },
      { name_ko: 'Mixing',            name_en: 'Mixing',            temp: 155 },
      { name_ko: 'Melt-conveying',    name_en: 'Melt-conveying',    temp: 155 },
      { name_ko: 'Devolatilization',  name_en: 'Devolatilization',  temp: 150 },
      { name_ko: 'Die',               name_en: 'Die',               temp: 155 },
    ]
  },
  B: {
    label: 'Type B (44D)',
    reason_ko: 'soft phase를 나눠 넣어 전단과 분산을 같이 잡아야 함',
    reason_en: 'Soft phase should be split-fed to balance shear and dispersion',
    zones: [
      { name_ko: 'Main-feed',          name_en: 'Main-feed',          temp: 25  },
      { name_ko: 'Melting',            name_en: 'Melting',            temp: 160 },
      { name_ko: 'Pre-mix',            name_en: 'Pre-mix',            temp: 155 },
      { name_ko: 'Side-feed',          name_en: 'Side-feed',          temp: 25  },
      { name_ko: 'Distributive-mix',   name_en: 'Distributive-mix',   temp: 150 },
      { name_ko: 'Melt-conveying',     name_en: 'Melt-conveying',     temp: 150 },
      { name_ko: 'Devolatilization',   name_en: 'Devolatilization',   temp: 145 },
      { name_ko: 'Die',                name_en: 'Die',                temp: 150 },
    ]
  },
  C: {
    label: 'Type C (44-48D)',
    reason_ko: 'filler-rich 조성이라 side feed와 이중 탈가스가 필요',
    reason_en: 'Filler-rich recipe needing side feed and dual devolatilization',
    zones: [
      { name_ko: 'Main-feed',                  name_en: 'Main-feed',                  temp: 25  },
      { name_ko: 'Melting',                    name_en: 'Melting',                    temp: 165 },
      { name_ko: 'Pre-mix',                    name_en: 'Pre-mix',                    temp: 160 },
      { name_ko: 'Side-feed-1',                name_en: 'Side-feed-1',                temp: 25  },
      { name_ko: 'Kneading',                   name_en: 'Kneading',                   temp: 155 },
      { name_ko: 'Side-feed-2/Vent',           name_en: 'Side-feed-2/Vent',           temp: 25  },
      { name_ko: 'Melt-conveying',             name_en: 'Melt-conveying',             temp: 150 },
      { name_ko: 'Vacuum-devolatilization',    name_en: 'Vacuum-devolatilization',    temp: 145 },
      { name_ko: 'Die',                        name_en: 'Die',                        temp: 150 },
    ]
  }
};

const CG_TROUBLESHOOTING = [
  {
    id: 'SYM-1',
    icon: '🔴',
    title_ko: '분산 불량 (Poor dispersion)',
    title_en: 'Poor Dispersion',
    causes: [
      { cond_ko: 'soft phase 큰 도메인',    cond_en: 'Large soft-phase domains',     cause_ko: '혼합 부족 또는 feed order가 맞지 않음',          cause_en: 'Insufficient mixing or the wrong feed order',   action_ko: 'side feed 위치를 다시 잡고 KB (혼합 블록) 구성을 보강',       action_en: 'Reposition the side feed and strengthen the KB layout' },
      { cond_ko: 'filler 뭉침',             cond_en: 'Filler agglomeration',         cause_ko: '투입 위치 또는 side feeder 속도가 맞지 않음',    cause_en: 'Feed position or side-feeder rate is off',      action_ko: 'side feeder 속도를 조정하고 feed 위치를 downstream으로 이동', action_en: 'Adjust side-feeder rate and move the feed position downstream' },
      { cond_ko: '2상 분리',                cond_en: 'Phase separation',             cause_ko: '상용성이 부족해 계면이 벌어짐',                  cause_en: 'Compatibility is too weak, so the interface opens up', action_ko: 'compatibilizer 도입 여부를 검토',                          action_en: 'Review whether a compatibilizer is needed' },
      { cond_ko: '겔 / fish-eye 발생',      cond_en: 'Gel / fish-eye formation',     cause_ko: '열분해 가교 또는 미용융 잔류물',                 cause_en: 'Thermal crosslinking or unmelted residue',      action_ko: '온도 프로파일을 다시 잡고 screen pack을 점검',                action_en: 'Retune the temperature profile and inspect the screen pack' },
    ]
  },
  {
    id: 'SYM-2',
    icon: '🟠',
    title_ko: '미용융 (Unmelted resin)',
    title_en: 'Unmelted Resin',
    causes: [
      { cond_ko: 'white speck 발생',        cond_en: 'White specks',                 cause_ko: 'melting zone 길이가 부족함',                    cause_en: 'The melting zone is too short',                 action_ko: 'barrel peak를 5 °C 올리고 melting zone의 KB 구성을 조정',    action_en: 'Raise the barrel peak by 5 °C and adjust the melting-zone KB layout' },
      { cond_ko: '고 Tm 수지 미용융',      cond_en: 'High-Tm resin remains unmelted', cause_ko: 'PLA / P3HB의 Tm이 높음',                       cause_en: 'PLA / P3HB brings a higher Tm',                 action_ko: '해당 zone barrel 온도를 Tm + 15 °C 수준으로 확보',           action_en: 'Hold the relevant barrel zone at about Tm + 15 °C' },
      { cond_ko: 'Filler 코팅 미분산',      cond_en: 'Filler coating not dispersed', cause_ko: 'Surface treatment 미흡',                         cause_en: 'Insufficient surface treatment',                action_ko: '프리믹싱 또는 MB화 후 투입',                                  action_en: 'Pre-mix or use masterbatch before feeding' },
      { cond_ko: '냉간 투입 후 미용융',     cond_en: 'Unmelted after cold feed',     cause_ko: 'side feed 직후 열이 부족함',                    cause_en: 'Insufficient heat immediately after the side feed', action_ko: 'side feed 다음 barrel zone 온도를 올림',                    action_en: 'Increase the barrel-zone temperature right after the side feed' },
    ]
  },
  {
    id: 'SYM-3',
    icon: '🔵',
    title_ko: 'MW 급락 (MW drop)',
    title_en: 'MW Drop',
    causes: [
      { cond_ko: 'die 압력 하강 + 색 변화', cond_en: 'Die pressure drop + color change', cause_ko: '열분해로 Mw가 빠르게 감소',                  cause_en: 'Thermal degradation is dropping Mw fast',       action_ko: 'barrel peak를 180 °C 아래로 낮추고 체류 시간을 줄임',         action_en: 'Lower the barrel peak below 180 °C and cut residence time' },
      { cond_ko: 'Torque 급락',             cond_en: 'Torque drop',                  cause_ko: '과도한 전단',                                   cause_en: 'Excessive shear',                               action_ko: 'RPM 하향, throughput 상향으로 fill ratio 증가',               action_en: 'Reduce RPM, increase throughput to raise fill ratio' },
      { cond_ko: '수분 기인 분해',          cond_en: 'Moisture-driven degradation',  cause_ko: '건조가 부족함',                                 cause_en: 'Drying is insufficient',                        action_ko: '수분을 500 ppm 이하로 확인하고 건조 조건을 재점검',           action_en: 'Confirm moisture is at or below 500 ppm and re-check the drying setup' },
      { cond_ko: 'filler 화학반응',         cond_en: 'Filler chemical reaction',     cause_ko: 'OH-rich filler가 PHA와 반응',                   cause_en: 'An OH-rich filler is reacting with the PHA',    action_ko: 'mixing zone을 10–15 °C 낮추고 filler 투입을 downstream으로 이동', action_en: 'Lower the mixing zone by 10–15 °C and move the filler addition downstream' },
      { cond_ko: '산화 분해',               cond_en: 'Oxidative degradation',        cause_ko: 'vent / die에서 산소 접촉이 큼',                 cause_en: 'Oxygen exposure is high at the vent / die',     action_ko: 'N₂ blanket를 적용하고 vent 진공도를 확인',                    action_en: 'Apply an N₂ blanket and check vent vacuum level' },
    ]
  },
  {
    id: 'SYM-4',
    icon: '🟡',
    title_ko: '다공성 pellet (Porous pellet)',
    title_en: 'Porous Pellet',
    causes: [
      { cond_ko: 'pellet 기포',             cond_en: 'Bubbles in pellets',           cause_ko: '탈가스가 부족함',                               cause_en: 'Devolatilization is insufficient',              action_ko: 'vacuum vent 진공도를 확인하고 vent port를 청소',              action_en: 'Check the vacuum-vent level and clean the vent port' },
      { cond_ko: 'vent spit',               cond_en: 'Vent spit',                    cause_ko: 'melt seal이 약함',                              cause_en: 'The melt seal is too weak',                     action_ko: 'vent 앞 conveying element 길이를 늘림',                       action_en: 'Increase conveying-element length before the vent' },
      { cond_ko: 'Strand 기포',             cond_en: 'Strand bubbles',               cause_ko: '수분 + 탈기 불량 복합',                         cause_en: 'Combined moisture and poor devolatilization',   action_ko: '건조 강화 + 탈기 구간 추가',                                  action_en: 'Enhance drying and add devolatilization section' },
    ]
  },
  {
    id: 'SYM-5',
    icon: '⚪',
    title_ko: 'Feeder 불안정 (Feed instability)',
    title_en: 'Feed Instability',
    causes: [
      { cond_ko: 'Pellet/powder 혼합 투입 시 분리', cond_en: 'Segregation of pellet/powder mix', cause_ko: '밀도차 segregation',                  cause_en: 'Density difference segregation',                action_ko: '별도 feeder 사용, premix 최소화',                             action_en: 'Use separate feeders, minimize premixing' },
      { cond_ko: 'Bridging/ratholing',       cond_en: 'Bridging/ratholing',           cause_ko: '분체 유동성 불량',                              cause_en: 'Poor powder flowability',                       action_ko: 'Agitator 사용, feed throat 냉각 확인',                        action_en: 'Use agitator, check feed throat cooling' },
    ]
  },
];

const CG_DOE_STEPS = [
  {
    step: 0,
    title_ko: 'Step 0: 준비',
    title_en: 'Step 0: Preparation',
    items_ko: ['조성 분류(H/S/F/R)', '연속상 수지 선언', '건조 분리 확인', '수분 ppm 확인', '스크류 타입 결정', '장비 점검'],
    items_en: ['Classify composition (H/S/F/R)', 'Declare matrix resin', 'Confirm separate drying', 'Check moisture ppm', 'Determine screw type', 'Equipment inspection'],
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
    items_ko: ['Morphology 확인', 'Compatibilizer 도입', 'Chain extender 검토'],
    items_en: ['Confirm morphology', 'Introduce compatibilizer', 'Review chain extender'],
  },
  {
    step: 5,
    title_ko: 'Step 5: 시험 기록',
    title_en: 'Step 5: Test Records',
    items_ko: ['DSC 측정', 'MFR 측정', 'GPC 측정', 'SEM 관찰', '배합 wt%/vol% 기록', '사진 촬영', '결과 종합 기록'],
    items_en: ['DSC measurement', 'MFR measurement', 'GPC measurement', 'SEM observation', 'Record blend wt%/vol%', 'Photography', 'Compile comprehensive record'],
  },
];

const CG_REF_SECTIONS = [
  {
    id: 'R-1',
    title_ko: 'R-1: 재료 분류 체계 (H/S/F/R형)',
    title_en: 'R-1: Material Classification (H/S/F/R)',
    render: (ko) => `
      <div class="tablewrap" style="margin-top:12px">
        <table>
          <thead><tr>
            <th>${ko ? '타입' : 'Type'}</th>
            <th>${ko ? '대표 예시' : 'Examples'}</th>
            <th>${ko ? '핵심 특성' : 'Key Characteristic'}</th>
          </tr></thead>
          <tbody>
            <tr><td><strong>H (Hard)</strong></td><td>S1000P (Tm~170°C), P3HB (Tm~175°C), PLA (Tm~168°C)</td><td>${ko ? '결정성 높음, 연속상 후보' : 'High crystallinity, matrix candidate'}</td></tr>
            <tr><td><strong>S (Soft)</strong></td><td>A1000P (Tg~-20°C), PBAT, PBS, PBSA</td><td>${ko ? '유연성 부여, 임팩트 개선' : 'Provides flexibility, improves impact'}</td></tr>
            <tr><td><strong>F (Filler)</strong></td><td>CaCO₃, Talc, ${ko ? '기타 mineral' : 'Other minerals'}</td><td>${ko ? '강성/원가/기능성' : 'Stiffness/cost/functionality'}</td></tr>
            <tr><td><strong>R (Reactive)</strong></td><td>${ko ? 'Chain extender, Compatibilizer, Peroxide' : 'Chain extender, Compatibilizer, Peroxide'}</td><td>${ko ? '소량 첨가, 반응 제어 필요' : 'Small additions, reaction control required'}</td></tr>
          </tbody>
        </table>
      </div>`
  },
  {
    id: 'R-2',
    title_ko: 'R-2: CJ Grade 가공 조건',
    title_en: 'R-2: CJ Grade Processing Conditions',
    render: (ko) => `
      <div class="tablewrap" style="margin-top:12px">
        <table>
          <thead><tr>
            <th>Grade</th><th>Tm(°C)</th>
            <th>${ko ? '건조' : 'Drying'}</th>
            <th>${ko ? '배럴 피크' : 'Barrel Peak'}</th>
            <th>${ko ? '특이사항' : 'Notes'}</th>
          </tr></thead>
          <tbody>
            <tr><td><strong>S1000P</strong></td><td>~170</td><td>60°C, 6h</td><td>165–170°C</td><td>${ko ? '표준 hard phase' : 'Standard hard phase'}</td></tr>
            <tr><td><strong>A1000P</strong></td><td>~100 (soft)</td><td>50°C, 4h</td><td>150–160°C</td><td>${ko ? '별도 건조 필수 (S1000P와 동시 건조 금지)' : 'Separate drying mandatory (no co-drying with S1000P)'}</td></tr>
          </tbody>
        </table>
      </div>`
  },
  {
    id: 'R-3',
    title_ko: 'R-3: 3종 타입 통합 비교표',
    title_en: 'R-3: Integrated Comparison of Three Types',
    render: (ko) => `
      <div class="tablewrap" style="margin-top:12px">
        <table>
          <thead><tr>
            <th>${ko ? '항목' : 'Item'}</th>
            <th>Type A (40D)</th><th>Type B (44D)</th><th>Type C (44-48D)</th>
          </tr></thead>
          <tbody>
            <tr><td><strong>L/D</strong></td><td>40</td><td>44</td><td>44–48</td></tr>
            <tr><td><strong>${ko ? '대상' : 'Target'}</strong></td><td>${ko ? 'Hard 위주, 유사 Tm' : 'Hard-dominant, similar Tm'}</td><td>${ko ? 'Soft ≥20%' : 'Soft ≥20%'}</td><td>${ko ? 'Filler ≥15%' : 'Filler ≥15%'}</td></tr>
            <tr><td><strong>Feed</strong></td><td>${ko ? 'Main only' : 'Main only'}</td><td>${ko ? 'Main + Side' : 'Main + Side'}</td><td>${ko ? 'Main + Side×2' : 'Main + Side×2'}</td></tr>
            <tr><td><strong>${ko ? '탈기' : 'Devolatilization'}</strong></td><td>${ko ? '1회' : '1×'}</td><td>${ko ? '1회' : '1×'}</td><td>${ko ? '2회 (대기+진공)' : '2× (ambient + vacuum)'}</td></tr>
            <tr><td><strong>${ko ? '핵심' : 'Key'}</strong></td><td>${ko ? 'Simple, fast' : 'Simple, fast'}</td><td>${ko ? 'Split feed' : 'Split feed'}</td><td>${ko ? '이중 탈기' : 'Dual devolatilization'}</td></tr>
          </tbody>
        </table>
      </div>`
  },
  {
    id: 'R-4',
    title_ko: 'R-4: Filler 우선순위',
    title_en: 'R-4: Filler Priority',
    render: (ko) => `
      <div class="tablewrap" style="margin-top:12px">
        <table>
          <thead><tr>
            <th>Filler</th>
            <th>${ko ? 'PHA 적합성' : 'PHA Suitability'}</th>
            <th>${ko ? '주의사항' : 'Caution'}</th>
          </tr></thead>
          <tbody>
            <tr><td><strong>CaCO₃</strong></td><td>★★★★★</td><td>${ko ? '가장 안정, 중성' : 'Most stable, neutral'}</td></tr>
            <tr><td><strong>Talc</strong></td><td>★★★★</td><td>${ko ? '핵제 효과, 낮은 OH' : 'Nucleating effect, low OH'}</td></tr>
            <tr><td><strong>BaSO₄</strong></td><td>★★★</td><td>${ko ? '무기능성, 고밀도' : 'No functionality, high density'}</td></tr>
            <tr><td><strong>TiO₂</strong></td><td>★★★</td><td>${ko ? '소량 OK, 광촉매 주의' : 'Small amount OK, watch photocatalytic activity'}</td></tr>
            <tr><td><strong>Mg(OH)₂</strong></td><td>★★</td><td>${ko ? 'OH-rich, 가수분해 촉진 우려' : 'OH-rich, risk of promoting hydrolysis'}</td></tr>
            <tr><td><strong>ATH</strong></td><td>★</td><td>${ko ? '200°C 이하 탈수, PHA 분해 촉진' : 'Dehydration below 200°C, promotes PHA degradation'}</td></tr>
          </tbody>
        </table>
      </div>`
  },
  {
    id: 'R-5',
    title_ko: 'R-5: Stop Signal 기준',
    title_en: 'R-5: Stop Signal Criteria',
    render: (ko) => `
      <div class="tablewrap" style="margin-top:12px">
        <table>
          <thead><tr>
            <th>Signal</th>
            <th>${ko ? '기준' : 'Threshold'}</th>
            <th>${ko ? '판정' : 'Action'}</th>
          </tr></thead>
          <tbody>
            <tr><td><strong>${ko ? 'Torque 급락' : 'Torque drop'}</strong></td><td>${ko ? '>15% 하락 (steady state 대비)' : '>15% drop (vs. steady state)'}</td><td>${ko ? 'MW 급락 의심 → 즉시 온도/RPM 조정' : 'Suspect MW drop → immediately adjust temp/RPM'}</td></tr>
            <tr><td><strong>${ko ? 'Die pressure 급락' : 'Die pressure drop'}</strong></td><td>${ko ? '>20% 하락' : '>20% drop'}</td><td>${ko ? 'MW 급락 확인 → 체류시간 감소 조치' : 'Confirm MW drop → reduce residence time'}</td></tr>
            <tr><td><strong>${ko ? '색 변화' : 'Color change'}</strong></td><td>${ko ? 'Yellow → Brown 진행' : 'Yellow → Brown progression'}</td><td>${ko ? '열분해 진행 → 즉시 온도 하향' : 'Thermal degradation → immediately lower temperature'}</td></tr>
            <tr><td><strong>${ko ? 'Strand 약화' : 'Strand weakening'}</strong></td><td>${ko ? '절단 빈도 증가' : 'Increased break frequency'}</td><td>${ko ? 'MW 저하 + 점도 감소 → 복합 조치' : 'MW reduction + viscosity drop → combined action'}</td></tr>
            <tr><td><strong>${ko ? 'Vent spit 연속' : 'Continuous vent spit'}</strong></td><td>${ko ? '3회 이상 연속' : '3+ consecutive occurrences'}</td><td>${ko ? 'Melt seal 불량 → 스크류 구성 재검토' : 'Poor melt seal → review screw configuration'}</td></tr>
          </tbody>
        </table>
      </div>`
  },
  {
    id: 'R-6',
    title_ko: 'R-6: 핵심 원칙 요약 (6대 원칙)',
    title_en: 'R-6: Core Principles Summary (6 Principles)',
    render: (ko) => {
      const principles = ko ? [
        ['180°C 벽', 'Barrel peak 180°C 이하 유지. PHA 열분해 최소화'],
        ['연속상 선언 우선', '어떤 수지가 matrix인지 먼저 선언'],
        ['Side feed 분리', '20wt% 이상 soft phase는 반드시 분리 투입'],
        ['Filler 적합성', 'OH-rich filler는 PHA 분해를 촉진. CaCO₃ 우선'],
        ['Die 압력 모니터링', 'Die 압력 하락 = MW 급락의 가장 빠른 지표'],
        ['체류시간 최소화', 'Throughput 증가 > RPM 증가. 전단 최소화'],
      ] : [
        ['180°C Wall', 'Maintain barrel peak below 180°C. Minimize PHA thermal degradation'],
        ['Declare Matrix First', 'Declare which resin is the matrix before starting'],
        ['Side Feed Separation', 'Soft phase ≥20wt% must be fed separately'],
        ['Filler Compatibility', 'OH-rich fillers promote PHA degradation. Prioritize CaCO₃'],
        ['Die Pressure Monitoring', 'Die pressure drop = earliest indicator of MW drop'],
        ['Minimize Residence Time', 'Increase throughput > increase RPM. Minimize shear'],
      ];
      return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:12px">` +
        principles.map(([title, body], i) =>
          `<div class="card" style="border-left-color:var(--primary);margin:0">
            <div style="font-size:13px;color:var(--primary);font-weight:800;margin-bottom:4px">${i + 1}. ${title}</div>
            <div style="font-size:13px;color:#374151">${body}</div>
          </div>`
        ).join('') + `</div>`;
    }
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────────────────────── */

/** @type {boolean[]} */
let cgDoeChecklist = [];

/** @type {Array<Object>} */
let cgTrialLog = [];

/* ─────────────────────────────────────────────────────────────────────────
   ENTRY POINT
───────────────────────────────────────────────────────────────────────── */

function initCompoundingGuide() {
  const container = document.getElementById('compGuideContainer');
  if (!container) return;

  _cgLoadStorage();

  const ko = (typeof LANG !== 'undefined' ? LANG : 'ko') === 'ko';

  container.innerHTML = `
    <h2 style="color:#1e3c72;margin-bottom:16px">
      🧪 ${ko ? 'PHA 컴파운딩 가이드' : 'PHA Compounding Guide'}
    </h2>
    <p style="color:#6b7280;line-height:1.7;margin:0 0 16px">
      ${ko
        ? '이 가이드는 PHA · PHA 블렌드 컴파운딩에서 현장 엔지니어가 가장 자주 보는 4가지만 묶었습니다: 스크류 설계, 존 온도 프로파일, 탈가스, 퍼지 SOP.'
        : 'This guide covers the four items field compounders hit most often with PHA and PHA blends: screw design, zone-temperature profile, devolatilization, and purge SOP.'}
    </p>

    <div class="flash-tabs" id="cgSubTabs">
      <button class="flash-tab active" onclick="cgShowTab(0)">
        ST-1: ${ko ? '스크류 추천기' : 'Screw Recommender'}
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
  _cgInitST1Events();
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
    { key: 'ce', code: 'CE', desc_ko: '축 방향 이송만 담당', desc_en: 'Forward conveying only' },
    { key: 'kb90', code: 'KB90', desc_ko: '최대 분산, 최대 전단 발열', desc_en: 'Max dispersion, max shear heat' },
    { key: 'kb45', code: 'KB45', desc_ko: '중간 분산, 중간 전단', desc_en: 'Mid dispersion, mid shear' },
    { key: 'kb30', code: 'KB30', desc_ko: '약한 분산, 낮은 전단', desc_en: 'Light dispersion, low shear' },
    { key: 'le', code: 'LE', desc_ko: '역류 유도, 충전 밀도 상승', desc_en: 'Backflow for higher fill density' },
    { key: 'zme', code: 'ZME', desc_ko: '균일 혼합용', desc_en: 'For uniform mixing' }
  ];
  const glossary = window.GLOSSARY_PHA || {};
  return `
    <div class="card" data-glossary-skip="true" style="margin:0 0 16px;border-left-color:#2C5D3F">
      <div style="font-weight:800;color:#2C5D3F;margin-bottom:6px">${ko ? '스크류 코드 용어표' : 'Screw-code glossary'}</div>
      <div style="color:#6b7280;line-height:1.65;margin-bottom:10px">
        ${ko
          ? '코드부터 읽고 시작하세요. 이후 본문에서 나오는 CE · KB · LE · ZME는 이 표의 의미를 그대로 따릅니다.'
          : 'Start with the code chart. Later mentions of CE, KB, LE, and ZME follow the same definitions used here.'}
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
    <h3 style="color:#1e3c72;margin:16px 0 12px">${lbl('스크류 추천기', 'Screw Recommender')}</h3>
    <p style="color:#6b7280;line-height:1.7;margin:0 0 12px">
      ${ko
        ? '조성의 H/S/F 비율을 넣으면 어떤 스크류 타입과 존 온도 프로파일로 시작해야 하는지 1차 기준선을 제안합니다. 먼저 추천 타입을 잡고, 그 다음에 KB와 side feed를 미세 조정하세요.'
        : 'Enter the H/S/F balance to get the first-pass screw type and zone-temperature profile. Lock the screw family first, then fine-tune KB blocks and side-feed position.'}
    </p>
    ${_cgBuildScrewGlossary(ko)}

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:16px">

      <!-- Hard Phase -->
      <div class="card" style="border-left-color:#ef4444;margin:0">
        <div style="font-weight:800;color:#ef4444;margin-bottom:10px">H – ${lbl('Hard Phase', 'Hard Phase')}</div>
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
        <div style="font-weight:800;color:#3b82f6;margin-bottom:10px">S – ${lbl('Soft Phase', 'Soft Phase')}</div>
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
    const val = parseFloat(inp.value) || 0;
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

  // Determine screw type
  let screwType;
  if (fillerTotal >= 15 || nonTalcFiller >= 10) {
    screwType = 'C';
  } else if (softTotal >= 20 || a1000p >= 15) {
    screwType = 'B';
  } else {
    screwType = 'A';
  }

  // Warnings
  const warnings = [];
  if (a1000p > 0 && s1000p > 0) {
    warnings.push(ko
      ? '⚠️ A1000P + S1000P 동시 사용 → <strong>별도 건조 필수</strong> (동시 건조 금지)'
      : '⚠️ A1000P + S1000P co-use → <strong>Separate drying mandatory</strong>');
  }
  if (p3hb > 0) {
    warnings.push(ko
      ? '⚠️ P3HB 함유 → <strong>main feed 앞단 투입 권장</strong> (열민감 hard phase)'
      : '⚠️ P3HB present → <strong>Feed at main feed upstream</strong> (heat-sensitive hard phase)');
  }
  if (fillerTotal > 0) {
    warnings.push(ko
      ? '⚠️ Filler 포함 배합 → OH-rich filler(Mg(OH)₂, ATH) 회피 권장; CaCO₃ 우선'
      : '⚠️ Filler-containing blend → Avoid OH-rich fillers (Mg(OH)₂, ATH); prioritize CaCO₃');
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
      <div class="success-box" style="margin:12px 0">
        <h3>${ko ? '추천 스크류 타입' : 'Recommended Screw Type'}: <strong>${typeData.label}</strong></h3>
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
            <th>${ko ? '설정 온도' : 'Temperature'} (°C)</th>
            <th>${ko ? '온도 시각화' : 'Visual'}</th>
          </tr></thead>
          <tbody>
            ${typeData.zones.map((z, i) => {
              const name = ko ? z.name_ko : z.name_en;
              const bar = _cgTempBar(z.temp);
              return `<tr>
                <td>${i + 1}</td>
                <td>${name}</td>
                <td><strong>${z.temp}</strong></td>
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
function _cgTempBar(temp) {
  let color, label, widthPct;
  if (temp <= 25) {
    color = '#9ca3af'; label = 'RT'; widthPct = 8;
  } else if (temp <= 150) {
    color = '#3b82f6'; widthPct = Math.round((temp - 25) / (180 - 25) * 80) + 8;
    label = `${temp}°C`;
  } else if (temp < 160) {
    color = '#f59e0b'; widthPct = Math.round((temp - 25) / (180 - 25) * 80) + 8;
    label = `${temp}°C`;
  } else {
    color = '#ef4444'; widthPct = Math.round((temp - 25) / (180 - 25) * 80) + 8;
    label = `${temp}°C`;
  }
  widthPct = Math.min(100, widthPct);
  return `<div style="background:#f3f4f6;border-radius:4px;height:16px;position:relative;overflow:hidden">
    <div style="background:${color};height:100%;width:${widthPct}%;border-radius:4px;transition:.3s"></div>
    <span style="position:absolute;right:4px;top:0;font-size:10px;line-height:16px;color:#374151;font-weight:600">${label}</span>
  </div>`;
}

/* ─────────────────────────────────────────────────────────────────────────
   ST-2: TROUBLESHOOTING
───────────────────────────────────────────────────────────────────────── */

function _cgBuildST2(ko) {
  const symptomCards = CG_TROUBLESHOOTING.map(sym => {
    const title = ko ? sym.title_ko : sym.title_en;
    const causesHtml = sym.causes.map(c => `
      <tr>
        <td style="font-size:13px">${ko ? c.cond_ko  : c.cond_en}</td>
        <td style="font-size:13px">${ko ? c.cause_ko : c.cause_en}</td>
        <td style="font-size:13px">${ko ? c.action_ko : c.action_en}</td>
      </tr>`).join('');

    return `
      <div class="card" style="margin:8px 0;cursor:pointer" onclick="cgToggleSym('${sym.id}')">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <strong style="font-size:15px">${sym.icon} ${sym.id}: ${title}</strong>
          <span id="cg_sym_arrow_${sym.id}" style="font-size:18px;transition:.2s">▼</span>
        </div>
        <div id="cg_sym_body_${sym.id}" style="display:none;margin-top:12px">
          <div class="tablewrap">
            <table>
              <thead><tr>
                <th>${ko ? '조건' : 'Condition'}</th>
                <th>${ko ? '원인' : 'Cause'}</th>
                <th>${ko ? '대응' : 'Action'}</th>
              </tr></thead>
              <tbody>${causesHtml}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }).join('');

  const alertMsg = ko
    ? '⚠️ <strong>핵심 원칙:</strong> die 압력 저하 + strand 약화 + 갈변이 같이 나오면 먼저 Mw 급락을 의심하세요. 이때 RPM이나 혼련을 더 올리면 더 나빠지므로, 체류 시간을 줄이고 barrel peak를 180 °C 아래로 낮춘 뒤 feed order를 다시 잡는 쪽이 맞습니다.'
    : '⚠️ <strong>Core principle:</strong> If die-pressure drop, strand weakening, and browning show up together, Mw loss is the first suspect. Do not answer it with more RPM or more mixing; shorten residence time, pull the barrel peak below 180 °C, and review feed order.';

  return `
    <h3 style="color:#1e3c72;margin:16px 0 12px">${ko ? '트러블슈팅 결정트리' : 'Troubleshooting Decision Tree'}</h3>
    ${symptomCards}
    <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:14px;margin-top:16px;font-size:13px;line-height:1.6">
      ${alertMsg}
    </div>
  `;
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
      const key = `s${step.step}_${idx}`;
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
    cgDoeChecklist = raw ? JSON.parse(raw) : [];
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

function _cgAllCheckKeys() {
  const keys = [];
  CG_DOE_STEPS.forEach(step => {
    const items = step.items_ko;
    items.forEach((_, idx) => keys.push(`s${step.step}_${idx}`));
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
