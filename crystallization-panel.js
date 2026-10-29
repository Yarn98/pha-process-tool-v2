/* "결정화 이력" panel in the Process tab: inputs, resin T(t) at surface/centre/mean, zone residence,
   CR1/CR2, nuclei survival, speed limit, warnings, presets with evidence badges and the DOE helper.
   Start conditions are estimates and are always shown next to the control. Nothing here has a default
   for k, ρ or h. Work order chapter 9 (2026-10-29). */
(function () {
  'use strict';
  const lang = () => typeof LANG !== 'undefined' && LANG === 'en' ? 'en' : 'ko';
  const t = (ko, en) => lang() === 'en' ? en : ko;
  const L = m => m ? (lang() === 'en' ? m.en : m.ko) : '';
  const esc = v => String(v ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const num = v => { if (v === '' || v === null || v === undefined) return undefined; const n = Number(v); return Number.isFinite(n) ? n : undefined; };
  const fmt = (v, d = 1) => Number.isFinite(v) ? (Math.round(v * 10 ** d) / 10 ** d).toString() : '—';
  const STORE = 'pha_xtal_inputs', DOE_STORE = 'pha_xtal_doe';
  const load = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } };
  const save = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ } };
  let host = null, lastResult = null;

  const EVIDENCE = { confirmed: ['확인됨', 'confirmed'], judged: ['판단됨', 'judged'], estimated: ['추정됨', 'estimated'], measured: ['실측', 'measured'] };
  const badge = ev => ev && EVIDENCE[ev] ? `<span class="xtal-badge xtal-ev-${ev}">${esc(t(EVIDENCE[ev][0], EVIDENCE[ev][1]))}</span>${ev === 'estimated' ? `<span class="xtal-note">${esc(t('실측 최적 아님', 'not a measured optimum'))}</span>` : ''}` : '';

  /* ---------- input definitions ---------- */
  const F = (id, ko, en, unit, extra) => Object.assign({ id, ko, en, unit }, extra || {});
  const COMMON = [F('k_W_mK', '열전도도 k', 'Thermal conductivity k', 'W/m·K', { req: true }), F('rho_kg_m3', '밀도 ρ', 'Density ρ', 'kg/m³', { req: true }),
    F('Tm_C', 'Tm (cp 전환, 선택)', 'Tm (cp switch, optional)', '°C'), F('Tg_C', 'Tg (CR2 끝점, 선택)', 'Tg (CR2 end, optional)', '°C')];
  const PROC = {
    straw: [F('dieExit_C', '다이 출구 온도', 'Die exit temperature', '°C', { req: true }), F('wall_mm', '벽 두께', 'Wall thickness', 'mm', { req: true }), F('OD_mm', '외경', 'Outer diameter', 'mm'),
      F('output_ea_min', '생산량', 'Output', 'ea/min'), F('cutLength_m', '절단 길이', 'Cut length', 'm'), F('lineSpeed_m_min', '또는 라인 속도', 'or line speed', 'm/min'), F('targetOutput_ea_min', '목표 생산량', 'Target output', 'ea/min'),
      F('b1_L_m', '1차 수조 길이', 'Bath 1 length', 'm'), F('b1_T_C', '1차 수온', 'Bath 1 water', '°C', { preset: 'bath1' }), F('b1_h', '1차 h', 'Bath 1 h', 'W/m²·K', { req: true }), F('b1_tReq', '1차 필요시간 (실측)', 'Bath 1 required time (measured)', 's'),
      F('g1_L_m', '수조 사이 공기 길이', 'Air gap length', 'm'), F('g1_h', '공기 h', 'Air h', 'W/m²·K'), F('g1_T_C', '공기 온도', 'Air temperature', '°C'),
      F('b2_L_m', '2차 수조 길이', 'Bath 2 length', 'm'), F('b2_T_C', '2차 수온', 'Bath 2 water', '°C', { preset: 'bath2' }), F('b2_h', '2차 h', 'Bath 2 h', 'W/m²·K', { req: true }), F('b2_tReq', '2차 필요시간 (실측)', 'Bath 2 required time (measured)', 's')],
    injection: [F('melt_C', '사출 용융온도', 'Injection melt temperature', '°C', { req: true }), F('moldSurface_C', '금형 cavity 표면 실측', 'Mold cavity surface (measured)', '°C', { preset: 'mold' }), F('moldSetpoint_C', '금형 설정값', 'Mold setpoint', '°C'),
      F('wall_mm', '두께', 'Wall thickness', 'mm', { req: true }), F('fillTime_s', '충전 시간', 'Fill time', 's'), F('holdTime_s', '보압 시간', 'Hold time', 's'), F('coolingTime_s', '냉각 시간', 'Cooling time', 's'), F('band_C', '중심 도달 band ±', 'Centre band ±', 'K')],
    sheet: [F('dieExit_C', '다이 출구 온도', 'Die exit temperature', '°C', { req: true }), F('thickness_mm', '시트 두께', 'Sheet thickness', 'mm', { req: true }), F('lineSpeed_m_min', '라인 속도', 'Line speed', 'm/min', { req: true }),
      F('R1_D', 'R1 직경', 'R1 diameter', 'mm'), F('R1_wrap', 'R1 감김(nip)', 'R1 wrap (nip)', '°'), F('R1_T', 'R1 온도', 'R1 temperature', '°C', { preset: 'R1' }),
      F('R2_D', 'R2 직경', 'R2 diameter', 'mm'), F('R2_wrap', 'R2 감김', 'R2 wrap', '°'), F('R2_T', 'R2 온도', 'R2 temperature', '°C', { preset: 'R2' }),
      F('R3_D', 'R3 직경', 'R3 diameter', 'mm'), F('R3_wrap', 'R3 감김', 'R3 wrap', '°'), F('R3_T', 'R3 온도', 'R3 temperature', '°C', { preset: 'R3' }),
      F('air_h', '롤 비접촉면 공기 h', 'Air h on free face', 'W/m²·K'), F('air_T', '공기 온도', 'Air temperature', '°C'), F('stickingControl_R2_C', '현행 R2 (control)', 'Current R2 (control)', '°C'),
      F('postReheat_C', '후공정 재가열 온도', 'Post-process reheat', '°C'), F('postReheatExposure_s', '100°C 이상 노출 시간', 'Time above 100 °C', 's')],
  };
  const BLEND = [F('A1000P_pct', 'A1000P 함량 (사용자 단위)', 'A1000P content (user unit)', ''), F('A1000P_warnPct', 'tack 경고 임계 함량', 'Tack warning threshold', ''),
    F('handling_C', '취급 온도 (비정질)', 'Handling temperature (amorphous)', '°C'), F('tackSurface_C', 'tack 표면 온도 임계', 'Tack surface threshold', '°C')];
  const GRADES = ['S1000P', 'A1000P', 'CB0400A', 'CB0104A', 'P3HB_REF_2026', 'CA1180P', 'CA1165A', 'CA1670P', 'CA1680P', 'CA1270P'];

  function presetValue(key) {
    const p = window.PHACrystalData && PHACrystalData.presets;
    if (!p) return '';
    if (key === 'bath1') return p.straw.stages.find(s => s.key === 'bath1').start;
    if (key === 'bath2') return p.straw.stages.find(s => s.key === 'bath2').start;
    if (key === 'mold') return p.injection.moldPresets.find(m => m.T_C === 65).T_C;
    const roll = p.sheet.rolls.find(r => r.name === key);
    return roll ? roll.start : '';
  }
  function state() {
    const saved = load(STORE) || {};
    if (!saved.process) { const proc = document.getElementById('process')?.value; saved.process = proc === 'injection' || proc === 'sheet' ? proc : 'straw'; }
    return saved;
  }

  /* ---------- markup ---------- */
  function field(f, s) {
    const v = s[f.id] ?? (f.preset ? presetValue(f.preset) : '');
    const tag = f.preset ? `<span class="xtal-badge xtal-ev-estimated" title="${esc(t('작업지시서 시작 조건 (추정됨)', 'Work-order start condition (estimated)'))}">${esc(t('시작안', 'start'))}</span>` : '';
    return `<div class="group xtal-field"><label for="xtal_${f.id}">${esc(t(f.ko, f.en))}${f.unit ? ` <span class="xtal-unit">${esc(f.unit)}</span>` : ''}${f.req ? ' *' : ''} ${tag}</label>` +
      `<input id="xtal_${f.id}" data-xtal="${f.id}" type="number" step="any" inputmode="decimal" value="${esc(v)}"></div>`;
  }
  function render() {
    if (!host) return;
    const s = state();
    const proc = s.process;
    const procOpt = ['straw', 'injection', 'sheet'].map(p => `<option value="${p}"${p === proc ? ' selected' : ''}>${esc({ straw: t('빨대 (2단 수조)', 'Straw (2 baths)'), injection: t('사출', 'Injection'), sheet: t('시트 (3롤)', 'Sheet (3 rolls)') }[p])}</option>`).join('');
    const gradeOpt = GRADES.map(g => `<option value="${g}"${g === (s.gradeId || 'S1000P') ? ' selected' : ''}>${g}</option>`).join('');
    const extra = proc === 'straw'
      ? `<div class="group"><label for="xtal_innerBC">${esc(t('내면 경계', 'Inner wall'))}</label><select id="xtal_innerBC" data-xtal-sel="innerBC"><option value="adiabatic">${esc(t('단열', 'Adiabatic'))}</option></select></div>` +
        `<label class="xtal-check"><input type="checkbox" data-xtal-chk="sagOrOvality"${s.sagOrOvality ? ' checked' : ''}> ${esc(t('다이 직후 늘어짐·타원도 불량', 'Sag or ovality after the die'))}</label>`
      : proc === 'injection'
        ? `<div class="group"><label for="xtal_purpose">${esc(t('목적', 'Purpose'))}</label><select id="xtal_purpose" data-xtal-sel="purpose">${['cycle', 'elongation', 'HDT'].map(x => `<option value="${x}"${x === (s.purpose || 'cycle') ? ' selected' : ''}>${x}</option>`).join('')}</select></div>` +
          `<div class="group"><label for="xtal_flash">${esc(t('flash 발생 시점', 'Flash occurs during'))}</label><select id="xtal_flash" data-xtal-sel="flashTiming"><option value="">—</option>${['fill', 'hold'].map(x => `<option value="${x}"${x === s.flashTiming ? ' selected' : ''}>${esc(x === 'fill' ? t('충전 중', 'Fill') : t('보압 중', 'Hold'))}</option>`).join('')}</select></div>`
        : `<label class="xtal-check"><input type="checkbox" data-xtal-chk="plaMatrix"${s.plaMatrix ? ' checked' : ''}> ${esc(t('PLA 매트릭스 시트', 'PLA-matrix sheet'))}</label>`;
    host.innerHTML =
      `<details class="xtal-panel"${s.open ? ' open' : ''}><summary>${esc(t('결정화 이력', 'Crystallization history'))} <span class="xtal-sub">${esc(t('수지 온도–시간 이력으로 판정 · P3HB 논문값 기반, S1000P는 60 °C 실측 t½ 보정', 'Judged from the resin temperature–time history · pure-P3HB literature basis, S1000P calibrated with a measured 60 °C t½'))}</span></summary>` +
      `<div class="xtal-body">` +
      `<p class="hint">${esc(t('설비 온도가 아니라 수지가 각 온도대에 실제로 머문 시간으로 판정합니다. 시작 조건은 S1000P 주성분 배합 가정의 추정안이며 현행 control과 함께 봅니다. k, ρ, h는 기본값이 없습니다.', 'Judged by how long the resin actually stays in each band, not by equipment setpoints. Start conditions are estimates for an S1000P-based compound and are shown next to the control. k, ρ and h have no defaults.'))}</p>` +
      `<div class="grid"><div class="group"><label for="xtal_process">${esc(t('공정', 'Process'))}</label><select id="xtal_process" data-xtal-sel="process">${procOpt}</select></div>` +
      `<div class="group"><label for="xtal_grade">${esc(t('grade', 'Grade'))}</label><select id="xtal_grade" data-xtal-sel="gradeId">${gradeOpt}</select></div>${extra}</div>` +
      `<div class="row xtal-checks"><label class="xtal-check"><input type="checkbox" data-xtal-chk="hasNucleatingAgent"${s.hasNucleatingAgent ? ' checked' : ''}> ${esc(t('핵제·talc·PHB 포함', 'Contains nucleant / talc / PHB'))}</label>` +
      `<label class="xtal-check"><input type="checkbox" data-xtal-chk="tgShift"${s.tgShift ? ' checked' : ''}> ${esc(t('Tg 기준 핵생성 구간 추정 (Tg + 25–35 K, 추정됨)', 'Tg-based nucleation band (Tg + 25–35 K, estimated)'))}</label></div>` +
      `<h4 class="xtal-h">${esc(t('열물성', 'Thermal properties'))}</h4><div class="grid">${COMMON.map(f => field(f, s)).join('')}</div>` +
      `<p class="hint">cp ${esc(t('용융 2.073 / 고화 1.858 J/g/K (P3HB Tm0 값, 배합 미보정). Tm이 없으면 2.073을 전 구간에 사용', 'melt 2.073 / solid 1.858 J/g/K (P3HB at Tm0, not calibrated). Without Tm, 2.073 is used throughout'))}</p>` +
      `<h4 class="xtal-h">${esc(t('공정 입력', 'Process inputs'))}</h4><div class="grid">${PROC[proc].map(f => field(f, s)).join('')}</div>` +
      `<details class="xtal-sub-details"><summary>${esc(t('배합·비정질 입력', 'Blend and amorphous inputs'))}</summary><div class="grid">${BLEND.map(f => field(f, s)).join('')}</div></details>` +
      `<details class="xtal-sub-details"><summary>${esc(t('실측 kinetics (CSV)', 'Measured kinetics (CSV)'))}</summary><p class="hint">${esc(t('형식: figure_or_test,series,T_C,time_s,method,melt_T_C,melt_time_s,cooling_K_s,evidence. series에 half_time 또는 nuc_onset이 들어간 행을 곡선으로 씁니다. 비어 있으면 앵커 모드입니다.', 'Format: figure_or_test,series,T_C,time_s,method,melt_T_C,melt_time_s,cooling_K_s,evidence. Rows whose series contains half_time or nuc_onset become curves. Empty means anchor mode.'))}</p>` +
      `<textarea id="xtal_curves" data-xtal-text="curvesCSV" rows="4">${esc(s.curvesCSV || '')}</textarea></details>` +
      `<div class="row"><button type="button" class="btn primary" data-xtal-act="run">${esc(t('계산', 'Calculate'))}</button><button type="button" class="btn secondary" data-xtal-act="preset">${esc(t('시작 조건 다시 채우기', 'Refill start conditions'))}</button></div>` +
      `<div id="xtalResult" class="xtal-result" aria-live="polite"></div>` +
      `<div id="xtalRef" class="xtal-ref">${referenceHTML(proc)}</div>` +
      `<div id="xtalDoe" class="xtal-doe">${doeHTML(proc)}</div>` +
      `</div></details>`;
    if (lastResult && lastResult.process === proc) showResult(lastResult);
  }

  /* ---------- reference: presets, controls, conflicts ---------- */
  function referenceHTML(proc) {
    const D = window.PHACrystalData;
    if (!D) return '';
    const p = D.presets;
    let rows = '';
    if (proc === 'straw') rows = p.straw.stages.map(s => `<tr><td>${esc(t(s.ko, s.en))}</td><td>${s.start ?? t('입력값', 'input')}</td><td>${s.range.join('–')} ${esc(s.unit)}</td><td>${esc(s.role)}</td><td>${badge(s.evidence)} <span class="xtal-src">${esc(s.source)}</span></td></tr>`).join('');
    if (proc === 'injection') rows = p.injection.moldPresets.map(m => `<tr><td>${esc(t('금형 표면', 'Mold surface'))}</td><td>${m.T_C}</td><td>°C</td><td>${esc(m.situation)} · ${esc(m.criterion)}</td><td>${badge(m.evidence)} <span class="xtal-src">${esc(m.source)}</span></td></tr>`).join('');
    if (proc === 'sheet') rows = p.sheet.rolls.map(r => `<tr><td>${esc(r.name)}</td><td>${r.start}</td><td>${r.range.join('–')} ${esc(r.unit)}</td><td>${esc(r.role)}</td><td>${badge(r.evidence)}</td></tr>`).join('');
    const controls = proc === 'straw' ? `<h5>${esc(t('현행 control (사내 기록)', 'Current controls (in-house records)'))}</h5><div class="tablewrap"><table><thead><tr><th>${esc(t('라인', 'Line'))}</th><th>${esc(t('1차', 'Bath 1'))}</th><th>${esc(t('2차', 'Bath 2'))}</th><th>${esc(t('속도', 'Speed'))}</th><th>${esc(t('비고', 'Note'))}</th></tr></thead><tbody>` +
      p.straw.controls.map(c => `<tr><td>${esc(t(c.ko, c.en))}</td><td>${esc(c.bath1)}</td><td>${esc(c.bath2)}</td><td>${esc(c.speed)}</td><td>${esc(c.note)} ${badge(c.evidence)}</td></tr>`).join('') + `</tbody></table></div>`
      : proc === 'injection' ? `<h5>${esc(t('목적별 금형 프리셋 (병기)', 'Mold presets by purpose (side by side)'))}</h5><div class="tablewrap"><table><thead><tr><th>${esc(t('목적', 'Purpose'))}</th><th>${esc(t('금형', 'Mold'))} °C</th><th>${esc(t('출처', 'Source'))}</th></tr></thead><tbody>` +
        p.injection.purposePresets.map(x => `<tr><td>${esc(x.purpose)}</td><td>${esc(Array.isArray(x.mold_C) ? x.mold_C.join('–') : x.mold_C)}${x.coolingTime_s ? ` · ${esc(t('냉각', 'cooling'))} ${x.coolingTime_s.join('–')} s` : ''}</td><td>${badge(x.evidence)} <span class="xtal-src">${esc(x.source)}${x.note ? ' · ' + esc(x.note) : ''}</span></td></tr>`).join('') + `</tbody></table></div>`
        : `<p class="hint">${esc(p.sheet.note)} ${esc(t('기존 sticking 규칙', 'Existing sticking rule'))}: R2 ${p.sheet.stickingRule.R2_C.join('–')} °C, ${p.sheet.stickingRule.hold_C} °C — ${esc(p.sheet.stickingRule.note)}</p>`;
    const conflicts = p.conflicts.map(c => `<li><b>${esc(c.topic)}</b>: ${esc(t('작업지시서', 'work order'))} ${esc(c.workOrder)} | ${esc(t('기존', 'existing'))} ${esc(c.existing)} <span class="xtal-src">(${esc(c.existingSource)})</span></li>`).join('');
    return `<details class="xtal-sub-details"><summary>${esc(t('시작 조건과 control', 'Start conditions and controls'))}</summary>` +
      `<div class="tablewrap"><table><thead><tr><th>${esc(t('구간', 'Stage'))}</th><th>${esc(t('시작', 'Start'))}</th><th>${esc(t('비교 범위', 'Range'))}</th><th>${esc(t('역할', 'Role'))}</th><th>evidence</th></tr></thead><tbody>${rows}</tbody></table></div>${controls}</details>` +
      `<details class="xtal-sub-details"><summary>W07 · ${esc(t('기존값과 신규값 병기', 'Existing and new values side by side'))} (${p.conflicts.length})</summary><ul class="xtal-list">${conflicts}</ul></details>`;
  }

  /* ---------- run ---------- */
  function readInputs() {
    const s = state();
    // The toggle event that saves `open` is async; read the live state so a re-render right after opening keeps it open.
    const panel = host.querySelector('details.xtal-panel');
    if (panel) s.open = panel.open;
    host.querySelectorAll('[data-xtal]').forEach(el => { s[el.dataset.xtal] = el.value; });
    host.querySelectorAll('[data-xtal-sel]').forEach(el => { s[el.dataset.xtalSel] = el.value; });
    host.querySelectorAll('[data-xtal-chk]').forEach(el => { s[el.dataset.xtalChk] = el.checked; });
    host.querySelectorAll('[data-xtal-text]').forEach(el => { s[el.dataset.xtalText] = el.value; });
    save(STORE, s);
    return s;
  }
  function parseCurves(csv) {
    const out = { t_half: [], t_nuc_onset: [] };
    String(csv || '').split(/\r?\n/).slice(1).forEach(line => {
      const c = line.split(','); if (c.length < 4) return;
      const T = Number(c[2]), time = Number(c[3]);
      if (!(c[2] !== '' && c[3] !== '' && Number.isFinite(T) && Number.isFinite(time) && time > 0)) return;
      if (/half/i.test(c[1])) out.t_half.push({ T_C: T, time_s: time });
      else if (/nuc/i.test(c[1])) out.t_nuc_onset.push({ T_C: T, time_s: time });
    });
    return out;
  }
  function buildInput(s) {
    const base = { gradeId: s.gradeId || 'S1000P', hasNucleatingAgent: !!s.hasNucleatingAgent, tgShift: !!s.tgShift, Tg_C: num(s.Tg_C),
      thermal: { k_W_mK: num(s.k_W_mK), rho_kg_m3: num(s.rho_kg_m3), Tm_C: num(s.Tm_C) },
      A1000P_pct: num(s.A1000P_pct), A1000P_warnPct: num(s.A1000P_warnPct), handling_C: num(s.handling_C), tackSurface_C: num(s.tackSurface_C) };
    const curves = parseCurves(s.curvesCSV);
    if (curves.t_half.length >= 2 || curves.t_nuc_onset.length >= 2) base.measuredKinetics = curves;
    if (s.process === 'straw') {
      const baths = [];
      if (num(s.b1_L_m) !== undefined) baths.push({ name: t('1차', 'Bath 1'), L_m: num(s.b1_L_m), Twater_C: num(s.b1_T_C), h_W_m2K: num(s.b1_h), tRequired_s: num(s.b1_tReq) });
      if (num(s.b2_L_m) !== undefined) baths.push({ name: t('2차', 'Bath 2'), L_m: num(s.b2_L_m), Twater_C: num(s.b2_T_C), h_W_m2K: num(s.b2_h), tRequired_s: num(s.b2_tReq) });
      return Object.assign(base, { dieExit_C: num(s.dieExit_C), wall_mm: num(s.wall_mm), OD_mm: num(s.OD_mm), output_ea_min: num(s.output_ea_min), cutLength_m: num(s.cutLength_m),
        lineSpeed_m_min: num(s.lineSpeed_m_min), targetOutput_ea_min: num(s.targetOutput_ea_min), baths, sagOrOvality: !!s.sagOrOvality,
        gaps: num(s.g1_L_m) ? [{ L_m: num(s.g1_L_m), h_air_W_m2K: num(s.g1_h), Tair_C: num(s.g1_T_C) }] : [] });
    }
    if (s.process === 'injection') return Object.assign(base, { melt_C: num(s.melt_C), moldSurface_C: num(s.moldSurface_C), moldSetpoint_C: num(s.moldSetpoint_C), wall_mm: num(s.wall_mm),
      fillTime_s: num(s.fillTime_s), holdTime_s: num(s.holdTime_s), coolingTime_s: num(s.coolingTime_s), band_C: num(s.band_C), purpose: s.purpose || 'cycle', flashTiming: s.flashTiming || undefined });
    const roll = (n, contact) => num(s[n + '_D']) && num(s[n + '_wrap']) && num(s[n + '_T']) !== undefined ? { name: n, D_mm: num(s[n + '_D']), wrap_deg: num(s[n + '_wrap']), T_C: num(s[n + '_T']), contact } : null;
    const r1 = roll('R1', 'both');
    if (r1) r1.T_opposite_C = num(s.R2_T);
    return Object.assign(base, { matrix: s.plaMatrix ? 'PLA' : undefined, dieExit_C: num(s.dieExit_C), thickness_mm: num(s.thickness_mm), lineSpeed_m_min: num(s.lineSpeed_m_min),
      rolls: [r1, roll('R2', 'B'), roll('R3', 'A')].filter(Boolean), air_h_W_m2K: num(s.air_h), air_T_C: num(s.air_T),
      stickingControl_R2_C: num(s.stickingControl_R2_C), postReheat_C: num(s.postReheat_C), postReheatExposure_s: num(s.postReheatExposure_s) });
  }
  function run() {
    if (!window.PHACrystalProcess) return;
    const s = readInputs();
    const r = PHACrystalProcess.run(s.process, buildInput(s));
    lastResult = r;
    showResult(r);
  }

  /* ---------- chart (inline SVG) ---------- */
  function chartSVG(profile, zones) {
    const W = Math.max(300, Math.round((host?.clientWidth || 700) - 40)), H = 260, m = { l: 44, r: 12, t: 12, b: 34 };
    const tMax = profile.t_s[profile.t_s.length - 1] || 1;
    const all = [].concat(profile.T_surfaceA, profile.T_center, profile.T_mean, profile.T_surfaceB);
    const yMin = Math.min(0, Math.floor(Math.min(...all) / 10) * 10), yMax = Math.ceil(Math.max(...all) / 10) * 10 + 10;
    const x = v => m.l + (W - m.l - m.r) * v / tMax, y = v => m.t + (H - m.t - m.b) * (1 - (v - yMin) / (yMax - yMin));
    const band = ([lo, hi], cls) => `<rect class="${cls}" x="${m.l}" y="${y(hi)}" width="${W - m.l - m.r}" height="${Math.max(0, y(lo) - y(hi))}"/>`;
    const path = (arr, cls) => {
      const step = Math.max(1, Math.floor(arr.length / 600));
      let d = ''; for (let i = 0; i < arr.length; i += step) d += (d ? 'L' : 'M') + x(profile.t_s[i]).toFixed(1) + ',' + y(arr[i]).toFixed(1);
      d += 'L' + x(profile.t_s[arr.length - 1]).toFixed(1) + ',' + y(arr[arr.length - 1]).toFixed(1);
      return `<path class="${cls}" d="${d}"/>`;
    };
    const ticksY = []; const stepY = (yMax - yMin) > 120 ? 40 : 20; for (let v = Math.ceil(yMin / stepY) * stepY; v <= yMax; v += stepY) ticksY.push(v);
    const seg = profile.segments.map(sg => `<line class="xtal-seg" x1="${x(sg.start_s)}" x2="${x(sg.start_s)}" y1="${m.t}" y2="${H - m.b}"/><text class="xtal-seg-label" x="${x(sg.start_s) + 3}" y="${m.t + 10}">${esc(sg.name)}</text>`).join('');
    return `<svg class="xtal-chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('수지 온도 이력', 'Resin temperature history'))}">` +
      band(zones.nucleation, 'xtal-band-nuc') + band(zones.crystallization, 'xtal-band-cryst') + band(zones.growth, 'xtal-band-growth') +
      ticksY.map(v => `<line class="xtal-grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="xtal-axis" x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('') +
      seg + path(profile.T_surfaceA, 'xtal-line-surface') + path(profile.T_mean, 'xtal-line-mean') + path(profile.T_center, 'xtal-line-center') +
      `<text class="xtal-axis" x="${(W + m.l) / 2}" y="${H - 6}" text-anchor="middle">${esc(t('시간', 'Time'))} (s) · 0–${fmt(tMax, 2)}</text>` +
      `<text class="xtal-axis" x="12" y="${m.t + 4}">°C</text></svg>` +
      `<div class="xtal-legend"><span class="xtal-key xtal-key-surface"></span>${esc(t('표면', 'Surface'))} <span class="xtal-key xtal-key-center"></span>${esc(t('중심', 'Centre'))} <span class="xtal-key xtal-key-mean"></span>${esc(t('두께 평균', 'Mean'))} ` +
      `<span class="xtal-key xtal-band-nuc"></span>${zones.nucleation.join('–')} °C <span class="xtal-key xtal-band-cryst"></span>${zones.crystallization.join('–')} °C <span class="xtal-key xtal-band-growth"></span>${zones.growth.join('–')} °C</div>`;
  }

  /* ---------- results ---------- */
  function card(title, body) { return `<div class="xtal-card"><h5>${esc(title)}</h5>${body}</div>`; }
  function showResult(r) {
    const box = host && host.querySelector('#xtalResult');
    if (!box) return;
    const parts = [];
    const g = r.grade;
    if (g) {
      const a = g.measuredAnchor;
      const preset = (window.PHACrystalData && window.PHACrystalData.presets.grades[g.gradeId]) || {};
      const makeup = preset.composition || preset.basis;
      const mode = {
        crystallizable: g.uncalibrated ? t('미보정 참고값 (순수 P3HB 논문값)', 'Uncalibrated reference (pure-P3HB literature)')
          : g.kineticsSource === 'measured' ? t('실측 kinetics', 'Measured kinetics')
          : g.kineticsSource === 'measured_anchor' ? t(`${a.T_C} °C 실측 t½ 1점 보정 · lot ${a.lot} ${a.t_half_s.toFixed(1)} s`, `One measured t½ at ${a.T_C} °C · lot ${a.lot} ${a.t_half_s.toFixed(1)} s`)
          : t('논문값 (확인됨)', 'Literature values (confirmed)'),
        blend: t('결정상 판정', 'Crystalline phase judged') + ' · ' + (g.uncalibrated ? t('미보정 참고값', 'uncalibrated reference') : t('실측 kinetics', 'measured kinetics')),
        amorphous: t('비정질: 결정화 판정 비활성', 'Amorphous: crystallization judgement off'),
        unknown: t('분류 필요: 결정화 판정 비활성', 'Classification needed: crystallization judgement off'),
        out_of_scope: L(g.display) + (makeup ? ` · ${makeup.value}` : ''),
      }[g.mode];
      parts.push(`<div class="xtal-banner xtal-mode-${esc(g.mode)}">${esc(g.gradeId)} · ${esc(mode || '')}</div>`);
    }
    if (r.message) parts.push(`<p class="xtal-error">${esc(L(r.message))}</p>`);
    if (r.supported === false) parts.push(`<p class="hint">${esc(L(r.text))}</p>`);
    const h = r.history;
    if (r.profile && !r.profile.error) parts.push(`<div class="xtal-chart-wrap">${chartSVG(r.profile, h ? h.zones : { nucleation: [30, 40], crystallization: [60, 70], growth: [80, 90] })}</div>`);
    const cards = [];
    if (r.residence) cards.push(card(t('수조 체류', 'Bath residence'), `<p>${t('라인 속도', 'Line speed')} ${fmt(r.lineSpeed_m_min)} m/min</p><ul>${r.residence.map(x => `<li>${esc(x.name)} ${fmt(x.L_m, 2)} m → ${fmt(x.residence_s, 3)} s</li>`).join('')}</ul>`));
    if (h) {
      const pos = ['surface', 'center', 'mean'];
      const name = { surface: t('표면', 'Surface'), center: t('중심', 'Centre'), mean: t('평균', 'Mean') };
      const zoneRow = z => `<tr><th>${esc({ nucleation: t('핵생성', 'Nucleation'), crystallization: t('결정화', 'Crystallization'), growth: t('성장', 'Growth') }[z])} ${h.zones[z].join('–')} °C</th>${pos.map(p => { const v = h.positions[p].residence[z]; return `<td>${fmt(v.total, 2)} s<br><span class="xtal-src">↓${fmt(v.cooling, 2)} ↑${fmt(v.reheating, 2)}</span></td>`; }).join('')}</tr>`;
      cards.push(card(t('구간 체류 (s)', 'Zone residence (s)'), `<div class="tablewrap"><table><thead><tr><th></th>${pos.map(p => `<th>${esc(name[p])}</th>`).join('')}</tr></thead><tbody>${['nucleation', 'crystallization', 'growth'].map(zoneRow).join('')}</tbody></table></div><p class="xtal-src">↓ ${esc(t('냉각 중', 'cooling'))} ↑ ${esc(t('재가열 중', 'reheating'))}</p>`));
      const cr = (c, alt) => !c.applicable ? t('해당 없음', 'n/a') : `${fmt(c.rate_K_s, 2)} K/s${c.reached ? '' : ` (${t('최저', 'lowest')} ${fmt(c.lowest_C)} °C ${t('까지', 'reached')})`} → ${c.suppressed ? t('억제', 'suppressed') : t('미억제', 'not suppressed')} (${c.threshold_K_s}${alt ? `; ${c.thresholdAlt_K_s}: ${c.suppressedAlt ? t('억제', 'suppressed') : t('미억제', 'not suppressed')}` : ''} K/s)`;
      cards.push(card(t('냉각속도 비교 (중심)', 'Cooling-rate check (centre)'), `<p>CR1 140→60 °C: ${esc(cr(h.positions.center.CR1))}</p><p>CR2 70→${fmt(h.Tg_C)} °C: ${esc(cr(h.positions.center.CR2, true))}</p>`));
      const c = h.positions.center;
      cards.push(card(h.mode === 'anchor' ? t('앵커 비율 (순위 지표, 결정화도 아님)', 'Anchor ratio (rank index, not crystallinity)') : t('진행지수 N·P (비교용)', 'Progress indices N, P (comparison only)'),
        h.mode === 'anchor' ? `<p>${t('결정화', 'Crystallization')} ${fmt(c.anchorRatio.crystallization, 3)} · ${t('핵생성', 'Nucleation')} ${fmt(c.anchorRatio.nucleation, 2)}</p>`
          : `<p>N ${c.N ? fmt(c.N.value, 3) : '—'} · P ${c.P ? fmt(c.P.value, 3) : '—'}</p>`));
    }
    if (r.amorphous) cards.push(card(t('비정질 판정', 'Amorphous checks'), `<p>${r.amorphous.handling ? `${t('취급 온도', 'Handling')} ${r.amorphous.handling.target_C} °C: ${fmt(r.amorphous.handling.time_s, 2)} s` : t('취급 온도 미입력', 'Handling temperature not entered')}</p>${r.amorphous.tack ? `<p>${t('표면 최종', 'Final surface')} ${fmt(r.amorphous.tack.surfaceEnd_C)} °C ${r.amorphous.tack.warn ? '> ' : '≤ '}${r.amorphous.tack.threshold_C} °C</p>` : ''}<ul>${r.amorphous.checks.map(x => `<li>${esc(L(x))}</li>`).join('')}</ul>`));
    const surv = r.survival && (r.survival.center || r.survival);
    if (surv && surv.status) cards.push(card(t('핵 생존 (균일 핵만)', 'Nuclei survival (homogeneous only)'), `<p>${esc({ keep: t('유지', 'keep'), partial_loss_risk: t('부분 소실 위험', 'partial loss risk'), lost: t('소실', 'lost'), not_applicable: t('해당 없음 (0–50 °C 미통과)', 'n/a (never in 0–50 °C)') }[surv.status])}${Number.isFinite(surv.T_peak_after_C) ? ` · T_peak ${fmt(surv.T_peak_after_C)} °C` : ''}</p>`));
    if (r.speed) cards.push(card(t('속도 상한·필요 길이', 'Speed limit and required length'), `<p>v_max ${r.speed.vmax_m_min === null ? t('필요시간 미입력', 'required time not entered') : fmt(r.speed.vmax_m_min) + ' m/min'}</p><ul>${r.speed.rows.map(x => `<li>${esc(x.name)}: ${fmt(x.residence_s, 3)} s${x.tRequired_s !== null ? ` / ${t('필요', 'need')} ${fmt(x.tRequired_s, 2)} s → L ${fmt(x.Lrequired_m, 2)} m` : ''}</li>`).join('')}</ul>` +
      (r.bath1TimeToTarget ? `<p>${t('1차 중심', 'Bath-1 centre')} ≤ ${r.bath1TimeToTarget.target_C} °C: ${r.bath1TimeToTarget.time_s === null ? t('도달 못함', 'not reached') : fmt(r.bath1TimeToTarget.time_s, 2) + ' s'} ${badge('estimated')}</p>` : '') +
      (r.speedUp ? `<p>${t('동일 체류 증속', 'Same-residence speed-up')}: ${r.speedUp.map(x => `${esc(x.name)} ${fmt(x.L_old_m, 2)} → ${fmt(x.L_new_m, 2)} m`).join(', ')}${r.speedUpPlan ? ` · ${t('사내 계획', 'plan')} ${r.speedUpPlan.bath2Plan_L_m.join('–')} m` : ''}</p>` : '')));
    if (r.contact) cards.push(card(t('롤 접촉시간', 'Roll contact time'), `<ul>${r.contact.map(x => `<li>${esc(x.name)} ${x.T_C} °C: ${fmt(x.contact_s, 3)} s</li>`).join('')}</ul>`));
    if (r.centerInBand) cards.push(card(t('중심 band 도달', 'Centre within band'), `<p>±${r.centerInBand.band_C} K: ${r.centerInBand.time_s === null ? t('도달 못함', 'not reached') : fmt(r.centerInBand.time_s, 2) + ' s'}</p>`));
    if (r.rules && r.rules.length) cards.push(card(t('판정 규칙', 'Rules'), `<ul>${r.rules.map(x => `<li><b>${esc(x.rule)}</b> ${x.label ? esc(L(x.label)) : ''}${x.text ? esc(L(x.text)) : ''}${x.rule === 'S1' ? `${t('2차 입구 T_mean', 'Bath-2 entry T_mean')} ${fmt(x.entry_T_mean_C)} °C / ${t('수온', 'water')} ${x.water_C} °C` : ''}${x.rule === 'H1' ? ` · max ΔT_AB ${fmt(x.maxDeltaAB_C)} K` : ''}${x.actions ? `<ul>${x.actions.map(a => `<li>${esc(L(a))}</li>`).join('')}</ul>` : ''}${x.checks ? `<ul>${x.checks.map(a => `<li>${esc(L(a))}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>`));
    if (r.badge) cards.push(card(L(r.badge), `<ul>${r.checks.map(x => `<li><label><input type="checkbox"> ${esc(L(x))}</label></li>`).join('')}</ul>`));
    parts.push(`<div class="xtal-cards">${cards.join('')}</div>`);
    if (r.warnings && r.warnings.length) parts.push(`<div class="xtal-warnings"><h5>${esc(t('경고', 'Warnings'))}</h5><ul>${r.warnings.map(w => `<li class="xtal-w xtal-w-${esc(w.code)}"><b>${esc(w.code)}</b> ${esc(lang() === 'en' ? w.en : w.ko)}${w.detail ? ` <span class="xtal-src">(${esc(w.detail)})</span>` : ''}</li>`).join('')}</ul></div>`);
    if (r.profile && r.profile.cpWarning) parts.push(`<p class="xtal-src">cp: ${esc(r.profile.cpWarning)} · Δt ${r.profile.dt_s.toExponential(2)} s${r.profile.dtReduced ? ' (' + t('안정 조건으로 축소', 'reduced for stability') + ')' : ''} · ${r.profile.nodes} ${t('격자', 'nodes')}</p>`);
    box.innerHTML = parts.join('');
  }

  /* ---------- DOE ---------- */
  function doeHTML(proc) {
    if (!window.PHACrystalDOE) return '';
    const d = PHACrystalDOE.DESIGNS[proc];
    const saved = load(DOE_STORE) || {};
    return `<details class="xtal-sub-details"><summary>DOE · ${esc(t('온도 screening 후 속도 상승', 'Temperature screening, then speed ramp'))}</summary>` +
      `<p><b>${esc(t('가설', 'Hypothesis'))}</b>: ${esc(L(d.hypothesis))}</p>` +
      `<p>${esc(t('인자', 'Factors'))}: ${d.factors.map(f => `${esc(f.name)} ${f.levels.join('·')} ${esc(f.unit)}`).join(' × ')}${d.fixed ? ` · ${esc(t('고정', 'fixed'))} ${Object.entries(d.fixed).map(([k, v]) => `${k} ${v}`).join(', ')}` : ''} · ${esc(t('주 판정', 'Responses'))}: ${d.responses.map(L).map(esc).join(', ')}</p>` +
      `<ul class="xtal-list">${PHACrystalDOE.FIXED.map(x => `<li>${esc(L(x))}</li>`).join('')}</ul>` +
      `<div class="grid"><div class="group"><label for="xtal_reps">${esc(t('조건당 반복 수', 'Runs per condition'))}</label><input id="xtal_reps" type="number" min="1" step="1" value="${esc(saved.reps || 1)}"></div>` +
      `<div class="group"><label for="xtal_delta">${esc(t('실용 차이 임계값', 'Practical threshold'))} (%)</label><input id="xtal_delta" type="number" step="any" value="${esc(saved.delta ?? '')}"></div></div>` +
      `<div class="row"><button type="button" class="btn secondary" data-xtal-act="doe-csv">${esc(t('실험표 CSV 내려받기', 'Download run sheet CSV'))}</button></div>` +
      `<label for="xtal_doe_results">${esc(t('결과 붙여넣기 CSV: condition,speed,pass_t0,pass_24h,pass_7d (control 행은 condition에 control). 사출은 speed에 cycle(s)', 'Paste results CSV: condition,speed,pass_t0,pass_24h,pass_7d (control rows named control). For injection, speed = cycle (s)'))}</label>` +
      `<textarea id="xtal_doe_results" rows="5">${esc(saved.results || '')}</textarea>` +
      `<div class="row"><button type="button" class="btn primary" data-xtal-act="doe-decide">${esc(t('판정', 'Decide'))}</button></div><div id="xtalDoeOut"></div></details>`;
  }
  function download(name, text) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }
  function doeCSV() {
    const s = readInputs();
    const reps = Math.max(1, parseInt(host.querySelector('#xtal_reps').value, 10) || 1);
    const sheet = PHACrystalDOE.screening(s.process, { reps, grade: s.gradeId });
    save(DOE_STORE, Object.assign(load(DOE_STORE) || {}, { reps }));
    download(`xtal-doe-${s.process}.csv`, PHACrystalDOE.toCSV(sheet.rows));
  }
  function doeDecide() {
    const s = readInputs();
    const text = host.querySelector('#xtal_doe_results').value, delta = num(host.querySelector('#xtal_delta').value);
    save(DOE_STORE, Object.assign(load(DOE_STORE) || {}, { results: text, delta }));
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length && /condition/i.test(lines[0])) lines.shift();
    const rows = lines.map(l => { const c = l.split(','); return { condition: c[0], speed: Number(c[1]), pass_t0: c[2], pass_24h: c[3], pass_7d: c[4] }; });
    const d = PHACrystalDOE.decide(rows, { process: s.process, practicalDelta_pct: delta });
    const out = host.querySelector('#xtalDoeOut');
    out.innerHTML = `<div class="tablewrap"><table><thead><tr><th>${esc(t('조건', 'Condition'))}</th><th>${esc(t('평균 ± SD', 'Mean ± SD'))}</th><th>n</th><th>${esc(t('판정', 'Status'))}</th></tr></thead><tbody>` +
      d.summary.map(x => `<tr><td>${esc(x.condition)}</td><td>${fmt(x.mean)} ± ${fmt(x.sd)}</td><td>${x.n}/${x.nTotal}</td><td>${x.label ? esc(L(x.label)) : (x.allPass ? esc(t('3시점 합격', 'pass at 3 times')) : esc(t('불합격 포함', 'has failures')))}</td></tr>`).join('') + `</tbody></table></div>` +
      `<p><b>${esc(d.best ? d.best.condition : '—')}</b>${d.improvement_pct !== null ? ` · ${fmt(d.improvement_pct)} % ${esc(t('vs control', 'vs control'))}` : ''}${d.stats ? ` · Welch t ${fmt(d.stats.t, 2)}, df ${fmt(d.stats.df, 1)}, p ${fmt(d.stats.p, 3)}` : ''}${delta === undefined ? ` · ${esc(t('실용 차이 임계값 미입력', 'practical threshold not entered'))}` : ''}</p>` +
      `<p>${esc(L(d.action))}</p>${d.secondaryCrystallization.map(x => `<p>${esc(x.condition)}: ${esc(L(x.text))}</p>`).join('')}`;
  }

  /* ---------- wiring ---------- */
  function onClick(e) {
    const act = e.target.closest('[data-xtal-act]');
    if (!act) return;
    if (act.dataset.xtalAct === 'run') run();
    if (act.dataset.xtalAct === 'preset') {
      const s = readInputs();
      [].concat(...Object.values(PROC)).forEach(f => { if (f.preset) delete s[f.id]; });
      save(STORE, s); render();
    }
    if (act.dataset.xtalAct === 'doe-csv') doeCSV();
    if (act.dataset.xtalAct === 'doe-decide') doeDecide();
  }
  function onChange(e) {
    if (e.target.matches('[data-xtal-sel="process"]')) { readInputs(); lastResult = null; render(); }
    else if (e.target.matches('[data-xtal-sel="gradeId"]')) { readInputs(); }
  }
  function attach() {
    const proc = document.getElementById('proc');
    if (!proc || document.getElementById('xtalPanel')) return;
    host = document.createElement('div');
    host.id = 'xtalPanel';
    const anchor = document.getElementById('hmiPanel');
    if (anchor && anchor.parentNode === proc) anchor.insertAdjacentElement('afterend', host); else proc.appendChild(host);
    host.addEventListener('click', onClick);
    host.addEventListener('change', onChange);
    host.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('xtal-panel')) { const s = state(); s.open = e.target.open; save(STORE, s); } }, true);
    render();
  }
  window.addEventListener('pha-language-change', () => { if (host) { readInputs(); render(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach); else attach();
  window.PHACrystalPanel = { attach, render, run, buildInput, parseCurves };
})();
