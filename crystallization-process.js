/* Process modules for the crystallization-history engine: straw (2-bath), injection, sheet (3-roll) and stubs.
   Start conditions are estimates for an S1000P-based compound with A1000P, filler and nucleant; they are
   always shown next to the current control. Work order chapters 6–7 (2026-10-29). */
(function (root) {
  'use strict';
  const E = root.PHACrystalEngine || (typeof require === 'function' ? require('./crystallization-engine.js') : null);
  const D = () => root.PHACrystalData || (typeof require === 'function' ? require('./crystallization-data.js') : null);
  const finite = x => typeof x === 'number' && Number.isFinite(x);
  const msg = (ko, en) => ({ ko, en });
  const uniq = list => { const seen = new Set(); return list.filter(w => !seen.has(w.code) && seen.add(w.code)); };

  /* ---------- chapter 7: grade branching ---------- */
  // A grade's single measured isothermal t½ (preset tHalf60, in min) replaces only the crystallization anchor.
  // proxyOf marks a value measured on a similar compound rather than the grade itself.
  function measuredAnchor(g) {
    const m = g.tHalf60;
    if (!m || m.unit !== 'min' || !finite(m.value)) return null;
    return { t_half_s: m.value * 60, T_C: m.T_C, lot: m.lot, evidence: m.evidence, proxyOf: m.proxyOf || null };
  }
  function gradeProfile(gradeId, opts) {
    const o = opts || {};
    const presets = D().presets;
    const g = o.matrix === 'PLA' ? { mode: 'out_of_scope', display: msg('PLA 매트릭스: 대상 외', 'PLA matrix: out of scope') }
      : presets.grades[gradeId] || { mode: 'unknown', kineticsRef: null, display: '분류 필요' };
    if (g.mode === 'out_of_scope') return { gradeId, mode: g.mode, moduleOn: false, display: g.display, warnings: [E.warning('W14')] };
    const warnings = [];
    let moduleOn = g.mode === 'crystallizable' || g.mode === 'blend';
    let kineticsSource = 'paper', kin = E.kinetics('P3HB_REF_2026'), anchor = null;
    if (o.measuredKinetics && ((o.measuredKinetics.t_half || []).length >= 2 || (o.measuredKinetics.t_nuc_onset || []).length >= 2)) {
      kin = JSON.parse(JSON.stringify(kin));
      kin.curves = { t_half: o.measuredKinetics.t_half || [], t_nuc_onset: o.measuredKinetics.t_nuc_onset || [] };
      kineticsSource = 'measured';
    } else if ((anchor = measuredAnchor(g))) {
      kin = JSON.parse(JSON.stringify(kin));
      kin.anchors.t_half_min_s = anchor.t_half_s;
      kineticsSource = anchor.proxyOf ? 'proxy_anchor' : 'measured_anchor';
    }
    if (g.mode === 'amorphous') { moduleOn = false; warnings.push(E.warning('W10')); }
    else if (kineticsSource === 'measured_anchor') warnings.push(E.warning('W13', `${anchor.lot} · t½ ${anchor.t_half_s.toFixed(1)} s @ ${anchor.T_C} °C`));
    else if (kineticsSource === 'proxy_anchor') warnings.push(E.warning('W15', `${anchor.proxyOf} (${anchor.lot}) · t½ ${anchor.t_half_s.toFixed(1)} s @ ${anchor.T_C} °C`));
    else if (gradeId !== 'P3HB_REF_2026' && kineticsSource === 'paper') warnings.push(E.warning('W02'));
    let nucleationZone = null;
    if (o.tgShift && finite(o.Tg_C)) nucleationZone = { value: [o.Tg_C + 25, o.Tg_C + 35], unit: '°C', evidence: 'estimated', source: 'Tg + 30 K relation (Fig. 6c), measured Tg' };
    return {
      gradeId, mode: g.mode, moduleOn, display: g.display, kineticsSource, kinetics: kin, measuredAnchor: anchor,
      hasNucleatingAgent: !!(o.hasNucleatingAgent || g.hasNucleatingAgent), nucleationZone,
      uncalibrated: gradeId !== 'P3HB_REF_2026' && kineticsSource === 'paper', warnings,
    };
  }
  function thermalInputs(th) {
    const t = th || {};
    return { k_W_mK: t.k_W_mK, rho_kg_m3: t.rho_kg_m3, cp: { solid: (t.cp && t.cp.solid) || 1.858, liquid: (t.cp && t.cp.liquid) || 2.073, Tm_C: t.Tm_C } };
  }
  function analyse(profile, grade, extra) {
    if (!profile || profile.error) return null;
    const opts = Object.assign({ kinetics: grade.kinetics, Tg_C: extra && extra.Tg_C }, extra || {});
    if (grade.nucleationZone) opts.nucleationZone_C = grade.nucleationZone.value;
    return E.history(profile, opts);
  }
  function timeToReach(profile, key, target_C) {
    const T = profile[key];
    for (let i = 0; i < T.length; i++) if (T[i] <= target_C) return profile.t_s[i];
    return null;
  }
  function amorphousOutputs(profile, input) {
    const out = { handling: null, tack: null, checks: [msg('냉각 후 변형 확인', 'Check deformation after cooling')] };
    if (profile && !profile.error && finite(input.handling_C)) out.handling = { target_C: input.handling_C, time_s: timeToReach(profile, 'T_center', input.handling_C) };
    if (profile && !profile.error && finite(input.tackSurface_C)) {
      const last = profile.T_surfaceA[profile.T_surfaceA.length - 1];
      out.tack = { threshold_C: input.tackSurface_C, surfaceEnd_C: last, warn: last > input.tackSurface_C };
    }
    return out;
  }
  function blendWarnings(input) {
    const w = [];
    if (finite(input.A1000P_pct) && finite(input.A1000P_warnPct) && input.A1000P_pct >= input.A1000P_warnPct) {
      w.push({ code: 'TACK', ko: `A1000P ${input.A1000P_pct} (사용자 입력 단위) ≥ 경고 임계 ${input.A1000P_warnPct}: tack·강성 영향 확인`, en: `A1000P ${input.A1000P_pct} (user unit) ≥ warning threshold ${input.A1000P_warnPct}: check tack and stiffness` });
    }
    return w;
  }
  const BADGE_SECONDARY = msg('상온 2차 결정화 진행', 'Secondary crystallization continues at room temperature');
  const AGING_CHECKS = [msg('즉시 치수·물성', 'Dimensions and properties immediately'), msg('24 h 치수·물성', 'Dimensions and properties at 24 h'), msg('7 d 치수·물성', 'Dimensions and properties at 7 d')];

  /* ---------- 6.1 straw ---------- */
  function straw(input) {
    const p = input || {};
    const grade = gradeProfile(p.gradeId || 'S1000P', p);
    const warnings = [].concat(grade.warnings, blendWarnings(p));
    const v = finite(p.lineSpeed_m_min) ? p.lineSpeed_m_min
      : (finite(p.output_ea_min) && finite(p.cutLength_m) ? E.lineSpeed_m_min(p.output_ea_min, p.cutLength_m) : null);
    const baths = Array.isArray(p.baths) ? p.baths : [];
    const gaps = Array.isArray(p.gaps) ? p.gaps : [];
    const result = { process: 'straw', grade, lineSpeed_m_min: v, presets: D().presets.straw, rules: [], checks: [], warnings };
    if (!finite(v) || !(v > 0)) { result.error = 'line_speed'; result.message = msg('생산량(ea/min)과 절단 길이(m) 또는 라인 속도(m/min)를 입력하세요', 'Enter output (ea/min) and cut length (m), or line speed (m/min)'); return result; }
    result.residence = baths.map(b => ({ name: b.name, L_m: b.L_m, residence_s: finite(b.L_m) ? E.residence_s(b.L_m, v) : null }));

    // Segments: bath, air gap, bath ... Outer wall = side A, inner wall = side B.
    const inner = p.innerBC === 'convective' ? { type: 'convective', h_W_m2K: p.inner_h_W_m2K, Tinf_C: p.inner_T_C } : { type: 'adiabatic' };
    const segments = [];
    baths.forEach((b, i) => {
      segments.push({ name: b.name, duration_s: E.residence_s(b.L_m, v), A: { type: 'convective', h_W_m2K: b.h_W_m2K, Tinf_C: b.Twater_C }, B: inner, bath: i });
      const g = gaps[i];
      if (g && finite(g.L_m) && g.L_m > 0 && i < baths.length - 1) segments.push({ name: `gap ${i + 1}`, duration_s: E.residence_s(g.L_m, v), A: { type: 'convective', h_W_m2K: g.h_air_W_m2K, Tinf_C: g.Tair_C }, B: inner });
    });
    const th = thermalInputs(p.thermal);
    const profile = E.thermal1d(Object.assign({ thickness_mm: p.wall_mm, T0_C: p.dieExit_C, segments, nodes: p.nodes }, th));
    result.profile = profile;
    if (profile.error) { result.warnings = uniq(result.warnings.concat(profile.warnings || [])); result.stopped = true; }

    if (!profile.error) {
      result.history = grade.moduleOn ? analyse(profile, grade, { Tg_C: p.Tg_C }) : null;
      if (!grade.moduleOn && grade.mode === 'amorphous') result.amorphous = amorphousOutputs(profile, p);
      const seg = name => profile.segments.find(s => s.name === name);
      const idxAt = time => { let k = 0; while (k < profile.t_s.length - 1 && profile.t_s[k] < time - 1e-9) k++; return k; };
      // S1: T_mean at bath-2 entry above the bath-2 water temperature.
      if (baths.length >= 2) {
        const s2 = seg(baths[1].name), entry = profile.T_mean[idxAt(s2.start_s)];
        const s1 = { rule: 'S1', entry_T_mean_C: entry, water_C: baths[1].Twater_C, cooling: entry > baths[1].Twater_C };
        result.rules.push(s1);
        if (s1.cooling) result.warnings.push(E.warning('W01', `${entry.toFixed(1)} °C > ${baths[1].Twater_C} °C`));
        // S2: path classification from the centre temperature.
        const s1seg = seg(baths[0].name);
        const i0 = idxAt(s1seg.start_s), i1 = idxAt(s1seg.end_s), i2 = idxAt(s2.end_s);
        const nucHi = grade.nucleationZone ? grade.nucleationZone.value[1] : 40;
        const minBath1 = Math.min(...profile.T_center.slice(i0, i1 + 1));
        const maxBath2 = Math.max(...profile.T_center.slice(i1, i2 + 1));
        const path = minBath1 <= nucHi && maxBath2 > minBath1 + 0.5 ? 'nucleation_reheat' : 'continuous_cooling';
        result.rules.push({ rule: 'S2', path, minCenterBath1_C: minBath1, maxCenterBath2_C: maxBath2,
          label: path === 'nucleation_reheat' ? msg('저온 핵생성 --> 재가열 성장 경로', 'Low-T nucleation --> reheat growth path') : msg('연속 냉각 경로', 'Continuous cooling path') });
      }
      result.survival = { center: E.nucleiSurvival(profile.t_s, profile.T_center, { kinetics: grade.kinetics }), surface: E.nucleiSurvival(profile.t_s, profile.T_surfaceA, { kinetics: grade.kinetics }) };
      // S6 helper: time for the centre to reach the bath-1 target from die exit under bath-1 conditions.
      if (baths[0]) {
        const target = finite(p.bath1Target_C) ? p.bath1Target_C : 40;
        const long = E.thermal1d(Object.assign({ thickness_mm: p.wall_mm, T0_C: p.dieExit_C, nodes: p.nodes, segments: [{ duration_s: Math.max(30, 20 * E.residence_s(baths[0].L_m, v)), A: { type: 'convective', h_W_m2K: baths[0].h_W_m2K, Tinf_C: baths[0].Twater_C }, B: inner }] }, th));
        result.bath1TimeToTarget = { target_C: target, time_s: long.error ? null : timeToReach(long, 'T_center', target), evidence: 'estimated' };
      }
    }
    // S3 nucleant, S4 sag/ovality.
    if (grade.hasNucleatingAgent) result.rules.push({ rule: 'S3', text: msg('핵제 배합: 형상 유지에 필요한 최소 1차 체류를 우선 권고. 40°C 핵 추가 이득보다 냉각·재가열 시간 손실이 클 수 있음(판단됨)', 'Nucleated compound: prefer the minimum bath-1 dwell that holds the shape. Extra 40 °C nucleation may cost more cooling and reheating time than it gains (judged)') });
    if (p.sagOrOvality) result.rules.push({ rule: 'S4', compare_C: [25, 30], text: msg('1차 25–30°C 비교안 추가. 과도한 냉각은 재가열 부담을 늘림', 'Add a 25–30 °C bath-1 comparison. Over-cooling raises the reheating load') });
    // S5 sensible heat ratio.
    result.rules.push({ rule: 'S5', ratio: E.sensibleHeatRatio(190, 170, 70), text: msg('다이 출구 190°C는 170°C 대비 70°C까지 제거할 현열 1.20배(20% 증가). 냉각시간 증가율은 열전달 조건에 따라 다름', 'A 190 °C die exit carries 1.20× the sensible heat of 170 °C down to 70 °C (+20 %). The cooling-time increase depends on heat transfer'),
      checks: [msg('수조 유량', 'Bath flow rate'), msg('유입부 수온', 'Inlet water temperature'), msg('실제 벽 온도', 'Actual wall temperature'), msg('용융 체류시간·전단 이력 기록', 'Record melt residence and shear history')] });
    // S6 speed limit and lengths.
    const segsReq = baths.map(b => ({ name: b.name, L_m: b.L_m, tRequired_s: finite(b.tRequired_s) ? b.tRequired_s : null }));
    result.speed = E.speedCheck(segsReq, v);
    result.warnings = result.warnings.concat(result.speed.warnings);
    if (finite(p.targetOutput_ea_min) && finite(p.output_ea_min)) {
      result.speedUp = baths.map(b => ({ name: b.name, L_old_m: b.L_m, L_new_m: E.sameResidenceLength_m(b.L_m, p.output_ea_min, p.targetOutput_ea_min) }));
      const plan = D().presets.straw.controls.find(c => c.bath2Plan_L_m);
      if (plan) result.speedUpPlan = { bath2Plan_L_m: plan.bath2Plan_L_m, source: plan.source };
    }
    // S7 secondary crystallization badge.
    result.badge = BADGE_SECONDARY; result.checks = AGING_CHECKS;
    result.warnings = uniq(result.warnings.concat(result.history ? result.history.warnings : [], result.survival ? result.survival.center.warnings : []));
    return result;
  }

  /* ---------- 6.2 injection ---------- */
  const FLASH_ACTIONS = {
    fill: [msg('충전 말단 감속', 'Slow the end of fill'), msg('속도–압력 전환 시점 확인', 'Check the V/P switchover point'), msg('파팅면·벤트·형체 상태 확인', 'Check parting line, vents and clamp')],
    hold: [msg('필요한 최소 보압 탐색', 'Find the minimum hold pressure needed')],
    cycle: [msg('제품 중량 증가가 멈추는 gate sealing 시점으로 보압시간 결정', 'Set hold time at gate seal, where part weight stops rising')],
  };
  function injection(input) {
    const p = input || {};
    const grade = gradeProfile(p.gradeId || 'CB0104A', p);
    const warnings = [].concat(grade.warnings, blendWarnings(p));
    const presets = D().presets.injection;
    const result = { process: 'injection', grade, presets, rules: [], checks: AGING_CHECKS, badge: BADGE_SECONDARY, warnings };
    // I1 cavity surface first.
    let mold = p.moldSurface_C, moldBasis = 'surface';
    if (!finite(mold) && finite(p.moldSetpoint_C)) { mold = p.moldSetpoint_C; moldBasis = 'setpoint'; warnings.push(E.warning('W11')); }
    result.mold = { value_C: finite(mold) ? mold : null, basis: moldBasis };
    // I4: no automatic transfer of straw melt temperatures.
    if (!finite(p.melt_C)) { result.error = 'melt'; result.message = msg('사출 용융온도를 직접 입력하세요. 빨대 170–190°C를 복사하지 않습니다', 'Enter the injection melt temperature. Straw 170–190 °C is not copied'); }
    // I6 purpose presets alongside existing values (W07).
    const purpose = p.purpose || 'cycle';
    result.purposePresets = presets.purposePresets.filter(x => x.purpose === purpose);
    const values = new Set(result.purposePresets.map(x => JSON.stringify(x.mold_C)));
    if (values.size > 1) warnings.push(E.warning('W07', `purpose ${purpose}`));
    // I2 flash branching.
    if (p.flashTiming && FLASH_ACTIONS[p.flashTiming]) result.rules.push({ rule: 'I2', timing: p.flashTiming, actions: FLASH_ACTIONS[p.flashTiming].concat(purpose === 'cycle' ? FLASH_ACTIONS.cycle : []) });
    result.rules.push({ rule: 'I3', text: msg('60·65·70°C 각각에서 압력과 보압을 다시 맞춘 뒤 최소 탈형시간 비교', 'At 60, 65 and 70 °C re-tune pressure and hold, then compare minimum demold time') });
    // I5 thermal history.
    if (finite(mold) && finite(p.melt_C)) {
      const duration = [p.fillTime_s, p.holdTime_s, p.coolingTime_s].filter(finite).reduce((a, b) => a + b, 0);
      if (!(duration > 0)) { result.error = 'times'; result.message = msg('충전·보압·냉각 시간을 입력하세요', 'Enter fill, hold and cooling times'); }
      else {
        const profile = E.thermal1d(Object.assign({ thickness_mm: p.wall_mm, T0_C: p.melt_C, nodes: p.nodes,
          segments: [{ name: 'mold', duration_s: duration, A: { type: 'fixed', T_C: mold }, B: { type: 'fixed', T_C: mold } }] }, thermalInputs(p.thermal)));
        result.profile = profile;
        if (profile.error) { result.stopped = true; warnings.push.apply(warnings, profile.warnings); }
        else {
          result.history = grade.moduleOn ? analyse(profile, grade, { Tg_C: p.Tg_C }) : null;
          if (!grade.moduleOn && grade.mode === 'amorphous') result.amorphous = amorphousOutputs(profile, p);
          if (finite(p.band_C)) {
            const idx = profile.T_center.findIndex(T => Math.abs(T - mold) <= p.band_C);
            result.centerInBand = { band_C: p.band_C, time_s: idx < 0 ? null : profile.t_s[idx] };
          }
          result.rules.push({ rule: 'I5', text: msg('탈형 가능 여부는 실측 탈형 변형으로 판정', 'Judge demold readiness from measured demold deformation') });
        }
      }
    }
    result.warnings = uniq(warnings.concat(result.history ? result.history.warnings : []));
    return result;
  }

  /* ---------- 6.3 sheet ---------- */
  function sheet(input) {
    const p = input || {};
    const grade = gradeProfile(p.gradeId || 'S1000P', p);
    const warnings = [].concat(grade.warnings, blendWarnings(p));
    const presets = D().presets.sheet;
    const result = { process: 'sheet', grade, presets, rules: [], checks: AGING_CHECKS, badge: BADGE_SECONDARY, warnings };
    if (grade.mode === 'out_of_scope') { result.rules.push({ rule: 'H6', text: msg('PLA 매트릭스 시트는 PLA 상 거동이 지배하므로 대상 외', 'PLA-matrix sheet is governed by the PLA phase: out of scope') }); return result; }
    const v = p.lineSpeed_m_min, rolls = Array.isArray(p.rolls) ? p.rolls : [];
    if (!finite(v) || !(v > 0)) { result.error = 'line_speed'; result.message = msg('라인 속도(m/min)를 입력하세요', 'Enter line speed (m/min)'); return result; }
    const gaps = Array.isArray(p.gaps) ? p.gaps : [];
    const segments = [];
    result.contact = rolls.map((r, i) => {
      const contact_s = E.rollContact_s(r.D_mm, r.wrap_deg, v);
      const air = { type: 'convective', h_W_m2K: p.air_h_W_m2K, Tinf_C: p.air_T_C };
      const A = r.contact === 'B' ? (finite(p.air_h_W_m2K) ? air : { type: 'adiabatic' }) : { type: 'fixed', T_C: r.T_C };
      let B = r.contact === 'A' ? (finite(p.air_h_W_m2K) ? air : { type: 'adiabatic' }) : { type: 'fixed', T_C: r.T_C };
      if (r.contact === 'both') B = { type: 'fixed', T_C: finite(r.T_opposite_C) ? r.T_opposite_C : (rolls[i + 1] ? rolls[i + 1].T_C : r.T_C) };
      segments.push({ name: r.name, duration_s: contact_s, A, B });
      const g = gaps[i];
      if (g && finite(g.L_m) && g.L_m > 0) segments.push({ name: `gap ${i + 1}`, duration_s: E.residence_s(g.L_m, v), A: air, B: air });
      return { name: r.name, contact_s, T_C: r.T_C, contact: r.contact };
    });
    // H2: R2 contact bottleneck.
    const r2 = result.contact.find(c => c.name === 'R2');
    if (r2) result.rules.push({ rule: 'H2', R2_contact_s: r2.contact_s, text: msg(`R2 접촉시간 ${r2.contact_s.toFixed(2)} s: 고속에서 병목`, `R2 contact ${r2.contact_s.toFixed(2)} s: bottleneck at high speed`) });
    const profile = E.thermal1d(Object.assign({ thickness_mm: p.thickness_mm, T0_C: p.dieExit_C, nodes: p.nodes, segments }, thermalInputs(p.thermal)));
    result.profile = profile;
    if (profile.error) { result.stopped = true; warnings.push.apply(warnings, profile.warnings); }
    else {
      result.history = grade.moduleOn ? analyse(profile, grade, { Tg_C: p.Tg_C }) : null;
      if (!grade.moduleOn && grade.mode === 'amorphous') result.amorphous = amorphousOutputs(profile, p);
      // H1: two-side difference as a curl index.
      let maxAB = 0, at = 0;
      profile.t_s.forEach((t, i) => { const d = profile.T_surfaceA[i] - profile.T_surfaceB[i]; if (Math.abs(d) > Math.abs(maxAB)) { maxAB = d; at = t; } });
      result.rules.push({ rule: 'H1', maxDeltaAB_C: maxAB, at_s: at, text: msg('양면 온도 이력 차이 ΔT_AB: curl 위험 지표. 첫 조합은 60/70°C 기본', 'Two-side history difference ΔT_AB: curl risk index. Default first nip 60/70 °C') });
      // H3: candidate actions when the crystallization-zone dwell is short.
      const ratio = result.history && result.history.positions.center.anchorRatio;
      if (ratio && ratio.crystallization < 1) result.rules.push({ rule: 'H3', actions: [msg('R2 온도 상승', 'Raise R2 temperature'), msg('접촉 길이 증가', 'Increase contact length'), msg('추가 온롤', 'Add a warm roll'), msg('배합 결정화 속도 확인', 'Check compound crystallization rate')] });
    }
    // H4: existing sticking rule kept as control.
    const control = finite(p.stickingControl_R2_C) ? p.stickingControl_R2_C : null;
    result.rules.push({ rule: 'H4', control_R2_C: control, existing: presets.stickingRule, text: control === null
      ? msg('기존 sticking 규칙(R2 50–60°C, 55°C)은 이 저장소 코드에 없고 Sheet process의 롤 표면 engineering prior와 같은 값. 현행 R2를 control로 입력', 'The R2 50–60 °C / 55 °C sticking rule is not in this code; it matches the Sheet process roll-surface engineering prior. Enter the current R2 as control')
      : msg(`현행 R2 ${control}°C를 control로 유지. 65·70·75°C screening에 sticking·blocking 판정 필수`, `Keep current R2 ${control} °C as control. Sticking and blocking checks are mandatory in the 65/70/75 °C screening`) });
    if (control !== null && r2 && control !== r2.T_C) warnings.push(E.warning('W07', `R2 ${r2.T_C} °C vs control ${control} °C`));
    // H5: post-process reheat (thermoforming preheat).
    if (finite(p.postReheat_C)) result.survival = E.judgeSurvival(p.postReheat_C, finite(p.postReheatExposure_s) ? p.postReheatExposure_s : null, grade.kinetics.survival, grade.hasNucleatingAgent);
    result.warnings = uniq(warnings.concat(result.history ? result.history.warnings : [], result.survival ? result.survival.warnings : []));
    return result;
  }

  /* ---------- 6.4 extension stubs ---------- */
  const STUB_INPUTS = [msg('두께', 'Thickness'), msg('냉각 매체와 h', 'Cooling medium and h'), msg('속도', 'Speed'), msg('냉각 길이', 'Cooling length'), msg('후공정 재가열 온도', 'Post-process reheat temperature')];
  const STUBS = ['blownfilm', 'castfilm', 'fiber', 'ebm', 'filament', 'coating'];
  function stub(process) { return { process, supported: false, recommendations: null, requiredInputs: STUB_INPUTS, text: msg('엔진만 재사용. 실측 입력 전에는 추천값을 출력하지 않음', 'Engine only. No recommendations until measured inputs are entered') }; }

  function run(process, input) {
    if (process === 'straw') return straw(input);
    if (process === 'injection') return injection(input);
    if (process === 'sheet') return sheet(input);
    return stub(process);
  }
  const api = { gradeProfile, straw, injection, sheet, stub, run, STUBS, FLASH_ACTIONS };
  root.PHACrystalProcess = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
