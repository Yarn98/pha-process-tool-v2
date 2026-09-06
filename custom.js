/*
 * custom.js - dynamic material loading, troubleshooting integration, and photo gallery functionality
 *
 * This script augments the PHA process optimizer by loading external JSON datasets
 * for material property cards and troubleshooting entries, and by providing a simple
 * client-side photo upload/gallery. Photos are stored in localStorage as data URLs.
 */

// Embedded material cards dataset. Generated from 01_material_cards.json at build time.
const MATERIAL_CARDS = {
  "S1000P": {
    "density_g_cm3": 1.23,
    "MFR_g_10min_190_2_16": null,
    "Tg_C": -6.0,
    "Tm_C": 160.0,
    "tensile_MPa": 32.5,
    "elongation_%": 60.0,
    "izod_kJ_m2": null,
    "HDT_C": 130.0
  },
  "A1000P": {
    "density_g_cm3": 1.23,
    "MFR_g_10min_190_2_16": null,
    "elongation_%": 500.0
  },
  "CA1180P": {
    "density_g_cm3": 1.26,
    "MFR_g_10min_190_2_16": 7,
    "Tm_C": 162,
    "tensile_MPa": 52,
    "elongation_%": 23,
    "izod_kJ_m2": 63,
    "HDT_C": 51
  },
  "CB0104A": {
    "density_g_cm3": 1.55,
    "MFR_g_10min_190_2_16": null,
    "Tm_C": 165,
    "tensile_MPa": 27,
    "elongation_%": 6,
    "HDT_C": 140.0
  }
};

// Load material cards from embedded dataset and merge into local storage DB
async function loadMaterialCards() {
  try {
    const data = MATERIAL_CARDS;
    const db = getMatDB();
    const saved = JSON.parse(localStorage.getItem('mat_db') || '{}');
    for (const grade in data) {
      const item = data[grade];
      const rec = {};
      // unify keys: allow either full names or simplified ones
      if (item.density_g_cm3 != null || item.density != null) {
        rec.density_g_cm3 = item.density_g_cm3 != null ? item.density_g_cm3 : item.density;
      }
      if (item.MFR_g_10min_190_2_16 != null || item.MFR != null) {
        rec.MFR_g_10min_190_2_16 = item.MFR_g_10min_190_2_16 != null ? item.MFR_g_10min_190_2_16 : item.MFR;
      }
      if (item.Tg_C != null || item.Tg != null) {
        rec.Tg_C = item.Tg_C != null ? item.Tg_C : item.Tg;
      }
      if (item.Tm_C != null || item.Tm != null) {
        rec.Tm_C = item.Tm_C != null ? item.Tm_C : item.Tm;
      }
      if (item.tensile_MPa != null || item.tensile != null) {
        rec.tensile_MPa = item.tensile_MPa != null ? item.tensile_MPa : item.tensile;
      }
      if (item["elongation_%"] != null || item.elongation != null) {
        rec["elongation_%"] = item["elongation_%"] != null ? item["elongation_%"] : item.elongation;
      }
      if (item["izod_kJ_m2"] != null || item.impact != null) {
        rec["izod_kJ_m2"] = item["izod_kJ_m2"] != null ? item["izod_kJ_m2"] : item.impact;
      }
      if (item.HDT_C != null || item.HDT != null) {
        rec.HDT_C = item.HDT_C != null ? item.HDT_C : item.HDT;
      }
      if (Object.keys(rec).length > 0) {
        db[grade] = Object.assign({}, db[grade] || {}, rec, saved[grade] || {});
      }
    }
    setMatDB(db);
    if (typeof renderMat === 'function') renderMat();
  } catch (e) {
    console.warn('Failed to load material cards', e);
  }
}

// Load troubleshooting knowledge base from external JSON and trigger render
// Embedded troubleshooting knowledge base. Generated from 02_troubleshooting_kb.json at build time.
const TS_DATA = window.PHA_TROUBLESHOOTING_DATA || [];
const TS_KO = {}; // Every generated entry contains both languages.
const PROC_KO = {compounding:'컴파운딩',extrusion:'압출',sheet_film:'시트·필름',injection:'사출',thermoforming:'열성형',blownfilm:'블로운 필름',blowmolding:'압출 블로우 성형',castfilm:'캐스트 필름',straw:'스트로'};
window.tsData = TS_DATA;
function normalizeTroubleshootingItem(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    ...item,
    likely_causes: Array.isArray(item.likely_causes) ? item.likely_causes : [],
    likely_causes_ko: Array.isArray(item.likely_causes_ko) ? item.likely_causes_ko : item.likely_causes_ko,
    quick_fixes: Array.isArray(item.quick_fixes) ? item.quick_fixes : [],
    quick_fixes_ko: Array.isArray(item.quick_fixes_ko) ? item.quick_fixes_ko : item.quick_fixes_ko,
    root_fixes: Array.isArray(item.root_fixes) ? item.root_fixes : [],
    root_fixes_ko: Array.isArray(item.root_fixes_ko) ? item.root_fixes_ko : item.root_fixes_ko,
    control_knobs: Array.isArray(item.control_knobs) ? item.control_knobs : [],
    control_knobs_ko: Array.isArray(item.control_knobs_ko) ? item.control_knobs_ko : item.control_knobs_ko,
    related_images: Array.isArray(item.related_images) ? item.related_images : [],
  };
}

// Fetch the requested field by language, with JSON-first lookup and TS_KO fallback.
function tsFieldByLang(item, field, lang) {
  if (!item) return null;
  if (field === 'plain') {
    if (lang === 'ko') return item.plain_ko ?? TS_KO[item.symptom]?.plain ?? null;
    return item.plain_en ?? null;
  }
  if (lang === 'ko') {
    const localized = item[`${field}_ko`];
    if (localized != null) return localized;
    const t = TS_KO[item.symptom];
    if (t && t[field] != null) return t[field];
  }
  return item[field];
}

// Process label translation helper.
function tsProcLabel(proc, lang) {
  if (lang === 'ko' && PROC_KO[proc]) return PROC_KO[proc];
  const labels={sheet_film:'Sheet / film',blownfilm:'Blown film',blowmolding:'Extrusion blow molding',castfilm:'Cast film',straw:'Straw',compounding:'Compounding',extrusion:'Extrusion',injection:'Injection',thermoforming:'Thermoforming'};
  if(lang==='en'&&labels[proc])return labels[proc];
  return (proc || 'general').charAt(0).toUpperCase() + (proc || 'general').slice(1);
}

// Load troubleshooting knowledge base from embedded dataset
async function loadTroubleshootingKB() {
  const fallback = Array.isArray(TS_DATA)
    ? TS_DATA.map(normalizeTroubleshootingItem).filter(Boolean)
    : [];
  try {
    const res = await fetch('data/troubleshooting_kb.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Troubleshooting KB payload must be an array');
    window.tsData = data.map(normalizeTroubleshootingItem).filter(Boolean);
  } catch (e) {
    console.warn('Failed to load troubleshooting KB, falling back to embedded data.', e);
    window.tsData = fallback;
  }
  if (typeof renderTS === 'function') renderTS();
}

// Photo gallery utilities
function loadPhotos() {
  try {
    window.photos = JSON.parse(localStorage.getItem('pha_photos') || '[]');
    if (!Array.isArray(window.photos)) window.photos = [];
  } catch (e) {
    window.photos = [];
  }
}

function savePhotos() {
  localStorage.setItem('pha_photos', JSON.stringify(window.photos || []));
}

function hashPhotoValue(value) {
  const text = String(value || '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizePhotoRecord(entry, rawIndex) {
  if (entry && typeof entry === 'object' && !Array.isArray(entry) && typeof entry.data === 'string' && entry.data) {
    return {
      rawIndex,
      id: typeof entry.id === 'string' && entry.id ? entry.id : `photo-${hashPhotoValue(entry.data)}`,
      data: entry.data,
      name: typeof entry.name === 'string' && entry.name ? entry.name : `Photo ${rawIndex + 1}`,
      created_at: typeof entry.created_at === 'string' ? entry.created_at : '',
    };
  }
  if (typeof entry === 'string' && entry) {
    return {
      rawIndex,
      id: `legacy-${hashPhotoValue(entry)}`,
      data: entry,
      name: `Photo ${rawIndex + 1}`,
      created_at: '',
    };
  }
  return null;
}

function getNormalizedPhotos() {
  loadPhotos();
  return (window.photos || [])
    .map((entry, rawIndex) => normalizePhotoRecord(entry, rawIndex))
    .filter(Boolean);
}

function findPhotoByRef(photoRef) {
  if (!photoRef) return null;
  return getNormalizedPhotos().find(photo => photo.id === photoRef) || null;
}

function estimatePhotoStorageBytes(extraBytes = 0) {
  loadPhotos();
  return new Blob([JSON.stringify(window.photos || [])]).size + extraBytes;
}

function photoStorageText(key) {
  const dict = (typeof LANG !== 'undefined' && LANG === 'ko')
    ? {
        warn: '사진 저장량이 50 MB를 넘었습니다. 브라우저 저장 한계를 주의하세요.',
        hardStop: '사진 저장량이 100 MB를 넘어 추가 저장을 막았습니다. 기존 사진을 정리하거나 별도 백업 후 다시 시도하세요.',
      }
    : {
        warn: 'Photo storage is above 50 MB. Watch browser quota and back up critical images.',
        hardStop: 'Photo storage is above 100 MB, so new uploads were blocked. Clean up old photos or back them up first.',
      };
  return dict[key] || key;
}

function ensurePhotoStorageCapacity(extraBytes = 0) {
  const projected = estimatePhotoStorageBytes(extraBytes);
  if (projected > 100 * 1024 * 1024) {
    alert(photoStorageText('hardStop'));
    return false;
  }
  if (projected > 50 * 1024 * 1024) {
    alert(photoStorageText('warn'));
  }
  return true;
}

function triggerPhotoUpload() {
  const el = document.getElementById('photoUpload');
  if (el) {
    el.value = '';
    el.click();
  }
}

function handlePhotoFiles(files) {
  if (!files || !files.length) return;
  if (!window.photos) window.photos = [];
  let pending = files.length;
  Array.from(files).forEach((file) => {
    if (!ensurePhotoStorageCapacity(Math.ceil(file.size * 1.4))) {
      pending -= 1;
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      window.photos.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        data: e.target.result,
        name: file.name,
        created_at: new Date().toISOString(),
      });
      pending--;
      if (pending === 0) {
        savePhotos();
        renderPhotos();
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotos() {
  const grid = document.getElementById('photoGrid');
  if (!grid) return;
  const photos = getNormalizedPhotos();
  grid.innerHTML = '';
  photos.forEach((photo) => {
    const div = document.createElement('div');
    div.className = 'photo';
    const img = document.createElement('img');
    img.src = photo.data;
    img.style.cursor = 'pointer';
    img.onclick = function () {
      if (typeof openLightbox === 'function') openLightbox(photo.data);
    };
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.onclick = function (e) {
      e.stopPropagation();
      window.photos.splice(photo.rawIndex, 1);
      savePhotos();
      renderPhotos();
    };
    div.appendChild(img);
    div.appendChild(btn);
    grid.appendChild(div);
  });
}

function batchSessionText(key) {
  const dict = (typeof LANG !== 'undefined' && LANG === 'ko')
    ? {
        operatorPrompt: '작업자 이니셜을 입력하세요:',
        batchPrompt: '배치 ID를 입력하세요 (예: 20260419-A):',
        batchRequired: '배치 ID가 있어야 배치를 시작할 수 있습니다.',
        startError: '배치를 시작할 수 없습니다: ',
        endConfirm: '이 배치 세션을 종료하시겠습니까? 종료 후에도 기록은 유지됩니다.',
        endError: '배치를 종료할 수 없습니다: ',
        started: '배치 시작: ',
        ended: '배치 종료: ',
      }
    : {
        operatorPrompt: 'Operator initials:',
        batchPrompt: 'Batch ID (e.g. 20260419-A):',
        batchRequired: 'A batch ID is required before the session can start.',
        startError: 'Cannot start batch: ',
        endConfirm: 'End this batch session? The records will remain available afterward.',
        endError: 'Cannot end batch: ',
        started: 'Batch started: ',
        ended: 'Batch finalized: ',
      };
  return dict[key] || key;
}

let currentBatchEventKind = 'temp_reading';
let currentBatchEventPhotoRef = '';

function batchEventText(key) {
  const dict = (typeof LANG !== 'undefined' && LANG === 'ko')
    ? {
        ready: '배치가 진행 중이면 현장 이벤트를 바로 남길 수 있습니다.',
        needsSession: '배치를 먼저 시작해야 이벤트를 저장할 수 있습니다.',
        locked: '종료된 배치는 읽기 전용입니다. 새 이벤트를 추가할 수 없습니다.',
        photoNone: '연결된 사진 없음',
        photoMissing: '연결한 사진을 찾을 수 없습니다.',
        photoLinked: '연결됨',
        noGalleryPhoto: '갤러리에 연결할 사진이 없습니다.',
        additionMaterialRequired: '추가 재료명을 입력하세요.',
        additionQtyRequired: '추가량(g)을 입력하세요.',
        anomalyCodeRequired: '이상 코드를 선택하세요.',
        scrapRequired: '폐기 수량 또는 질량 중 하나는 입력하세요.',
        noteRequired: '메모를 입력하세요.',
        saveError: '이벤트를 저장할 수 없습니다: ',
        saved: '이벤트를 저장했습니다.',
        recentEmpty: '아직 저장된 이벤트가 없습니다.',
      }
    : {
        ready: 'Batch events can be logged while the session is active.',
        needsSession: 'Start the batch before saving events.',
        locked: 'This batch is finalized or cancelled, so event logging is read-only.',
        photoNone: 'No photo linked yet.',
        photoMissing: 'The linked photo could not be found.',
        photoLinked: 'Linked',
        noGalleryPhoto: 'No gallery photo is available to link.',
        additionMaterialRequired: 'Enter the added material.',
        additionQtyRequired: 'Enter the added quantity in grams.',
        anomalyCodeRequired: 'Select an anomaly code.',
        scrapRequired: 'Enter either rejected count or rejected mass.',
        noteRequired: 'Enter a note before saving.',
        saveError: 'Cannot save event: ',
        saved: 'Batch event saved.',
        recentEmpty: 'No batch events have been saved yet.',
      };
  return dict[key] || key;
}

function batchEventEscapeHtml(value) {
  return String(value == null ? '' : value).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

function batchEventLocale() {
  if (typeof flashLocale === 'function') return flashLocale();
  return (typeof LANG !== 'undefined' && LANG === 'ko') ? 'ko-KR' : 'en-US';
}

function batchEventSession() {
  return (typeof window.getCurrentBatchSession === 'function' ? window.getCurrentBatchSession() : null) || null;
}

function batchEventCanWrite(session) {
  return !!(session && session.batch_id && session.status === 'running');
}

function latestProcessLogSnapshot() {
  const latest = (typeof processLogData !== 'undefined' && Array.isArray(processLogData) && processLogData.length > 0)
    ? processLogData[0]
    : null;
  return {
    cylinderTemp: Number(latest?.cylinderTemp) || 0,
    moldTemp: Number(latest?.moldTemp) || 0,
    injectionSpeed: Number(latest?.injectionSpeed) || 0,
    injectionPressure: Number(latest?.injectionPressure) || 0,
    holdingPressure: Number(latest?.holdingPressure) || 0,
    coolingTime: Number(latest?.coolingTime) || 0,
  };
}

function fillBatchEventSnapshotInputs(snapshot) {
  const source = snapshot || latestProcessLogSnapshot();
  const mapping = {
    eventStateCylinder: source.cylinderTemp,
    eventStateMold: source.moldTemp,
    eventStateSpeed: source.injectionSpeed,
    eventStatePressure: source.injectionPressure,
    eventStatePacking: source.holdingPressure,
    eventStateCooling: source.coolingTime,
  };
  Object.entries(mapping).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = String(value ?? 0);
  });
}

function readBatchEventSnapshot() {
  const read = (id) => {
    const el = document.getElementById(id);
    return el ? Number(el.value || 0) : 0;
  };
  const processSnapshot = {
    cylinderTemp: read('eventStateCylinder'),
    moldTemp: read('eventStateMold'),
    injectionSpeed: read('eventStateSpeed'),
    injectionPressure: read('eventStatePressure'),
    holdingPressure: read('eventStatePacking'),
    coolingTime: read('eventStateCooling'),
  };
  return {
    process_snapshot: processSnapshot,
    state_snapshot: {
      zones_c: [processSnapshot.cylinderTemp, processSnapshot.moldTemp],
      rpm: processSnapshot.injectionSpeed,
      torque_pct: processSnapshot.injectionPressure,
      melt_temp_c: processSnapshot.cylinderTemp,
      die_pressure_bar: processSnapshot.holdingPressure,
    },
  };
}

function populateAnomalySelect(selectId, includeBlank) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const api = window.TarsAnomalyCodes;
  const codes = Array.isArray(api?.ANOMALY_CODES) ? api.ANOMALY_CODES : [];
  const previous = select.value;
  const options = [];
  if (includeBlank) {
    options.push(`<option value="">${LANG === 'ko' ? '선택' : 'Select'}</option>`);
  }
  codes.forEach((item) => {
    const label = LANG === 'ko' ? item.label_ko : item.label_en;
    options.push(`<option value="${item.code}">${label}</option>`);
  });
  select.innerHTML = options.join('');
  if (previous && Array.from(select.options).some(option => option.value === previous)) {
    select.value = previous;
  } else if (!includeBlank && codes[0]) {
    select.value = codes[0].code;
  }
}

function renderBatchEventPhotoStatus() {
  const status = document.getElementById('batchEventPhotoStatus');
  if (!status) return;
  if (!currentBatchEventPhotoRef) {
    status.textContent = batchEventText('photoNone');
    return;
  }
  const photo = findPhotoByRef(currentBatchEventPhotoRef);
  if (!photo) {
    status.textContent = batchEventText('photoMissing');
    return;
  }
  status.textContent = `${batchEventText('photoLinked')}: ${photo.name}`;
}

function updateBatchEventComposerVisibility() {
  const sections = {
    addition: document.getElementById('batchEventAdditionFields'),
    anomaly: document.getElementById('batchEventAnomalyFields'),
    scrap: document.getElementById('batchEventScrapFields'),
    snapshot: document.getElementById('batchEventSnapshotBlock'),
  };
  if (sections.addition) sections.addition.hidden = currentBatchEventKind !== 'addition';
  if (sections.anomaly) sections.anomaly.hidden = currentBatchEventKind !== 'anomaly';
  if (sections.scrap) sections.scrap.hidden = currentBatchEventKind !== 'scrap';
  if (sections.snapshot) sections.snapshot.hidden = currentBatchEventKind === 'note';
  document.querySelectorAll('[data-event-kind]').forEach((button) => {
    button.classList.toggle('active', button.dataset.eventKind === currentBatchEventKind);
  });
  if (currentBatchEventKind === 'anomaly') {
    const anomalyCode = document.getElementById('eventAnomalyCode');
    const severity = document.getElementById('eventAnomalySeverity');
    const meta = window.TarsAnomalyCodes?.getAnomalyCodeMeta?.(anomalyCode?.value);
    if (meta && severity && !severity.dataset.userEdited) {
      severity.value = meta.severity_default;
    }
  }
}

function resetBatchEventComposer(options = {}) {
  if (!options.preserveKind) currentBatchEventKind = 'temp_reading';
  currentBatchEventPhotoRef = '';
  [
    'eventAdditionMaterial',
    'eventAdditionQty',
    'eventAdditionReason',
    'eventAnomalyAction',
    'eventScrapCount',
    'eventScrapMass',
    'eventCommonNote',
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  populateAnomalySelect('eventAnomalyCode', true);
  populateAnomalySelect('eventScrapReason', true);
  const severity = document.getElementById('eventAnomalySeverity');
  if (severity) {
    severity.value = 'medium';
    delete severity.dataset.userEdited;
  }
  fillBatchEventSnapshotInputs();
  updateBatchEventComposerVisibility();
  renderBatchEventPhotoStatus();
}

function formatBatchEventTime(iso) {
  if (!iso) return '';
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return '';
  return new Date(parsed).toLocaleString(batchEventLocale(), {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function batchEventSummary(event) {
  if (!event) return { title: '', meta: '' };
  switch (event.kind) {
    case 'temp_reading':
      return {
        title: LANG === 'ko' ? '현재 조건 snapshot' : 'Current-state snapshot',
        meta: LANG === 'ko'
          ? `실린더 ${Number(event.process_snapshot?.cylinderTemp || 0).toFixed(1)} °C · 금형 ${Number(event.process_snapshot?.moldTemp || 0).toFixed(1)} °C`
          : `Barrel ${Number(event.process_snapshot?.cylinderTemp || 0).toFixed(1)} °C · Mold ${Number(event.process_snapshot?.moldTemp || 0).toFixed(1)} °C`,
      };
    case 'addition':
      return {
        title: LANG === 'ko'
          ? `${batchEventEscapeHtml(event.material || 'material')} +${Number(event.qty_g || 0).toFixed(1)} g`
          : `${batchEventEscapeHtml(event.material || 'material')} +${Number(event.qty_g || 0).toFixed(1)} g`,
        meta: batchEventEscapeHtml(event.reason_code || event.note || ''),
      };
    case 'anomaly': {
      const meta = window.TarsAnomalyCodes?.getAnomalyCodeMeta?.(event.code);
      const codeLabel = meta ? (LANG === 'ko' ? meta.label_ko : meta.label_en) : event.code;
      return {
        title: `${batchEventEscapeHtml(codeLabel || 'anomaly')}`,
        meta: `${batchEventEscapeHtml(event.severity || '')}${event.photo_ref ? ' · ' : ''}${event.action_taken ? ` · ${batchEventEscapeHtml(event.action_taken)}` : ''}`,
      };
    }
    case 'scrap': {
      const parts = [];
      if (Number(event.count_or_mass?.count) > 0) parts.push(`${Number(event.count_or_mass.count)} ea`);
      if (Number(event.count_or_mass?.mass_g) > 0) parts.push(`${Number(event.count_or_mass.mass_g).toFixed(1)} g`);
      const meta = window.TarsAnomalyCodes?.getAnomalyCodeMeta?.(event.reason_code);
      const reasonLabel = meta ? (LANG === 'ko' ? meta.label_ko : meta.label_en) : event.reason_code;
      return {
        title: LANG === 'ko' ? `폐기 ${parts.join(' / ')}` : `Scrap ${parts.join(' / ')}`,
        meta: batchEventEscapeHtml(reasonLabel || event.note || ''),
      };
    }
    case 'note':
    default:
      return {
        title: LANG === 'ko' ? '현장 메모' : 'Floor note',
        meta: batchEventEscapeHtml(event.note || ''),
      };
  }
}

function renderBatchEventRecentList(session) {
  const container = document.getElementById('batchEventRecentList');
  if (!container) return;
  const events = Array.isArray(session?.events) ? session.events.slice(0, 5) : [];
  if (!events.length) {
    container.innerHTML = `<div class="batch-event-empty">${batchEventText('recentEmpty')}</div>`;
    return;
  }
  container.innerHTML = events.map((event) => {
    const summary = batchEventSummary(event);
    return `
      <div class="batch-event-item">
        <div class="batch-event-item-time">${batchEventEscapeHtml(formatBatchEventTime(event.timestamp))}</div>
        <div>
          <div class="batch-event-item-title">${summary.title}</div>
          <div class="batch-event-item-meta">${summary.meta}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderBatchEventPanel() {
  const notice = document.getElementById('batchEventNotice');
  const session = batchEventSession();
  const canWrite = batchEventCanWrite(session);
  populateAnomalySelect('eventAnomalyCode', true);
  populateAnomalySelect('eventScrapReason', true);
  if (notice) {
    if (!session || !session.batch_id) {
      notice.textContent = batchEventText('needsSession');
    } else if (session.status === 'finalized' || session.status === 'cancelled') {
      notice.textContent = batchEventText('locked');
    } else {
      notice.textContent = batchEventText('ready');
    }
  }
  document.querySelectorAll('.batch-event-kind-btn,.batch-event-action-btn,.batch-event-photo-btn,#eventPhotoInput,.batch-event-field input,.batch-event-field select,.batch-event-field textarea')
    .forEach((el) => {
      if (el.id === 'batchEventCancelBtn') return;
      el.disabled = !canWrite;
    });
  renderBatchEventPhotoStatus();
  updateBatchEventComposerVisibility();
  renderBatchEventRecentList(session);
}

function selectBatchEventKind(kind) {
  currentBatchEventKind = kind || 'temp_reading';
  if (currentBatchEventKind !== 'note') fillBatchEventSnapshotInputs();
  updateBatchEventComposerVisibility();
}

function addBatchEventPhoto(file) {
  if (!file) return;
  if (!ensurePhotoStorageCapacity(Math.ceil(file.size * 1.4))) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    loadPhotos();
    const record = {
      id: `event-photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      data: e.target.result,
      name: file.name,
      created_at: new Date().toISOString(),
    };
    window.photos.push(record);
    savePhotos();
    renderPhotos();
    currentBatchEventPhotoRef = record.id;
    renderBatchEventPhotoStatus();
  };
  reader.readAsDataURL(file);
}

function useLatestBatchEventPhoto() {
  const latest = getNormalizedPhotos().slice(-1)[0];
  if (!latest) {
    alert(batchEventText('noGalleryPhoto'));
    return;
  }
  currentBatchEventPhotoRef = latest.id;
  renderBatchEventPhotoStatus();
}

function buildBatchEventPayload() {
  const session = batchEventSession();
  if (!batchEventCanWrite(session)) {
    alert(batchEventText('needsSession'));
    return null;
  }
  const note = (document.getElementById('eventCommonNote')?.value || '').trim();
  const timestamp = new Date().toISOString();
  const elapsedMin = session.started_at ? Math.max(0, Math.round((Date.parse(timestamp) - Date.parse(session.started_at)) / 60000)) : undefined;
  if (currentBatchEventKind === 'note') {
    if (!note) {
      alert(batchEventText('noteRequired'));
      return null;
    }
    return { kind: 'note', timestamp, elapsed_min: elapsedMin, note };
  }

  const snapshot = readBatchEventSnapshot();
  if (currentBatchEventKind === 'addition') {
    const material = (document.getElementById('eventAdditionMaterial')?.value || '').trim();
    const qty = Number(document.getElementById('eventAdditionQty')?.value || 0);
    const reason = (document.getElementById('eventAdditionReason')?.value || '').trim();
    if (!material) {
      alert(batchEventText('additionMaterialRequired'));
      return null;
    }
    if (!(qty > 0)) {
      alert(batchEventText('additionQtyRequired'));
      return null;
    }
    return { kind: 'addition', timestamp, elapsed_min: elapsedMin, material, qty_g: qty, reason_code: reason || undefined, note: note || undefined, ...snapshot };
  }

  if (currentBatchEventKind === 'anomaly') {
    const code = document.getElementById('eventAnomalyCode')?.value || '';
    const severity = document.getElementById('eventAnomalySeverity')?.value || 'medium';
    const actionTaken = (document.getElementById('eventAnomalyAction')?.value || '').trim();
    if (!code) {
      alert(batchEventText('anomalyCodeRequired'));
      return null;
    }
    return {
      kind: 'anomaly',
      timestamp,
      elapsed_min: elapsedMin,
      code,
      severity,
      action_taken: actionTaken || undefined,
      note: note || undefined,
      photo_ref: currentBatchEventPhotoRef || undefined,
      ...snapshot,
    };
  }

  if (currentBatchEventKind === 'scrap') {
    const count = Number(document.getElementById('eventScrapCount')?.value || 0);
    const mass = Number(document.getElementById('eventScrapMass')?.value || 0);
    const reasonCode = document.getElementById('eventScrapReason')?.value || '';
    if (!(count > 0) && !(mass > 0)) {
      alert(batchEventText('scrapRequired'));
      return null;
    }
    return {
      kind: 'scrap',
      timestamp,
      elapsed_min: elapsedMin,
      count_or_mass: {
        ...(count > 0 ? { count } : {}),
        ...(mass > 0 ? { mass_g: mass } : {}),
      },
      reason_code: reasonCode || undefined,
      note: note || undefined,
      ...snapshot,
    };
  }

  return { kind: 'temp_reading', timestamp, elapsed_min: elapsedMin, note: note || undefined, ...snapshot };
}

function saveBatchEventFromForm() {
  const session = batchEventSession();
  const event = buildBatchEventPayload();
  if (!session || !event) return;
  const next = {
    ...session,
    events: [event, ...(Array.isArray(session.events) ? session.events : [])],
  };
  const error = typeof window.getPhaBatchSessionError === 'function' ? window.getPhaBatchSessionError(next) : null;
  if (error) {
    alert(batchEventText('saveError') + error);
    return;
  }
  if (typeof window.setCurrentBatchSession === 'function') window.setCurrentBatchSession(next);
  if (typeof window.phaSaveBatchSession === 'function' && !window.phaSaveBatchSession(next)) {
    alert(batchEventText('saveError') + 'save failed');
    return;
  }
  if (typeof window.renderBatchContextBanner === 'function') window.renderBatchContextBanner();
  resetBatchEventComposer({ preserveKind: true });
  alert(batchEventText('saved'));
}

function bindBatchEventControls() {
  document.querySelectorAll('[data-event-kind]').forEach((button) => {
    if (button.dataset.bound === '1') return;
    button.addEventListener('click', () => selectBatchEventKind(button.dataset.eventKind));
    button.dataset.bound = '1';
  });
  const saveBtn = document.getElementById('batchEventSaveBtn');
  if (saveBtn && saveBtn.dataset.bound !== '1') {
    saveBtn.addEventListener('click', saveBatchEventFromForm);
    saveBtn.dataset.bound = '1';
  }
  const cancelBtn = document.getElementById('batchEventCancelBtn');
  if (cancelBtn && cancelBtn.dataset.bound !== '1') {
    cancelBtn.addEventListener('click', () => resetBatchEventComposer({ preserveKind: false }));
    cancelBtn.dataset.bound = '1';
  }
  const severity = document.getElementById('eventAnomalySeverity');
  if (severity && severity.dataset.bound !== '1') {
    severity.addEventListener('change', () => {
      severity.dataset.userEdited = '1';
    });
    severity.dataset.bound = '1';
  }
  const anomalyCode = document.getElementById('eventAnomalyCode');
  if (anomalyCode && anomalyCode.dataset.bound !== '1') {
    anomalyCode.addEventListener('change', () => updateBatchEventComposerVisibility());
    anomalyCode.dataset.bound = '1';
  }
  const photoBtn = document.getElementById('batchEventPhotoBtn');
  const photoInput = document.getElementById('eventPhotoInput');
  if (photoBtn && photoBtn.dataset.bound !== '1' && photoInput) {
    photoBtn.addEventListener('click', () => {
      photoInput.value = '';
      photoInput.click();
    });
    photoBtn.dataset.bound = '1';
  }
  if (photoInput && photoInput.dataset.bound !== '1') {
    photoInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) addBatchEventPhoto(file);
    });
    photoInput.dataset.bound = '1';
  }
  const useLatestBtn = document.getElementById('batchEventUseLatestPhotoBtn');
  if (useLatestBtn && useLatestBtn.dataset.bound !== '1') {
    useLatestBtn.addEventListener('click', useLatestBatchEventPhoto);
    useLatestBtn.dataset.bound = '1';
  }
  resetBatchEventComposer({ preserveKind: false });
}

function bindBatchSessionControls() {
  const startBtn = document.getElementById('startBatchSessionBtn');
  if (startBtn && startBtn.dataset.bound !== '1') {
    startBtn.addEventListener('click', startBatchSession);
    startBtn.dataset.bound = '1';
  }
  const endBtn = document.getElementById('endBatchSessionBtn');
  if (endBtn && endBtn.dataset.bound !== '1') {
    endBtn.addEventListener('click', endBatchSession);
    endBtn.dataset.bound = '1';
  }
}

function startBatchSession() {
  const existing = typeof window.getCurrentBatchSession === 'function' ? window.getCurrentBatchSession() : null;
  const base = (existing && typeof existing === 'object') ? existing : (typeof window.ensureCurrentBatchSession === 'function' ? window.ensureCurrentBatchSession() : null);
  if (!base) return;

  const operatorReply = prompt(batchSessionText('operatorPrompt'), base.operator || '');
  if (operatorReply === null) return;

  let batchId = String(base.batch_id || '').trim();
  if (!batchId) {
    const batchReply = prompt(batchSessionText('batchPrompt'), '');
    if (batchReply === null) return;
    batchId = String(batchReply || '').trim();
  }
  if (!batchId) {
    alert(batchSessionText('batchRequired'));
    return;
  }

  const updated = {
    ...base,
    batch_id: batchId,
    operator: String(operatorReply || '').trim() || undefined,
    started_at: new Date().toISOString(),
    status: 'running',
  };
  const error = typeof window.getPhaBatchSessionError === 'function' ? window.getPhaBatchSessionError(updated) : null;
  if (error) {
    alert(batchSessionText('startError') + error);
    return;
  }

  if (typeof window.setCurrentBatchSession === 'function') window.setCurrentBatchSession(updated);
  const saved = typeof window.phaSaveBatchSession === 'function' ? window.phaSaveBatchSession(updated) : true;
  if (!saved) {
    alert(batchSessionText('startError') + (typeof window.getPhaBatchSessionError === 'function' ? window.getPhaBatchSessionError(updated) : 'save failed'));
    return;
  }
  if (typeof window.renderBatchContextBanner === 'function') window.renderBatchContextBanner();
  alert(batchSessionText('started') + updated.batch_id);
}

function endBatchSession() {
  const session = typeof window.getCurrentBatchSession === 'function' ? window.getCurrentBatchSession() : null;
  if (!session || session.status !== 'running') return;
  if (!confirm(batchSessionText('endConfirm'))) return;

  const updated = {
    ...session,
    ended_at: new Date().toISOString(),
    status: 'finalized',
  };
  const error = typeof window.getPhaBatchSessionError === 'function' ? window.getPhaBatchSessionError(updated) : null;
  if (error) {
    alert(batchSessionText('endError') + error);
    return;
  }

  if (typeof window.setCurrentBatchSession === 'function') window.setCurrentBatchSession(updated);
  const saved = typeof window.phaSaveBatchSession === 'function' ? window.phaSaveBatchSession(updated) : true;
  if (!saved) {
    alert(batchSessionText('endError') + (typeof window.getPhaBatchSessionError === 'function' ? window.getPhaBatchSessionError(updated) : 'save failed'));
    return;
  }
  if (typeof window.renderBatchContextBanner === 'function') window.renderBatchContextBanner();
  alert(batchSessionText('ended') + updated.batch_id);
}

window.bindBatchSessionControls = bindBatchSessionControls;
window.bindBatchEventControls = bindBatchEventControls;
window.renderBatchEventPanel = renderBatchEventPanel;

// Immediately initialize photo uploader, material cards, and troubleshooting data.
// Because this script is loaded at the end of the body, DOM elements are available.
(function initCustom() {
  // Attach change listener to photo upload input
  const pU = document.getElementById('photoUpload');
  if (pU) {
    pU.addEventListener('change', (e) => {
      handlePhotoFiles(e.target.files);
    });
  }
  // Initialize photos and render gallery
  loadPhotos();
  renderPhotos();
  // Populate material database and update display
  loadMaterialCards();
  // Populate troubleshooting data and update display
  loadTroubleshootingKB();
  // Batch-session controls are rendered from the Flash tab template.
  bindBatchSessionControls();
  bindBatchEventControls();
  renderBatchEventPanel();
})();
