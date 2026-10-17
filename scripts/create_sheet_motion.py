"""Real-scale flat-sheet extrusion line (brand-neutral teaching model).

blender -b --factory-startup --python scripts/create_sheet_motion.py

Pack B sheet base (grade C teaching values; output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md):
- D45 30D extruder feeding a 500 x 160 x 120 mm coat-hanger flat die (1 mm lip gap example);
- a 3-roll stack of 250 mm rolls with a 600 mm face, mounted in a rigid frame with gap adjusters on both
  sides and rotary unions (separate supply and return);
- the web runs as an S through the stack (top-middle nip, round the middle roll, middle-bottom nip, round
  the bottom roll), then over a 2 m roller table (80 mm rolls at 200 mm pitch);
- two 15 mm edge-trim knives, 120 mm haul-off rolls and a winder on a 76 mm core (shown at 250 mm; the rpm
  falls as the roll grows to 500 mm).
The model runs in real time at a 3 m/min line speed. Every roll turns at the same surface speed,
n = 1000 v / (pi d), and the 250 mm stack rolls turn exactly once per loop.
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
import create_line_models as lines  # noqa: E402

OUT = ROOT / 'assets/equipment'
FPS = 24
LINE_SPEED = 3.0                                  # m/min
V = LINE_SPEED / 60                               # m/s
STACK_D, TABLE_D, HAUL_D, WOUND_D, CORE_D = 250.0, 80.0, 120.0, 250.0, 76.0
FRAMES = round(math.pi * STACK_D / 1000 / V * FPS)
LOOP = FRAMES / FPS                               # one stack-roll turn
TRAVEL = V * LOOP                                 # web advance per loop
turns_of = lambda d_mm: TRAVEL / (math.pi * d_mm / 1000)
TURNS = {'roll': 1, 'winder': 1, 'screw': 10}
assert abs(turns_of(STACK_D) - 1) < .002 and abs(turns_of(WOUND_D) - 1) < .002
RPM = {'stack': 1000 * LINE_SPEED / (math.pi * STACK_D), 'table': 1000 * LINE_SPEED / (math.pi * TABLE_D),
       'haul': 1000 * LINE_SPEED / (math.pi * HAUL_D), 'winder_at_250': 1000 * LINE_SPEED / (math.pi * WOUND_D),
       'winder_at_500': 1000 * LINE_SPEED / (math.pi * 500), 'screw': TURNS['screw'] / LOOP * 60}

D, AX = .045, 1.00
T = .001                                          # sheet thickness (lip gap example)
WIDTH, TRIMMED = .48, .45                         # 500 mm die, neck-in; 15 mm trimmed each side
FACE = .60
R = STACK_D / 2000
X_E = 0.0                                         # extruder barrel flange
X_DIE = .25                                       # flat die inlet face
X_S = X_DIE + .16 + .024 + .10                    # stack axis: lip exit 100 mm before the nip line
Z_T, Z_M = AX + R + T / 2, AX - R - T / 2
Z_B = Z_M - 2 * R - T
Z_SHEET = Z_B - R - T / 2                         # web level after the bottom roll
TABLE = [X_S + .40 + .2 * k for k in range(10)]
X_TRIM, X_HAUL = X_S + 2.45, X_S + 2.70
WR = WOUND_D / 2000
X_WIND = X_S + 3.25

kit.reset_scene('PHA sheet line')
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 0, FRAMES
M = kit.palette()
M['sheet'] = kit.material('Polymer / sheet (translucent)', '#3E8C5A', 0, .25, alpha=.75)
M['core'] = kit.material('Paper / winder core', '#B89A6A', 0, .85)

ext = kit.single_screw_extruder('Extruder', D, 30, X_E, AX, M, FRAMES, TURNS['screw'])
head = [kit.cylinder('Adapter', (.068, 0, AX), .055, .135, 'X', M['steel'], segments=40),
        kit.heater_band('Adapter heater', .03, .056, .04, M['heater'], M['ceramic'], (0, AX)),
        kit.box('Screen changer plate', (.10, 0, AX), (.035, .30, .13), M['steel_dark'], bevel=.004),
        kit.cylinder('Screen changer cylinder', (.10, -.30, AX), .025, .16, 'Y', M['chrome']),
        kit.cylinder('Melt pressure sensor', (.06, 0, AX + .085), .006, .06, 'Z', M['stainless']),
        kit.cylinder('Feed pipe', (.20, 0, AX), .045, .10, 'X', M['steel'], segments=32),
        kit.box('Die support', (X_DIE + .08, 0, (ext['frame_top'] + AX - .06) / 2 - .1), (.10, .30, AX - .06 - ext['frame_top'] + .2),
                M['paint_dark'])]
kit.join(head, 'AdapterAndFeedPipe')
lip = kit.flat_die('Flat die', X_DIE, .50, .16, .12, AX, M)

# 3-roll stack: frame, gap adjusters and rolls (all on one stack carriage)
frame = []
for side in (-1, 1):
    y = side * (FACE / 2 + .17)
    # Rear side frame is a plate; the operator side uses two posts so the rolls and the die stay visible.
    frame += ([kit.box('Stack side frame', (X_S, y, (Z_T + R + .12) / 2), (.48, .05, Z_T + R + .12), M['paint'], bevel=.008)] if side > 0 else
              [kit.box('Stack front post', (X_S + dx, y, (Z_T + R + .12) / 2), (.07, .05, Z_T + R + .12), M['paint'], bevel=.006)
               for dx in (-.20, .20)])
    frame += [
              kit.hydraulic_cylinder('Top gap adjuster', (X_S - .32, y, Z_T), (X_S - .14, y, Z_T), .03, .014, M)[0],
              kit.hydraulic_cylinder('Bottom gap adjuster', (X_S - .32, y, Z_B), (X_S - .14, y, Z_B), .03, .014, M)[0],
              kit.box('Stack rail', (X_S, y, .02), (.90, .06, .04), M['steel'])]
frame.append(kit.box('Stack crossbeam', (X_S + .2, 0, Z_T + R + .12), (.08, FACE + .40, .08), M['paint']))
frame.append(kit.box('Stack drive', (X_S, FACE / 2 + .40, Z_M), (.30, .20, .30), M['paint_accent'], bevel=.01))
kit.join(frame, 'StackFrame')
kit.roll('TopRoll', X_S, Z_T, R, FACE, M, 'roll', 1, FRAMES, -1)       # bottom surface moves +X at the first nip
kit.roll('MiddleRoll', X_S, Z_M, R, FACE, M, 'roll', 1, FRAMES, 1)     # the web wraps its +X side, moving down
kit.roll('BottomRoll', X_S, Z_B, R, FACE, M, 'roll', 1, FRAMES, -1)    # the web wraps its -X side, leaving along +X

# Roller table, edge trim, haul-off and winder
for k, x in enumerate(TABLE):
    kit.roll('TableRoll%02d' % k, x, Z_SHEET - T / 2 - TABLE_D / 2000, TABLE_D / 2000, .56, M, 'roll', turns_of(TABLE_D), FRAMES, 1,
             mat=M['steel'], marks=0, joint=False)
table = [kit.box('Roller table rail', ((TABLE[0] + TABLE[-1]) / 2, side * .36, Z_SHEET - .05), (TABLE[-1] - TABLE[0] + .2, .04, .08), M['paint'])
         for side in (-1, 1)]
for x in (TABLE[0], TABLE[-1]):
    for side in (-1, 1):
        table.append(kit.box('Roller table leg', (x, side * .36, (Z_SHEET - .09) / 2), (.05, .05, Z_SHEET - .09), M['paint_dark']))
trim = [kit.box('Trim knife holder', (X_TRIM, side * TRIMMED / 2, Z_SHEET + .08), (.06, .04, .12), M['steel_dark']) for side in (-1, 1)]
trim += [kit.cylinder('Trim knife', (X_TRIM, side * TRIMMED / 2, Z_SHEET + .02), .03, .002, 'Y', M['chrome']) for side in (-1, 1)]
trim += [kit.cylinder('Trim duct', (X_TRIM + .25, side * .30, .30), .05, .40, 'Z', M['stainless']) for side in (-1, 1)]
kit.join(table + trim, 'RollerTableAndTrim')
kit.roll('HaulRollLower', X_HAUL, Z_SHEET - T / 2 - HAUL_D / 2000, HAUL_D / 2000, .56, M, 'roll', turns_of(HAUL_D), FRAMES, 1,
         mat=M['steel'], marks=0, joint=False)
kit.roll('HaulRollUpper', X_HAUL, Z_SHEET + T / 2 + HAUL_D / 2000, HAUL_D / 2000, .56, M, 'roll', turns_of(HAUL_D), FRAMES, -1,
         mat=M['rubber'], marks=0, joint=False)
winder = kit.roll('Winder', X_WIND, Z_SHEET - T / 2 - WR, WR, TRIMMED + .02, M, 'winder', 1, FRAMES, 1, mat=M['sheet'], marks=3, joint=False)
core = [kit.cylinder('Winder core', (0, 0, 0), CORE_D / 2000, TRIMMED + .14, 'X', M['core'], segments=32)]
kit.join(core, 'Winder_core').parent = winder
kit.join([kit.box('Winder frame', (X_WIND, .40, (Z_SHEET - WR) / 2 + .1), (.30, .05, Z_SHEET - WR + .3), M['paint'], bevel=.008),
          kit.box('Winder front post', (X_WIND, -.40, (Z_SHEET - WR) / 2), (.06, .05, Z_SHEET - WR), M['paint'], bevel=.006)] + [kit.box('Winder motor', (X_WIND, .52, Z_SHEET - WR), (.18, .16, .18), M['paint_accent'], bevel=.008)],
         'WinderFrame')

# The web: lip -> first nip -> round the middle roll (+X side) -> second nip -> round the bottom roll (-X side) -> table
path = [lip, Vector((X_S, 0, AX))]
path += kit.arc_xz(X_S, Z_M, R + T / 2, 90, -90, 36)[1:]
path += kit.arc_xz(X_S, Z_B, R + T / 2, 90, 270, 36)[1:]
path += [Vector((X_TRIM, 0, Z_SHEET))]
kit.web('SheetWeb', path, WIDTH, T * 2, M['sheet'])
after = [Vector((X_TRIM, 0, Z_SHEET)), Vector((X_WIND, 0, Z_SHEET))] + kit.arc_xz(X_WIND, Z_SHEET - T / 2 - WR, WR + T / 2, 90, 30, 6)[1:]
kit.web('SheetTrimmed', after, TRIMMED, T * 2, M['sheet'])
for side in (-1, 1):
    y = side * (TRIMMED / 2 + .0075)
    strip = [Vector((X_TRIM, y, Z_SHEET)), Vector((X_TRIM + .12, y, Z_SHEET - .04)), Vector((X_TRIM + .25, y, .52))]
    kit.web('EdgeTrim', [Vector((p.x, 0, p.z)) for p in strip], .015, T * 2, M['sheet']).location.y = y

# Flow markers on the sheet surface at line speed (front edge), feed pellets and melt in the screw channel
marks = [Vector((p.x, -WIDTH / 2 + .02, p.z)) for p in path] + [Vector((X_WIND - .02, -TRIMMED / 2 + .02, Z_SHEET))]
kit.ride('SheetMarker', marks, math.ceil(kit.path_length(marks) / (TRAVEL / 4)), TRAVEL / 4, TRAVEL, M['polymer_marker'], .006, FRAMES)
feed = kit.catmull([(ext['throat_x'], 0, AX + .75), (ext['throat_x'], 0, AX + .35), (ext['throat_x'], 0, AX + .06)], 6)
kit.ride('FeedPellet', feed, 8, kit.path_length(feed) / 8, 2 * kit.path_length(feed), M['pellet'], .005, FRAMES, 'pellet')
melt = [Vector((ext['throat_x'], 0, AX + D * .42)), Vector((X_E - .01, 0, AX + D * .42))]
kit.ride('MeltMarker', melt, 12, kit.path_length(melt) / 12, 2 * kit.path_length(melt) / 12, M['polymer_marker'], .006, FRAMES)

kit.cabinet('Control cabinet', (ext['x_rear'] - .2, .45, 0), (ext['x_rear'] + .6, .85, 1.90), M)
kit.stack_light('Stack light', (ext['x_rear'] + .2, .65, 1.90), M)
kit.hmi_pedestal('Operator panel', (ext['x_rear'] + .3, -.70, 0), (ext['x_rear'] + .3, -.70, 1.42), M)
kit.bake_linear()

control = lines.control
centre = [(ext['x_rear'] + X_WIND + WR) / 2, .85, 0]
META = {
    'id': 'sheet', 'duration': LOOP, 'frames': [0, FRAMES],
    'poster': 'assets/equipment/sheet-motion-poster.png', 'model': 'assets/equipment/sheet-motion.glb',
    'center': centre, 'span': [X_WIND + WR - ext['x_rear'] + .5, 2.4], 'zoom': [.7, 12],
    'controls': [control('screw', '스크류 회전각', 'Screw rotation angle', time_range=[0, LOOP]),
                 control('flow', '수지 표시 위치', 'Resin marker position', 100, '%', [0, LOOP]),
                 control('roll', '3롤 스택 회전각 (250 mm)', '3-roll stack angle (250 mm)', time_range=[0, LOOP]),
                 control('winder', '권취 롤 회전각', 'Winder rotation angle', 360, time_range=[0, LOOP])],
    'views': [{'key': 'all', 'label': ['전체 라인', 'Whole line'], 'center': centre, 'zoom': 1},
              {'key': 'screw', 'label': ['스크류·배럴', 'Screw & barrel'], 'center': [-.7, AX, 0], 'zoom': 3.2},
              {'key': 'stack', 'label': ['평다이·3롤 스택', 'Flat die & 3-roll stack'], 'center': [X_S - .05, .75, 0], 'zoom': 4.5},
              {'key': 'finish', 'label': ['트림·인취·권취', 'Trim, haul-off & winder'], 'center': [X_HAUL, .55, 0], 'zoom': 3}],
    'stages': [['공급·용융', 'Feed & melt'], ['평다이·롤 접촉', 'Flat die & roll contact'], ['냉각·인취', 'Cool & haul off'],
               ['트림·권취', 'Trim & wind']],
    'turns': TURNS,
    'study': {'rpm': round(RPM['screw'], 1), 'speed': LINE_SPEED, 'diameter': STACK_D},
    'teaching': {'time_scale': 1, 'line_speed_m_min': LINE_SPEED, 'rpm': {key: round(value, 3) for key, value in RPM.items()},
                 'roll_mm': {'stack': STACK_D, 'table': TABLE_D, 'haul': HAUL_D, 'winder_now': WOUND_D, 'core': CORE_D},
                 'loop_note': 'Real time: the 250 mm stack rolls turn once per loop; every roll keeps the same surface speed.'},
    'spec': {'basis': 'Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting',
             'screw_d_mm': 45, 'l_d': 30, 'flat_die_mm': '500 x 160 x 120', 'lip_gap_mm': 1.0, 'stack': '3 x 250 mm, face 600 mm',
             'web_path': 'S-wrap: top-middle nip, middle roll, middle-bottom nip, bottom roll', 'roller_table': '2000 mm, 80 mm rolls at 200 mm',
             'trim_mm_each_side': 15, 'haul_off_mm': HAUL_D, 'winder_core_mm': CORE_D, 'winder_max_mm': 500,
             'sources': 'output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md'},
}

floor = kit.floor('Floor', ext['x_rear'] - .3, X_WIND + .5, -.9, 1.0, M)
kit.studio_world(.8, 'studio.exr')
sc.frame_set(round(FRAMES * .4))
bpy.context.view_layer.update()
camera = kit.ortho_camera('Line camera', (centre[0] + 5, -10, 5.4), (centre[0], 0, .8), 8)
orientation = camera.rotation_euler.to_matrix()
right, up = orientation.col[0], orientation.col[1]
corners = [obj.matrix_world @ Vector(c) for obj in sc.objects if obj.type == 'MESH' and obj is not floor for c in obj.bound_box]
xs, ys = [p.dot(right) for p in corners], [p.dot(up) for p in corners]
camera.location += right * ((min(xs) + max(xs)) / 2 - camera.location.dot(right)) + up * ((min(ys) + max(ys)) / 2 - camera.location.dot(up))
camera.data.ortho_scale = max(max(xs) - min(xs), (max(ys) - min(ys)) * 16 / 9) * 1.06
kit.area_light('Key light', (centre[0] - 2.5, -5, 6), (centre[0], 0, .8), 1500, 6)
kit.area_light('Rim light', (centre[0] + 2.5, 4, 5), (centre[0], 0, .8), 650, 5, (.9, .95, 1))
kit.render_still(OUT / 'sheet-motion-poster.png', 1280, 720, samples=48)
for obj in [floor, camera] + [o for o in sc.objects if o.type == 'LIGHT']:
    bpy.data.objects.remove(obj, do_unlink=True)
sc.frame_set(0)
sc['motion_scope'] = 'Teaching rig; Pack B teaching dimensions, no OEM drawing, roll temperature or gap setting.'
sc['motion_controls'] = json.dumps(META['controls'], ensure_ascii=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'sheet-motion.blend'), compress=True)
kit.export_glb(OUT / 'sheet-motion.glb')
META['blender'] = bpy.app.version_string
META['groups'] = sorted({obj.get('motion_group') for obj in sc.objects if obj.get('motion_group')})
(OUT / 'sheet-motion.json').write_text(json.dumps(META, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines.write_manifest()
print('SHEET_EXPORT_OK', flush=True)
