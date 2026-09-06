"""Build an animated, cutaway injection machine in Blender and export a local GLB.

blender -b --factory-startup --python scripts/create_injection_motion.py
The timeline is an explanatory sequence, never a measured machine cycle or CFD.
"""
import bpy
import math
import json
import importlib.util
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'equipment'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
sc = bpy.context.scene
sc.name = 'Injection cycle cutaway'
FPS, SECONDS = 24, 14
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, FPS * SECONDS + 1
sc['purpose'] = 'Explanatory motion; not CFD, an OEM machine, or validated cycle timing.'

# Load only the installed mechanical modeling extension, even in factory mode.
# No global preferences are saved and no network/server add-ons are started.
bolt_path = Path(bpy.utils.user_resource('EXTENSIONS')) / 'blender_org' / 'boltfactory'
if not (bolt_path / '__init__.py').is_file():
    raise RuntimeError('Install the official BoltFactory extension before rebuilding this model.')
spec = importlib.util.spec_from_file_location('pha_boltfactory', bolt_path / '__init__.py',
                                            submodule_search_locations=[str(bolt_path)])
bolt_module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = bolt_module
spec.loader.exec_module(bolt_module)
bolt_module.register()


def material(name, color, metal=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = .42
    return m


GRAY = material('Machine / warm metal', (.43, .49, .46), .35)
DARK = material('Frame / graphite', (.095, .15, .12), .25)
STEEL = material('Screw / brushed steel', (.62, .66, .62), .45)
BRONZE = material('Heaters / bronze', (.53, .31, .12), .3)
GREEN = material('Polymer / sage green', (.055, .42, .20))
BRIGHT = material('Moving polymer markers', (.25, .85, .39))
PAPER = material('Base / warm paper', (.85, .83, .77))


def finish(obj, name, mat, parent=None):
    obj.name = name
    obj.data.materials.append(mat)
    if parent:
        bpy.context.view_layer.update()
        matrix = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = matrix
    return obj


def box(name, xyz, size, mat=GRAY, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    o = bpy.context.object
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = o.modifiers.new('Small machined edge', 'BEVEL')
    bevel.width, bevel.segments = .025, 2
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return finish(o, name, mat, parent)


def cylinder(name, xyz, radius, length, mat=GRAY, axis='X', parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=length, location=xyz)
    o = bpy.context.object
    if axis == 'X':
        o.rotation_euler[1] = math.pi / 2
    elif axis == 'Y':
        o.rotation_euler[0] = math.pi / 2
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for poly in o.data.polygons:
        poly.use_smooth = len(poly.vertices) == 4
    return finish(o, name, mat, parent)


def empty(name, xyz=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.location = xyz
    o.parent = parent
    return o


def shell(name, start, end, radius, thickness, z, mat):
    # Rear half retained; the near half is removed to expose the screw and melt.
    n = 32
    verts = [(x, r * math.cos(a), z + r * math.sin(a))
             for x, r in [(start, radius), (end, radius),
                          (start, radius + thickness), (end, radius + thickness)]
             for a in [-math.pi / 2 + math.pi * i / n for i in range(n + 1)]]
    stride = n + 1
    faces = []
    for i in range(n):
        j = i + 1
        faces.extend([(i, j, stride + j, stride + i),
                      (2*stride+i, 3*stride+i, 3*stride+j, 2*stride+j),
                      (i, 2*stride+i, 2*stride+j, j),
                      (stride+i, stride+j, 3*stride+j, 3*stride+i)])
    for i in (0, n):
        faces.append((i, stride+i, 3*stride+i, 2*stride+i))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    return finish(o, name, mat)


def sphere(name, xyz, radius=.055, mat=BRIGHT):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=radius, location=xyz)
    o = bpy.context.object
    for face in o.data.polygons:
        face.use_smooth = True
    return finish(o, name, mat)


def line_segment(name, a, b, radius, mat):
    mid = (Vector(a) + Vector(b)) / 2
    o = cylinder(name, mid, radius, (Vector(b)-Vector(a)).length, mat, axis='Z')
    o.rotation_euler = (Vector(b)-Vector(a)).to_track_quat('Z', 'Y').to_euler()
    return o


def fastener(name, xyz, parent=None, axis='Y'):
    bpy.ops.mesh.bolt_add(bf_Model_Type='bf_Model_Bolt', bf_Head_Type='bf_Head_Cap',
                         bf_Bit_Type='bf_Bit_Allen', bf_Shank_Length=4,
                         bf_Shank_Dia=6, bf_Thread_Length=8, bf_Major_Dia=6,
                         bf_Minor_Dia=4.9, bf_Pitch=1, bf_Div_Count=20,
                         bf_Cap_Head_Dia=10, bf_Cap_Head_Height=6,
                         bf_Allen_Bit_Flat_Distance=5)
    o = bpy.context.object
    # The current extension converts millimeters to meters internally.
    o.scale = (22,)*3
    o.location = xyz
    if axis == 'Y':
        o.rotation_euler.x = math.pi/2
    elif axis == 'X':
        o.rotation_euler.y = math.pi/2
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o, name, STEEL, parent)


def interp(t, points):
    for (a, va), (b, vb) in zip(points, points[1:]):
        if a <= t <= b:
            f = (t-a)/(b-a)
            # Quintic easing: zero velocity/acceleration at the stroke endpoints.
            f = f*f*f*(f*(f*6-15)+10)
            return va + (vb-va)*f
    return points[0][1] if t < points[0][0] else points[-1][1]


def key(obj, frame, *names):
    for name in names:
        obj.keyframe_insert(data_path=name, frame=frame)


# Main mechanical structure.
box('Machine bed', (-.2, 0, .22), (9.25, 1.45, .38), DARK)
for x in (-4.3, 3.6):
    for y in (-.52, .52):
        box('Support foot', (x, y, -.03), (.38, .38, .22), GRAY)
box('Injection-unit pedestal', (-2.9, 0, .63), (3.9, .9, .45), GRAY)
cylinder('Drive housing', (-4.30, 0, 1.30), .37, .82, DARK)
shell('Barrel cutaway', -3.85, -.25, .245, .10, 1.30, GRAY)
for x in (-3.4, -2.55, -1.7, -.85):
    shell('Heater band cutaway', x-.11, x+.11, .35, .025, 1.30, BRONZE)
shell('Nozzle cutaway', -.25, .28, .105, .055, 1.30, STEEL)

# The hopper is also cut open toward the viewer.
n = 24
verts = [(x + r*math.cos(a), r*math.sin(a), z)
         for r, z in [(.14, 1.59), (.46, 2.46)]
         for a in [math.pi * i / n for i in range(n+1)]
         for x in [-3.45]]
mesh = bpy.data.meshes.new('Hopper cutaway')
mesh.from_pydata(verts, [], [(i, i+1, n+2+i, n+1+i) for i in range(n)])
mesh.update()
hopper = bpy.data.objects.new('Hopper cutaway', mesh)
bpy.context.collection.objects.link(hopper)
hopper.data.materials.append(GRAY)
for i in range(12):
    sphere('Pellet stock', (-3.45+(i%4-1.5)*.13, .05+(i//4)*.10, 2.30), .06, GREEN)

slide = empty('ScrewSlide')
spin = empty('ScrewSpin', (0, 0, 1.30), slide)
def root_radius(x):
    return .09 + .045 * max(0, min(1, (x+2.65)/1.20))

# A tapered core separates the deep feed channel from the shallower metering zone.
core_verts = [(x, root_radius(x)*math.cos(a), 1.30+root_radius(x)*math.sin(a))
              for x in (-3.70, -2.65, -1.45, -.50)
              for a in [2*math.pi*i/32 for i in range(32)]]
core_faces = [(ring*32+i, ring*32+(i+1)%32, (ring+1)*32+(i+1)%32, (ring+1)*32+i)
              for ring in range(3) for i in range(32)]
core_mesh = bpy.data.meshes.new('Screw core with compression zone')
core_mesh.from_pydata(core_verts, [], core_faces)
core_mesh.update()
core = bpy.data.objects.new('Screw core', core_mesh)
bpy.context.collection.objects.link(core)
finish(core, 'Screw core', STEEL, spin)
turns, samples = 10, 640
verts = []
for i in range(samples+1):
    x = -3.70 + 3.20*i/samples
    a = 2*math.pi*turns*i/samples
    for r in (root_radius(x), .215):
        verts.append((x, r*math.cos(a), 1.30+r*math.sin(a)))
mesh = bpy.data.meshes.new('Helical screw flight')
mesh.from_pydata(verts, [], [(2*i, 2*i+1, 2*i+3, 2*i+2) for i in range(samples)])
mesh.update()
flight = bpy.data.objects.new('Screw flight', mesh)
bpy.context.collection.objects.link(flight)
solid = flight.modifiers.new('Flight thickness', 'SOLIDIFY')
solid.thickness = .025
bpy.context.view_layer.objects.active = flight
bpy.ops.object.modifier_apply(modifier=solid.name)
finish(flight, 'Screw flight', STEEL, spin)
cylinder('Screw rear shaft', (-4.05, 0, 1.30), .075, .7, STEEL, parent=slide)
cylinder('Screw tip collar', (-.48, 0, 1.30), .18, .09, BRONZE, parent=spin)
bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=.16, radius2=.035, depth=.14,
                              location=(-.365, 0, 1.30), rotation=(0, math.pi/2, 0))
finish(bpy.context.object, 'Screw tip', STEEL, spin)
reservoir = cylinder('MeltReservoir', (-.38, 0, 1.30), .19, 1, GREEN)

def mold_frame(name, x, parent=None):
    # Open frames expose a plaque-shaped cavity, without transparent sorting artifacts.
    for z in (.43, 2.17):
        box(name+' horizontal rail', (x, 0, z), (.46, 1.7, .18), GRAY, parent)
    for y in (.77,):
        box(name+' upright', (x, y, 1.30), (.46, .16, 1.58), GRAY, parent)
    box(name+' rear cavity section', (x, .57, 1.30), (.46, .15, 1.35), DARK, parent)
    for z in (.46, 2.14):
        fastener(name+' socket bolt', (x, -.86, z), parent)

mold_frame('Fixed mold', .53)
moving = empty('MovingMold')
mold_frame('Moving mold', 1.03, moving)
for z in (.35, 2.25):
    for y in (-.95, .95):
        cylinder('Tie bar', (2.02, y, z), .055, 3.88, STEEL)
        cylinder('Moving guide bush', (1.53, y, z), .11, .26, BRONZE, parent=moving)
box('Moving platen', (1.50, .45, 1.30), (.25, .42, 1.9), DARK, moving)
box('Rear clamp support', (3.98, 0, 1.30), (.30, 1.90, 2.0), DARK)
cylinder('Clamp cylinder', (3.72, .25, 1.30), .26, .55, GRAY)
rod = cylinder('ClampRod', (2.55, .25, 1.30), .105, 1, STEEL)
ejector = empty('Ejector', parent=moving)
box('Ejector plate', (1.61, 0, 1.15), (.09, .78, .29), BRONZE, ejector)
for y in (-.28, .28):
    cylinder('Ejector pin', (1.19, y, 1.15), .035, .70, BRONZE, parent=ejector)
part = empty('MoldedPart', (.80, 0, .72))
box('Plaque in cavity', (.80, 0, 1.30), (.08, .90, 1.16), GREEN, part)
box('Collection tray', (1.6, -.05, .49), (2.4, 1.15, .075), PAPER)

# A cutaway runner makes the connection between nozzle and cavity legible.
runner_points = [(-.25, 0, 1.30), (.26, 0, 1.30), (.58, -.48, 1.30),
                 (.78, -.48, .72), (.80, 0, .72)]
runner = empty('RunnerFill')
for a, b in zip(runner_points, runner_points[1:]):
    o = line_segment('Polymer runner', a, b, .047, GREEN)
    o.parent = runner
feed_dots = [sphere('FeedPellet%02d'%i, (-3.45, -.05, 2), .058) for i in range(7)]
barrel_dots = [sphere('BarrelFlow%02d'%i, (-3, -.23, 1.27), .045) for i in range(12)]
fill_dots = [sphere('FillFlow%02d'%i, runner_points[0], .064) for i in range(6)]

# The editable Blender scene exposes the same four axes as the web inspector.
rig = empty('MachineControls', (0, 0, -.35))
rig.empty_display_type = 'ARROWS'
rig.empty_display_size = .35
for name, maximum in [('screw_retraction', 100), ('screw_rotation_deg', 2880),
                      ('mold_opening', 100), ('ejector_extension', 100)]:
    rig[name] = 0.0
    rig.id_properties_ui(name).update(min=0, max=maximum, soft_min=0, soft_max=maximum,
                                     description='Illustrative stroke percentage / angle; not machine units')

def drive(obj, path, index, expression, variables):
    curve = obj.driver_add(path, index)
    curve.driver.type = 'SCRIPTED'
    for alias, property_name in variables.items():
        var = curve.driver.variables.new()
        var.name, var.type = alias, 'SINGLE_PROP'
        var.targets[0].id = rig
        var.targets[0].data_path = '["'+property_name+'"]'
    curve.driver.expression = expression

drive(slide, 'location', 0, '-0.0065*s', {'s': 'screw_retraction'})
drive(spin, 'rotation_euler', 0, '-a*pi/180', {'a': 'screw_rotation_deg'})
drive(moving, 'location', 0, '0.011*m', {'m': 'mold_opening'})
drive(ejector, 'location', 0, '-0.0032*e if m>=95 else 0',
      {'e': 'ejector_extension', 'm': 'mold_opening'})
drive(rod, 'location', 0, '(5.05+0.011*m)/2', {'m': 'mold_opening'})
drive(rod, 'scale', 0, '1.85-0.011*m', {'m': 'mold_opening'})
drive(reservoir, 'location', 0, '-0.27-(0.09+0.0065*s)/2', {'s': 'screw_retraction'})
drive(reservoir, 'scale', 0, '0.09+0.0065*s', {'s': 'screw_retraction'})

def along(points, f):
    lengths = [(Vector(b)-Vector(a)).length for a, b in zip(points, points[1:])]
    remaining = f * sum(lengths)
    for a, b, length in zip(points, points[1:], lengths):
        if remaining <= length:
            return Vector(a).lerp(Vector(b), remaining/length)
        remaining -= length
    return Vector(points[-1])


for frame in range(sc.frame_start, sc.frame_end+1):
    t = (frame-1)/FPS
    sc.frame_set(frame)
    # Rotation/retraction only during plasticization. Injection is axial advance.
    screw_position = interp(t, [(0, 0), (4, -.65), (6, -.045), (7, 0), (14, 0)])
    rig['screw_retraction'] = -screw_position/.65*100
    # A smooth angle ramp stops the screw without a speed jump.
    ramp = min(t/4, 1)
    rig['screw_rotation_deg'] = 2880*(10*ramp**3-15*ramp**4+6*ramp**5)
    opening = interp(t, [(0, 0), (10, 0), (11, 1.10), (12.7, 1.10), (14, 0)])
    rig['mold_opening'] = opening/1.10*100
    eject = interp(t, [(0, 0), (11.1, 0), (11.7, -.32), (12.1, -.32), (12.55, 0), (14, 0)])
    rig['ejector_extension'] = -eject/.32*100
    for property_name in ('screw_retraction', 'screw_rotation_deg', 'mold_opening', 'ejector_extension'):
        rig.keyframe_insert(data_path='["'+property_name+'"]', frame=frame)
    visible = 4 <= t < 12.70
    fill = max(.001, min(1, (t-4)/2))
    part.scale = (1, 1, fill) if visible else (.001, .001, .001)
    drop = interp(t, [(0, 0), (11.72, 0), (12.3, .15), (14, .15)])
    part.location = (.80+opening+eject if t<11.72 else 1.58, 0, .72-drop)
    part.rotation_euler.y = interp(t, [(0, 0), (11.72, 0), (12.3, math.pi/2), (14, math.pi/2)])
    key(part, frame, 'location', 'scale', 'rotation_euler')
    runner.scale = (1, 1, 1) if 4 <= t < 10.02 else (.001, .001, .001)
    key(runner, frame, 'scale')
    for i, dot in enumerate(feed_dots):
        f = (t*.7+i/len(feed_dots)) % 1
        dot.location = (-3.45, -.055, 2.3-.94*f)
        dot.scale = (1, 1, 1) if t < 4 else (.001,)*3
        key(dot, frame, 'location', 'scale')
    for i, dot in enumerate(barrel_dots):
        f = (t*.35+i/len(barrel_dots)) % 1
        dot.location = (-3.5+2.45*f, -.235, 1.24+.025*math.sin(6*math.pi*f))
        dot.scale = (1, 1, 1) if t < 4 else (.001,)*3
        key(dot, frame, 'location', 'scale')
    for i, dot in enumerate(fill_dots):
        f = ((t-4)*.9+i/len(fill_dots)) % 1
        dot.location = along(runner_points, f)
        dot.scale = (1, 1, 1) if 4 <= t < 6.6 else (.001,)*3
        key(dot, frame, 'location', 'scale')

# Baking each frame avoids unsupported animated curve/material properties.
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for point in curve.keyframe_points:
                        point.interpolation = 'LINEAR'
for name, second in [('Plasticize', 0), ('Fill', 4), ('Pack and cool', 6), ('Eject', 10)]:
    sc.timeline_markers.new(name, frame=1+second*FPS)

sc.frame_set(145)
bpy.ops.object.camera_add(location=(6.7, -12.5, 6.2))
cam = bpy.context.object
cam.name = 'Inspection camera'
cam.rotation_euler = (Vector((-.4, 0, 1.25))-cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.type, cam.data.ortho_scale = 'ORTHO', 10.9
sc.camera = cam
for xyz, energy, size in [((-3, -5, 8), 1300, 6), ((4, 1, 5), 1000, 5)]:
    bpy.ops.object.light_add(type='AREA', location=xyz)
    light = bpy.context.object
    light.data.energy, light.data.size = energy, size
sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (.86, .83, .75, 1)
sc.world.node_tree.nodes['Background'].inputs[1].default_value = .65
sc.render.engine = 'CYCLES'
sc.cycles.samples, sc.cycles.use_denoising = 16, True
sc.render.resolution_x, sc.render.resolution_y = 1280, 640
sc.render.resolution_percentage = 100
sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = str(OUT/'injection-motion-poster.png')
bpy.ops.render.render(write_still=True)
sc.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'injection-motion.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'injection-motion.glb'), export_format='GLB',
                         export_animations=True, export_animation_mode='SCENE',
                         export_force_sampling=True, export_frame_range=True,
                         export_yup=True, export_cameras=False, export_lights=False,
                         export_extras=True)
metadata = {'generator': 'Blender '+bpy.app.version_string, 'fps': FPS,
            'duration_seconds': SECONDS, 'timing_basis': 'illustrative playback only',
            'stages': [0, 4, 6, 10], 'scene': sc.name,
            'addon_used': {'name': 'BoltFactory', 'version': '0.7.1',
                           'source': 'https://extensions.blender.org/add-ons/boltfactory/'},
            'rig_controller': 'MachineControls',
            'stroke_basis': 'normalized educational travel, not OEM dimensions',
            'mechanisms': ['screw rotation/retraction', 'axial injection',
                           'pellet/runner motion and cavity filling',
                           'closed-mold cooling', 'mold opening/ejector/closing']}
(OUT/'injection-motion.json').write_text(json.dumps(metadata, indent=2)+'\n', encoding='utf-8')
print('INJECTION_MOTION_EXPORT_OK', flush=True)
