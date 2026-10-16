"""Build six editable teaching rigs and adapt the user-selected Straw Optimizer rig.

blender -b --factory-startup --python scripts/create_line_models.py [-- sheet straw]
All dimensions and timing are illustrative; no process settings are derived.
"""
import bpy
import math
import json
import sys
import hashlib
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/equipment'
FPS, DURATION = 24, 12
M = {}


def init(name):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.data.orphans_purge(do_recursive=True)
    scene = bpy.context.scene
    scene.name = name
    scene.frame_start, scene.frame_end, scene.render.fps = 1, FPS*DURATION+1, FPS
    for key, color, metal, alpha in [
        ('metal', (.45,.51,.48),.55,1), ('dark',(.085,.135,.115),.35,1),
        ('steel',(.68,.73,.69),.55,1), ('bronze',(.51,.30,.10),.5,1),
        ('polymer',(.055,.40,.20),0,1), ('flow',(.33,.88,.42),0,1),
        ('water',(.20,.48,.53),.05,.32), ('glass',(.62,.80,.77),.1,.16),
        ('paper',(.84,.82,.75),0,1)]:
        mat = bpy.data.materials.new(key)
        mat.diffuse_color = (*color, alpha)
        mat.use_nodes = True
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = (*color,1)
        shader.inputs['Metallic'].default_value = metal
        shader.inputs['Roughness'].default_value = .40
        shader.inputs['Alpha'].default_value = alpha
        if alpha < 1:
            mat.surface_render_method = 'DITHERED'
            mat.use_transparency_overlap = False
        M[key] = mat
    return scene


def parent(obj, owner):
    if owner:
        bpy.context.view_layer.update()
        world = obj.matrix_world.copy()
        obj.parent = owner
        obj.matrix_world = world
    return obj


def finish(obj, name, mat, owner=None):
    obj.name = name
    obj.data.materials.append(M[mat])
    return parent(obj, owner)


def empty(name, pos=(0,0,0), group=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    if group: obj['motion_group'] = group
    return obj


def box(name, pos, size, mat='metal', owner=None, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Machined edges', 'BEVEL')
        mod.width, mod.segments = bevel, 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(obj,name,mat,owner)


def cyl(name, pos, radius, length, mat='steel', axis='X', owner=None, segments=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments, radius=radius, depth=length, location=pos)
    obj = bpy.context.object
    if axis=='X': obj.rotation_euler.y=math.pi/2
    elif axis=='Y': obj.rotation_euler.x=math.pi/2
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for poly in obj.data.polygons: poly.use_smooth = len(poly.vertices)==4
    return finish(obj,name,mat,owner)


def mesh(name, vertices, faces, mat='steel', owner=None):
    data=bpy.data.meshes.new(name)
    data.from_pydata(vertices,[],faces)
    data.update()
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    return finish(obj,name,mat,owner)


def pipe(name, points, radius=.04, mat='steel'):
    data=bpy.data.curves.new(name,'CURVE')
    data.dimensions='3D'; data.bevel_depth=radius; data.bevel_resolution=2
    spline=data.splines.new('POLY'); spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points): p.co=(*co,1)
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj)
    return finish(obj,name,mat)


def tube(name, a, b, outer, inner, mat='polymer', owner=None):
    n=32; length=(Vector(b)-Vector(a)).length
    verts=[(r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n),z)
           for z,r in ((-length/2,outer),(length/2,outer),(-length/2,inner),(length/2,inner)) for i in range(n)]
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),
                      (i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    obj=mesh(name,verts,faces,mat)
    obj.location=(Vector(a)+Vector(b))/2
    obj.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler()
    return parent(obj,owner)


def key(obj, frame, *props, group=None):
    if group: obj['motion_group']=group
    for prop in props: obj.keyframe_insert(data_path=prop,frame=frame)


def animate_spin(obj, group, turns=2, axis=0, direction=1):
    obj['motion_group']=group
    for frame in range(1,FPS*DURATION+2):
        obj.rotation_euler[axis]=direction*math.tau*turns*(frame-1)/(FPS*DURATION)
        key(obj,frame,'rotation_euler')


def shell(name,x0,x1,y,z,ry=.29,rz=.29,mat='metal'):
    n=32
    verts=[(x,y+(ry+thick)*math.cos(a),z+(rz+thick)*math.sin(a))
           for x,thick in ((x0,0),(x1,0),(x0,.065),(x1,.065))
           for a in [-math.pi/2+math.pi*i/n for i in range(n+1)]]
    s=n+1; faces=[]
    for i in range(n):
        j=i+1
        faces += [(i,j,s+j,s+i),(2*s+i,3*s+i,3*s+j,2*s+j),
                  (i,2*s+i,2*s+j,j),(s+i,s+j,3*s+j,3*s+i)]
    for i in (0,n): faces.append((i,s+i,3*s+i,2*s+i))
    return mesh(name,verts,faces,mat)


def rotor(name,y,z):
    owner=empty(name,(0,y,z),'screw')
    x0,x1=-4.8,-1.15
    rings=[(x0,.092),(-3.1,.092),(-1.9,.137),(x1,.137)]
    core_verts=[(x,y+r*math.cos(i*math.tau/32),z+r*math.sin(i*math.tau/32)) for x,r in rings for i in range(32)]
    mesh(name+'_core',core_verts,[(j*32+i,j*32+(i+1)%32,(j+1)*32+(i+1)%32,(j+1)*32+i) for j in range(3) for i in range(32)],'steel',owner)
    verts=[]; faces=[]; samples=440
    for i in range(samples+1):
        x=x0+(x1-x0)*i/samples
        a=math.tau*11*i/samples
        root=.092+.045*max(0,min(1,(x+3.1)/1.2))
        for r in (root,.215): verts.append((x,y+r*math.cos(a),z+r*math.sin(a)))
        if i:
            faces.append((2*i-2,2*i-1,2*i+1,2*i))
    flight=mesh(name+'_flight',verts,faces,'steel',owner)
    mod=flight.modifiers.new('Flight thickness','SOLIDIFY'); mod.thickness=.02
    bpy.context.view_layer.objects.active=flight
    bpy.ops.object.modifier_apply(modifier=mod.name)
    animate_spin(owner,'screw',direction=-1)
    return owner


def extruder(z=1.55):
    box('DriveBed',(-3.3,0,.20),(5.3,1.55,.27),'dark')
    for x in (-5.5,-1.1):
        for y in (-.56,.56): box('MachineFoot',(x,y,.015),(.27,.27,.25),'metal')
    box('GearboxPedestal',(-4.8,0,(z+.25)/2),(.95,.82,z-.15),'metal')
    cyl('DriveMotor',(-5.23,0,z),.39,.82,'dark')
    for x in [-5.51+i*.085 for i in range(8)]: cyl('MotorCoolingFin',(x,0,z),.415,.028,'dark')
    rotor('ScrewA',0,z)
    shell('BarrelCutaway',-4.9,-1.03,0,z,.285,.28)
    for x in (-4.45,-3.65,-2.7,-1.6):
        shell('HeaterBand',x-.11,x+.11,0,z,.35,.345,'bronze')
        cyl('Thermocouple',(x,.21,z+.41),.022,.2,'steel','Z')
        pipe('SensorCable',[(x,.21,z+.5),(x,.65,z+.53),(-4.2,.65,z+.53)],.012,'dark')
    cyl('ScreenFlange',(-.94,0,z),.40,.15,'dark')
    for angle in (-.85,.05,.95):
        y,zoff=.32*math.cos(angle),.32*math.sin(angle)
        cyl('FlangeFastener',(-1.04,y,z+zoff),.058,.055,'steel',segments=6)
    # Rear half hopper exposes material entry into the feed throat.
    verts=[(-4.45+r*math.cos(a),r*math.sin(a),h)
           for r,h in ((.15,z+.27),(.44,z+1.21)) for a in [math.pi*i/24 for i in range(25)]]
    mesh('HopperCutaway',verts,[(i,i+1,26+i,25+i) for i in range(24)],'metal')
    for i in range(8):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.06,location=(-4.6+(i%4)*.1,.07+(i//4)*.13,z+1.1))
        finish(bpy.context.object,'HopperPellet','polymer')
    markers([(-4.45,0,z+1.10),(-4.45,0,z),(-1.06,-.22,z)],8,'FeedMarker','flow',.045)


def roller(name,x,z,r=.3,group='roll',direction=1,width=1.4,y=0,turns=2):
    owner=empty(name,(x,y,z),group)
    cyl(name+'_drum',(x,y,z),r,width,'steel','Y',owner)
    cyl(name+'_hub',(x,y-width/2-.07,z),r*.36,.14,'dark','Y',owner)
    box(name+'_spoke',(x,y-width/2-.145,z),(r*1.6,.015,.028),'bronze',owner,bevel=.006)
    for yy in (y-width/2-.12,y+width/2+.12):
        box(name+'_bearing',(x,yy,z),(.19,.15,.19),'dark')
        box(name+'_upright',(x,yy,z/2),(.11,.14,max(.15,z-.1)),'metal')
    animate_spin(owner,group,turns,1,direction)
    return owner


def arc(x,z,r,start,end,n=30):
    return [(x+r*math.cos(math.radians(start+(end-start)*i/n)),0,z+r*math.sin(math.radians(start+(end-start)*i/n))) for i in range(n+1)]


def ribbon(name, points, width=1.1,mat='polymer'):
    verts=[(x,y+side*width/2,z) for x,y,z in points for side in (-1,1)]
    obj=mesh(name,verts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(len(points)-1)],mat)
    mod=obj.modifiers.new('Illustrative wall thickness','SOLIDIFY');mod.thickness=.015
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def along(points,f):
    lengths=[(Vector(b)-Vector(a)).length for a,b in zip(points,points[1:])]
    remaining=f*sum(lengths)
    for a,b,length in zip(points,points[1:],lengths):
        if remaining<=length: return Vector(a).lerp(Vector(b),remaining/max(length,.000001))
        remaining-=length
    return Vector(points[-1])


def markers(points,count,name,group='flow',radius=.045,mat='flow'):
    for i in range(count):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=radius)
        obj=finish(bpy.context.object,name+str(i).zfill(2),mat)
        for frame in range(1,FPS*DURATION+2):
            f=((frame-1)/(FPS*DURATION)+i/count)%1
            obj.location=along(points,f)
            key(obj,frame,'location',group=group)


def bath(x,length,z=1.55):
    box('CoolingBathFloor',(x,0,z-.21),(length,1.1,.08),'steel')
    box('CoolingBathRear',(x,.56,z-.02),(length,.065,.47),'metal')
    for xx in (x-length/2,x+length/2):
        box('BathEnd',(xx,0,z-.12),(.065,1.1,.22),'metal')
        for y in (-.42,.42):box('BathLeg',(xx,y,(z-.25)/2),(.09,.09,z-.25),'dark')
    box('BathWater',(x,0,z-.01),(length-.1,1.04,.016),'water',bevel=0)
    pipe('BathReturnPipe',[(x-length*.35,.60,z-.2),(x-length*.35,.80,.4),(x+length*.35,.80,.4),(x+length*.35,.6,z-.2)],.035)
    cyl('CirculationPump',(x,.80,.40),.13,.30,'dark')


def strand_line():
    extruder()
    z=1.55
    bath(.42,2.15,z)
    for y in (-.18,0,.18):
        pipe('ContinuousStrand',[(-.85,y,z),(3.4,y,z)],.028,'polymer')
        markers([(-.85,y,z),(3.45,y,z),(4.1,y,1.2),(4.6,y,.60)],8,'StrandMarker','flow',.039)
    roller('PullerLower',2.25,z-.225,.205,'haul',1,width=.85)
    roller('PullerUpper',2.25,z+.225,.205,'haul',-1,width=.85)
    box('PelletizerBody',(3.45,.42,1.3),(.95,.22,1.4),'dark')
    knife=roller('PelletCutter',3.50,z,.28,'cutter',1,width=.74,turns=1)
    for angle in (0,math.pi/2,math.pi,math.pi*1.5):
        obj=box('PelletKnife',(3.50+.26*math.cos(angle),0,z+.26*math.sin(angle)),(.07,.77,.07),'bronze',knife,.009)
    box('PelletGuard',(3.50,-.48,z),(.84,.02,.88),'glass')
    box('PelletTray',(4.35,0,.42),(1.45,1.0,.09),'metal')
    for i in range(14):
        pellet=cyl('CutPellet',(3.9+(i%5)*.19,-.34+(i//5)*.28,.51),.06,.10,'polymer','Y',segments=12)

def flat_die(z):
    pipe('AdapterToFlatDie',[(-.9,0,z),(-.52,0,z)],.17)
    box('FlatDieRear',(-.30,.38,z+.18),(.40,1.95,.31),'metal')
    box('FlatDieLowerLip',(-.30,0,z-.07),(.40,1.95,.095),'bronze')
    for y in (-.8,-.4,0,.4,.8):cyl('DieLipAdjuster',(-.27,y,z+.39),.04,.14,'dark','Z',segments=6)


def winding(x,z,group='winder',r=.6,width=1.5):
    owner=roller('Winder',x,z,r,group,1,width=width,turns=1)
    cyl('WoundFilm',(x,0,z),r+.006,width-.09,'polymer','Y',owner)
    for yy in (-width/2,width/2):cyl('WinderCore',(x,yy,z),.16,.18,'paper','Y',owner)


def sheet_line():
    extruder(1.20);flat_die(1.20)
    roller('BottomRoll',.5,.70,.46,'roll',1)
    roller('MiddleRoll',.5,1.68,.46,'roll',-1)
    roller('TopRoll',.5,2.66,.46,'roll',1)
    roller('SheetGuideRoll',2.15,2.83,.29,'roll',1)
    winding(3.5,2.52,r=.60)
    points=[(-.10,0,1.20)]+arc(.5,1.68,.48,-90,90)+arc(.5,2.66,.48,-90,-270)+[(2.15,0,3.14),(3.5,0,3.14)]
    ribbon('SheetWeb',points,1.1)
    markers(points,18,'SheetMarker','flow',.035)


def cast_line():
    extruder(2.08);flat_die(2.08)
    roller('ChillRoll',.62,1.15,.70,'roll',1)
    roller('FilmGuideRoll',2.25,.75,.29,'roll',-1)
    winding(3.9,1.35,r=.61)
    points=[(-.1,0,2.08),(.62,0,1.88)]+arc(.62,1.15,.73,90,30)+arc(2.25,.75,.315,-150,-30)+arc(3.9,1.35,.63,142,90,14)
    ribbon('CastFilmWeb',points,1.12)
    markers(points,16,'CastFilmMarker','flow',.034)
    box('AirKnifeHousing',(.48,.78,2.11),(.2,1.85,.16),'dark')


def bubble_mesh():
    n=40
    profile=[(.26,.90),(.27,1.08),(.45,1.45),(.72,2.0),(.82,2.7),(.82,3.7),(.82,4.45),(.88,4.85),(.92,5.20)]
    verts=[];big=[]
    for j,(r,z) in enumerate(profile):
        flatten=1 if j<7 else (0.45 if j==7 else .015)
        for i in range(n):
            a=math.tau*i/n; factor=1 if j<2 or j>6 else 1.32
            verts.append((r*math.cos(a)*flatten,r*math.sin(a),z))
            big.append((r*factor*math.cos(a)*flatten,r*factor*math.sin(a),z))
    obj=mesh('FilmBubble',verts,[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(profile)-1) for i in range(n)],'polymer')
    obj.shape_key_add(name='Basis')
    morph=obj.shape_key_add(name='BubbleWidth')
    for v,co in zip(morph.data,big):v.co=co
    morph.value=0;morph.keyframe_insert('value',frame=1)
    morph.value=1;morph.keyframe_insert('value',frame=FPS*DURATION+1)
    obj['motion_group']='bubble'
    return obj


def blown_line():
    extruder(.90)
    pipe('UpwardDieAdapter',[(-.86,0,.9),(-.60,0,.9),(-.60,0,.65),(0,0,.65)],.16)
    tube('AnnularDie',(0,0,.58),(0,0,.93),.32,.24,'bronze')
    tube('CoolingAirRing',(0,0,1.02),(0,0,1.13),.54,.38,'steel')
    bubble_mesh()
    # Collapse guides leave the operator-facing quarter open for inspection.
    for x in (-1.10,1.10):
        for y in (-.85,.85):box('TowerPost',(x,y,2.8),(.09,.09,5.55),'dark')
        pipe('CollapsingGuide',[(x*.86,.72,4.25),(x*.86,.06,5.19)],.025)
    for z in (1.1,3.2,5.35):box('TowerRearCrossbar',(0,.85,z),(2.25,.08,.07),'metal')
    # Roller axes follow the web width (Y). Both nip contacts move upward (+Z).
    for x,direction in ((-.22,-1),(.22,1)):
        owner=empty('NipLeft' if x<0 else 'NipRight',(x,0,5.22),'haul')
        cyl('NipDrum',(x,0,5.22),.205,2.12,'steel','Y',owner)
        box('NipMarker',(x,-1.10,5.22),(.025,.01,.30),'bronze',owner,.005)
        animate_spin(owner,'haul',2,1,direction)
    roller('TowerGuideRoll',2.0,5.18,.24,'haul',1,width=2.12)
    winding(3.9,1.40,r=.62,width=2.12)
    points=arc(.22,5.22,.22,180,90,12)+arc(2.0,5.18,.265,90,20,14)+arc(3.9,1.4,.64,145,90,12)
    ribbon('FlattenedFilmWeb',points,1.84)
    markers([(0,-.31,1.15),(0,-.82,2.8),(0,-.82,4.1),(0,-.86,5.20)]+points,18,'BubbleFlowMarker','flow',.042)


def ease(t,a,b):
    f=max(0,min(1,(t-a)/(b-a)))
    return f*f*f*(f*(f*6-15)+10)


def bottle(name,owner=None,formable=False):
    n=40; profile=[(.17,.0),(.42,.13),(.46,.40),(.45,1.30),(.36,1.48),(.18,1.65),(.17,1.83)]
    verts=[(r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n),z) for r,z in profile for i in range(n)]
    faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(profile)-1) for i in range(n)]
    faces.append(tuple(reversed(range(n))))
    obj=mesh(name,verts,faces,'polymer',owner)
    if formable:
        for vertex in obj.data.vertices:
            radial=Vector((vertex.co.x,vertex.co.y,0))
            if radial.length:vertex.co.x,vertex.co.y=radial.normalized().xy*.17
        obj.shape_key_add(name='Basis')
        shape=obj.shape_key_add(name='BottleExpansion')
        for vertex,co in zip(shape.data,verts):vertex.co=co
        shape.value=0;shape.keyframe_insert('value',frame=1)
        shape.keyframe_insert('value',frame=4.6*FPS+1)
        shape.value=1;shape.keyframe_insert('value',frame=6*FPS+1)
        shape.keyframe_insert('value',frame=DURATION*FPS+1)
        obj['motion_group']='inflate'
    return obj


def blow_line():
    extruder(3.7)
    pipe('ExtrusionHeadAdapter',[(-.9,0,3.7),(-.2,0,3.7),(.70,0,3.7),(.70,0,3.45)],.19)
    tube('ParisonHead',(.7,0,3.33),(.7,0,3.65),.27,.17,'bronze')
    box('ClampBed',(.7,0,.35),(4.1,2.1,.25),'dark')
    for side in (-1,1):
        owner=empty('MoldLeft' if side<0 else 'MoldRight',(0,0,0),'mold')
        # Partial shell exposes the cavity instead of hiding it behind a solid block.
        for z in (.65,3.00):box('MoldRail',(.7+side*.47,0,z),(.55,1.70,.20),'metal',owner)
        box('MoldRear',(.7+side*.47,.67,1.83),(.55,.20,2.2),'dark',owner)
        box('CavitySide',(.7+side*.53,.28,1.83),(.12,.55,1.96),'metal',owner)
        for y in (-.85,.85):cyl('MoldGuide',(.7,y,1.2),.055,3.4,'steel')
        for frame in range(1,FPS*DURATION+2):
            t=(frame-1)/FPS
            opening=1-ease(t,3,4)+ease(t,8.5,10)
            owner.location.x=side*.9*opening
            key(owner,frame,'location')
    parison=empty('ParisonLength',(.7,0,3.32),'parison')
    tube('HollowParison',(.7,0,1.37),(.7,0,3.32),.17,.13,'polymer',parison)
    inflated=empty('InflatedBody',(.7,0,1.37),'inflate')
    obj=bottle('FormedBottle',formable=True)
    obj.location=(.7,0,1.37);parent(obj,inflated)
    pin=empty('BlowPin',(0,0,0),'pin')
    cyl('BlowPinStem',(.7,0,3.72),.07,.77,'steel','Z',pin)
    pipe('BlowAirLine',[(.7,0,4.18),(.7,.8,4.18),(1.5,.8,4.18)],.035)
    released=empty('ReleasedBottle',(.7,0,1.37),'release')
    b=bottle('ReleasedBottleMesh');b.location=(.7,0,1.37);parent(b,released)
    box('BottleTray',(1.12,-.1,.60),(2.7,1.5,.10),'paper')
    for frame in range(1,FPS*DURATION+2):
        t=(frame-1)/FPS
        parison.scale.z=max(.001,ease(t,0,3))
        parison.scale.x=parison.scale.y=1 if t<4.61 else .001
        key(parison,frame,'scale')
        inflated.scale=(1,1,1) if 4.6<=t<9.4 else (.001,)*3
        key(inflated,frame,'scale')
        pin.location.z=-.42*(ease(t,4,4.6)-ease(t,8,8.5))
        key(pin,frame,'location')
        drop=ease(t,9.4,10.8)
        released.location=(.7+.3*drop,0,1.37-.66*drop)
        released.scale=(1,)*3 if 9.4<=t<11.6 else (.001,)*3
        key(released,frame,'location','scale')
    markers([(.7,0,3.5),(.7,0,2.7),(.9,0,2.2)],5,'AirMarker','air',.035,'water')


def control(key,ko,en,maximum=720,unit='°',time_range=None):
    return {'key':key,'label':[ko,en],'max':maximum,'unit':unit,'step':1 if unit=='°' else .1,'range':time_range or [0,DURATION]}


def config(kind):
    base={'id':kind,'duration':DURATION,'poster':f'assets/equipment/{kind}-motion-poster.png',
          'model':f'assets/equipment/{kind}-motion.glb','center':[-.5,1.6,0], 'span':[11.6,4.2],
          'controls':[control('screw','스크류 회전각','Screw rotation angle'),control('flow','수지 표시 위치','Resin marker position',100,'%')],
          'views':[{'key':'all','label':['전체 라인','Whole line'],'center':[-.5,1.6,0],'zoom':1},
                   {'key':'screw','label':['스크류·공급','Screw & feed'],'center':[-3.1,1.65,0],'zoom':2.1},
                   {'key':'finish','label':['성형·후단','Forming & downstream'],'center':[2.4,1.6,0],'zoom':2.0}],
          'stages':[['공급·용융','Feed & melt'],['다이·성형','Die & forming'],['냉각·인취','Cool & haul off'],['제품·배출','Product & discharge']]}
    if kind=='blownfilm':
        base.update(center=[-.5,2.8,0],span=[11.6,6.7],heightRatio=.64)
        base['views'][0]['center']=base['center']
        base['views'][2].update(label=['버블·닙롤','Bubble & nip'],center=[.25,3.1,0],zoom=1.7)
        base['controls'] += [control('bubble','버블 형상 조절','Bubble shape adjustment',100,'%'),control('haul','닙롤 회전각','Nip roll rotation angle'),control('winder','권취축 회전각','Winder rotation angle',360)]
        base['stages']=[['용융 공급','Melt feed'],['버블 성형','Bubble forming'],['냉각·인취','Cool & haul off'],['접힘·권취','Collapse & wind']]
    elif kind=='blowmolding':
        base.update(center=[-.7,2.35,0],span=[11.6,6.1])
        base['views'][0]['center']=base['center']
        base['views'][2].update(label=['금형·블로우 핀','Mold & blow pin'],center=[.7,2.3,0],zoom=1.9)
        base['controls']=[control('parison','패리슨 토출 진행','Parison extrusion progress',100,'%',[0,3]),
                          control('mold','금형 개방량','Mold opening',100,'%',[4,3]),
                          control('pin','블로우 핀 삽입량','Blow pin insertion',100,'%',[4,4.6]),
                          control('inflate','팽창 진행','Inflation progress',100,'%',[4.6,6])]
        base['initial']={'parison':0,'mold':100,'pin':0,'inflate':0}
        base['stages']=[['패리슨 토출','Extrude parison'],['금형 닫힘·팽창','Close & inflate'],['냉각','Cool'],['핀 복귀·제품 배출','Retract & discharge']]
    return base


def linear_keys():
    for action in bpy.data.actions:
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for point in curve.keyframe_points:point.interpolation='LINEAR'


def convert_curves():
    for obj in list(bpy.context.scene.objects):
        if obj.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
            bpy.ops.object.convert(target='MESH')


def stage_scene(meta):
    scene=bpy.context.scene
    scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.83,.81,.75,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.70
    target=Vector((meta['center'][0],0,meta['center'][1]))
    bpy.ops.object.camera_add(location=target+Vector((6,-15,7)))
    camera=bpy.context.object;camera.name='WholeLineCamera'
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO'
    scene.camera=camera
    for pos,energy in [((-3,-5,9),1800),((4,3,8),1300)]:
        bpy.ops.object.light_add(type='AREA',location=pos)
        bpy.context.object.data.energy=energy;bpy.context.object.data.size=7
    scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.cycles.device='CPU'
    scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage=1280,720,100
    scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
    scene.render.filepath=str(ROOT/meta['poster'])
    scene.frame_set(165 if meta['id']=='blowmolding' else 55)
    # Fit the projected geometry, including tall hoppers, instead of guessing a crop.
    bpy.context.view_layer.update()
    right=camera.rotation_euler.to_matrix().col[0];up=camera.rotation_euler.to_matrix().col[1]
    corners=[obj.matrix_world@Vector(corner) for obj in scene.objects if obj.type=='MESH' for corner in obj.bound_box]
    xs=[p.dot(right) for p in corners];ys=[p.dot(up) for p in corners]
    camera.location += right*((min(xs)+max(xs))/2-camera.location.dot(right))+up*((min(ys)+max(ys))/2-camera.location.dot(up))
    camera.data.ortho_scale=max(max(xs)-min(xs),(max(ys)-min(ys))*16/9)*1.08
    bpy.ops.render.render(write_still=True)


def export(meta,render=True):
    scene=bpy.context.scene
    linear_keys();convert_curves()
    if render:stage_scene(meta)
    scene.frame_set(1)
    scene['motion_scope']='Teaching rig; no OEM dimensions, process setpoints, CFD or thermal prediction.'
    scene['motion_controls']=json.dumps(meta['controls'],ensure_ascii=False)
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(meta['id']+'-motion.blend')),compress=True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/meta['model']),export_format='GLB',export_animations=True,
                             export_animation_mode='SCENE',export_force_sampling=True,export_frame_range=True,
                             export_anim_slide_to_zero=True,
                             export_yup=True,export_cameras=False,export_lights=False,export_extras=True)
    meta['blender']=bpy.app.version_string
    meta['groups']=sorted({obj.get('motion_group') for obj in scene.objects if obj.get('motion_group')})
    (OUT/(meta['id']+'-motion.json')).write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('LINE_MODEL_EXPORT_OK '+meta['id'],flush=True)


def straw_model():
    source=OUT/'sources/straw-optimizer-v2.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene=bpy.context.scene;scene.frame_end=121
    for obj in list(scene.objects):
        name=obj.name.lower()
        if obj.type in ('CAMERA','LIGHT') or name in ('ground','floor','backdrop'):
            bpy.data.objects.remove(obj,do_unlink=True);continue
        if obj.animation_data or (obj.data and getattr(obj.data,'shape_keys',None)):
            if 'rotor' in name or 'screw' in name:obj['motion_group']='screw'
            elif 'tread' in name or 'rotation indicator' in name:obj['motion_group']='haul'
            elif 'cutter' in name:obj['motion_group']='cutter'
            else:obj['motion_group']='flow'
        # Current BoltFactory converts input millimeters internally. Keep visible
        # fasteners at their intended model size in this copied teaching rig.
        if 'boltfactory flange fastener' in name and max(obj.dimensions)<.001:
            obj.scale*=1000
    segment=bpy.data.objects.get('Cut strand at outlet')
    if segment:
        # Preserve the borrowed hollow mesh; place its pivot at the cutting plane.
        bpy.context.view_layer.update()
        anchor=Vector((6.90,0,1.8))
        local_anchor=segment.matrix_world.inverted()@anchor
        world=segment.matrix_world.copy()
        segment.data.transform(Matrix.Translation(-local_anchor))
        segment.matrix_world=world@Matrix.Translation(local_anchor)
        for frame in range(1,122):
            f=(frame-1)/120
            if f<.18:
                segment.location=(6.90+.42*f/.18,0,1.8-.1*f/.18)
                segment.scale.x=1
            else:
                segment.location=(6.90,0,1.8)
                segment.scale.x=max(.001,(f-.18)/.82)
            key(segment,frame,'location','scale',group='cutter')
    meta={'id':'straw','duration':5,'poster':'assets/equipment/straw-motion-poster.webp',
          'model':'assets/equipment/straw-motion.glb','center':[.2,1.65,0],'span':[18.0,5.0],
          'controls':[control('screw','스크류 회전각','Screw rotation angle',360,time_range=[0,5]),
                      control('flow','수지 표시 위치','Resin marker position',100,'%',[0,5]),
                      control('haul','벨트 순환 위치','Belt loop position',100,'%',[0,5]),
                      control('cutter','절단날 회전각','Cutter rotation angle',360,time_range=[0,5])],
          'views':[{'key':'all','label':['전체 라인','Whole line'],'center':[.2,1.65,0],'zoom':1},
                   {'key':'screw','label':['스크류·배럴','Screw & barrel'],'center':[-4.7,1.8,0],'zoom':2.3},
                   {'key':'die','label':['환형 다이','Annular die'],'center':[-1,1.8,0],'zoom':4},
                   {'key':'finish','label':['인취·절단','Haul-off & cutter'],'center':[6.1,1.9,0],'zoom':3.5}],
          'stages':[['공급·압출','Feed & extrude'],['환형 다이·수조','Annular die & baths'],['벨트 인취','Belt haul-off'],['절단·배출','Cut & discharge']],
          'source':{'repository':'Yarn98/straw-optimizer-v2','head':'91d3a22e284f9296aed668bfec9d55dd58553777',
                    'basis':'user-authorized in-progress working-tree Blender snapshot',
                    'sha256':hashlib.sha256(source.read_bytes()).hexdigest()},'amberFlow':True}
    export(meta,False)


builders={'blownfilm':blown_line,'blowmolding':blow_line}
# The compounding, extrusion, sheet and cast-film lines are built at real scale by scripts/create_<kind>_motion.py.
KINDS=['extrusion','compounding','sheet','castfilm','blownfilm','blowmolding','straw']


def write_manifest():
    """Collect every rig's control metadata (assets/equipment/*-motion.json) into equipment-models.js."""
    manifest={}
    for kind in KINDS:
        file=OUT/(kind+'-motion.json')
        if file.exists():manifest[kind]=json.loads(file.read_text(encoding='utf-8'))
    (ROOT/'equipment-models.js').write_text('/* Blender equipment control metadata. */\nwindow.PHAEquipmentModels = '+json.dumps(manifest,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')


if __name__=='__main__':
    requested=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [*builders,'straw']
    for kind in requested:
        if kind=='straw':straw_model()
        elif kind in builders:init(kind);builders[kind]();export(config(kind))
        else:raise ValueError('Unknown equipment '+kind)
    write_manifest()
