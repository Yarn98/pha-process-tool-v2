"""Real-scale co-rotating twin-screw compounding line (brand-neutral teaching model).

blender -b --factory-startup --python scripts/create_compounding_motion.py

Dimensions follow output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md. They are grade C
teaching values unless noted, not an OEM drawing:
- D32 screws over 40D in ten 4D barrel blocks, with self-wiping bilobal elements;
- torque-splitting gearbox and a loss-in-weight main feeder;
- side feeder at B5, atmospheric vent at B4, and a vacuum vent at B9 with its condensate trap and pump skid;
- a strand die with six 3 mm holes, a 2 m water bath and an air knife;
- an enclosed strand pelletiser (80 mm feed roll, 8-blade 100 mm rotor) and a classifier.
Every speed uses one teaching time scale of 0.1x. The base values are a 120 rpm screw, a 60 rpm side feeder,
6 m/min strands and 3 mm pellets.
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
import create_line_models as lines  # noqa: E402  (control schema and equipment-models.js writer)

OUT = ROOT / 'assets/equipment'
TAU = math.tau
MM = .001

# ------------------------------------------------------------------ teaching kinematics
FPS = 24
FRAMES = 603                      # 25.125 s loop: the pelletiser feed roll turns once
LOOP = FRAMES / FPS
TIME_SCALE = .1                   # one scale for every speed (Pack B)
LINE_SPEED = 6.0                  # strand speed, m/min
PELLET = 3.0                      # cut length, mm
EDGES = 8                         # effective cuts per rotor revolution per strand
FEED_ROLL = 80.0                  # feed roll diameter, mm
RPM = {'screw': 120.0, 'side': 60.0,
       'haul': 1000 * LINE_SPEED / (math.pi * FEED_ROLL),       # n = 1000 v / (pi d)
       'cutter': 1000 * LINE_SPEED / (EDGES * PELLET)}           # n_r = 1000 v / (z L_p)
# Whole turns per loop keep playback seamless. Each is within 0.6 % of the scaled speed and a multiple of
# the part's symmetry (bilobal screws: half a turn, eight blades: an eighth).
TURNS = {'screw': 5, 'side': 2.5, 'haul': 1, 'cutter': 10.5}
for _key, _turns in TURNS.items():
    _exact = RPM[_key] * TIME_SCALE * LOOP / 60
    assert abs(_turns - _exact) / _exact < .006, (_key, _exact)
STRAND_TRAVEL = LINE_SPEED * TIME_SCALE * LOOP / 60     # metres a strand advances per loop

# --------------------------------------------------------------------------- geometry
D = 32 * MM
AX = 1.00                         # screw shaft height (Pack B: 900-1100 mm)
FRAME_TOP = .70
CENTRE = 26.32 * MM               # centre distance (Do + Di) / 2 with Do/Di = 1.55
RO, RI = D / 2, CENTRE - D / 2    # profile tip and root radii (self-wiping, before clearance)
CLEAR = .985                      # radial scale: visible screw-screw and screw-barrel clearance
BORE = 16.6 * MM                  # barrel bore radius
BLOCK = 4 * D                     # 128 mm barrel block; ten blocks = 40D
X_END = 10 * BLOCK                # 1.28 m: end of the processing section
BLOCK_W, BLOCK_H = .140, .120
Y_A, Y_B = -CENTRE / 2, CENTRE / 2   # screw A on the operator side (-Y)
# Functional layout (Pack B, C): feed 0-4D, melting 4-12D, atmospheric vent 12-16D, side feed 16-20D,
# mixing 20-28D, melt seal 28-32D, vacuum 32-36D, pressure build-up 36-40D.
# (kind, length mm, pitch mm | disc stagger deg). C = conveying, L = left-handed (reverse), KB = kneading.
ELEMENTS = [('C', 128, 48), ('C', 128, 32), ('C', 64, 32), ('KB', 32, 45), ('KB', 32, 45),
            ('C', 128, 48), ('C', 128, 48), ('C', 96, 32), ('KB', 32, 45), ('KB', 32, 45),
            ('KB', 32, 90), ('C', 64, 32), ('KB', 32, 90), ('L', 32, 16), ('C', 64, 32),
            ('C', 128, 48), ('C', 64, 32), ('C', 64, 16)]
assert sum(e[1] for e in ELEMENTS) == 1280
# Degree of fill shown in the cutaway: restrictive elements run full, conveying and vent zones starved.
FILL = [(.256, .320, .35), (.320, .384, 1), (.384, .736, .35), (.736, .832, 1), (.832, .896, .35),
        (.896, .960, 1), (.960, 1.152, .3), (1.152, X_END, 1)]
VENTS = {'feed': 0, 'atmospheric': 3, 'side': 4, 'vacuum': 8}    # barrel block index (B1 = 0)
CUT_BLOCKS = (1, 2, 4, 5, 6, 7, 9)                               # front-top quadrant removed
STRAND_Y = [(-2.5 + i) * 12 * MM for i in range(6)]              # six holes, 12 mm pitch
STRAND_R = 1.5 * MM
WATER = .86                       # bath water level
BATH = (1.62, 3.62)               # 2 m bath (inner)
FEED_X, NIP_Z = 4.36, 1.0         # feed roll centre and strand plane at the nip
ROLL_R = FEED_ROLL / 2 * MM
KNIFE_X = 4.41
ROTOR = (4.445, 1.035)            # rotor axis (x, z): blade tips pass the bed knife edge
ROTOR_R = .05


# ------------------------------------------------------------------------ helpers
PSI = math.pi / 2 - 2 * math.acos(CENTRE / D)          # tip (= root) arc angle of the bilobal profile
GAMMA = PSI / 2 - (math.pi - 2 * math.acos(CENTRE / D))  # flank-arc centre angle (other rotor's tip)


def lobe_radius(theta):
    """Erdmenger self-wiping bilobal profile: a tip arc of radius Ro, a root arc of radius Ri, and flank arcs.

    Each flank arc has a radius equal to the centre distance and is centred on the mating rotor's tip
    corner (Booy 1978).
    """
    t = theta % math.pi
    t = min(t, math.pi - t)
    if t <= PSI / 2:
        return RO
    if t >= math.pi / 2 - PSI / 2:
        return RI
    delta = t - GAMMA
    return RO * math.cos(delta) + math.sqrt(CENTRE ** 2 - (RO * math.sin(delta)) ** 2)


POINTS = 32


def profile_ring(bm, x, angle, scale=1.0):
    """Profile vertices at axial position x (local frame, axis = X), turned by ``angle``."""
    ring = []
    for i in range(POINTS):
        theta = TAU * i / POINTS
        r = scale * CLEAR * lobe_radius(theta - angle)
        ring.append(bm.verts.new((x, r * math.cos(theta), r * math.sin(theta))))
    return ring


def bridge(bm, a, b):
    for i in range(POINTS):
        j = (i + 1) % POINTS
        bm.faces.new((a[i], a[j], b[j], b[i])).smooth = True


def cap(bm, ring, flip=False):
    bm.faces.new(list(reversed(ring)) if flip else ring)


def screw_mesh(name, elements, phase, rings_per_pitch=12, scale=1.0):
    """One screw (local frame, axis = X from 0): conveying twist k = +2 pi / pitch conveys +X for the
    negative rotation used by every rig; reverse elements twist the other way; kneading discs are
    staggered forward (+angle) or neutral (90 deg)."""
    bm = bmesh.new()
    x, angle = 0.0, phase
    for kind, length_mm, value in elements:
        length = length_mm * MM * scale
        if kind == 'KB':
            width = length / 5
            for disc in range(5):
                a = profile_ring(bm, x + disc * width, angle, scale)
                b = profile_ring(bm, x + (disc + 1) * width - .0002 * scale, angle, scale)
                bridge(bm, a, b)
                cap(bm, a, True)
                cap(bm, b)
                angle += math.radians(value)
            x += length
            continue
        pitch = value * MM * scale
        k = (1 if kind == 'C' else -1) * TAU / pitch
        rings = max(4, round(length / pitch * rings_per_pitch))
        previous = first = None
        for step in range(rings + 1):
            xi = x + length * step / rings
            ring = profile_ring(bm, xi, angle + k * (xi - x), scale)
            if previous:
                bridge(bm, previous, ring)
            else:
                first = ring
            previous = ring
        cap(bm, first, True)
        cap(bm, previous)
        angle += k * length
        x += length
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    try:
        mesh.set_sharp_from_angle(angle=math.radians(50))
    except AttributeError:
        pass
    return kit.link(obj)


def figure8(fill):
    """Outline (y, z) of the twin bore filled to ``fill`` of its height (1 = full)."""
    span = CENTRE / 2 + BORE
    top = AX - BORE + 2 * BORE * fill
    ys = [-span + 2 * span * i / 60 for i in range(61)]

    def lower(y):
        return AX - max(math.sqrt(max(0.0, BORE ** 2 - (y - c) ** 2)) for c in (Y_A, Y_B))

    def upper(y):
        return AX + max(math.sqrt(max(0.0, BORE ** 2 - (y - c) ** 2)) for c in (Y_A, Y_B))
    bottom = [(y, lower(y)) for y in ys if lower(y) < top]
    if fill >= 1:
        return bottom + [(y, upper(y)) for y in reversed(ys)][1:-1]
    return bottom + [(bottom[-1][0], top), (bottom[0][0], top)]


# ---------------------------------------------------------------------------- build
kit.reset_scene('PHA compounding line')
sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 0, FRAMES
M = kit.palette()
M['melt'] = kit.material('Polymer / melt (translucent)', '#3E8C5A', 0, .22, alpha=.5)
M['water'] = kit.material('Water / strand bath', '#5E9EA6', 0, .05, alpha=.3)
M['carton'] = kit.material('Carton / octabin', '#B89A6A', 0, .85)
M['knurl'] = kit.material('Steel / knurled roll', '#9EA3A6', 1, .5)

# Base frame, motor, coupling, gearbox and lantern (x < 0)
frame_parts = [kit.box('Base frame top', (.05, 0, FRAME_TOP - .02), (2.9, .80, .04), M['paint_dark'], bevel=.006)]
for x0, x1 in ((-1.40, -.45), (-.45, .50), (.50, 1.45)):
    frame_parts.append(kit.louvre_panel('Base skirt', x0 + .02, x1 - .02, .10, FRAME_TOP - .06, -.401, M, slots=5))
    frame_parts.append(kit.box('Base skirt rear', ((x0 + x1) / 2, .399, FRAME_TOP / 2), (x1 - x0 - .04, .006, FRAME_TOP - .14),
                               M['paint_dark'], bevel=.002))
for x in (-1.36, -.45, .50, 1.41):
    for y in (-.36, .36):
        frame_parts.append(kit.box('Base leg', (x, y, FRAME_TOP / 2), (.06, .06, FRAME_TOP - .06), M['paint_dark']))
        frame_parts.append(kit.leveling_mount('Base mount', (x, y, 0), M))
kit.join(frame_parts, 'BaseFrame')

drive = [kit.box('Motor base', (-1.03, 0, .725), (.62, .36, .05), M['steel_dark'])]
drive.append(kit.motor('Main motor', (-1.03, 0, .95), .20, .55, 1, M))
drive.append(kit.cylinder('Coupling guard', (-.625, 0, .95), .09, .15, 'X', M['warning']))
for k in range(6):   # built on the guard axis, then turned about it
    slot = kit.box('Coupling guard slot', (0, 0, .091), (.11, .012, .004), M['black'], bevel=0)
    slot.location = (-.625, 0, .95)
    slot.rotation_euler.x = TAU * k / 6
    drive.append(slot)
gear = [kit.box('Gearbox housing', (-.325, 0, .925), (.45, .38, .45), M['paint'], bevel=.012, segments=2),
        kit.box('Gearbox split flange', (-.325, 0, AX - .02), (.462, .392, .03), M['paint'], bevel=.004),
        kit.cylinder('Gearbox input bearing cap', (-.555, 0, .95), .075, .02, 'X', M['steel_dark']),
        kit.cylinder('Gearbox sight glass', (-.40, -.191, .80), .022, .006, 'Y', M['smoked']),
        kit.cylinder('Gearbox breather', (-.20, .08, 1.17), .015, .04, 'Z', M['steel']),
        kit.cylinder('Gearbox breather cap', (-.20, .08, 1.195), .024, .012, 'Z', M['black'])]
for x in (-.50, -.15):
    gear.append(kit.ring('Gearbox lifting eye', x - .006, x + .006, .018, .026, (0, 1.175), M['steel'], segments=20))
for i in range(8):
    gear.append(kit.cap_screw('Gearbox flange screw', (-.53 + i * .06, -.197, AX - .02), 'Y', .012, -1, M['steel']))
gear.append(kit.box('Gearbox nameplate', (-.27, -.191, .87), (.10, .004, .06), M['stainless'], bevel=0))
drive += gear
lantern = [kit.box('Lantern bottom', (-.05, 0, AX - .075), (.10, .18, .02), M['paint']),
           kit.box('Lantern top', (-.05, 0, AX + .075), (.10, .18, .02), M['paint']),
           kit.box('Lantern rear wall', (-.05, .085, AX), (.10, .01, .13), M['paint']),
           kit.box('Lantern window', (-.05, -.088, AX), (.08, .004, .11), M['smoked'], bevel=0)]
drive += lantern
kit.join(drive, 'DriveTrain')
kit.join([kit.cylinder('Splined shaft', (-.06, y, AX), .0085, .12, 'X', M['steel']) for y in (Y_A, Y_B)], 'SplinedShafts')

# Twin screws (rotating) ------------------------------------------------------------------
screws = {}
for name, y, phase in (('ScrewA', Y_A, 0.0), ('ScrewB', Y_B, math.pi / 2)):
    owner = kit.empty(name, (0, y, AX), group='screw')
    body = screw_mesh(name + '_elements', ELEMENTS, phase)
    tip = kit.cylinder(name + '_tip', (X_END + .006, 0, 0), .0095, .012, 'X', M['steel'], radius2=.004)
    body.data.materials.append(M['steel'])
    body.parent = owner
    tip.parent = owner
    kit.spin(owner, 'screw', TURNS['screw'], FRAMES)
    screws[name] = owner

# Barrel blocks (one mesh: ten blocks share nine materials, so the viewer issues nine draw calls, not ninety)
blocks = []
for i in range(10):
    x0 = i * BLOCK
    xc = x0 + BLOCK / 2
    block = kit.box('Barrel B%d' % (i + 1), (xc, 0, AX), (BLOCK - .003, BLOCK_W, BLOCK_H), M['cast'], bevel=.003)
    cutters = [kit.cylinder('bore', (xc, y, AX), BORE, BLOCK + .02, 'X', M['steel_dark'], segments=48) for y in (Y_A, Y_B)]
    if i in CUT_BLOCKS:
        cutters.append(kit.box('quadrant', (xc, (-BLOCK_W / 2 - .01 + Y_B) / 2, AX + BLOCK_H / 4 + .005),
                               (BLOCK + .02, Y_B + BLOCK_W / 2 + .01, BLOCK_H / 2 + .01), M['section'], bevel=0))
    if i in (VENTS['feed'], VENTS['atmospheric'], VENTS['vacuum']):
        cutters.append(kit.box('port', (xc, 0, AX + BLOCK_H / 4), (.07 if i == 0 else .06, .05, BLOCK_H / 2 + .01),
                               M['section'], bevel=0))
    if i == VENTS['side']:
        cutters.append(kit.box('side port', (xc, BLOCK_W / 4, AX), (.06, BLOCK_W / 2 + .01, .05), M['section'], bevel=0))
    kit.subtract(block, cutters)
    details = [block]
    for x in (x0 + .002, x0 + BLOCK - .002):
        details.append(kit.box('Barrel joint', (x, 0, AX), (.004, BLOCK_W + .006, BLOCK_H + .006), M['steel_dark'], bevel=.001))
    for y in (-.058, .058):
        for z in (AX - .048, AX + .048):
            if i in CUT_BLOCKS and y < 0 and z > AX:
                continue
            details.append(kit.cap_screw('Barrel tie screw', (x0 + BLOCK - .012, y, z), 'X', .010, 1, M['steel']))
    if i > 0:   # B1 is water-cooled only; the others carry cartridge heaters underneath
        for x in (xc - .03, xc + .03):
            details.append(kit.cylinder('Cartridge heater', (x, -.02, AX - BLOCK_H / 2 - .012), .0065, .026, 'Z', M['heater']))
            details.append(kit.cylinder('Heater lead', (x, -.02, AX - BLOCK_H / 2 - .03), .003, .016, 'Z', M['cable']))
        details.append(kit.cylinder('Thermocouple', (xc, .045, AX + BLOCK_H / 2 + .014), .004, .03, 'Z', M['copper']))
        details.append(kit.box('Thermocouple head', (xc, .045, AX + BLOCK_H / 2 + .032), (.018, .014, .012), M['black'], bevel=.002))
    for z, hose in ((AX - .035, 'hose_blue'), (AX - .010, 'hose_red')):
        details.append(kit.cylinder('Cooling fitting', (xc, BLOCK_W / 2 + .008, z), .006, .016, 'Y', M['brass']))
    blocks.append(kit.join(details, 'Barrel B%d' % (i + 1)))
kit.join(blocks, 'BarrelBlocks')

manifold = []
for z, mat, dz in ((.80, 'hose_blue', AX - .035), (.84, 'hose_red', AX - .010)):
    manifold.append(kit.cylinder('Cooling manifold', (.64, .16, z), .012, 1.30, 'X', M['stainless'], segments=16))
    for i in range(10):
        xc = i * BLOCK + BLOCK / 2
        manifold.append(kit.hose('Cooling hose', (xc, BLOCK_W / 2 + .016, dz), (xc, .16, z + .012), .005, M[mat], sag=.02))
kit.join(manifold, 'CoolingManifold')
supports = [kit.box('Barrel support', (x, 0, (FRAME_TOP + AX - BLOCK_H / 2) / 2), (.02, .14, AX - BLOCK_H / 2 - FRAME_TOP),
                    M['paint_dark']) for x in (.256, .768, 1.216)]
kit.join(supports, 'BarrelSupports')

# Melt in the cutaway: full behind restrictive elements, starved under vents and conveying sections.
for n, (x0, x1, fill) in enumerate(FILL):
    kit.prism('Melt %02d' % n, figure8(fill), x0 + .001, x1 - .001, M['melt'])

# Loss-in-weight main feeder (rear stand) into the B1 throat
feeder = [kit.cylinder('Feed throat', (.064, 0, AX + .10), .05, .08, 'Z', M['stainless'], radius2=.035),
          kit.cylinder('Feed bellows', (.064, 0, AX + .17), .032, .06, 'Z', M['rubber'], segments=20)]
for dz in (.15, .165, .18, .195):
    feeder.append(kit.ring('Bellows fold', .060, .068, .032, .037, (0, 0), M['rubber'], segments=20))
    feeder[-1].rotation_euler.y = -math.pi / 2
    feeder[-1].location = (.064, 0, AX + dz)
feeder.append(kit.tube_path('Feeder drop pipe', [(.064, 0, AX + .20), (.064, .02, AX + .30), (.064, .10, AX + .36),
                                                 (.064, .18, AX + .37)], .03, M['stainless']))
feeder.append(kit.cylinder('Feeder screw tube', (.064, .38, AX + .37), .035, .42, 'Y', M['stainless']))
feeder.append(kit.box('Feeder drive', (.064, .64, AX + .37), (.16, .12, .14), M['paint_accent'], bevel=.008))
feeder.append(kit.motor('Feeder motor', (0, 0, 0), .05, .12, 1, M))
feeder[-1].location = (.064, .76, AX + .37)
feeder[-1].rotation_euler.z = math.pi / 2
feeder.append(kit.cylinder('LIW hopper cone', (.064, .55, AX + .52), .05, .16, 'Z', M['stainless'], radius2=.15, segments=40))
feeder.append(kit.cylinder('LIW hopper body', (.064, .55, AX + .71), .15, .22, 'Z', M['stainless'], segments=40))
feeder.append(kit.cylinder('LIW hopper lid', (.064, .55, AX + .83), .155, .02, 'Z', M['steel']))
feeder.append(kit.cylinder('Refill receiver', (.064, .55, AX + .92), .07, .16, 'Z', M['stainless'], segments=28))
feeder.append(kit.cylinder('Refill valve', (.064, .55, AX + .855), .045, .03, 'Z', M['steel_dark']))
feeder.append(kit.box('Weighing platform', (.064, .64, AX + .21), (.50, .50, .03), M['paint_dark']))
for dx, dy in ((-.2, -.2), (.2, -.2), (0, .2)):
    feeder.append(kit.box('Load cell', (.064 + dx, .64 + dy, AX + .24), (.05, .03, .03), M['steel'], bevel=.003))
feeder.append(kit.box('Feeder bridge', (.064, .55, AX + .27), (.26, .40, .03), M['paint'], bevel=.004))
for dx in (-.22, .22):
    for dy in (.42, .86):
        feeder.append(kit.box('Feeder stand leg', (.064 + dx, dy, (AX + .195) / 2), (.04, .04, AX + .195), M['paint']))
kit.join(feeder, 'LossInWeightFeeder')

# Atmospheric vent (B4) and vacuum vent (B9) with trap and pump skid
xa = VENTS['atmospheric'] * BLOCK + BLOCK / 2
vent = [kit.box('Vent chimney wall', (xa, -.032, AX + .11), (.07, .004, .10), M['stainless'], bevel=0),
        kit.box('Vent chimney wall', (xa, .032, AX + .11), (.07, .004, .10), M['stainless'], bevel=0),
        kit.box('Vent chimney wall', (xa - .037, 0, AX + .11), (.004, .068, .10), M['stainless'], bevel=0),
        kit.box('Vent chimney wall', (xa + .037, 0, AX + .11), (.004, .068, .10), M['stainless'], bevel=0)]
lid = kit.box('Vent lid', (xa, .03, AX + .17), (.08, .07, .006), M['smoked'], bevel=0)
lid.rotation_euler.x = math.radians(35)
vent.append(lid)
kit.join(vent, 'AtmosphericVent')
xv = VENTS['vacuum'] * BLOCK + BLOCK / 2
vac = [kit.box('Vacuum vent insert', (xv, 0, AX + .075), (.07, .06, .03), M['stainless']),
       kit.cylinder('Vacuum dome', (xv, 0, AX + .13), .05, .08, 'Z', M['stainless'], segments=32),
       kit.cylinder('Vacuum sight glass', (xv, 0, AX + .172), .035, .006, 'Z', M['smoked']),
       kit.cylinder('Vacuum gauge', (xv + .04, -.045, AX + .15), .022, .012, 'Y', M['black']),
       kit.cylinder('Vacuum gauge face', (xv + .04, -.052, AX + .15), .019, .002, 'Y', M['paint']),
       kit.tube_path('Vacuum line', [(xv, .035, AX + .14), (xv, .12, AX + .30), (xv + .05, .40, AX + .32),
                                     (xv + .10, .62, AX + .12), (xv + .10, .66, .78)], .022, M['stainless']),
       kit.cylinder('Condensate trap', (xv + .10, .66, .55), .075, .40, 'Z', M['stainless'], segments=32),
       kit.cylinder('Trap lid', (xv + .10, .66, .76), .085, .03, 'Z', M['steel']),
       kit.cylinder('Trap drain valve', (xv + .10, .66, .32), .02, .06, 'Z', M['brass'])]
for dx, dy in ((-.06, -.06), (.06, -.06), (-.06, .06), (.06, .06)):
    vac.append(kit.box('Trap leg', (xv + .10 + dx, .66 + dy, .17), (.025, .025, .34), M['paint_dark']))
vac += [kit.box('Pump skid', (xv + .25, 1.00, .03), (.60, .40, .06), M['paint_dark']),
        kit.cylinder('Liquid-ring pump', (xv + .15, 1.00, .20), .10, .18, 'X', M['paint_accent'], segments=32)]
vac.append(kit.motor('Vacuum pump motor', (xv + .40, 1.00, .20), .09, .22, -1, M))
vac.append(kit.cylinder('Separator tank', (xv + .00, 1.10, .30), .07, .40, 'Z', M['stainless'], segments=24))
vac.append(kit.tube_path('Pump suction', [(xv + .10, .66, .33), (xv + .10, .80, .26), (xv + .15, .95, .22)], .02, M['stainless']))
kit.join(vac, 'VacuumSystem')

# Side feeder at B5 (from the rear, +Y), cut open from above
xs = VENTS['side'] * BLOCK + BLOCK / 2
side = [kit.box('Side feeder trough', (xs, .38, AX - .04), (.11, .62, .02), M['cast']),
        kit.box('Side feeder wall', (xs - .052, .38, AX), (.012, .62, .09), M['cast']),
        kit.box('Side feeder wall', (xs + .052, .38, AX), (.012, .62, .09), M['cast']),
        kit.box('Side feeder cover', (xs, .55, AX + .05), (.11, .28, .008), M['smoked'], bevel=0),
        kit.box('Side feeder flange', (xs, .075, AX), (.13, .012, .11), M['steel_dark']),
        kit.box('Side feeder gearbox', (xs, .76, AX), (.15, .14, .15), M['paint'], bevel=.008),
        kit.cylinder('Side feeder inlet', (xs, .58, AX + .10), .045, .10, 'Z', M['stainless']),
        kit.cylinder('Side feeder hopper', (xs, .58, AX + .23), .045, .16, 'Z', M['stainless'], radius2=.11, segments=32),
        kit.box('Side feeder stand', (xs, .76, (FRAME_TOP + AX - .075) / 2 - .2), (.08, .08, AX - .075 + .4 - FRAME_TOP),
                M['paint_dark'])]
side.append(kit.motor('Side feeder motor', (0, 0, 0), .07, .18, 1, M))
side[-1].location = (xs, .94, AX)
side[-1].rotation_euler.z = -math.pi / 2
kit.join(side, 'SideFeeder')
SIDE_D, SIDE_A = .028 / D, .0116
for name, dx, phase in (('SideScrewA', -SIDE_A, 0.0), ('SideScrewB', SIDE_A, math.pi / 2)):
    owner = kit.empty(name, (xs + dx, .66, AX), group='side')
    owner.rotation_euler.z = -math.pi / 2          # local +X points to -Y: toward the main barrel
    body = screw_mesh(name + '_elements', [('C', round(.58 / SIDE_D / MM), 32)], phase, 6, SIDE_D)
    body.data.materials.append(M['steel'])
    body.parent = owner
    kit.spin(owner, 'side', TURNS['side'], FRAMES)

# Adapter, melt sensors and strand die
die = [kit.cylinder('Adapter', (X_END + .048, 0, AX), .06, .096, 'X', M['steel'], segments=40),
       kit.box('Adapter flange', (X_END + .006, 0, AX), (.012, BLOCK_W + .01, BLOCK_H + .01), M['steel_dark']),
       kit.heater_band('Adapter heater', X_END + .05, .061, .05, M['heater'], M['ceramic'], (0, AX))]
for x, label, head in ((X_END + .025, 'Melt pressure P', .014), (X_END + .07, 'Melt temperature T', .009)):
    die.append(kit.cylinder(label + ' stem', (x, 0, AX + .08), .005, .05, 'Z', M['stainless']))
    die.append(kit.cylinder(label + ' head', (x, 0, AX + .12), head, .035, 'Z', M['stainless'] if head > .01 else M['copper']))
    die.append(kit.cylinder(label + ' connector', (x, 0, AX + .145), .007, .02, 'Z', M['black']))
x0 = X_END + .096
die.append(kit.box('Strand die body', (x0 + .045, 0, AX), (.09, .16, .07), M['steel'], bevel=.004))
for z in (AX + .038, AX - .038):
    die.append(kit.box('Die plate heater', (x0 + .045, 0, z), (.08, .15, .008), M['heater'], bevel=.002))
die.append(kit.box('Die heater terminal', (x0 + .045, .06, AX + .05), (.03, .03, .02), M['ceramic']))
for y in STRAND_Y:
    die.append(kit.cylinder('Die hole', (x0 + .0905, y, AX), STRAND_R * 1.15, .002, 'X', M['black'], segments=12))
die.append(kit.box('Die support', (x0 + .045, 0, (FRAME_TOP + AX - .035) / 2 - .05), (.06, .10, AX - .035 - FRAME_TOP + .1),
                   M['paint_dark']))
kit.join(die, 'AdapterAndDie')
DIE_FACE = x0 + .091

# Strand path: die -> under two submerged guide rolls -> over the exit roll -> air knife -> feed rolls
strand_controls = [(DIE_FACE, AX), (1.50, AX - .006), (1.57, .95), (1.64, .87), (1.75, WATER - .0665),
                   (2.62, WATER - .0665), (3.30, WATER - .045), (3.52, .895), (3.58, .9065), (3.70, .935),
                   (3.95, .975), (4.20, .996), (KNIFE_X, NIP_Z)]
for y in STRAND_Y:
    path = kit.catmull([(x, y, z) for x, z in strand_controls])
    kit.tube_path('Strand', path, STRAND_R, M['polymer'], resolution=1, bevel_resolution=1)
bath = [kit.box('Bath floor', ((BATH[0] + BATH[1]) / 2, 0, WATER - .122), (2.006, .306, .003), M['stainless'], bevel=0)]
for y in (-.153, .153):
    bath.append(kit.box('Bath side', ((BATH[0] + BATH[1]) / 2, y, WATER - .05), (2.006, .003, .145), M['stainless'], bevel=0))
    bath.append(kit.box('Bath rim', ((BATH[0] + BATH[1]) / 2, y * 1.08, WATER + .022), (2.02, .025, .003), M['stainless'], bevel=0))
for x in BATH:
    bath.append(kit.box('Bath end', (x, 0, WATER - .05), (.003, .306, .145), M['stainless'], bevel=0))
for x in (1.70, 2.62, 3.54):
    for y in (-.13, .13):
        bath.append(kit.box('Bath leg', (x, y, (WATER - .124) / 2), (.03, .03, WATER - .124), M['stainless']))
bath += [kit.box('Bath water', ((BATH[0] + BATH[1]) / 2, 0, WATER - .061), (1.994, .300, .118), M['water'], bevel=0),
         kit.hose('Bath supply', (1.70, -.15, WATER - .02), (1.70, -.45, .05), .012, M['hose_blue'], sag=.05),
         kit.cylinder('Bath drain valve', (3.58, .16, WATER - .10), .015, .05, 'Y', M['brass']),
         kit.tube_path('Bath overflow', [(3.58, .19, WATER - .10), (3.58, .26, WATER - .2), (3.58, .26, .05)], .014, M['stainless'])]
kit.join(bath, 'WaterBath')
rolls = []
for x, z in ((1.75, WATER - .0665 + STRAND_R + .025), (2.62, WATER - .0665 + STRAND_R + .025), (3.58, .9065 - STRAND_R - .025)):
    rolls.append(kit.cylinder('Bath guide roll', (x, 0, z), .025, .29, 'Y', M['stainless'], segments=24))
    for y in (-.15, .15):
        rolls.append(kit.box('Guide roll bracket', (x, y, (z + WATER + .03) / 2), (.02, .006, WATER + .03 - z + .03), M['stainless']))
kit.join(rolls, 'BathGuideRolls')
knife = []
for z in (.975 + .03, .975 - .03):
    knife.append(kit.box('Air knife manifold', (3.92, 0, z), (.05, .20, .025), M['stainless'], bevel=.004))
    knife.append(kit.box('Air knife slot', (3.92, 0, z - .0125 * (1 if z > .975 else -1)), (.004, .18, .002), M['black'], bevel=0))
knife += [kit.box('Air knife stand', (3.92, .13, .48), (.04, .04, .96), M['paint_dark']),
          kit.box('Air knife collector', (3.92, 0, .90), (.30, .22, .02), M['stainless'], bevel=0),
          kit.box('Blower', (3.92, .55, .20), (.30, .30, .40), M['paint_accent'], bevel=.01),
          kit.hose('Air knife hose', (3.92, .10, 1.005), (3.92, .48, .38), .016, M['rubber'], sag=.12)]
kit.join(knife, 'AirKnife')

# Strand pelletiser (enclosed): feed rolls, bed knife, 8-blade rotor
housing = [kit.box('Pelletiser rear wall', (4.52, .21, 1.02), (.56, .02, .54), M['paint'], bevel=.006),
           kit.box('Pelletiser top', (4.52, .02, 1.30), (.56, .40, .02), M['paint'], bevel=.006),
           kit.box('Pelletiser base', (4.52, .02, .75), (.56, .40, .02), M['paint'], bevel=.006),
           kit.box('Pelletiser inlet wall', (4.25, .02, 1.02), (.02, .40, .54), M['paint'], bevel=.004),
           kit.box('Pelletiser end wall', (4.79, .02, 1.02), (.02, .40, .54), M['paint'], bevel=.004),
           kit.box('Strand inlet slot', (4.243, 0, NIP_Z), (.006, .10, .012), M['black'], bevel=0),
           kit.box('Strand guide comb', (4.28, 0, NIP_Z - .008), (.04, .10, .01), M['brass'], bevel=.002),
           kit.box('Bed knife', (KNIFE_X - .015, 0, NIP_Z - .011), (.03, .13, .02), M['chrome'], bevel=.002),
           kit.box('Bed knife holder', (KNIFE_X - .03, 0, NIP_Z - .04), (.06, .14, .04), M['steel_dark'])]
housing.append(kit.guard_panel('Pelletiser window', 4.26, 4.78, .76, 1.29, -.18, M, handle=True))
for dx in (-.25, .25):
    for dy in (-.15, .19):
        housing.append(kit.box('Pelletiser leg', (4.52 + dx, dy, .37), (.04, .04, .74), M['paint_dark']))
housing += [kit.box('Rotor belt guard', (4.47, .26, .92), (.14, .06, .30), M['paint_accent'], bevel=.01),
            kit.box('Feed roll gearmotor', (FEED_X, .30, .96), (.10, .14, .10), M['paint_accent'], bevel=.008),
            kit.cylinder('Upper roll loading cylinder', (FEED_X, -.07, 1.13), .018, .10, 'Z', M['chrome']),
            kit.cylinder('Upper roll loading cylinder', (FEED_X, .07, 1.13), .018, .10, 'Z', M['chrome']),
            kit.cylinder('Pellet chute', (4.45, 0, .69), .10, .10, 'Z', M['stainless'], radius2=.05, segments=32),
            kit.tube_path('Pellet chute pipe', [(4.45, 0, .64), (4.70, 0, .66), (5.02, 0, .67)], .045, M['stainless'])]
rotor_motor = kit.motor('Rotor motor', (0, 0, 0), .08, .22, 1, M)
rotor_motor.location = (4.47, .40, .74)
rotor_motor.rotation_euler.z = math.pi / 2
housing.append(rotor_motor)
kit.join(housing, 'PelletiserHousing')
# Roll and rotor axes lie along world +Y (local X turned by 90 deg about Z): a positive turn moves a roll's top
# toward +X. The lower roll turns positive and the upper negative, so both nip contacts move the strands
# downstream.
for name, z, sign, mat in (('FeedRollLower', NIP_Z - STRAND_R - ROLL_R, 1, M['knurl']),
                           ('FeedRollUpper', NIP_Z + STRAND_R + ROLL_R, -1, M['rubber'])):
    owner = kit.empty(name, (FEED_X, 0, z), group='haul')
    owner.rotation_euler.z = math.pi / 2       # local X along world Y (roll axis)
    parts = [kit.cylinder(name + '_body', (0, 0, 0), ROLL_R, .12, 'X', mat, segments=40)]
    for k in range(20 if mat is M['knurl'] else 4):
        ridge = kit.box(name + '_mark', (0, 0, ROLL_R), (.12, .004 if k % 5 else .010, .0015), M['steel_dark'] if k % 5 else M['warning'], bevel=0)
        ridge.rotation_euler.x = TAU * k / (20 if mat is M['knurl'] else 4)
        parts.append(ridge)
    roll = kit.join(parts, name + '_body')
    roll.parent = owner
    kit.spin(owner, 'haul', TURNS['haul'], FRAMES, sign=sign)
rotor = kit.empty('PelletRotor', (ROTOR[0], 0, ROTOR[1]), group='cutter')
rotor.rotation_euler.z = math.pi / 2
parts = [kit.cylinder('Rotor hub', (0, 0, 0), .035, .13, 'X', M['steel'], segments=32)]
for k in range(EDGES):
    blade = kit.box('Rotor blade', (0, 0, .0425), (.13, .004, .016), M['chrome'], bevel=.0005)
    blade.rotation_euler.x = TAU * k / EDGES
    parts.append(blade)
kit.join(parts, 'PelletRotor_body').parent = rotor
kit.spin(rotor, 'cutter', TURNS['cutter'], FRAMES, sign=-1)     # knife-side blades sweep down past the bed knife edge

# Classifier and octabin
cls = [kit.box('Classifier deck', (5.33, 0, .58), (.70, .40, .01), M['steel_dark'], bevel=0),
       kit.box('Classifier wall', (5.33, -.205, .61), (.70, .01, .07), M['stainless'], bevel=0),
       kit.box('Classifier wall', (5.33, .205, .61), (.70, .01, .07), M['stainless'], bevel=0),
       kit.box('Classifier inlet wall', (4.98, 0, .61), (.01, .40, .07), M['stainless'], bevel=0),
       kit.box('Classifier base', (5.33, 0, .42), (.74, .44, .04), M['paint_dark'])]
for dx in (-.30, .30):
    for dy in (-.17, .17):
        cls.append(kit.cylinder('Classifier spring', (5.33 + dx, dy, .50), .022, .12, 'Z', M['rubber'], segments=16))
        cls.append(kit.box('Classifier leg', (5.33 + dx, dy, .20), (.04, .04, .40), M['paint_dark']))
for y in (-.23, .23):
    cls.append(kit.cylinder('Vibration motor', (5.25, y, .56), .045, .12, 'X', M['paint_accent'], segments=24))
chute = kit.box('Pellet outlet chute', (0, 0, 0), (.14, .14, .01), M['stainless'], bevel=0)
chute.location, chute.rotation_euler.y = (5.76, 0, .53), math.radians(35)
cls += [chute, kit.box('Oversize outlet', (5.10, -.26, .52), (.08, .08, .10), M['stainless'], bevel=0)]
kit.join(cls, 'Classifier')
binparts = [kit.box('Octabin', (6.12, 0, .26), (.60, .60, .52), M['carton'], bevel=.01),
            kit.box('Octabin pellets', (6.12, 0, .515), (.56, .56, .02), M['pellet'], bevel=0),
            kit.box('Pallet', (6.12, 0, .03), (.70, .70, .06), M['cast'])]
kit.join(binparts, 'Octabin')

# Controls and operator station
kit.cabinet('Control cabinet', (-1.45, .52, 0), (-.65, .92, 1.90), M)
kit.stack_light('Stack light', (-1.05, .72, 1.90), M)
kit.hmi_pedestal('Operator panel', (-.95, -.78, 0), (-.95, -.78, 1.42), M)   # beside the drive, clear of the barrel view

# Flow markers (group "flow"): feed pellets, melt in the screws, strands, pellets, vapour
_feed = kit.catmull([(.064, .55, AX + .62), (.064, .55, AX + .40), (.064, .30, AX + .37), (.064, .12, AX + .36),
                 (.064, .02, AX + .28), (.064, 0, AX + .12), (.20, Y_A, AX + .002)], 6)
kit.ride('FeedPellet', _feed, 10, kit.path_length(_feed) / 10, 2 * kit.path_length(_feed), M['pellet'], .0035, FRAMES, 'pellet')
for y in (STRAND_Y[0], STRAND_Y[-1]):
    _strand = kit.catmull([(x, y, z) for x, z in strand_controls])
    count = math.ceil(kit.path_length(_strand) / STRAND_TRAVEL)
    kit.ride('StrandMarker%s' % ('A' if y < 0 else 'B'), _strand, count, STRAND_TRAVEL, STRAND_TRAVEL, M['polymer_marker'], .0032,
             FRAMES)
_pellets = kit.catmull([(KNIFE_X + .01, 0, NIP_Z - .01), (4.45, 0, .80), (4.45, 0, .66), (4.75, 0, .66), (5.05, 0, .62),
                    (5.60, 0, .60), (5.80, 0, .48), (6.05, 0, .54)], 6)
kit.ride('PelletMarker', _pellets, 12, kit.path_length(_pellets) / 12, 3 * kit.path_length(_pellets), M['pellet'], .003, FRAMES,
         'pellet')
_vapour = kit.catmull([(xv, 0, AX + .08), (xv, .035, AX + .14), (xv, .12, AX + .30), (xv + .05, .40, AX + .32),
                   (xv + .10, .62, AX + .12), (xv + .10, .66, .70)], 6)
kit.ride('VapourMarker', _vapour, 6, kit.path_length(_vapour) / 6, 3 * kit.path_length(_vapour), M['water'], .008, FRAMES)

kit.bake_linear()
sc.timeline_markers.new('Steady line: all drives at teaching speed (0.1x)', frame=0)

# ---------------------------------------------------------------------- metadata / render
control = lines.control
META = {
    'id': 'compounding', 'duration': LOOP, 'frames': [0, FRAMES],
    'poster': 'assets/equipment/compounding-motion-poster.png', 'model': 'assets/equipment/compounding-motion.glb',
    'center': [2.45, .95, 0], 'span': [8.6, 2.5], 'zoom': [.7, 14],
    'controls': [control('screw', '스크류 회전각', 'Screw rotation angle', time_range=[0, LOOP]),
                 control('side', '사이드 피더 회전각', 'Side feeder rotation angle', time_range=[0, LOOP]),
                 control('flow', '수지 표시 위치', 'Resin marker position', 100, '%', [0, LOOP]),
                 control('haul', '피드 롤 회전각', 'Feed roll rotation angle', time_range=[0, LOOP]),
                 control('cutter', '커터 로터 회전각', 'Cutter rotor rotation angle', 360, time_range=[0, LOOP])],
    'views': [{'key': 'all', 'label': ['전체 라인', 'Whole line'], 'center': [2.45, .95, 0], 'zoom': 1},
              {'key': 'screw', 'label': ['스크류·배럴', 'Screws & barrel'], 'center': [.64, 1.0, 0], 'zoom': 5.5},
              {'key': 'finish', 'label': ['수조·펠릿타이저', 'Bath & pelletiser'], 'center': [3.9, .95, 0], 'zoom': 2.2},
              {'key': 'cutter', 'label': ['피드 롤·커터', 'Feed rolls & cutter'], 'center': [FEED_X + .05, 1.0, 0], 'zoom': 9}],
    'stages': [['공급·이송', 'Feed & convey'], ['용융·혼합', 'Melt & mix'], ['탈가스', 'Devolatilization'],
               ['다이·펠릿 절단', 'Die & pelletize']],
    'turns': TURNS, 'cut_edges': EDGES,
    'study': {'rpm': RPM['screw'], 'speed': LINE_SPEED, 'diameter': FEED_ROLL, 'pitch': PELLET},
    'teaching': {'time_scale': TIME_SCALE, 'rpm': {key: round(value, 2) for key, value in RPM.items()},
                 'line_speed_m_min': LINE_SPEED, 'pellet_mm': PELLET, 'feed_roll_mm': FEED_ROLL,
                 'loop_note': 'Each drive turns a whole number of symmetric steps per loop (within 0.6 % of the scaled speed).'},
    'spec': {'basis': 'Pack B grade C teaching values; brand-neutral; not an OEM drawing or PHA setting',
             'screw_d_mm': 32, 'l_d': 40, 'barrel_blocks': 10, 'centre_distance_mm': round(CENTRE / MM, 2),
             'do_di': 1.55, 'shaft_height_mm': round(AX / MM), 'elements': [list(e) for e in ELEMENTS],
             'feed': 'loss-in-weight, B1', 'atmospheric_vent': 'B4', 'side_feeder': 'B5', 'vacuum_vent': 'B9',
             'strand_holes': '6 x 3 mm, 12 mm pitch', 'bath_m': 2.0, 'feed_roll_mm': FEED_ROLL,
             'rotor_mm': 100, 'rotor_blades': EDGES, 'classifier_mm': '700 x 400',
             'sources': 'output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md'},
}

floor = kit.floor('Floor', -1.5, 6.5, -.95, 1.25, M)
kit.studio_world(.8, 'studio.exr')
sc.frame_set(int(FRAMES * .3))
bpy.context.view_layer.update()
camera = kit.ortho_camera('Line camera', (2.5 + 5.6, -10.5, 5.8), (2.45, 0, .85), 8.6)
orientation = camera.rotation_euler.to_matrix()     # matrix_world is stale until the next depsgraph update
right, up = orientation.col[0], orientation.col[1]
corners = [obj.matrix_world @ Vector(c) for obj in sc.objects if obj.type == 'MESH' and obj is not floor
           for c in obj.bound_box]
xs_, ys_ = [p.dot(right) for p in corners], [p.dot(up) for p in corners]
camera.location += right * ((min(xs_) + max(xs_)) / 2 - camera.location.dot(right)) + \
    up * ((min(ys_) + max(ys_)) / 2 - camera.location.dot(up))
camera.data.ortho_scale = max(max(xs_) - min(xs_), (max(ys_) - min(ys_)) * 16 / 9) * 1.06
kit.area_light('Key light', (0, -5, 6), (2.4, 0, .8), 1600, 6)
kit.area_light('Rim light', (5, 4, 5), (2.4, 0, .8), 700, 5, (.9, .95, 1))
kit.render_still(OUT / 'compounding-motion-poster.png', 1280, 720, samples=48)
for obj in (floor, camera):
    bpy.data.objects.remove(obj, do_unlink=True)
for obj in [o for o in sc.objects if o.type == 'LIGHT']:
    bpy.data.objects.remove(obj, do_unlink=True)
sc.frame_set(0)
sc['motion_scope'] = 'Teaching rig; Pack B teaching dimensions, no OEM drawing, process setpoint, CFD or thermal prediction.'
sc['motion_controls'] = json.dumps(META['controls'], ensure_ascii=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'compounding-motion.blend'), compress=True)
kit.export_glb(OUT / 'compounding-motion.glb')
META['blender'] = bpy.app.version_string
META['groups'] = sorted({obj.get('motion_group') for obj in sc.objects if obj.get('motion_group')})
(OUT / 'compounding-motion.json').write_text(json.dumps(META, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines.write_manifest()
print('COMPOUNDING_EXPORT_OK', flush=True)
