/**
 * pha-integration.js
 * Cross-tab integration layer for PHA Process Optimizer.
 * Connects: Process Conditions ↔ Compounding Guide ↔ Straw Guide
 *
 * Exposes globals:
 *   window.PHA_DATA_BRIDGE       – unified data/navigation API
 *   window.updateGuideLinks      – call from rebuildForm() in index.html
 *   window.applyAutoClassification – call when compounding tab activates
 *   window._cgApplyPreset        – programmatic fill of compounding ST-1 inputs
 *
 * Load order: after straw-guide.js, before </body>
 */
(function () {
  'use strict';

  /* ── Material Registry ────────────────────────────────────────────────── */

  const PHA_MATERIAL_REGISTRY = {
    'S1000P':  { type:'H', subtype:'semi-crystalline', Tm:160,  Tg:-6,  dryTemp:60, dryTime:6, barrelPeak:170, notes_ko:'표준 hard phase',                            notes_en:'Standard hard phase' },
    'A1000P':  { type:'S', subtype:'amorphous',        Tm:null, Tg:-20, dryTemp:50, dryTime:4, barrelPeak:160, notes_ko:'별도 건조 필수 (S1000P와 동시 건조 금지)',      notes_en:'Separate drying required (do not co-dry with S1000P)' },
    'P3HB':    { type:'H', subtype:'homo-PHB',         Tm:175,  Tg:5,   dryTemp:60, dryTime:6, barrelPeak:180, notes_ko:'열민감 - 앱단 투입',                          notes_en:'Heat-sensitive - feed at hopper end' },
    'CA1180P': { type:'blend', subtype:'PLA/aPHA',     Tm:162,  Tg:null,dryTemp:60, dryTime:4, barrelPeak:175, notes_ko:'PLA 블렌드 사출용',                            notes_en:'PLA blend for injection' },
    'CB0400A': { type:'H', subtype:'P34HB',            Tm:null, Tg:null,dryTemp:60, dryTime:6, barrelPeak:170, notes_ko:'P34HB 시리즈',                                 notes_en:'P34HB series' },
    'CB0104A': { type:'S', subtype:'P34HB',            Tm:null, Tg:null,dryTemp:50, dryTime:4, barrelPeak:165, notes_ko:'P34HB 시리즈 (아모르퍼스)',                    notes_en:'P34HB series (amorphous)' },
    'PLA':     { type:'H', subtype:'commodity',        Tm:168,  Tg:58,  dryTemp:80, dryTime:4, barrelPeak:200, notes_ko:'범용 PLA',                                    notes_en:'Commodity PLA' },
    'PBAT':    { type:'S', subtype:'commodity',        Tm:125,  Tg:-30, dryTemp:60, dryTime:4, barrelPeak:160, notes_ko:'유연성 부여',                                  notes_en:'Flexibility modifier' },
    'PBS':     { type:'S', subtype:'commodity',        Tm:115,  Tg:-35, dryTemp:60, dryTime:4, barrelPeak:155, notes_ko:'결정성 soft phase',                            notes_en:'Crystalline soft phase' },
    'PBSA':    { type:'S', subtype:'commodity',        Tm:95,   Tg:-45, dryTemp:50, dryTime:4, barrelPeak:150, notes_ko:'저Tm soft phase',                              notes_en:'Low-Tm soft phase' },
    'CaCO3':   { type:'F', subtype:'mineral',          Tm:null, Tg:null,notes_ko:'가장 안정, 중성, PHA 최적',                                                           notes_en:'Most stable, neutral, best for PHA' },
    'Talc':    { type:'F', subtype:'mineral',          Tm:null, Tg:null,notes_ko:'핵제 효과, 낮은 OH',                                                                  notes_en:'Nucleating effect, low OH' },
  };

  // The registry is identity metadata; the audited document is the processing authority.
  Object.entries(PHA_MATERIAL_REGISTRY).forEach(function ([grade, info]) {
    info.barrelPeak=null;info.dryTemp=null;info.dryTime=null;
    info.processingReference=window.PHAEvidence?.GRADES[grade]||null;
    if(/^C[AB]\d/.test(grade))info.type='blend';
    if(grade==='CB0104A'||grade==='CB0400A'){
      info.subtype='PHA/mineral compound';info.notes_ko='배합비는 별도 확인';info.notes_en='Verify the exact formulation';
    }
    if(grade==='CaCO3'){info.notes_ko='탄산칼슘 충전재 · 수분/표면처리 확인';info.notes_en='Calcium carbonate filler; verify moisture/surface treatment';}
    if(grade==='P3HB'){info.notes_ko='고융점·열 이력 확인';info.notes_en='Check melting behavior and thermal history';}
  });

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  function t(ko, en) { return (typeof LANG !== 'undefined' && LANG === 'en') ? en : ko; }
  function el(id)    { return document.getElementById(id); }
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── P2: Temperature auto-suggestion ─────────────────────────────────── */

  function getTemperatureSuggestion(grade) {
    const record=window.PHAEvidence?.GRADES[grade];
    return {barrelPeak:null,dryTemp:null,dryTime:null,reference:record||null,
      warnings:record?[]:[t('공정조건 원문 미확인 — 물성으로 설정값을 자동 추정하지 않습니다.','Processing source unverified — properties are not converted into setpoints.')]};
  }

  /* ── P3: H/S/F auto-classification ───────────────────────────────────── */

  function autoClassifyGrade(grade) {
    const warnings  = [];
    const components = [];

    // Direct registry lookup
    const info = PHA_MATERIAL_REGISTRY[grade];
    if (info && ['H','S','F'].includes(info.type)) {
      components.push({ name: grade, type: info.type, wt_pct: 100 });
      if (info.type === 'S') warnings.push(t('원료별 건조 조건과 컴파운드 조건을 구분하세요.', 'Distinguish raw-resin and compound drying conditions.'));
      return { components, warnings };
    }

    // A commercial compound name does not disclose its exact component percentages.
    if (/^C[AB]\d/.test(grade)) {
      warnings.push(t('상용 컴파운드의 정확한 배합비는 공개 자료로 확인되지 않았습니다. 배합표를 확인해 직접 입력하세요.', 'The exact commercial-compound recipe is not disclosed by the reference. Enter the verified formulation manually.'));
      return { components, warnings };
    }

    // Blend patterns: PLA_aPHA, PHA_PBAT, PHA_PBS, PHA_PBSA
    const blendDef = [
      [/^PLA_aPHA_(\d+)_(\d+)$/i,  ['PLA', 'H'],    ['A1000P', 'S']],
    ];
    for (const [rx, h, s] of blendDef) {
      const m = grade.match(rx);
      if (m) {
        const hp = parseInt(m[1], 10), sp = parseInt(m[2], 10);
        if(hp<0||sp<0||hp+sp!==100){warnings.push(t('배합 합계를 확인하세요.','Check the composition total.'));return {components,warnings};}
        components.push({ name: h[0], type: h[1], wt_pct: hp }, { name: s[0], type: s[1], wt_pct: sp });
        warnings.push(t('표기된 배합비입니다. 조성비만으로 스크류를 선택하지 않습니다.', 'Uses the named composition; fractions alone do not select a screw layout.'));
        return { components, warnings };
      }
    }

    if(/^PHA_(PBS|PBSA|PBAT)_/i.test(grade)){
      warnings.push(t('일반 PHA 표기만으로 S1000P를 지정할 수 없습니다. 실제 PHA 그레이드와 배합표를 확인하세요.','A generic PHA name does not identify S1000P. Verify the actual PHA grade and formulation.'));
      return {components,warnings};
    }

    // Commodity fallback
    const single = { PLA: 'H', PBAT: 'S', PBS: 'S', PBSA: 'S' };
    if (single[grade]) { components.push({ name: grade, type: single[grade], wt_pct: 100 }); return { components, warnings }; }

    warnings.push(t(`미등록 grade "${grade}" — 배합표 확인 필요.`, `Unknown grade "${grade}" — verify the formulation.`));
    return { components, warnings };
  }

  /* ── _cgApplyPreset: fill ST-1 composition inputs ────────────────────── */

  function _cgApplyPreset(preset) {
    if (!preset || typeof preset !== 'object') return;
    const map = {
      h_s1000p: 'cg_h_s1000p', h_p3hb: 'cg_h_p3hb', h_pla: 'cg_h_pla',
      s_a1000p: 'cg_s_a1000p', s_pbat: 'cg_s_pbat',  s_pbs: 'cg_s_pbs', s_pbsa: 'cg_s_pbsa',
      f_talc: 'cg_f_talc', f_caco3: 'cg_f_caco3', f_otherfiller: 'cg_f_otherfiller',
    };
    Object.entries(map).forEach(function ([key, domId]) {
      {
        const node = el(domId);
        if (node) { node.value = key in preset ? preset[key] : 0; node.dispatchEvent(new Event('input', { bubbles: true })); }
      }
    });
    if (typeof cgUpdateComposition === 'function') cgUpdateComposition();
  }

  /* ── applyAutoClassification: banner + auto-fill button in ST-1 ─────── */

  function applyAutoClassification() {
    const gradeEl = typeof $ === 'function' ? $('grade') : null;
    if (!gradeEl || !gradeEl.value) return;

    const grade = gradeEl.value;
    const { components, warnings } = autoClassifyGrade(grade);

    const summary = components.map(function (c) {
      const label = c.type === 'H' ? t('Hard Phase','Hard Phase') : c.type === 'S' ? t('Soft Phase','Soft Phase') : t('Filler','Filler');
      return c.name + ' ' + label + ' ' + c.wt_pct + '%';
    }).join(' + ');

    const preset = {};
    components.forEach(function (c) {
      if      (c.name === 'S1000P') preset.h_s1000p = c.wt_pct;
      else if (c.name === 'P3HB')   preset.h_p3hb   = c.wt_pct;
      else if (c.name === 'PLA')    preset.h_pla     = c.wt_pct;
      else if (c.name === 'A1000P') preset.s_a1000p  = c.wt_pct;
      else if (c.name === 'PBAT')   preset.s_pbat    = c.wt_pct;
      else if (c.name === 'PBS')    preset.s_pbs     = c.wt_pct;
      else if (c.name === 'PBSA')   preset.s_pbsa    = c.wt_pct;
    });

    const warnHtml = warnings.length
      ? '<div style="margin-top:6px;font-size:12px;color:#92400e">' + warnings.map(function(w){ return '<div>' + w + '</div>'; }).join('') + '</div>'
      : '';

    const bannerId = 'phaBridge_classifyBanner';
    let banner = el(bannerId);
    if (!banner) {
      banner = document.createElement('div');
      banner.id = bannerId;
      const st1 = el('cg-tab-0');
      if (st1) {
        const firstCard = st1.querySelector('.card');
        firstCard ? st1.insertBefore(banner, firstCard) : st1.prepend(banner);
      }
    }

    banner.innerHTML =
      '<div class="card" style="border-left-color:var(--primary);margin:0 0 12px;background:#eff6ff">' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
          '<span style="font-size:13px;color:#1e3c72;font-weight:700">ℹ️ ' +
            t('현재 선택 Grade','Selected Grade') + ': <strong>' + escHtml(grade) + '</strong> → ' + escHtml(summary) +
          '</span>' +
          '<button class="btn secondary" style="font-size:12px;padding:5px 10px"' + (components.length?'':' disabled') +
                  ' onclick="window._cgApplyPreset(' + JSON.stringify(preset) + ')">' +
            t('자동 입력','Auto-fill') +
          '</button>' +
        '</div>' +
        warnHtml +
      '</div>';
  }

  /* ── P1: updateGuideLinks ─────────────────────────────────────────────── */

  function updateGuideLinks() {
    const gradeEl   = typeof $ === 'function' ? $('grade')   : null;
    const processEl = typeof $ === 'function' ? $('process') : null;
    if (!gradeEl || !processEl) return;

    const grade   = gradeEl.value   || '';
    const process = processEl.value || '';
    const showStraw  = ['extrusion', 'sheet', 'blownfilm', 'castfilm'].includes(process);
    const isPlaBlend = /^CA\d/.test(grade) || /PLA/i.test(grade);
    const tempInfo   = getTemperatureSuggestion(grade);

    let panel = el('guideLinks');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'guideLinks';
      const anchor = el('dynamicFields');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor);
      else { const proc = el('proc'); if (proc) proc.appendChild(panel); }
    }

    const strawBtn = showStraw
      ? '<button class="btn secondary guide-links-btn" onclick="switchTab(\'straw\')">' +
          t('스트로 가이드 참조','Straw Guide') + '</button>'
      : '';

    const plaNotice = isPlaBlend
      ? '<div class="guide-links-notice">' +
          '<strong>' + t('PLA 블렌드 주의사항','PLA Blend Notice') + ':</strong> ' +
          t(escHtml(grade) + ' → 원료 혼합물과 제조된 컴파운드는 건조 근거가 다릅니다.',
            escHtml(grade) + ' → Raw-resin blends and compounded pellets have different drying references.') +
        '</div>'
      : '';

    let tempRow = '';
    if (tempInfo.barrelPeak || tempInfo.dryTemp) {
      const parts = [];
      if (tempInfo.barrelPeak) parts.push(t('배럴 피크 권장: ' + tempInfo.barrelPeak + '°C', 'Barrel peak suggested: ' + tempInfo.barrelPeak + '°C'));
      if (tempInfo.dryTemp && tempInfo.dryTime) parts.push(t('건조: ' + tempInfo.dryTemp + '°C × ' + tempInfo.dryTime + 'h', 'Dry: ' + tempInfo.dryTemp + '°C × ' + tempInfo.dryTime + 'h'));
      if (parts.length) tempRow = '<div class="guide-links-temp">' + parts.join(' · ') + '</div>';
      tempInfo.warnings.forEach(function (w) { tempRow += '<div class="guide-links-warn">' + w + '</div>'; });
    }

    panel.innerHTML =
      '<div class="guide-links-panel">' +
        '<div class="guide-links-row">' +
          '<span class="guide-links-label">' + t('관련 가이드','Related Guides') + '</span>' +
          '<button class="btn secondary guide-links-btn"' +
                  ' onclick="(function(){ switchTab(\'compounding\'); if(typeof applyAutoClassification===\'function\') setTimeout(applyAutoClassification,120); })()">' +
            t('컴파운딩 가이드','Compounding Guide') +
          '</button>' +
          strawBtn +
        '</div>' +
        plaNotice +
        tempRow +
      '</div>';
  }

  /* ── P4: PHA_DATA_BRIDGE ─────────────────────────────────────────────── */

  window.PHA_DATA_BRIDGE = {
    registry: PHA_MATERIAL_REGISTRY,

    getSelectedGrade:   function () { return (typeof $ === 'function' && $('grade'))   ? $('grade').value   : null; },
    getSelectedProcess: function () { return (typeof $ === 'function' && $('process')) ? $('process').value : null; },
    getMaterialInfo:    function (grade) { return PHA_MATERIAL_REGISTRY[grade] || null; },
    getTempSuggestion:  function (grade) { return getTemperatureSuggestion(grade); },
    classifyForCompounding: function (grade) { return autoClassifyGrade(grade); },

    goToCompounding: function (presetData) {
      if (typeof switchTab === 'function') switchTab('compounding');
      if (presetData && typeof window._cgApplyPreset === 'function') {
        setTimeout(function () { window._cgApplyPreset(presetData); }, 150);
      }
    },

    goToStraw: function () {
      if (typeof switchTab === 'function') switchTab('straw');
    },

    getGuideRecommendation: function (grade, process) {
      const straw = ['extrusion', 'sheet', 'blownfilm', 'castfilm'].includes(process);
      const notes = autoClassifyGrade(grade).warnings.slice();
      if (straw) notes.unshift(t(process + ' 공정 → 스트로 가이드 권장', process + ' process → Straw guide recommended'));
      return { compounding: true, straw: straw, notes: notes };
    },
  };

  /* ── Expose globals ───────────────────────────────────────────────────── */

  window.updateGuideLinks        = updateGuideLinks;
  window.applyAutoClassification = applyAutoClassification;
  window._cgApplyPreset          = _cgApplyPreset;

  /* ── Init ─────────────────────────────────────────────────────────────── */

  window.addEventListener('load', function () {
    updateGuideLinks();

    // Safety-net listeners — rebuildForm calls window.updateGuideLinks()
    // whenever it is exposed; these cover any edge-case direct DOM changes.
    var g = el('grade'),   p = el('process');
    if (g) g.addEventListener('change', updateGuideLinks);
    if (p) p.addEventListener('change', updateGuideLinks);

    // Auto-classify when switching to compounding tab
    document.querySelectorAll('.tab, .mtb-item, #morePopover button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.tab === 'compounding') setTimeout(applyAutoClassification, 200);
      });
    });

    // ── TARS API: merge grades into material registry (graceful fallback) ──
    (function loadTarsGrades() {
      var isPages = location.hostname.endsWith('.pages.dev') || location.hostname.endsWith('.tarspolymer.com');
      var TARS_API = isPages ? '' : 'https://tars-api.sorisem98.workers.dev';
      var controller=new AbortController();
      var requestTimer=setTimeout(function(){controller.abort();},12000);
      fetch(TARS_API + '/api/grades', {signal:controller.signal})
        .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
        .then(function (grades) {
          if (!Array.isArray(grades)) return;
          window.PHA_TARS_STATUS={ok:true,count:grades.length,checkedAt:new Date().toISOString()};
          if(typeof window.renderPhaApiStatus==='function')window.renderPhaApiStatus();
          var gradeSelect = el('grade');
          var added = 0;
          grades.forEach(function (g) {
            var key = g.name || '';
            if (!key || PHA_MATERIAL_REGISTRY[key]) return;
            // Add to registry
            PHA_MATERIAL_REGISTRY[key] = {
              type: 'unknown',
              subtype: g.polymer_type || 'unknown',
              Tm: g.tm_c || null,
              Tg: g.tg_c || null,
              dryTemp: null,
              dryTime: null,
              barrelPeak: null,
              processingSource: 'unverified',
              notes_ko: (g.description || g.polymer_type || '') + ' (TARS)',
              notes_en: (g.description || g.polymer_type || '') + ' (TARS)'
            };
            // Add to grade dropdown if exists
            if (gradeSelect) {
              var opt = document.createElement('option');
              opt.value = key;
              opt.textContent = '[TARS] ' + key;
              gradeSelect.appendChild(opt);
            }
            added++;
          });
          if (added > 0) console.log('[TARS] Merged ' + added + ' grades into registry');
        })
        .catch(function () { window.PHA_TARS_STATUS={ok:false};if(typeof window.renderPhaApiStatus==='function')window.renderPhaApiStatus(); })
        .finally(function(){clearTimeout(requestTimer);});
    })();
  });

})();
