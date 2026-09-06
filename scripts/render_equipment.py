"""Rebuild eight conceptual equipment views: blender -b --python scripts/render_equipment.py.
Geometry is illustrative, not equipment CAD or a simulation. An optional scene list selects a subset.
"""
import bpy, math, os, sys
from mathutils import Vector

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'assets','equipment')
os.makedirs(OUT,exist_ok=True)

def material(name,color,metal=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=.42
    return m
GRAY=material('Machined warm gray',(.44,.48,.46),.5)
DARK=material('Graphite frame',(.10,.15,.13),.3)
GREEN=material('Polymer flow sage',(.18,.46,.30))
PAPER=material('Warm paper',(.91,.88,.80))
COPPER=material('Heater bands',(.50,.30,.14),.55)
WATER=material('Bath water schematic',(.23,.48,.55))

def finish(obj,name,mat):
    obj.name=name;obj.data.materials.append(mat)
    bevel=obj.modifiers.new('Soft machined edges','BEVEL');bevel.width=.035;bevel.segments=3
    obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return obj
def box(name,pos,scale,mat=GRAY):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat)
def cyl(name,pos,r,depth,mat=GRAY,axis='Z'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=pos)
    o=bpy.context.object
    if axis=='X':o.rotation_euler[1]=math.pi/2
    if axis=='Y':o.rotation_euler[0]=math.pi/2
    return finish(o,name,mat)
def path(name,points,r=.04,mat=GREEN):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3
    s=c.splines.new('POLY');s.points.add(len(points)-1)
    for p,co in zip(s.points,points):p.co=(*co,1)
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
    return o
def ribbon(points,width=.8):
    verts=[(x,y+side*width/2,z) for x,y,z in points for side in (-1,1)]
    faces=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(points)-1)]
    me=bpy.data.meshes.new('Web');me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new('Continuous polymer web',me);bpy.context.collection.objects.link(o);o.data.materials.append(GREEN)
    sol=o.modifiers.new('Illustrative web thickness','SOLIDIFY');sol.thickness=.025

def tube(name,x1,x2,y,z,outer=.09,inner=.06):
    verts=[]
    for x,r in [(x1,outer),(x2,outer),(x1,inner),(x2,inner)]:
        verts.extend((x,y+r*math.cos(2*math.pi*i/48),z+r*math.sin(2*math.pi*i/48)) for i in range(48))
    faces=[]
    for i in range(48):
        j=(i+1)%48
        faces.extend([(i,j,48+j,48+i),(96+i,144+i,144+j,96+j),(i,96+i,96+j,j),(48+i,48+j,144+j,144+i)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);obj.data.materials.append(GREEN)
def extruder():
    box('Extruder base',(-2.6,0,.25),(3.9,.85,.45),DARK)
    cyl('Barrel',(-2.1,0,1),.28,3.6,GRAY,'X')
    for x in [-3.3,-2.6,-1.9,-1.2]:cyl('Heater band',(x,0,1),.30,.2,COPPER,'X')
    cyl('Drive',(-4.1,0,.85),.38,.65,DARK,'X')
    bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.16,radius2=.48,depth=.8,end_fill_type='NOTHING',location=(-3.5,0,1.65))
    finish(bpy.context.object,'Feed hopper',GRAY)
    cyl('Pellets in hopper',(-3.5,0,2.035),.41,.025,GREEN)
    # Green cutaway trace locates the melt path without claiming a screw design.
    path('Melt flow through barrel',[(-3.55,-.295,1),(-.22,-.295,1)],.045)
def roll(name,x,z,r=.45):
    cyl(name,(x,0,z),r,1.5,GRAY,'Y')
    cyl('Roll shaft',(x,0,z),.10,1.9,DARK,'Y')
def scene(kind):
    sc=bpy.data.scenes.new(kind);bpy.context.window.scene=sc
    sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True
    sc.render.resolution_x=1280;sc.render.resolution_y=640;sc.render.resolution_percentage=100
    sc.world=bpy.data.worlds.new(kind+' world');sc.world.use_nodes=True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.91,.88,.80,1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value=.65
    box('Ground',(0,0,-.10),(200,200,.1),PAPER)
    extruder()
    if kind=='injection':
        box('Fixed mold half',(.55,0,1),( .45,1.6,1.5))
        box('Moving mold half',(1.85,0,1),(.45,1.6,1.5))
        for y in [-.62,.62]:
            for z in [.38,1.62]:cyl('Tie bar',(1.15,y,z),.075,2.5,GRAY,'X')
        cyl('Nozzle',(-.15,0,1),.14,.5,GRAY,'X')
        path('Sprue runner gate',[(.38,-.84,1),(1,-.84,1),(1,-.84,.55)],.075)
        box('Molded plaque',(1.27,-.85,1),(.44,.07,.7),GREEN)
        box('Clamping platen',(2.8,0,1),(.4,1.8,1.65),DARK)
        box('Mold carriage',(1.2,0,.10),(4,1.2,.18),DARK)
    elif kind=='compounding':
        # Cutaway: two conceptual screws, without claiming an OEM screw design.
        for obj in list(sc.objects):
            if obj.name.startswith(('Barrel','Heater band')):bpy.data.objects.remove(obj,do_unlink=True)
        for y in [-.2,.2]:
            cyl('Twin screw shaft',(-2.1,y,1),.07,3.6,DARK,'X')
            points=[(-3.85+3.5*i/500,y+.19*math.cos(i/500*math.pi*24),1+.19*math.sin(i/500*math.pi*24)) for i in range(501)]
            path('Conceptual screw flight',points,.035,COPPER)
        path('Side-feed adapter',[(-1.7,1.1,1.35),(-1.7,.35,1.15)],.15,GRAY)
        bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.12,radius2=.35,depth=.6,end_fill_type='NOTHING',location=(-1.7,1.1,1.7))
        finish(bpy.context.object,'Side-feed hopper',GRAY)
        path('Vacuum vent duct',[(-.8,0,1.2),(-.8,0,2.2),(.1,0,2.2)],.10,GRAY)
        box('Vacuum collection schematic',(.25,0,2.05),(.45,.6,.6),DARK)
        cyl('Strand die',(-.1,0,1),.3,.25,GRAY,'X')
        box('Cooling trough',(1.2,0,.65),(2.1,1,.3),GRAY)
        for y in [-.2,0,.2]:path('Compound strand',[(0,y,1),(1.9,y,.9),(2.6,y,.9)],.045)
        box('Pellet cutter',(2.9,0,.7),(.7,1,1.1),DARK)
        for i in range(9):cyl('Compound pellet',(3.4+(i%3)*.14,-.2+(i//3)*.18,.22),.05,.10,GREEN,'X')
    elif kind=='straw':
        cyl('Annular tube die',(-.1,0,1),.30,.3,GRAY,'X')
        box('Crystallization bath',(1.2,0,.68),(2.0,1.15,.42),GRAY)
        box('Bath water',(1.2,0,.9),(1.88,1.02,.045),WATER)
        tube('Continuous hollow tube',0,3.0,0,1)
        for z in [.74,1.26]:roll('Haul-off roller',2.5,z,.20)
        box('Synchronized cutter',(3.1,0,.7),(.35,1,1.12),DARK)
        for i in range(3):tube('Cut hollow straw',3.4,4.2,-.3+i*.3,.4)
    elif kind=='extrusion':
        cyl('Strand die',(-.1,0,1),.35,.3,GRAY,'X')
        box('Cooling trough',(1.1,0,.6),(2.0,1.2,.3),GRAY)
        for y in [-.25,0,.25]:path('Strand',[(-.1,y,1),(1.6,y,.79),(2.3,y,.86)],.045)
        box('Pelletizer',(2.8,0,.7),(.9,1.2,1.15),DARK)
        cyl('Cutter',(2.8,-.65,.95),.3,.1,GRAY,'Y')
        for i in range(12):cyl('Pellet',(3.45+(i%4)*.12,-.3+(i//4)*.18,.2),.045,.09,GREEN,'X')
    elif kind in ('sheet','castfilm'):
        box('Flat die',(.1,0,1),(.3,1.55,.35),GRAY)
        if kind=='sheet':
            for z in [.4,1.3,2.2]:roll('Three-roll stack',1.2,z,.43)
            ribbon([(.2,0,1),(1.15,0,.85),(1.7,0,.85),(2.5,0,.85),(3.6,0,.85)],1.2)
            box('Trim and haul-off',(2.8,0,.65),(.5,1.7,.35),DARK)
        else:
            roll('Chill roll',1.2,.85,.65);roll('Guide roll',2.5,1.1,.18)
            wrap=[(1.2+.68*math.cos(math.radians(a)),0,.85+.68*math.sin(math.radians(a))) for a in range(145,-21,-5)]
            ribbon([(.2,0,1)]+wrap+[(2.5,0,.90),(3.5,0,.975)],1.15)
            cyl('Wound film',(3.5,0,.65),.3,1.35,GREEN,'Y')
            box('Winder',(3.5,0,.15),(.8,1.75,.3),DARK)
    elif kind=='blownfilm':
        path('Melt adapter',[(-.25,0,1),(.55,0,1),(.55,0,1.4)],.17,GRAY)
        cyl('Annular die',(.55,0,1.3),.4,.3,GRAY)
        bpy.ops.mesh.primitive_cone_add(vertices=64,radius1=.35,radius2=.65,depth=1.35,location=(.55,0,2.12))
        finish(bpy.context.object,'Inflating tubular bubble',GREEN)
        cyl('Tubular film',(.55,0,3.2),.65,.8,GREEN)
        for y in [-.9,.9]:box('Tower',( .55,y,2.1),(.11,.11,4),DARK)
        for x in [.35,.75]:roll('Nip rollers',x,4.0,.18)
        bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.8,radius2=.12,depth=.35,location=(.55,0,3.8),rotation=(0,0,math.pi/4))
        finish(bpy.context.object,'Collapse section schematic',GREEN)
        ribbon([(.55,0,4.1),(2,0,4.1),(3.2,0,.65)],.65)
        cyl('Film roll',(3.2,0,.55),.35,1, GREEN,'Y')
    elif kind=='blowmolding':
        path('Extrusion head',[(-.25,0,1),(.25,0,1),(.25,0,2.2),(1,0,2.2)],.18,GRAY)
        cyl('Parison',(1,0,1.82),.17,.7,GREEN)
        box('Open mold left',(.65,.55,.9),(.7,.4,1.6),GRAY)
        box('Open mold right',(1.75,.55,.9),(.7,.4,1.6),GRAY)
        cyl('Bottle body',(1.2,-.15,.75),.32,.9,GREEN)
        bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.32,radius2=.14,depth=.25,location=(1.2,-.15,1.325))
        finish(bpy.context.object,'Bottle shoulder',GREEN)
        cyl('Bottle neck',(1.2,-.15,1.55),.14,.25,GREEN)
        box('Mold base',(1.2,.15,.1),(2.5,1.8,.2),DARK)
    bpy.ops.object.light_add(type='AREA',location=(-1,-5,8));bpy.context.object.data.energy=1800;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=7
    bpy.ops.object.camera_add(location=(7,-13,7.2));cam=bpy.context.object
    aim=Vector((-.3,0,1.6 if kind=='blownfilm' else 1.05));cam.rotation_euler=(aim-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=11.3;sc.camera=cam
    sc.view_settings.view_transform='AgX';sc.render.image_settings.file_format='PNG';sc.render.filepath=os.path.join(OUT,kind+'.png')
    bpy.ops.render.render(write_still=True)
    print('EQUIPMENT_RENDER_OK',kind,flush=True)

all_scenes=['injection','extrusion','sheet','blownfilm','blowmolding','castfilm','compounding','straw']
selected=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else all_scenes
if not selected or any(name not in all_scenes for name in selected):raise ValueError('Select supported equipment scenes')
for name in selected:scene(name)
if bpy.data.scenes.get('Scene'):bpy.data.scenes.remove(bpy.data.scenes['Scene'])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'pha-equipment.blend' if selected==all_scenes else 'pha-guides.blend'))
