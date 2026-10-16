"""Real-scale continuous extrusion blow moulding (EBM) with a shuttle clamp (brand-neutral teaching model).

blender -b --factory-startup --python scripts/create_blowmolding_motion.py

Pack B EBM base (grade C teaching values; output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md):
- D40 30D extruder with the axis at 1500 mm, feeding a 180 x 220 mm parison head with a 25 mm annular outlet;
- the parison hangs freely and grows continuously;
- a clamp on a shuttle carriage closes a 180 x 220 x 200 mm mould around the parison (160 mm opening). A knife
  cuts the parison (80 mm travel), and the carriage shuttles 300 mm to the blow station, where the blow pin
  enters 50 mm;
- the bottle is 180 mm tall with a 65 mm body, carries top and bottom flash and is cut away on the operator side;
- take-out drops it onto a conveyor to the deflashing station.
The model follows the Pack B 12 s teaching timeline, re-based to start at the parison cut so every manual
control maps to a forward time range: cut and shuttle 0-0.5, pin in 0.5-1.0, inflate 1.0-1.5, hold and cool
1.5-6.5, exhaust 6.5-7.0, pin out and open 7.0-7.5, take-out 7.5-8.2, return 8.2-9.0, the next parison
9.0-11.5 and capture 11.5-12.0. The parison grows during the whole cycle. A dual-shuttle machine mirrors a
second clamp; it is not shown.
"""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import pha_blender_kit as kit  # noqa: E402
import create_line_models as lines  # noqa: E402

OUT = ROOT / 'assets/equipment'
TAU = math.tau
FPS = 24
LOOP = 12.0
FRAMES = round(LOOP * FPS)
TIMELINE = {'cut_shuttle': [0.0, 0.5], 'pin_in': [0.5, 1.0], 'inflate': [1.0, 1.5], 'hold_cool': [1.5, 6.5],
            'exhaust': [6.5, 7.0], 'pin_out_open': [7.0, 7.5], 'take_out': [7.5, 8.2], 'return': [8.2, 9.0],
            'parison': [9.0, 11.5], 'capture': [11.5, 12.0]}
ORIGINAL_OFFSET = 3.0                               # Pack B time = re-based time + 3.0 s (mod 12)

D, AX = .040, 1.50
X_E = 0.0
X_H = .35                                           # head axis
Z_HEAD_TOP = AX + .08
Z_OUT = Z_HEAD_TOP - .22 - .02                      # outlet below the 220 mm head body and the die bushing
PARISON_R, PARISON_L = .0125, .24
MOULD_TOP = Z_OUT - .025
MOULD_H, MOULD_W, MOULD_HALF = .20, .22, .09        # mould 180 (2 x 90) x 220 x 200
OPEN = .08                                          # each half: 160 mm total opening
SHUTTLE = .30                                       # carriage travel toward the operator (-Y)
BOTTLE_H, BODY_R, NECK_R = .18, .0325, .014
BOTTLE_TOP = MOULD_TOP
PIN_STROKE = .05
PIN_UP = MOULD_TOP + .055                           # pin tip retracted
CONVEYOR_Z = .80
STATION = Vector((X_H, -SHUTTLE, 0))


def smooth(t, a, b):
    if t <= a:
        return 0.0
    if t >= b:
        return 1.0
    f = (t - a) / (b - a)
    return f * f * (3 - 2 * f)


def bottle_radius(h):
    """Container profile (h from the base): body, shoulder, neck finish (outer radius)."""
    if h < .005:
        return BODY_R * (.75 + .25 * h / .005)
    if h < .125:
        return BODY_R
    if h < .160:
        f = (h - .125) / .035
        return BODY_R + (NECK_R - BODY_R) * (f * f * (3 - 2 * f))
    return NECK_R


kit.reset_scene('PHA extrusion blow moulding')
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 0, FRAMES
M = kit.palette()
M['bottle'] = kit.material('Polymer / bottle (translucent)', '#3E8C5A', 0, .18, alpha=.6)
M['flash'] = kit.material('Polymer / flash', '#2F6B45', 0, .4)
M['air'] = kit.material('Air / blow marker', '#8FC8E8', 0, .2, alpha=.7)

ext = kit.single_screw_extruder('Extruder', D, 30, X_E, AX, M, FRAMES, 12)   # 60 rpm teaching speed

# Head: 90 deg adapter into a 180 x 220 mm parison head with a 25 mm outlet
head = [kit.cylinder('Adapter', (.06, 0, AX), .045, .12, 'X', M['steel'], segments=32),
        kit.tube_path('Head feed pipe', [(.12, 0, AX), (X_H - .14, 0, AX), (X_H - .09, 0, AX)], .035, M['steel']),
        kit.cylinder('Parison head', (X_H, 0, Z_HEAD_TOP - .11), .09, .22, 'Z', M['steel'], segments=48),
        kit.cylinder('Die bushing', (X_H, 0, Z_OUT + .01), .03, .02, 'Z', M['steel_dark'], segments=32),
        kit.cylinder('Wall-thickness actuator', (X_H, 0, Z_HEAD_TOP + .06), .03, .12, 'Z', M['chrome']),
        kit.box('Head support', (X_H, .20, (Z_HEAD_TOP + ext['frame_top']) / 2), (.08, .08, Z_HEAD_TOP - ext['frame_top']), M['paint_dark'])]
for z in (Z_HEAD_TOP - .05, Z_HEAD_TOP - .12, Z_HEAD_TOP - .19):
    band = kit.ring('Head heater band', z - .02, z + .02, .091, .098, (0, 0), M['heater'], segments=48)
    band.rotation_euler.y, band.location = -math.pi / 2, (X_H, 0, 0)
    head.append(band)
kit.join(head, 'ParisonHead')

# Parison: hangs from the outlet; the owner sits at the outlet and scales along -Z
parison = kit.empty('ParisonLength', (X_H, 0, Z_OUT), group='parison')
tube = kit.ring('HollowParison', -PARISON_L, 0, PARISON_R - .002, PARISON_R, (0, 0), M['polymer'], segments=32)
tube.rotation_euler.y = -math.pi / 2                # local X (length) -> world -Z
tube.parent = parison
for frame in range(FRAMES + 1):                     # continuous growth, one parison length per cycle; cut at t = 0
    t = frame / FPS
    parison.scale = (1, 1, max(.001, t / LOOP)) if frame < FRAMES else (1, 1, 1)
    parison.keyframe_insert('scale', frame=frame)

# Shuttle carriage: base rails, carriage, clamp platens, cylinders and the two mould halves
base = [kit.box('Clamp base', (X_H, -SHUTTLE / 2, .35), (.80, SHUTTLE + .60, .70), M['paint_dark'], bevel=.008),
        kit.louvre_panel('Clamp base skirt', X_H - .38, X_H + .38, .08, .62, -SHUTTLE - .301, M, slots=4)]
for dx in (-.25, .25):
    base.append(kit.box('Shuttle rail', (X_H + dx, -SHUTTLE / 2, .72), (.04, SHUTTLE + .55, .04), M['steel']))
base += [kit.cylinder('Shuttle cylinder', (X_H, .26, .76), .03, .24, 'Y', M['paint_accent']),
         kit.cylinder('Shuttle cylinder rod', (X_H, .08, .76), .012, .14, 'Y', M['chrome'])]
kit.join(base, 'ClampBase')
carriage = kit.empty('ShuttleCarriage', (0, 0, 0), group='shuttle')
z_m = MOULD_TOP - MOULD_H / 2
frame_parts = [kit.box('Carriage plate', (X_H, 0, .76), (.62, .34, .03), M['paint'], bevel=.006)]
for side in (-1, 1):
    frame_parts.append(kit.box('Clamp end plate', (X_H + side * .27, 0, (z_m + .78) / 2 + .05), (.03, .30, z_m - .78 + .26), M['paint'], bevel=.006))
    frame_parts.extend(kit.hydraulic_cylinder('Clamp cylinder', (X_H + side * .30, 0, z_m), (X_H + side * .21, 0, z_m), .035, .016, M,
                                              rod_length=.05))
for dy in (-.12, .12):
    for dz in (-.07, .07):
        frame_parts.append(kit.cylinder('Clamp guide rod', (X_H, dy, z_m + dz), .008, .54, 'X', M['chrome'], segments=12))
carriage_body = kit.join(frame_parts, 'ShuttleCarriage_body')
kit.reparent(carriage_body, carriage)


def lathe(name, radius_of, heights, z0, center, mat, inner=None):
    """Closed lathe mesh around a vertical axis through ``center`` (x, y)."""
    bm = bmesh.new()
    rings = [[bm.verts.new((center[0] + radius_of(h) * math.cos(TAU * i / 40), center[1] + radius_of(h) * math.sin(TAU * i / 40), z0 + h))
              for i in range(40)] for h in heights]
    for r0, r1 in zip(rings, rings[1:]):
        for i in range(40):
            j = (i + 1) % 40
            bm.faces.new((r0[i], r0[j], r1[j], r1[i])).smooth = True
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return kit._finish(name, bm, mat)


heights = [BOTTLE_H * i / 36 for i in range(37)]
for side, name in ((-1, 'MoldLeft'), (1, 'MoldRight')):
    owner = kit.empty(name, (0, 0, 0), carriage, group='mold')
    x0, x1 = (X_H - MOULD_HALF, X_H) if side < 0 else (X_H, X_H + MOULD_HALF)
    half = kit.box(name + '_block', ((x0 + x1) / 2, 0, z_m), (MOULD_HALF - .001, MOULD_W, MOULD_H), M['cast'], bevel=.003)
    cavity = lathe(name + ' cavity', lambda h: bottle_radius(h) + .0008, heights, BOTTLE_TOP - BOTTLE_H, (X_H, 0), M['section'])
    front = kit.box('front cut', ((x0 + x1) / 2, -MOULD_W / 4 - .005, z_m), (MOULD_HALF + .01, MOULD_W / 2 + .01, MOULD_H + .02), M['section'], bevel=0)
    kit.subtract(half, [cavity, front])
    parts = [half, kit.box(name + ' platen', (X_H + side * (MOULD_HALF + .02), 0, z_m), (.03, .28, .26), M['steel_dark'], bevel=.004),
             kit.cylinder(name + ' water in', (X_H + side * (MOULD_HALF - .02), MOULD_W / 2 + .01, z_m - .05), .006, .02, 'Y', M['hose_blue']),
             kit.cylinder(name + ' water out', (X_H + side * (MOULD_HALF - .02), MOULD_W / 2 + .01, z_m + .05), .006, .02, 'Y', M['hose_red'])]
    kit.reparent(kit.join(parts, name + '_body'), owner)
    for frame in range(FRAMES + 1):
        t = frame / FPS
        opening = smooth(t, *TIMELINE['pin_out_open']) - smooth(t, *TIMELINE['capture'])
        owner.location.x = side * OPEN * opening
        owner.keyframe_insert('location', index=0, frame=frame)
for frame in range(FRAMES + 1):
    t = frame / FPS
    away = smooth(t, *TIMELINE['cut_shuttle']) - smooth(t, *TIMELINE['return'])
    carriage.location.y = -SHUTTLE * away
    carriage.keyframe_insert('location', index=1, frame=frame)

# Knife at the head cuts the parison between the outlet and the mould top at t = 0
knife = kit.empty('ParisonKnife', (X_H - .10, 0, (Z_OUT + MOULD_TOP) / 2), group='shuttle')
kit.join([kit.box('Knife blade', (.05, 0, 0), (.10, .03, .003), M['chrome'], bevel=0),
          kit.box('Knife arm', (-.03, 0, 0), (.08, .02, .015), M['steel_dark'])], 'ParisonKnife_body').parent = knife
for frame in range(FRAMES + 1):
    t = frame / FPS
    sweep = smooth(t, 0.0, .15) - smooth(t, .15, .40)
    knife.location.x = X_H - .10 + .08 * sweep
    knife.keyframe_insert('location', index=0, frame=frame)

# Blow station: pin unit above the station, 50 mm stroke into the neck
pin = kit.empty('BlowPin', (0, 0, 0), group='pin')
pin_parts = [kit.cylinder('BlowPinStem', (X_H, -SHUTTLE, PIN_UP + .06), .009, .12, 'Z', M['chrome'], segments=16),
             kit.cylinder('Blow pin calibrating sleeve', (X_H, -SHUTTLE, PIN_UP + .005), NECK_R - .001, .01, 'Z', M['steel'], segments=24)]
kit.reparent(kit.join(pin_parts, 'BlowPin_body'), pin)
for frame in range(FRAMES + 1):
    t = frame / FPS
    pin.location.z = -PIN_STROKE * (smooth(t, *TIMELINE['pin_in']) - smooth(t, 7.0, 7.25))
    pin.keyframe_insert('location', index=2, frame=frame)
station = [kit.box('Blow station bridge', (X_H, -SHUTTLE, PIN_UP + .22), (.40, .10, .04), M['paint'], bevel=.006),
           kit.cylinder('Pin cylinder', (X_H, -SHUTTLE, PIN_UP + .33), .025, .18, 'Z', M['paint_accent']),
           kit.hose('Blow air line', (X_H, -SHUTTLE - .03, PIN_UP + .13), (X_H + .45, -SHUTTLE - .2, PIN_UP + .3), .008, M['hose_blue'], sag=.05)]
for dx in (-.18, .18):
    station.append(kit.box('Blow station column', (X_H + dx, -SHUTTLE - .06, (PIN_UP + .22 + .70) / 2), (.04, .04, PIN_UP + .22 - .70), M['paint']))
kit.join(station, 'BlowStation')

# Formed bottle: rides in the mould; its shape key morphs the captured parison into the container
inflated = kit.empty('InflatedBody', (X_H, 0, BOTTLE_TOP - BOTTLE_H), carriage, group='inflate')
# Basis: the captured 25 mm parison over the bottle height; shape key "Inflated": the container profile.
bottle = lathe('FormedBottle', lambda h: PARISON_R, heights, 0, (0, 0), M['bottle'])
bottle.shape_key_add(name='Basis')
key = bottle.shape_key_add(name='Inflated')
for point in key.data:
    r = math.hypot(point.co.x, point.co.y)
    if r > 1e-6:
        scale = bottle_radius(point.co.z) / r
        point.co.x, point.co.y = point.co.x * scale, point.co.y * scale
bottle.parent = inflated
for name, z0, z1 in (('FlashTop', BOTTLE_H, BOTTLE_H + .02), ('FlashBottom', -.018, 0)):
    flash = kit.box(name, (0, 0, (z0 + z1) / 2), (.012, .03 if name == 'FlashBottom' else .02, z1 - z0), M['flash'], bevel=0)
    flash.parent = inflated
key = bottle.data.shape_keys.key_blocks['Inflated']
for frame in range(FRAMES + 1):
    t = frame / FPS
    key.value = smooth(t, *TIMELINE['inflate']) if t < TIMELINE['take_out'][0] else 1.0
    key.keyframe_insert('value', frame=frame)
    inflated.scale = (1, 1, 1) if t < TIMELINE['take_out'][0] else (.001, .001, .001)
    inflated.keyframe_insert('scale', frame=frame)
inflated['motion_group'] = 'inflate'
bottle['motion_group'] = 'inflate'

# Take-out: the bottle drops onto the conveyor and runs to the deflashing station
release_from = STATION + Vector((0, 0, BOTTLE_TOP - BOTTLE_H))
release_to = Vector((X_H, -SHUTTLE - .26, CONVEYOR_Z + .018))
release_end = Vector((X_H + .85, -SHUTTLE - .26, CONVEYOR_Z + .018))
released = kit.empty('ReleasedBottle', release_from, group='release')
copy = lathe('ReleasedBottleMesh', bottle_radius, heights, 0, (0, 0), M['bottle'])
copy.parent = released
for name, z0, z1 in (('ReleasedFlashTop', BOTTLE_H, BOTTLE_H + .02), ('ReleasedFlashBottom', -.018, 0)):
    kit.box(name, (0, 0, (z0 + z1) / 2), (.012, .02, z1 - z0), M['flash'], bevel=0).parent = released
for frame in range(FRAMES + 1):
    t = frame / FPS
    a, b = TIMELINE['take_out']
    if t < a:
        released.location, released.scale = release_from, (.001, .001, .001)
    elif t <= b:
        released.location, released.scale = release_from.lerp(release_to, smooth(t, a, b)), (1, 1, 1)
    else:
        f = min(1.0, (t - b) / (LOOP - .1 - b))
        released.location, released.scale = release_to.lerp(release_end, f), ((1, 1, 1) if t < LOOP - .1 else (.001, .001, .001))
    released.keyframe_insert('location', frame=frame)
    released.keyframe_insert('scale', frame=frame)
chute = kit.box('Take-out chute', (0, 0, 0), (.12, .12, .01), M['stainless'], bevel=0)
chute.location, chute.rotation_euler.x = (X_H, -SHUTTLE - .18, CONVEYOR_Z + .12), math.radians(35)
conveyor = [chute,
            kit.box('Conveyor belt', (X_H + .45, -SHUTTLE - .26, CONVEYOR_Z), (1.10, .16, .03), M['black'], bevel=.004),
            kit.box('Conveyor frame', (X_H + .45, -SHUTTLE - .26, CONVEYOR_Z - .04), (1.12, .20, .05), M['stainless']),
            kit.box('Deflashing station', (X_H + .90, -SHUTTLE - .26, CONVEYOR_Z + .16), (.22, .26, .30), M['paint'], bevel=.008),
            kit.box('Scrap chute', (X_H + .90, -SHUTTLE - .05, .45), (.16, .16, .50), M['stainless'], bevel=.004)]
for x in (X_H - .05, X_H + .95):
    conveyor.append(kit.box('Conveyor leg', (x, -SHUTTLE - .26, (CONVEYOR_Z - .065) / 2), (.04, .04, CONVEYOR_Z - .065), M['stainless']))
kit.join(conveyor, 'ConveyorAndDeflash')

# Blow air markers run down the pin into the bottle while inflating and holding
air_path = [Vector((X_H, -SHUTTLE, PIN_UP + .10)), Vector((X_H, -SHUTTLE, BOTTLE_TOP - .02)), Vector((X_H, -SHUTTLE, BOTTLE_TOP - .12))]
kit.ride('AirMarker', air_path, 5, kit.path_length(air_path) / 5, 6 * kit.path_length(air_path), M['air'], .006, FRAMES, group='air')
pellets = kit.catmull([(ext['throat_x'], 0, AX + .75), (ext['throat_x'], 0, AX + .35), (ext['throat_x'], 0, AX + .06)], 6)
kit.ride('FeedPellet', pellets, 8, kit.path_length(pellets) / 8, 2 * kit.path_length(pellets), M['pellet'], .005, FRAMES, 'pellet', group='flow')

kit.cabinet('Control cabinet', (ext['x_rear'] - .2, .45, 0), (ext['x_rear'] + .6, .85, 1.90), M)
kit.stack_light('Stack light', (ext['x_rear'] + .2, .65, 1.90), M)
kit.hmi_pedestal('Operator panel', (ext['x_rear'] + .3, -.70, 0), (ext['x_rear'] + .3, -.70, 1.42), M)
kit.bake_linear()


def three(v):
    """Blender Z-up -> glTF/three.js Y-up."""
    return [round(v[0], 6), round(v[2], 6), round(-v[1], 6)]


control = lines.control
centre = [(ext['x_rear'] + X_H + 1.1) / 2, 1.05, 0]
T = TIMELINE
META = {
    'id': 'blowmolding', 'duration': LOOP, 'frames': [0, FRAMES],
    'poster': 'assets/equipment/blowmolding-motion-poster.png', 'model': 'assets/equipment/blowmolding-motion.glb',
    'center': centre, 'span': [X_H + 1.3 - ext['x_rear'] + .3, 2.3], 'zoom': [.7, 14],
    'controls': [control('parison', '패리슨 토출 진행', 'Parison extrusion progress', 100, '%', [0, LOOP]),
                 control('mold', '금형 개방량', 'Mold opening', 100, '%', [LOOP, T['capture'][0]]),
                 control('pin', '블로우 핀 삽입량', 'Blow pin insertion', 100, '%', T['pin_in']),
                 control('inflate', '팽창 진행', 'Inflation progress', 100, '%', T['inflate'])],
    'initial': {'parison': 0, 'mold': 100, 'pin': 0, 'inflate': 0},
    'turns': {'screw': 12},
    'views': [{'key': 'all', 'label': ['전체 설비', 'Whole machine'], 'center': centre, 'zoom': 1},
              {'key': 'screw', 'label': ['스크류·배럴', 'Screw & barrel'], 'center': [-.6, AX, 0], 'zoom': 3.2},
              {'key': 'finish', 'label': ['금형·블로우 핀', 'Mold & blow pin'], 'center': three((X_H, -SHUTTLE / 2, z_m)), 'zoom': 4.5},
              {'key': 'head', 'label': ['패리슨 헤드', 'Parison head'], 'center': three((X_H, 0, Z_OUT)), 'zoom': 6}],
    'stages': [['절단·이송·블로우', 'Cut, shuttle & blow'], ['냉각', 'Cool'], ['배기·개방·취출', 'Exhaust, open & take out'],
               ['패리슨·금형 닫힘', 'Parison & capture']],
    # Player contract for the manual sequence: shuttle clip times at the head and at the blow station, the take-out
    # drop and the blow-air window (three.js coordinates).
    'blow': {'shuttle': {'head': round(T['parison'][0] + .5, 3), 'station': round(T['hold_cool'][0] + 1, 3)},
             'release': {'from': three(release_from), 'to': three(release_to)}, 'air': [T['inflate'][0], T['exhaust'][1]],
             'bottle': three(release_from)},
    'timeline': {key: value for key, value in T.items()}, 'timeline_offset_s': ORIGINAL_OFFSET,
    'teaching': {'time_scale': 1, 'cycle_s': LOOP, 'parison_mm': {'od': PARISON_R * 2000, 'length': PARISON_L * 1000},
                 'mould_mm': '180 x 220 x 200', 'opening_mm': OPEN * 2000, 'shuttle_mm': SHUTTLE * 1000, 'pin_stroke_mm': PIN_STROKE * 1000,
                 'knife_travel_mm': 80, 'bottle_mm': {'height': BOTTLE_H * 1000, 'body_d': BODY_R * 2000, 'neck_d': NECK_R * 2000},
                 'loop_note': 'Pack B 12 s teaching timeline re-based at the parison cut (Pack B time = model time + 3 s).'},
    'spec': {'basis': 'Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA blow-moulding setting',
             'screw_d_mm': 40, 'l_d': 30, 'extruder_axis_mm': 1500, 'head_mm': '180 x 220', 'outlet_mm': 25,
             'container': '180 mm tall, 65 mm body', 'mould_mm': '180 x 220 x 200', 'opening_mm': 160, 'shuttle_mm': 300,
             'blow_pin_stroke_mm': 50, 'knife_travel_mm': 80, 'flash': 'separate top and bottom flash on the bottle',
             'variants_not_shown': 'dual shuttle (mirrored second clamp), accumulator head, rotary wheel',
             'sources': 'output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md'},
}

floor = kit.floor('Floor', ext['x_rear'] - .3, X_H + 1.3, -.95, 1.0, M)
kit.studio_world(.8, 'studio.exr')
sc.frame_set(round(3.0 * FPS))
bpy.context.view_layer.update()
camera = kit.ortho_camera('Line camera', (centre[0] + 4, -9, 5), (centre[0], 0, 1.0), 6)
orientation = camera.rotation_euler.to_matrix()
right, up = orientation.col[0], orientation.col[1]
corners = [obj.matrix_world @ Vector(c) for obj in sc.objects if obj.type == 'MESH' and obj is not floor for c in obj.bound_box]
xs, ys = [p.dot(right) for p in corners], [p.dot(up) for p in corners]
camera.location += right * ((min(xs) + max(xs)) / 2 - camera.location.dot(right)) + up * ((min(ys) + max(ys)) / 2 - camera.location.dot(up))
camera.data.ortho_scale = max(max(xs) - min(xs), (max(ys) - min(ys)) * 16 / 9) * 1.06
kit.area_light('Key light', (centre[0] - 2, -4.5, 5.5), (centre[0], 0, 1.0), 1300, 5)
kit.area_light('Rim light', (centre[0] + 2, 3.5, 4.5), (centre[0], 0, 1.0), 550, 4, (.9, .95, 1))
kit.render_still(OUT / 'blowmolding-motion-poster.png', 1280, 720, samples=48)
for obj in [floor, camera] + [o for o in sc.objects if o.type == 'LIGHT']:
    bpy.data.objects.remove(obj, do_unlink=True)
sc.frame_set(0)
sc['motion_scope'] = 'Teaching rig; Pack B teaching dimensions and 12 s timeline, no OEM drawing or PHA blow-moulding setting.'
sc['motion_controls'] = json.dumps(META['controls'], ensure_ascii=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'blowmolding-motion.blend'), compress=True)
kit.export_glb(OUT / 'blowmolding-motion.glb')
META['blender'] = bpy.app.version_string
META['groups'] = sorted({obj.get('motion_group') for obj in sc.objects if obj.get('motion_group')})
(OUT / 'blowmolding-motion.json').write_text(json.dumps(META, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines.write_manifest()
print('BLOWMOLDING_EXPORT_OK', flush=True)
