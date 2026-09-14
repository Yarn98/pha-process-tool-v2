"""Validate native and exported teaching topology, metadata and scene isolation.

blender --background --factory-startup --python-exit-code 1 --python tests/blender-vent-guide.py
This is not a fluid-flow, screw-clearance, seal-performance or PHA process test.
"""
from pathlib import Path
import collections
import hashlib
import json
import math
import struct
import bpy
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
STATES = ('without_reverse_full', 'upstream_reverse_full')
FLOW = {'solid', 'melt', 'atm_gas', 'vac_gas'}
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art/troubleshooting/vent-guide.blend'))
roots = [bpy.data.objects.get(name) for name in STATES]
assert all(roots), 'Missing independent state roots'
records = []
for root in roots:
    assert not root.parent
    assert tuple(root.location) == (0,0,0)
    assert tuple(root.scale) == (1,1,1)
    assert root['physical_process_solver'] is False
    nodes = list(root.children_recursive)
    meshes = [obj for obj in nodes if obj.type == 'MESH']
    assert len(meshes) > 140
    assert all(len(obj.data.vertices) and len(obj.data.polygons) for obj in meshes)
    assert all(math.isfinite(value) for obj in meshes for vert in obj.data.vertices for value in vert.co)
    focus_bounds = {}
    for focus in ('atm','vac','seal'):
        focused = [obj for obj in meshes if obj.get('vent_focus') == focus]
        assert len(focused) >= 5, (focus,'Missing equipment context')
        coords = [obj.matrix_world @ Vector(corner) for obj in focused for corner in obj.bound_box]
        xyz_min = [min(p[i] for p in coords) for i in range(3)]
        xyz_max = [max(p[i] for p in coords) for i in range(3)]
        focus_bounds[focus] = {'three_min':[xyz_min[0],xyz_min[2],-xyz_max[1]],
                               'three_max':[xyz_max[0],xyz_max[2],-xyz_min[1]],
                               'meshes':len(focused)}
    ports = {obj.get('vent_part'):obj for obj in nodes if obj.get('vent_part') in ('atmospheric_port','vacuum_port')}
    assert len(ports) == 2
    for port in ports.values():
        assert port['educational_cutaway'] is True
        center_x = sum(v.co.x for v in port.data.vertices)/len(port.data.vertices)
        found,point,normal,face = port.ray_cast(Vector((center_x,-1,2)),Vector((0,1,0)))
        assert found and point.y > 0, 'Gas teaching path must be visible through near-side port cutaway'
    # Their geometry was authored in parent-local coordinates around its true x location.
    atm_x = sum(v.co.x for v in ports['atmospheric_port'].data.vertices)/len(ports['atmospheric_port'].data.vertices)
    vac_x = sum(v.co.x for v in ports['vacuum_port'].data.vertices)/len(ports['vacuum_port'].data.vertices)
    zones = {obj['vent_zone']:obj for obj in nodes if obj.get('vent_zone')}
    assert atm_x < zones['controlled_melting']['x_start']
    assert zones['controlled_melting']['x_end'] <= zones['seal_function_review']['x_start']
    assert zones['seal_function_review']['x_end'] < vac_x
    assert zones['pressure_relief_conveying']['x_start'] < vac_x < zones['pressure_relief_conveying']['x_end']
    assert vac_x < zones['pressure_building']['x_start']
    screws = [obj for obj in nodes if obj.get('spin_axis')]
    assert len(screws) == 2
    assert all(obj['spin_axis'] == 'x' and obj['rotation_sense'] == 'same_for_both_shafts' for obj in screws)
    # A quarter-turn moves both non-axis flight witnesses. No claim about actual clearance.
    for pivot in screws:
        flight = next(obj for obj in pivot.children if obj.get('helix_direction') == 'forward')
        witness = next(v.co.copy() for v in flight.data.vertices if math.hypot(v.co.y,v.co.z) > .3)
        assert (Quaternion((1,0,0), math.pi/2) @ witness-witness).length > .3
    compared = [obj for obj in nodes if obj.get('vent_part') == 'compared_element']
    assert len(compared) == 2
    expected = 'reverse' if root.name == 'upstream_reverse_full' else 'forward'
    assert all(obj['helix_direction'] == expected for obj in compared)
    markers = [obj for obj in nodes if obj.get('vent_flow')]
    assert {obj['vent_flow'] for obj in markers} == FLOW
    for obj in markers:
        assert obj.parent == root
        start,end = Vector(obj['vent_from']),Vector(obj['vent_to'])
        assert all(math.isfinite(v) for v in (*start,*end))
        assert len(start) == len(end) == 3 and (end-start).length > .5
        assert 0 <= obj['vent_phase'] < 1
        current = Vector((obj.location.x,obj.location.z,-obj.location.y))
        assert (current-start.lerp(end,obj['vent_phase'])).length < 1e-5
        if obj['vent_flow'] in ('solid','melt'):
            assert end.x > start.x
        else:
            assert end.y > start.y
    records.append({'state':root.name,'meshes':len(meshes),'screw_pivots':2,
                    'flow_markers':dict(collections.Counter(obj['vent_flow'] for obj in markers)),
                    'atmospheric_before_melting':True,'vacuum_after_seal_region':True,
                    'compared_element':expected,'finite_geometry':True,'focus_bounds':focus_bounds})

# State comparison must not silently encode a different process outcome.
def stable_geometry(root):
    values = {}
    for obj in root.children_recursive:
        if obj.type != 'MESH' or obj.get('vent_part') == 'compared_element':
            continue
        name = obj.name.split('__',1)[1]
        values[name] = (tuple(round(v,5) for row in obj.matrix_local for v in row),
                        tuple(tuple(round(v,5) for v in vert.co) for vert in obj.data.vertices))
    return values
assert stable_geometry(roots[0]) == stable_geometry(roots[1]), 'Unexpected outcome or geometry difference between configurations'

path = ROOT/'assets/troubleshooting/vent-guide.glb'
raw = path.read_bytes()
assert raw[:4] == b'glTF' and struct.unpack_from('<I',raw,4)[0] == 2
assert struct.unpack_from('<I',raw,8)[0] == len(raw)
size,kind = struct.unpack_from('<II',raw,12)
assert kind == 0x4E4F534A
gltf = json.loads(raw[20:20+size].decode('utf-8'))
scene_nodes = [gltf['nodes'][i] for i in gltf['scenes'][gltf.get('scene',0)]['nodes']]
assert {node['name'] for node in scene_nodes} == set(STATES), 'Studio objects leaked into deployment'
assert not gltf.get('animations'), 'Runtime should own explanation phase'
assert len([node for node in gltf['nodes'] if node.get('extras',{}).get('spin_axis')]) == 4
assert {node.get('extras',{}).get('vent_focus') for node in gltf['nodes']} >= {'atm','vac','seal'}
mesh_nodes = [obj for root in roots for obj in root.children_recursive if obj.type == 'MESH']
unique_mesh_data = len({obj.data.as_pointer() for obj in mesh_nodes})
assert unique_mesh_data == len(gltf['meshes']) < len(mesh_nodes)/2, 'Identical mesh sharing was lost'
for node in gltf['nodes']:
    extra = node.get('extras',{})
    if extra.get('vent_flow'):
        assert extra['vent_flow'] in FLOW and len(extra['vent_from']) == len(extra['vent_to']) == 3
        assert extra['illustrative_motion'] is True
for accessor in gltf['accessors']:
    for bound in ('min','max'):
        assert all(math.isfinite(value) for value in accessor.get(bound,[]))
assert len(raw) < 8_000_000, 'Web model grew beyond its teaching scope'
report={'status':'passed','blender':bpy.app.version_string,'states':records,
        'mesh_objects':len(mesh_nodes),'unique_mesh_data':unique_mesh_data,
        'same_machine_except_compared_elements':True,'glb_bytes':len(raw),
        'glb_sha256':hashlib.sha256(raw).hexdigest(),'glb_roots':list(STATES),
        'motion_frame':'Three Y-up metadata checked against Blender Z-up positions',
        'process_solver_validation':False,'screw_clearance_validation':False,
        'limitations':'Illustrative open cutaway and directional markers; no geometry recipe, seal success, fill, energy, residence or actual plant outcome is predicted.'}
manifest=json.loads((ROOT/'art/troubleshooting/vent-guide-manifest.json').read_text(encoding='utf-8'))
if manifest.get('deduplication_validation'):
    report['deduplication_validation']=manifest['deduplication_validation']
out=ROOT/'docs/verification/vent-guide-geometry.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('VENT_GUIDE_GEOMETRY_OK',json.dumps(records),flush=True)
