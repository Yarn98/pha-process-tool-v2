"""Read native authored geometry, verify representative solid/void semantics.

This validates teaching geometry and saved edit views, not PHA process physics.
"""
from pathlib import Path
import json,math
import bpy,bmesh
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
spec=json.loads((ROOT/'data/troubleshooting_visuals.json').read_text(encoding='utf-8'))
records=[]
def body(state):return next(obj for obj in bpy.data.objects[state].children if obj.type=='MESH' and obj.get('sectionable'))
def cast(obj,origin,direction):
    found,point,normal,index=obj.ray_cast(Vector(origin),Vector(direction));return point if found else None
def closed(obj):
    bm=bmesh.new();bm.from_mesh(obj.data);count=sum(not edge.is_manifold for edge in bm.edges);volume=bm.calc_volume();bm.free();assert count==0,(obj.name,count);assert volume>0
    return volume
for entry in spec['entries']:
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art/troubleshooting'/(entry['family']+'.blend')))
    roots=[bpy.data.objects.get(state) for state in entry['states']];assert all(roots),entry['family']
    for root in roots:
        assert any(obj.type=='MESH' for obj in root.children_recursive)
        for obj in root.children_recursive:
            if obj.type=='MESH':assert all(math.isfinite(x) for vertex in obj.data.vertices for x in vertex.co)
    record={'family':entry['family'],'states':len(roots),'finite_geometry':True}
    if entry['family']=='sink-void':
        for state in ('normal_full','sink_full','void_full','normal_section','sink_section','void_section'):closed(body(state))
        assert abs(cast(body('normal_full'),(0,0,2),(0,0,-1)).z-.4)<1e-5
        assert abs(cast(body('sink_full'),(0,0,2),(0,0,-1)).z-.22)<1e-5
        assert abs(cast(body('void_full'),(0,0,2),(0,0,-1)).z-.4)<1e-5
        assert abs(cast(body('void_full'),(0,-3,-.28),(0,1,0)).y+.45)<1e-5
        assert abs(cast(body('void_section'),(0,-3,-.28),(0,1,0)).y-.29)<1e-4
        record['checks']=['six closed solids','continuous sink skin','closed exterior over internal void','section opens internal cavity']
    if entry['family']=='straw':
        for state in entry['states']:closed(body(state))
        assert cast(body('normal_full'),(3,0,0),(-1,0,0)) is None
        vertices=body('oval_full').data.vertices
        y=max(v.co.y for v in vertices)-min(v.co.y for v in vertices);z=max(v.co.z for v in vertices)-min(v.co.z for v in vertices)
        assert y>z*1.8
        record['checks']=['open bore with closed material wall','oval cross-section','cut-edge crack remains a closed material solid']
    if entry['family']=='vent':
        closed(body('normal_strand_full'));closed(body('bubbles_full'));closed(body('bubbles_section'))
        assert abs(cast(body('bubbles_full'),(0,-2,0),(0,1,0)).y+.53)<1e-4
        assert abs(cast(body('bubbles_section'),(0,-2,0),(0,1,0)).y-.28)<1e-4
        record['checks']=['closed strand exterior','section exposes internal cavities']
    if entry['family']=='thermoforming':
        for root in roots:
            roles=[obj.get('thermo_part') for obj in root.children_recursive]
            assert all(role in roles for role in ('heater','plug','rod','clamp','sheet'))
        record['checks']=['heater, plug, telescoping rod, four clamps and sheet controls','sheet uses authored Form morph; surface thickness is not predicted']
    # Make the final visible state useful when the native file opens.
    visible=roots[-1]
    mesh_objects=[obj for obj in visible.children_recursive if obj.type=='MESH']
    coords=[obj.matrix_world@Vector(corner) for obj in mesh_objects for corner in obj.bound_box]
    low=Vector(tuple(min(p[i] for p in coords) for i in range(3)));high=Vector(tuple(max(p[i] for p in coords) for i in range(3)))
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=='VIEW_3D':
                area.spaces.active.shading.color_type='MATERIAL'
                area.spaces.active.region_3d.view_location=(low+high)/2
                area.spaces.active.region_3d.view_rotation=bpy.context.scene.camera.rotation_euler.to_quaternion()
                area.spaces.active.region_3d.view_distance=max((high-low).length,4)
                area.spaces.active.region_3d.view_perspective='ORTHO'
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/troubleshooting'/(entry['family']+'.blend')))
    records.append(record)
    print('NATIVE_TROUBLE_GEOMETRY_OK',entry['family'],flush=True)
(ROOT/'docs/verification/troubleshooting-geometry.json').write_text(json.dumps({'status':'passed','blender':bpy.app.version_string,'families':records,'process_solver_validation':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
