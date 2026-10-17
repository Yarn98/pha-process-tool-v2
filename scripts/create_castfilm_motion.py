"""Real-scale cast-film line (brand-neutral teaching model).

blender -b --factory-startup --python scripts/create_castfilm_motion.py

Pack B cast-film base (grade C teaching values; output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md):
- D45 30D extruder on a raised frame feeds a 500 mm flat die that points down;
- the melt curtain falls freely through an 80 mm air gap onto a 400 mm chill roll with a 600 mm face and is
  pinned by a 550 mm air knife;
- the film wraps the chill roll for 180 deg and transfers to a 200 mm second roll, then a 200 mm downstream roll;
- a traversing O-frame thickness gauge (700 mm) and edge trim follow, then a dancer and a winder on a 76 mm
  core (shown at 200 mm; the rpm falls as the roll grows to 500 mm).
For the start-up sequence the air knife and its hose ride a slide that two pneumatic cylinders push radially in to the
chill roll (50 mm back for threading); the film is built in segments tagged with their distance from the lip, and the
wound roll grows from its core while winding starts.
The model runs in real time at a 10 m/min line speed. The 400 mm chill roll turns once per loop and the 200 mm
rolls twice; every roll keeps the same surface speed, n = 1000 v / (pi d).
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import pha_blender_kit as kit  # noqa: E402
import create_line_models as lines  # noqa: E402

OUT = ROOT / 'assets/equipment'
TAU = math.tau
FPS = 24
LINE_SPEED = 10.0                                  # m/min
V = LINE_SPEED / 60
CHILL_D, SECOND_D, THIRD_D, GUIDE_D, WOUND_D, CORE_D = 400.0, 200.0, 200.0, 100.0, 200.0, 76.0
FRAMES = round(math.pi * CHILL_D / 1000 / V * FPS)
LOOP = FRAMES / FPS                                # one chill-roll turn
TRAVEL = V * LOOP
turns_of = lambda d_mm: TRAVEL / (math.pi * d_mm / 1000)
TURNS = {'roll': 1, 'winder': 2, 'screw': 8}
for _d in (CHILL_D, SECOND_D, GUIDE_D, WOUND_D):
    assert abs(turns_of(_d) - round(turns_of(_d))) < .003, _d
RPM = {'chill': 1000 * LINE_SPEED / (math.pi * CHILL_D), 'second': 1000 * LINE_SPEED / (math.pi * SECOND_D),
       'winder_at_76': 1000 * LINE_SPEED / (math.pi * CORE_D), 'winder_at_200': 1000 * LINE_SPEED / (math.pi * WOUND_D),
       'winder_at_500': 1000 * LINE_SPEED / (math.pi * 500), 'screw': TURNS['screw'] / LOOP * 60}

D, AX = .045, 1.55                                 # raised extruder: the die points down onto the chill roll
T = .0008                                          # drawn film thickness (exaggerated for visibility)
WIDTH, TRIMMED, FACE = .48, .44, .60
R1, R2, R3, RG, RW = CHILL_D / 2000, SECOND_D / 2000, THIRD_D / 2000, GUIDE_D / 2000, WOUND_D / 2000
X_C = .55                                          # chill roll axis
LAND = 100                                         # landing angle on the chill roll (deg from +X): just past top-dead-centre
AIR_GAP = .08
DIE_H = .16 + .024                                 # flat die inlet face to lip exit
Z_LIP = AX - .09 - DIE_H                           # the melt pipe drops 90 mm into the die inlet
X_LIP = X_C + R1 * math.cos(math.radians(LAND))    # the curtain falls vertically onto the landing line
Z_C = Z_LIP - AIR_GAP - R1 * math.sin(math.radians(LAND))
Z_2 = Z_C - R1 - R2 - T                            # second roll below the chill roll (transfer nip)
Z_EXIT = Z_2 - R2 - T / 2
X_3 = X_C + .55
X_GAUGE, X_TRIM = X_C + 1.15, X_C + 1.65
X_DANCER, X_WIND = X_C + 2.05, X_C + 2.55

kit.reset_scene('PHA cast film line')
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 0, FRAMES
M = kit.palette()
M['film'] = kit.material('Polymer / film (translucent)', '#3E8C5A', 0, .2, alpha=.55)
M['core'] = kit.material('Paper / winder core', '#B89A6A', 0, .85)

ext = kit.single_screw_extruder('Extruder', D, 30, -.35, AX, M, FRAMES, TURNS['screw'], zones=3)   # schema zone1-zone3
x_lip = X_LIP
feed = [kit.cylinder('Adapter', (-.28, 0, AX), .055, .135, 'X', M['steel'], segments=40),
        kit.box('Screen changer plate', (-.25, 0, AX), (.035, .30, .13), M['steel_dark'], bevel=.004),
        kit.cylinder('Screen changer cylinder', (-.25, -.30, AX), .025, .16, 'Y', M['chrome']),
        kit.tube_path('Melt pipe', [(-.20, 0, AX), (x_lip - .12, 0, AX), (x_lip, 0, AX - .02), (x_lip, 0, AX - .09)], .035, M['steel']),
        kit.cylinder('Melt pressure sensor', (-.10, 0, AX + .06), .006, .06, 'Z', M['stainless'])]
for x in (-.12, x_lip - .2):
    feed.append(kit.heater_band('Melt pipe heater', x, .036, .05, M['heater'], M['ceramic'], (0, AX)))
kit.join(feed, 'AdapterAndMeltPipe')
# Flat die built lips +X at the origin, then turned so the lips point down onto the chill roll.
lip_local = kit.flat_die('Flat die', 0.0, .50, .16, .12, 0.0, M)
die = bpy.data.objects['Flat die']
die.matrix_world = Matrix.Translation((x_lip, 0, AX - .09)) @ Matrix.Rotation(math.radians(90), 4, 'Y')
lip = die.matrix_world @ lip_local
assert abs(lip.z - Z_LIP) < 1e-6 and abs(lip.x - X_LIP) < 1e-6
kit.join([kit.box('Die hanger', (x_lip, side * .33, AX - .17), (.08, .04, .30), M['paint_dark']) for side in (-1, 1)]
         + [kit.box('Die beam', (x_lip, 0, AX + .02), (.10, .70, .04), M['paint_dark'])], 'DieHanger')

# Chill roll, second and third rolls on a common stand; air knife pins the curtain on the landing line
kit.roll('ChillRoll', X_C, Z_C, R1, FACE, M, 'roll', 1, FRAMES, 1)             # top moves +X: the film wraps its +X side
kit.roll('SecondRoll', X_C, Z_2, R2, FACE, M, 'roll', turns_of(SECOND_D), FRAMES, -1)   # S-transfer, leaves along +X
kit.roll('ThirdRoll', X_3, Z_EXIT - T / 2 - R3, R3, FACE, M, 'roll', turns_of(THIRD_D), FRAMES, 1, joint=True)
stand = []
for side in (-1, 1):
    y = side * (FACE / 2 + .17)
    # Rear side is a plate; the operator side uses posts so the chill wrap stays visible.
    stand += ([kit.box('Chill stand side', (X_C + .2, y, (Z_C + R1) / 2 + .05), (1.0, .05, Z_C + R1 + .1), M['paint'], bevel=.008)] if side > 0 else
              [kit.box('Chill stand post', (X_C + dx, y, (Z_C + R1) / 2 + .05), (.07, .05, Z_C + R1 + .1), M['paint'], bevel=.006)
               for dx in (-.30, .30, .70)])
stand += [kit.box('Chill drive', (X_C, FACE / 2 + .42, Z_C), (.30, .22, .30), M['paint_accent'], bevel=.01)]
knife_angle = math.radians(LAND - 12)
kx, kz = X_C + (R1 + .03) * math.cos(knife_angle), Z_C + (R1 + .03) * math.sin(knife_angle)
knife = kit.box('Air knife', (0, 0, 0), (.03, .55, .05), M['stainless'], bevel=.004)
knife.location, knife.rotation_euler.y = (kx, 0, kz), -knife_angle
hose = kit.hose('Air knife hose', (kx, .29, kz), (kx - .4, .70, .3), .02, M['rubber'], sag=.1)
stand += [kit.box('Air knife blower', (kx - .4, .75, .2), (.3, .3, .35), M['paint_accent'], bevel=.01)]
# Air knife slide: for threading the knife and its hose stand 50 mm back from the chill roll. Two pneumatic cylinders,
# 75 mm downstream of the knife (clear of the die) on a bracket hung from the die beam, push it radially in through arms
# on the knife to pin the curtain on the landing line.
radial = Vector((math.cos(knife_angle), 0, math.sin(knife_angle)))
down = Vector((math.sin(knife_angle), 0, -math.cos(knife_angle)))     # film travel over the roll top
centre_k = Vector((kx, 0, kz))
arms = []
for y in (-.22, .22):
    arm = kit.box('Air knife arm', (0, 0, 0), (.02, .04, .10), M['steel_dark'], bevel=.002)
    arm.location, arm.rotation_euler.y = centre_k + down * .05 + radial * .01 + Vector((0, y, 0)), -knife_angle
    arms.append(arm)
    cap = centre_k + down * .075 + radial * .175 + Vector((0, y, 0))
    stand += [kit.box('Air knife bracket hanger', (cap.x, y, (cap.z + .02 + AX) / 2), (.03, .03, AX - cap.z - .02), M['steel_dark'], bevel=.002),
              kit.box('Air knife bracket hanger', ((cap.x + x_lip + .03) / 2, y, AX + .02), (cap.x - x_lip, .03, .04), M['steel_dark'], bevel=.002)]
bracket = kit.box('Air knife cylinder bracket', (0, 0, 0), (.024, .50, .05), M['steel_dark'], bevel=.003)
bracket.location, bracket.rotation_euler.y = centre_k + down * .075 + radial * .187, -knife_angle
stand.append(bracket)
kit.join(stand, 'ChillStand')
bpy.context.view_layer.update()
nip = kit.carrier('AirKnifeSlide')
kit.mount([knife, hose] + arms, nip)
for y in (-.22, .22):
    side_k = centre_k + down * .075 + Vector((0, y, 0))
    kit.linked_cylinder('Air knife cylinder', side_k + radial * .175, side_k + radial * .075, side_k + radial * .02, .016, .006, M, nip,
                        inset=.03)
OPEN = .05
kit.actuate(nip, FRAMES, tuple(radial * OPEN))

# Traversing O-frame gauge, edge trim, guide roll, dancer and winder
gauge = [kit.box('Gauge frame top', (X_GAUGE, 0, Z_EXIT + .12), (.10, .90, .05), M['paint']),
         kit.box('Gauge frame bottom', (X_GAUGE, 0, Z_EXIT - .12), (.10, .90, .05), M['paint'])]
for side in (-1, 1):
    gauge.append(kit.box('Gauge frame post', (X_GAUGE, side * .45, Z_EXIT), (.10, .05, .29), M['paint']))
    gauge.append(kit.box('Gauge leg', (X_GAUGE, side * .45, (Z_EXIT - .145) / 2), (.05, .05, Z_EXIT - .145), M['paint_dark']))
kit.join(gauge, 'GaugeFrame')
head = kit.empty('GaugeHead', (X_GAUGE, 0, Z_EXIT), group='gauge')
kit.join([kit.box('Gauge source', (0, 0, .07), (.06, .06, .04), M['warning'], bevel=.004),
          kit.box('Gauge detector', (0, 0, -.07), (.06, .06, .04), M['steel_dark'], bevel=.004)], 'GaugeHead_body').parent = head
for frame in range(FRAMES + 1):                    # one full traverse and return per loop (illustrative)
    head.location.y = .35 * math.sin(TAU * frame / FRAMES)
    head.keyframe_insert('location', index=1, frame=frame)
trim = [kit.box('Trim knife holder', (X_TRIM, side * TRIMMED / 2, Z_EXIT + .08), (.05, .04, .10), M['steel_dark']) for side in (-1, 1)]
trim += [kit.cylinder('Trim knife', (X_TRIM, side * TRIMMED / 2, Z_EXIT + .02), .025, .002, 'Y', M['chrome']) for side in (-1, 1)]
trim += [kit.cylinder('Trim suction', (X_TRIM + .08, side * (TRIMMED / 2 + .01), Z_EXIT - .15), .03, .3, 'Z', M['stainless'])
         for side in (-1, 1)]
kit.join(trim, 'EdgeTrim')
kit.roll('FilmGuideRoll', X_TRIM + .2, Z_EXIT - T / 2 - RG, RG, .56, M, 'roll', turns_of(GUIDE_D), FRAMES, 1, mat=M['steel'], joint=False)
dancer_z = Z_EXIT - .20
kit.roll('DancerRoll', X_DANCER, dancer_z, RG, .56, M, 'roll', turns_of(GUIDE_D), FRAMES, -1, mat=M['steel'], joint=False)
kit.join([kit.box('Dancer arm', (X_DANCER - .1, side * .34, dancer_z + .02), (.24, .02, .03), M['paint_accent']) for side in (-1, 1)]
         + [kit.cylinder('Dancer load cell', (X_DANCER - .22, side * .34, dancer_z + .02), .025, .03, 'Y', M['steel']) for side in (-1, 1)],
         'DancerArm')
wind_z = Z_EXIT - .02
winder = kit.roll('Winder', X_WIND, wind_z - RW, RW, TRIMMED + .02, M, 'winder', 2, FRAMES, 1, mat=M['film'], marks=3, joint=False)
kit.join([kit.cylinder('Winder core', (0, 0, 0), CORE_D / 2000, TRIMMED + .14, 'X', M['core'], segments=32)], 'Winder_core').parent = winder
kit.join([kit.box('Turret arm', (X_WIND + .15, side * .40, wind_z - RW), (.55, .05, .10), M['paint'], bevel=.006) for side in (-1, 1)]
         + [kit.box('Turret stand', (X_WIND + .15, side * .40, (wind_z - RW) / 2), (.12, .06, wind_z - RW), M['paint']) for side in (-1, 1)]
         + [kit.cylinder('Spare core', (X_WIND + .40, 0, wind_z - RW), CORE_D / 2000, TRIMMED + .14, 'Y', M['core'])],
         'WinderTurret')

# Film path: curtain -> landing on the chill roll -> 180 deg wrap (+X side) -> transfer under the second roll ->
# over the third roll -> gauge -> trim -> guide roll -> dancer -> winder
land = kit.arc_xz(X_C, Z_C, R1 + T / 2, LAND, LAND, 1)[0]
path = [lip, land]
path += kit.arc_xz(X_C, Z_C, R1 + T / 2, LAND, -90, 48)[1:]
path += kit.arc_xz(X_C, Z_2, R2 + T / 2, 90, 270, 24)[1:]
path += [Vector((X_3 - .05, 0, Z_EXIT)), Vector((X_TRIM + .2, 0, Z_EXIT))]
# The film is built in 100 mm segments tagged with their distance from the lip, split at the landing line, so the
# start-up can grow the curtain onto the chill roll and then draw it on.
S_LAND = kit.path_length(path[:2])
S_TRIM = kit.path_length(path)
kit.thread_web('CastFilmWeb', kit.path_slice(path, 0, S_LAND), WIDTH, T * 2, M['film'], step=.04)
kit.thread_web('CastFilmWebDrawn', kit.path_slice(path, S_LAND, S_TRIM), WIDTH, T * 2, M['film'], s_from=S_LAND)
after = [Vector((X_TRIM + .2, 0, Z_EXIT)), Vector((X_DANCER - RG - T / 2, 0, dancer_z + .02))]
after += kit.arc_xz(X_DANCER, dancer_z, RG + T / 2, 180, 270, 8)[1:]
after += [Vector((X_DANCER + .15, 0, dancer_z - RG)), Vector((X_WIND, 0, wind_z))]
kit.thread_web('CastFilmTrimmed', after, TRIMMED, T * 2, M['film'], s_from=S_TRIM)
S_END = S_TRIM + kit.path_length(after)

marks = [Vector((p.x, -WIDTH / 2 + .02, p.z)) for p in path[1:]]
kit.ride('FilmMarker', marks, math.ceil(kit.path_length(marks) / (TRAVEL / 4)), TRAVEL / 4, TRAVEL, M['polymer_marker'], .006, FRAMES)
pellets = kit.catmull([(ext['throat_x'], 0, AX + .75), (ext['throat_x'], 0, AX + .35), (ext['throat_x'], 0, AX + .06)], 6)
kit.ride('FeedPellet', pellets, 8, kit.path_length(pellets) / 8, 2 * kit.path_length(pellets), M['pellet'], .005, FRAMES, 'pellet',
         group='resin')
melt = [Vector((ext['throat_x'], 0, AX + D * .42)), Vector((-.36, 0, AX + D * .42))]
kit.ride('MeltMarker', melt, 12, kit.path_length(melt) / 12, 2 * kit.path_length(melt) / 12, M['polymer_marker'], .006, FRAMES,
         group='resin')

kit.cabinet('Control cabinet', (ext['x_rear'] - .2, .45, 0), (ext['x_rear'] + .6, .85, 1.90), M)
kit.stack_light('Stack light', (ext['x_rear'] + .2, .65, 1.90), M)
kit.hmi_pedestal('Operator panel', (ext['x_rear'] + .3, -.70, 0), (ext['x_rear'] + .3, -.70, 1.42), M)
kit.bake_linear()

# Start-up: screw and roll turns follow the steady line ratios (8 screw turns per chill-roll turn of 1.257 m).
SCREW_PER_M, CHILL_PER_M = TURNS['screw'] / TRAVEL, 1000 / (math.pi * CHILL_D)
WIND = 3.0                                           # metres of film wound during the winding step (compressed growth)
STARTUP, CONTROLS = kit.startup(
    ['실제 라인의 기동 순서입니다. 스크류가 용융 커튼을 평다이 밖으로 밀어내 에어 갭을 지나 도는 칠 롤 위에 떨어뜨리면, 에어 나이프를 '
     '실린더로 밀어 넣어 커튼을 칠 롤에 밀착(pinning)시키고, 롤을 돌려 필름을 두께 측정, 트림, 댄서를 거쳐 권취기까지 보낸 뒤 권취를 '
     '시작합니다. 실제 라인은 존과 칠 롤 온도가 설정값에 도달하고 균열(soak) 시간이 지나야 스크류가 기동되며(cold-start 보호), 모형은 '
     '그 이후부터 보여줍니다.',
     'The real start-up order: the screw pushes the melt curtain out of the flat die through the air gap onto the turning '
     'chill roll; the cylinders push the air knife in to pin the curtain to the roll, the rolls draw the film through the '
     'gauge, trim and dancer to the winder, and winding starts. A real line only lets the screw start once every zone and '
     'the chill roll have reached their set points and soaked (cold-start protection); the model starts after that.'],
    [kit.step('screw', ['압출 시작 · 스크류 회전', 'Start extruding · screw'],
              ['스크류를 돌려 용융 커튼을 평다이에서 에어 갭을 지나 칠 롤 위 착지선까지 내려보내세요.',
               'Turn the screw to let the melt curtain fall from the flat die through the air gap onto the landing line of '
               'the chill roll.'],
              once=True, spin={'screw': [round(S_LAND * SCREW_PER_M, 4), 0]}, thread=[0, S_LAND]),
     kit.step('nip', ['에어 나이프 접근 · 실린더', 'Bring in the air knife · cylinders'],
              ['커튼이 칠 롤에 닿았습니다. 실린더로 에어 나이프를 밀어 넣어 착지선에서 커튼을 롤에 밀착시키세요. 밀착이 약하면 필름과 롤 '
               '사이에 공기가 갇혀 냉각이 고르지 않습니다.',
               'The curtain touches the chill roll. Push the air knife in with the cylinders to pin it on the landing line; '
               'weak pinning traps air between film and roll and cools it unevenly.'],
              needs=['screw'], move='nip'),
     kit.step('roll', ['롤 이송', 'Draw with the rolls'],
              ['커튼이 칠 롤에 밀착되었습니다. 롤을 돌려 필름을 2·3번 롤, 두께 측정, 트림, 댄서를 거쳐 권취기까지 보내세요. 이송이 시작되면 '
               '에어 나이프를 뺄 수 없습니다.',
               'The curtain is pinned. Run the rolls to draw the film over the second and third rolls, gauge, trim and dancer '
               'to the winder; the air knife stays in once drawing starts.'],
              needs=['nip'], locks=['nip'], once=True, thread=[S_LAND, S_END],
              spin={'roll': [round((S_END - S_LAND) * CHILL_PER_M, 4), 0], 'screw': [round((S_END - S_LAND) * SCREW_PER_M, 4), 0]}),
     kit.step('winder', ['권취 시작', 'Start winding'],
              ['필름이 권취 코어에 닿았습니다. 권취기를 돌려 감으세요. 모형은 76 mm 코어에서 200 mm 권취 롤까지를 압축해 보여줍니다.',
               'The film has reached the winder core. Turn the winder to wind it; the model compresses the growth from the '
               '76 mm core to a 200 mm roll.'],
              needs=['roll'], once=True,
              spin={'winder': [round(WIND * 1000 / (math.pi * (CORE_D + WOUND_D) / 2), 4), 0], 'roll': [round(WIND * CHILL_PER_M, 4), 0],
                    'screw': [round(WIND * SCREW_PER_M, 4), 0]},
              wind={'node': 'Winder_body', 'core': round(CORE_D / WOUND_D, 4)})],
    ['기동 완료 · "자동 공정으로 돌아가기"를 누르면 정상 운전(10 m/min)을 재생합니다.',
     'Start-up complete. Choose "Return to cycle" to play steady running at 10 m/min.'],
    LOOP)
centre = [(ext['x_rear'] + X_WIND + .5) / 2, 1.0, 0]
META = {
    'id': 'castfilm', 'duration': LOOP, 'frames': [0, FRAMES],
    'poster': 'assets/equipment/castfilm-motion-poster.png', 'model': 'assets/equipment/castfilm-motion.glb',
    'center': centre, 'span': [X_WIND + .5 - ext['x_rear'] + .4, 2.6], 'zoom': [.7, 12],
    'controls': CONTROLS, 'startup': STARTUP,
    'views': [{'key': 'all', 'label': ['전체 라인', 'Whole line'], 'center': centre, 'zoom': 1},
              kit.camera_view('screw', ['스크류·배럴 단면', 'Screw & barrel cutaway'], (-1.0, 0, AX), (1.2, -6.0, 5.2), 3.4),
              kit.camera_view('chill', ['다이·에어 갭·칠 롤', 'Die, air gap & chill roll'], (X_C, 0, Z_C + .12), (.5, -8.0, .9), 4.5),
              kit.camera_view('finish', ['게이지·트림·권취', 'Gauge, trim & winder'], (X_TRIM + .3, 0, Z_EXIT - .2), (1.5, -6.0, 2.5), 3)],
    'heat': {'input': 'process', 'reference': 'process',
             'title': ['배럴·다이 존 온도 (입력한 설정값)', 'Barrel and die zone temperatures (entered set points)'],
             'note': kit.PROCESS_HEAT_NOTE, 'scale_labels': {'melt': ['배럴·다이', 'Barrel & die'], 'tool': ['칠 롤', 'Chill roll']},
             'zones': kit.extruder_heat(ext, ['zone1', 'zone2', 'zone3'])
             + [kit.heat_box('die', 'die', ['평다이', 'Flat die'], (X_LIP - .066, -.262, Z_LIP + .024), (X_LIP + .066, .262, Z_LIP + DIE_H + .003), half=False),
                kit.heat_roll_ends('chill', 'chillTop', ['칠 롤', 'Chill roll'], X_C, Z_C, R1 + .004, FACE)]},
    'stages': [['공급·용융', 'Feed & melt'], ['에어 갭·칠 롤 고정', 'Air gap & pinning'], ['냉각·두께 측정', 'Cool & gauge'],
               ['트림·권취', 'Trim & wind']],
    'turns': TURNS,
    'study': {'rpm': round(RPM['screw'], 1), 'speed': LINE_SPEED, 'diameter': CHILL_D},
    'teaching': {'time_scale': 1, 'line_speed_m_min': LINE_SPEED, 'air_gap_mm': AIR_GAP * 1000, 'landing_deg': LAND,
                 'rpm': {key: round(value, 3) for key, value in RPM.items()},
                 'roll_mm': {'chill': CHILL_D, 'second': SECOND_D, 'third': THIRD_D, 'guide': GUIDE_D, 'winder_now': WOUND_D,
                             'core': CORE_D},
                 'loop_note': 'Real time: the 400 mm chill roll turns once per loop and the 200 mm rolls twice; one surface speed.'},
    'spec': {'basis': 'Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting',
             'screw_d_mm': 45, 'l_d': 30, 'die_width_mm': 500, 'air_gap_mm': 80, 'rolls_mm': '400 / 200 / 200, face 600',
             'pinning': 'air knife 550 mm', 'air_knife_retract_mm': OPEN * 1000, 'air_knife_cylinders': 2, 'chill_wrap_deg': 180, 'gauge': 'traversing O-frame 700 mm', 'edge_trim': True,
             'winder': '76 mm core to 500 mm, dancer with load cells',
             'sources': 'output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md'},
}

floor = kit.floor('Floor', ext['x_rear'] - .3, X_WIND + .7, -1.1, 1.0, M)
kit.studio_world(.8, 'studio.exr')
release = kit.hold_closed([nip])                     # the poster shows the running line
sc.frame_set(round(FRAMES * .4))
bpy.context.view_layer.update()
camera = kit.ortho_camera('Line camera', (centre[0] + 5, -10, 5.4), (centre[0], 0, .9), 8)
orientation = camera.rotation_euler.to_matrix()
right, up = orientation.col[0], orientation.col[1]
corners = [obj.matrix_world @ Vector(c) for obj in sc.objects if obj.type == 'MESH' and obj is not floor for c in obj.bound_box]
xs, ys = [p.dot(right) for p in corners], [p.dot(up) for p in corners]
camera.location += right * ((min(xs) + max(xs)) / 2 - camera.location.dot(right)) + up * ((min(ys) + max(ys)) / 2 - camera.location.dot(up))
camera.data.ortho_scale = max(max(xs) - min(xs), (max(ys) - min(ys)) * 16 / 9) * 1.06
kit.area_light('Key light', (centre[0] - 2.5, -5, 6), (centre[0], 0, .8), 1500, 6)
kit.area_light('Rim light', (centre[0] + 2.5, 4, 5), (centre[0], 0, .8), 650, 5, (.9, .95, 1))
kit.render_still(OUT / 'castfilm-motion-poster.png', 1280, 720, samples=48)
release()
for obj in [floor, camera] + [o for o in sc.objects if o.type == 'LIGHT']:
    bpy.data.objects.remove(obj, do_unlink=True)
sc.frame_set(0)
sc['motion_scope'] = 'Teaching rig; Pack B teaching dimensions, no OEM drawing, chill-roll temperature or pinning setting.'
sc['motion_controls'] = json.dumps(META['controls'], ensure_ascii=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'castfilm-motion.blend'), compress=True)
kit.export_glb(OUT / 'castfilm-motion.glb')
META['blender'] = bpy.app.version_string
META['groups'] = sorted({obj.get('motion_group') for obj in sc.objects if obj.get('motion_group')})
(OUT / 'castfilm-motion.json').write_text(json.dumps(META, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines.write_manifest()
print('CASTFILM_EXPORT_OK', flush=True)
