"""Read-only checks on saved teaching rigs, independent of their construction code.

blender -b --factory-startup --python-exit-code 1 --python tests/blender-line-models.py
These checks verify geometry and motion, not production performance or OEM design.
"""
import json
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
checks = []
reports = {}


def frame(number):
    bpy.context.scene.frame_set(number)
    bpy.context.view_layer.update()


def vertices(name):
    obj = bpy.data.objects[name].evaluated_get(bpy.context.evaluated_depsgraph_get())
    return [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]


def bounds(name):
    points = vertices(name)
    return [min(p[i] for p in points) for i in range(3)], [max(p[i] for p in points) for i in range(3)]


def close(a, b, tolerance=1e-4):
    assert abs(a-b) < tolerance, (a, b)


def surface_velocity(name, radius_vector):
    """Track one actual surface point over a small interval in the native rig."""
    obj = bpy.data.objects[name]
    frame(1)
    point = obj.matrix_world @ Vector(radius_vector)
    frame(2)
    return obj.matrix_world @ Vector(radius_vector) - point


def screw_direction(owner_name, flight_name, axis, feed_sign, rotation_sign, turns):
    """Measure signed helix phase and animation, independently of mesh sample indices.

    At a fixed barrel azimuth theta=k*s+phi(t), crest displacement is -dphi/k.
    This checks teaching geometry/direction; it does not predict material velocity.
    """
    first_frame = bpy.context.scene.frame_start
    frame(first_frame)
    owner = bpy.data.objects[owner_name]
    center = owner.matrix_world.translation.copy()
    # Right-handed radial coordinates about +X or +Y.
    radial = (1, 2) if axis == 0 else (2, 0)
    points = vertices(flight_name)
    radius = max(math.hypot(p[radial[0]]-center[radial[0]], p[radial[1]]-center[radial[1]]) for p in points)
    outer = sorted((p[axis], math.atan2(p[radial[1]]-center[radial[1]], p[radial[0]]-center[radial[0]]))
                   for p in points if math.hypot(p[radial[0]]-center[radial[0]], p[radial[1]]-center[radial[1]]) > .90*radius)
    assert len(outer) > 25 and outer[-1][0]-outer[0][0] > .5
    phase = [outer[0][1]]
    for before, after in zip(outer, outer[1:]):
        phase.append(phase[-1]+(after[1]-before[1]+math.pi)%math.tau-math.pi)
    mean_s = sum(p[0] for p in outer)/len(outer)
    mean_phase = sum(phase)/len(phase)
    slope = sum((p[0]-mean_s)*(a-mean_phase) for p,a in zip(outer,phase))/sum((p[0]-mean_s)**2 for p in outer)
    assert abs(slope) > .1
    start = owner.rotation_euler.copy()
    frame(first_frame+1)
    delta = Vector(owner.rotation_euler)-Vector(start)
    assert delta[axis]*rotation_sign > 0, (owner_name, 'Wrong signed rotation', list(delta))
    assert all(abs(delta[i]) < 1e-6 for i in range(3) if i != axis), (owner_name, 'Unexpected rotation axis')
    crest_step = -delta[axis]/slope
    assert crest_step*feed_sign > 0, (owner_name, 'Helix motion opposes feed direction', slope, crest_step)
    frame(bpy.context.scene.frame_end)
    total = owner.rotation_euler[axis]-start[axis]
    close(total, rotation_sign*turns*math.tau)
    return {'node':owner_name, 'axis':'XYZ'[axis], 'helix_phase_slope':slope,
            'rotation_radians_per_frame':delta[axis], 'total_radians':total,
            'fixed_azimuth_crest_step':crest_step, 'feed_axis_sign':feed_sign,
            'scope':'geometry direction only; not material velocity'}


def bilobal_direction(owner_name, mesh_name, axis, axial_range, feed_sign, rotation_sign, turns):
    """Twin-screw element twist versus rotation for a bilobal (two-tip) profile.

    Tip azimuths are folded mod pi (the two tips coincide), unwrapped along the axis and fitted
    against axial position; a fixed-azimuth crest then moves by -d(rotation)/slope per frame.
    ``axis`` 0 = world X, 1 = world Y; ``axial_range`` selects one conveying element; ``rotation_sign`` is
    the sense about that world axis (right-hand rule).
    """
    scene = bpy.context.scene
    frame(scene.frame_start)
    owner = bpy.data.objects[owner_name]
    center = owner.matrix_world.translation.copy()
    radial = (1, 2) if axis == 0 else (2, 0)
    points = [p for p in vertices(mesh_name) if axial_range[0] < p[axis] < axial_range[1]]

    def radius(p):
        return math.hypot(p[radial[0]]-center[radial[0]], p[radial[1]]-center[radial[1]])
    tip = max(radius(p) for p in points)
    tips = sorted((p[axis], math.atan2(p[radial[1]]-center[radial[1]], p[radial[0]]-center[radial[0]]) % math.pi)
                  for p in points if radius(p) > .985*tip)
    assert len(tips) > 25, (owner_name, len(tips))
    phase = [tips[0][1]]
    for before, after in zip(tips, tips[1:]):
        phase.append(phase[-1]+(after[1]-before[1]+math.pi/2) % math.pi-math.pi/2)
    mean_s = sum(t[0] for t in tips)/len(tips)
    mean_phase = sum(phase)/len(phase)
    slope = sum((t[0]-mean_s)*(a-mean_phase) for t, a in zip(tips, phase))/sum((t[0]-mean_s)**2 for t in tips)
    rest = owner.matrix_world.to_quaternion()
    frame(scene.frame_start+1)
    step = owner.matrix_world.to_quaternion() @ rest.inverted()     # world-frame rotation over one frame
    world_axis = Vector((1, 0, 0)) if axis == 0 else Vector((0, 1, 0))
    alignment = Vector(step.axis).normalized().dot(world_axis)    # small-angle axes come back unnormalised
    assert abs(abs(alignment)-1) < 1e-4, (owner_name, 'rotation axis', tuple(step.axis))
    signed = step.angle*(1 if alignment > 0 else -1)
    assert signed*rotation_sign > 0, (owner_name, 'rotation sense', signed)
    crest_step = -signed/slope
    assert crest_step*feed_sign > 0, (owner_name, 'twist conveys against the feed direction', slope, crest_step)
    frame(scene.frame_end)
    close(abs(owner.rotation_euler.x), turns*math.tau)
    return {'node': owner_name, 'axis': 'XY'[axis], 'tip_phase_slope': slope, 'radians_per_frame': signed,
            'fixed_azimuth_crest_step': crest_step, 'turns_per_loop': turns,
            'scope': 'geometry direction only; not material velocity'}


def world_velocity(name, offset):
    """World-space motion over one frame of the surface point at ``offset`` (world) from the object origin."""
    obj = bpy.data.objects[name]
    first = bpy.context.scene.frame_start
    frame(first)
    point = obj.matrix_world.translation+Vector(offset)
    local = obj.matrix_world.inverted() @ point
    frame(first+1)
    return obj.matrix_world @ local-point


def web_clearance(web, rolls):
    """The web must not cut through a solid roll at a bend or transfer segment."""
    frame(1)
    points = vertices(web)
    for name, radius in rolls:
        center = bpy.data.objects[name].matrix_world.translation
        minimum = min(math.hypot(p.x-center.x, p.z-center.z) for p in points)
        assert minimum > radius-.005, (web, name, minimum, radius)


for kind in ('extrusion', 'compounding', 'sheet', 'castfilm', 'blownfilm', 'blowmolding', 'straw'):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/equipment'/f'{kind}-motion.blend'))
    objects = bpy.data.objects
    assert not bpy.data.libraries, 'No external linked assets: '+kind
    assert all(math.isfinite(value) for obj in objects for value in (*obj.location, *obj.scale))
    meta = json.loads((ROOT/'assets/equipment'/f'{kind}-motion.json').read_text(encoding='utf-8'))
    groups = {obj.get('motion_group') for obj in objects if obj.get('motion_group')}
    assert {control['key'] for control in meta['controls']} <= groups
    assert bpy.context.scene.frame_end-bpy.context.scene.frame_start == round(meta['duration']*24)
    reports[kind] = {'objects': len(objects), 'motion_groups': sorted(groups)}

    if kind == 'extrusion':
        turns, teaching = meta['turns'], meta['teaching']
        reports[kind]['screw_direction'] = [screw_direction('Extruder screw', 'Extruder screw flight', 0, 1, -1, turns['screw'])]
        checks.append(kind+': signed screw rotation matches the helix and conveys toward the die (+X)')
        # Belt haul-off: the runs that grip the profile move downstream at both pulleys.
        radius = teaching['pulley_mm']/2000
        for end in ('In', 'Out'):
            assert surface_velocity('BeltPulleyLower'+end, (0, 0, radius)).x > 0
            assert surface_velocity('BeltPulleyUpper'+end, (0, 0, -radius)).x > 0
        close(teaching['rpm']['haul'], round(1000*teaching['line_speed_m_min']/(math.pi*teaching['pulley_mm']), 3), 1e-6)
        checks.append(kind+': both belt runs that grip the profile move downstream; pulley speed = 1000 v / (pi d)')
        # Flying saw: during the cut the carriage travels with the profile at line speed.
        saw = objects['SawCarriage']
        cut = saw['cut_frame']
        frame(cut)
        x0 = saw.matrix_world.translation.x
        frame(cut+1)
        step = saw.matrix_world.translation.x-x0
        close(step, teaching['line_speed_m_min']/60/24, 1e-6)
        assert meta['cut_edges'] == 1 and turns['cutter'] == 1
        close(meta['duration'], teaching['cut_length_mm']/1000/(teaching['line_speed_m_min']/60), 1e-9)
        checks.append(kind+': flying saw moves with the profile at line speed while cutting; one 500 mm cut per loop')

    elif kind == 'compounding':
        turns = meta['turns']
        # Main screws: the first conveying element (0-128 mm) turns negatively and conveys toward the die (+X).
        reports[kind]['screw_direction'] = [bilobal_direction(name, name+'_elements', 0, (.012, .116), 1, -1, turns['screw'])
                                            for name in ('ScrewA', 'ScrewB')]
        frame(0)
        axes = [objects[name].matrix_world.translation.copy() for name in ('ScrewA', 'ScrewB')]
        first = [objects[name].rotation_euler.x for name in ('ScrewA', 'ScrewB')]
        frame(20)
        assert all((objects[name].matrix_world.translation-a).length < 1e-6 for name, a in zip(('ScrewA', 'ScrewB'), axes))
        delta = [objects[name].rotation_euler.x-a for name, a in zip(('ScrewA', 'ScrewB'), first)]
        assert delta[0] < 0 and delta[1] < 0
        close(delta[0], delta[1])
        close(abs(axes[1].y-axes[0].y), meta['spec']['centre_distance_mm']/1000)
        checks.append('compounding: both bilobal screws co-rotate on fixed axes at the stated centre distance and convey toward the die')
        # Side-feeder screws run along world Y, turn positively about +Y and convey toward the main barrel (-Y).
        reports[kind]['side_feeder_direction'] = [bilobal_direction(name, name+'_elements', 1, (.12, .5), -1, 1, turns['side'])
                                                  for name in ('SideScrewA', 'SideScrewB')]
        checks.append('compounding: side-feeder screws convey toward the main barrel (-Y)')
        # Pelletiser: both feed-roll contacts move the strands downstream; blades pass the bed knife downward.
        lower, upper = objects['FeedRollLower'], objects['FeedRollUpper']
        frame(0)
        nip = (lower.matrix_world.translation.z+upper.matrix_world.translation.z)/2
        top = lower.matrix_world.translation+Vector((0, 0, nip-lower.matrix_world.translation.z))
        bottom = upper.matrix_world.translation-Vector((0, 0, upper.matrix_world.translation.z-nip))
        local_top, local_bottom = lower.matrix_world.inverted() @ top, upper.matrix_world.inverted() @ bottom
        rotor = objects['PelletRotor']
        knife_side = rotor.matrix_world.translation-Vector((.05, 0, 0))
        local_knife = rotor.matrix_world.inverted() @ knife_side
        frame(1)
        assert (lower.matrix_world @ local_top).x > top.x and (upper.matrix_world @ local_bottom).x > bottom.x
        assert (rotor.matrix_world @ local_knife).z < knife_side.z
        frame(bpy.context.scene.frame_end)
        for name, key in (('FeedRollLower', 'haul'), ('PelletRotor', 'cutter')):
            close(abs(objects[name].rotation_euler.x), turns[key]*math.tau)
        checks.append('compounding: feed-roll nip moves strands downstream, rotor blades pass the bed knife downward, whole turns per loop')
        # Teaching kinematics: n = 1000 v / (pi d) and n_r = 1000 v / (z L_p), all on one time scale.
        teaching = meta['teaching']
        close(teaching['rpm']['haul'], round(1000*teaching['line_speed_m_min']/(math.pi*teaching['feed_roll_mm']), 2), 1e-6)
        close(teaching['rpm']['cutter'], round(1000*teaching['line_speed_m_min']/(meta['cut_edges']*teaching['pellet_mm']), 2), 1e-6)
        for key, value in turns.items():
            exact = teaching['rpm'][key]*teaching['time_scale']*meta['duration']/60
            assert abs(value-exact)/exact < .006, (key, value, exact)
        checks.append('compounding: roll and rotor speeds follow line speed, roll diameter, cutting edges and pellet length within 0.6 %')

    elif kind == 'sheet':
        teaching = meta['teaching']
        reports[kind]['screw_direction'] = [screw_direction('Extruder screw', 'Extruder screw flight', 0, 1, -1, meta['turns']['screw'])]
        r = teaching['roll_mm']['stack']/2000
        web_clearance('SheetWeb', [('TopRoll', r), ('MiddleRoll', r), ('BottomRoll', r)])
        # S-wrap contact directions: first nip, round the middle roll's +X side, second nip, round the bottom roll's -X side.
        assert world_velocity('TopRoll', (0, 0, -r)).x > 0
        assert world_velocity('MiddleRoll', (0, 0, r)).x > 0 and world_velocity('MiddleRoll', (r, 0, 0)).z < 0
        assert world_velocity('MiddleRoll', (0, 0, -r)).x < 0 and world_velocity('BottomRoll', (0, 0, r)).x < 0
        assert world_velocity('BottomRoll', (-r, 0, 0)).z < 0 and world_velocity('BottomRoll', (0, 0, -r)).x > 0
        # Every roll the web touches moves its contact surface at the same line speed: n = 1000 v / (pi d).
        step = teaching['line_speed_m_min']/60/24
        rolls = [('TopRoll', 'stack'), ('MiddleRoll', 'stack'), ('BottomRoll', 'stack'), ('TableRoll00', 'table'), ('TableRoll09', 'table'),
                 ('HaulRollLower', 'haul'), ('HaulRollUpper', 'haul'), ('Winder', 'winder_now')]
        for name, key in rolls:
            radius = teaching['roll_mm'][key]/2000
            speed = world_velocity(name, (0, 0, radius if name not in ('TopRoll', 'HaulRollUpper') else -radius)).length
            assert abs(speed-step)/step < .01, (name, speed, step)
        assert world_velocity('HaulRollUpper', (0, 0, -teaching['roll_mm']['haul']/2000)).x > 0
        assert world_velocity('Winder', (0, 0, teaching['roll_mm']['winder_now']/2000)).x > 0
        checks.append('sheet: S-wrap clearance, all nip and wrap directions, and one surface speed for stack, table, haul-off and winder')

    elif kind == 'castfilm':
        teaching = meta['teaching']
        reports[kind]['screw_direction'] = [screw_direction('Extruder screw', 'Extruder screw flight', 0, 1, -1, meta['turns']['screw'])]
        mm = teaching['roll_mm']
        r1, r2, r3, rg, rw = (mm[key]/2000 for key in ('chill', 'second', 'third', 'guide', 'winder_now'))
        web_clearance('CastFilmWeb', [('ChillRoll', r1), ('SecondRoll', r2), ('ThirdRoll', r3)])
        web_clearance('CastFilmTrimmed', [('DancerRoll', rg)])
        # 180 deg chill wrap on the +X side, S-transfer round the second roll, then over the third roll.
        assert world_velocity('ChillRoll', (0, 0, r1)).x > 0 and world_velocity('ChillRoll', (r1, 0, 0)).z < 0
        assert world_velocity('ChillRoll', (0, 0, -r1)).x < 0 and world_velocity('SecondRoll', (0, 0, r2)).x < 0
        assert world_velocity('SecondRoll', (-r2, 0, 0)).z < 0 and world_velocity('SecondRoll', (0, 0, -r2)).x > 0
        assert world_velocity('ThirdRoll', (0, 0, r3)).x > 0 and world_velocity('FilmGuideRoll', (0, 0, rg)).x > 0
        assert world_velocity('DancerRoll', (0, 0, -rg)).x > 0 and world_velocity('Winder', (0, 0, rw)).x > 0
        step = teaching['line_speed_m_min']/60/24
        for name, radius in (('ChillRoll', r1), ('SecondRoll', r2), ('ThirdRoll', r3), ('FilmGuideRoll', rg), ('DancerRoll', rg),
                             ('Winder', rw)):
            speed = world_velocity(name, (0, 0, radius)).length
            assert abs(speed-step)/step < .01, (name, speed, step)
        frame(bpy.context.scene.frame_start)
        ys = []
        for f in range(bpy.context.scene.frame_start, bpy.context.scene.frame_end+1, 6):
            frame(f)
            ys.append(objects['GaugeHead'].matrix_world.translation.y)
        assert min(ys) < -.3 and max(ys) > .3, 'O-frame head traverses the web width'
        checks.append('castfilm: chill wrap, S-transfer, guide, dancer and winder directions; one surface speed; traversing gauge')

    elif kind == 'blownfilm':
        teaching = meta['teaching']
        reports[kind]['screw_direction'] = [screw_direction('Extruder screw', 'Extruder screw flight', 0, 1, -1, meta['turns']['screw'])]
        mm = teaching['roll_mm']
        rn, rg, rw = mm['nip']/2000, mm['guide']/2000, mm['winder_now']/2000
        assert world_velocity('NipLeft', (rn, 0, 0)).z > 0 and world_velocity('NipRight', (-rn, 0, 0)).z > 0
        web_clearance('FlattenedFilmWeb', [('TowerGuideRoll', rg), ('TowerGuideRoll2', rg), ('LowerGuideRoll', rg), ('Winder', rw)])
        step = teaching['line_speed_m_min']/60/24
        for name, radius in (('NipLeft', rn), ('NipRight', rn), ('TowerGuideRoll', rg), ('TowerGuideRoll2', rg), ('LowerGuideRoll', rg),
                             ('Winder', rw)):
            speed = world_velocity(name, (0, 0, radius)).length
            assert abs(speed-step)/step < .01, (name, speed, step)
        # Steady BUR 2 bubble: draw-down to the frost line, constant diameter in the cage, collapse to the lay-flat.
        frame(bpy.context.scene.frame_start)
        points = vertices('FilmBubble')
        z0, z1 = min(p.z for p in points), max(p.z for p in points)
        close(z1-z0, teaching['die_to_nip_mm']/1000, 1e-3)

        levels = sorted({round(p.z-z0, 5) for p in points})

        def ring(target):
            height = min(levels, key=lambda h: abs(h-target))      # nearest modelled section
            row = [p for p in points if abs(p.z-(z0+height)) < 1e-4]
            assert len(row) >= 32, (height, len(row))
            cx, cy = sum(p.x for p in row)/len(row), sum(p.y for p in row)/len(row)
            row.sort(key=lambda p: math.atan2(p.y-cy, p.x-cx))
            perimeter = sum((b-a).length for a, b in zip(row, row[1:]+row[:1]))
            return row, cx, perimeter
        die_row, cx, _ = ring(0)
        close(max(math.hypot(p.x-cx, p.y) for p in die_row)*2, teaching['die_mm']/1000, 1e-3)
        frost_row, _, perimeter = ring(teaching['frost_line_mm']/1000)
        bubble = max(math.hypot(p.x-cx, p.y) for p in frost_row)*2
        close(bubble, teaching['bubble_mm']/1000, 1e-3)
        close(bubble/(teaching['die_mm']/1000), teaching['bur'], 1e-3)
        assert bubble < teaching['cage_inside_mm']/1000, 'bubble passes inside the stabilising cage'
        top_row, _, top_perimeter = ring(teaching['die_to_nip_mm']/1000)
        close(max(abs(p.y) for p in top_row)*2, teaching['layflat_mm']/1000, 2e-3)
        assert max(abs(p.x-cx) for p in top_row) < .002, 'collapsed tube enters the nip flat'
        mid_row, _, mid_perimeter = ring((teaching['die_to_nip_mm']-teaching['collapsing_mm']/2)/1000)
        assert abs(mid_perimeter-perimeter)/perimeter < .01, 'circumference held through the collapsing frame'
        frame(bpy.context.scene.frame_end)
        assert vertices('FilmBubble')[0] == points[0], 'steady bubble: no breathing over the loop'
        checks.append('blownfilm: upward nip contacts, one surface speed, BUR 2 bubble inside the cage, lay-flat = pi D / 2, steady bubble')

    elif kind == 'blowmolding':
        T, teaching, blow = meta['timeline'], meta['teaching'], meta['blow']
        reports[kind]['screw_direction'] = [screw_direction('Extruder screw', 'Extruder screw flight', 0, 1, -1, meta['turns']['screw'])]

        def at(seconds):
            frame(round(seconds*24))
        to_blender = lambda v: Vector((v[0], -v[2], v[1]))
        parison, carriage, pin = objects['ParisonLength'], objects['ShuttleCarriage'], objects['BlowPin']
        axis_x = parison.matrix_world.translation.x
        # Continuous parison: one length per cycle, cut at t = 0; the mould captures it at 11.5-12 s.
        at(.5)
        short = parison.scale.z
        at(T['capture'][0])
        assert short < .06 and parison.scale.z > .95
        length = bounds('HollowParison')
        close(length[1][2]-length[0][2], teaching['parison_mm']['length']/1000*parison.scale.z, 2e-3)
        # Shuttle: head station while the parison grows, blow station from the cut until the return.
        at(T['hold_cool'][0]+1)
        station = carriage.matrix_world.translation.y
        close(station, -teaching['shuttle_mm']/1000)
        close(objects['MoldLeft'].location.x, 0)
        close(objects['MoldRight'].location.x, 0)
        close(pin.location.z, -teaching['pin_stroke_mm']/1000)
        close(objects['FormedBottle'].data.shape_keys.key_blocks['Inflated'].value, 1)
        body = bounds('FormedBottle')
        close(body[1][2]-body[0][2], teaching['bottle_mm']['height']/1000, 1e-3)
        close(body[1][0]-body[0][0], teaching['bottle_mm']['body_d']/1000, 1e-3)
        close((body[0][1]+body[1][1])/2, station, 1e-3)
        close(objects['InflatedBody'].matrix_world.translation.y, station)
        at(T['inflate'][0]-.1)
        narrow = bounds('FormedBottle')
        close(narrow[1][0]-narrow[0][0], teaching['parison_mm']['od']/1000, 1e-3)
        at(T['parison'][0]+.5)
        close(carriage.matrix_world.translation.y, 0)
        close(objects['MoldRight'].location.x-objects['MoldLeft'].location.x, teaching['opening_mm']/1000)
        close(pin.location.z, 0)
        # Knife crosses the parison axis right after the cut.
        at(.15)
        knife = bounds('ParisonKnife_body')
        assert knife[0][0] < axis_x < knife[1][0]
        # Take-out lands the bottle on the conveyor; the air window covers inflation and hold.
        at(T['take_out'][1])
        released = objects['ReleasedBottle']
        assert (released.matrix_world.translation-to_blender(blow['release']['to'])).length < 5e-3 and released.scale.x > .99   # nearest frame
        at(T['exhaust'][0])
        assert released.scale.x < .01
        assert blow['air'][0] == T['inflate'][0] and blow['air'][1] == T['exhaust'][1]
        checks.append('blowmolding: continuous parison, capture, knife, 300 mm shuttle, 50 mm pin, 160 mm opening, bottle morph from the parison and conveyor take-out')
        # Linkages over the whole cycle: each clamp rod ends at its platen face (125 mm from the axis, plus the
        # opening) and keeps its inner end inside the body (285 mm rod end to 418 mm cap); the shuttle rod stays
        # fixed to the carriage clevis (y = 150 mm) and inside its cylinder (y 180-550 mm).
        rods = {side: next(o for o in objects if o.name.startswith('Clamp cylinder rod') and o.parent and o.parent.name == half)
                for side, half in ((-1, 'MoldLeft'), (1, 'MoldRight'))}
        for f in range(0, round(meta['duration']*24)+1, 6):
            frame(f)
            for side, rod in rods.items():
                lo, hi = bounds(rod.name)
                inner, outer = (lo[0], hi[0]) if side < 0 else (hi[0], lo[0])
                assert .285 < side*(inner-axis_x) < .418, (rod.name, f, inner)
                close(side*(outer-axis_x), .125+side*rod.parent.location.x)
            lo, hi = bounds('Shuttle cylinder rod')
            close(lo[1], .15+carriage.matrix_world.translation.y)
            assert .18 < hi[1] < .55, ('shuttle rod', f, hi[1])
        checks.append('blowmolding: clamp rods ride the mould halves from their cylinders and the shuttle rod from its cylinder through the full strokes')

    elif kind == 'straw':
        turns, teaching = meta['turns'], meta['teaching']
        reports[kind]['screw_direction'] = [screw_direction('Extruder screw', 'Extruder screw flight', 0, 1, -1, turns['screw'])]
        checks.append(kind+': signed screw rotation matches the helix and conveys toward the die (+X)')
        # Belt runs and bath guide pulleys that touch the straws move downstream; drum speed = 1000 v / (pi d).
        for end in ('In', 'Out'):
            assert surface_velocity('BeltPulleyLower'+end, (0, 0, teaching['pulley_mm']/2000)).x > 0
            assert surface_velocity('BeltPulleyUpper'+end, (0, 0, -teaching['pulley_mm']/2000)).x > 0
        for i in (1, 2, 3):
            assert surface_velocity('BathGuidePulley%d' % i, (0, 0, teaching['guide_pulley_mm']/2000)).x > 0
        for key, d in (('haul', teaching['pulley_mm']), ('guide', teaching['guide_pulley_mm'])):
            close(teaching['rpm'][key], round(1000*teaching['line_speed_m_min']/(math.pi*d), 3), 1e-6)
        checks.append('straw: belt runs and bath guide pulleys touching the straws move downstream; drum speed = 1000 v / (pi d)')
        # Four lanes at 40 mm pitch, 6 mm OD.
        frame(0)
        lane = bounds('StrawLane1')
        centres = [(lambda b: (b[0][1]+b[1][1])/2)(bounds('StrawLane%d' % i)) for i in range(1, teaching['lanes']+1)]
        assert all(abs(b-a-teaching['lane_pitch_mm']/1000) < 1e-4 for a, b in zip(centres, centres[1:])), centres
        close(lane[1][2]-lane[0][2], teaching['straw_mm']['od']/1000, 2e-4)
        # Rotary cutter: at every cut frame the knife points down below the straws and moves downstream, exactly
        # when a 200 mm piece's rear end is at the knife; five cuts per 5 s loop with one knife.
        rotor, knife = objects['CutterRotor'], teaching['knife_mm']/2000
        x_cut = rotor.matrix_world.translation.x
        assert list(rotor['cut_frames']) == [round(k*24*meta['duration']/turns['cutter']) for k in range(turns['cutter'])]
        for f in rotor['cut_frames']:
            frame(f)
            tip = rotor.matrix_world @ Vector((0, 0, -knife))
            assert tip.z < lane[0][2] and abs(tip.x-x_cut) < 1e-6, ('knife below the straws at the cut', f, tuple(tip))
            rear = [o.matrix_world.translation.x-teaching['cut_length_mm']/2000 for o in objects if o.name.startswith('CutStraw1_') and o.scale.x > .99]
            assert min(abs(x-x_cut) for x in rear) < 2e-3, ('a piece rear end at the knife on each cut', f)
            frame(f+1)
            assert (rotor.matrix_world @ Vector((0, 0, -knife))).x > tip.x, 'knife tip moves downstream at the bottom'
        close(meta['duration'], turns['cutter']*teaching['cut_length_mm']/1000/(teaching['line_speed_m_min']/60), 1e-9)
        assert meta['cut_edges'] == 1
        checks.append('straw: four lanes at 40 mm pitch, 6 mm OD; the knife passes below the straws moving downstream once per turn as each 200 mm piece is cut; five cuts per 5 s loop')

checks.append('All seven rigs: embedded geometry, finite transforms and all configured motion groups')
report = {'status': 'pass', 'blender': bpy.app.version_string, 'checks': checks, 'models': reports}
path = ROOT/'output/blender-all-equipment-check.json'
path.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print('BLENDER_LINE_CHECKS_PASSED', json.dumps(report), flush=True)
