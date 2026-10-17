# Pack B — GPT-6 Pro answer: key content (structured notes)

Source: ChatGPT project "PHA 가공 조건", conversation "압출 라인 사실화 조사"
(https://chatgpt.com/g/g-p-67ac788743b88191b7ebf6f1377c1361-pha-gagong-jogeon/c/6ad23f7a-2a08-83ee-aa32-c31d61713230),
GPT-6 with reasoning level Pro, 37 min 23 s. Claude's structured notes of the completed answer, not a character-level export.
Grades: A = public OEM catalogue/standard (that model/version only), B = engineering relation/paper, C = teaching design value
(not a drawing, warranty or PHA operating advice). Confidence H = high within the source, M = plausible appearance design.
Units: spec in mm, 3D in m (factor 0.001). Frame/working heights are absolute, not scaled with D.

## Priority of differences in the current models (from renders + motion JSON only)
1 Compounding: two shafts + torque-splitting gearbox barely identifiable; KB look like gear teeth → drive train, figure-8 barrel,
  lobed KB, gravimetric feeding and devolatilisation; then bath, dewatering, enclosed pelletiser, classifier.
2 Straw: render is a tube-die detail but the JSON describes a whole line → separate die detail and whole-line image; sizing,
  cooling, haul-off, cutter, multi-lane path.
3 EBM: clamp/shuttle/pin/cut/deflash simplified → continuous dual shuttle with a free parison; cooling, exhaust, take-out, deflash.
4 Blown film: bubble looks like an opaque capsule → annular die, air ring, hollow bubble, collapsing frame; cage, IBC, nip, oscillation.
5 Sheet: 3-roll present but frame, gap adjustment and contact path weak → rigid frame, real S-shaped web path; rotary joints, trim, winding.
6 Cast film: basic chill roll/winder OK → melt curtain, pinning, chill contact; gauge, tension, edge trim.
7 Single screw: downstream looks like compounding strand/pellets → separate strand and profile variants; profile haul-off, cut, run-out.
Current compounding JSON: 12 s with main screw, side feeder, haul roll 720° each and cutter 360° (≈10/5 rpm if linear) — no link
to roll diameter, line speed or pellet length.

## Twin-screw compounding (C base: D32, 40D, 10 × 4D blocks; variants 36/40/44/48D = 9/10/11/12 blocks)
| Part | Value (C unless A) | Ratio |
|---|---|---|
| OEM examples (A) | Coperion ZSK26 Mc18 D25, ZSK32 D32: 140 / 315 N·m per shaft, max 1200 rpm; Labtech 26 mm 0–800 / Maxi 0–1200 rpm | capacity, not PHA advice |
| Main screws | D32, effective 1280 mm | 40D |
| Main motor | 650 × 400 × 400 mm | 20.3D |
| Coupling + guard | L150, Ø180 | |
| Torque-splitting gearbox | 450 × 380 × 450 mm | |
| Frame top / shaft height | 700 / 1000 mm (shaft 900–1100) | |
| Extruder envelope | ≈ 3000 × 800 × 1100 mm | |
| Barrel block | 128 × 140 × 120 mm | 4D, 10 blocks |
| Main feed opening | B1, ≈70 × 50 mm | 0–4D |
| Heaters / cooling / TC | cartridge or shell heaters; supply/return per block; 1 TC example; channel count, depth, power not derived | cutaway only shows internals |
| Do/Di, centre distance | 1.55 → Di ≈ 20.65 mm; c ≈ (Do+Di)/2 ≈ 26.32 mm | idealised, not a manufacturing formula |
| Conveying elements | leads 16/32/48 mm | 0.5/1.0/1.5D per rev |
| Kneading block | 45°, 5 discs, length 32 mm (disc 0.2D); store stagger, disc count, length, disc width, handedness | |
| 90° / reverse | optional 16–32 mm; reverse = opposite flight handedness, never reverse rotation | |
| LIW feeder | hopper 20 L, Ø≈300 mm, weighing frame 500 × 500 mm | show weighed feeder body + support (T35 vs KT35 differ) |
| Side feeder | lateral body ≈600 mm at B5 | 16–20D |
| Atmospheric vent | B4 | 12–16D |
| Vacuum vent | B9, insert/stuffer optional | 32–36D |
| Trap / vacuum pump | trap Ø150 × 400; pump skid 600 × 400; piping ID 25–50 | |
| Adapter / strand die | adapter L96 (3D); die 160 × 90 × 70 | |
| Strand holes | 6 × Ø3 mm, pitch 12 mm | |
| Filter / melt pump | optional modules (extra flow volume tracked) | |
| Melt sensors | P1 before filter, P2 after filter / before die, dedicated melt-temperature probe (separate from wall TC) | |
| Water bath | 2000 × 300 inner, 120 deep, 3 guide rolls Ø50 (1500–3000) | 62.5D |
| Dewatering | air-knife section ≈350 mm | |
| Strand pelletiser | feed roll Ø80, rotor Ø100, 8 effective blades, 1 bed knife, width 120, enclosed | |
| Classifier | vibrating deck 700 × 400, 1 mm example amplitude | |
Functional layout (C, not a PHA screw prescription): main feed 0–4D → conveying/melting 4–12D → atmospheric vent 12–16D →
side feed 16–20D → wetting/mixing 20–28D → conditional melt seal 28–32D → vacuum 32–36D → pressure build 36–40D.
Show partially filled vent zones; die back-pressure reaching the vent is a separate abnormal state. Shafts co-rotate at equal speed,
check non-interference over 360°; fix the meaning of lead_per_revolution.
RPM/torque/SME fields: machine max rpm (A capacity); PHA TDS: S1000P/A1000P general 80–150 rpm, A1000P/PLA example 120–150 rpm
(kept separate, A); teaching main screw 120 rpm (C); torque shown with rated denominator; SME recommended range not derived.

## Six lines (C base values; A where noted)
Single screw (profile base, strand as downstream swap): D45, 30D (1350 mm); body ≈2400 × 800 × 1800, shaft 1000, motor 450,
gearbox 350; 5 heating zones, 3 functional zones 10D each; adapter 135 (3D); bath 2500 × 300 (calibrator optional); belt haul-off
contact 500, width 100; flying cutter travel 200, cut length 500; run-out 1500. A: COLLIN E30 1400 × 680 × 1650, E45 2150 × 780 × 1800
(overall height ≠ shaft height), L/D 25/30.
Sheet: D45 30D; flat die 500 × 160 × 120 (lip gap example 1.0); 3-roll stack Ø250 × 3, face 600 (A ref: Labtech LCR-350 Ø145 × 3,
face 400, gap 0.1–6 mm ≠ product thickness); rigid frame, both-side gap adjusters, rotary joints; cooling roller table 2000,
rolls Ø80 pitch 200; haul-off Ø120, 2 trim knives (15 mm each side); winding core Ø76 to Ø500 (rpm falls with diameter) or cut
1000 + stacking table 1400 × 700. Web must wrap rolls continuously; touching rolls have matching surface direction; roll supply,
return and surface temperature separated; no default PHA roll setpoint.
Cast film: D45 30D, die width 500; free melt curtain (air gap) 80 (50–150); chill/downstream rolls Ø400/200/200, face 600
(A ref: Labtech LCRHS-700 400/200/200, LCRHS-900 600/300/300); pinning = air knife (550) or vacuum box (both = separate variant);
traversing O-frame thickness gauge 700; edge trim before winding; corona optional; winder Ø76 → Ø500 with dancer/load cell.
First roll wrap 180° (C).
Blown film: D40 30D; annular die Ø80; air ring OD 240; BUR 2 → bubble Ø160, lay-flat πD/2 = 251.3 mm (B relation); frost line
320 mm above die (4 × die D, C); IBC optional (separate supply/exhaust); stabilising cage inner Ø200; die-to-nip 2500, collapsing
700; nip rolls Ø100 face 350; oscillating haul-off 180° total, 120 s period; winder Ø76 → Ø450, two-ply lay-flat. PHA BUR / frost
line range not established (null). Steady bubble does not breathe; old heightRatio 0.64 is screen shape, not FLH/die D.
EBM (continuous dual shuttle base; accumulator and rotary are separate variants): D40 30D, extruder axis 1500; parison head
Ø180 × 220; annular outlet Ø25 (wall control optional); container 180 tall, Ø65 body; mould 180 × 220 × 200; opening 160;
shuttle travel 300; blow pin stroke 50; cutter travel 80; separate top/bottom flash meshes, take-out, trim jig, scrap chute.
Mould must be visibly carried by platens, guides, actuators, hoses, frame.
Straw: D50, L/D 33 (A ref: Sunrise LG-A11(50) D50 L/D 28/33, SS304 bath 4000, 3 guide pulleys; ANBO lists vacuum pump as option);
shaft 1000; tube head Ø150 × 200; mandrel/air/centring; vacuum sizing 800 optional/bypassable; bath 4000 × 300 × 120 deep;
guides + air wipe; laser diameter gauge optional; belt haul-off 2 belts contact 400, width 80; rotary cutter Ø120 (1 cut/rev) or
flying; 4 lanes, 40 mm pitch, example straw OD 6, wall 0.25, length 200. Lane count ≠ number of colour co-extruders.

## Kinematics (C examples on a common time axis)
Roll rpm n = 1000 v / (π d) (v m/min, d mm, no slip). Strand pelletiser: L_p = 1000 v / (z n_r), n_r = 1000 v / (z L_p),
z = effective cuts per revolution per strand (not blade count by default).
Compounding example: screw 120 rpm, side feeder 60, strand 6 m/min, feed roll Ø80 → 23.87 rpm, 8 blades, 3 mm pellets → rotor
250 rpm, motor 960 rpm at 8:1. Relative to feed roll: 5.03 / 2.51 / 1.00 / 10.47. Scale all by one timeScale (0.1× → 12 / 6 / 2.39 / 25).
Single screw 3 m/min, 500 mm cut → 6 cuts/min. Sheet 3 m/min: Ø250 → 3.82 rpm, Ø120 haul 7.96. Cast 10 m/min: Ø400 7.96, Ø200 15.92;
winder Ø76 41.88 → Ø500 6.37 rpm. Blown 5 m/min: nip Ø100 15.92 rpm. Straw 12 m/min, 200 mm → 60/min/lane, 240/min for 4 lanes.
Shaft power P[kW] = 2π n (T1 + T2) / 60000; SME[kWh/kg] = P_net,shaft / Q[kg/h]; keep motor/gearbox/shaft/no-load-corrected separate;
per-shaft vs summed torque. Mean residence t̄[s] = 3600 M_hold-up[kg] / Q[kg/h] only when hold-up and Q exist; not RTD; never
auto-generate from L/D and rpm.
EBM 12 s teaching timeline: parison 0–2.5 · capture/clamp 2.5–3.0 · cut/shuttle 3.0–3.5 · pin in 3.5–4.0 · inflate 4.0–4.5 ·
hold/cool 4.5–9.5 · exhaust 9.5–10.0 · pin out/open 10.0–10.5 · take-out/trim 10.5–11.2 · return 11.2–12.0; parallel next parison.
Prefer event keyframes (clamp_closed, parison_captured, air_exhausted) over ambiguous reversed ranges.

## PHA cautions to show (design judgement, not confirmed defect causes)
Temperature–time–shear history matters more than a single limit. PHBHHx 5.4 mol%: 170 vs 180 °C, 5 min, 10 °C/min cooling →
different crystallisation (Janchai et al. 2023). P34HB/PHBV compounding with a 45 °C bath under specific conditions (D18, 40D,
30–66 rpm) — not a default. Drying: S1000P 80 °C × 5 h, A1000P 50 °C × 5 h (body text: <50 °C, 4–6 h) — keep grade + doc location.
Per line: compounding (element joints, strong restrictive elements, around vents, filter/adapter; melt T, torque, Q, rpm, SME,
filter ΔP, vacuum absolute) · single screw (adapter steps, screen, die ends; pressure/melt T before die, output stability, hot
standstill) · sheet (manifold ends, deckles, low-flow lips; die zones, roll supply/return, contact time, thickness) · cast (die
ends, free curtain, first chill contact; air gap, chill T, speed, thickness, tension; tackiness/blocking) · blown (mandrel
supports, annular channel, asymmetric cooling; melt T, BUR, frost line, nip speed, IBC) · EBM (head storage, accumulator, free
parison; hot residence, parison time, head P/T, cooling/exhaust) · straw (small annular channel, mandrel supports, sizing inlet;
bath T, vacuum, line speed, per-lane OD and cut length).

## Extrusion HMI
Correction: extrusion is EUROMAP 84 / OPC 40084 (v2.00, 2022; Part 1 common types, Part 2 line, Part 3 extruder, further parts
for haul-off, melt pump, filter, die, pelletiser, cutter, calibrator, calender). EUROMAP 82.x = peripheral devices. MES information
exchange only: no safety signals, no direct machine control.
Pages (C): Line overview · Temperatures & thermal history · Drives, feeding & venting · Die & downstream · Trends & alarms ·
Recipe & run record. Fixed status bar: Illustrative / Manual record / Connected measurement. Keep 3D playback controls apart from
any machine-like controls. Mobile: selected zone + bottom detail sheet.
| Label | BrowsePath / type | Note |
|---|---|---|
| Zone setpoint SV/SP | E.TemperatureZones.TemperatureZone_001.MonitoredParameter.SetValue | °C |
| Zone actual PV | ...MonitoredParameter.ActualValue | wall TC |
| Heating/cooling output | E.TemperatureZones.TemperatureZone_001.ControllerOutput | % −100 (max cooling) … +100 (max heating) |
| Melt temperature | E.MeltTemperatureZones.MeltTemperatureZone_001.MonitoredParameter.ActualValue | needs melt sensor position |
| Melt pressure (head pressure) | E.MeltPressureZones.MeltPressureZone_001.MonitoredParameter.ActualValue | keep bar/psi |
| Screw speed | E.MainDrive.Speed.ActualValue | rpm, gearbox output side |
| Main-drive torque | E.MainDrive.Torque.ActualValue | unit + rated denominator; no invented TorquePercent |
| Extruder throughput | E.Throughput.ActualValue | mass/time |
| Line throughput | L.ProductionParameters.Throughput | direct variable, no .ActualValue |
| Line speed | L.ProductionParameters.LineSpeed | convert to m/min |
| Specific output | E.SpecificOutput | kg/rev = Q/(60 n) |
| Vacuum absolute pressure | E.VacuumZones.VacuumZone_001.MonitoredParameter.ActualValue | absolute, not negative gauge |
| Feeder throughput | E.Feeders.Feeder_001.Throughput.ActualValue | kg/h |
| Alarm / message | MessageConditionType | Id, Classification, IsStandstillMessage |
SME, mean residence, illustrative BUR/frost line and PHA thermal-history risk are app-derived (own namespace).
Heat map: default = actual TC per block (discrete colour + number); setpoint layer/outline; melt probe marker; interpolation
labelled; missing/stale hatched, never 0 °C; provenance; fixed legend range; heaters never glow in exterior mode; no "safe" green.

## PBR (C presets) and lighting
Powder paint m0 r0.35–0.65 clearcoat 0–0.15 · brushed stainless m1 r0.25–0.45 aniso 0.35–0.70 · chrome roll m1 r0.04–0.15 ·
machined steel m1 r0.18–0.35 · heater cover m1 r0.20–0.45 emissive 0 · insulation jacket m0 r0.70–0.95 · clear PC m0 r0.03–0.12
transmission 0.9–1.0 IOR 1.58 · rubber m0 r0.60–0.90 (dark grey, not black) · water m0 r0.02–0.08 transmission 0.95–1.0 IOR 1.333.
Colours (C): neutral off-white #D5D8D6, dark teal accent #2D5B60, belts/lower frame #242626. Lighting 4000–5500 K broad area
lights + environment, key:fill 2:1–4:1; 0.5–2 mm bevels, seams, bolts, bearings, rotary joints, hose fittings for scale.
Standard material for opaque parts, Physical only for guards/water.

## Sources (IDs used above)
S01 Coperion ZSK Mc18 · S02/S03 Labtech twin 26/36 mm · S04 Coperion pigment dispersion tools (2021) · S05 Coperion T35/KT35 ·
S06 MAAG PRIMOPlus · S07 COLLIN E · S08 Labtech multilayer cast film & sheet (LCR) · S09 Labtech LCRHS-700/900 · S10 LyondellBasell
Guide to Polyolefin Film Extrusion (print p.21–25, 32) · S11 Labtech Blown Film Mark II · S12 Bekum EBLOW208–408 · S13 Graham
Mini Hercules · S14 Sunrise LG-A11 · S15 ANBO full-servo straw · S16 CJ S1000P TDS 2024-03 · S17 CJ A1000P TDS 2024-02 ·
S18 Janchai et al. 2023 · S19 Zhang et al. 2004 JAPS 94:483–491 · S20 EUROMAP 84 R2.00 2022-06 · S21–S23 OPC 40084-1/-2/-3 v2.00 ·
S24 OPC 40083 v1.03 · S25/S26 three.js Standard/Physical material · S27 COLLIN T · S28 Coperion auxiliary equipment · S29 Coperion
ZSK Pharma · S30 Coperion NPE2015 · S31 Greene 2013 PHA blow-moulded bottles (Plastics Engineering p.16–21) · C0 this answer.
Attachments offered (not downloaded): all_specs.json, COMPONENTS_ko.md, inspection_audit.json and 12 more files/ZIP.
