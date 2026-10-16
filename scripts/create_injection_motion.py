"""Build the animated injection-moulding machine and export a local GLB.

blender -b --factory-startup --python-exit-code 1 --python scripts/create_injection_motion.py

Representative (brand-neutral) servo-hydraulic, five-point double-toggle machine
of the 1600 kN class at real scale in metres. Values marked (A) follow one public
OEM catalogue or a manufacturer's resin guidance; values marked (C) are teaching
design judgement. See output/research/pha-equipment-realism-20261017/. The model is
not an OEM drawing, and the timeline is an explanatory steady cycle (30 s example
compressed to 14 s), never a measured machine cycle or flow simulation.
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.dont_write_bytecode = True      # keep scripts/ free of __pycache__ from the shared kit
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pha_blender_kit as kit  # noqa: E402

TAU = math.tau
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'equipment'
OUT.mkdir(parents=True, exist_ok=True)

# ----------------------------------------------------------------- specification
AX = 1.20                 # injection-axis height above floor, 1.10-1.25 m (C)
BED = .76                 # bed / beam top, 0.65-0.80 m (C)
FPS, CYCLE, SWEEP = 24, 14.0, 1.0
# Manual mold axis: a linear 0->100 % sweep that starts one frame after the cycle ends
# (the steady cycle ends with the mould open, so the two must not share a frame).
SWEEP_START = CYCLE + 1 / FPS

D = .040                  # screw diameter (A: D35/40/45 option of one 1600 kN unit)
LD = 20.5                 # flighted length / D for D40 (A: 20.52)
H_FEED, H_METER = .14, .058   # channel depths / D -> compression ratio ~2.4 (A: PHA TDS 2.2-2.6:1)
SCREW_STROKE = .16        # max injection stroke 160 mm = 4D (A)
CUSHION = .008
CARRIAGE_STROKE = .20     # whole-unit travel 150-250 mm teaching (C)
SPRUE_BREAK = 15          # % of carriage stroke used for the optional nozzle retract (C)

TIE_R = .045              # tie-bar Ø90 mm (C, 80-95)
TIE_C = .485 / 2 + TIE_R  # clear spacing 485 x 485 mm (A)
PLATEN_HALF = .715 / 2    # 715 x 715 mm (A)
REAR_HALF_H = .44         # toggle support platen carries the rear lugs (C)
OPEN_STROKE = .435        # max opening stroke 435 mm (A)
EJECT_STROKE = .06        # used ejection (machine maximum 150 mm, A)
FIXED_PLATEN = (-.17, 0.0)            # thickness 120-170 mm (C)
MOLD_A, MOLD_B = (0.0, .17), (.17, .35)   # 350 mm mould within 200-500 mm (A)
MOLD_HALF_W, MOLD_Z = .20, (AX - .23, AX + .23)
MOVING_PLATEN = (MOLD_B[1], MOLD_B[1] + .16)
PART = {'y': .15, 'z': .15, 'x': (MOLD_A[1] - .012, MOLD_A[1] + .012), 'gate_z': AX - .06}
EJECTOR_CYL = .15

# Five-point double toggle (C, solved offline for the 435 mm stroke: links never
# cross the axis, knees clear the rear platen, the crosshead retreats monotonically).
TOGGLE = {'zR': .38, 'zM': .24, 'L1': .30, 'L2': .34, 'over': .0002,
          'a': .09, 'b': .08, 'L3': .30, 'zX': .07}
X_Q0 = MOVING_PLATEN[1] + .06                       # moving-platen toggle pin (closed)
SPAN0 = math.sqrt((TOGGLE['L1'] + TOGGLE['L2'] - TOGGLE['over'])**2 - (TOGGLE['zR'] - TOGGLE['zM'])**2)
X_P = X_Q0 + SPAN0                                  # rear-platen toggle pin
REAR_PLATEN = (X_P + .16, X_P + .40)

# Injection unit layout along X (nozzle tip touches the sprue bushing at x = 0).
FRONT_PLATE = (-1.26, -1.14)
THROAT = (-1.14, -1.00)
BARREL = (-1.00, -.23)
TIP = -.24                                          # screw tip, forward position
PISTON_PLATE = (-1.83, -1.75)
HOPPER_X = (THROAT[0] + THROAT[1]) / 2
ZONES = [(-.86, 'Z1'), (-.62, 'Z2'), (-.38, 'Z3')]  # barrel 3 zones + nozzle (A/C)


def _rear_angle(m, side):
    t = TOGGLE
    px, pz = X_P, AX + side * t['zR']
    qx, qz = X_Q0 + OPEN_STROKE * m / 100, AX + side * t['zM']
    dx, dz = qx - px, qz - pz
    d = math.hypot(dx, dz)
    return math.atan2(dz, dx) + side * math.acos((t['L1']**2 + d * d - t['L2']**2) / (2 * t['L1'] * d))


def _pin_sign(side):
    """Local +Z or -Z offset for the crosshead pin: toward the axis when locked."""
    return 1 if math.cos(_rear_angle(0, side)) * side < 0 else -1


PIN_SIGN = {1: _pin_sign(1), -1: _pin_sign(-1)}


def toggle_pose(m, side):
    """Planar toggle solution for mold opening m (0..100 %). side=+1 upper, -1 lower.

    The rear link rotates about the rear-platen pin; its local +X points to the
    knee and the crosshead pin is a rigid offset (a, PIN_SIGN*b) in link space.
    """
    t = TOGGLE
    alpha = _rear_angle(m, side)
    px, pz = X_P, AX + side * t['zR']
    ux, uz, nx, nz = math.cos(alpha), math.sin(alpha), -math.sin(alpha), math.cos(alpha)
    kx, kz = px + t['L1'] * ux, pz + t['L1'] * uz
    b = PIN_SIGN[side] * t['b']
    cx, cz = px + t['a'] * ux + b * nx, pz + t['a'] * uz + b * nz
    xz = AX + side * t['zX']
    crosshead = cx - math.sqrt(t['L3']**2 - (cz - xz)**2)
    return {'alpha': alpha, 'knee': (kx, kz), 'pin': (cx, cz), 'crosshead': crosshead}


# Kinematic sanity before building anything.
_poses = [toggle_pose(m, 1) for m in range(0, 101, 2)]
_lower = [toggle_pose(m, -1) for m in range(0, 101, 2)]
_cross = [p['crosshead'] for p in _poses]
assert all(b > a for a, b in zip(_cross, _cross[1:])), 'crosshead must retreat monotonically'
assert min(p['knee'][1] for p in _poses) > AX + .05, 'upper knee must stay above the axis'
assert max(p['knee'][1] for p in _lower) < AX - .05, 'lower knee must stay below the axis'
assert max(p['knee'][0] for p in _poses) < REAR_PLATEN[0] - .03, 'knee must clear the rear platen'
assert all(p['crosshead'] < p['pin'][0] for p in _poses)
assert _cross[-1] + .04 < REAR_PLATEN[0] - .02, 'crosshead must clear the rear platen'
assert _cross[-1] - .04 > MOVING_PLATEN[1] + OPEN_STROKE + EJECTOR_CYL + .015, 'crosshead must clear the ejector'
assert all(abs(a['crosshead'] - b['crosshead']) < 1e-9 for a, b in zip(_poses, _lower)), 'symmetric crosshead'

# ------------------------------------------------------------------------ scene
sc = kit.reset_scene('Injection moulding machine (1600 kN class, teaching model)')
sc.render.fps = FPS
# glTF clip time = frame / fps, so frame 0 is t = 0 and web times match the schedule exactly.
sc.frame_start, sc.frame_end = 0, int(round(FPS * (SWEEP_START + SWEEP)))
sc['purpose'] = 'Explanatory motion; not CFD, an OEM machine, or validated cycle timing.'
M = kit.palette()
box, cyl, ring, join, empty, span = kit.box, kit.cylinder, kit.ring, kit.join, kit.empty, kit.span_box
REAR_HALF = (-math.pi / 2, math.pi / 2)   # keep +Y half: operator side (-Y) is cut away
BEAM_Y = (.29, .43)                        # clamp base beams |y| range
RAIL_Y = .40


def group(obj, name):
    obj['motion_group'] = name
    return obj


# ---------------------------------------------------------------- machine base
X_BASE = (-2.65, 2.25)
base = []
base.append(span('Base injection side', (X_BASE[0], -.50, .08), (-.30, .50, BED - .02), M['paint_dark'], bevel=.01))
base.append(span('Base top plate', (X_BASE[0] - .01, -.51, BED - .02), (-.30, .51, BED), M['paint'], bevel=.006))
for side in (-1, 1):
    y0, y1 = sorted((side * BEAM_Y[0], side * BEAM_Y[1]))
    base.append(span('Clamp base beam', (-.30, y0, .08), (X_BASE[1], y1, BED - .015), M['paint_dark'], bevel=.01))
    base.append(span('Beam cap', (-.30, y0 - .005, BED - .015), (X_BASE[1], y1 + .005, BED), M['paint'], bevel=.004))
    base.append(span('Platen linear rail', (.25, side * RAIL_Y - .018, BED), (1.30, side * RAIL_Y + .018, BED + .025),
                     M['steel'], bevel=.003))
    base.append(span('Injection guide bar', (X_BASE[0] + .05, side * .22 - .02, BED), (-.40, side * .22 + .02, BED + .03),
                     M['chrome'], bevel=.006))
base.append(span('Clamp base pan', (-.30, -BEAM_Y[1], .08), (X_BASE[1], BEAM_Y[1], .36), M['paint_dark'], bevel=.008))
base.append(span('Clamp base end wall', (X_BASE[1] - .08, -BEAM_Y[0], .08), (X_BASE[1], BEAM_Y[0], BED - .06), M['paint_dark']))
for x0, x1 in ((-2.50, -1.90), (-1.80, -1.20), (-1.10, -.50)):
    base.append(kit.louvre_panel('Hydraulic unit louvre', x0, x1, .22, BED - .14, -.503, M))
base.append(cyl('Oil filler cap', (-2.45, .32, BED + .02), .045, .04, 'Z', M['black']))
base.append(box('Oil level gauge', (-2.05, -.503, .50), (.06, .008, .16), M['smoked'], bevel=.002))
for x in (-2.55, -1.45, -.40, .75, 2.10):
    for y in (-.42, .42):
        base.append(kit.leveling_mount('Leveling mount', (x, y, 0), M))
# Part-drop chute through the base recess to a tote on the operator side.
chute = box('Part chute', (.45, -.17, .46), (.55, .78, .012), M['stainless'], bevel=0)
chute.rotation_euler.x = math.radians(20)
base.append(chute)
for side in (-1, 1):
    base.append(box('Chute side', (.45 + side * .28, -.17, .51), (.012, .78, .12), M['stainless'], bevel=0))
    base[-1].rotation_euler.x = math.radians(20)
base_obj = join(base, 'Machine base')
kit.boolean_cut(base_obj, (.45, -.43, .42), (.62, .2, .26), M['paint_dark'])
join([span('Parts tote', (.15, -1.02, .02), (.75, -.62, .30), M['black'], bevel=.01),
      span('Tote inner', (.18, -.99, .05), (.72, -.65, .31), M['rubber'], bevel=0)], 'Parts tote')

# ------------------------------------------------------------------ clamp unit
holes = [(sy * TIE_C, AX + sz * TIE_C) for sy in (-1, 1) for sz in (-1, 1)]
clamp_static = []
fixed = kit.plate_with_holes('Fixed platen', *FIXED_PLATEN, PLATEN_HALF, PLATEN_HALF, holes, AX, M['paint_accent'],
                             hole_r=TIE_R + .002)
kit.boolean_cut(fixed, ((FIXED_PLATEN[0] + FIXED_PLATEN[1]) / 2, 0, AX), (.5, .12, .12), M['steel'])
clamp_static.append(fixed)
clamp_static.append(box('Fixed platen mold face', (-.004, 0, AX), (.008, .64, .64), M['steel'], bevel=.002))
for z in (AX - .22, AX - .08, AX + .08, AX + .22):
    clamp_static.append(box('T-slot', (.0005, 0, z), (.002, .60, .018), M['black'], bevel=0))
clamp_static.append(ring('Locating ring', -.012, .002, .05, .07, (0, AX), M['steel_dark']))
for side in (-1, 1):
    y0, y1 = sorted((side * BEAM_Y[0], side * BEAM_Y[1]))
    clamp_static.append(span('Fixed platen foot', (FIXED_PLATEN[0], y0, BED), (FIXED_PLATEN[1], y1, AX - PLATEN_HALF + .02),
                             M['paint_accent'], bevel=.004))
# Tie bars with nuts; rear nuts carry the mold-height adjustment sprockets.
tie_x0, tie_x1 = FIXED_PLATEN[0] - .09, REAR_PLATEN[1] + .12
for y, z in holes:
    clamp_static.append(cyl('Tie bar', ((tie_x0 + tie_x1) / 2, y, z), TIE_R, tie_x1 - tie_x0, 'X', M['chrome'], segments=36))
    clamp_static.append(kit.nut('Tie-bar nut', (FIXED_PLATEN[0] - .04, y, z), 'X', .09, .07, M['steel_dark']))
    clamp_static.append(kit.nut('Tie-bar adjust nut', (REAR_PLATEN[1] + .045, y, z), 'X', .09, .09, M['steel_dark']))
    clamp_static.append(cyl('Adjust sprocket', (REAR_PLATEN[1] + .1, y, z), .09, .025, 'X', M['steel'], segments=40))
clamp_static.append(ring('Mold-height ring gear', REAR_PLATEN[1] + .09, REAR_PLATEN[1] + .11, .33, .36, (0, AX),
                         M['steel'], segments=72))
clamp_static.append(kit.motor('Mold-height motor', (REAR_PLATEN[1] + .14, .0, AX + .44), .055, .14, 1, M))
rear = kit.plate_with_holes('Rear platen', *REAR_PLATEN, PLATEN_HALF, REAR_HALF_H, holes, AX, M['paint_accent'],
                            hole_r=TIE_R + .002)
clamp_static.append(rear)
for side in (-1, 1):
    lug_z = AX + side * TOGGLE['zR']
    for y in (-.085, .085):
        clamp_static.append(span('Rear toggle lug', (X_P - .055, y - .018, lug_z - .06),
                                 (REAR_PLATEN[0] + .01, y + .018, lug_z + .06), M['cast'], bevel=.008))
    clamp_static.append(cyl('Rear toggle pin', (X_P, 0, lug_z), .028, .24, 'Y', M['chrome']))
GUIDE_FRONT = MOVING_PLATEN[1] + OPEN_STROKE + .03
for y in (-.16, .16):
    clamp_static.append(cyl('Crosshead guide rod', ((REAR_PLATEN[0] + GUIDE_FRONT) / 2, y, AX), .022,
                            REAR_PLATEN[0] - GUIDE_FRONT, 'X', M['chrome']))
clamp_cyl, _rod = kit.hydraulic_cylinder('Clamp cylinder', (REAR_PLATEN[1] + .45, 0, AX), (REAR_PLATEN[1], 0, AX),
                                         .12, .05, M, rod_length=.01)
bpy.data.objects.remove(_rod, do_unlink=True)
clamp_static.append(clamp_cyl)

# Mold A (fixed half) with an operator-side cutaway exposing sprue, runner and cavity.
CUT_Z = (AX - .23, AX + .03)
mold_a = join([span('Mold A clamp plate', (MOLD_A[0], -.23, MOLD_Z[0]), (.035, .23, MOLD_Z[1]), M['steel_dark']),
               span('Mold A cavity plate', (.035, -MOLD_HALF_W, MOLD_Z[0]), (MOLD_A[1], MOLD_HALF_W, MOLD_Z[1]), M['steel'])],
              'Mold A')
kit.boolean_cut(mold_a, ((MOLD_A[0] + MOLD_A[1]) / 2, -.15, sum(CUT_Z) / 2), (.26, .30, CUT_Z[1] - CUT_Z[0] + .04), M['section'])
clamp_static.append(mold_a)
for y in (-.21, .21):
    for z in (MOLD_Z[0] + .04, MOLD_Z[1] - .04):
        clamp_static.append(span('Mold clamp', (.0, y - .02, z - .025), (.06, y + .02, z + .025), M['steel_dark']))
        clamp_static.append(kit.cap_screw('Mold clamp screw', (.03, y, z + .03), 'Z', .016, 1, M['steel_dark']))
for y, z in ((-.15, MOLD_Z[1] - .05), (.15, MOLD_Z[1] - .05), (-.15, MOLD_Z[0] + .05), (.15, MOLD_Z[0] + .05)):
    clamp_static.append(cyl('Mold guide pillar', (MOLD_A[1] + .02, y, z), .014, .08, 'X', M['chrome'], segments=16))
for z in (AX + .16, AX + .10):
    clamp_static.append(cyl('Mold A water fitting', (.09, MOLD_HALF_W + .02, z), .012, .04, 'Y', M['brass'], segments=12))
join(clamp_static, 'Clamp unit static')

# Moving half: platen, mold B, toggle front links, ejector cylinder.
moving = group(empty('MovingMold'), 'clamp')
mov = []
mp = kit.plate_with_holes('Moving platen', *MOVING_PLATEN, PLATEN_HALF, PLATEN_HALF, holes, AX, M['paint_accent'],
                          hole_r=TIE_R + .002)
kit.boolean_cut(mp, (sum(MOVING_PLATEN) / 2, 0, AX), (.4, .06, .06), M['steel'])
mov.append(mp)
mov.append(box('Moving platen mold face', (MOVING_PLATEN[0] + .004, 0, AX), (.008, .64, .64), M['steel'], bevel=.002))
for y, z in holes:
    mov.append(ring('Tie-bar bushing', MOVING_PLATEN[0] - .04, MOVING_PLATEN[1] + .06, TIE_R + .002, TIE_R + .03,
                    (y, z), M['steel_dark']))
for side in (-1, 1):
    mov.append(span('Platen slide shoe', (MOVING_PLATEN[0] + .02, side * RAIL_Y - .04, BED + .025),
                    (MOVING_PLATEN[1] - .02, side * RAIL_Y + .04, BED + .06), M['steel_dark'], bevel=.004))
    y0, y1 = sorted((side * BEAM_Y[0], side * (RAIL_Y + .04)))
    mov.append(span('Platen shoe bracket', (MOVING_PLATEN[0] + .03, y0, BED + .05),
                    (MOVING_PLATEN[1] - .03, y1, AX - PLATEN_HALF + .02), M['paint_accent'], bevel=.004))
    zq = AX + side * TOGGLE['zM']
    for y in (-.04, .04):
        mov.append(span('Front toggle lug', (MOVING_PLATEN[1] - .01, y - .015, zq - .05), (X_Q0 + .04, y + .015, zq + .05),
                        M['cast'], bevel=.006))
    mov.append(cyl('Front toggle pin', (X_Q0, 0, zq), .024, .14, 'Y', M['chrome']))
B_SUPPORT, B_SPACER, B_CLAMP = MOLD_B[0] + .09, MOLD_B[0] + .105, MOLD_B[1] - .03
mold_b = join([span('Mold B core plate', (MOLD_B[0], -MOLD_HALF_W, MOLD_Z[0]), (B_SUPPORT, MOLD_HALF_W, MOLD_Z[1]), M['steel']),
               span('Mold B support plate', (B_SUPPORT, -MOLD_HALF_W, MOLD_Z[0]), (B_SPACER, MOLD_HALF_W, MOLD_Z[1]), M['steel']),
               span('Mold B spacer block', (B_SPACER, -MOLD_HALF_W, MOLD_Z[0]), (B_CLAMP, -.13, MOLD_Z[1]), M['steel_dark']),
               span('Mold B spacer block', (B_SPACER, .13, MOLD_Z[0]), (B_CLAMP, MOLD_HALF_W, MOLD_Z[1]), M['steel_dark']),
               span('Mold B clamp plate', (B_CLAMP, -.23, MOLD_Z[0]), (MOLD_B[1], .23, MOLD_Z[1]), M['steel_dark'])],
              'Mold B')
kit.boolean_cut(mold_b, (sum(MOLD_B) / 2, -.15, sum(CUT_Z) / 2), (.26, .30, CUT_Z[1] - CUT_Z[0] + .04), M['section'])
mov.append(mold_b)
for y in (-.15, .15):
    for z in (MOLD_Z[1] - .05, MOLD_Z[0] + .05):
        mov.append(ring('Mold guide bushing', MOLD_B[0], MOLD_B[0] + .07, .014, .024, (y, z), M['brass'], segments=16))
mov.append(cyl('Mold B water fitting', (MOLD_B[0] + .05, MOLD_HALF_W + .02, AX + .16), .012, .04, 'Y', M['brass'], segments=12))
ej_body, _rod = kit.hydraulic_cylinder('Ejector cylinder', (MOVING_PLATEN[1] + EJECTOR_CYL, 0, AX), (MOVING_PLATEN[1], 0, AX),
                                       .055, .025, M, rod_length=.01, ports=True)
bpy.data.objects.remove(_rod, do_unlink=True)
mov.append(ej_body)
join(mov, 'Moving platen assembly').parent = moving
for z, mat in ((AX + .16, 'hose_blue'), (AX + .10, 'hose_red')):
    kit.hose('Mold B hose', (MOLD_B[0] + .05, MOLD_HALF_W + .04, z), (.40, .55, AX + .42), .011, M[mat], sag=-.1, parent=moving)

ejector = group(empty('Ejector', parent=moving), 'ejector')
EJ_PLATE = (B_CLAMP - .035, B_CLAMP - .01)
ejp = [span('Ejector plate', (EJ_PLATE[0] + .012, -.12, MOLD_Z[0] + .02), (EJ_PLATE[1], .12, MOLD_Z[1] - .02), M['steel']),
       span('Ejector retainer', (EJ_PLATE[0], -.12, MOLD_Z[0] + .02), (EJ_PLATE[0] + .012, .12, MOLD_Z[1] - .02), M['steel']),
       cyl('Knock-out rod', ((EJ_PLATE[1] + MOVING_PLATEN[1] + .05) / 2, 0, AX), .016, MOVING_PLATEN[1] + .05 - EJ_PLATE[1],
           'X', M['chrome'])]
for y in (-.045, .045):
    for z in (PART['gate_z'] - .03, PART['gate_z'] - .11):
        ejp.append(cyl('Ejector pin', ((PART['x'][1] + EJ_PLATE[0]) / 2, y, z), .004, EJ_PLATE[0] - PART['x'][1], 'X',
                       M['chrome'], segments=10))
join(ejp, 'Ejector pins and plate').parent = ejector

# Toggle links. Rear links rotate on the rear platen; front and crosshead links track pins.
links = {}
for side, tag in ((1, 'Upper'), (-1, 'Lower')):
    t = TOGGLE
    rear_link = group(empty('ToggleRear' + tag, (X_P, 0, AX + side * t['zR'])), 'clamp')
    plates = []
    for y in (-.085, .085):
        plates.append(box('Rear link plate', (t['L1'] / 2, y, 0), (t['L1'] + .07, .028, .075), M['cast'], bevel=.01))
        plates.append(kit.between('Rear link web', (0, y, 0), (t['a'], y, PIN_SIGN[side] * t['b']), .03, M['cast'],
                                  segments=12))
    plates.append(cyl('Knee pin', (t['L1'], 0, 0), .026, .22, 'Y', M['chrome']))
    plates.append(cyl('Crosshead-link pin', (t['a'], 0, PIN_SIGN[side] * t['b']), .02, .27, 'Y', M['chrome']))
    join(plates, 'Rear link ' + tag).parent = rear_link
    knee = empty('ToggleKnee' + tag, (t['L1'], 0, 0), rear_link, size=.04)
    pin = empty('ToggleCrossPin' + tag, (t['a'], 0, PIN_SIGN[side] * t['b']), rear_link, size=.04)
    front = empty('ToggleFront' + tag, (X_Q0, 0, AX + side * t['zM']), moving)
    join([box('Front link', (t['L2'] / 2, 0, 0), (t['L2'] + .07, .06, .07), M['cast'], bevel=.01)],
         'Front link ' + tag).parent = front
    links[tag] = (rear_link, knee, pin, front)

crosshead = group(empty('Crosshead', (_poses[0]['crosshead'], 0, AX)), 'clamp')
ch = [box('Crosshead body', (0, 0, 0), (.08, .26, .2), M['cast'], bevel=.01)]
for y in (-.16, .16):
    ch.append(ring('Crosshead guide bush', -.05, .05, .022, .04, (y, 0), M['brass']))
for side in (-1, 1):
    ch.append(cyl('Crosshead pin', (0, 0, side * TOGGLE['zX']), .02, .3, 'Y', M['chrome']))
join(ch, 'Crosshead body').parent = crosshead
ROD = REAR_PLATEN[1] + .10 - _poses[0]['crosshead']     # reaches into the clamp cylinder when locked
cyl('ClampRod', (ROD / 2, 0, 0), .05, ROD, 'X', M['chrome'], parent=crosshead)
cross_links = {}
for side, tag in ((1, 'Upper'), (-1, 'Lower')):
    node = empty('ToggleCrossLink' + tag, (0, 0, side * TOGGLE['zX']), crosshead)
    for y in (-.12, .12):
        box('Crosshead link plate', (TOGGLE['L3'] / 2, y, 0), (TOGGLE['L3'] + .05, .02, .05), M['cast'], node, bevel=.008)
    cross_links[tag] = node

# ---------------------------------------------------------------- injection unit
carriage = group(empty('Carriage'), 'carriage')
inj = []
SLED_Z = (BED + .07, BED + .11)
inj.append(span('Injection front plate', (FRONT_PLATE[0], -.28, AX - .20), (FRONT_PLATE[1], .28, AX + .20), M['paint_accent'], bevel=.01))
inj.append(span('Injection sled', (X_BASE[0] + .10, -.30, SLED_Z[0]), (THROAT[0] + .05, .30, SLED_Z[1]), M['steel_dark'], bevel=.006))
for y in (-.22, .22):
    for x0 in (FRONT_PLATE[0] - .06, X_BASE[0] + .14):
        inj.append(span('Sled slide block', (x0, y - .04, BED + .03), (x0 + .18, y + .04, SLED_Z[0]), M['steel'], bevel=.004))
    inj.append(span('Front plate support', (FRONT_PLATE[0], y - .03, SLED_Z[1]), (FRONT_PLATE[1], y + .03, AX - .2), M['paint_accent']))
REAR_BRACKET = (X_BASE[0] + .12, X_BASE[0] + .18)
for z in (AX - .17, AX + .17):
    inj.append(cyl('Injection guide rod', ((FRONT_PLATE[0] + REAR_BRACKET[1]) / 2, 0, z), .02,
                   FRONT_PLATE[0] - REAR_BRACKET[1], 'X', M['chrome']))
inj.append(span('Guide rod rear bracket', (REAR_BRACKET[0], -.05, AX - .21), (REAR_BRACKET[1], .05, AX + .21), M['paint_accent']))
inj.append(span('Rear bracket post', (REAR_BRACKET[0], -.05, SLED_Z[1]), (REAR_BRACKET[1], .05, AX - .21), M['paint_accent']))
R_BARREL, R_HEATER, R_SHROUD = .045, .045, .082        # barrel OD ~2.25D, heater OD ~2.85D (C)
inj.append(ring('Barrel', THROAT[0], BARREL[1], D / 2 + .0005, R_BARREL, (0, AX), M['steel'], arc=REAR_HALF, cap_mat=M['section']))
inj.append(ring('Barrel head', BARREL[1], BARREL[1] + .08, .005, .062, (0, AX), M['steel_dark'], arc=REAR_HALF, cap_mat=M['section']))
inj.append(ring('Nozzle', BARREL[1] + .08, -.006, .004, .024, (0, AX), M['steel'], arc=REAR_HALF, cap_mat=M['section']))
inj.append(cyl('Nozzle tip', (-.004, 0, AX), .016, .008, 'X', M['steel'], radius2=.011))
inj.append(kit.heater_band('Nozzle heater', -.09, .024, .06, M['ceramic'], M['steel_dark'], (0, AX),
                           arc=REAR_HALF, cap_mat=M['section']))
for xc, zone in ZONES:
    for dx in (-.055, .055):
        inj.append(kit.heater_band('Heater band ' + zone, xc + dx, R_HEATER, .09, M['heater'], M['steel_dark'], (0, AX),
                                   arc=REAR_HALF, cap_mat=M['section']))
    inj.append(kit.between('Thermocouple ' + zone, (xc, 0, AX + R_BARREL), (xc, 0, AX + .14), .005, M['copper'], segments=8))
    inj.append(kit.hose('Heater cable ' + zone, (xc, .02, AX + .14), (xc - .1, .22, AX + .30), .006, M['cable'], sag=-.02))
inj.append(ring('Heat shroud', BARREL[0] + .02, BARREL[1] - .04, R_SHROUD, R_SHROUD + .004, (0, AX), M['steel_dark'],
                arc=REAR_HALF, cap_mat=M['section']))
throat = span('Feed throat', (THROAT[0], -.09, AX - .08), (THROAT[1], .09, AX + .08), M['cast'], bevel=.008)
inj.append(kit.boolean_cut(throat, (HOPPER_X, -.11, AX), (.09, .14, .11), M['section']))
for z, mat in ((AX - .035, 'hose_blue'), (AX + .035, 'hose_red')):
    inj.append(cyl('Throat water fitting', (HOPPER_X, .105, z), .009, .03, 'Y', M['brass'], segments=12))
    inj.append(kit.hose('Throat water hose', (HOPPER_X, .12, z), (HOPPER_X - .40, .45, BED + .15), .009, M[mat], sag=.05))
hopper, ports = kit.drying_hopper('Drying hopper', HOPPER_X, 0, AX + .08, M, radius=.17)
inj.append(hopper)
inj.append(kit.hose('Dry air supply', ports['inlet'], (HOPPER_X - .55, .75, 1.2), .026, M['rubber'], sag=.15))
inj.append(kit.hose('Dry air return', ports['return'], (HOPPER_X - .60, .75, 1.6), .026, M['rubber'], sag=.1))
inj.append(kit.hose('Material conveying line', ports['loader'], (HOPPER_X - .35, .6, 2.45), .02, M['smoked'], sag=-.1))
for y in (-.20, .20):
    body, _rod = kit.hydraulic_cylinder('Injection cylinder', (FRONT_PLATE[0], y, AX), (PISTON_PLATE[1] + .04, y, AX), .065, .028, M,
                                        rod_length=.01)
    bpy.data.objects.remove(_rod, do_unlink=True)
    inj.append(body)
HOOD = (X_BASE[0] + .10, PISTON_PLATE[0] - .02)
inj.extend([span('Injection hood top', (HOOD[0], -.36, AX + .27), (HOOD[1], .36, AX + .29), M['paint'], bevel=.006),
            span('Injection hood rear', (HOOD[0], .34, SLED_Z[1]), (HOOD[1], .36, AX + .29), M['paint'], bevel=.004),
            span('Hood accent stripe', (HOOD[0], -.37, AX + .245), (HOOD[1], -.355, AX + .27), M['paint_accent'], bevel=0),
            box('Hood warning label', (HOOD[0] + .2, -.362, AX + .2), (.06, .003, .05), M['warning'], bevel=0)])
for y in (-.32, .32):
    body, rod = kit.hydraulic_cylinder('Nozzle touch cylinder', (THROAT[0], y, AX - .1), (-.42, y, AX - .1), .038, .018, M,
                                       rod_length=.25)
    inj.append(body)
    inj.append(span('Nozzle touch bracket', (FRONT_PLATE[0], min(y, y * .8) - .03, AX - .14),
                    (THROAT[0] + .02, max(y, y * .8) + .03, AX - .06), M['paint_accent'], bevel=.004))
    rod.name = 'Nozzle touch rod'
join(inj, 'Injection unit').parent = carriage

screw_slide = empty('ScrewSlide', parent=carriage)
sl = [span('Injection piston plate', (PISTON_PLATE[0], -.30, AX - .20), (PISTON_PLATE[1], .30, AX + .20), M['paint_accent'], bevel=.008)]
for z in (AX - .17, AX + .17):
    sl.append(ring('Piston plate bush', PISTON_PLATE[0] - .02, PISTON_PLATE[1] + .02, .02, .036, (0, z), M['brass']))
for y in (-.20, .20):
    sl.append(cyl('Injection cylinder rod', (PISTON_PLATE[1] + .14, y, AX), .028, .32, 'X', M['chrome']))
sl.append(kit.motor('Plasticizing hydraulic motor', (PISTON_PLATE[0] - .13, 0, AX), .10, .22, 1, M))
join(sl, 'Screw drive').parent = screw_slide
screw_spin = empty('ScrewSpin', (0, 0, AX), screw_slide)
FLIGHT_FRONT = TIP - .03
flighted = kit.single_flight_screw('Screw', FLIGHT_FRONT, D, D * LD, h_feed=H_FEED, h_meter=H_METER, center=(0, 0),
                                   mat=M['steel'])
screw_rear = FLIGHT_FRONT - D * LD
shank = cyl('Screw shank', ((screw_rear + PISTON_PLATE[1]) / 2, 0, 0), .018, screw_rear - PISTON_PLATE[1], 'X', M['steel'])
fixed_parts = [cyl('Check seat', (FLIGHT_FRONT + .003, 0, 0), D / 2 - .004, .006, 'X', M['steel_dark']),
               cyl('Screw tip', (TIP - .012, 0, 0), .014, .026, 'X', M['steel'], radius2=.004),
               cyl('Screw tip stem', (FLIGHT_FRONT + .014, 0, 0), .008, .03, 'X', M['steel']),
               cyl('Screw coupling', (PISTON_PLATE[1] + .07, 0, 0), .032, .07, 'X', M['steel_dark'])]
join([flighted, shank, *fixed_parts], 'Screw').parent = screw_spin
# Sliding check ring: moves forward (open) while dosing, seats against the screw during injection.
check_ring = empty('CheckRing', (0, 0, 0), screw_spin)
cyl('Check ring', (FLIGHT_FRONT + .016, 0, 0), D / 2 - .0006, .016, 'X', M['brass'], parent=check_ring)
CHECK_TRAVEL = .003

reservoir_mesh = cyl('MeltReservoir', (-.5, 0, 0), D / 2 - .001, 1.0, 'X', M['polymer'], segments=24)
reservoir_mesh.location = (BARREL[1], 0, AX)
reservoir_mesh.parent = carriage

# --------------------------------------------------------------- guards & HMI
guards = []
gz0, gz1 = BED + .04, BED + 1.15                    # gate height 1.11 m (C 0.9-1.2)
GATE_X = (FIXED_PLATEN[0] - .03, .98)               # sliding gate width 1.18 m (C 1.0-1.3)
GUARD_END = X_BASE[1] - .14
for y, handle in ((-.48, True), (.48, False)):
    guards.append(kit.guard_panel('Clamp safety gate', *GATE_X, gz0, gz1, y, M, handle=handle, frame=.045))
    guards.append(kit.guard_panel('Toggle guard', GATE_X[1], GUARD_END, gz0, gz1, y, M, frame=.045))
for x in GATE_X[0], GUARD_END:
    guards.append(span('Guard end post', (x - .02, -.50, gz0), (x + .02, .50, gz0 + .04), M['paint']))
guards += [span('Top guard rail', (GATE_X[0], y - .02, gz1 - .02), (GUARD_END, y + .02, gz1 + .02), M['paint']) for y in (-.48, .48)]
guards += [span('Top guard cross rail', (x - .02, -.48, gz1 - .02), (x + .02, .48, gz1 + .02), M['paint'])
           for x in (GATE_X[0], GATE_X[1], GUARD_END)]
guards.append(span('Top guard window', (GATE_X[0] + .02, -.46, gz1 - .004), (GUARD_END - .02, .46, gz1 + .002), M['glass'], bevel=0))
guards.append(kit.guard_panel('Purge guard front', -.47, FIXED_PLATEN[0] - .03, AX - .16, AX + .2, -.2, M, frame=.02, depth=.02))
guards.append(span('Purge guard top', (-.47, -.2, AX + .19), (FIXED_PLATEN[0] - .03, .2, AX + .2), M['smoked'], bevel=0))
guards.append(kit.stack_light('Stack light', (GATE_X[0] + .08, -.44, gz1 + .02), M))
guards.append(box('Safety gate label', (.25, -.497, gz1 - .30), (.08, .003, .07), M['warning'], bevel=0))
join(guards, 'Safety guards')
# 12-15 inch portrait controller beside the fixed platen, screen centre 1.45 m (C).
kit.hmi_pedestal('Operator HMI', (-.32, -1.0, 0), (-.32, -1.02, 1.45), M, width=.34, height=.40)

# ------------------------------------------------------------- utilities, floor
util = [kit.cabinet('Electrical cabinet', (-2.45, .51, .08), (-1.20, .80, 1.20), M)]
util.append(span('Water manifold panel', (-.12, .52, BED + .12), (.12, .56, AX + .22), M['paint_dark']))
for i, z in enumerate((BED + .22, BED + .32, BED + .42, BED + .52)):
    util.append(cyl('Flow regulator', (-.06 if i % 2 else .06, .575, z), .02, .05, 'Y', M['smoked'], segments=16))
for z, mat in ((AX + .16, 'hose_blue'), (AX + .10, 'hose_red')):
    util.append(kit.hose('Mold A hose', (.09, MOLD_HALF_W + .04, z), (.0, .56, z - .2), .011, M[mat], sag=.08))
util.append(kit.tube_path('Cable tray run', [(-2.4, .53, 1.22), (-1.0, .53, 1.22), (-.5, .53, BED + .15)], .02, M['cable']))
join(util, 'Utilities')
kit.floor('Floor', X_BASE[0] - .1, X_BASE[1] + .1, -1.05, .85, M)

# ---------------------------------------------------------- shot (part, runner)
GATE = Vector((PART['x'][0], 0, PART['gate_z']))
part = group(empty('MoldedPart', GATE), 'shot')
fill = empty('PartFill', parent=part)
x0, x1 = PART['x']
lid = [span('Molded lid face', (0, -PART['y'] / 2, -PART['z']), (x1 - x0, PART['y'] / 2, 0), M['polymer'], bevel=.003)]
for y in (-PART['y'] / 2, PART['y'] / 2 - .006):
    lid.append(span('Molded lid rim', (x1 - x0, y, -PART['z']), (x1 - x0 + .012, y + .006, 0), M['polymer'], bevel=.001))
join(lid, 'Molded lid').parent = fill
runner = empty('RunnerFill', parent=part)
sprue = kit.between('Sprue', (-x0, 0, AX - PART['gate_z']), (MOLD_A[1] - x0, 0, AX - PART['gate_z']), .005, M['polymer'],
                    radius2=.009)
drop = kit.between('Runner', (MOLD_A[1] - x0, 0, AX - PART['gate_z']), (MOLD_A[1] - x0, 0, -.004), .006, M['polymer'])
join([sprue, drop], 'Sprue and runner').parent = runner

markers = {'FeedPellet': [], 'BarrelFlow': [], 'FillFlow': []}
for i in range(8):
    markers['FeedPellet'].append(cyl('FeedPellet%02d' % i, (0, 0, 0), .008, .011, 'X', M['pellet'], segments=10))
for i in range(14):
    markers['BarrelFlow'].append(cyl('BarrelFlow%02d' % i, (0, 0, 0), .008, .014, 'X', M['polymer_marker'], segments=10))
for i in range(8):
    markers['FillFlow'].append(cyl('FillFlow%02d' % i, (0, 0, 0), .006, .018, 'X', M['polymer_marker'], segments=10))

# ------------------------------------------------------------------ rig/drivers
rig = empty('MachineControls', (0, 0, 0), size=.3)
rig.empty_display_type = 'ARROWS'
AXES = [('screw_retraction', 100), ('screw_rotation_deg', 2880), ('mold_opening', 100),
        ('ejector_extension', 100), ('carriage_retraction', 100), ('check_ring_open', 100)]
for name, maximum in AXES:
    rig[name] = 0.0
    rig.id_properties_ui(name).update(min=0, max=maximum, soft_min=0, soft_max=maximum,
                                     description='Illustrative stroke percentage / angle; not machine settings')
DRIVERS = []


def drive(obj, path, index, expression, variables):
    curve = obj.driver_add(path, index)
    curve.driver.type = 'SCRIPTED'
    for alias, target in variables.items():
        var = curve.driver.variables.new()
        var.name = alias
        if isinstance(target, str):
            var.type = 'SINGLE_PROP'
            var.targets[0].id = rig
            var.targets[0].data_path = '["%s"]' % target
        else:
            obj_t, channel = target
            var.type = 'TRANSFORMS'
            var.targets[0].id = obj_t
            var.targets[0].transform_type = channel
            var.targets[0].transform_space = 'WORLD_SPACE'
    curve.driver.expression = expression
    DRIVERS.append((obj.name, curve))
    return curve


drive(screw_slide, 'location', 0, '-%r*s/100' % SCREW_STROKE, {'s': 'screw_retraction'})
drive(screw_spin, 'rotation_euler', 0, '-a*pi/180', {'a': 'screw_rotation_deg'})
drive(check_ring, 'location', 0, '%r*k/100' % CHECK_TRAVEL, {'k': 'check_ring_open'})
drive(moving, 'location', 0, '%r*m/100' % OPEN_STROKE, {'m': 'mold_opening'})
drive(ejector, 'location', 0, '-%r*e/100 if m>=95 else 0' % EJECT_STROKE, {'e': 'ejector_extension', 'm': 'mold_opening'})
drive(carriage, 'location', 0, '-%r*c/100' % CARRIAGE_STROKE, {'c': 'carriage_retraction'})
drive(reservoir_mesh, 'scale', 0, '%r+%r*s/100' % (CUSHION, SCREW_STROKE), {'s': 'screw_retraction'})
t = TOGGLE
for side, tag in ((1, 'Upper'), (-1, 'Lower')):
    rear_link, knee, pin, front = links[tag]
    # Blender caps driver expressions at 256 characters, so constants are folded:
    # alpha = atan2(dz, dx) +/- acos((L1^2 - L2^2 + dx^2 + dz^2) / (2 L1 sqrt(dx^2 + dz^2)))
    dz = side * (t['zM'] - t['zR'])
    dx = '(m*%.7g%+.7g)' % (OPEN_STROKE / 100, X_Q0 - X_P)
    expr = '-(atan2(%.7g,%s)%sacos((%.7g+%s*%s)/(%.7g*sqrt(%s*%s+%.7g))))' % (
        dz, dx, '+' if side > 0 else '-', t['L1']**2 - t['L2']**2 + dz * dz, dx, dx, 2 * t['L1'], dx, dx, dz * dz)
    assert len(expr) < 250, len(expr)
    drive(rear_link, 'rotation_euler', 1, expr, {'m': 'mold_opening'})
    con = front.constraints.new('DAMPED_TRACK')
    con.target, con.track_axis = knee, 'TRACK_X'
    con = cross_links[tag].constraints.new('DAMPED_TRACK')
    con.target, con.track_axis = pin, 'TRACK_X'
pin_upper = links['Upper'][2]
drive(crosshead, 'location', 0, 'cx-sqrt(%r-(cz-%r)*(cz-%r))' % (t['L3']**2, AX + t['zX'], AX + t['zX']),
      {'cx': (pin_upper, 'LOC_X'), 'cz': (pin_upper, 'LOC_Z')})

# Verify Blender's evaluated rig against the offline solution.
bpy.context.view_layer.update()
for name, curve in DRIVERS:
    assert curve.driver.is_valid and curve.driver.is_simple_expression, (name, curve.driver.expression)
for m in (0, 37, 100):
    rig['mold_opening'] = float(m)
    rig.update_tag()
    bpy.context.view_layer.update()
    expected = toggle_pose(m, 1)
    k = links['Upper'][1].matrix_world.translation
    assert abs(k.x - expected['knee'][0]) < 1e-4 and abs(k.z - expected['knee'][1]) < 1e-4, (m, k, expected['knee'])
    assert abs(crosshead.matrix_world.translation.x - expected['crosshead']) < 1e-4
    for tag in ('Upper', 'Lower'):
        rear_link, knee, pin, front = links[tag]
        tip_front = front.matrix_world @ Vector((TOGGLE['L2'], 0, 0))
        assert (tip_front - knee.matrix_world.translation).length < 2e-4, ('front link', tag, m)
        tip_cross = cross_links[tag].matrix_world @ Vector((TOGGLE['L3'], 0, 0))
        assert (tip_cross - pin.matrix_world.translation).length < 2e-4, ('crosshead link', tag, m)
rig['mold_opening'] = 0.0


# --------------------------------------------------------------------- timeline
def ease(f):
    return f * f * f * (f * (f * 6 - 15) + 10)


def interp(time, points, smooth=True):
    if time <= points[0][0]:
        return points[0][1]
    for (a, va), (b, vb) in zip(points, points[1:]):
        if a <= time <= b:
            f = (time - a) / (b - a)
            return va + (vb - va) * (ease(f) if smooth else f)
    return points[-1][1]


# Steady cycle: the 30 s teaching example of the research pack compressed to 14 s.
# Each row: start, end, Korean, English. Dosing for the next shot overlaps cooling.
STEPS = [
    (0.00, 0.70, '형폐 (고속)', 'Mould closing (fast)'),
    (0.70, 0.93, '형폐 (금형보호)', 'Mould closing (mould protection)'),
    (0.93, 1.17, '형체력 상승', 'Clamp-force build-up'),
    (1.17, 1.40, '노즐 전진', 'Carriage advance'),
    (1.40, 2.10, '충전 (다단 속도)', 'Injection filling'),
    (2.10, 2.16, 'V/P 전환', 'V/P transfer'),
    (2.10, 4.20, '보압', 'Holding pressure'),
    (4.20, 11.67, '냉각', 'Cooling'),
    (4.43, 7.70, '냉각 + 계량 (다음 샷)', 'Cooling + dosing (next shot)'),
    (7.70, 7.93, '냉각 + 석백', 'Cooling + decompression'),
    (7.93, 8.07, '냉각 + 노즐 후퇴 (선택)', 'Cooling + carriage retract (optional)'),
    (11.67, 11.90, '형체 해제', 'Clamp release'),
    (11.90, 12.83, '형개', 'Mould opening'),
    (12.83, 13.21, '이젝터 전진', 'Ejector forward'),
    (13.21, 13.53, '취출 (낙하)', 'Part removal (drop)'),
    (13.53, 13.77, '이젝터 복귀', 'Ejector return'),
    (13.77, 14.00, '금형 영역 확인', 'Clearance check'),
]
# Four app stages (process-atlas steps) in time order; dosing (stage 0) happens while cooling.
STAGE_SEGMENTS = [[0, 2.10, 1], [2.10, 4.43, 2], [4.43, 7.93, 0], [7.93, 11.67, 2], [11.67, CYCLE, 3]]
STAGE_STARTS = [4.43, 1.17, 2.10, 11.67]
WINDOWS = {'dosing': [4.43, 7.70], 'fill': [1.40, 2.25]}
SCHEDULE = {
    'mold_opening': [(0, 100), (0.70, 12), (0.93, 2), (1.17, 0), (11.67, 0), (11.90, 2), (12.70, 92), (12.83, 100), (CYCLE, 100)],
    'carriage_retraction': [(0, SPRUE_BREAK), (1.17, SPRUE_BREAK), (1.40, 0), (7.93, 0), (8.07, SPRUE_BREAK), (CYCLE, SPRUE_BREAK)],
    'screw_retraction': [(0, 100), (1.40, 100), (2.10, 12), (2.30, 10.5), (4.20, 8), (4.43, 8), (7.70, 94), (7.93, 100), (CYCLE, 100)],
    'ejector_extension': [(0, 0), (12.83, 0), (13.21, 100), (13.53, 100), (13.77, 0), (CYCLE, 0)],
    'check_ring_open': [(0, 0), (4.43, 0), (4.60, 100), (7.70, 100), (7.85, 0), (CYCLE, 0)],
}
RELEASE, REMOVED = 13.21, 13.95
DROP_PATH = [Vector((0, 0, 0)), Vector((-.02, 0, -.42)), Vector((-.08, -.62, -.70)), Vector((-.08, -.84, -.84))]


def along(points, f):
    lengths = [(b - a).length for a, b in zip(points, points[1:])]
    remaining = f * sum(lengths)
    for a, b, length in zip(points, points[1:], lengths):
        if remaining <= length:
            return a.lerp(b, remaining / length)
        remaining -= length
    return points[-1]


nozzle_path = [Vector((BARREL[1], 0, AX)), Vector((MOLD_A[1], 0, AX)), Vector((MOLD_A[1], 0, PART['gate_z'])),
               Vector((MOLD_A[1], 0, PART['gate_z'] - PART['z'] * .8))]
hidden = (.001, .001, .001)
dose0, dose1 = WINDOWS['dosing']
for frame in range(sc.frame_start, sc.frame_end + 1):
    time = frame / FPS
    sc.frame_set(frame)
    in_cycle = time <= CYCLE
    if in_cycle:
        values = {key: interp(time, pts) for key, pts in SCHEDULE.items()}
        values['screw_rotation_deg'] = 2880 * ease(min(1, max(0, (time - dose0) / (dose1 - dose0))))
    else:
        values = {'screw_retraction': 100, 'screw_rotation_deg': 0,
                  'mold_opening': 100 * min(1, max(0, (time - SWEEP_START) / SWEEP)),
                  'ejector_extension': 0, 'carriage_retraction': 0, 'check_ring_open': 0}
    for key, value in values.items():
        rig[key] = value
        rig.keyframe_insert(data_path='["%s"]' % key, frame=frame)
    opening, eject = values['mold_opening'], values['ejector_extension']
    # Shot: fills 1.40-2.25 s, cools in the closed mould, travels with the moving half,
    # ejects, drops through the base chute into the tote, then leaves the scene.
    present = (not in_cycle) or 1.40 <= time < REMOVED
    filled = max(.001, min(1, (time - 1.40) / .85)) if in_cycle else 1
    if in_cycle and time >= RELEASE:
        f = min(1, (time - RELEASE) / (REMOVED - RELEASE - .05)) ** 2
        part.location = GATE + Vector((OPEN_STROKE - EJECT_STROKE, 0, 0)) + along(DROP_PATH, f)
        part.rotation_euler = (math.radians(70) * f, 0, 0)
    else:
        part.location = GATE + Vector((OPEN_STROKE * opening / 100 - EJECT_STROKE * eject / 100, 0, 0))
        part.rotation_euler = (0, 0, 0)
    part.scale = (1, 1, 1) if present else hidden
    fill.scale = (1, 1, filled)
    runner.scale = (1, 1, 1) if present else hidden
    for obj, paths in ((part, ('location', 'rotation_euler', 'scale')), (fill, ('scale',)), (runner, ('scale',))):
        for p in paths:
            obj.keyframe_insert(data_path=p, frame=frame)
    dosing = in_cycle and dose0 <= time < dose1
    for i, dot in enumerate(markers['FeedPellet']):
        f = (time * .8 + i / len(markers['FeedPellet'])) % 1
        dot.location = (HOPPER_X + .012 * math.sin(i * 2.1), -.01 * math.cos(i), AX + .50 - .46 * f)
        dot.scale = (1, 1, 1) if dosing else hidden
        dot.keyframe_insert('location', frame=frame)
        dot.keyframe_insert('scale', frame=frame)
    for i, dot in enumerate(markers['BarrelFlow']):
        f = (time * .3 + i / len(markers['BarrelFlow'])) % 1
        a = -TAU * 9 * f
        dot.location = (screw_rear + .04 + (FLIGHT_FRONT - screw_rear - .06) * f - SCREW_STROKE * values['screw_retraction'] / 100,
                        -.016 + .004 * math.cos(a), AX + .015 * math.sin(a))
        dot.scale = (1, 1, 1) if dosing else hidden
        dot.keyframe_insert('location', frame=frame)
        dot.keyframe_insert('scale', frame=frame)
    filling = in_cycle and WINDOWS['fill'][0] <= time < WINDOWS['fill'][1]
    for i, dot in enumerate(markers['FillFlow']):
        f = ((time - WINDOWS['fill'][0]) * 1.4 + i / len(markers['FillFlow'])) % 1
        dot.location = along(nozzle_path, f)
        dot.scale = (1, 1, 1) if filling else hidden
        dot.keyframe_insert('location', frame=frame)
        dot.keyframe_insert('scale', frame=frame)

kit.bake_linear()
for start, _end, _ko, en in STEPS:
    sc.timeline_markers.new(en, frame=int(round(start * FPS)))
sc.timeline_markers.new('Mold sweep (manual axis)', frame=int(round(SWEEP_START * FPS)))


# ------------------------------------------------------------ metadata (extras)
def three(v):
    """Blender Z-up metres -> glTF/three.js Y-up coordinates."""
    return [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]


VIEW_T = (-.20, 0, 1.20)
META = {
    'schema': 'pha-machine-v1',
    'cycle_seconds': CYCLE, 'example_cycle_seconds': 30, 'fps': FPS,
    'stage_starts': STAGE_STARTS, 'stage_segments': STAGE_SEGMENTS, 'windows': WINDOWS,
    'steps': [[round(a, 2), round(b, 2), ko, en] for a, b, ko, en in STEPS],
    'sweeps': {'mold_opening': [round(SWEEP_START, 6), round(SWEEP_START + SWEEP, 6)]},
    'strokes_m': {'screw': SCREW_STROKE, 'mold': OPEN_STROKE, 'ejector': EJECT_STROKE,
                  'carriage': CARRIAGE_STROKE, 'cushion': CUSHION},
    'part': {'gate': three(GATE), 'drop_path': [three(p) for p in DROP_PATH], 'release_ejector': 99.9},
    'toggle': {key: TOGGLE[key] for key in ('L1', 'L2', 'L3')},
    'view': {'target': three(VIEW_T), 'position': three((VIEW_T[0] + 4.2, -7.6, VIEW_T[2] + 3.6)), 'span': 6.9,
             'side_position': three((VIEW_T[0], -9, VIEW_T[2]))},
    # Close-ups look down into the operator-side cutaway, above the HMI's line of sight.
    'focus': {'screw': {'target': three((-.62, 0, AX)), 'position': three((-.62 + 1.2, -6.0, AX + 5.2)), 'zoom': 2.8},
              'mold': {'target': three((.40, 0, 1.10)), 'position': three((.40 + 3.0, -6.4, 1.10 + 4.4)), 'zoom': 2.8}},
    'spec': {'class': '1600 kN-class five-point double toggle (illustrative)', 'screw_d_m': D, 'screw_ld': LD,
             'compression_ratio_approx': round(H_FEED / H_METER, 2), 'tie_bar_clear_m': round(2 * (TIE_C - TIE_R), 3),
             'tie_bar_d_m': 2 * TIE_R, 'platen_m': round(2 * PLATEN_HALF, 3), 'opening_stroke_m': OPEN_STROKE,
             'mould_height_m': round(MOLD_B[1] - MOLD_A[0], 3), 'ejector_stroke_used_m': EJECT_STROKE,
             'injection_stroke_m': SCREW_STROKE, 'axis_height_m': AX, 'bed_height_m': BED,
             'heater_zones': [z for _, z in ZONES] + ['nozzle'],
             'sources': 'output/research/pha-equipment-realism-20261017/pack-a-answer-notes.md'},
}
rig['pha_machine'] = json.dumps(META, ensure_ascii=False)

# ----------------------------------------------------------------- render/export
sc.frame_set(int(5.5 * FPS))
kit.studio_world(.8, 'studio.exr')
kit.ortho_camera('Inspection camera', (VIEW_T[0] + 4.2, -7.6, VIEW_T[2] + 3.6), VIEW_T, 7.0)
kit.area_light('Key light', (-1.5, -4.0, 5.0), (0, 0, 1.0), 900, 4)
kit.area_light('Rim light', (3.5, 3.0, 4.0), (0, 0, 1.2), 450, 3, (.9, .95, 1))
kit.render_still(OUT / 'injection-motion-poster.png', 1280, 640, samples=64)
sc.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'injection-motion.blend'))
kit.export_glb(OUT / 'injection-motion.glb')
metadata = {'generator': 'Blender ' + bpy.app.version_string, 'fps': FPS, 'duration_seconds': CYCLE,
            'example_cycle_seconds': 30, 'sweep_seconds': SWEEP,
            'timing_basis': 'steady teaching cycle (30 s example compressed to 14 s); not production settings',
            'stage_starts': STAGE_STARTS, 'scene': sc.name, 'rig_controller': 'MachineControls',
            'library': 'scripts/pha_blender_kit.py',
            'stroke_basis': 'real-scale proportions in metres; (A) one public catalogue, (C) teaching judgement',
            'machine': META['spec'],
            'mechanisms': ['five-point double toggle (driver + damped-track links)', 'crosshead and clamp cylinder',
                           'screw rotation only while dosing; retraction against back pressure; separate decompression',
                           'sliding check ring (open while dosing, seated while filling)',
                           'axial injection and hold with cushion', 'nozzle touch and optional sprue break',
                           'mould opening/ejector/part drop through the base chute to a tote']}
(OUT / 'injection-motion.json').write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('INJECTION_MOTION_EXPORT_OK', flush=True)
