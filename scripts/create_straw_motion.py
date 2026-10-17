"""Real-scale four-lane drinking-straw extrusion line (brand-neutral teaching model).

blender -b --factory-startup --python scripts/create_straw_motion.py

Pack B straw line (grade C teaching values, output/research/pha-equipment-realism-20261017/
pack-b-answer-notes.md):
- D50 33D single-screw extruder, shaft 1000 mm high, three barrel zones and a water-cooled feed throat;
- a 150 x 200 mm tube head with four outlets at 40 mm pitch, mandrel air and centring bolts;
- an 800 mm vacuum sizing tank (optional on real lines) and a 4000 x 300 x 120 mm stainless cooling bath with three
  guide pulleys, an air wipe and an optional laser diameter gauge;
- a belt haul-off with 400 mm contact and 80 mm belts, one belt pair per two lanes (one 80 mm pair cannot span four
  lanes at 40 mm pitch), and a 120 mm rotary cutter with one knife (one cut per revolution);
- straws 6 mm OD x 0.25 mm wall, cut to 200 mm, falling down a chute into a collection bin.
The model runs in real time: 12 m/min, 60 straws/min per lane (240/min for four lanes). One 5 s loop holds five cuts,
five cutter turns, four 80 mm haul-off pulley turns and eight 40 mm guide-pulley turns (both within 0.6 %), and five
turns of a 60 rpm teaching screw speed.

It replaces the borrowed Straw Optimizer v2 rig; that snapshot stays in assets/equipment/sources for provenance.
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import pha_blender_kit as kit  # noqa: E402
import create_line_models as lines  # noqa: E402  (control schema and equipment-models.js writer)

OUT = ROOT / 'assets/equipment'
TAU = math.tau
FPS = 24
LINE_SPEED = 12.0                    # m/min
CUT = .2                             # straw length, m
LOOP = 5.0                           # s: five cuts per lane
FRAMES = round(LOOP * FPS)
TRAVEL = LINE_SPEED / 60 * LOOP      # 1.0 m of straw per loop
PULLEY_D, GUIDE_D, KNIFE_D = 80.0, 40.0, 120.0     # mm
RPM = {'screw': 60.0, 'haul': 1000 * LINE_SPEED / (math.pi * PULLEY_D), 'guide': 1000 * LINE_SPEED / (math.pi * GUIDE_D),
       'cutter': LINE_SPEED / CUT}   # one knife: one cut per revolution
TURNS = {'screw': 5, 'haul': 4, 'guide': 8, 'cutter': 5}   # whole turns per loop
for _key, _turns in TURNS.items():
    _exact = RPM[_key] * LOOP / 60
    assert abs(_turns - _exact) / _exact < .006, (_key, _exact)

D, AX = .05, 1.00
LANES = (-.06, -.02, .02, .06)       # four lanes at 40 mm pitch; lane 1 on the operator side (-Y)
STRAW_R, STRAW_IN = .003, .00275     # 6 mm OD, 0.25 mm wall
ADAPTER = (0.0, .15)
HEAD = (.15, .35)                    # tube head 150 mm diameter x 200 mm
HEAD_R = .075
TIP = HEAD[1] + .028                 # outlet face of the die tips
VAC = (.50, 1.30)                    # vacuum sizing tank, 800 mm
BATH = (1.45, 5.45)                  # cooling bath, 4000 mm
WATER = AX + .03                     # water surface 30 mm above the straws
BATH_FLOOR = WATER - .12             # 120 mm deep
GUIDES = (2.45, 3.45, 4.45)
WIPE_X, GAUGE_X = 5.56, 5.80
HAUL = (6.10, 6.50)                  # 400 mm belt contact
PULLEY_R, GUIDE_R, KNIFE_R = PULLEY_D / 2000, GUIDE_D / 2000, KNIFE_D / 2000
BELTS = (-.042, .042)                # two 80 mm belt pairs, each gripping two lanes
CUT_X = 6.95                         # rotary cutter axis
ROTOR_Z = AX - STRAW_R - .001 + KNIFE_R      # the knife tip passes 1 mm below the straws
TRAY_END, CHUTE_END = CUT_X + .40, (CUT_X + .85, .66)
END = CUT_X + 1.20

kit.reset_scene('PHA straw extrusion line')
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 0, FRAMES
M = kit.palette()
M['water'] = kit.material('Water / warm bath', '#5E9EA6', 0, .05, alpha=.3)
M['belt'] = kit.material('Rubber / haul-off belt', '#2B2D2F', 0, .75)
M['straw'] = kit.material('Polymer / straw', '#E3DCC2', 0, .38)


def legs(name, x0, x1, top, half_width, count=2):
    """Square legs with levelling feet under a frame from x0 to x1 at height ``top``."""
    parts = []
    for i in range(count):
        x = x0 + (x1 - x0) * i / max(count - 1, 1)
        for y in (-half_width, half_width):
            parts.append(kit.box(name, (x, y, top / 2), (.04, .04, top), M['paint_dark']))
            parts.append(kit.leveling_mount(name + ' mount', (x, y, 0), M))
    return parts


ext = kit.single_screw_extruder('Extruder', D, 33, ADAPTER[0], AX, M, FRAMES, TURNS['screw'], zones=3)   # zone1-zone3

# Adapter with screen changer and melt sensors, then the four-outlet tube head with mandrel air
head = [kit.cylinder('Adapter', ((ADAPTER[0] + ADAPTER[1]) / 2, 0, AX), .06, ADAPTER[1] - ADAPTER[0], 'X', M['steel'], segments=40),
        kit.heater_band('Adapter heater', .04, .061, .04, M['heater'], M['ceramic'], (0, AX)),
        kit.box('Screen changer plate', (.10, 0, AX), (.035, .32, .14), M['steel_dark'], bevel=.004),
        kit.box('Screen changer block', (.10, -.21, AX), (.05, .10, .15), M['paint'], bevel=.006),
        kit.cylinder('Screen changer cylinder', (.10, -.33, AX), .025, .16, 'Y', M['chrome']),
        kit.cylinder('Melt pressure sensor', (.05, 0, AX + .09), .006, .06, 'Z', M['stainless']),
        kit.cylinder('Melt pressure head', (.05, 0, AX + .13), .014, .03, 'Z', M['stainless']),
        kit.cylinder('Melt temperature probe', (.135, 0, AX + .085), .004, .05, 'Z', M['copper']),
        kit.cylinder('Tube head body', ((HEAD[0] + HEAD[1]) / 2, 0, AX), HEAD_R, HEAD[1] - HEAD[0], 'X', M['steel'], segments=48),
        kit.cylinder('Tube head face plate', (HEAD[1] + .006, 0, AX), HEAD_R - .004, .012, 'X', M['steel_dark'], segments=48),
        kit.box('Tube head support', ((HEAD[0] + HEAD[1]) / 2, 0, (AX - HEAD_R) / 2), (.08, .12, AX - HEAD_R), M['paint_dark']),
        kit.leveling_mount('Tube head support mount', ((HEAD[0] + HEAD[1]) / 2, 0, 0), M),
        kit.box('Mandrel air manifold', (HEAD[0] + .05, 0, AX + HEAD_R + .022), (.03, .16, .02), M['brass'], bevel=.002),
        kit.box('Mandrel air regulator', (HEAD[0] + .05, .30, AX + .20), (.08, .06, .10), M['paint'], bevel=.006),
        kit.cylinder('Mandrel air gauge', (HEAD[0] + .05, .27, AX + .26), .022, .01, 'Y', M['steel_dark']),
        kit.hose('Mandrel air line', (HEAD[0] + .05, .27, AX + .17), (HEAD[0] + .05, .08, AX + HEAD_R + .03), .006, M['hose_blue'], sag=.03)]
for x in (HEAD[0] + .04, HEAD[0] + .10, HEAD[0] + .16):
    head.append(kit.heater_band('Tube head heater', x, HEAD_R + .001, .05, M['heater'], M['ceramic'], (0, AX)))
for y in LANES:
    head.append(kit.cylinder('Die tip', (HEAD[1] + .021, y, AX), .009, .018, 'X', M['steel_dark'], radius2=.005, segments=24))
    head.append(kit.cylinder('Mandrel air fitting', (HEAD[0] + .05, y, AX + HEAD_R + .006), .004, .012, 'Z', M['brass'], segments=12))
for i in range(8):
    a = TAU * (i + .5) / 8
    head.append(kit.cap_screw('Die centring bolt', (HEAD[1] + .012, .062 * math.cos(a), AX + .062 * math.sin(a)), 'X', .007, 1, M['steel']))
kit.join(head, 'AdapterAndTubeHead')


def tank(name, x0, x1, floor_z, wall_top, lid=None):
    """Open stainless water tank across the lanes (300 mm wide) on legs."""
    xc, length = (x0 + x1) / 2, x1 - x0
    parts = [kit.box(name + ' floor', (xc, 0, floor_z), (length, .30, .003), M['stainless'], bevel=0),
             kit.box(name + ' water', (xc, 0, (floor_z + WATER) / 2), (length - .01, .294, WATER - floor_z), M['water'], bevel=0),
             kit.box(name + ' frame', (xc, 0, floor_z - .02), (length + .04, .34, .03), M['paint_dark'])]
    for y in (-.151, .151):
        parts.append(kit.box(name + ' wall', (xc, y, (floor_z + wall_top) / 2), (length, .003, wall_top - floor_z), M['stainless'], bevel=0))
    for x in (x0, x1):
        parts.append(kit.box(name + ' end', (x, 0, (floor_z + wall_top) / 2), (.004, .30, wall_top - floor_z), M['stainless'], bevel=0))
    if lid:
        parts.append(kit.box(name + ' lid', (xc, 0, wall_top + .003), (length, .30, .006), M[lid], bevel=0))
    parts += legs(name + ' leg', x0 + .08, x1 - .08, floor_z - .035, .14, count=max(2, round(length / 1.3) + 1))
    return parts


# Vacuum sizing tank: sizing plates hold the OD while the vacuum draws the soft tube onto them; clear lid.
vac = tank('Vacuum tank', VAC[0], VAC[1], AX - .12, AX + .10, lid='smoked')
for x in (VAC[0] + .03, VAC[0] + .26, VAC[0] + .52):
    vac.append(kit.box('Sizing plate', (x, 0, AX - .02), (.008, .24, .16), M['brass'], bevel=.001))
    for y in LANES:
        vac.append(kit.ring('Sizing sleeve', x - .012, x + .012, STRAW_R + .0002, STRAW_R + .004, (y, AX), M['brass'], segments=16))
vac += [kit.cylinder('Vacuum gauge', ((VAC[0] + VAC[1]) / 2, .10, AX + .16), .03, .012, 'Y', M['steel_dark']),
        kit.cylinder('Vacuum gauge stem', ((VAC[0] + VAC[1]) / 2, .10, AX + .125), .005, .05, 'Z', M['stainless']),
        kit.box('Vacuum pump', ((VAC[0] + VAC[1]) / 2, .42, .22), (.30, .22, .28), M['paint_accent'], bevel=.01),
        kit.hose('Vacuum line', ((VAC[0] + VAC[1]) / 2 - .1, .32, .32), (VAC[0] + .2, .152, AX + .06), .014, M['rubber'], sag=.05)]
kit.join(vac, 'VacuumSizingTank')

# Cooling bath: warm water (the CB0400A source gives 70-75 C), three guide pulleys under the lanes, air wipe at exit
bath = tank('Cooling bath', BATH[0], BATH[1], BATH_FLOOR, AX + .05)
bath += [kit.box('Bath temperature control unit', ((BATH[0] + BATH[1]) / 2, .48, .35), (.45, .28, .70), M['paint'], bevel=.01),
         kit.box('Bath TCU display', ((BATH[0] + BATH[1]) / 2 - .1, .339, .58), (.12, .004, .07), M['screen'], bevel=0),
         kit.hose('Bath supply', ((BATH[0] + BATH[1]) / 2 - .15, .34, .45), (BATH[0] + .5, .152, AX), .014, M['hose_red'], sag=.06),
         kit.hose('Bath return', ((BATH[0] + BATH[1]) / 2 + .15, .34, .45), (BATH[1] - .5, .152, BATH_FLOOR + .03), .014, M['hose_blue'], sag=.06)]
bath.append(kit.cylinder('Bath thermometer well', (BATH[0] + .25, .12, WATER + .01), .004, .05, 'Z', M['stainless']))
for x in [(a + b) / 2 for a, b in zip((BATH[0],) + GUIDES, GUIDES + (BATH[1],))]:     # combs keep the 40 mm lane pitch
    bath.append(kit.box('Lane spacer comb', (x, 0, AX + STRAW_R + .005), (.006, .20, .01), M['stainless'], bevel=0))
bath += [kit.box('Air wipe upper', (WIPE_X, 0, AX + .025), (.04, .22, .03), M['steel'], bevel=.003),
         kit.box('Air wipe lower', (WIPE_X, 0, AX - .025), (.04, .22, .03), M['steel'], bevel=.003),
         kit.box('Air wipe blower', (WIPE_X - .1, .40, .30), (.22, .18, .22), M['paint_accent'], bevel=.008),
         kit.hose('Air wipe line', (WIPE_X - .1, .32, .40), (WIPE_X, .11, AX + .04), .016, M['rubber'], sag=.05)]
bath += legs('Air wipe stand', WIPE_X, WIPE_X, AX - .04, .10, count=1)
kit.join(bath, 'CoolingBath')
for i, x in enumerate(GUIDES):
    kit.roll('BathGuidePulley%d' % (i + 1), x, AX - STRAW_R - GUIDE_R, GUIDE_R, .18, M, 'haul', TURNS['guide'], FRAMES, 1,
             mat=M['stainless'], joint=False)

# Laser diameter gauge (optional on real lines): O-frame round the lanes with emitter and receiver heads
gauge = [kit.box('Gauge frame top', (GAUGE_X, 0, AX + .11), (.05, .32, .03), M['paint'], bevel=.004),
         kit.box('Gauge frame bottom', (GAUGE_X, 0, AX - .11), (.05, .32, .03), M['paint'], bevel=.004),
         kit.box('Gauge emitter', (GAUGE_X, 0, AX + .07), (.06, .22, .05), M['steel_dark'], bevel=.004),
         kit.box('Gauge receiver', (GAUGE_X, 0, AX - .07), (.06, .22, .05), M['steel_dark'], bevel=.004),
         kit.box('Gauge display', (GAUGE_X, -.12, AX + .19), (.10, .02, .07), M['screen'], bevel=.003)]
for y in (-.15, .15):
    gauge.append(kit.box('Gauge frame side', (GAUGE_X, y, AX), (.05, .02, .25), M['paint'], bevel=.003))
gauge += legs('Gauge stand', GAUGE_X, GAUGE_X, AX - .125, .10, count=1)
kit.join(gauge, 'DiameterGauge')

# Belt haul-off: lower and upper belts, two pairs side by side, on drums turning at 1000 v / (pi d)
haul = [kit.box('Haul-off frame', ((HAUL[0] + HAUL[1]) / 2, .02, AX - .30), (.70, .44, .04), M['paint_dark']),
        kit.box('Haul-off housing', ((HAUL[0] + HAUL[1]) / 2, .19, AX), (.70, .02, .52), M['paint'], bevel=.006),
        kit.box('Haul-off cover', ((HAUL[0] + HAUL[1]) / 2, .02, AX + .27), (.70, .38, .02), M['paint'], bevel=.006),
        kit.guard_panel('Haul-off guard', HAUL[0] - .1, HAUL[1] + .1, AX - .24, AX + .25, -.15, M, handle=True),
        kit.box('Haul-off gearmotor', (HAUL[1] - .05, .30, AX), (.14, .18, .14), M['paint_accent'], bevel=.008)]
for y in BELTS:
    haul.append(kit.cylinder('Belt pressure cylinder', ((HAUL[0] + HAUL[1]) / 2, y, AX + .19), .018, .10, 'Z', M['chrome']))
haul += legs('Haul-off leg', HAUL[0] + .05, HAUL[1] - .05, AX - .32, .13)
kit.join(haul, 'HaulOffFrame')
Z_BELT = {'Lower': AX - STRAW_R - PULLEY_R - .002, 'Upper': AX + STRAW_R + PULLEY_R + .002}
for side, z in Z_BELT.items():
    runs = []
    for y in BELTS:
        runs += [kit.box('Belt %s top run' % side, ((HAUL[0] + HAUL[1]) / 2, y, z + PULLEY_R + .001), (HAUL[1] - HAUL[0], .08, .003), M['belt'], bevel=0),
                 kit.box('Belt %s bottom run' % side, ((HAUL[0] + HAUL[1]) / 2, y, z - PULLEY_R - .001), (HAUL[1] - HAUL[0], .08, .003), M['belt'], bevel=0)]
    kit.join(runs, 'Belt' + side)
    # Lower drums: their top run moves +X (positive turn about +Y); upper drums: their bottom run moves +X.
    sign = 1 if side == 'Lower' else -1
    for x, end in ((HAUL[0], 'In'), (HAUL[1], 'Out')):
        owner = kit.empty('BeltPulley%s%s' % (side, end), (x, 0, z), group='haul')
        owner.rotation_euler.z = math.pi / 2
        kit.join([kit.cylinder('Pulley drum', (0, 0, 0), PULLEY_R, .18, 'X', M['steel'], segments=32),
                  kit.box('Pulley mark', (0, 0, PULLEY_R * .7), (.182, .012, .012), M['warning'], bevel=0)],
                 'BeltPulley%s%s_body' % (side, end)).parent = owner
        kit.spin(owner, 'haul', TURNS['haul'], FRAMES, sign=sign)
    # Belt cleats on the operator-side pair ride the loop at line speed (50 mm pitch divides the 1 m per loop).
    r, inner = PULLEY_R + .003, 1 if side == 'Lower' else -1
    loop = [Vector((HAUL[0] + (HAUL[1] - HAUL[0]) * i / 16, BELTS[0] - .042, z + inner * r)) for i in range(17)]
    loop += [Vector((HAUL[1] + r * math.sin(a), BELTS[0] - .042, z + inner * r * math.cos(a))) for a in [math.pi * i / 10 for i in range(1, 10)]]
    loop += [Vector((HAUL[1] - (HAUL[1] - HAUL[0]) * i / 16, BELTS[0] - .042, z - inner * r)) for i in range(17)]
    loop += [Vector((HAUL[0] - r * math.sin(a), BELTS[0] - .042, z - inner * r * math.cos(a))) for a in [math.pi * i / 10 for i in range(1, 11)]]
    kit.ride('BeltCleat' + side, loop, math.ceil(kit.path_length(loop) / .05), .05, TRAVEL, M['warning'], .004, FRAMES, group='haul')

# Rotary cutter: one knife on a 120 mm rotor above the lanes shears them against a bed knife once per turn.
# The knife points down at frame 0, so it cuts at 0, 1, 2 ... s; its tip moves downstream at the bottom.
rotor = kit.empty('CutterRotor', (CUT_X, 0, ROTOR_Z), group='cutter')
rotor.rotation_euler.z = math.pi / 2              # local X (spin axis) across the line
kit.join([kit.cylinder('Rotor hub', (0, 0, 0), .025, .19, 'X', M['steel'], segments=32),
          kit.box('Fly knife', (0, 0, -(KNIFE_R + .03) / 2), (.17, .004, KNIFE_R - .03), M['chrome'], bevel=0),
          kit.box('Knife holder', (0, .006, -.04), (.17, .008, .03), M['steel_dark'], bevel=.001),
          kit.box('Rotor counterweight', (0, 0, .035), (.17, .024, .02), M['steel_dark'], bevel=.002)], 'CutterRotor_body').parent = rotor
kit.spin(rotor, 'cutter', TURNS['cutter'], FRAMES, sign=-1)
rotor['cut_frames'] = [round(k * FRAMES / TURNS['cutter']) for k in range(TURNS['cutter'])]
cutter = [kit.box('Bed knife', (CUT_X - .008, 0, AX - STRAW_R - .006), (.012, .17, .012), M['steel_dark'], bevel=.001),
          kit.box('Inlet bushing block', (CUT_X - .05, 0, AX), (.02, .17, .03), M['steel'], bevel=.002),
          kit.box('Cutter base', (CUT_X, 0, AX - .06), (.20, .26, .09), M['paint'], bevel=.006),
          kit.cylinder('Cutter servo motor', (CUT_X, .21, ROTOR_Z), .045, .14, 'Y', M['paint_accent']),
          kit.cylinder('Cutter coupling', (CUT_X, .125, ROTOR_Z), .025, .03, 'Y', M['warning']),
          kit.box('Cutter top cover', (CUT_X, 0, ROTOR_Z + .10), (.22, .26, .015), M['paint'], bevel=.004),
          kit.guard_panel('Cutter guard', CUT_X - .11, CUT_X + .11, AX - .015, ROTOR_Z + .095, -.13, M)]
for y in (-.105, .105):
    cutter.append(kit.box('Rotor bearing block', (CUT_X, y, ROTOR_Z), (.07, .03, .07), M['steel_dark'], bevel=.004))
    cutter.append(kit.box('Cutter side plate', (CUT_X, y + (.013 if y > 0 else -.013), (AX - .015 + ROTOR_Z + .095) / 2),
                          (.22, .006, ROTOR_Z + .11 - AX), M['paint'], bevel=.002))
for y in LANES:
    cutter.append(kit.ring('Inlet bushing', CUT_X - .062, CUT_X - .038, STRAW_R + .0003, .006, (y, AX), M['brass'], segments=16))
cutter += legs('Cutter leg', CUT_X - .08, CUT_X + .08, AX - .105, .11)
# Exit tray, chute and collection bin; the pieces' path runs STRAW_R + 1.5 mm above the tray and chute plates.
LIFT = STRAW_R + .0015
slope = math.atan2(AX - CHUTE_END[1], CHUTE_END[0] - TRAY_END)
# Kit meshes are built around the world origin, so the chute is made there, then tilted and placed.
chute = kit.box('Discharge chute', (0, 0, 0), (math.hypot(CHUTE_END[0] - TRAY_END, AX - CHUTE_END[1]), .22, .003), M['stainless'], bevel=0)
chute.rotation_euler.y = slope
chute.location = ((TRAY_END + CHUTE_END[0]) / 2, 0, (AX + CHUTE_END[1]) / 2 - LIFT / math.cos(slope))
cutter += [kit.box('Exit tray', ((CUT_X + .02 + TRAY_END) / 2, 0, AX - LIFT), (TRAY_END - CUT_X - .02, .20, .003), M['stainless'], bevel=0),
           chute,
           kit.box('Collection bin floor', (CUT_X + .98, 0, .05), (.42, .42, .01), M['paint_dark'], bevel=0)]
for x, y, sx, sy in ((CUT_X + .77, 0, .006, .42), (CUT_X + 1.19, 0, .006, .42), (CUT_X + .98, -.21, .42, .006), (CUT_X + .98, .21, .42, .006)):
    cutter.append(kit.box('Collection bin wall', (x, y, .33), (sx, sy, .56), M['paint_accent'], bevel=0))
for k in range(24):                               # straws already collected, lying in two loose layers
    pile = kit.ring('Collected straw', -CUT / 2, CUT / 2, STRAW_IN, STRAW_R, (0, 0), M['straw'], segments=10)
    pile.location = (CUT_X + .98 + .05 * math.sin(k * 2.4), -.18 + .015 * (k % 12) + .004 * (k // 12), .06 + STRAW_R + .006 * (k // 12))
    pile.rotation_euler.z = .25 * math.sin(k * 1.7)
    cutter.append(pile)
cutter += legs('Exit tray leg', TRAY_END - .02, TRAY_END - .02, AX - STRAW_R - .004, .08, count=1)
bpy.context.view_layer.update()                   # the chute and the pile carry object rotations into the join
kit.join(cutter, 'RotaryCutter')

# Straws: continuous hollow lanes from the die tips to the cutter; cut pieces leave along the tray and chute.
for i, y in enumerate(LANES):
    kit.ring('StrawLane%d' % (i + 1), TIP, CUT_X, STRAW_IN, STRAW_R, (y, AX), M['straw'], segments=16)
# A piece's front end leaves the cutter at s = 0 (still uncut, inside the lane's mesh) and its rear end passes the
# knife at s = CUT, on a cut frame; downstream it is a chain of 200 mm pieces. 1 m per loop is five pieces.
for lane, y in enumerate(LANES):
    path = [Vector((CUT_X - CUT / 2, y, AX)), Vector((TRAY_END, y, AX)), Vector((CHUTE_END[0], y, CHUTE_END[1]))]
    length = kit.path_length(path)
    pieces = math.ceil(length / CUT) + 1
    for i in range(pieces):
        piece = kit.ring('CutStraw%d_%02d' % (lane + 1, i), -CUT / 2 + .001, CUT / 2 - .001, STRAW_IN - .0002, STRAW_R - .0001, (0, 0), M['straw'], segments=12)
        piece['motion_group'] = 'flow'
        for frame in range(FRAMES + 1):
            s = (i * CUT + TRAVEL * frame / FRAMES) % (pieces * CUT)
            here = min(s, length)
            ahead, behind = kit.point_at(path, min(here + .005, length)), kit.point_at(path, max(here - .005, 0))
            piece.location = kit.point_at(path, here)
            piece.rotation_euler.y = -math.atan2(ahead.z - behind.z, ahead.x - behind.x)
            piece.scale = (1, 1, 1) if s <= length else (.001, .001, .001)
            piece.keyframe_insert('location', frame=frame)
            piece.keyframe_insert('rotation_euler', index=1, frame=frame)
            piece.keyframe_insert('scale', frame=frame)

# Flow markers: pellets into the throat, melt along the screw channel, marks on the operator-side straw
feed = kit.catmull([(ext['throat_x'], 0, AX + .75), (ext['throat_x'], 0, AX + .35), (ext['throat_x'], 0, AX + .06)], 6)
kit.ride('FeedPellet', feed, 8, kit.path_length(feed) / 8, 2 * kit.path_length(feed), M['pellet'], .005, FRAMES, 'pellet')
melt = [Vector((ext['throat_x'], 0, AX + D * .42)), Vector((ADAPTER[0] - .01, 0, AX + D * .42))]
kit.ride('MeltMarker', melt, 12, kit.path_length(melt) / 12, 2 * kit.path_length(melt) / 12, M['polymer_marker'], .006, FRAMES)
surface = [Vector((TIP + .02, LANES[0] - STRAW_R - .0008, AX)), Vector((CUT_X - .06, LANES[0] - STRAW_R - .0008, AX))]
kit.ride('StrawMark', surface, math.ceil(kit.path_length(surface) / .5), .5, TRAVEL, M['polymer_marker'], .0025, FRAMES)

# Operator station and cabinet
kit.cabinet('Control cabinet', (ext['x_rear'] - .2, .45, 0), (ext['x_rear'] + .6, .85, 1.90), M)
kit.stack_light('Stack light', (ext['x_rear'] + .2, .65, 1.90), M)
kit.hmi_pedestal('Operator panel', (ext['x_rear'] + .3, -.70, 0), (ext['x_rear'] + .3, -.70, 1.42), M)

kit.bake_linear()
sc.timeline_markers.new('Knife at the bottom: cut', frame=0)

control = lines.control
centre = [(ext['x_rear'] + END) / 2, .95, 0]


def zone(key, field, label, ref, base):
    """Heat zone compared with the CB0400A source row at ``ref`` (see equipment-motion.js heatRange)."""
    return {**base(key, field, label), 'ref': ref}


heat_zones = [zone('feed', 'feed', ['공급부 (수냉)', 'Feed throat (water-cooled)'], ['stages', 0],
                   lambda k, f, l: kit.heat_box(k, f, l, (ext['throat_x'] - 1.5 * D, -1.2 * D - .004, AX - 1.2 * D - .003),
                                                (ext['throat_x'] + 1.5 * D, 1.2 * D + .004, AX + 1.2 * D + .003), group='tool', half=False))]
for i, ((x0, x1), name) in enumerate(zip(ext['heaters'], (['고체 이송', 'solid conveying'], ['압축·용융', 'compression/melting'], ['계량', 'metering']))):
    heat_zones.append(zone('Z%d' % (i + 1), 'zone%d' % (i + 1), ['존 %d · %s' % (i + 1, name[0]), 'Zone %d · %s' % (i + 1, name[1])], ['stages', i + 1],
                           lambda k, f, l, x0=x0, x1=x1: kit.heat_band(k, f, l, x0, x1, ext['r_out'] + .012, AX)))
heat_zones += [zone('die', 'die', ['튜브 헤드', 'Tube head'], ['straw', 'die'],
                    lambda k, f, l: kit.heat_band(k, f, l, HEAD[0] + .005, HEAD[1] - .005, HEAD_R + .014, AX, full=True))]
# Bath water: a strip behind the lanes in each tank, so the straws stay visible.
for key, (x0, x1), floor_z in (('vacuum_water', VAC, AX - .12), ('bath_water', BATH, BATH_FLOOR)):
    heat_zones.append(zone(key, 'bath', ['수조 물 (진공·냉각)', 'Bath water (vacuum & cooling)'], ['straw', 'waterBath'],
                           lambda k, f, l, x0=x0, x1=x1, floor_z=floor_z: kit.heat_box(k, f, l, (x0 + .01, .08, floor_z + .003), (x1 - .01, .148, WATER), group='tool')))

META = {
    'id': 'straw', 'duration': LOOP, 'frames': [0, FRAMES],
    'poster': 'assets/equipment/straw-motion-poster.png', 'model': 'assets/equipment/straw-motion.glb',
    'center': centre, 'span': [END - ext['x_rear'] + .6, 2.4], 'zoom': [.7, 18],
    'controls': [control('screw', '스크류 회전각', 'Screw rotation angle', time_range=[0, LOOP]),
                 control('flow', '스트로 이동 위치', 'Straw travel position', 100, '%', [0, LOOP]),
                 control('haul', '벨트 인취 드럼 회전각', 'Belt haul-off drum angle', time_range=[0, LOOP]),
                 control('cutter', '회전 커터 회전각', 'Rotary cutter angle', 360, time_range=[0, LOOP])],
    'views': [{'key': 'all', 'label': ['전체 라인', 'Whole line'], 'center': centre, 'zoom': 1},
              kit.camera_view('screw', ['스크류·배럴 단면', 'Screw & barrel cutaway'], (-.9, 0, AX), (1.2, -6.0, 5.2), 3.0),
              kit.camera_view('head', ['튜브 헤드·진공 사이징', 'Tube head & vacuum sizing'], (.62, 0, AX), (1.0, -5.0, 2.4), 6),
              kit.camera_view('bath', ['냉각 수조·가이드 풀리', 'Cooling bath & guide pulleys'], (3.45, 0, AX), (1.5, -6.0, 3.0), 2.4),
              kit.camera_view('finish', ['벨트 인취·회전 커터', 'Belt haul-off & rotary cutter'], (6.62, 0, AX), (1.0, -5.0, 2.2), 6)],
    'heat': {'input': 'panel', 'reference': {'grade': 'CB0400A'},
             'title': ['스트로 라인 설정 온도 (여기서 입력) · CB0400A 자료 대비', 'Straw line set points (enter here) · against the CB0400A source'],
             'note': ['스트로 탭에는 공정 입력 양식이 없어 여기에 입력한 설정값을 색으로 표시합니다. 이 브라우저에만 저장되며 실측 온도가 아닙니다. '
                      '참고 범위는 CJ PHACT CB0400A 자료의 단계별 배럴 온도, 다이와 수조 온도이며 다른 그레이드에는 맞지 않을 수 있습니다. '
                      '존 번호는 호퍼 쪽부터이니 실제 설비의 존 배치와 맞춰 입력하세요. 굵은 테두리는 범위 밖, 빗금은 미입력입니다.',
                      'The straw tab has no process form, so set points typed here are shown in colour. They stay in this browser and '
                      'are not measured temperatures. Reference bands are the CJ PHACT CB0400A source stage barrel temperatures, die '
                      'and bath temperatures and may not suit other grades. Zones are numbered from the hopper; match them to the '
                      'machine. A heavy outline marks values outside the band and hatching marks missing values.'],
             'scale_labels': {'melt': ['배럴·헤드', 'Barrel & head'], 'tool': ['공급부·수조', 'Feed throat & baths']},
             'zones': heat_zones},
    'stages': [['공급·용융', 'Feed & melt'], ['튜브 헤드·진공 사이징', 'Tube head & vacuum sizing'], ['수조 냉각·인취', 'Bath cooling & haul-off'],
               ['회전 절단·배출', 'Rotary cut & discharge']],
    'turns': {key: TURNS[key] for key in ('screw', 'haul', 'cutter')}, 'cut_edges': 1,
    'study': {'rpm': RPM['screw'], 'speed': LINE_SPEED, 'diameter': PULLEY_D, 'pitch': CUT * 1000},
    'teaching': {'time_scale': 1, 'rpm': {key: round(value, 3) for key, value in RPM.items()}, 'line_speed_m_min': LINE_SPEED,
                 'cut_length_mm': CUT * 1000, 'pulley_mm': PULLEY_D, 'guide_pulley_mm': GUIDE_D, 'knife_mm': KNIFE_D,
                 'lanes': len(LANES), 'lane_pitch_mm': 40, 'straw_mm': {'od': STRAW_R * 2000, 'wall': (STRAW_R - STRAW_IN) * 1000, 'length': CUT * 1000},
                 'straws_per_min': {'lane': LINE_SPEED / CUT, 'line': len(LANES) * LINE_SPEED / CUT},
                 'loop_note': 'Real time: five cuts per 5 s loop; drums and pulleys turn a whole number of times per loop (within 0.6 %).'},
    'spec': {'basis': 'Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting',
             'screw_d_mm': 50, 'l_d': 33, 'heating_zones': 3, 'shaft_height_mm': 1000, 'tube_head_mm': {'d': 150, 'length': 200},
             'vacuum_sizing_mm': 800, 'bath_mm': [4000, 300, 120], 'guide_pulleys': len(GUIDES),
             'haul_off': {'contact_mm': 400, 'belt_width_mm': 80, 'pairs': len(BELTS)}, 'cutter': {'d_mm': KNIFE_D, 'knives': 1},
             'previous_rig': 'Straw Optimizer v2 snapshot (assets/equipment/sources/straw-optimizer-v2.blend), replaced by this real-scale rig',
             'sources': 'output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md'},
}

floor = kit.floor('Floor', ext['x_rear'] - .3, END + .2, -.9, 1.0, M)
kit.studio_world(.8, 'studio.exr')
sc.frame_set(round(FRAMES * .5))
bpy.context.view_layer.update()
camera = kit.ortho_camera('Line camera', (centre[0] + 5, -10, 5.4), (centre[0], 0, .85), 8)
orientation = camera.rotation_euler.to_matrix()
right, up = orientation.col[0], orientation.col[1]
corners = [obj.matrix_world @ Vector(c) for obj in sc.objects if obj.type == 'MESH' and obj is not floor for c in obj.bound_box]
xs, ys = [p.dot(right) for p in corners], [p.dot(up) for p in corners]
camera.location += right * ((min(xs) + max(xs)) / 2 - camera.location.dot(right)) + up * ((min(ys) + max(ys)) / 2 - camera.location.dot(up))
camera.data.ortho_scale = max(max(xs) - min(xs), (max(ys) - min(ys)) * 16 / 9) * 1.06
kit.area_light('Key light', (centre[0] - 2.5, -5, 6), (centre[0], 0, .8), 1500, 6)
kit.area_light('Rim light', (centre[0] + 2.5, 4, 5), (centre[0], 0, .8), 650, 5, (.9, .95, 1))
kit.render_still(OUT / 'straw-motion-poster.png', 1280, 720, samples=48)
for obj in [floor, camera] + [o for o in sc.objects if o.type == 'LIGHT']:
    bpy.data.objects.remove(obj, do_unlink=True)
sc.frame_set(0)
sc['motion_scope'] = 'Teaching rig; Pack B teaching dimensions, no OEM drawing, process setpoint or sizing design.'
sc['motion_controls'] = json.dumps(META['controls'], ensure_ascii=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'straw-motion.blend'), compress=True)
kit.export_glb(OUT / 'straw-motion.glb')
META['blender'] = bpy.app.version_string
META['groups'] = sorted({obj.get('motion_group') for obj in sc.objects if obj.get('motion_group')})
(OUT / 'straw-motion.json').write_text(json.dumps(META, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines.write_manifest()
print('STRAW_EXPORT_OK', flush=True)
