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
    assert bpy.context.scene.frame_end == round(meta['duration']*24)+1
    reports[kind] = {'objects': len(objects), 'motion_groups': sorted(groups)}

    if kind != 'straw':
        # The core center must stay on its bearing axis, rather than orbit in space.
        names = ['ScrewA_core'] + (['ScrewB_core'] if kind == 'compounding' else [])
        for name in names:
            centers = []
            for f in (1, 37, 73):
                frame(f)
                lo, hi = bounds(name)
                centers.append(Vector([(a+b)/2 for a, b in zip(lo, hi)]))
            assert max((center-centers[0]).length for center in centers) < .001, (kind, name)
        checks.append(kind+': screw cores remain on their bearing axes')

    if kind in ('extrusion', 'compounding'):
        assert surface_velocity('PullerLower', (0, 0, .205)).x > 0
        assert surface_velocity('PullerUpper', (0, 0, -.205)).x > 0
        checks.append(kind+': both puller contacts move downstream')
        if kind == 'compounding':
            frame(1)
            first = [objects[name].rotation_euler.x for name in ('ScrewA', 'ScrewB')]
            frame(20)
            delta = [objects[name].rotation_euler.x-a for name, a in zip(('ScrewA', 'ScrewB'), first)]
            assert delta[0]*delta[1] > 0
            close(delta[0], delta[1])
            checks.append('compounding: both screws co-rotate')

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
