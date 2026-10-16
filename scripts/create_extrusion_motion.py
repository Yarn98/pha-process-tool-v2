"""Real-scale single-screw profile extrusion line (brand-neutral teaching model).

blender -b --factory-startup --python scripts/create_extrusion_motion.py

Pack B single-screw base (grade C teaching values, output/research/pha-equipment-realism-20261017/
pack-b-answer-notes.md):
- D45 screw over 30D with 5 heating zones; the shaft is 1000 mm high, with a 135 mm (3D) adapter;
- a tube profile die feeding a 2.5 m vacuum calibration and cooling bath;
- a belt haul-off with 500 mm contact and 100 mm wide belts;
- a flying saw (200 mm travel, 500 mm cut length) and a 1.5 m run-out table.
The model runs in real time: 3 m/min line speed (6 cuts/min, one cut per 10 s loop) and a 60 rpm teaching
screw speed.
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
LINE_SPEED = 3.0                     # m/min
CUT = .5                             # cut length, m
LOOP = CUT / (LINE_SPEED / 60)       # 10 s: one cut per loop
FRAMES = round(LOOP * FPS)
PULLEY_D = 80.0                      # haul-off belt pulley, mm
RPM = {'screw': 60.0, 'haul': 1000 * LINE_SPEED / (math.pi * PULLEY_D), 'cutter': LINE_SPEED / CUT}
TURNS = {'screw': 10, 'haul': 2, 'cutter': 1}        # whole turns (cutter: saw cycles) per loop
for _key, _turns in TURNS.items():
    _exact = RPM[_key] * LOOP / 60
    assert abs(_turns - _exact) / _exact < .006, (_key, _exact)

D = .045
AX = 1.00
PROFILE_R = .016                     # 32 mm tube
ADAPTER = (0.0, .135)
DIE = (.135, .335)
BATH = (.45, 2.95)
WATER = AX + .01                     # spray/immersion level just above the profile axis
HAUL = (3.20, 3.70)                  # belt contact length 500 mm
PULLEY_R = PULLEY_D / 2000
SAW_X0, SAW_TRAVEL = 4.00, .20
RUNOUT = (4.45, 5.95)
SAW_START = 0.0                      # the clamp closes and the carriage travels at the start of the loop


kit.reset_scene('PHA profile extrusion line')
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 0, FRAMES
M = kit.palette()
M['water'] = kit.material('Water / calibration bath', '#5E9EA6', 0, .05, alpha=.3)
M['belt'] = kit.material('Rubber / haul-off belt', '#2B2D2F', 0, .75)

ext = kit.single_screw_extruder('Extruder', D, 30, ADAPTER[0], AX, M, FRAMES, TURNS['screw'])

# Adapter with a slide-plate screen changer and melt sensors, then the tube die
head = [kit.cylinder('Adapter', ((ADAPTER[0] + ADAPTER[1]) / 2, 0, AX), .055, ADAPTER[1] - ADAPTER[0], 'X', M['steel'], segments=40),
        kit.heater_band('Adapter heater', .03, .056, .04, M['heater'], M['ceramic'], (0, AX)),
        kit.box('Screen changer plate', (.095, 0, AX), (.035, .30, .13), M['steel_dark'], bevel=.004),
        kit.box('Screen changer block', (.095, -.20, AX), (.05, .10, .14), M['paint'], bevel=.006),
        kit.cylinder('Screen changer cylinder', (.095, -.32, AX), .025, .16, 'Y', M['chrome']),
        kit.cylinder('Melt pressure sensor', (.06, 0, AX + .085), .006, .06, 'Z', M['stainless']),
        kit.cylinder('Melt pressure head', (.06, 0, AX + .125), .014, .03, 'Z', M['stainless']),
        kit.cylinder('Melt temperature probe', (.12, 0, AX + .08), .004, .05, 'Z', M['copper']),
        kit.cylinder('Tube die body', ((DIE[0] + DIE[1]) / 2, 0, AX), .06, DIE[1] - DIE[0], 'X', M['steel'], segments=40),
        kit.cylinder('Tube die tip', (DIE[1] + .01, 0, AX), .03, .02, 'X', M['steel_dark'], radius2=.02),
        kit.box('Die support', ((DIE[0] + DIE[1]) / 2, 0, (ext['frame_top'] + AX - .06) / 2 - .1),
                (.06, .10, AX - .06 - ext['frame_top'] + .2), M['paint_dark'])]
for x in (DIE[0] + .05, DIE[0] + .13):
    head.append(kit.heater_band('Die heater', x, .061, .05, M['heater'], M['ceramic'], (0, AX)))
for i in range(6):
    a = TAU * i / 6
    head.append(kit.cap_screw('Die centring bolt', (DIE[1] - .02, .045 * math.cos(a), AX + .045 * math.sin(a)), 'X', .008, 1, M['steel']))
kit.join(head, 'AdapterAndDie')

# Vacuum calibration and cooling bath (stainless, lid with windows)
bath = [kit.box('Bath tank', ((BATH[0] + BATH[1]) / 2, 0, AX - .05), (BATH[1] - BATH[0], .30, .002), M['stainless'], bevel=0)]
for y in (-.151, .151):
    bath.append(kit.box('Bath wall', ((BATH[0] + BATH[1]) / 2, y, AX), (BATH[1] - BATH[0], .002, .10), M['stainless'], bevel=0))
for x in BATH:
    bath.append(kit.box('Bath end', (x, 0, AX), (.004, .30, .10), M['stainless'], bevel=0))
bath += [kit.box('Bath water', ((BATH[0] + BATH[1]) / 2, 0, (AX - .049 + WATER) / 2), (BATH[1] - BATH[0] - .01, .296, WATER - AX + .049),
                 M['water'], bevel=0),
         kit.box('Bath lid', ((BATH[0] + BATH[1]) / 2, .08, AX + .056), (BATH[1] - BATH[0], .14, .004), M['stainless'], bevel=0),
         kit.box('Bath lid window', ((BATH[0] + BATH[1]) / 2, -.07, AX + .056), (BATH[1] - BATH[0], .16, .004), M['glass'], bevel=0),
         kit.cylinder('Calibrator sleeve', (BATH[0] + .10, 0, AX), PROFILE_R + .006, .18, 'X', M['brass'], segments=32),
         kit.box('Bath frame', ((BATH[0] + BATH[1]) / 2, 0, AX - .07), (BATH[1] - BATH[0] + .04, .34, .03), M['paint_dark']),
         kit.box('Vacuum pump', (1.2, .32, .25), (.30, .24, .30), M['paint_accent'], bevel=.01),
         kit.box('Water tank', (2.2, .32, .25), (.50, .24, .40), M['stainless'], bevel=.006),
         kit.hose('Vacuum hose', (1.2, .20, .40), (1.0, .15, AX - .04), .015, M['rubber'], sag=.05),
         kit.hose('Water return', (2.2, .20, .45), (2.4, .15, AX - .06), .015, M['hose_blue'], sag=.05)]
for x in (BATH[0] + .1, (BATH[0] + BATH[1]) / 2, BATH[1] - .1):
    for y in (-.14, .14):
        bath.append(kit.box('Bath leg', (x, y, (AX - .085) / 2), (.04, .04, AX - .085), M['paint_dark']))
for x in [BATH[0] + .3 + .4 * i for i in range(6)]:
    bath.append(kit.cylinder('Spray nozzle', (x, 0, AX + .04), .006, .02, 'Z', M['brass']))
kit.join(bath, 'CalibrationBath')

# Belt haul-off: two motor-driven belts squeeze the profile over the 500 mm contact length
haul = [kit.box('Haul-off frame', ((HAUL[0] + HAUL[1]) / 2, .02, AX - .32), (.80, .44, .04), M['paint_dark']),
        kit.box('Haul-off housing', ((HAUL[0] + HAUL[1]) / 2, .19, AX), (.80, .02, .55), M['paint'], bevel=.006),
        kit.box('Haul-off cover', ((HAUL[0] + HAUL[1]) / 2, .02, AX + .29), (.80, .38, .02), M['paint'], bevel=.006),
        kit.guard_panel('Haul-off guard', HAUL[0] - .1, HAUL[1] + .1, AX - .25, AX + .27, -.15, M, handle=True),
        kit.box('Haul-off gearmotor', (HAUL[1] - .05, .30, AX), (.14, .18, .14), M['paint_accent'], bevel=.008),
        kit.cylinder('Belt pressure cylinder', ((HAUL[0] + HAUL[1]) / 2, 0, AX + .21), .02, .10, 'Z', M['chrome'])]
for x in (HAUL[0] + .05, HAUL[1] - .05):
    for y in (-.13, .13):
        haul.append(kit.box('Haul-off leg', (x, y, (AX - .34) / 2), (.04, .04, AX - .34), M['paint_dark']))
kit.join(haul, 'HaulOffFrame')
for side, z in (('Lower', AX - PROFILE_R - PULLEY_R - .004), ('Upper', AX + PROFILE_R + PULLEY_R + .004)):
    kit.join([kit.box('Belt %s top run' % side, ((HAUL[0] + HAUL[1]) / 2, 0, z + PULLEY_R + .002), (HAUL[1] - HAUL[0], .10, .004), M['belt'], bevel=0),
              kit.box('Belt %s bottom run' % side, ((HAUL[0] + HAUL[1]) / 2, 0, z - PULLEY_R - .002), (HAUL[1] - HAUL[0], .10, .004), M['belt'], bevel=0)],
             'Belt' + side)
    # Lower belt: its top run moves +X (positive turn about +Y); upper belt: its bottom run moves +X.
    sign = 1 if side == 'Lower' else -1
    for x, end in ((HAUL[0], 'In'), (HAUL[1], 'Out')):
        owner = kit.empty('BeltPulley%s%s' % (side, end), (x, 0, z), group='haul')
        owner.rotation_euler.z = math.pi / 2
        parts = [kit.cylinder('Pulley body', (0, 0, 0), PULLEY_R, .11, 'X', M['steel'], segments=32),
                 kit.box('Pulley mark', (0, 0, PULLEY_R * .7), (.112, .012, .012), M['warning'], bevel=0)]
        kit.join(parts, 'BeltPulley%s%s_body' % (side, end)).parent = owner
        kit.spin(owner, 'haul', TURNS['haul'], FRAMES, sign=sign)
# Belt cleats ride the loop at line speed (seamless: 0.5 m per loop, 50 mm pitch)
for side, z in (('Lower', AX - PROFILE_R - PULLEY_R - .004), ('Upper', AX + PROFILE_R + PULLEY_R + .004)):
    r = PULLEY_R + .004
    inner = 1 if side == 'Lower' else -1       # the run that touches the profile
    loop = [Vector((HAUL[0] + (HAUL[1] - HAUL[0]) * i / 20, -.052, z + inner * r)) for i in range(21)]
    loop += [Vector((HAUL[1] + r * math.sin(a), -.052, z + inner * r * math.cos(a))) for a in [math.pi * i / 10 for i in range(1, 10)]]
    loop += [Vector((HAUL[1] - (HAUL[1] - HAUL[0]) * i / 20, -.052, z - inner * r)) for i in range(21)]
    loop += [Vector((HAUL[0] - r * math.sin(a), -.052, z - inner * r * math.cos(a))) for a in [math.pi * i / 10 for i in range(1, 11)]]
    # 50 mm cleat pitch divides the 0.5 m advanced per loop, so the loop is seamless; the < 50 mm remainder
    # of the belt length is the hidden gap of ride().
    kit.ride('BeltCleat' + side, loop, math.ceil(kit.path_length(loop) / .05), .05, CUT, M['warning'], .004, FRAMES, group='haul')

# Flying saw: the carriage clamps the profile, travels 200 mm with it while the blade plunges, then returns.
saw = kit.empty('SawCarriage', (SAW_X0, 0, AX), group='cutter')
# The blade disc lies in the cut plane (normal +X) beside the profile and plunges across it in -Y.
carriage = [kit.box('Saw carriage plate', (0, 0, -.12), (.16, .30, .02), M['steel_dark']),
            kit.box('Saw clamp', (0, 0, PROFILE_R + .01), (.05, .06, .02), M['steel'], bevel=.003),
            kit.box('Saw motor', (.10, .16, 0), (.14, .12, .12), M['paint_accent'], bevel=.008),
            kit.box('Saw blade guard', (.035, .16, .05), (.012, .26, .16), M['warning'], bevel=.003)]
kit.join(carriage, 'SawCarriage_body').parent = saw
blade = kit.empty('SawBlade', (.02, .12, 0), saw)
blade_parts = [kit.cylinder('Saw disc', (0, 0, 0), .10, .003, 'X', M['chrome'], segments=48)]
for k in range(24):
    tooth = kit.box('Saw tooth', (0, 0, .101), (.004, .004, .006), M['steel_dark'], bevel=0)
    tooth.rotation_euler.x = TAU * k / 24
    blade_parts.append(tooth)
kit.join(blade_parts, 'SawBlade_body').parent = blade
travel_frames = round(SAW_TRAVEL / (LINE_SPEED / 60) * FPS)          # 4 s with the profile
start = round(SAW_START * FRAMES)
for frame in range(FRAMES + 1):
    if frame < start:
        x = 0.0
        plunge = 0.0
    elif frame <= start + travel_frames:
        f = (frame - start) / travel_frames
        x = SAW_TRAVEL * f
        plunge = math.sin(math.pi * f)
    else:
        f = (frame - start - travel_frames) / (FRAMES - start - travel_frames)
        x = SAW_TRAVEL * (1 - (3 * f * f - 2 * f ** 3))
        plunge = 0.0
    saw.location = (SAW_X0 + x, 0, AX)
    saw.keyframe_insert('location', frame=frame)
    blade.location = (.02, .12 - .04 * plunge, 0)      # rim from y=+.02 (clear) to -.02 (through the tube)
    blade.keyframe_insert('location', frame=frame)
    blade.rotation_euler.x = -TAU * 20 * frame / FRAMES
    blade.keyframe_insert('rotation_euler', index=0, frame=frame)
saw['cut_frame'] = start + travel_frames // 2
saw_base = [kit.box('Saw rail', (SAW_X0 + .1, 0, AX - .15), (.50, .30, .02), M['steel']),
            kit.box('Saw base', (SAW_X0 + .1, 0, (AX - .16) / 2), (.40, .30, AX - .16), M['paint'], bevel=.008)]
kit.join(saw_base, 'SawBase')

# Profile: continuous from the die to the saw; cut pieces ride the run-out table and tip into the tray.
profile_end = SAW_X0 + SAW_TRAVEL / 2
kit.cylinder('Profile', ((DIE[1] + profile_end) / 2 + .01, 0, AX), PROFILE_R, profile_end - DIE[1] - .02, 'X', M['polymer'], segments=32)
runout = [kit.box('Run-out table', ((RUNOUT[0] + RUNOUT[1]) / 2, 0, AX - PROFILE_R - .02), (RUNOUT[1] - RUNOUT[0], .20, .02), M['stainless']),
          kit.box('Run-out tray', (RUNOUT[1] - .4, -.32, .45), (.80, .30, .25), M['paint_dark'])]
for x in (RUNOUT[0] + .1, RUNOUT[1] - .1):
    for y in (-.08, .08):
        runout.append(kit.box('Run-out leg', (x, y, (AX - PROFILE_R - .03) / 2), (.04, .04, AX - PROFILE_R - .03), M['paint_dark']))
for i in range(5):
    runout.append(kit.cylinder('Run-out roller', (RUNOUT[0] + .15 + .3 * i, 0, AX - PROFILE_R - .006), .012, .16, 'Y', M['steel']))
kit.join(runout, 'RunOutTable')
# The profile moves at line speed; downstream of the cut position it is a chain of 0.5 m pieces. Each piece is
# placed so that a piece's rear end reaches the cut position exactly when the saw cuts (mid travel).
cut_fraction = SAW_START + .5 * travel_frames / FRAMES
start_x = profile_end + CUT / 2 - CUT * cut_fraction
piece_path = [Vector((start_x, 0, AX)), Vector((RUNOUT[1] - .05, 0, AX)), Vector((RUNOUT[1] - .25, -.30, .62))]
length = kit.path_length(piece_path)
pieces = math.ceil(length / CUT) + 1
for i in range(pieces):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=PROFILE_R, depth=CUT - .004, rotation=(0, math.pi / 2, 0))
    piece = bpy.context.object
    piece.name = 'CutPiece%02d' % i
    piece.data.materials.append(M['polymer'])
    piece['motion_group'] = 'flow'
    for frame in range(FRAMES + 1):
        s = (i * CUT + CUT * frame / FRAMES) % (pieces * CUT)
        piece.location = kit.point_at(piece_path, min(s, length))
        piece.scale = (1, 1, 1) if s <= length else (.001, .001, .001)
        piece.keyframe_insert('location', frame=frame)
        piece.keyframe_insert('scale', frame=frame)
# Flow markers: pellets into the throat, melt along the screw channel, surface marks on the profile
feed = kit.catmull([(ext['throat_x'], 0, AX + .75), (ext['throat_x'], 0, AX + .35), (ext['throat_x'], 0, AX + .06)], 6)
kit.ride('FeedPellet', feed, 8, kit.path_length(feed) / 8, 2 * kit.path_length(feed), M['pellet'], .005, FRAMES, 'pellet')
melt = [Vector((ext['throat_x'], 0, AX + D * .42)), Vector((ADAPTER[0] - .01, 0, AX + D * .42))]
kit.ride('MeltMarker', melt, 12, kit.path_length(melt) / 12, 2 * kit.path_length(melt) / 12, M['polymer_marker'], .006, FRAMES)
surface = [Vector((DIE[1] + .03, -PROFILE_R - .001, AX)), Vector((profile_end - .02, -PROFILE_R - .001, AX))]
count = math.ceil(kit.path_length(surface) / CUT)
kit.ride('ProfileMark', surface, count, CUT, CUT, M['polymer_marker'], .005, FRAMES)

# Operator station and cabinet
kit.cabinet('Control cabinet', (ext['x_rear'] - .2, .45, 0), (ext['x_rear'] + .6, .85, 1.90), M)
kit.stack_light('Stack light', (ext['x_rear'] + .2, .65, 1.90), M)
kit.hmi_pedestal('Operator panel', (ext['x_rear'] + .3, -.70, 0), (ext['x_rear'] + .3, -.70, 1.42), M)

kit.bake_linear()
sc.timeline_markers.new('Saw clamps and travels with the profile', frame=start)

control = lines.control
centre = [(ext['x_rear'] + RUNOUT[1]) / 2, .95, 0]
META = {
    'id': 'extrusion', 'duration': LOOP, 'frames': [0, FRAMES],
    'poster': 'assets/equipment/extrusion-motion-poster.png', 'model': 'assets/equipment/extrusion-motion.glb',
    'center': centre, 'span': [RUNOUT[1] - ext['x_rear'] + .6, 2.4], 'zoom': [.7, 12],
    'controls': [control('screw', '스크류 회전각', 'Screw rotation angle', time_range=[0, LOOP]),
                 control('flow', '수지 표시 위치', 'Resin marker position', 100, '%', [0, LOOP]),
                 control('haul', '벨트 인취 풀리 회전각', 'Belt haul-off pulley angle', time_range=[0, LOOP]),
                 control('cutter', '플라잉 톱 사이클 위치', 'Flying saw cycle position', 360, time_range=[0, LOOP])],
    'views': [{'key': 'all', 'label': ['전체 라인', 'Whole line'], 'center': centre, 'zoom': 1},
              {'key': 'screw', 'label': ['스크류·배럴', 'Screw & barrel'], 'center': [-.7, AX, 0], 'zoom': 3.2},
              {'key': 'finish', 'label': ['인취·절단', 'Haul-off & saw'], 'center': [3.9, .95, 0], 'zoom': 3.0},
              {'key': 'die', 'label': ['다이·교정조', 'Die & calibration'], 'center': [.4, AX, 0], 'zoom': 5}],
    'stages': [['공급·용융', 'Feed & melt'], ['다이·교정', 'Die & calibration'], ['냉각·인취', 'Cool & haul off'],
               ['절단·배출', 'Cut & discharge']],
    'turns': TURNS, 'cut_edges': 1,
    'study': {'rpm': RPM['screw'], 'speed': LINE_SPEED, 'diameter': PULLEY_D, 'pitch': CUT * 1000},
    'teaching': {'time_scale': 1, 'rpm': {key: round(value, 3) for key, value in RPM.items()}, 'line_speed_m_min': LINE_SPEED,
                 'cut_length_mm': CUT * 1000, 'pulley_mm': PULLEY_D,
                 'loop_note': 'Real time: one cut per 10 s loop; the pulleys turn a whole number of times per loop (within 0.6 %).'},
    'spec': {'basis': 'Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting',
             'screw_d_mm': 45, 'l_d': 30, 'heating_zones': 5, 'shaft_height_mm': 1000, 'adapter_mm': 135,
             'profile': 'tube 32 mm OD', 'bath_m': 2.5, 'haul_off_contact_mm': 500, 'belt_width_mm': 100,
             'saw_travel_mm': SAW_TRAVEL * 1000, 'cut_length_mm': CUT * 1000, 'run_out_mm': 1500,
             'sources': 'output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md'},
}

floor = kit.floor('Floor', ext['x_rear'] - .3, RUNOUT[1] + .2, -.9, 1.0, M)
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
kit.render_still(OUT / 'extrusion-motion-poster.png', 1280, 720, samples=48)
for obj in [floor, camera] + [o for o in sc.objects if o.type == 'LIGHT']:
    bpy.data.objects.remove(obj, do_unlink=True)
sc.frame_set(0)
sc['motion_scope'] = 'Teaching rig; Pack B teaching dimensions, no OEM drawing, process setpoint or calibration design.'
sc['motion_controls'] = json.dumps(META['controls'], ensure_ascii=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'extrusion-motion.blend'), compress=True)
kit.export_glb(OUT / 'extrusion-motion.glb')
META['blender'] = bpy.app.version_string
META['groups'] = sorted({obj.get('motion_group') for obj in sc.objects if obj.get('motion_group')})
(OUT / 'extrusion-motion.json').write_text(json.dumps(META, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines.write_manifest()
print('EXTRUSION_EXPORT_OK', flush=True)
