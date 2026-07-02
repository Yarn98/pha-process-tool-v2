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

// ────────────────────────────────────────────────────────────────────
// Korean troubleshooting fallbacks.
//
// The primary source of truth is now data/troubleshooting_kb.json with
// progressive *_ko and plain_* fields. TS_KO stays in place as a safe
// fallback for local file opens or any fetch failure until the JSON
// rollout is complete for every entry.
//
// Process label translations live in PROC_KO.
// ────────────────────────────────────────────────────────────────────
const PROC_KO = {
  "compounding":    "컴파운딩",
  "sheet_film":     "시트 / 필름",
  "injection":      "사출 성형",
  "thermoforming":  "열성형",
  "general":        "일반",
};

const TS_KO = {
  "Torque spike or extruder overload": {
    symptom: "토크 스파이크 / 압출기 과부하",
    plain: "압출기 모터 부하가 갑자기 튀거나 스크루가 멈출 듯 힘들어하는 상황. 보통 원료가 너무 차갑거나, 너무 많이 들어가거나, 젖어서 덩어리지는 것이 원인입니다.",
    likely_causes: [
      "원료 온도가 너무 낮거나 점도가 높음",
      "피드(투입)량이 과다",
      "펠릿 수분으로 덩어리짐",
      "스크루·배럴 마모로 이송 능력 저하",
    ],
    diagnostics: "모터 부하와 용융 압력 추이를 관찰 · 호퍼에서 원료가 걸려 있는지(bridging) 확인 · 진공 벤트 막힘 점검 · Karl Fischer 또는 dew point gauge로 펠릿 수분 측정.",
    quick_fixes: [
      "피드량 10–20 % 감소",
      "용융 온도 5–10 °C 상향",
      "사이드 피더 우회로 막힘 제거",
      "호환 원료(예: 순수 PLA)로 퍼지",
    ],
    root_fixes: [
      "펠릿 수분 200 ppm 이하로 건조",
      "스크루·배럴 마모 상태 확인, 필요 시 재생/교체",
      "벤트 최적화 및 진공으로 휘발분 제거",
      "피드 쓰로트 온도 조정으로 브릿징 방지",
    ],
    control_knobs: ["피드량", "존 온도", "스크루 RPM", "진공 벤트 압력"],
    notes: "aPHA/PHA 배합은 수분에 매우 민감합니다. 수분이 있으면 가수분해가 일어나 분자량이 떨어지고 겔(gel)이 생깁니다.",
  },
  "Gels or fish\u2011eyes in pellets or film": {
    symptom: "겔(gel) / 피시아이(fish-eye)",
    plain: "펠릿이나 필름 표면에 작은 덩어리·점이 보이는 현상. 원료끼리 잘 섞이지 않았거나, 너무 오래 가열돼 타버렸거나, 청소가 덜 된 흔적일 수 있습니다.",
    likely_causes: [
      "scPHA / aPHA 성분 혼합 불충분",
      "과열로 인한 열 분해·가교",
      "직전 원료 잔류로 인한 오염",
      "데드 존에 정체된 원료 축적",
    ],
    diagnostics: "추출물을 현미경으로 관찰해 겔 크기·분포 확인 · 온도 프로파일 재점검 · 스크루·혼련 엘리먼트의 데드 스폿 유무 확인 · 퍼지 절차 평가.",
    quick_fixes: [
      "스크루 RPM 또는 혼련 엘리먼트 증설로 분산 혼합 강화",
      "용융 온도 5–10 °C 낮춰 열 분해 완화",
      "그레이드 교체 시 PETG·HDPE 같은 전이 수지로 퍼지",
      "스크린 팩 메쉬를 더 촘촘하게 교체",
    ],
    root_fixes: [
      "혼합 구간이 강한 스크루로 재설계",
      "엄격한 퍼지 SOP 수립 + 주기적 용매 flush",
      "체류 시간 최소화(처리량에 맞는 압출기 규격)",
      "원료 품질·청결도 정기 감사",
    ],
    control_knobs: ["스크루 RPM", "존 온도", "스크린 팩 메쉬 크기", "체류 시간"],
    notes: "겔은 필름 품질을 떨어뜨립니다. 온도를 안정적으로 유지하고 과도한 전단을 피하세요.",
  },
  "Die drool or build\u2011up at die lips": {
    symptom: "다이 드룰(die drool) / 다이 립 침착",
    plain: "다이(금형 출구) 주변에 끈적한 찌꺼기가 쌓이는 현상. 온도가 너무 높거나, 필러(탈크·탄산칼슘)가 표면으로 빠져나오거나, 다이 설계에 흐름이 정체되는 부분이 있을 때 발생합니다.",
    likely_causes: [
      "용융 온도 과다",
      "필러(탈크·CaCO₃) 표면 이동",
      "스크루 RPM 낮아 체류 시간 증가",
      "다이 설계 불량(데드 존)",
    ],
    diagnostics: "운전 중 다이 표면 침착 상태 관찰 · 다이 압력 측정 · 온도 프로파일 비교 · 컴파운드 내 필러 분산 상태 확인.",
    quick_fixes: [
      "다이·말단 존 온도 5–10 °C 하향",
      "스크루 RPM 약간 상향으로 체류 시간 단축",
      "다이 립 청소 및 브레이커 플레이트 설치",
      "퍼지로 분해된 물질 제거",
    ],
    root_fixes: [
      "필러 함량 균형을 위한 배합 최적화",
      "정체 구간을 줄이는 다이 재설계",
      "산화방지제·안정제 패키지 적용",
      "주기적 다이 표면 청소 계획 수립",
    ],
    control_knobs: ["다이 온도", "스크루 RPM", "피드량", "필러 함량"],
    notes: "다이 드룰은 치수 불균일과 가동 중단을 유발합니다.",
  },
  "Sheet sticks to chill roll / tacky surface": {
    symptom: "시트가 칠 롤에 붙음 / 표면 끈적임",
    plain: "시트가 냉각 롤에서 잘 떨어지지 않거나 표면이 끈적끈적한 문제. PHA는 결정화가 느려서 냉각이 부족하면 점착이 생기기 쉽습니다.",
    likely_causes: [
      "PHA/PLA 블렌드의 결정화 속도 느림",
      "롤 온도 과다",
      "에어나이프 또는 닙 압력 부족",
      "잔류 수분으로 표면 발포",
    ],
    diagnostics: "롤 표면 온도를 권장치(30–50 °C)와 비교 · 건조기 dew point과 수분 함량 측정 · 첫 번째 칠 롤에서 접촉각·감김 상태 관찰 · 점착 시 헤이즈·광택 변화 확인.",
    quick_fixes: [
      "1차 롤 온도 5–10 °C 하향 + 냉각수 유량 증대",
      "감김 각도 또는 닙 압력 감소로 접촉 면적 축소",
      "에어나이프로 접촉 지연 및 균일 냉각 유도",
      "용융 온도 5 °C 하향으로 끈적임 감소",
    ],
    root_fixes: [
      "결정화 촉진제(핵제) 추가",
      "라인 속도 대 두께 재밸런싱",
      "저점착 코팅 또는 마이크로 텍스처 롤 적용",
      "건조 강화로 수분 400 ppm 이하 유지",
    ],
    control_knobs: ["롤 온도", "감김 각/닙 압력", "에어나이프 유량", "용융 온도", "라인 속도"],
    notes: "PHA는 본질적으로 결정화가 느려 점착이 생기기 쉽습니다. 냉각 프로파일 최적화가 핵심입니다.",
  },
  "Gauge variation or web sagging": {
    symptom: "두께 편차 / 웹 처짐",
    plain: "시트 두께가 위치마다 다르거나 중앙이 처지는 현상. 다이 간격이 맞지 않거나, 용융 온도가 들쑥날쑥하거나, 라인 속도가 과도할 때 발생합니다.",
    likely_causes: [
      "다이 갭 불균일",
      "용융 온도 변동",
      "라인 속도 과다",
      "롤 폭 방향 냉각 불균형",
    ],
    diagnostics: "폭 방향 시트 두께 측정 · 다이 볼트 토크 확인 · 다이와 롤의 온도 프로파일 기록 · 스크루 RPM·압력 안정성 모니터링.",
    quick_fixes: [
      "다이 볼트 조정으로 갭 보정",
      "존 온도 미세 조정으로 용융 균일화",
      "라인 속도 감소 또는 토출 증가로 안정적 연신",
      "롤 좌우 온도 평형 맞추기",
    ],
    root_fixes: [
      "다이와 볼트 텐션 정기 교정",
      "자동 두께 게이지 + 피드백 제어 설치",
      "균일 유동 위한 멀티 매니폴드 다이 업그레이드",
      "롤 연마·얼라인먼트 개선",
    ],
    control_knobs: ["다이 볼트", "존 온도", "라인 속도", "롤 온도"],
    notes: "균일한 시트 두께는 후속 열성형 품질의 전제입니다. 공정·장비 안정성을 유지하세요.",
  },
  "Short shot (incomplete fill)": {
    symptom: "미성형 / 쇼트샷(short shot)",
    plain: "금형 안이 다 채워지지 않아 제품이 불완전하게 나오는 상황. 사출 속도·압력이 부족하거나, 수지 온도가 너무 낮거나, 흐름길이 좁아 막힌 경우입니다.",
    likely_causes: [
      "사출 속도 또는 압력 부족",
      "용융 또는 금형 온도 낮음",
      "게이트 부위 흐름 제한",
      "혼합 불량으로 점도 높음",
    ],
    diagnostics: "쇼트샷 연구로 사출량 단계적 증가 · 흐름 패턴과 게이트 프리즈 관찰 · 용융 온도와 설정값 비교 · 스크루·노즐 막힘 확인.",
    quick_fixes: [
      "사출 속도 10–20 mm/s 상향",
      "용융 온도 5 °C 상향 (CA1180P 기준 175–190 °C 범위 내)",
      "V/P 전환 위치를 스트로크의 1–2 % 지연시켜 충진 강화",
      "1차 보압 30–50 bar 상향",
    ],
    root_fixes: [
      "러너·게이트 설계 최적화",
      "공기 갇힘 방지용 적절한 벤팅",
      "몰드 플로우 해석으로 두께 조정",
      "원료 건조·균일화 재확인",
    ],
    control_knobs: ["사출 속도", "용융 온도", "V/P 전환 위치", "보압"],
    notes: "저유동 PHA 배합에서 자주 발생합니다. 체계적 쇼트샷 스터디로 최적 충진 조건을 찾으세요.",
  },
  "Splay/silver streaks or bubbles": {
    symptom: "실버 스트릭(스플레이) / 기포",
    plain: "제품 표면에 은빛 줄무늬나 기포가 보이는 현상. 대부분 원료가 충분히 건조되지 않아 수분이 기화했거나, 수지가 너무 뜨거워져 분해될 때 나타납니다.",
    likely_causes: [
      "펠릿 수분으로 가수분해·가스 발생",
      "용융 온도 과다로 인한 분해",
      "사출 속도 과다로 전단 발열",
      "진공 누설로 공기 유입",
    ],
    diagnostics: "Dew point과 수분 분석기로 수분 확인 · 노즐에서 용융물 기포 관찰 · 실제 노즐 온도 기록 · 황색·갈색 변색(열화) 확인 · 스크루 RPM·역압 설정 평가.",
    quick_fixes: [
      "목표 수분(<0.02 %, 200 ppm)으로 재건조",
      "노즐 온도 5 °C 하향",
      "사출 속도 10–20 mm/s 감소",
      "배럴 퍼지로 분해물 제거",
    ],
    root_fixes: [
      "–40 °C dew point 가능한 건조기 설치",
      "PLA 분해 방지 위해 용융 온도 190 °C 이하 유지",
      "스크루 역압 낮게(3–5 bar) 유지",
      "주기적 PLA 퍼지로 배럴 청결 유지",
    ],
    control_knobs: ["건조 온도·시간", "노즐·배럴 온도", "사출 속도", "역압"],
    notes: "실버 스트릭은 주로 수분 문제입니다. 건조와 온도를 잡으면 가수분해·표면 결함을 예방할 수 있습니다.",
  },
  "Flash (excess material escaping parting line)": {
    symptom: "플래시(flash) / 파팅 라인 넘침",
    plain: "금형 합형면 사이로 수지가 새어 나와 얇은 날개가 생기는 현상. 보압이 과다하거나 온도가 높거나 금형 면이 손상됐거나 클램프 힘이 부족할 때 발생합니다.",
    likely_causes: [
      "보압 과다",
      "용융 또는 금형 온도 과다",
      "파팅 면 마모·손상",
      "클램프 힘 부족",
    ],
    diagnostics: "파팅 라인 마모 상태 검사 · 클램프 힘과 필요 톤수 비교 · 보압·시간 확인 · 얼라인먼트·벤팅 점검.",
    quick_fixes: [
      "보압 50–100 bar 하향",
      "용융 온도 5 °C 하향",
      "금형 온도 5 °C 하향 또는 클램프 톤수 10–20 % 상향",
      "금형 사이 이물 청소",
    ],
    root_fixes: [
      "파팅 면 재가공",
      "과도 클램프 방지용 하드 스톱 설치",
      "과충진 방지를 위한 파트·게이트 설계 검토",
      "금형 벤트 청결·적정성 유지",
    ],
    control_knobs: ["보압", "용융·금형 온도", "클램프 힘"],
    notes: "플래시는 과충진 또는 금형 손상의 신호입니다. 압력 균형과 장비 정비가 핵심입니다.",
  },
  "Sink marks or voids": {
    symptom: "싱크 마크 / 공극(void)",
    plain: "두꺼운 부위가 안으로 움푹 들어가거나 속에 빈 공간이 생기는 현상. 보압·보압 시간이 부족해 수축 보상이 안 된 것이 주 원인입니다.",
    likely_causes: [
      "보압·유지 압력 부족",
      "보압 시간 짧음",
      "리브·보스 부위 두께 과다",
      "냉각 불균일 또는 금형 온도 낮음",
    ],
    diagnostics: "싱크 위치 확인 · 파트 중량 재현성 점검 · 게이트 프리즈 시간 스터디 · 보압·시간 설정 재검토.",
    quick_fixes: [
      "1차 보압 30–70 bar 상향 + 보압 시간 0.5–1 s 연장",
      "냉각 시간 2–3 s 증가",
      "V/P 전환을 앞당겨 충진 여유 확보",
      "적절한 보압 램프 프로파일 적용",
    ],
    root_fixes: [
      "두꺼운 부위 회피 파트 재설계",
      "유동·충진 개선 위한 게이트 위치·크기 수정",
      "금형 온도 ±1 °C 이내로 균형",
      "결정화 촉진용 핵제 검토",
    ],
    control_knobs: ["보압", "보압 시간", "냉각 시간", "게이트 설계"],
    notes: "싱크는 내부 수축 때문에 생깁니다. 충분한 보압과 균일 냉각으로 완화됩니다.",
  },
  "Warping or twisting": {
    symptom: "뒤틀림(warp) / 비틀림",
    plain: "제품이 평평하지 않고 휘거나 비뚤어지는 현상. 냉각이 부위별로 다르거나, PLA와 aPHA의 수축률이 달라 서로 당길 때 발생합니다.",
    likely_causes: [
      "파트별 냉각 불균일",
      "사출 속도 과다로 인한 과도 분자 배향",
      "이젝션 중 지지 부족",
      "PLA·aPHA 상(phase) 수축률 차이",
    ],
    diagnostics: "금형 여러 지점 온도 측정 · 냉각 중 파트 거동 관찰 · 캐비티 간 충진 불균형 확인 · 사출·보압 속도 프로파일 평가.",
    quick_fixes: [
      "금형 온도 ±1 °C 이내로 평형",
      "보압 램프를 부드럽게, 2차 단계 연장",
      "사출 속도 조정으로 전단 배향 감소",
      "파트 설계에 지지 핀·리프터 추가",
    ],
    root_fixes: [
      "금형 냉각 채널 설계 최적화",
      "러너 시스템·게이트 위치 밸런싱",
      "핵제 또는 섬유 보강 실험",
      "어닐링·후공정 컨디셔닝 도입",
    ],
    control_knobs: ["금형 온도", "사출·보압 속도 프로파일", "냉각 시간", "게이트·러너 설계"],
    notes: "뒤틀림은 부위별 수축 차이에서 옵니다. 온도와 충진 균일성을 잡는 것이 결정적입니다.",
  },
  "Poor form definition or tearing": {
    symptom: "성형 불량 / 찢어짐",
    plain: "열성형 시 시트가 원하는 형태로 잘 맞지 않거나 가장자리가 찢어지는 현상. 시트가 충분히 데워지지 않았거나, 플러그 어시스트 온도가 낮거나, 두께가 들쑥날쑥할 때 발생합니다.",
    likely_causes: [
      "시트 온도 부족",
      "플러그 어시스트 온도 불충분",
      "금형 폐쇄 속도 과다",
      "시트 두께 불균일",
    ],
    diagnostics: "IR 온도계로 시트 표면 온도 모니터링 · 성형품에서 얇은 부위 확인 · 가열 시간·오븐 존 설정 재검토 · 플러그 어시스트 온도와 시트 온도 비교.",
    quick_fixes: [
      "오븐 온도 5 °C 상향 + 가열 시간 연장",
      "플러그 어시스트를 시트 온도에 근접하게 가열",
      "금형 폐쇄 속도 감소로 흐름 시간 확보",
      "공압으로 사전 예비 신장",
    ],
    root_fixes: [
      "시트 온도 폐루프 제어 설치",
      "압출에서 균일한 시트 두께 확보",
      "재료 분배 균일 위한 금형·플러그 설계 최적화",
      "온도 제어 플러그 어시스트 도입",
    ],
    control_knobs: ["오븐 온도", "가열 시간", "플러그 어시스트 온도", "금형 폐쇄 속도"],
    notes: "PHA/PLA 블렌드의 열성형은 공정 윈도우가 좁아 정밀한 열관리가 필요합니다.",
  },
};

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
