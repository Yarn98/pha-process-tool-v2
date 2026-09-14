"""Original two-vent PHA teaching machine. Geometry and motion are illustrative.

Build native scene, GLB and PNGs:
  blender --background --factory-startup --python-exit-code 1 --python scripts/create_vent_guide_model.py
Package WebP and record hashes with a normal Python that has Pillow:
  python scripts/create_vent_guide_model.py --pack

No setpoint, residence time, seal performance, material degradation or flow solution
is inferred. The two states differ only in the highlighted conveying element.
"""
from pathlib import Path
import hashlib
import json
import math
import sys
from array import array

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'art/troubleshooting'
DEST = ROOT / 'assets/troubleshooting'
STATES = ('without_reverse_full', 'upstream_reverse_full')
for directory in (ART, DEST):
    directory.mkdir(parents=True, exist_ok=True)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def package():
    from PIL import Image, ImageStat
    source = ART / 'vent-guide-manifest.json'
    report = json.loads(source.read_text(encoding='utf-8'))
    assets = []
    for state in STATES:
        png = ART / ('vent-guide-' + state + '.png')
        webp = DEST / ('vent-guide-' + state + '.webp')
        with Image.open(png) as image:
            image = image.convert('RGB')
            assert min(ImageStat.Stat(image).stddev) > 12, 'Blank poster'
            image.save(webp, 'WEBP', quality=90, method=6)
        assets.append({'file': webp.relative_to(ROOT).as_posix(),
                       'source': png.relative_to(ROOT).as_posix(),
                       'source_sha256': sha(png), 'sha256': sha(webp),
                       'bytes': webp.stat().st_size})
    glb = DEST / 'vent-guide.glb'
    assets.append({'file': glb.relative_to(ROOT).as_posix(),
                   'source': 'scripts/create_vent_guide_model.py',
                   'source_sha256': sha(Path(__file__)), 'sha256': sha(glb),
                   'bytes': glb.stat().st_size})
    report['assets'] = assets
    report['native_sha256'] = sha(ART / 'vent-guide.blend')
    source.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    (DEST / 'vent-guide-manifest.json').write_text(json.dumps({
        'id': 'vent-guide', 'blender': report['blender'],
        'representation': report['representation'],
        'physical_process_solver': False, 'states': list(STATES),
        'motion': report['motion'], 'mesh_reuse': report['mesh_reuse'], 'assets': assets,
    }, indent=2) + '\n', encoding='utf-8')
    print('VENT_GUIDE_PACKED', len(assets), flush=True)


if '--pack' in sys.argv:
    package()
    raise SystemExit(0)

import bpy
from mathutils import Vector

M = {}
OWNER = None
PREFIX = ''


def material(name, color, metal=0, rough=.4):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metal
    shader.inputs['Roughness'].default_value = rough
    M[name] = mat


def finish(obj, name, mat='steel', parent=None, role=None):
    obj.name = PREFIX + name
    obj.parent = parent if parent is not None else OWNER
    if mat and hasattr(obj.data, 'materials'):
        obj.data.materials.append(M[mat])
    if role:
        obj['vent_part'] = role
    return obj


def mesh(name, verts, faces, mat='steel', parent=None, role=None):
    data = bpy.data.meshes.new(PREFIX + name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(PREFIX + name, data)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat, parent, role)


def apply(obj, modifier):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def box(name, pos, size, mat='steel', bevel=.045, parent=None, role=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Soft machined edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        apply(obj, mod)
    return finish(obj, name, mat, parent, role)


def cylinder(name, pos, radius, depth, mat='steel', axis='Z', parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=pos)
    obj = bpy.context.object
    if axis == 'X':
        obj.rotation_euler.y = math.pi / 2
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    return finish(obj, name, mat, parent)


def sphere(name, pos, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, location=pos)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for face in obj.data.polygons:
        face.use_smooth = True
    return finish(obj, name, mat)


def tube(name, points, radius, mat):
    data = bpy.data.curves.new(PREFIX + name, 'CURVE')
    data.dimensions = '3D'
    data.resolution_u = 2
    data.bevel_depth = radius
    data.bevel_resolution = 2
    line = data.splines.new('POLY')
    line.points.add(len(points) - 1)
    for p, co in zip(line.points, points):
        p.co = (*co, 1)
    obj = bpy.data.objects.new(PREFIX + name, data)
    bpy.context.collection.objects.link(obj)
    finish(obj, name, mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)
    return obj


def hollow(name, x, y, z0, z1, radius, wall, mat, role=None):
    verts, faces = [], []
    n = 40
    for z, r in ((z0, radius), (z1, radius), (z0, radius-wall), (z1, radius-wall)):
        verts.extend((x+r*math.cos(i*math.tau/n), y+r*math.sin(i*math.tau/n), z) for i in range(n))
    for i in range(n):
        # Open the near side of teaching ports so moving gas markers remain visible.
        # Real vent bodies are closed; this is the same cutaway convention as the barrel.
        if role in ('atmospheric_port','vacuum_port') and 22 <= i < 38:
            continue
        j = (i+1) % n
        faces.extend(((i,j,n+j,n+i), (2*n+i,3*n+i,3*n+j,2*n+j),
                      (i,2*n+i,2*n+j,j), (n+i,n+j,3*n+j,3*n+i)))
    if role in ('atmospheric_port','vacuum_port'):
        for i in (22,38):
            faces.append((i,n+i,3*n+i,2*n+i))
    obj = mesh(name, verts, faces, mat, role=role)
    if role in ('atmospheric_port','vacuum_port'):
        obj['educational_cutaway'] = True
    for f in obj.data.polygons:
        f.use_smooth = f.index % 4 < 2
    return obj


def text_mesh(name, body, pos, size, mat='ink'):
    data = bpy.data.curves.new(PREFIX + name, 'FONT')
    data.body = body
    data.align_x = 'CENTER'
    data.size = size
    data.extrude = .002
    obj = bpy.data.objects.new(PREFIX + name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler.x = math.pi/2
    finish(obj, name, mat)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)
    return obj


def barrel_segment(x0, x1, accent):
    # A deliberately open lower shell reveals both screws; not a pressure vessel CAD.
    previous = set(OWNER.children)
    verts, faces = [], []
    n = 25
    for x in (x0, x1):
        for wall in (0, .085):
            for i in range(n):
                a = math.pi + math.pi*i/(n-1)
                verts.append((x, (.91+wall)*math.cos(a), 1.34+(.54+wall)*math.sin(a)))
    for i in range(n-1):
        j = i+1
        faces.extend(((i,j,2*n+j,2*n+i), (n+i,3*n+i,3*n+j,n+j),
                      (i,n+i,n+j,j), (2*n+i,2*n+j,3*n+j,3*n+i)))
    for i in (0,n-1):
        faces.append((i,2*n+i,3*n+i,n+i))
    mesh('Open barrel', verts, faces)
    box('Zone jacket', ((x0+x1)/2, .0, .81), (x1-x0-.05,1.97,.19),'shell')
    box('Zone accent', ((x0+x1)/2, -.988, .81),(x1-x0-.13,.025,.085),accent,.008)
    for x in (x0+.09,x1-.09):
        for y in (-.81,.81):
            cylinder('Jacket bolt',(x,y,.95),.044,.065,'dark')
    focus = 'atm' if -4.25 <= x0 < -3.1 else 'vac' if 1.37 <= x0 < 2.8 else 'seal' if -1.15 <= x0 < 1.37 else None
    if focus:
        for obj in set(OWNER.children)-previous:
            obj['vent_focus'] = focus


def flight(name, parent, start, end, pitch, mat, phase=0):
    verts, faces = [], []
    n = max(10, int(abs((end-start)/pitch)*48))
    for i in range(n+1):
        x = start+(end-start)*i/n
        angle = phase+math.tau*(x-start)/pitch
        for dx,r in ((-.026,.157),(-.026,.378),(.026,.378),(.026,.157)):
            verts.append((x+dx,r*math.cos(angle),r*math.sin(angle)))
    for i in range(n):
        for k in range(4):
            faces.append((4*i+k,4*i+(k+1)%4,4*(i+1)+(k+1)%4,4*(i+1)+k))
    faces.extend(((3,2,1,0),tuple(4*n+k for k in range(4))))
    obj = mesh(name,verts,faces,mat,parent)
    obj['helix_direction'] = 'reverse' if pitch < 0 else 'forward'
    obj['sectionable'] = True
    return obj


def screw(index, reverse):
    pivot = bpy.data.objects.new(PREFIX+'Co-rotating screw '+str(index),None)
    bpy.context.collection.objects.link(pivot)
    pivot.parent = OWNER
    pivot.location = (0, -.29 if index == 1 else .29, 1.34)
    pivot['spin_axis'] = 'x'
    pivot['spin_direction'] = -1  # Positive-pitch flights advance toward +X under negative X rotation.
    pivot['rotation_sense'] = 'same_for_both_shafts'
    pivot['vent_part'] = 'screw'
    cylinder('Shaft',(0,0,0),.15,10.4,'shaft','X',pivot)
    phase = 0 if index == 1 else math.pi
    for i,(start,end,pitch) in enumerate(((-5.1,-2.95,.66),(-1.30,-.40,.59),(.27,3.0,.90),(3.0,5.2,.48))):
        flight('Forward flights '+str(i),pivot,start,end,pitch,'flight',phase)
    for i in range(11):
        disc = cylinder('Controlled melting disc',(-2.82+i*.132,0,0),.345,.086,'knead','X',pivot)
        disc.scale.y = .59
        disc.rotation_euler.x = phase+i*math.pi/7
        disc['vent_part'] = 'controlled_melting'
    candidate = flight('Compared element',pivot,-.38,.25,-.31 if reverse else .62,'reverse' if reverse else 'forward',phase)
    candidate['vent_part'] = 'compared_element'
    candidate['vent_focus'] = 'seal'
    candidate['configuration'] = 'upstream_reverse' if reverse else 'forward_replacement'


def flow(kind, start, end, count, mat, radius=.075):
    # Custom metadata is NOT transformed by glTF export: explicitly convert to Three Y-up.
    def three(v):
        return [v[0],v[2],-v[1]]
    for i in range(count):
        t = (i+.35)/count
        pos = tuple(a+(b-a)*t for a,b in zip(start,end))
        obj = sphere(kind+' marker '+str(i),pos,(radius*1.35,radius,radius),mat)
        obj['vent_flow'] = kind
        obj['vent_from'] = three(start)
        obj['vent_to'] = three(end)
        obj['vent_phase'] = t
        obj['illustrative_motion'] = True


def vent(x, atmospheric):
    previous = set(OWNER.children)
    mat = 'air' if atmospheric else 'vacuum'
    role = 'atmospheric_port' if atmospheric else 'vacuum_port'
    hollow(role,x,0,1.46,2.56,.285,.055,mat,role)
    for z in (1.48,2.52):
        hollow('Vent flange',x,0,z,z+.10,.41,.16,'dark')
    # The tall separated gas indicator makes the discharge route clear in the cutaway.
    cylinder('Upward gas arrow stem',(x,0,3.02),.035,.48,mat)
    bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.13,radius2=0,depth=.25,location=(x,0,3.36))
    finish(bpy.context.object,'Gas direction arrow',mat)
    box('Vent label',(x,-.03,3.76),(1.24,.095,.40),'white',.06)
    text_mesh('Vent label text','1 ATM' if atmospheric else '2 VAC',(x,-.083,3.66),.255,mat)
    if atmospheric:
        flow('atm_gas',(x,-.035,1.68),(x,-.035,2.98),4,mat,.065)
    else:
        # A separate elevated line represents connection to a vacuum system, not an open vent.
        tube('Vacuum takeoff',[(x,.19,2.48),(x,1.05,2.48),(x+1.12,1.35,2.48)],.075,mat)
        cylinder('Vacuum catch vessel',(x+1.12,1.35,2.07),.28,.86,'shell')
        tube('Vacuum pump line',[(x+1.12,1.35,1.72),(x+1.12,1.35,.93),(x+1.70,1.35,.93)],.045,'dark')
        box('Vacuum unit',(x+1.92,1.35,.77),(.70,.53,.57),'dark')
        flow('vac_gas',(x,-.035,1.68),(x,-.035,2.44),4,mat,.066)
    for obj in set(OWNER.children)-previous:
        if not obj.get('vent_flow'):
            obj['vent_focus'] = 'atm' if atmospheric else 'vac'


def build_state(state):
    global OWNER,PREFIX
    OWNER = bpy.data.objects.new(state,None)
    bpy.context.collection.objects.link(OWNER)
    PREFIX = state+'__'
    OWNER['representation'] = 'original_educational_cutaway'
    OWNER['physical_process_solver'] = False
    OWNER['flow_direction'] = '+X'
    OWNER['configuration'] = state.removesuffix('_full')
    OWNER['seal_performance'] = 'requires_machine_and_material_verification'
    box('Machine bed',(-.60,0,.19),(14.1,2.35,.30),'dark',.10)
    for x in (-5.9,-2.4,1.9,5.7):
        for y in (-.86,.86):
            box('Support leg',(x,y,-.1),(.18,.18,.51),'steel',.025)
            cylinder('Foot',(x,y,-.36),.17,.07,'dark')
    box('Gearbox',(-5.87,0,1.26),(1.1,1.28,1.10),'shell',.11)
    cylinder('Drive motor',(-6.77,0,1.24),.48,.83,'dark','X')
    for x in (-7.1,-6.94,-6.78,-6.62,-6.46):
        cylinder('Motor cooling fin',(x,0,1.24),.51,.035,'steel','X')
    segments = (-5.25,-4.25,-3.1,-2.12,-1.15,-.42,.31,1.37,2.8,4.0,5.29)
    for a,b in zip(segments,segments[1:]):
        accent = 'air' if -4.25 <= a < -3.1 else 'heat' if -3.1 <= a < -.42 else 'reverse' if -.42 <= a < .31 else 'vacuum' if 1.37 <= a < 2.8 else 'steel'
        barrel_segment(a,b,accent)
    for index in (1,2):
        screw(index,state == 'upstream_reverse_full')
    # Open hopper walls allow pellets to remain visibly solid near the atmospheric relief.
    n=32;verts=[];faces=[]
    for z,r in ((1.68,.18),(3.47,.66),(3.47,.60),(1.70,.13)):
        verts.extend((-4.76+r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n),z) for i in range(n))
    for i in range(n):
        j=(i+1)%n
        faces.extend(((i,j,n+j,n+i),(n+i,n+j,2*n+j,2*n+i),(2*n+i,2*n+j,3*n+j,3*n+i)))
    mesh('Open feed hopper',verts,faces,'shell',role='feed_hopper')
    for i in range(12):
        a=i*2.4;r=.11+.022*(i%5)
        sphere('Feed pellet',(-4.76+r*math.cos(a),r*math.sin(a),3.27+.055*(i%3)),(.09,.064,.067),'solid')
    vent(-3.60,True)
    vent(2.02,False)
    flow('solid',(-4.58,-.58,1.57),(-2.97,-.58,1.57),7,'solid',.092)
    flow('melt',(-1.22,-.59,1.49),(5.14,-.59,1.49),17,'melt',.075)
    for i in range(5):
        sphere('Melting transition',(-2.8+i*.30,-.61,1.45),(.125,.086,.055),'solid' if i<2 else 'melt')
    box('Screen housing',(5.49,0,1.33),(.32,1.14,1.06),'shell',.05,role='screen')
    for z in (1.08,1.27,1.46,1.65):
        for y in (-.37,-.18,.01,.20,.39):
            cylinder('Screen face hole',(5.66,y,z),.039,.018,'dark','X')
    cylinder('Die head',(5.88,0,1.33),.46,.46,'steel','X')
    for y in (-.22,0,.22):
        cylinder('Product strand',(6.50,y,1.33),.044,.88,'melt','X')
    # Small near-side directional chevrons are language independent.
    for x in (-3,-1,1,3):
        mesh('Process direction',[(x-.15,-1.04,.27),(x+.13,-1.04,.27),(x+.32,-1.04,.39),(x+.13,-1.04,.51),(x-.15,-1.04,.51),(x+.05,-1.04,.39)],[(0,1,2,3,4,5)],'white')
    text_mesh('Drive tag','PHA',(-6.0,-.651,1.09),.25,'white')
    # Anchors carry topology, without claiming a particular seal element recipe.
    for name,x0,x1 in (('solid_feed',-5.2,-3.1),('controlled_melting',-2.95,-.42),('seal_function_review',-.42,.31),('pressure_relief_conveying',.31,2.8),('pressure_building',2.8,5.4)):
        anchor=bpy.data.objects.new(PREFIX+name,None)
        bpy.context.collection.objects.link(anchor)
        anchor.parent=OWNER
        anchor['vent_zone']=name
        anchor['x_start']=x0
        anchor['x_end']=x1
    return OWNER


def share_identical_mesh_data(roots):
    """Reuse byte-identical geometry/attributes/materials; keep each node independent."""
    formats = {'FLOAT_VECTOR': ('vector','f',3), 'FLOAT2': ('vector','f',2),
               'INT32_2D': ('value','i',2), 'INT': ('value','i',1),
               'BOOLEAN': ('value','b',1)}
    objects = [obj for root in roots for obj in root.children_recursive if obj.type == 'MESH']
    canonical = {}
    replaced = 0
    for obj in objects:
        data = obj.data
        assert not data.shape_keys and not data.has_custom_normals and not obj.vertex_groups
        assert not obj.modifiers and all(slot.link == 'DATA' for slot in obj.material_slots)
        digest = hashlib.sha256()
        digest.update(repr((len(data.vertices), len(data.edges), len(data.loops),
                            [m.name for m in data.materials], data.uv_layers.active_index,
                            dict(data.items()))).encode())
        for attr in sorted(data.attributes, key=lambda value: value.name):
            field, code, width = formats[attr.data_type]
            values = array(code, [0]) * (len(attr.data)*width)
            attr.data.foreach_get(field, values)
            digest.update(repr((attr.name, attr.data_type, attr.domain, len(attr.data))).encode())
            digest.update(values.tobytes())
        for field in ('loop_start','loop_total','material_index','use_smooth'):
            values = array('i', [0]) * len(data.polygons)
            data.polygons.foreach_get(field, values)
            digest.update(values.tobytes())
        signature = digest.digest()
        if signature in canonical:
            obj.data = canonical[signature]
            if not data.users:
                bpy.data.meshes.remove(data)
            replaced += 1
        else:
            canonical[signature] = data
    return {'mesh_objects':len(objects), 'unique_mesh_data':len(canonical),
            'reused_mesh_objects':replaced, 'method':'byte-identical attributes, topology and materials; no simplification'}


for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj,do_unlink=True)
for args in [('steel',(.38,.49,.53),.66,.29),('shaft',(.12,.19,.22),.68,.29),
             ('flight',(.67,.73,.71),.72,.26),('shell',(.72,.78,.76),.35,.39),
             ('dark',(.025,.075,.09),.38,.38),('ink',(.018,.042,.05),0,.65),
             ('white',(.93,.94,.87),0,.55),('ground',(.86,.88,.84),0,.82),
             ('air',(.015,.43,.53),.22,.27),('vacuum',(.35,.14,.61),.18,.28),
             ('heat',(.83,.40,.10),.12,.38),('knead',(.74,.50,.24),.58,.28),
             ('reverse',(.82,.16,.085),.38,.29),('forward',(.06,.46,.34),.4,.3),
             ('solid',(.97,.63,.15),0,.38),('melt',(.82,.20,.045),0,.3)]:
    material(*args)
groups=[build_state(state) for state in STATES]
mesh_reuse=share_identical_mesh_data(groups)
print('VENT_GUIDE_MESH_REUSE',json.dumps(mesh_reuse),flush=True)
OWNER=None;PREFIX='Studio__'
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for root in groups:
    for obj in [root]+list(root.children_recursive):
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(DEST/'vent-guide.glb'),export_format='GLB',
                          use_selection=True,export_extras=True,export_animations=False)

scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=40
scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED'
scene.render.threads=8
scene.render.resolution_x=1600
scene.render.resolution_y=960
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world.color=(.22,.22,.22)
scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.view_settings.exposure=.10
for name,pos,power,size in [('Key',(-2,-6,9),2100,7),('Rim',(3,5,7),2000,6),('Fill',(-7,-1,5),900,4)]:
    bpy.ops.object.light_add(type='AREA',location=pos)
    light=bpy.context.object;light.name=PREFIX+name
    light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(Vector((-.5,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
box('Floor',(0,0,-.44),(200,200,.05),'ground',0)
bpy.ops.object.camera_add(location=(9,-16,11))
camera=bpy.context.object;scene.camera=camera
target=Vector((-.45,0,1.5))
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=17.0
records=[]
for root in groups:
    for other in groups:
        for obj in [other]+list(other.children_recursive):
            obj.hide_render=other!=root
    scene.render.filepath=str(ART/('vent-guide-'+root.name+'.png'))
    bpy.ops.render.render(write_still=True)
    records.append({'state':root.name,'png':Path(scene.render.filepath).relative_to(ROOT).as_posix(),
                    'mesh_count':sum(obj.type=='MESH' for obj in root.children_recursive)})
for root in groups:
    for obj in [root]+list(root.children_recursive):
        obj.hide_set(root!=groups[-1]);obj.hide_render=root!=groups[-1]
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.shading.color_type='MATERIAL'
            area.spaces.active.region_3d.view_location=target
            area.spaces.active.region_3d.view_rotation=camera.rotation_euler.to_quaternion()
            area.spaces.active.region_3d.view_distance=19
            area.spaces.active.region_3d.view_perspective='ORTHO'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ART/'vent-guide.blend'))
manifest={'id':'vent-guide','blender':bpy.app.version_string,
          'representation':'original_educational_cutaway','physical_process_solver':False,
          'units':'illustrative scene units; not screw dimensions or operating conditions',
          'reference':'Leistritz / SPE 2023 PHA two-vent functional concept; supplied slide inspected, no image pixels, logos or layout reused',
          'reference_url':'https://www.4spe.org/files/Chapters/D22/presentationofthemonth_springenewsletter.pdf#page=35',
          'states':records,
          'mesh_reuse':mesh_reuse,
          'state_difference':'only highlighted element handedness/material; neither state predicts seal performance or user outcomes',
          'motion':{'frame':'Three glTF Y-up; +X feed-to-die; all flow markers direct children of identity state groups',
                    'screw':'spin_axis=x, spin_direction=-1 on both pivots per state; forward flights convey toward +X',
                    'flow':'vent_flow=solid|melt|atm_gas|vac_gas; vent_from and vent_to Three parent-local vectors; t=(phase+vent_phase)%1; lerp(from,to,t)',
                    'focus':'vent_focus=atm|vac|seal on static equipment meshes and compared element; includes nearby barrel context',
                    'scope':'directional explanation only, no timing, fill fraction, energy or residence prediction'},
          'topology':{'atmospheric_x':-3.60,'controlled_melting_x':[-2.95,-.42],
                      'compared_element_x':[-.38,.25],'vacuum_x':2.02,'pressure_building_x':[2.8,5.4]}}
(ART/'vent-guide-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('VENT_GUIDE_BUILT',len(groups),flush=True)
