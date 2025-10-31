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
    "MFR_g_10min_190_2_16": 4.0,
    "Tg_C": -6.0,
    "Tm_C": 160.0,
    "tensile_MPa": 32.5,
    "elongation_%": 60.0,
    "izod_kJ_m2": 28,
    "HDT_C": 130.0
  },
  "A1000P": {
    "density_g_cm3": 1.23,
    "MFR_g_10min_190_2_16": 5,
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
    "MFR_g_10min_190_2_16": 27.5,
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
        db[grade] = Object.assign({}, db[grade] || {}, rec);
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
const TS_DATA = [
  {
    "process": "compounding",
    "symptom": "Torque spike or extruder overload",
    "likely_causes": [
      "Resin too cold or viscous",
      "Excessive feed rate",
      "Wet pellets causing agglomeration",
      "Screw or barrel wear causing poor conveying"
    ],
    "diagnostics": "Monitor motor load and melt pressure curves; check hopper for bridging; inspect vacuum vent for blockages; verify pellet moisture with Karl Fischer or dew point gauge.",
    "quick_fixes": [
      "Reduce feed rate 10–20 %",
      "Increase melt temperature by 5–10 °C",
      "Bypass side feeders to clear blockage",
      "Purge with compatible resin (e.g., neat PLA)"
    ],
    "root_fixes": [
      "Ensure pellets are dried to ≤200 ppm moisture",
      "Check screw and barrel wear; refurbish if worn",
      "Optimize venting and use vacuum to remove volatiles",
      "Balance feed throat temperature to prevent bridging"
    ],
    "control_knobs": ["Feed rate", "Zone temperatures", "Screw speed", "Vacuum vent pressure"],
    "notes": "aPHA/PHA blends are sensitive to moisture; water generates hydrolysis leading to low molecular weight and gels.",
    "related_images": []
  },
  {
    "process": "compounding",
    "symptom": "Gels or fish‑eyes in pellets or film",
    "likely_causes": [
      "Incomplete mixing of scPHA and aPHA components",
      "Thermal degradation causing crosslinking",
      "Contamination from previous resin",
      "Accumulated stagnant material in dead zones"
    ],
    "diagnostics": "Examine extrudate under microscope to identify size/distribution of gels; review temperature profiles; check screw flights and mixing elements for dead spots; evaluate purge procedure.",
    "quick_fixes": [
      "Increase screw rpm or kneading elements to improve dispersive mixing",
      "Lower melt temperature by 5–10 °C to reduce degradation",
      "Implement purge between grade changes using transition resin (e.g., PETG, HDPE)",
      "Screen out large contaminants with finer screen pack"
    ],
    "root_fixes": [
      "Design screw with better mixing section",
      "Adopt rigorous purge SOP and use solvent flush periodically",
      "Avoid long residence times; size extruder for throughput",
      "Audit raw material quality and cleanliness"
    ],
    "control_knobs": ["Screw rpm", "Zone temperatures", "Screen pack mesh size", "Residence time"],
    "notes": "Gels compromise film quality; maintain stable temperature and avoid over‑shearing.",
    "related_images": []
  },
  {
    "process": "compounding",
    "symptom": "Die drool or build‑up at die lips",
    "likely_causes": [
      "Excessive melt temperature",
      "Filler (talc, CaCO₃) migration to surface",
      "Low screw speed causing long residence",
      "Poor die design with dead zones"
    ],
    "diagnostics": "Inspect die face during run for accumulation; measure die pressure; review temperature settings vs. recommended profiles; examine filler dispersion in compound.",
    "quick_fixes": [
      "Lower die and end‑zone temperature by 5–10 °C",
      "Increase screw speed slightly to reduce residence time",
      "Clean die lips and install breaker plate",
      "Use purge to remove degraded material"
    ],
    "root_fixes": [
      "Optimize formulation to balance filler level",
      "Modify die design to reduce stagnation",
      "Use anti‑oxidant or stabilizer package",
      "Implement periodic die face cleaning schedule"
    ],
    "control_knobs": ["Die temperature", "Screw speed", "Feed rate", "Filler loading"],
    "notes": "Die drool leads to inconsistent dimensions and downtime.",
    "related_images": []
  },
  {
    "process": "sheet_film",
    "symptom": "Sheet sticks to chill roll / tacky surface",
    "likely_causes": [
      "Slow crystallization of PHA/PLA blend",
      "Roll temperature too high",
      "Insufficient air knife or nip pressure",
      "High residual moisture causing surface foaming"
    ],
    "diagnostics": "Measure roll surface temperature and compare with recommended 30–50 °C; check dew point of dryer and moisture content; observe contact angle and wrap on first chill roll; note whether haze or gloss variations accompany sticking.",
    "quick_fixes": [
      "Lower first roll temperature by 5–10 °C and increase cooling water flow",
      "Reduce wrap angle or nip pressure to decrease contact area",
      "Use air knife to delay contact and promote even cooling",
      "Lower melt temperature 5 °C to reduce tackiness"
    ],
    "root_fixes": [
      "Add nucleating agent to accelerate crystallization",
      "Rebalance extrusion line speed vs. thickness",
      "Apply low‑adhesion roll coating or micro‑texture",
      "Improve drying to <400 ppm moisture"
    ],
    "control_knobs": ["Roll temperatures", "Wrap angle/nip pressure", "Air knife flow", "Melt temperature", "Line speed"],
    "notes": "PHA’s inherently slow crystallization can cause tackiness; optimizing cooling profile is essential.",
    "related_images": []
  },
  {
    "process": "sheet_film",
    "symptom": "Gauge variation or web sagging",
    "likely_causes": [
      "Non‑uniform die gap",
      "Inconsistent melt temperature",
      "Excessive line speed",
      "Uneven cooling across roll width"
    ],
    "diagnostics": "Measure sheet thickness across width; check die bolt torque; record temperature profile across die and rolls; monitor screw speed and pressure stability.",
    "quick_fixes": [
      "Adjust die bolts to correct gap",
      "Fine‑tune zone temperatures to maintain uniform melt",
      "Reduce line speed or increase output to achieve stable draw",
      "Balance roll temperatures side‑to‑side"
    ],
    "root_fixes": [
      "Regularly calibrate die and bolt tension",
      "Install automatic thickness gauge and feedback control",
      "Upgrade to multi‑manifold die for uniform flow",
      "Improve roll polishing and alignment"
    ],
    "control_knobs": ["Die bolts", "Zone temperatures", "Line speed", "Roll temperatures"],
    "notes": "Uniform sheet gauge is critical for downstream thermoforming; maintain stable process and equipment.",
    "related_images": []
  },
  {
    "process": "injection",
    "symptom": "Short shot (incomplete fill)",
    "likely_causes": [
      "Insufficient injection speed or pressure",
      "Cold melt or mold temperature",
      "Flow restrictions at gate",
      "High viscosity due to poor mixing"
    ],
    "diagnostics": "Perform short‑shot study by incrementally increasing shot size; observe flow pattern and gate freeze; check melt temperature vs. setpoint; examine screw and nozzle for obstructions.",
    "quick_fixes": [
      "Increase injection speed by 10–20 mm/s",
      "Raise melt temperature 5 °C (within 175–190 °C window for CA1180P)",
      "Delay V/P transfer by 1–2 % of stroke to pack more material",
      "Increase first‑stage hold pressure by 30–50 bar"
    ],
    "root_fixes": [
      "Optimize runner and gate design",
      "Ensure proper venting to minimize trapped air",
      "Use mold flow analysis to adjust wall thickness",
      "Confirm material is properly dried and homogeneous"
    ],
    "control_knobs": ["Injection speed", "Melt temperature", "V/P transfer position", "Hold pressure"],
    "notes": "Short shots are common when using low‑flow PHA blends; systematic study helps set optimum fill parameters.",
    "related_images": []
  },
  {
    "process": "injection",
    "symptom": "Splay/silver streaks or bubbles",
    "likely_causes": [
      "Moisture in pellets leading to hydrolysis and gas evolution",
      "Decomposition from excessive melt temperature",
      "High injection speed causing shear heating",
      "Vacuum leaks sucking in air"
    ],
    "diagnostics": "Check dew point and moisture content using moisture analyzer; inspect melt for bubbling at nozzle; record actual nozzle temperature; look for yellow/brown degradation; evaluate injection screw rpm and back pressure settings.",
    "quick_fixes": [
      "Re‑dry resin to target moisture (<0.02 % or 200 ppm)",
      "Lower nozzle temperature by 5 °C",
      "Reduce injection speed by 10–20 mm/s",
      "Purge barrel to remove degraded material"
    ],
    "root_fixes": [
      "Install dryer with −40 °C dew point capability",
      "Limit melt temperature <190 °C to prevent PLA degradation",
      "Maintain screw back pressure low (3–5 bar)",
      "Periodically purge with PLA to clean barrel"
    ],
    "control_knobs": ["Drying temperature/time", "Nozzle and barrel temperatures", "Injection speed", "Back pressure"],
    "notes": "Splay is primarily moisture‑related; controlling dryness and temperature prevents hydrolysis and ensures surface quality.",
    "related_images": []
  },
  {
    "process": "injection",
    "symptom": "Flash (excess material escaping parting line)",
    "likely_causes": [
      "Excessive hold pressure",
      "Too high melt or mold temperature",
      "Damaged or worn mold parting surfaces",
      "Improper clamp force"
    ],
    "diagnostics": "Inspect parting line for wear; measure clamp force vs. required tonnage; check hold pressure and time; verify alignment and venting.",
    "quick_fixes": [
      "Reduce hold pressure by 50–100 bar",
      "Lower melt temperature 5 °C",
      "Reduce mold temperature by 5 °C or increase clamp tonnage 10–20 %",
      "Check for debris between mold halves and clean"
    ],
    "root_fixes": [
      "Recondition mold parting surfaces",
      "Install hard stops to prevent over‑clamp",
      "Design part and gate to avoid over‑packing",
      "Ensure mold vents are clean and adequate"
    ],
    "control_knobs": ["Hold pressure", "Melt and mold temperatures", "Clamp force"],
    "notes": "Flash indicates over‑packing or mold damage; balancing pressures and machine maintenance is key.",
    "related_images": []
  },
  {
    "process": "injection",
    "symptom": "Sink marks or voids",
    "likely_causes": [
      "Insufficient packing/holding pressure",
      "Short hold time",
      "Thick rib or boss sections",
      "Uneven cooling or low mold temperature"
    ],
    "diagnostics": "Identify location of sinks; check part weight repeatability; perform gate freeze time study; review hold pressure and time settings.",
    "quick_fixes": [
      "Increase first‑stage hold pressure by 30–70 bar and extend hold time by 0.5–1 s",
      "Increase cooling time 2–3 s",
      "Adjust V/P transfer earlier to allow more packing",
      "Use proper packing profile ramp"
    ],
    "root_fixes": [
      "Redesign part to avoid thick sections",
      "Modify gate location or size to improve flow and packing",
      "Balance mold temperature within ±1 °C",
      "Consider nucleating agents to speed crystallization"
    ],
    "control_knobs": ["Hold pressure", "Hold time", "Cooling time", "Gate design"],
    "notes": "Sinks occur when inner material shrinks; proper packing and cooling mitigate.",
    "related_images": []
  },
  {
    "process": "injection",
    "symptom": "Warping or twisting",
    "likely_causes": [
      "Uneven cooling across part",
      "Excessive orientation from high injection speed",
      "Inadequate support during ejection",
      "Incompatible shrink rates of PLA and aPHA phases"
    ],
    "diagnostics": "Measure mold temperature at multiple points; observe part as it cools; check for imbalanced packing between cavities; evaluate injection and hold speed profiles.",
    "quick_fixes": [
      "Equalize mold temperatures within ±1 °C",
      "Use softer hold pressure ramp and extend second stage",
      "Adjust injection speed to reduce shear orientation",
      "Add support pins or lifters to part design"
    ],
    "root_fixes": [
      "Optimize cooling channel design in mold",
      "Balance runner system and gate location",
      "Experiment with nucleating agents or fiber reinforcement",
      "Implement annealing or post‑mold conditioning"
    ],
    "control_knobs": ["Mold temperature", "Injection/hold speed profile", "Cooling time", "Gate and runner design"],
    "notes": "Warp results from differential shrinkage; controlling temperature and packing uniformity is crucial.",
    "related_images": []
  },
  {
    "process": "thermoforming",
    "symptom": "Poor form definition or tearing",
    "likely_causes": [
      "Sheet temperature too low",
      "Insufficient plug assist temperature",
      "Fast mold closing speed",
      "Non‑uniform sheet thickness"
    ],
    "diagnostics": "Monitor sheet surface temperature with IR thermometer; examine formed part for thin spots; review heating time and oven zone settings; check plug assist temperature vs. sheet temperature.",
    "quick_fixes": [
      "Raise oven temperature 5 °C and extend heat time",
      "Heat plug assist to near sheet temperature",
      "Slow down mold closing speed to allow better flow",
      "Pre‑stretch sheet with air pressure before forming"
    ],
    "root_fixes": [
      "Install closed‑loop sheet temperature control",
      "Ensure uniform sheet gauge from extrusion",
      "Optimize mold and plug design for even material distribution",
      "Incorporate temperature‑controlled plug assist"
    ],
    "control_knobs": ["Oven temperature", "Heat time", "Plug assist temperature", "Mold closing speed"],
    "notes": "Thermoforming of PHA/PLA blends requires precise thermal management due to narrow processing window.",
    "related_images": []
  }
];

// Load troubleshooting knowledge base from embedded dataset
async function loadTroubleshootingKB() {
  try {
    window.tsData = TS_DATA;
    if (typeof renderTS === 'function') renderTS();
  } catch (e) {
    console.warn('Failed to load troubleshooting KB', e);
  }
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
    const reader = new FileReader();
    reader.onload = function (e) {
      window.photos.push(e.target.result);
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
  loadPhotos();
  grid.innerHTML = '';
  (window.photos || []).forEach((src, i) => {
    const div = document.createElement('div');
    div.className = 'photo';
    const img = document.createElement('img');
    img.src = src;
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.onclick = function () {
      window.photos.splice(i, 1);
      savePhotos();
      renderPhotos();
    };
    div.appendChild(img);
    div.appendChild(btn);
    grid.appendChild(div);
  });
}

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
})();