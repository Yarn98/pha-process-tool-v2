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

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  function t(ko, en) { return (typeof LANG !== 'undefined' && LANG === 'en') ? en : ko; }
  function el(id)    { return document.getElementById(id); }

  /* ── P2: Temperature auto-suggestion ─────────────────────────────────── */

  function getTemperatureSuggestion(grade) {
    const info = PHA_MATERIAL_REGISTRY[grade];
    const warnings = [];
    if (!info) return { barrelPeak: null, dryTemp: null, dryTime: null, warnings };

    let barrelPeak = info.barrelPeak || null;
    if (info.Tm && barrelPeak && barrelPeak < info.Tm + 5) {
      barrelPeak = info.Tm + 5;
      warnings.push(t(`배럴 피크를 Tm(${info.Tm}°C)+5°C=${barrelPeak}°C로 조정.`, `Barrel peak adjusted to Tm(${info.Tm}°C)+5°C=${barrelPeak}°C.`));
    }
    if (barrelPeak && barrelPeak > 180) {
      warnings.push(t(`⚠️ 배럴 피크 ${barrelPeak}°C → 180°C 벽 초과. 열분해 위험.`, `⚠️ Barrel peak ${barrelPeak}°C exceeds 180°C wall. Thermal degradation risk.`));
    }
    if (info.type === 'S' || info.subtype === 'amorphous') {
      warnings.push(t('별도 건조 필수 — 다른 grade와 동시 건조 금지.', 'Separate drying required — do not co-dry with other grades.'));
    }
    return { barrelPeak, dryTemp: info.dryTemp || null, dryTime: info.dryTime || null, warnings };
  }

  /* ── P3: H/S/F auto-classification ───────────────────────────────────── */

  function autoClassifyGrade(grade) {
    const warnings  = [];
    const components = [];

    // Direct registry lookup
    const info = PHA_MATERIAL_REGISTRY[grade];
    if (info && info.type !== 'blend') {
      components.push({ name: grade, type: info.type, wt_pct: 100 });
      if (info.type === 'S') warnings.push(t('별도 건조 필수.', 'Separate drying required.'));
      return { components, warnings };
    }

    // CA series: PLA/aPHA blends
    if (/^CA\d/.test(grade)) {
      components.push({ name: 'PLA', type: 'H', wt_pct: 80 }, { name: 'A1000P', type: 'S', wt_pct: 20 });
      warnings.push(t('PLA 블렌드 — 별도 건조 및 PLA 주의사항 적용.', 'PLA blend — separate drying and PLA handling required.'));
      return { components, warnings };
    }

    // Blend patterns: PLA_aPHA, PHA_PBAT, PHA_PBS, PHA_PBSA
    const blendDef = [
      [/^PLA_aPHA_(\d+)_(\d+)$/i,  ['PLA', 'H'],    ['A1000P', 'S']],
      [/^PHA_PBAT_(\d+)_(\d+)$/i,  ['S1000P', 'H'], ['PBAT', 'S']  ],
      [/^PHA_PBS_(\d+)_(\d+)$/i,   ['S1000P', 'H'], ['PBS', 'S']   ],
      [/^PHA_PBSA_(\d+)_(\d+)$/i,  ['S1000P', 'H'], ['PBSA', 'S']  ],
    ];
    for (const [rx, h, s] of blendDef) {
      const m = grade.match(rx);
      if (m) {
        const hp = parseInt(m[1], 10), sp = parseInt(m[2], 10);
        components.push({ name: h[0], type: h[1], wt_pct: hp }, { name: s[0], type: s[1], wt_pct: sp });
        if (sp >= 20) warnings.push(t('Soft phase ≥20wt% → Type B 스크류 권장.', 'Soft phase ≥20wt% → Type B screw recommended.'));
        return { components, warnings };
      }
    }

    // Commodity fallback
    const single = { PLA: 'H', PBAT: 'S', PBS: 'S', PBSA: 'S' };
    if (single[grade]) { components.push({ name: grade, type: single[grade], wt_pct: 100 }); return { components, warnings }; }

    // Unknown — default to H:100
    components.push({ name: grade, type: 'H', wt_pct: 100 });
    warnings.push(t(`미등록 grade "${grade}" — H:100%로 기본 분류. 수동 확인 필요.`, `Unknown grade "${grade}" — defaulted to H:100%. Verify manually.`));
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
      if (key in preset) {
        const node = el(domId);
        if (node) { node.value = preset[key]; node.dispatchEvent(new Event('input', { bubbles: true })); }
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
            t('현재 선택 Grade','Selected Grade') + ': <strong>' + grade + '</strong> → ' + summary +
          '</span>' +
          '<button class="btn secondary" style="font-size:12px;padding:5px 10px"' +
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
      ? '<button class="btn secondary" style="font-size:13px;padding:6px 12px" onclick="switchTab(\'straw\')">' +
          '🥤 ' + t('스트로 가이드 참조','Straw Guide') + '</button>'
      : '';

    const plaNotice = isPlaBlend
      ? '<div style="margin-top:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 10px;font-size:12px;color:#92400e">' +
          '⚠️ <strong>' + t('PLA 블렌드 주의사항','PLA Blend Notice') + ':</strong> ' +
          t(grade + ' → PLA 블렌드. 컴파운딩 시 별도 건조 필수.',
            grade + ' → PLA blend. Separate drying mandatory.') +
        '</div>'
      : '';

    let tempRow = '';
    if (tempInfo.barrelPeak || tempInfo.dryTemp) {
      const parts = [];
      if (tempInfo.barrelPeak) parts.push(t('배럴 피크 권장: ' + tempInfo.barrelPeak + '°C', 'Barrel peak suggested: ' + tempInfo.barrelPeak + '°C'));
      if (tempInfo.dryTemp && tempInfo.dryTime) parts.push(t('건조: ' + tempInfo.dryTemp + '°C × ' + tempInfo.dryTime + 'h', 'Dry: ' + tempInfo.dryTemp + '°C × ' + tempInfo.dryTime + 'h'));
      if (parts.length) tempRow = '<div style="margin-top:6px;font-size:12px;color:#6b7280">🌡️ ' + parts.join(' | ') + '</div>';
      tempInfo.warnings.forEach(function (w) { tempRow += '<div style="margin-top:4px;font-size:12px;color:#b45309">' + w + '</div>'; });
    }

    panel.innerHTML =
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:12px">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
          '<span style="font-size:13px;color:#6b7280">📎 ' + t('관련 가이드','Related Guides') + ':</span>' +
          '<button class="btn secondary" style="font-size:13px;padding:6px 12px"' +
                  ' onclick="(function(){ switchTab(\'compounding\'); if(typeof applyAutoClassification===\'function\') setTimeout(applyAutoClassification,120); })()">' +
            '🧪 ' + t('컴파운딩 가이드','Compounding Guide') +
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
      var TARS_API = 'https://tars-api.sorisem98.workers.dev';
      fetch(TARS_API + '/api/grades')
        .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
        .then(function (grades) {
          if (!Array.isArray(grades)) return;
          var gradeSelect = el('grade');
          var added = 0;
          grades.forEach(function (g) {
            var key = g.name || '';
            if (!key || PHA_MATERIAL_REGISTRY[key]) return;
            // Add to registry
            var isHard = (g.polymer_type || '').indexOf('PHA') >= 0 && (g.hb4_mol_pct || 0) < 10;
            PHA_MATERIAL_REGISTRY[key] = {
              type: isHard ? 'H' : 'S',
              subtype: g.polymer_type || 'unknown',
              Tm: g.tm_c || null,
              Tg: g.tg_c || null,
              dryTemp: 60,
              dryTime: 6,
              barrelPeak: g.tm_c ? g.tm_c + 5 : 170,
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
        .catch(function () { /* TARS API offline */ });
    })();
  });

})();
