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
For the start-up sequence the top roll, its bearing blocks and rotary union ride a carriage that two hydraulic cylinders
on a crosshead lower onto the sheet (30 mm gap for threading); the sheet is built in 100 mm segments tagged with their
distance from the lip, and the wound roll grows from its core while winding starts.
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
    frame += [kit.hydraulic_cylinder('Bottom gap adjuster', (X_S - .32, y, Z_B), (X_S - .14, y, Z_B), .03, .014, M)[0],
              kit.box('Stack top rail', (X_S, y, Z_T + R + .10), (.47, .05, .04), M['paint'], bevel=.004),
              kit.box('Gap cylinder post', (X_S, y, Z_T + .33), (.06, .05, .17), M['paint'], bevel=.004),
              kit.box('Stack rail', (X_S, y, .02), (.90, .06, .04), M['steel'])]
frame.append(kit.box('Stack crossbeam', (X_S + .2, 0, Z_T + R + .12), (.08, FACE + .40, .08), M['paint']))
frame.append(kit.box('Gap cylinder crosshead', (X_S, 0, Z_T + .43), (.14, FACE + .44, .04), M['paint'], bevel=.006))
frame.append(kit.box('Stack drive', (X_S, FACE / 2 + .40, Z_M), (.30, .20, .30), M['paint_accent'], bevel=.01))
kit.join(frame, 'StackFrame')
top_roll = kit.roll('TopRoll', X_S, Z_T, R, FACE, M, 'roll', 1, FRAMES, -1)   # bottom surface moves +X at the first nip
kit.roll('MiddleRoll', X_S, Z_M, R, FACE, M, 'roll', 1, FRAMES, 1)     # the web wraps its +X side, moving down
kit.roll('BottomRoll', X_S, Z_B, R, FACE, M, 'roll', 1, FRAMES, -1)    # the web wraps its -X side, leaving along +X

# Gap actuator: the top roll, its bearing blocks and rotary union ride a carriage that two hydraulic cylinders, hanging
# from a crosshead over the stack, lower onto the sheet. For threading the gap stands 30 mm open.
bpy.context.view_layer.update()
nip = kit.carrier('TopRollCarriage')
kit.mount([top_roll, bpy.data.objects['TopRoll stand']], nip)
BLOCK_TOP = Z_T + (R * .9 + .06) / 2
for y in (-(FACE / 2 + .07), FACE / 2 + .07):
    kit.linked_cylinder('Top roll gap cylinder', (X_S, y, Z_T + .41), (X_S, y, Z_T + .25), (X_S, y, BLOCK_TOP), .035, .016, M, nip, inset=.05)
OPEN = .03
kit.actuate(nip, FRAMES, (0, 0, OPEN))

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
# The sheet is built in 100 mm segments tagged with their distance from the lip, split at the first nip, so the start-up
# can grow it; the edge-trim strips appear once the sheet passes the knives.
S_NIP = kit.path_length(path[:2])
S_TRIM = kit.path_length(path)
kit.thread_web('SheetWeb', kit.path_slice(path, 0, S_NIP), WIDTH, T * 2, M['sheet'])
kit.thread_web('SheetWebDrawn', kit.path_slice(path, S_NIP, S_TRIM), WIDTH, T * 2, M['sheet'], s_from=S_NIP)
after = [Vector((X_TRIM, 0, Z_SHEET)), Vector((X_WIND, 0, Z_SHEET))] + kit.arc_xz(X_WIND, Z_SHEET - T / 2 - WR, WR + T / 2, 90, 30, 6)[1:]
kit.thread_web('SheetTrimmed', after, TRIMMED, T * 2, M['sheet'], s_from=S_TRIM)
S_END = S_TRIM + kit.path_length(after)
for side in (-1, 1):
    y = side * (TRIMMED / 2 + .0075)
    strip = [Vector((X_TRIM, y, Z_SHEET)), Vector((X_TRIM + .12, y, Z_SHEET - .04)), Vector((X_TRIM + .25, y, .52))]
    trim_strip = kit.web('EdgeTrim', [Vector((p.x, 0, p.z)) for p in strip], .015, T * 2, M['sheet'])
    trim_strip.location.y = y
    trim_strip['thread_at'] = round(S_TRIM + .05, 5)

# Flow markers on the sheet surface at line speed (front edge), feed pellets and melt in the screw channel
marks = [Vector((p.x, -WIDTH / 2 + .02, p.z)) for p in path] + [Vector((X_WIND - .02, -TRIMMED / 2 + .02, Z_SHEET))]
kit.ride('SheetMarker', marks, math.ceil(kit.path_length(marks) / (TRAVEL / 4)), TRAVEL / 4, TRAVEL, M['polymer_marker'], .006, FRAMES)
feed = kit.catmull([(ext['throat_x'], 0, AX + .75), (ext['throat_x'], 0, AX + .35), (ext['throat_x'], 0, AX + .06)], 6)
kit.ride('FeedPellet', feed, 8, kit.path_length(feed) / 8, 2 * kit.path_length(feed), M['pellet'], .005, FRAMES, 'pellet', group='resin')
melt = [Vector((ext['throat_x'], 0, AX + D * .42)), Vector((X_E - .01, 0, AX + D * .42))]
kit.ride('MeltMarker', melt, 12, kit.path_length(melt) / 12, 2 * kit.path_length(melt) / 12, M['polymer_marker'], .006, FRAMES,
         group='resin')

kit.cabinet('Control cabinet', (ext['x_rear'] - .2, .45, 0), (ext['x_rear'] + .6, .85, 1.90), M)
kit.stack_light('Stack light', (ext['x_rear'] + .2, .65, 1.90), M)
kit.hmi_pedestal('Operator panel', (ext['x_rear'] + .3, -.70, 0), (ext['x_rear'] + .3, -.70, 1.42), M)
kit.bake_linear()

# Start-up: screw and roll turns follow the steady line ratios (10 screw turns per stack-roll turn of 785 mm).
SCREW_PER_M, STACK_PER_M = TURNS['screw'] / TRAVEL, 1000 / (math.pi * STACK_D)
WIND = 2.0                                           # metres of sheet wound during the winding step (compressed growth)
STARTUP, CONTROLS = kit.startup(
    ['실제 라인의 기동 순서입니다. 롤 갭을 연 상태에서 스크류가 용융 시트를 평다이 밖으로 밀어내 상단과 중단 롤 사이로 넣고, 유압 실린더로 '
     '상단 롤을 내려 갭을 닫은 뒤 롤 스택을 돌려 시트를 S자로 감아 롤러 테이블, 트림, 인취를 거쳐 권취기까지 보내고 권취를 시작합니다. '
     '실제 라인은 존과 롤 온도가 설정값에 도달하고 균열(soak) 시간이 지나야 스크류가 기동되며(cold-start 보호), 모형은 그 이후부터 '
     '보여줍니다.',
     'The real start-up order: with the roll gap open, the screw pushes the melt sheet out of the flat die between the top '
     'and middle rolls; the hydraulic cylinders lower the top roll to close the gap, the stack draws the sheet through its '
     'S-wrap over the roller table, trim and haul-off to the winder, and winding starts. A real line only lets the screw '
     'start once every zone and roll has reached its set point and soaked (cold-start protection); the model starts after that.'],
    [kit.step('screw', ['압출 시작 · 스크류 회전', 'Start extruding · screw'],
              ['스크류를 돌려 용융 시트를 평다이에서 열린 상단·중단 롤 사이로 보내세요.',
               'Turn the screw to push the melt sheet from the flat die into the open gap between the top and middle rolls.'],
              once=True, spin={'screw': [round(S_NIP * SCREW_PER_M, 4), 0]}, thread=[0, S_NIP]),
     kit.step('nip', ['롤 갭 닫힘 · 유압 실린더', 'Close the roll gap · hydraulic cylinders'],
              ['시트가 롤 사이에 들어왔습니다. 유압 실린더로 상단 롤을 내려 갭을 닫으세요. 롤 갭은 제품 두께와 같지 않으며 실제로는 두께를 보며 '
               '맞춥니다.',
               'The sheet is between the rolls. Lower the top roll with the hydraulic cylinders to close the gap; the roll gap '
               'is not the product thickness and is set while watching the gauge.'],
              needs=['screw'], move='nip'),
     kit.step('roll', ['롤 스택 이송', 'Draw with the roll stack'],
              ['갭이 닫혔습니다. 롤 스택을 돌려 시트를 S자로 감아 롤러 테이블, 트림, 인취를 거쳐 권취기까지 보내세요. 이송이 시작되면 갭을 '
               '열 수 없습니다.',
               'The gap is closed. Run the stack to draw the sheet through its S-wrap over the roller table, trim and haul-off '
               'to the winder; the gap stays closed once drawing starts.'],
              needs=['nip'], locks=['nip'], once=True, thread=[S_NIP, S_END],
              spin={'roll': [round((S_END - S_NIP) * STACK_PER_M, 4), 0], 'screw': [round((S_END - S_NIP) * SCREW_PER_M, 4), 0]}),
     kit.step('winder', ['권취 시작', 'Start winding'],
              ['시트가 권취 코어에 닿았습니다. 권취기를 돌려 감으세요. 모형은 76 mm 코어에서 250 mm 권취 롤까지를 압축해 보여줍니다.',
               'The sheet has reached the winder core. Turn the winder to wind it; the model compresses the growth from the '
               '76 mm core to a 250 mm roll.'],
              needs=['roll'], once=True,
              spin={'winder': [round(WIND * 1000 / (math.pi * (CORE_D + WOUND_D) / 2), 4), 0], 'roll': [round(WIND * STACK_PER_M, 4), 0],
                    'screw': [round(WIND * SCREW_PER_M, 4), 0]},
              wind={'node': 'Winder_body', 'core': round(CORE_D / WOUND_D, 4)})],
    ['기동 완료 · "자동 공정으로 돌아가기"를 누르면 정상 운전(3 m/min)을 재생합니다.',
     'Start-up complete. Choose "Return to cycle" to play steady running at 3 m/min.'],
    LOOP)
centre = [(ext['x_rear'] + X_WIND + WR) / 2, .85, 0]
META = {
    'id': 'sheet', 'duration': LOOP, 'frames': [0, FRAMES],
    'poster': 'assets/equipment/sheet-motion-poster.png', 'model': 'assets/equipment/sheet-motion.glb',
    'center': centre, 'span': [X_WIND + WR - ext['x_rear'] + .5, 2.4], 'zoom': [.7, 12],
    'controls': CONTROLS, 'startup': STARTUP,
    # The stack close-up looks almost square-on so the S-wrap reads in one plane.
    'views': [{'key': 'all', 'label': ['전체 라인', 'Whole line'], 'center': centre, 'zoom': 1},
              kit.camera_view('screw', ['스크류·배럴 단면', 'Screw & barrel cutaway'], (-.7, 0, AX), (1.2, -6.0, 5.2), 3.4),
              kit.camera_view('stack', ['평다이·3롤 스택', 'Flat die & 3-roll stack'], (X_S - .05, 0, .78), (.5, -8.0, .9), 4.5),
              kit.camera_view('finish', ['트림·인취·권취', 'Trim, haul-off & winder'], (X_HAUL, 0, .55), (1.5, -6.0, 2.5), 3)],
    'heat': {'input': 'process', 'reference': 'process',
             'title': ['배럴·다이 존 온도 (입력한 설정값)', 'Barrel and die zone temperatures (entered set points)'],
             'note': kit.PROCESS_HEAT_NOTE, 'scale_labels': {'melt': ['배럴·다이', 'Barrel & die'], 'tool': ['칠 롤', 'Chill rolls']},
             'zones': kit.extruder_heat(ext, ['zone1', 'zone2', 'zone3', 'zone4', 'zone5'])
             + [kit.heat_box('die', 'die', ['평다이', 'Flat die'], (X_DIE - .003, -.262, AX - .066), (X_DIE + .163, .262, AX + .066), half=False),
                kit.heat_roll_ends('chill_top', 'chillTop', ['상단 롤', 'Top roll'], X_S, Z_T, R + .004, FACE),
                kit.heat_roll_ends('chill_mid', 'chillMid', ['중단 롤', 'Middle roll'], X_S, Z_M, R + .004, FACE),
                kit.heat_roll_ends('chill_bot', 'chillBot', ['하단 롤', 'Bottom roll'], X_S, Z_B, R + .004, FACE)]},
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
             'trim_mm_each_side': 15, 'gap_threading_mm': OPEN * 1000, 'gap_cylinders': 2, 'haul_off_mm': HAUL_D, 'winder_core_mm': CORE_D, 'winder_max_mm': 500,
             'sources': 'output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md'},
}

floor = kit.floor('Floor', ext['x_rear'] - .3, X_WIND + .5, -.9, 1.0, M)
kit.studio_world(.8, 'studio.exr')
release = kit.hold_closed([nip])                     # the poster shows the running line
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
release()
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
