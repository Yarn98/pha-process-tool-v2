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
    const wrap = el('div', { className: 'flash-content active', id: 'straw-tab-0' });

    wrap.innerHTML = `
      <h3 style="color:#1e3c72;margin-bottom:16px">
        ${t('생산속도 계산기', 'Production Speed Calculator')}
      </h3>
      <p style="color:#6b7280;margin-bottom:16px">
        ${t(
          '물구간 체류시간 기준으로 최대 생산속도(N_max)와 목표 속도별 운전 파라미터를 계산합니다.',
          'Calculates maximum production speed (N_max) based on water-bath residence time and operating parameters for a target speed.'
        )}
      </p>
    `;

    const calc = el('div', { className: 'calculator' });

    // Input grid
    const grid = el('div', { className: 'weight-calc-grid', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px;margin-bottom:16px' });

    const inputs = [
      { id: 'sg-ls',       label: t('L_s — 스트로 길이 (mm)', 'L_s — Straw length (mm)'),             value: 260, min: 100, max: 500 },
      { id: 'sg-lw',       label: t('L_w — 물구간 길이 (m)', 'L_w — Water-bath length (m)'),          value: 8.5, min: 1,   max: 20  },
      { id: 'sg-tcrit',    label: t('t_crit — 임계 체류시간 (s)', 't_crit — Critical residence time (s)'), value: 4.2, min: 1,   max: 10  },
      { id: 'sg-ms',       label: t('m_s — 스트로 1개 질량 (g)', 'm_s — Mass per straw (g)'),          value: 1.5, min: 0.1, max: 10  },
      { id: 'sg-ntarget',  label: t('N_target — 목표 생산속도 (str/min, 선택)', 'N_target — Target speed (str/min, optional)'), value: 400, min: 0,   max: 9999 },
    ];

    inputs.forEach(inp => {
      const box = el('div', { className: 'weight-input-box' });
      box.appendChild(el('label', { html: inp.label }));
      const i = el('input', { type: 'number', id: inp.id, value: inp.value, min: inp.min, max: inp.max, step: 'any' });
      box.appendChild(i);
      const hint = el('span', { className: 'range-hint', text: `${t('범위', 'Range')}: ${inp.min} – ${inp.max}` });
      box.appendChild(hint);
      grid.appendChild(box);
    });

    calc.appendChild(grid);

    // Formula display
    const formulaBox = el('div', { className: 'formula', html: `
      <strong>${t('적용 공식', 'Formulas applied')}:</strong><br>
      V_line = N &times; L_s/1000 &nbsp; (m/min)<br>
      t_water = 60 &times; L_w / (N &times; L_s/1000) &nbsp; (s)<br>
      Q_mass = N &times; m_s &nbsp; (g/min) = 0.06 &times; N &times; m_s &nbsp; (kg/h)<br>
      N_max = 60 &times; L_w / (L_s/1000 &times; t_crit)<br>
      L_w_req = N_target &times; (L_s/1000) &times; t_crit / 60<br>
      T_die &asymp; 171.1 + 0.034 &times; N &nbsp; (${t('die-exit 온도 추정', 'die-exit temp estimate')})
    ` });
    calc.appendChild(formulaBox);

    const btnRow = el('div', { style: 'margin:10px 0' });
    const calcBtn = el('button', { className: 'calc-button', text: t('계산', 'Calculate') });
    btnRow.appendChild(calcBtn);
    calc.appendChild(btnRow);

    // Result area
    const resultArea = el('div', { id: 'sg-result', style: 'display:none' });
    calc.appendChild(resultArea);

    calcBtn.addEventListener('click', () => {
      const Ls      = parseFloat(document.getElementById('sg-ls').value);
      const Lw      = parseFloat(document.getElementById('sg-lw').value);
      const tcrit   = parseFloat(document.getElementById('sg-tcrit').value);
      const ms      = parseFloat(document.getElementById('sg-ms').value);
      const Ntarget = parseFloat(document.getElementById('sg-ntarget').value);

      if ([Ls, Lw, tcrit, ms].some(isNaN) || Ls <= 0 || Lw <= 0 || tcrit <= 0 || ms <= 0) {
        resultArea.style.display = 'none';
        alert(t('필수 입력값을 올바르게 입력하세요.', 'Please enter valid required inputs.'));
        return;
      }

      const Ls_m   = Ls / 1000;
      const Nmax   = 60 * Lw / (Ls_m * tcrit);
      const Vline  = Nmax * Ls_m;
      const Qmass_gmin = Nmax * ms;
      const Qmass_kgh  = 0.06 * Nmax * ms;
      const Tdie   = 171.1 + 0.034 * Nmax;

      let targetHTML = '';
      if (!isNaN(Ntarget) && Ntarget > 0) {
        const twater_target = 60 * Lw / (Ntarget * Ls_m);
        const Lw_req = Ntarget * Ls_m * tcrit / 60;
        const status = twater_target >= tcrit
          ? `<span style="color:#065f46;font-weight:700">${t('✅ 충분 (체류시간 충족)', '✅ Sufficient (residence time met)')}</span>`
          : `<span style="color:#9b1c1c;font-weight:700">${t('⚠️ 부족 — 물구간 연장 필요', '⚠️ Insufficient — extend water bath')}</span>`;
        targetHTML = `
          <div class="recommendation-item caution" style="margin-top:12px">
            <strong>${t('N_target 분석', 'N_target Analysis')}: ${Ntarget.toFixed(0)} str/min</strong><br>
            t_water @ N_target = <strong>${twater_target.toFixed(2)} s</strong> ${status}<br>
            ${t('필요 물구간 길이', 'Required water-bath length')}: L_w_req = <strong>${Lw_req.toFixed(2)} m</strong>
          </div>
        `;
      }

      resultArea.style.display = 'block';
      resultArea.innerHTML = `
        <div class="calc-result">
          <h4>${t('계산 결과', 'Results')}</h4>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px">
            <div>
              <div style="font-size:13px;color:#6b7280">${t('최대 생산속도 (N_max)', 'Max production speed (N_max)')}</div>
              <div class="calc-result-value">${Nmax.toFixed(1)} <span style="font-size:14px">str/min</span></div>
            </div>
            <div>
              <div style="font-size:13px;color:#6b7280">${t('라인 속도 @ N_max', 'Line speed @ N_max')}</div>
              <div class="calc-result-value">${Vline.toFixed(2)} <span style="font-size:14px">m/min</span></div>
            </div>
            <div>
              <div style="font-size:13px;color:#6b7280">${t('질량유량 @ N_max', 'Mass flow @ N_max')}</div>
              <div class="calc-result-value">${Qmass_gmin.toFixed(1)} <span style="font-size:14px">g/min</span></div>
              <div style="font-size:12px;color:#6b7280">${Qmass_kgh.toFixed(2)} kg/h</div>
            </div>
            <div>
              <div style="font-size:13px;color:#6b7280">${t('Die-exit 온도 추정', 'Die-exit temp estimate')}</div>
              <div class="calc-result-value">${Tdie.toFixed(1)} <span style="font-size:14px">°C</span></div>
              <div style="font-size:12px;color:#6b7280">T ≈ 171.1 + 0.034 × N_max</div>
            </div>
          </div>
          ${targetHTML}
        </div>
      `;
    });

    wrap.appendChild(calc);

    // Reference table
    const refTitle = el('h4', { style: 'color:#1e3c72;margin:24px 0 8px', text: t('스트로 길이별 N_max 참조표 (L_w=8.5m, t_crit=4.2s)', 'N_max reference table by straw length (L_w=8.5m, t_crit=4.2s)') });
    wrap.appendChild(refTitle);

    const refData = [
      { len: 180, nmax: 675 },
      { len: 210, nmax: 578 },
      { len: 230, nmax: 528 },
      { len: 260, nmax: 467 },
      { len: 300, nmax: 405 },
    ];

    const tableWrap = el('div', { className: 'tablewrap', style: 'margin-bottom:20px' });
    const tbl = el('table');
    const thead = el('thead');
    const hrow = el('tr');
    hrow.appendChild(el('th', { text: t('스트로 길이 (mm)', 'Straw length (mm)') }));
    hrow.appendChild(el('th', { text: 'N_max (str/min)' }));
    hrow.appendChild(el('th', { text: t('V_line @ N_max (m/min)', 'V_line @ N_max (m/min)') }));
    thead.appendChild(hrow);
    tbl.appendChild(thead);

    const tbody = el('tbody');
    refData.forEach(row => {
      const tr = el('tr');
      tr.appendChild(el('td', { text: row.len.toString() }));
      tr.appendChild(el('td', { text: row.nmax.toString() }));
      const vl = (row.nmax * row.len / 1000).toFixed(2);
      tr.appendChild(el('td', { text: vl }));
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    tableWrap.appendChild(tbl);
    wrap.appendChild(tableWrap);

    return wrap;
  }

  /* ─────────────────────────────────────────
   * ST-2: Recommended Process Conditions
   * ───────────────────────────────────────── */
  function buildST2() {
    const wrap = el('div', { className: 'flash-content', id: 'straw-tab-1' });
    wrap.innerHTML = `
      <h3 style="color:#1e3c72;margin-bottom:16px">${t('권장 공정 조건', 'Recommended Process Conditions')}</h3>

      <!-- Section A: Barrel/Die Temperature -->
      <h4 style="color:#1e3c72;margin:20px 0 10px">${t('A. 배럴/다이 온도 설정', 'A. Barrel / Die Temperature Settings')}</h4>
      <div class="tablewrap" style="margin-bottom:20px">
        <table>
          <thead>
            <tr>
              <th>${t('구역', 'Zone')}</th>
              <th>${t('온도', 'Temperature')}</th>
              <th>${t('비고', 'Notes')}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>${t('배럴 1', 'Barrel 1')}</td><td>160°C</td><td>${t('고체 이송 구간', 'Solids conveying')}</td></tr>
            <tr><td>${t('배럴 2', 'Barrel 2')}</td><td>166–170°C</td><td>${t('용융 개시', 'Melting onset')}</td></tr>
            <tr><td>${t('배럴 3', 'Barrel 3')}</td><td>167–170°C</td><td>${t('완전 용융', 'Complete melting')}</td></tr>
            <tr><td>${t('배럴 4', 'Barrel 4')}</td><td>169–170°C</td><td>${t('균질화', 'Homogenization')}</td></tr>
            <tr><td>${t('스크린/다이', 'Screen/Die')}</td><td>170°C</td><td>${t('실측 die-exit 확인', 'Verify actual die-exit')}</td></tr>
            <tr><td>${t('메인 수조', 'Main bath')}</td><td>70–73°C</td><td>${t('Fast-setting 계열 최적', 'Optimized for fast-setting grade')}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Section B: Formulation Direction -->
      <h4 style="color:#1e3c72;margin:20px 0 10px">${t('B. 배합 방향', 'B. Formulation Direction')}</h4>
      <div class="tablewrap" style="margin-bottom:20px">
        <table>
          <thead>
            <tr>
              <th>${t('방향', 'Direction')}</th>
              <th>${t('권장 사항', 'Recommendation')}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>${t('기본 매트릭스', 'Base matrix')}</td><td>Baseline PHA/CaCO₃ system</td></tr>
            <tr><td>${t('생산성 강화', 'Productivity boost')}</td><td>PHB-rich fast-setting booster 12–20 wt%</td></tr>
            <tr><td>${t('표면 보정', 'Surface correction')}</td><td>Silicone/silica process aid 0.15 wt%</td></tr>
            <tr><td style="color:#9b1c1c;font-weight:700">${t('피해야 할 방향', 'Avoid')}</td><td>${t('Peroxide, carrier mismatch MB, PLA co-recipe', 'Peroxide, carrier mismatch MB, PLA co-recipe')}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Section C: Productivity by Booster -->
      <h4 style="color:#1e3c72;margin:20px 0 10px">${t('C. 부스터 함량별 안정 속도', 'C. Stable Speed by Booster Content')}</h4>
      <div class="tablewrap" style="margin-bottom:20px">
        <table>
          <thead>
            <tr>
              <th>${t('부스터', 'Booster')}</th>
              <th>${t('안정 속도', 'Stable Speed')}</th>
              <th>${t('비고', 'Notes')}</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>0 wt%</td><td>245–346 str/min</td><td>Baseline</td></tr>
            <tr><td>12–15 wt%</td><td>380–430 str/min</td><td>${t('장시간 안정', 'Long-term stable')}</td></tr>
            <tr><td>20 wt%</td><td>${t('최대', 'Max')} 457 str/min</td><td>${t('현 라인 상한', 'Current line ceiling')}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Section D: Problem Combinations -->
      <h4 style="color:#1e3c72;margin:20px 0 10px">${t('D. 피해야 할 조합 (경고)', 'D. Problem Combinations to Avoid (Warnings)')}</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:20px">
        <div class="card" style="border-left-color:#ef4444">
          <strong style="color:#ef4444">Peroxide</strong><br>
          <span style="color:#374151">${t('→ 고속 불안정', '→ High-speed instability')}</span>
        </div>
        <div class="card" style="border-left-color:#ef4444">
          <strong style="color:#ef4444">Talc + Peroxide</strong><br>
          <span style="color:#374151">${t('→ 복합 불안정', '→ Compound instability')}</span>
        </div>
        <div class="card" style="border-left-color:#ef4444">
          <strong style="color:#ef4444">PLA</strong><br>
          <span style="color:#374151">${t('→ warm bath 붕괴', '→ Warm bath collapse')}</span>
        </div>
        <div class="card" style="border-left-color:#ef4444">
          <strong style="color:#ef4444">${t('Carrier mismatch MB', 'Carrier mismatch MB')}</strong><br>
          <span style="color:#374151">${t('→ 즉시 단선', '→ Immediate strand breakage')}</span>
        </div>
      </div>
    `;
    return wrap;
  }

  /* ─────────────────────────────────────────
   * ST-3: Troubleshooting
   * ───────────────────────────────────────── */
  function buildST3() {
    const wrap = el('div', { className: 'flash-content', id: 'straw-tab-2' });

    const heading = el('h3', { style: 'color:#1e3c72;margin-bottom:8px', text: t('트러블슈팅', 'Troubleshooting') });
    const sub = el('p', { style: 'color:#6b7280;margin-bottom:16px', text: t('카드를 클릭하면 상세 정보가 펼쳐집니다.', 'Click a card to expand details.') });
    wrap.appendChild(heading);
    wrap.appendChild(sub);

    const symptoms = [
      {
        title:  t('Sharkskin / 러프 표면', 'Sharkskin / Rough Surface'),
        cause:  t('Die 전단 과다', 'Excessive die shear'),
        check:  t('온도 2-3°C 하향 시 완화?', 'Does lowering temp 2-3°C reduce it?'),
        action: t('Screen pack 유지, front zone 하향, silicone aid 0.15 wt%', 'Maintain screen pack, reduce front zone temp, add silicone aid 0.15 wt%'),
      },
      {
        title:  t('String-up 직후 단선', 'Strand Break Immediately After String-Up'),
        cause:  t('용융강도 부족', 'Insufficient melt strength'),
        check:  t('압력 낮은데 바로 끊김?', 'Low pressure but breaks immediately?'),
        action: t('속도 저감, peroxide 제거, screen pack 복귀', 'Reduce speed, remove peroxide, restore screen pack'),
      },
      {
        title:  t('고속 범프/거칠음 (400+ str/min)', 'High-Speed Bumps / Roughness (400+ str/min)'),
        cause:  t('Chain scission + filler 효과', 'Chain scission + filler interaction'),
        check:  t('334 OK, 400+ 에서만 발생?', 'OK at 334, occurs only at 400+?'),
        action: t('Peroxide 제거, talc 의존 저감', 'Remove peroxide, reduce reliance on talc'),
      },
      {
        title:  t('수조 진입 취성 파단', 'Brittle Fracture at Water-Bath Entry'),
        cause:  t('결정화 너무 빠름', 'Crystallization too fast'),
        check:  t('Bath entry 직후 부러짐?', 'Breaks immediately after bath entry?'),
        action: t('Fast-setting booster 단독 사용 금지, baseline으로 희석', 'Do not use fast-setting booster alone; dilute with baseline'),
      },
      {
        title:  t('500 str/min 부근 걸림', 'Jamming Near 500 str/min'),
        cause:  t('체류시간 부족, 장력 과다', 'Insufficient residence time, excessive draw tension'),
        check:  t('457 통과, 500에서만 발생?', 'Passes at 457, fails only at 500?'),
        action: t('속도 저감, 물구간 증설, die-bath gap 축소', 'Reduce speed, extend water bath, shorten die-bath gap'),
      },
      {
        title:  t('MB 투입 즉시 단선', 'Immediate Break on MB Addition'),
        cause:  t('Carrier mismatch', 'Carrier mismatch'),
        check:  t('온도 올려도 개선 없음?', 'No improvement even with higher temperature?'),
        action: t('동일 계열 PHA carrier MB 사용', 'Use MB with same PHA-family carrier'),
      },
      {
        title:  t('PLA 혼합 — warm bath 붕괴', 'PLA Blend — Warm Bath Collapse'),
        cause:  t('Bath temp > Tg(PLA)', 'Bath temp > Tg(PLA)'),
        check:  t('Cold bath에서 OK, main에서 붕괴?', 'OK in cold bath, collapse in main bath?'),
        action: t('현 PHA bath recipe에 PLA 공용 금지', 'Do not combine PLA in current PHA bath recipe'),
      },
    ];

    const container = el('div', { style: 'display:flex;flex-direction:column;gap:12px;margin-bottom:20px' });

    symptoms.forEach((s, idx) => {
      const card = el('div', {
        style: 'background:#fff;border:1px solid #dee2e6;border-left:4px solid #1e3c72;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.06);cursor:pointer',
      });

      const header = el('div', {
        style: 'padding:14px 16px;display:flex;justify-content:space-between;align-items:center;background:#f8f9fa',
      });
      header.appendChild(el('span', { style: 'font-weight:700;color:#1e3c72', text: `${idx + 1}. ${s.title}` }));
      const chevron = el('span', { style: 'font-size:18px;color:#6b7280;transition:transform .2s', text: '▶' });
      header.appendChild(chevron);

      const body = el('div', { style: 'display:none;padding:16px' });
      body.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          <div>
            <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px">${t('원인', 'Cause')}</div>
            <div style="color:#374151">${s.cause}</div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px">${t('확인', 'Check')}</div>
            <div style="color:#374151">${s.check}</div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px">${t('대응', 'Action')}</div>
            <div style="color:#065f46;font-weight:600">${s.action}</div>
          </div>
        </div>
      `;

      header.addEventListener('click', () => {
        const open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        chevron.style.transform = open ? '' : 'rotate(90deg)';
      });

      card.appendChild(header);
      card.appendChild(body);
      container.appendChild(card);
    });

    wrap.appendChild(container);
    return wrap;
  }

  /* ─────────────────────────────────────────
   * ST-4: Operator Checkpoints
   * ───────────────────────────────────────── */
  const CHECKLIST_KEY = 'straw_checklist';

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
      { id: 'ck4', section: 'during', text: t('실측 die-exit 제품 온도 모니터링', 'Monitor actual die-exit product temperature') },
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
   * ST-5: Die-exit Temperature Guide
   * ───────────────────────────────────────── */
  function buildST5() {
    const wrap = el('div', { className: 'flash-content', id: 'straw-tab-4' });

    wrap.innerHTML = `
      <h3 style="color:#1e3c72;margin-bottom:16px">${t('Die-exit 온도 가이드', 'Die-exit Temperature Guide')}</h3>

      <!-- Section A: Composition Windows -->
      <h4 style="color:#1e3c72;margin:20px 0 10px">${t('A. 배합별 온도 창', 'A. Composition-Specific Temperature Windows')}</h4>
      <div class="tablewrap" style="margin-bottom:20px">
        <table>
          <thead>
            <tr>
              <th>${t('배합', 'Composition')}</th>
              <th>${t('실측 온도 범위', 'Measured Temp Range')}</th>
              <th>${t('비고', 'Notes')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fast-setting PHB-rich</td>
              <td>178–182°C</td>
              <td>${t('안정창, 빠른 결정화', 'Stable window, fast crystallization')}</td>
            </tr>
            <tr>
              <td>Baseline PHA startup</td>
              <td>190–194°C</td>
              <td>${t('Sharkskin 소멸 구간', 'Sharkskin elimination zone')}</td>
            </tr>
            <tr style="background:#fff1f1">
              <td style="color:#9b1c1c;font-weight:700">${t('비권장', 'Not recommended')}</td>
              <td style="color:#9b1c1c">≥200°C ${t('장시간', 'prolonged')}</td>
              <td style="color:#9b1c1c">${t('열분해 위험', 'Thermal degradation risk')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section B: Speed-Temperature Estimator -->
      <h4 style="color:#1e3c72;margin:20px 0 10px">${t('B. 속도-온도 간이 추정기', 'B. Speed-Temperature Quick Estimator')}</h4>
      <div class="formula" style="margin-bottom:12px">
        T_die,meas (°C) &asymp; 171.1 + 0.034 &times; N<br>
        <span style="font-size:12px;color:#6b7280">
          ${t('예시', 'Examples')}: 300→181.3°C &nbsp; 350→183.0°C &nbsp; 400→184.7°C &nbsp; 450→186.4°C &nbsp; 500→188.1°C
        </span>
      </div>

      <div class="calc-input-group" style="max-width:360px">
        <label>${t('생산속도 N 입력 (str/min)', 'Enter production speed N (str/min)')}</label>
        <input type="number" id="sg-t5-n" value="400" min="0" max="9999" step="1" style="width:100%;padding:12px;border:2px solid #ced4da;border-radius:5px;font-size:1em;color:#212529;background:#fff">
      </div>
      <button class="calc-button" id="sg-t5-btn" style="margin:10px 0">
        ${t('온도 추정', 'Estimate Temperature')}
      </button>
      <div id="sg-t5-result" style="display:none;margin:12px 0"></div>

      <!-- Section C: Key Message -->
      <div class="success-box" style="margin-top:24px">
        <h4 style="margin-bottom:8px">📌 ${t('핵심 메시지', 'Key Message')}</h4>
        <p>
          ${t(
            'PHA는 200°C 이상 melt-processing이 열분해 관점에서 비권장. 냉각/결정화는 20–80°C 범위에서 가능. 일부 PHA계는 50–70°C가 유리.',
            'Melt-processing PHA above 200°C is not recommended due to thermal degradation risk. Cooling / crystallization is possible in the 20–80°C range; some PHA grades favor 50–70°C.'
          )}
        </p>
      </div>
    `;

    // Estimator button handler (bound after innerHTML set)
    const btn = wrap.querySelector('#sg-t5-btn');
    const result = wrap.querySelector('#sg-t5-result');
    if (btn && result) {
      btn.addEventListener('click', () => {
        const N = parseFloat(wrap.querySelector('#sg-t5-n').value);
        if (isNaN(N) || N < 0) {
          result.style.display = 'none';
          return;
        }
        const T = 171.1 + 0.034 * N;
        const color = T >= 200 ? '#9b1c1c' : T >= 190 ? '#92400e' : '#065f46';
        result.style.display = 'block';
        result.innerHTML = `
          <div class="calc-result">
            <div style="font-size:13px;color:#6b7280">${t('추정 die-exit 온도', 'Estimated die-exit temperature')} @ N = ${N.toFixed(0)} str/min</div>
            <div class="calc-result-value" style="color:${color}">${T.toFixed(1)} °C</div>
            ${T >= 200
              ? `<div style="color:#9b1c1c;font-weight:700">⚠️ ${t('200°C 이상 — 열분해 위험 구간', '200°C or above — thermal degradation risk zone')}</div>`
              : ''}
          </div>
        `;
      });
    }

    return wrap;
  }

  /* ─────────────────────────────────────────
   * Main entry point
   * ───────────────────────────────────────── */
  function initStrawGuide() {
    const root = document.getElementById('strawGuideContainer');
    if (!root) {
      console.error('[straw-guide] #strawGuideContainer not found');
      return;
    }

    root.innerHTML = '';

    // Page header
    root.appendChild(el('h2', {
      style: 'color:#1e3c72;margin-bottom:8px',
      text: t('PHA 스트로 압출 가이드', 'PHA Straw Extrusion Guide'),
    }));
    root.appendChild(el('p', {
      style: 'color:#6b7280;margin-bottom:0',
      text: t(
        '생산속도 계산 · 공정 조건 · 트러블슈팅 · 운영자 체크포인트 · Die-exit 온도 가이드',
        'Production speed · Process conditions · Troubleshooting · Operator checkpoints · Die-exit temperature guide'
      ),
    }));

    // Sub-tab nav
    const tabDefs = [
      { label: t('ST-1: 생산속도 계산기', 'ST-1: Production Speed Calc') },
      { label: t('ST-2: 권장 공정 조건', 'ST-2: Process Conditions') },
      { label: t('ST-3: 트러블슈팅', 'ST-3: Troubleshooting') },
      { label: t('ST-4: 운영자 체크포인트', 'ST-4: Operator Checkpoints') },
      { label: t('ST-5: Die-exit 온도', 'ST-5: Die-exit Temperature') },
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
  }

  // Expose to global scope
  window.initStrawGuide = initStrawGuide;

})();
