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
A steady bubble does not breathe, so the running bubble keeps its BUR 2 shape at all times. For the start-up sequence the
right nip roll rides a carriage that two pneumatic cylinders close onto the film (40 mm open for threading), the bubble
segments carry a shape key from the BUR 1 start-up tube to BUR 2, and the wound roll grows from its core. The air ring is a
hot air ring: blower, airflow switch, inline heater, insulated hoses, plenum sensor, PID controller and high-limit, set to
the in-house 60 C standard for semi-crystalline PHA: it holds the film near 60 C, where the resin crystallizes fast, so the
film sets before the nip and does not block (in-house trials, line experience and DSC data; public evidence in
docs/research/pha-blown-film-hot-air-ring-20261017.md). IBC supplies air
through a stack on the die mandrel and draws it back into the stack top, balanced on three ultrasonic bubble sensors (no IBC
air temperature is set). The oscillating haul-off reverses the nip and collapsing frame +-90 deg on a slewing ring (Pack B:
180 deg total, 120 s period); in place of turning bars the lay-flat twists back over a 1.14 m free span to the fixed guide
roll on a take-off frame above the tower roof (about 1.5 % edge strain at 90 deg). No PHA
BUR or frost-line range is implied. The model runs in real time at 5 m/min: the nip rolls turn three times per loop and the
winder twice.
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
TURNS = {'haul': 3, 'winder': 2, 'screw': 11, 'hotair': 1, 'ibc': 1}   # hotair, ibc: air markers, one sweep per loop
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
RISE = 1.25                                         # nip to the first fixed guide roll: the free span the lay-flat twists in
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
kit.join(die, 'AnnularDie')

# Hot air ring train (heated dual-lip ring, behind the die): inlet filter -> centrifugal blower -> airflow (differential
# pressure) switch -> inline electric heater -> insulated manifold -> four insulated hoses -> air ring. A plenum sensor
# feeds the PID controller; an independent manual-reset high-limit cuts the heater. The heater may only run while the
# blower runs and the airflow switch is made (heater interlock); the blower runs on after the heater stops.
# Sizes are teaching values (grade C): 150-300 m3/h, about 6 kW at 400 V for 20 -> 60 C air.
M['insulation'] = kit.material('Insulation / aluminium jacket', '#C8CBCD', .6, .45)
M['hot_air'] = kit.material('Air / warm (marker)', '#E07A2E', 0, .4, alpha=.7)
Y_AIR, Z_HEATER = .62, .62
hot = [kit.cylinder('Hot air blower volute', (-.30, Y_AIR, .32), .15, .14, 'Y', M['paint_accent'], segments=40),
       kit.cylinder('Hot air blower inlet filter', (-.30, Y_AIR - .12, .32), .10, .10, 'Y', M['steel_dark'], segments=32),
       kit.cylinder('Hot air blower inlet filter grille', (-.30, Y_AIR - .171, .32), .085, .004, 'Y', M['black'], segments=32),
       kit.box('Hot air blower base', (-.30, Y_AIR + .06, .085), (.36, .36, .17), M['paint_dark'], bevel=.006),
       kit.tube_path('Hot air blower outlet duct', [(-.30, Y_AIR, .46), (-.30, Y_AIR, Z_HEATER), (-.20, Y_AIR, Z_HEATER)], .05, M['steel']),
       kit.box('Airflow switch', (-.24, Y_AIR - .085, Z_HEATER + .02), (.06, .04, .07), M['paint'], bevel=.004),
       kit.cylinder('Airflow switch sensing tube', (-.24, Y_AIR - .055, Z_HEATER + .02), .004, .03, 'Y', M['brass'], segments=8),
       kit.cylinder('Inline air heater', (0, Y_AIR, Z_HEATER), .075, .40, 'X', M['stainless'], segments=40),
       kit.box('Inline air heater terminal box', (0, Y_AIR, Z_HEATER + .105), (.16, .11, .07), M['paint'], bevel=.006),
       kit.box('Inline air heater warning label', (0, Y_AIR - .056, Z_HEATER + .105), (.08, .002, .04), M['warning'], bevel=0),
       kit.cylinder('Heater outlet duct', (.225, Y_AIR, Z_HEATER), .055, .05, 'X', M['insulation'], segments=32),
       kit.box('Hot air manifold', (X_D - .22, Y_AIR - .02, Z_HEATER), (.16, .24, .16), M['insulation'], bevel=.01),
       kit.cylinder('Air ring plenum sensor', (X_D, .095, Z_DIE + .065), .005, .03, 'Z', M['copper'], segments=12),
       kit.box('Hot air controller', (.25, .93, 1.12), (.26, .12, .30), M['paint'], bevel=.008),
       kit.box('Hot air controller display', (.25, .868, 1.18), (.13, .004, .06), M['screen'], bevel=0),
       kit.box('Heater high-limit cut-out', (.25, .868, 1.06), (.09, .006, .05), M['paint_dark'], bevel=.002),
       kit.cylinder('Heater on lamp', (.17, .867, 1.06), .012, .006, 'Y', M['lamp_amber'], segments=16),
       kit.cylinder('Blower on lamp', (.33, .867, 1.06), .012, .006, 'Y', M['lamp_green'], segments=16),
       kit.box('Hot air controller stand', (.25, .93, .49), (.06, .06, .98), M['paint_dark'])]
motor = kit.motor('Hot air blower motor', (0, 0, 0), .085, .20, 1, M)
motor.location, motor.rotation_euler.z = (-.30, Y_AIR + .19, .32), -math.pi / 2
hot.append(motor)
for k in range(4):                                  # insulated hoses from the manifold to the four ring inlets
    a = TAU * (k + .5) / 4
    outlet = (X_D - .22 + (-.04 if math.cos(a) < 0 else .04), Y_AIR - .02 + (-.06 if math.sin(a) < 0 else .06), Z_HEATER - .08)
    hot.append(kit.hose('Insulated air ring hose', (X_D + .12 * math.cos(a), .12 * math.sin(a), Z_DIE + .025), outlet, .028,
                        M['insulation'], sag=.10))
hot += [kit.hose('Heater power cable', (0, Y_AIR + .05, Z_HEATER + .14), (.20, .93, .97), .008, M['cable'], sag=.08),
        kit.hose('Plenum sensor cable', (X_D, .095, Z_DIE + .08), (.30, .93, .97), .004, M['cable'], sag=.06)]
kit.join(hot, 'HotAirRing')

# IBC, internal bubble cooling (optional in Pack B with separate supply and exhaust; grade C teaching values): a supply
# blower sends air up through the die into a stack on the mandrel, out of a nozzle ring low in the bubble and up along
# the inside of the film; an exhaust blower draws the warmed air back into the stack top and out through the die. Three
# ultrasonic sensors on the cage measure the bubble, and the IBC controller trims the exhaust to hold the diameter (BUR 2).
# The model sets no IBC air temperature: there is no PHA source for one.
IBC_R, IBC_TOP, IBC_NOZZLE = .016, .25, .05
ibc = [kit.cylinder('IBC stack', (X_D, 0, Z_DIE + IBC_TOP / 2), IBC_R, IBC_TOP, 'Z', M['stainless'], segments=32),
       kit.cylinder('IBC supply nozzle ring', (X_D, 0, Z_DIE + IBC_NOZZLE), .022, .02, 'Z', M['steel_dark'], segments=32),
       kit.cylinder('IBC exhaust intake', (X_D, 0, Z_DIE + IBC_TOP + .008), .021, .016, 'Z', M['steel_dark'], segments=32)]
for k in range(8):
    a = TAU * k / 8
    ibc.append(kit.between('IBC supply nozzle', (X_D + .02 * math.cos(a), .02 * math.sin(a), Z_DIE + IBC_NOZZLE),
                           (X_D + .029 * math.cos(a), .029 * math.sin(a), Z_DIE + IBC_NOZZLE), .004, M['steel_dark'], segments=10))
kit.join(ibc, 'IBCStack')
X_IBC, Y_IBC = X_D + .20, .80
unit = [kit.box('IBC blower base', (X_IBC + .15, Y_IBC, .04), (.62, .30, .08), M['paint_dark'], bevel=.006),
        kit.cylinder('IBC supply blower', (X_IBC, Y_IBC, .20), .12, .10, 'Y', M['paint_accent'], segments=40),
        kit.cylinder('IBC exhaust blower', (X_IBC + .30, Y_IBC, .20), .12, .10, 'Y', M['paint_accent'], segments=40),
        kit.box('IBC supply label', (X_IBC, Y_IBC - .051, .26), (.08, .002, .03), M['hose_blue'], bevel=0),
        kit.box('IBC exhaust label', (X_IBC + .30, Y_IBC - .051, .26), (.08, .002, .03), M['hose_red'], bevel=0),
        kit.tube_path('IBC supply duct', [(X_IBC, Y_IBC, .32), (X_IBC, Y_IBC - .10, .45), (X_D - .06, .40, .45), (X_D - .06, .155, .45)], .03,
                      M['hose_blue']),
        kit.tube_path('IBC exhaust duct', [(X_IBC + .30, Y_IBC, .32), (X_IBC + .30, Y_IBC - .10, .30), (X_D + .06, .40, .30), (X_D + .06, .155, .30)],
                      .03, M['hose_red']),
        kit.box('IBC controller', (X_IBC + .15, Y_IBC + .25, 1.0), (.24, .10, .28), M['paint'], bevel=.008),
        kit.box('IBC controller display', (X_IBC + .15, Y_IBC + .199, 1.04), (.13, .004, .07), M['screen'], bevel=0),
        kit.box('IBC controller stand', (X_IBC + .15, Y_IBC + .25, .43), (.05, .05, .86), M['paint_dark'])]
for blower_x in (X_IBC, X_IBC + .30):               # supply and exhaust blower motors behind their volutes
    motor = kit.motor('IBC blower motor', (0, 0, 0), .07, .16, 1, M)
    motor.location, motor.rotation_euler.z = (blower_x, Y_IBC + .16, .20), -math.pi / 2
    unit.append(motor)
kit.join(unit, 'IBCUnit')
Z_SENSOR = Z_DIE + FLH + .25                         # lowest cage ring
sensors = []
for a in (math.radians(90), math.radians(210), math.radians(330)):
    radial = Vector((math.cos(a), math.sin(a), 0))
    sensors += [kit.between('Bubble diameter sensor', Vector((X_D, 0, Z_SENSOR)) + radial * .118, Vector((X_D, 0, Z_SENSOR)) + radial * .148, .012,
                            M['black'], segments=16),
                kit.between('Bubble diameter sensor bracket', Vector((X_D, 0, Z_SENSOR)) + radial * .106, Vector((X_D, 0, Z_SENSOR)) + radial * .12, .004,
                            M['stainless'], segments=8)]
kit.join(sensors, 'BubbleSensors')


# Bubble: neck and draw-down to the frost line, steady diameter in the cage, then an elliptical collapse to the
# lay-flat at the nip (the circumference is held constant through the collapsing frame).
def bubble_section(h, bur=BUR):
    """(a, b): semi-axes of the bubble section along Y (lay-flat direction) and X at height h above the die, for a
    blow-up ratio ``bur`` (1: the uninflated start-up tube)."""
    radius, flat = DIE_R * bur, math.pi * DIE_R * bur / 2
    if h <= FLH:
        f = h / FLH
        r = DIE_R + (radius - DIE_R) * (f * f * (3 - 2 * f))
        return r, r
    if h <= Z_COLLAPSE - Z_DIE:
        return radius, radius
    f = (h - (Z_COLLAPSE - Z_DIE)) / (Z_NIP - Z_COLLAPSE)
    a = radius + (flat - radius) * f
    perimeter = TAU * radius
    # Ellipse perimeter (Ramanujan's second approximation, < 0.05 % off even when flat) held at the bubble circumference.
    lo, hi = 0.0, a
    for _ in range(40):
        b = (lo + hi) / 2
        h = ((a - b) / (a + b)) ** 2
        p = math.pi * (a + b) * (1 + 3 * h / (10 + math.sqrt(4 - 3 * h)))
        lo, hi = (b, hi) if p < perimeter else (lo, b)
    return a, max(b, T)


heights = [i / 40 * FLH for i in range(41)] + [FLH + (Z_NIP - Z_DIE - FLH) * i / 60 for i in range(1, 61)]


def section_ring(h, bur):
    a, b = bubble_section(h, bur)
    return [(X_D + b * math.sin(TAU * i / 64), a * math.cos(TAU * i / 64), Z_DIE + h) for i in range(64)]


# The bubble is built in about 100 mm height segments tagged with their distance from the die (the start-up grows the
# tube up to the nip). Each segment's mesh is the BUR 1 start-up tube with a shape key 'Inflated' to the steady BUR 2
# bubble, set to 1: the running line shows BUR 2 and the start-up inflates it after the nip closes.
S_NIP = Z_NIP - Z_DIE
cuts = sorted({0, len(heights) - 1} | {min(range(len(heights)), key=lambda i: abs(heights[i] - k * .1)) for k in range(1, 25)})
collapsing = []                                     # segments reaching above the collapsing frame's lower end
for k, (i0, i1) in enumerate(zip(cuts, cuts[1:])):
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in section_ring(h, 1.0)] for h in heights[i0:i1 + 1]]
    for r0, r1 in zip(rings, rings[1:]):
        for i in range(64):
            j = (i + 1) % 64
            bm.faces.new((r0[i], r0[j], r1[j], r1[i])).smooth = True
    segment = kit._finish('FilmBubble%03d' % k, bm, M['film'])
    segment.shape_key_add(name='Basis')
    inflated = segment.shape_key_add(name='Inflated', from_mix=False)
    for n, p in enumerate(p for h in heights[i0:i1 + 1] for p in section_ring(h, BUR)):
        inflated.data[n].co = p
    inflated.value = 1.0
    segment['morph'] = 'inflate'
    kit.thread_mark(segment, heights[i0], heights[i1])
    if heights[i1] > Z_COLLAPSE - Z_DIE + 1e-9:
        collapsing.append(segment)

# Tower and cage. The tower deck has a square opening for the bubble and the turning collapsing frame, the roof one for the
# lay-flat rising to the take-off frame.
DECK_TOP = Z_NIP - .23
OPENING = .25                                        # half-size of the deck opening
ROOF_Z, ROOF_OPEN = Z_NIP + .35, .18                 # roof centre height and half-size of its opening
tower = []
for dx in (-.45, .45):
    for dy in (-.45, .45):
        tower.append(kit.box('Tower column', (X_D + dx, dy, (Z_NIP + .35) / 2), (.08, .08, Z_NIP + .35), M['paint'], bevel=.006))
for side in (-1, 1):
    tower += [kit.box('Tower deck', (X_D, side * (OPENING + .5) / 2, DECK_TOP - .02), (1.0, .5 - OPENING, .04), M['paint_dark']),
              kit.box('Tower deck', (X_D + side * (OPENING + .5) / 2, 0, DECK_TOP - .02), (.5 - OPENING, 2 * OPENING, .04), M['paint_dark'])]
for side in (-1, 1):                                 # roof over the haul-off, open round the rising lay-flat
    tower += [kit.box('Tower top', (X_D, side * (ROOF_OPEN + .5) / 2, ROOF_Z), (1.0, .5 - ROOF_OPEN, .06), M['paint']),
              kit.box('Tower top', (X_D + side * (ROOF_OPEN + .5) / 2, 0, ROOF_Z), (.5 - ROOF_OPEN, 2 * ROOF_OPEN, .06), M['paint'])]
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
kit.join(tower, 'Tower')


def vertical_ring(name, z0, z1, r_in, r_out, mat, segments=64):
    """Ring about the bubble axis between heights z0 and z1."""
    ring = kit.ring(name, 0, z1 - z0, r_in, r_out, (0, 0), mat, segments=segments)
    ring.rotation_euler.y = -math.pi / 2
    ring.location = (X_D, 0, z0)
    return ring


RN = NIP_D / 2000
# Nip roll bearing blocks, 90 mm across: narrower than the 100 mm rolls, so the closed nip (axes 101.2 mm apart, the
# two-ply film between the rolls) leaves 11.2 mm between the facing blocks. The kit's default block for a 50 mm radius is
# 105 mm, which made the closed blocks run 3.8 mm into each other.
NIP_BLOCK = .09
HALF_BLOCK = NIP_BLOCK / 2
assert 2 * (RN + T) - NIP_BLOCK > .01
# The film rises between the rolls: the left roll's +X side and the right roll's -X side both move up.
nip_left = kit.roll('NipLeft', X_D - RN - T, Z_NIP, RN, .35, M, 'haul', 3, FRAMES, -1, mat=M['rubber'], joint=False, block=NIP_BLOCK)
nip_right = kit.roll('NipRight', X_D + RN + T, Z_NIP, RN, .35, M, 'haul', 3, FRAMES, 1, mat=M['chrome'], joint=False, block=NIP_BLOCK)
# Nip actuator: the right (chrome) roll and its bearing blocks ride a carriage on two rails, pushed onto the film by two
# pneumatic cylinders on brackets; for threading the nip stands 40 mm open.
bpy.context.view_layer.update()
nip = kit.carrier('NipRollCarriage')
kit.mount([nip_right, bpy.data.objects['NipRight stand']], nip)
X_R = X_D + RN + T
Y_FRAME = .35 / 2 + .07                              # bearing-block line of the nip rolls
nip_cylinders = []
for y in (-Y_FRAME, Y_FRAME):
    nip_cylinders.append(kit.linked_cylinder('Nip cylinder', (X_R + .26, y, Z_NIP), (X_R + .14, y, Z_NIP), (X_R + HALF_BLOCK, y, Z_NIP), .025, .01, M,
                                             nip, inset=.03)[0])
OPEN = .04
kit.actuate(nip, FRAMES, (OPEN, 0, 0))

# Oscillating haul-off (Pack B: 180 deg total, 120 s period; grade C teaching values): the nip rolls, their carriage and
# cylinders and the collapsing frame stand on a frame that turns on a slewing ring on the tower deck, driven by a gear
# motor through a pinion on the ring's gear rim. Reversing +-90 deg about the bubble axis spreads the bubble's
# circumferential gauge bands across the width of the wound roll. The bubble between the frost line and the collapsing
# frame twists with it (it is round there, so the model turns only the collapsing part). A real haul-off turns the film
# back to its fixed path with turning bars; here the lay-flat twists back over a long free span to the fixed guide roll
# (see the take-off frame below).
OSC = math.radians(90)
frame_parts = [vertical_ring('Oscillation slewing ring outer race', DECK_TOP + .0005, DECK_TOP + .04, .3005, .36, M['steel']),
               vertical_ring('Oscillation gear rim', DECK_TOP + .005, DECK_TOP + .035, .36, .375, M['steel_dark']),
               vertical_ring('Oscillating frame base', DECK_TOP + .0405, DECK_TOP + .06, .3005, .45, M['paint_accent'])]
BEAM_Z = DECK_TOP + .07                              # frame beams on the base, one under each bearing-block line
for y in (-Y_FRAME, Y_FRAME):
    frame_parts += [kit.box('Oscillating frame beam', (X_D, y, BEAM_Z), (.64, .04, .02), M['paint_accent'], bevel=.003),
                    kit.box('Nip roll post', (X_D - RN - T, y, (BEAM_Z + .01 + Z_NIP - HALF_BLOCK) / 2), (.04, .04, Z_NIP - HALF_BLOCK - BEAM_Z - .01),
                            M['paint_accent'], bevel=.003),
                    # The carriage rail runs 1 mm under the right roll's blocks (top at Z_NIP - HALF_BLOCK - 1 mm).
                    kit.box('Nip carriage rail', (X_D + .115, y, Z_NIP - HALF_BLOCK - .011), (.21, .03, .02), M['steel'], bevel=.002),
                    kit.box('Nip carriage rail post', (X_D + .21, y, (BEAM_Z + .01 + Z_NIP - HALF_BLOCK - .021) / 2),
                            (.03, .03, Z_NIP - HALF_BLOCK - .021 - BEAM_Z - .01), M['paint_accent'], bevel=.002),
                    kit.box('Nip cylinder bracket', (X_R + .27, y, Z_NIP), (.02, .07, .07), M['steel_dark'], bevel=.003),
                    kit.box('Nip cylinder bracket post', (X_R + .27, y, (BEAM_Z + .01 + Z_NIP - .035) / 2), (.03, .03, Z_NIP - .035 - BEAM_Z - .01),
                            M['steel_dark'], bevel=.002)]
kit.join(frame_parts, 'OscillatingFrame')
collapse = []                                        # collapsing frame slats converge on the nip; rails hang from the base
for side in (-1, 1):
    x0, x1 = X_D + side * (BUBBLE_R + .01), X_D + side * (RN + .004)
    for k in range(6):
        y = -LAYFLAT / 2 + LAYFLAT * k / 5
        collapse.append(kit.between('Collapsing slat', (x0, y, Z_COLLAPSE), (x1, y, Z_NIP - .06), .006, M['brass']))
    for y in (-.20, .20):
        collapse.append(kit.between('Collapsing frame rail', (x0, y, Z_COLLAPSE), (x1, y, Z_NIP - .06), .01, M['paint_dark']))
        f = (DECK_TOP + .05 - Z_COLLAPSE) / (Z_NIP - .06 - Z_COLLAPSE)
        hang = Vector((x0 + (x1 - x0) * f, y, DECK_TOP + .05))
        out = Vector((hang.x - X_D, hang.y, 0)).normalized() * .33
        collapse.append(kit.between('Collapsing frame hanger', hang, (X_D + out.x, out.y, DECK_TOP + .05), .008, M['paint_dark']))
kit.join(collapse, 'CollapsingFrame')
drive_at = Vector((math.cos(math.radians(20)), math.sin(math.radians(20)), 0))
kit.join([vertical_ring('Oscillation slewing ring inner race', DECK_TOP, DECK_TOP + .04, .26, .2995, M['steel_dark']),
          kit.cylinder('Oscillation drive pinion', (X_D + .3905 * drive_at.x, .3905 * drive_at.y, DECK_TOP + .02), .015, .03, 'Z', M['steel_dark']),
          kit.cylinder('Oscillation drive motor', (X_D + .50 * drive_at.x, .50 * drive_at.y, DECK_TOP + .05), .035, .10, 'Z', M['paint_accent']),
          kit.between('Oscillation drive gearbox', (X_D + .3905 * drive_at.x, .3905 * drive_at.y, DECK_TOP + .015),
                      (X_D + .50 * drive_at.x, .50 * drive_at.y, DECK_TOP + .015), .02, M['paint'], segments=16)], 'OscillationDrive')
RG = GUIDE_D / 2000
# The lay-flat rises RISE from the nip, through the roof opening, tangent to the first top guide on the take-off frame,
# runs across to the second guide, drops outside the tower columns, wraps under the lower guide and runs to the winder.
top_guide = (X_D + RG + T / 2, Z_NIP + RISE)
top_guide2 = (X_D + .55, Z_NIP + RISE)
low_guide = (top_guide2[0] + 2 * RG + T, .45)
FILM_Z = low_guide[1] - RG - T / 2
kit.roll('TowerGuideRoll', top_guide[0], top_guide[1], RG, .35, M, 'haul', turns_of(GUIDE_D), FRAMES, 1, mat=M['steel'], joint=False)
kit.roll('TowerGuideRoll2', top_guide2[0], top_guide2[1], RG, .35, M, 'haul', turns_of(GUIDE_D), FRAMES, 1, mat=M['steel'], joint=False)
kit.roll('LowerGuideRoll', low_guide[0], low_guide[1], RG, .35, M, 'haul', turns_of(GUIDE_D), FRAMES, -1, mat=M['steel'], joint=False)
# Take-off frame on the roof: a beam under each bearing-block line of the two top guide rolls, on four posts that stand
# clear of the rising, twisting lay-flat (teaching values, grade C).
GUIDE_BLOCK = kit.bearing_block(RG)
TAKEOFF_BEAM = top_guide[1] - GUIDE_BLOCK / 2 - .021  # beam centre: its top 1 mm under the blocks
takeoff = []
for y in (-Y_FRAME, Y_FRAME):
    takeoff.append(kit.box('Take-off frame beam', ((top_guide[0] + top_guide2[0]) / 2, y, TAKEOFF_BEAM),
                           (top_guide2[0] - top_guide[0] + GUIDE_BLOCK, .04, .04), M['paint'], bevel=.004))
    takeoff += [kit.box('Take-off frame post', (x, y, (ROOF_Z + .03 + TAKEOFF_BEAM - .02) / 2), (.04, .04, TAKEOFF_BEAM - .02 - ROOF_Z - .03),
                        M['paint'], bevel=.004) for x in (top_guide[0], top_guide2[0])]
kit.join(takeoff, 'TakeOffFrame')
RW = WOUND_D / 2000
winder = kit.roll('Winder', X_W, FILM_Z - T / 2 - RW, RW, LAYFLAT + .02, M, 'winder', 2, FRAMES, 1, mat=M['film'], marks=3,
                  joint=False)
kit.join([kit.cylinder('Winder core', (0, 0, 0), CORE_D / 2000, LAYFLAT + .12, 'X', M['core'], segments=32)], 'Winder_core').parent = winder
kit.join([kit.box('Winder stand', (X_W, side * .25, winder.location.z / 2), (.12, .05, winder.location.z), M['paint']) for side in (-1, 1)]
         + [kit.box('Winder motor', (X_W, .36, winder.location.z), (.16, .14, .16), M['paint_accent'], bevel=.008)], 'WinderStand')

# Lay-flat film: up out of the nip, over the top guide, down the tower, round the lower guide, to the winder. The rise from
# the nip to the first guide is built in 12.5 mm pieces so that it can twist smoothly with the oscillating haul-off.
top = Vector((X_D, 0, Z_NIP))
path = [top, Vector((X_D, 0, top_guide[1]))]
path += kit.arc_xz(top_guide[0], top_guide[1], RG + T / 2, 180, 90, 8)[1:]
path += kit.arc_xz(top_guide2[0], top_guide2[1], RG + T / 2, 90, 0, 8)
path += kit.arc_xz(low_guide[0], low_guide[1], RG + T / 2, 180, 270, 8)
path += [Vector((X_W, 0, FILM_Z))]
rise_pieces = kit.thread_web('FlattenedFilmWebRise', path[:2], LAYFLAT, T * 2, M['film'], step=.0125, s_from=S_NIP)
kit.thread_web('FlattenedFilmWeb', path[1:], LAYFLAT, T * 2, M['film'], s_from=S_NIP + RISE)
S_END = S_NIP + kit.path_length(path)

# The oscillating frame carries the nip, its carriage and cylinders, the collapsing frame, the collapsing part of the
# bubble and the lay-flat just above the nip rolls. Higher up, the rise twists back: each piece between 62.5 mm (clear
# of the nip rolls) and 1.2 m (below the first guide roll) turns with its own share of the frame angle, falling to 0.
# Over this 1.14 m free span (4.5 lay-flat widths) a 90 deg twist stretches the film edges by about
# (theta W/2)^2 / (2 L^2) = 1.5 % more than the centre line; the former 137.5 mm span needed about 100 %, which no film
# takes. A real haul-off avoids the twist with turning bars, which the model does not build.
TWIST = (.0625, RISE - .05)
EDGE_STRAIN = (OSC * LAYFLAT / 2) ** 2 / (2 * (TWIST[1] - TWIST[0]) ** 2)
assert TWIST[1] - TWIST[0] > 4 * LAYFLAT and EDGE_STRAIN < .02, EDGE_STRAIN
bpy.context.view_layer.update()
haul_off = kit.carrier('HaulOffCarrier', group='oscillate')
kit.mount([nip_left, bpy.data.objects['NipLeft stand'], nip, *nip_cylinders, bpy.data.objects['OscillatingFrame'],
           bpy.data.objects['CollapsingFrame'], *collapsing], haul_off)


def oscillation(f):
    """Haul-off angle over the step: from the centre to +90 deg, then reversing through the centre to -90 deg, starting,
    reversing and stopping gently (one sweep of the 120 s, 180 deg total reversing cycle)."""
    if f <= 1 / 3:
        return OSC * kit.smoothstep(3 * f)
    return OSC * (1 - 2 * kit.smoothstep((f - 1 / 3) * 1.5))


twist_carriers = []
for k, piece in enumerate(rise_pieces):
    z = (piece['thread_s'][0] + piece['thread_s'][1]) / 2 - S_NIP
    share = min(1.0, max(0.0, (TWIST[1] - z) / (TWIST[1] - TWIST[0])))
    if share == 1.0:
        kit.mount([piece], haul_off)
    elif share > 0:
        twist = kit.carrier('HaulOffTwist%03d' % k, group='oscillate')
        kit.mount([piece], twist)
        kit.turn_about(twist, FRAMES, (X_D, 0, 0), 'Z', lambda f, share=share: share * oscillation(f))
        twist['share'] = round(share, 5)
        twist_carriers.append(twist)
kit.turn_about(haul_off, FRAMES, (X_D, 0, 0), 'Z', oscillation)

# Flow markers: pellets, melt in the screw, film meridian lines up the bubble, then along the lay-flat film
pellets = kit.catmull([(ext['throat_x'], 0, AX + .75), (ext['throat_x'], 0, AX + .35), (ext['throat_x'], 0, AX + .06)], 6)
kit.ride('FeedPellet', pellets, 8, kit.path_length(pellets) / 8, 2 * kit.path_length(pellets), M['pellet'], .005, FRAMES, 'pellet',
         group='resin')
melt = [Vector((ext['throat_x'], 0, AX + D * .42)), Vector((-.01, 0, AX + D * .42))]
kit.ride('MeltMarker', melt, 12, kit.path_length(melt) / 12, 2 * kit.path_length(melt) / 12, M['polymer_marker'], .006, FRAMES,
         group='resin')
for k, theta in enumerate((math.pi, math.pi / 2)):          # meridians facing the viewer: lay-flat edge (-Y) and +X
    meridian = []
    for h in heights:
        a, b = bubble_section(h)
        meridian.append(Vector((X_D + (b + .003) * math.sin(theta), (a + .003) * math.cos(theta), Z_DIE + h)))
    kit.ride('BubbleMarker%s' % 'AB'[k], meridian, math.ceil(kit.path_length(meridian) / (TRAVEL / 3)), TRAVEL / 3, TRAVEL,
             M['polymer_marker'], .008, FRAMES)
lay = [Vector((p.x, -LAYFLAT / 2 + .02, p.z)) for p in path]
kit.ride('FilmMarker', lay, math.ceil(kit.path_length(lay) / (TRAVEL / 3)), TRAVEL / 3, TRAVEL, M['polymer_marker'], .006, FRAMES)
# Warm air from the ring lip rising along the bubble (group "hotair"): it leaves the lip at about 75 mm radius and hugs the
# BUR 2 bubble above the draw-down, up to about 250 mm past the frost line. Three sweeps per loop (illustrative speed).
for k, theta in enumerate((math.pi, math.pi / 2)):
    rise = []
    for h in [.055 + (FLH + .25 - .055) * i / 30 for i in range(31)]:
        a, b = bubble_section(h)
        r_y, r_x = max(.075, a + .012), max(.075, b + .012)
        rise.append(Vector((X_D + r_x * math.sin(theta), r_y * math.cos(theta), Z_DIE + h)))
    length = kit.path_length(rise)
    kit.ride('HotAirMarker%s' % 'AB'[k], rise, 10, length / 10, 3 * length, M['hot_air'], .007, FRAMES, group='hotair')
# IBC air inside the BUR 2 bubble (group "ibc"): supply air (blue) leaves the nozzle ring, spreads to 12 mm inside the film
# and sweeps up it to 300 mm past the frost line; exhaust air (violet) turns in from the upper bubble and is drawn down
# into the stack top. Three sweeps per loop (illustrative speed), on meridians between the warm-air markers outside.
M['ibc_supply'] = kit.material('Air / IBC supply (marker)', '#3E8EDE', 0, .4, alpha=.75)
M['ibc_exhaust'] = kit.material('Air / IBC exhaust (marker)', '#9B6FD0', 0, .4, alpha=.75)
inside = lambda h: min(bubble_section(h)) - .012
for k, theta in enumerate((math.pi * .75, math.pi * 1.25)):
    up = []
    for h in [IBC_NOZZLE + (FLH + .30 - IBC_NOZZLE) * i / 40 for i in range(41)]:
        s = kit.smoothstep((h - IBC_NOZZLE) / .07)
        r = .03 * (1 - s) + inside(h) * s
        up.append(Vector((X_D + r * math.sin(theta), r * math.cos(theta), Z_DIE + h)))
    length = kit.path_length(up)
    kit.ride('IBCSupplyMarker%s' % 'AB'[k], up, 10, length / 10, 3 * length, M['ibc_supply'], .006, FRAMES, group='ibc')
for k, theta in enumerate((math.pi, math.pi / 2)):
    down = [Vector((X_D + r * math.sin(theta), r * math.cos(theta), Z_DIE + h))
            for r, h in [(inside(.66), .66), (.05, .54), (.035, .42), (.02, .32), (0, IBC_TOP + .024)]]
    down = kit.catmull(down, 8)
    length = kit.path_length(down)
    kit.ride('IBCExhaustMarker%s' % 'AB'[k], down, 8, length / 8, 3 * length, M['ibc_exhaust'], .006, FRAMES, group='ibc')

kit.cabinet('Control cabinet', (ext['x_rear'] - .2, .45, 0), (ext['x_rear'] + .6, .85, 1.90), M)
kit.stack_light('Stack light', (ext['x_rear'] + .2, .65, 1.90), M)
kit.hmi_pedestal('Operator panel', (ext['x_rear'] + .3, -.70, 0), (ext['x_rear'] + .3, -.70, 1.42), M)
kit.bake_linear()

# Start-up: screw and roll turns follow the steady line ratios (11 screw turns per 0.94 m of film). The hot air ring step
# heats the ring air from 25 C to the in-house 60 C set point before the bubble is inflated.
AIR_SETPOINT = 60
SCREW_PER_M, NIP_PER_M = TURNS['screw'] / TRAVEL, 1000 / (math.pi * NIP_D)
WIND = 2.0                                           # metres of lay-flat wound during the winding step (compressed growth)
STARTUP, CONTROLS = kit.startup(
    ['실제 라인의 기동 순서입니다. 스크류가 튜브를 환형 다이 밖으로 밀어내면 작업자가 케이지와 접힘 프레임을 지나 닙롤까지 끌어 올리고, '
     '닙을 닫아 튜브 위쪽을 막고, 열풍 에어링을 60 °C로 올린 뒤 다이 중앙으로 공기를 넣어 버블을 BUR 2까지 부풀리고, IBC로 버블 안쪽 '
     '공기를 순환시키며 지름을 잡고, 닙롤로 접힌 필름을 권취기까지 보내 권취를 시작한 뒤 오실레이팅 인취를 돌립니다. 실제 라인은 존 '
     '온도가 설정값에 도달하고 균열(soak) 시간이 지나야 스크류가 기동되며(cold-start 보호), 모형은 그 이후부터 보여줍니다.',
     'The real start-up order: the screw pushes the tube out of the annular die, the operator pulls it up through the cage '
     'and collapsing frame to the nip rolls, the nip closes to seal the top of the tube, the hot air ring is brought to '
     '60 °C, air through the die centre inflates the bubble to BUR 2, the IBC circulates the air inside the bubble and holds '
     'its diameter, the nip rolls draw the lay-flat film to the winder, where winding starts, and the oscillating haul-off '
     'starts reversing. A real line only lets the screw start once every zone has reached its set point and soaked '
     '(cold-start protection); the model starts after that.'],
    [kit.step('screw', ['압출 시작 · 스크류 회전', 'Start extruding · screw'],
              ['스크류를 돌려 튜브를 환형 다이에서 케이지와 접힘 프레임을 지나 열린 닙롤까지 올리세요. 실제로는 작업자가 튜브 끝을 묶어 위로 '
               '끌어 올립니다.',
               'Turn the screw to push the tube from the annular die up through the cage and collapsing frame to the open nip '
               'rolls; on a real line the operator ties off the tube end and pulls it up.'],
              once=True, spin={'screw': [round(S_NIP * SCREW_PER_M, 4), 0]}, thread=[0, S_NIP]),
     kit.step('nip', ['닙롤 닫힘 · 공압 실린더', 'Close the nip · pneumatic cylinders'],
              ['튜브가 닙롤 사이에 들어왔습니다. 공압 실린더로 오른쪽 닙롤을 밀어 닫으세요. 닫힌 닙이 튜브 위쪽을 막아야 버블에 공기를 넣을 수 '
               '있습니다.',
               'The tube is between the nip rolls. Close the right roll with the pneumatic cylinders; the closed nip seals the '
               'top of the tube so the bubble can hold air.'],
              needs=['screw'], move='nip'),
     kit.step('air', ['열풍 에어링 기동 · 60 °C', 'Start the hot air ring · 60 °C'],
              ['블로어를 켜고 인라인 히터로 에어링 공기를 60 °C까지 올리세요. 히터는 블로어가 돌고 풍량 스위치가 풍량을 확인해야 켜지며, '
               '과열 차단기가 따로 지킵니다. 목표는 프로스트 라인 위에서 수지(필름) 온도를 60 °C로 맞추는 것입니다. 반결정성 PHA(S1000P)는 '
               '60 °C에서 결정화가 빨라져 빨리 굳고, 굳은 필름은 닙과 권취 롤에서 서로 붙지(블로킹) 않습니다. 60 °C는 사내 실험·운전 경험·DSC '
               '데이터에 근거한 사내 운전 기준입니다(사내 DSC: S1000P 4HB 3.3–5.3 %의 60 °C 반결정화 시간 7–28초). 공개 문헌도 '
               'P(3HB-co-4HB)가 약 60 °C에서 빠르게 결정화한다고 보고하며(CJ제일제당 공동 연구 등), P(3HB-co-4HB) 배합 필름에 에어링 공기 '
               '60 °C를 쓴 특허 실시예(CN118222074A)도 있습니다. 공기가 너무 차가우면 필름이 60 °C 아래로 빨리 식어 결정화가 느려질 수 '
               '있습니다. 비결정성 A1000P에는 해당하지 않습니다.',
               'Start the blower and let the inline heater bring the ring air to 60 °C. The heater can only switch on while the '
               'blower runs and the airflow switch confirms flow, and an independent high-limit guards it. The aim is a resin (film) '
               'temperature of 60 °C above the frost line. Semi-crystalline PHA (S1000P) crystallizes fast at 60 °C, so the film '
               'sets quickly and does not stick to itself (block) in the nip or on the winder. 60 °C is the in-house operating '
               'standard, based on in-house trials, line experience and DSC data (in-house DSC: 60 °C crystallization half-time of '
               '7–28 s for S1000P with 3.3–5.3 % 4HB). Published work also finds that P(3HB-co-4HB) crystallizes fast at about '
               '60 °C (including a study co-authored by CJ CheilJedang), and a patent example blew a P(3HB-co-4HB) compound film '
               'with 60 °C ring air (CN118222074A). Air that is too cold can cool the film below 60 °C quickly and slow its '
               'crystallization. It does not apply to amorphous A1000P.'],
              needs=['screw'], spin={'hotair': [3.4, 0]}, reveal=['hotair'],
              readout={'from': 25, 'to': AIR_SETPOINT, 'unit': '°C', 'digits': 1}),
     kit.step('inflate', ['버블 팽창 · BUR 1→2', 'Inflate the bubble · BUR 1 to 2'],
              ['닙이 튜브를 막았습니다. 다이 중앙으로 공기를 넣어 버블을 BUR 2(지름 160 mm, 레이플랫 251 mm)까지 부풀리세요. PHA의 BUR과 '
               '동결선 권장 범위는 정해져 있지 않습니다.',
               'The nip seals the tube. Blow air through the die centre to inflate the bubble to BUR 2 (160 mm bubble, 251 mm '
               'lay-flat); no PHA BUR or frost-line range is established.'],
              needs=['nip', 'air'], morph='inflate'),
     kit.step('ibc', ['IBC 기동 · 공급/배기', 'Start the IBC · supply and exhaust'],
              ['버블이 BUR 2로 섰습니다. IBC 공급·배기 블로어를 켜세요. 공급 공기는 다이 중앙의 스택 노즐에서 나와 필름 안쪽을 따라 올라가며 '
               '열을 빼앗고, 데워진 공기는 스택 위 흡입구로 빠집니다. 케이지의 초음파 센서 3개가 버블 지름을 재고, 제어기가 배기량을 맞춰 '
               'BUR 2를 유지합니다. IBC 공기 온도는 PHA 근거가 없어 정하지 않았습니다(비결정성 CA1240PF TDS는 냉각 공기를 권장).',
               'The bubble stands at BUR 2. Start the IBC supply and exhaust blowers: supply air leaves the nozzles of the stack '
               'in the die centre and sweeps up the inside of the film, taking heat away, and the warmed air is drawn into the '
               'stack top. Three ultrasonic sensors on the cage measure the bubble and the controller trims the exhaust to hold '
               'BUR 2. No IBC air temperature is set, for lack of a PHA source (the amorphous CA1240PF TDS recommends cooling air).'],
              needs=['inflate'], spin={'ibc': [3.4, 0]}, reveal=['ibc']),
     kit.step('haul', ['닙롤 이송', 'Draw with the nip rolls'],
              ['IBC가 버블을 잡고 있습니다. 닙롤을 돌려 접힌 필름을 타워 위 가이드 롤을 지나 권취기까지 보내세요. 이송이 시작되면 모형은 닙, '
               '에어링 온도, 버블 크기와 IBC를 고정합니다.',
               'The IBC holds the bubble. Run the nip rolls to draw the lay-flat film over the tower guide rolls to the winder; '
               'the model holds the nip, the air-ring temperature, the bubble size and the IBC once drawing starts.'],
              needs=['ibc'], locks=['nip', 'air', 'inflate', 'ibc'], once=True, thread=[S_NIP, S_END],
              spin={'haul': [round((S_END - S_NIP) * NIP_PER_M, 4), 0], 'screw': [round((S_END - S_NIP) * SCREW_PER_M, 4), 0]}),
     kit.step('winder', ['권취 시작', 'Start winding'],
              ['필름이 권취 코어에 닿았습니다. 권취기를 돌려 두 겹 레이플랫을 감으세요. 모형은 76 mm 코어에서 150 mm 권취 롤까지를 압축해 '
               '보여줍니다.',
               'The film has reached the winder core. Turn the winder to wind the two-ply lay-flat; the model compresses the '
               'growth from the 76 mm core to a 150 mm roll.'],
              needs=['haul'], once=True,
              spin={'winder': [round(WIND * 1000 / (math.pi * (CORE_D + WOUND_D) / 2), 4), 0], 'haul': [round(WIND * NIP_PER_M, 4), 0],
                    'screw': [round(WIND * SCREW_PER_M, 4), 0]},
              wind={'node': 'Winder_body', 'core': round(CORE_D / WOUND_D, 4)}),
     kit.step('oscillate', ['오실레이팅 인취 · ±90° 반전', 'Oscillating haul-off · ±90° reversing'],
              ['권취가 시작되었습니다. 오실레이팅 인취를 돌리세요. 닙롤, 실린더, 접힘 프레임을 실은 프레임이 데크의 선회 베어링 위에서 버블 축을 '
               '중심으로 좌우 90°씩(총 180°, 한 주기 120 s) 천천히 반전 회전하며, 버블 둘레의 두께 편차가 권취 롤 폭 전체로 퍼집니다. 슬라이더는 '
               '가운데 → +90° → −90°의 한 번 반전입니다. 실제 장치는 터닝 바로 필름 방향을 바로잡지만, 모형은 닙 위 약 1.1 m 자유 구간에서 '
               '필름이 완만하게 비틀리는 것으로 나타냅니다.',
               'Winding has started. Start the oscillating haul-off: the frame that carries the nip rolls, their cylinders and the '
               'collapsing frame turns on a slewing ring on the deck, reversing 90° each way about the bubble axis (180° total, '
               '120 s per cycle), so the bubble’s circumferential gauge bands spread across the width of the wound roll. The '
               'slider runs one reversal: centre, +90°, then -90°. A real haul-off straightens the film with turning bars; the '
               'model shows it as a gentle twist of the film over a free span of about 1.1 m above the nip.'],
              needs=['winder'], move='oscillate')],
    ['기동 완료 · "자동 공정으로 돌아가기"를 누르면 정상 운전(5 m/min)을 재생합니다.',
     'Start-up complete. Choose "Return to cycle" to play steady running at 5 m/min.'],
    LOOP, pinned={'nip': 1, 'oscillate': 0})
MODEL_TOP = top_guide[1] + RG + .01                 # the lay-flat over the top guide rolls
centre = [(ext['x_rear'] + X_W + .3) / 2, round(MODEL_TOP / 2, 3), 0]
META = {
    'id': 'blownfilm', 'duration': LOOP, 'frames': [0, FRAMES],
    'poster': 'assets/equipment/blownfilm-motion-poster.png', 'model': 'assets/equipment/blownfilm-motion.glb',
    'center': centre, 'span': [X_W + .3 - ext['x_rear'] + .4, round(MODEL_TOP + .2, 3)], 'heightRatio': .62, 'zoom': [.7, 12],
    'controls': CONTROLS, 'startup': STARTUP,
    'views': [{'key': 'all', 'label': ['전체 라인', 'Whole line'], 'center': centre, 'zoom': 1},
              kit.camera_view('screw', ['스크류·배럴 단면', 'Screw & barrel cutaway'], (-.6, 0, AX), (1.2, -6.0, 5.2), 3.4),
              kit.camera_view('die', ['환형 다이·에어링·동결선', 'Annular die, air ring & frost line'], (X_D, 0, Z_DIE + .15), (1.5, -6.0, 3.0), 5),
              kit.camera_view('finish', ['접힘·닙롤', 'Collapse & nip'], (X_D, 0, Z_NIP - .3), (1.5, -6.0, 2.0), 3.5)],
    'heat': {'input': 'process', 'reference': 'process',
             'title': ['배럴·다이 존 온도 (입력한 설정값)', 'Barrel and die zone temperatures (entered set points)'],
             'note': kit.PROCESS_HEAT_NOTE, 'scale_labels': {'melt': ['배럴·다이', 'Barrel & die'], 'tool': ['에어링 공기', 'Air-ring air']},
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
                 'air_ring_air_c': AIR_SETPOINT,
                 'oscillation': {'total_deg': round(math.degrees(2 * OSC)), 'period_s': 120,
                                 'twist_mm': [round(TWIST[0] * 1000, 1), round(TWIST[1] * 1000, 1)],
                                 'twist_edge_strain_pct': round(EDGE_STRAIN * 100, 2)},
                 'loop_note': 'Real time: steady bubble (no breathing); the nip rolls turn three times per loop and the winder twice.'},
    'spec': {'basis': 'Pack B grade C teaching values; brand-neutral; not an OEM drawing or a PHA BUR or frost-line setting',
             'screw_d_mm': 40, 'l_d': 30, 'die_mm': 80, 'air_ring_od_mm': 240, 'bur': BUR, 'layflat_mm': round(LAYFLAT * 1000, 1),
             'frost_line_mm': 320, 'cage_inside_mm': 200, 'die_to_nip_mm': 2500, 'collapsing_mm': 700, 'nip_mm': '100, face 350', 'nip_threading_open_mm': OPEN * 1000, 'nip_cylinders': 2,
             'hot_air_ring': {
                 'train': ['inlet filter', 'centrifugal blower (VFD)', 'airflow (differential pressure) switch', 'inline electric heater',
                           'insulated manifold and four insulated hoses', 'dual-lip air ring with plenum sensor', 'PID controller (SCR)',
                           'independent manual-reset high-limit'],
                 'air_setpoint_c': AIR_SETPOINT,
                 'setpoint_basis': 'In-house practice for semi-crystalline P(3HB-co-4HB) (S1000P), given by the user on 2026-10-17. '
                                   'Literature context: PHB overall crystallization half-time minimum about 30 s at 60-70 C '
                                   '(Macromolecules 59:379, 2026); PHBH crystallizes fastest when cooled to 50-70 C (US 10030117); '
                                   'spherulite growth peaks at 75-90 C for PHB/PHBV; no published value for 2-5 mol% 4HB.',
                 'air_flow_m3_h': [150, 300], 'heater_kw': 6, 'heater_sizing': 'P = Q rho cp dT (20 -> 60 C) plus 25-50 % losses',
                 'high_limit_c': [80, 90],
                 'interlocks': ['heater only with blower running and airflow switch made', 'independent manual-reset high-limit',
                                'blower run-on after the heater stops', 'E-stop'],
                 'not_for': 'amorphous A1000P (no crystallization; CJ film TDS CA1240PF uses chilled air and IBC)',
                 'grade': 'C teaching values; not an OEM drawing',
                 'sources': 'docs/research/pha-blown-film-hot-air-ring-20261017.md'},
             'oscillating_haul_off': {
                 'type': 'nip, carriage, cylinders and collapsing frame on a frame turning on a slewing ring (gear motor and pinion)',
                 'total_deg': round(math.degrees(2 * OSC)), 'period_s': 120,
                 'film_above_nip': 'twists back to the fixed guide roll on the take-off frame over a free span 62.5-1200 mm above the '
                                   'nip, about 1.5 % edge strain at 90 deg, (theta W/2)^2 / (2 L^2); turning bars are not modelled',
                 'grade': 'C teaching values (Pack B); not an OEM drawing'},
             'ibc': {
                 'train': ['supply blower', 'die-centre supply channel', 'stack with nozzle ring', 'stack-top exhaust intake',
                           'exhaust blower', 'three ultrasonic bubble-diameter sensors on the cage', 'IBC controller (trims the exhaust)'],
                 'stack_mm': {'od': IBC_R * 2000, 'height': IBC_TOP * 1000, 'nozzle_height': IBC_NOZZLE * 1000},
                 'air_temperature': 'not set (no PHA source); the amorphous CA1240PF TDS recommends cooling air for ring and IBC',
                 'grade': 'C teaching values (Pack B: optional, separate supply and exhaust); not an OEM drawing'},
             'winder': '76 mm core to 450 mm, two-ply lay-flat',
             'sources': 'output/research/pha-equipment-realism-20261017/pack-b-answer-notes.md'},
}

floor = kit.floor('Floor', ext['x_rear'] - .3, X_W + .5, -.9, 1.0, M)
kit.studio_world(.8, 'studio.exr')
release = kit.hold_closed([nip, haul_off] + twist_carriers)    # the poster shows the running line
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
release()
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
