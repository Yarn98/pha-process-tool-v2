"""Read-only checks on saved teaching rigs, independent of their construction code.

blender -b --factory-startup --python-exit-code 1 --python tests/blender-line-models.py
These checks verify geometry and motion, not production performance or OEM design.
"""
import hashlib
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

    if kind not in ('straw', 'compounding', 'extrusion'):
        # The core center must stay on its bearing axis, rather than orbit in space.
        names = ['ScrewA_core']
        for name in names:
            centers = []
            for f in (1, 37, 73):
                frame(f)
                lo, hi = bounds(name)
                centers.append(Vector([(a+b)/2 for a, b in zip(lo, hi)]))
            assert max((center-centers[0]).length for center in centers) < .001, (kind, name)
        checks.append(kind+': screw cores remain on their bearing axes')
        reports[kind]['screw_direction'] = [screw_direction(name.removesuffix('_core'), name.removesuffix('_core')+'_flight', 0, 1, -1, 2) for name in names]
        checks.append(kind+': signed screw rotation matches actual helix and downstream +X feed')

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
        web_clearance('SheetWeb', [('BottomRoll', .46), ('MiddleRoll', .46), ('TopRoll', .46), ('SheetGuideRoll', .29), ('Winder', .60)])
        assert surface_velocity('BottomRoll', (0, 0, .46)).x > 0
        assert surface_velocity('MiddleRoll', (0, 0, -.46)).x > 0
        assert surface_velocity('MiddleRoll', (0, 0, .46)).x < 0
        assert surface_velocity('TopRoll', (0, 0, -.46)).x < 0
        checks.append('sheet: upstack web clearance and both nip contact directions')

    elif kind == 'castfilm':
        web_clearance('CastFilmWeb', [('ChillRoll', .70), ('FilmGuideRoll', .29), ('Winder', .61)])
        assert surface_velocity('ChillRoll', (0, 0, .70)).x > 0
        assert surface_velocity('FilmGuideRoll', (0, 0, -.29)).x > 0
        checks.append('castfilm: web stays outside chill, guide and winding rolls')

    elif kind == 'blownfilm':
        assert surface_velocity('NipLeft', (.205, 0, 0)).z > 0
        assert surface_velocity('NipRight', (-.205, 0, 0)).z > 0
        web_clearance('FlattenedFilmWeb', [('NipLeft', .205), ('NipRight', .205), ('TowerGuideRoll', .24), ('Winder', .62)])
        frame(1)
        points = vertices('FilmBubble')
        top = [p for p in points if p.z > 5.19]
        assert max(abs(p.x) for p in top) < .015, 'Collapsed tube must enter between nip rolls'
        close(max(p.y for p in top)-min(p.y for p in top), 1.84)
        width1 = max(p.y for p in points if 2.6 < p.z < 2.8)
        frame(289)
        width2 = max(p.y for p in vertices('FilmBubble') if 2.6 < p.z < 2.8)
        assert width2 > width1*1.30
        checks.append('blownfilm: upward nip contacts, web clearance, flattening orientation and bubble morph')

    elif kind == 'blowmolding':
        frame(25)
        short = bounds('HollowParison')
        frame(73)
        full = bounds('HollowParison')
        close(short[1][2], full[1][2])
        assert short[0][2] > full[0][2]+1
        frame(112)
        narrow = bounds('FormedBottle')
        frame(165)
        expanded = bounds('FormedBottle')
        close(expanded[0][2], 1.37)
        close(expanded[1][2], 3.20)
        close((expanded[0][0]+expanded[1][0])/2, .7)
        assert expanded[1][0]-expanded[0][0] > 2*(narrow[1][0]-narrow[0][0])
        close(objects['MoldLeft'].location.x, 0)
        close(objects['MoldRight'].location.x, 0)
        frame(229)
        close(objects['BlowPin'].location.z, 0)
        assert objects['MoldRight'].location.x > .5
        frame(261)
        dropped = bounds('ReleasedBottleMesh')
        close(dropped[0][2], .71)
        checks.append('blowmolding: head-anchored parison, cavity-aligned morph, pin retraction before opening and product discharge')

    elif kind == 'straw':
        reports[kind]['screw_direction'] = [screw_direction('Screw rotation — illustrative speed', 'Continuous helical screw flight', 0, 1, 1, 1)]
        checks.append('straw: opposite-handed borrowed helix retains its correct +X rotation')
        frame(1)
        upper = objects['Upper tread 00']
        lower = min((o for o in objects if o.name.startswith('Lower tread ')), key=lambda o: abs(o.location.x-5.15)+abs(o.location.z-1.741))
        first = {obj.name: tuple(obj.location) for obj in (upper, lower)}
        segment1 = bounds('Cut strand at outlet')
        frame(2)
        assert all(obj.location.x > first[obj.name][0] for obj in (upper, lower))
        close(first[upper.name][2]-.009, 1.85)
        close(first[lower.name][2]+.009, 1.75)
        frame(15)
        segment2 = bounds('Cut strand at outlet')
        assert segment2[0][0] > segment1[0][0]+.2
        assert segment2[0][2] < segment1[0][2]-.04
        close(segment1[1][0]-segment1[0][0], segment2[1][0]-segment2[0][0])
        frame(60)
        segment3 = bounds('Cut strand at outlet')
        assert .2 < segment3[1][0]-segment3[0][0] < .6
        for obj in objects:
            if 'BoltFactory flange fastener' in obj.name:
                assert .005 < max(obj.dimensions) < .2
        snapshot = ROOT/'assets/equipment/sources/straw-optimizer-v2.blend'
        assert hashlib.sha256(snapshot.read_bytes()).hexdigest() == '91b712018468ed304c4101eeaf5e57ffd6da8a2a5ef337e24ea0344ab3ee2bb1'
        checks.append('straw: original snapshot hash, belt contact direction, visible fasteners and cut-segment discharge/regrowth')

checks.append('All seven rigs: embedded geometry, finite transforms and all configured motion groups')
report = {'status': 'pass', 'blender': bpy.app.version_string, 'checks': checks, 'models': reports}
path = ROOT/'output/blender-all-equipment-check.json'
path.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print('BLENDER_LINE_CHECKS_PASSED', json.dumps(report), flush=True)
