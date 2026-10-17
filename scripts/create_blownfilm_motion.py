"""Real-scale blown-film line (brand-neutral teaching model).

blender -b --factory-startup --python scripts/create_blownfilm_motion.py

Pack B blown-film base (grade C teaching values; output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md):
- D40 30D extruder feeding an 80 mm annular die through the side of its body, with a 240 mm OD air ring;
- BUR 2 gives a 160 mm bubble and a 251.3 mm lay-flat width (pi D / 2); the frost line sits 320 mm above the
  die (4 x die diameter);
- a stabilising cage (200 mm inside), 2.5 m from die to nip, a 700 mm collapsing frame and 100 mm nip rolls
  with a 350 mm face;
- the two-ply lay-flat film runs down the tower over guide rolls to a winder on a 76 mm core (shown at
  150 mm; up to 450 mm).
A steady bubble does not breathe, so the bubble keeps its BUR 2 shape at all times. An oscillating haul-off
is optional and not shown, and no PHA BUR or frost-line range is implied. The model runs in real time at
5 m/min: the nip rolls turn three times per loop and the winder twice.
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
LINE_SPEED = 5.0                                    # haul-off speed, m/min
V = LINE_SPEED / 60
NIP_D, GUIDE_D, WOUND_D, CORE_D = 100.0, 100.0, 150.0, 76.0
FRAMES = round(3 * math.pi * NIP_D / 1000 / V * FPS)
LOOP = FRAMES / FPS
TRAVEL = V * LOOP
turns_of = lambda d_mm: TRAVEL / (math.pi * d_mm / 1000)
TURNS = {'haul': 3, 'winder': 2, 'screw': 11}
for _d, _t in ((NIP_D, 3), (WOUND_D, 2)):
    assert abs(turns_of(_d) - _t) / _t < .006, (_d, turns_of(_d))
RPM = {'nip': 1000 * LINE_SPEED / (math.pi * NIP_D), 'winder_at_150': 1000 * LINE_SPEED / (math.pi * WOUND_D),
       'winder_at_450': 1000 * LINE_SPEED / (math.pi * 450), 'screw': TURNS['screw'] / LOOP * 60}

D, AX = .040, 1.00
DIE_R = .040                                        # 80 mm annular die
BUR = 2.0
BUBBLE_R = BUR * DIE_R                              # 160 mm bubble
LAYFLAT = math.pi * 2 * BUBBLE_R / 2                # 251.3 mm
FLH = .32                                           # frost line above the die
X_D = .55                                           # die axis
Z_DIE = 1.05                                        # die lip level
Z_NIP = Z_DIE + 2.5
Z_COLLAPSE = Z_NIP - .70
CAGE_R = .10
T = .0006                                           # drawn film thickness (exaggerated)
X_W = X_D + 1.30                                    # winder

kit.reset_scene('PHA blown film line')
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 0, FRAMES
M = kit.palette()
M['film'] = kit.material('Polymer / film (translucent)', '#3E8C5A', 0, .15, alpha=.42)
M['core'] = kit.material('Paper / winder core', '#B89A6A', 0, .85)

ext = kit.single_screw_extruder('Extruder', D, 30, 0.0, AX, M, FRAMES, TURNS['screw'], zones=4)   # schema zone1-zone4

# Annular die: side-fed spiral-mandrel body on a stand, lip ring and air ring
die = [kit.cylinder('Annular die body', (X_D, 0, Z_DIE - .14), .11, .26, 'Z', M['steel'], segments=48),
       kit.ring('Die lip', -.015, 0, DIE_R - .001, DIE_R + .012, (0, 0), M['chrome'], segments=48),
       kit.cylinder('Die mandrel', (X_D, 0, Z_DIE - .006), DIE_R - .002, .012, 'Z', M['steel_dark'], segments=48),
       kit.box('Die stand', (X_D, 0, (Z_DIE - .27) / 2), (.30, .30, Z_DIE - .27), M['paint_dark']),
       kit.tube_path('Melt pipe', [(.02, 0, AX), (X_D - .25, 0, AX), (X_D - .14, 0, Z_DIE - .18)], .03, M['steel']),
       kit.heater_band('Melt pipe heater', .2, .031, .05, M['heater'], M['ceramic'], (0, AX))]
lip = die[1]
lip.rotation_euler.y = -math.pi / 2
lip.location = (X_D, 0, Z_DIE)
for z in (Z_DIE - .22, Z_DIE - .12, Z_DIE - .05):
    die.append(kit.ring('Die heater band', z - .02, z + .02, .111, .118, (0, 0), M['heater'], segments=48))
    die[-1].rotation_euler.y = -math.pi / 2
    die[-1].location = (X_D, 0, 0)
air_ring = kit.ring('Air ring', 0, .05, DIE_R + .02, .12, (0, 0), M['paint_accent'], segments=48)
air_ring.rotation_euler.y = -math.pi / 2
air_ring.location = (X_D, 0, Z_DIE + .002)
die.append(air_ring)
die.append(kit.box('Air ring blower', (X_D - .60, .55, .30), (.40, .35, .45), M['paint_accent'], bevel=.01))
for k in range(4):
    a = TAU * (k + .5) / 4
    die.append(kit.hose('Air ring hose', (X_D + .12 * math.cos(a), .12 * math.sin(a), Z_DIE + .025), (X_D - .45, .45, .45), .025,
                        M['rubber'], sag=.15))
kit.join(die, 'AnnularDie')


# Bubble: neck and draw-down to the frost line, steady diameter in the cage, then an elliptical collapse to the
# lay-flat at the nip (the circumference is held constant through the collapsing frame).
def bubble_section(h):
    """(a, b): semi-axes of the bubble section along Y (lay-flat direction) and X at height h above the die."""
    if h <= FLH:
        f = h / FLH
        r = DIE_R + (BUBBLE_R - DIE_R) * (f * f * (3 - 2 * f))
        return r, r
    if h <= Z_COLLAPSE - Z_DIE:
        return BUBBLE_R, BUBBLE_R
    f = (h - (Z_COLLAPSE - Z_DIE)) / (Z_NIP - Z_COLLAPSE)
    a = BUBBLE_R + (LAYFLAT / 2 - BUBBLE_R) * f
    perimeter = TAU * BUBBLE_R
    # Ellipse perimeter (Ramanujan's second approximation, < 0.05 % off even when flat) held at the bubble circumference.
    lo, hi = 0.0, a
    for _ in range(40):
        b = (lo + hi) / 2
        h = ((a - b) / (a + b)) ** 2
        p = math.pi * (a + b) * (1 + 3 * h / (10 + math.sqrt(4 - 3 * h)))
        lo, hi = (b, hi) if p < perimeter else (lo, b)
    return a, max(b, T)


bm = bmesh.new()
rings, heights = [], [i / 40 * FLH for i in range(41)] + [FLH + (Z_NIP - Z_DIE - FLH) * i / 60 for i in range(1, 61)]
for h in heights:
    a, b = bubble_section(h)
    rings.append([bm.verts.new((X_D + b * math.sin(TAU * i / 64), a * math.cos(TAU * i / 64), Z_DIE + h)) for i in range(64)])
for r0, r1 in zip(rings, rings[1:]):
    for i in range(64):
        j = (i + 1) % 64
        bm.faces.new((r0[i], r0[j], r1[j], r1[i])).smooth = True
bubble = kit._finish('FilmBubble', bm, M['film'])

# Tower, cage, collapsing frame, nip, guide rolls and winder
tower = []
for dx in (-.45, .45):
    for dy in (-.45, .45):
        tower.append(kit.box('Tower column', (X_D + dx, dy, (Z_NIP + .35) / 2), (.08, .08, Z_NIP + .35), M['paint'], bevel=.006))
tower += [kit.box('Tower platform', (X_D, 0, Z_NIP - .25), (1.0, 1.0, .04), M['paint_dark']),
          kit.box('Tower top', (X_D, 0, Z_NIP + .35), (1.0, 1.0, .06), M['paint'])]
for side in (-1, 1):
    tower.append(kit.box('Platform rail', (X_D, side * .5, Z_NIP + .25), (1.0, .03, .03), M['warning']))
for z in [Z_DIE + FLH + .25 + .3 * k for k in range(4)]:
    tower.append(kit.ring('Cage ring', -.012, .012, CAGE_R, CAGE_R + .012, (0, 0), M['stainless'], segments=48))
    tower[-1].rotation_euler.y = -math.pi / 2
    tower[-1].location = (X_D, 0, z)
for k in range(6):
    a = TAU * k / 6
    tower.append(kit.box('Cage post', (X_D + (CAGE_R + .016) * math.cos(a), (CAGE_R + .016) * math.sin(a), Z_DIE + FLH + .70),
                         (.012, .012, 1.0), M['stainless']))
for side in (-1, 1):                                # collapsing frame slats converge on the nip
    x0, x1 = X_D + side * (BUBBLE_R + .01), X_D + side * (NIP_D / 2000 + .004)
    for k in range(6):
        y = -LAYFLAT / 2 + LAYFLAT * k / 5
        tower.append(kit.between('Collapsing slat', (x0, y, Z_COLLAPSE), (x1, y, Z_NIP - .06), .006, M['brass']))
    tower.append(kit.between('Collapsing frame rail', (x0, -.20, Z_COLLAPSE), (x1, -.20, Z_NIP - .06), .01, M['paint_dark']))
    tower.append(kit.between('Collapsing frame rail', (x0, .20, Z_COLLAPSE), (x1, .20, Z_NIP - .06), .01, M['paint_dark']))
kit.join(tower, 'Tower')
RN = NIP_D / 2000
# The film rises between the rolls: the left roll's +X side and the right roll's -X side both move up.
kit.roll('NipLeft', X_D - RN - T, Z_NIP, RN, .35, M, 'haul', 3, FRAMES, -1, mat=M['rubber'], joint=False)
kit.roll('NipRight', X_D + RN + T, Z_NIP, RN, .35, M, 'haul', 3, FRAMES, 1, mat=M['chrome'], joint=False)
RG = GUIDE_D / 2000
# The lay-flat rises from the nip tangent to the first top guide, runs across the tower top to the second guide,
# drops outside the tower columns, wraps under the lower guide and runs to the winder.
top_guide = (X_D + RG + T / 2, Z_NIP + .25)
top_guide2 = (X_D + .55, Z_NIP + .25)
low_guide = (top_guide2[0] + 2 * RG + T, .45)
FILM_Z = low_guide[1] - RG - T / 2
kit.roll('TowerGuideRoll', top_guide[0], top_guide[1], RG, .35, M, 'haul', turns_of(GUIDE_D), FRAMES, 1, mat=M['steel'], joint=False)
kit.roll('TowerGuideRoll2', top_guide2[0], top_guide2[1], RG, .35, M, 'haul', turns_of(GUIDE_D), FRAMES, 1, mat=M['steel'], joint=False)
kit.roll('LowerGuideRoll', low_guide[0], low_guide[1], RG, .35, M, 'haul', turns_of(GUIDE_D), FRAMES, -1, mat=M['steel'], joint=False)
RW = WOUND_D / 2000
winder = kit.roll('Winder', X_W, FILM_Z - T / 2 - RW, RW, LAYFLAT + .02, M, 'winder', 2, FRAMES, 1, mat=M['film'], marks=3,
                  joint=False)
kit.join([kit.cylinder('Winder core', (0, 0, 0), CORE_D / 2000, LAYFLAT + .12, 'X', M['core'], segments=32)], 'Winder_core').parent = winder
kit.join([kit.box('Winder stand', (X_W, side * .25, winder.location.z / 2), (.12, .05, winder.location.z), M['paint']) for side in (-1, 1)]
         + [kit.box('Winder motor', (X_W, .36, winder.location.z), (.16, .14, .16), M['paint_accent'], bevel=.008)], 'WinderStand')

# Lay-flat film: up out of the nip, over the top guide, down the tower, round the lower guide, to the winder.
top = Vector((X_D, 0, Z_NIP))
path = [top, Vector((X_D, 0, top_guide[1]))]
path += kit.arc_xz(top_guide[0], top_guide[1], RG + T / 2, 180, 90, 8)[1:]
path += kit.arc_xz(top_guide2[0], top_guide2[1], RG + T / 2, 90, 0, 8)
path += kit.arc_xz(low_guide[0], low_guide[1], RG + T / 2, 180, 270, 8)
path += [Vector((X_W, 0, FILM_Z))]
kit.web('FlattenedFilmWeb', path, LAYFLAT, T * 2, M['film'])

# Flow markers: pellets, melt in the screw, film meridian lines up the bubble, then along the lay-flat film
pellets = kit.catmull([(ext['throat_x'], 0, AX + .75), (ext['throat_x'], 0, AX + .35), (ext['throat_x'], 0, AX + .06)], 6)
kit.ride('FeedPellet', pellets, 8, kit.path_length(pellets) / 8, 2 * kit.path_length(pellets), M['pellet'], .005, FRAMES, 'pellet')
melt = [Vector((ext['throat_x'], 0, AX + D * .42)), Vector((-.01, 0, AX + D * .42))]
kit.ride('MeltMarker', melt, 12, kit.path_length(melt) / 12, 2 * kit.path_length(melt) / 12, M['polymer_marker'], .006, FRAMES)
for k, theta in enumerate((math.pi, math.pi / 2)):          # meridians facing the viewer: lay-flat edge (-Y) and +X
    meridian = []
    for h in heights:
        a, b = bubble_section(h)
        meridian.append(Vector((X_D + (b + .003) * math.sin(theta), (a + .003) * math.cos(theta), Z_DIE + h)))
    kit.ride('BubbleMarker%s' % 'AB'[k], meridian, math.ceil(kit.path_length(meridian) / (TRAVEL / 3)), TRAVEL / 3, TRAVEL,
             M['polymer_marker'], .008, FRAMES)
lay = [Vector((p.x, -LAYFLAT / 2 + .02, p.z)) for p in path]
kit.ride('FilmMarker', lay, math.ceil(kit.path_length(lay) / (TRAVEL / 3)), TRAVEL / 3, TRAVEL, M['polymer_marker'], .006, FRAMES)

kit.cabinet('Control cabinet', (ext['x_rear'] - .2, .45, 0), (ext['x_rear'] + .6, .85, 1.90), M)
kit.stack_light('Stack light', (ext['x_rear'] + .2, .65, 1.90), M)
kit.hmi_pedestal('Operator panel', (ext['x_rear'] + .3, -.70, 0), (ext['x_rear'] + .3, -.70, 1.42), M)
kit.bake_linear()

control = lines.control
centre = [(ext['x_rear'] + X_W + .3) / 2, 1.9, 0]
META = {
    'id': 'blownfilm', 'duration': LOOP, 'frames': [0, FRAMES],
    'poster': 'assets/equipment/blownfilm-motion-poster.png', 'model': 'assets/equipment/blownfilm-motion.glb',
    'center': centre, 'span': [X_W + .3 - ext['x_rear'] + .4, Z_NIP + .55], 'heightRatio': .62, 'zoom': [.7, 12],
    'controls': [control('screw', '스크류 회전각', 'Screw rotation angle', time_range=[0, LOOP]),
                 control('flow', '수지 표시 위치', 'Resin marker position', 100, '%', [0, LOOP]),
                 control('haul', '닙롤 회전각', 'Nip roll rotation angle', time_range=[0, LOOP]),
                 control('winder', '권취 롤 회전각', 'Winder rotation angle', 360, time_range=[0, LOOP])],
    'views': [{'key': 'all', 'label': ['전체 라인', 'Whole line'], 'center': centre, 'zoom': 1},
              kit.camera_view('screw', ['스크류·배럴 단면', 'Screw & barrel cutaway'], (-.6, 0, AX), (1.2, -6.0, 5.2), 3.4),
              kit.camera_view('die', ['환형 다이·에어링·동결선', 'Annular die, air ring & frost line'], (X_D, 0, Z_DIE + .15), (1.5, -6.0, 3.0), 5),
              kit.camera_view('finish', ['접힘·닙롤', 'Collapse & nip'], (X_D, 0, Z_NIP - .3), (1.5, -6.0, 2.0), 3.5)],
    'heat': {'input': 'process', 'reference': 'process',
             'title': ['배럴·다이 존 온도 (입력한 설정값)', 'Barrel and die zone temperatures (entered set points)'],
             'note': kit.PROCESS_HEAT_NOTE, 'scale_labels': {'melt': ['배럴·다이', 'Barrel & die'], 'tool': ['냉각 공기', 'Cooling air']},
             'zones': kit.extruder_heat(ext, ['zone1', 'zone2', 'zone3', 'zone4'])
             + [kit.heat_vband('die', 'die', ['환형 다이', 'Annular die'], X_D, 0, Z_DIE - .27, Z_DIE - .01, .125, full=True),
                kit.heat_vband('air', 'airTemp', ['에어링 공기', 'Air-ring air'], X_D, 0, Z_DIE + .002, Z_DIE + .052, .128, group='tool', full=True)]},
    'stages': [['용융 공급', 'Melt feed'], ['버블 성형·동결선', 'Bubble & frost line'], ['냉각·인취', 'Cool & haul off'],
               ['접힘·권취', 'Collapse & wind']],
    'turns': TURNS,
    'study': {'rpm': round(RPM['screw'], 1), 'speed': LINE_SPEED, 'diameter': NIP_D},
    'teaching': {'time_scale': 1, 'line_speed_m_min': LINE_SPEED, 'bur': BUR, 'die_mm': DIE_R * 2000, 'bubble_mm': BUBBLE_R * 2000,
                 'layflat_mm': round(LAYFLAT * 1000, 1), 'frost_line_mm': FLH * 1000, 'die_to_nip_mm': 2500, 'collapsing_mm': 700,
                 'cage_inside_mm': CAGE_R * 2000, 'rpm': {key: round(value, 3) for key, value in RPM.items()},
                 'roll_mm': {'nip': NIP_D, 'guide': GUIDE_D, 'winder_now': WOUND_D, 'core': CORE_D},
                 'loop_note': 'Real time: steady bubble (no breathing); the nip rolls turn three times per loop and the winder twice.'},
    'spec': {'basis': 'Pack B grade C teaching values; brand-neutral; not an OEM drawing or a PHA BUR or frost-line setting',
             'screw_d_mm': 40, 'l_d': 30, 'die_mm': 80, 'air_ring_od_mm': 240, 'bur': BUR, 'layflat_mm': round(LAYFLAT * 1000, 1),
             'frost_line_mm': 320, 'cage_inside_mm': 200, 'die_to_nip_mm': 2500, 'collapsing_mm': 700, 'nip_mm': '100, face 350',
             'oscillating_haul_off': 'optional, not shown', 'ibc': 'optional, not shown', 'winder': '76 mm core to 450 mm, two-ply lay-flat',
             'sources': 'output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md'},
}

floor = kit.floor('Floor', ext['x_rear'] - .3, X_W + .5, -.9, 1.0, M)
kit.studio_world(.8, 'studio.exr')
sc.frame_set(round(FRAMES * .4))
bpy.context.view_layer.update()
camera = kit.ortho_camera('Line camera', (centre[0] + 5, -10, 6.5), (centre[0], 0, 1.8), 8)
orientation = camera.rotation_euler.to_matrix()
right, up = orientation.col[0], orientation.col[1]
corners = [obj.matrix_world @ Vector(c) for obj in sc.objects if obj.type == 'MESH' and obj is not floor for c in obj.bound_box]
xs, ys = [p.dot(right) for p in corners], [p.dot(up) for p in corners]
camera.location += right * ((min(xs) + max(xs)) / 2 - camera.location.dot(right)) + up * ((min(ys) + max(ys)) / 2 - camera.location.dot(up))
camera.data.ortho_scale = max(max(xs) - min(xs), (max(ys) - min(ys)) * 16 / 9) * 1.06
kit.area_light('Key light', (centre[0] - 2.5, -5, 7), (centre[0], 0, 1.6), 1700, 6)
kit.area_light('Rim light', (centre[0] + 2.5, 4, 6), (centre[0], 0, 1.6), 700, 5, (.9, .95, 1))
kit.render_still(OUT / 'blownfilm-motion-poster.png', 1280, 720, samples=48)
for obj in [floor, camera] + [o for o in sc.objects if o.type == 'LIGHT']:
    bpy.data.objects.remove(obj, do_unlink=True)
sc.frame_set(0)
sc['motion_scope'] = 'Teaching rig; Pack B teaching dimensions, steady BUR 2 bubble, no PHA BUR, frost-line or cooling setting.'
sc['motion_controls'] = json.dumps(META['controls'], ensure_ascii=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'blownfilm-motion.blend'), compress=True)
kit.export_glb(OUT / 'blownfilm-motion.glb')
META['blender'] = bpy.app.version_string
META['groups'] = sorted({obj.get('motion_group') for obj in sc.objects if obj.get('motion_group')})
(OUT / 'blownfilm-motion.json').write_text(json.dumps(META, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines.write_manifest()
print('BLOWNFILM_EXPORT_OK', flush=True)
