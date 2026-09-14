"""Blender-authored educational defect models; never a PHA process solver.

blender --background --factory-startup --python-exit-code 1 --python scripts/create_troubleshooting_models.py -- [family ...]
Production GLB + posters stay separate from editable Blender sources.
"""
from pathlib import Path
import json, math, sys, hashlib
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'assets/troubleshooting'
ART=ROOT/'art/troubleshooting'
RENDERS=ROOT/'output/troubleshooting-build/renders'
for directory in (DEST,ART,RENDERS): directory.mkdir(parents=True,exist_ok=True)
SPEC=json.loads((ROOT/'data/troubleshooting_visuals.json').read_text(encoding='utf-8'))
SELECT=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
M={}
OWNER=None

def material(name,color,metal=0,rough=.48):
    mat=bpy.data.materials.new(name)
    mat.diffuse_color=(*color,1)
    mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Metallic'].default_value=metal
    shader.inputs['Roughness'].default_value=rough
    M[name]=mat
    return mat

def reset():
    global M,OWNER
    # Hidden comparison states must also be removed between families.
    for obj in list(bpy.data.objects):bpy.data.objects.remove(obj,do_unlink=True)
    for collection in (bpy.data.meshes,bpy.data.curves,bpy.data.materials):
        for block in list(collection):
            if block.users==0:collection.remove(block)
    M={};OWNER=None
    for args in [('polymer',(.22,.38,.26),0,.38),('cut',(.57,.40,.19),0,.64),('steel',(.32,.40,.42),.65,.3),('dark',(.045,.075,.07),.25,.55),('light',(.66,.70,.66),.35,.44),('amber',(.83,.34,.06),0,.45),('white',(.82,.86,.76),0,.7),('ground',(.80,.79,.73),0,.9)]: material(*args)

def finish(obj,name,mat='polymer',section=False):
    obj.name=name
    if mat and not obj.data.materials:obj.data.materials.append(M[mat])
    if OWNER:obj.parent=OWNER
    obj['sectionable']=section
    return obj

def mesh(name,verts,faces,mat='polymer',section=False):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    return finish(obj,name,mat,section)

def apply(obj,mod):
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.modifier_apply(modifier=mod.name)

def box(name,pos,size,mat='steel',bevel=.035,section=False):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos);obj=bpy.context.object;obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('Rounded edges','BEVEL');mod.width=bevel;mod.segments=3;apply(obj,mod)
    return finish(obj,name,mat,section)

def cyl(name,pos,radius,depth,mat='steel',axis='Z',section=False):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=radius,depth=depth,location=pos)
    obj=bpy.context.object
    if axis=='X':obj.rotation_euler.y=math.pi/2
    if axis=='Y':obj.rotation_euler.x=math.pi/2
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    for p in obj.data.polygons:p.use_smooth=len(p.vertices)==4
    return finish(obj,name,mat,section)

def sphere(name,pos,scale,mat='polymer'):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=pos)
    obj=bpy.context.object;obj.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for p in obj.data.polygons:p.use_smooth=True
    return finish(obj,name,mat)

def boolean(obj,tool,op='DIFFERENCE',cut=False):
    if cut:
        if M['cut'] not in list(obj.data.materials):obj.data.materials.append(M['cut'])
        tool.data.materials.clear()
        for mat in obj.data.materials:tool.data.materials.append(mat)
        for p in tool.data.polygons:p.material_index=len(tool.data.materials)-1
    mod=obj.modifiers.new(op,'BOOLEAN');mod.object=tool;mod.operation=op;mod.solver='EXACT';apply(obj,mod)
    bpy.data.objects.remove(tool,do_unlink=True)

def line(name,points,radius=.018,mat='dark'):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=radius;data.bevel_resolution=2
    spline=data.splines.new('POLY');spline.points.add(len(points)-1)
    for v,co in zip(spline.points,points):v.co=(*co,1)
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);finish(obj,name,mat)
    return obj

def panel(name='Panel',top=None,bend=None,thickness=.40,width=6,length=4):
    nx,ny=48,28
    verts=[];faces=[]
    for layer in range(2):
        for j in range(ny+1):
            for i in range(nx+1):
                x=(i/nx-.5)*width;y=(j/ny-.5)*length
                z=(bend(x,y) if bend else 0)+(thickness+(top(x,y) if top else 0) if layer else 0)
                verts.append((x,y,z))
    stride=nx+1;n=stride*(ny+1)
    for j in range(ny):
        for i in range(nx):
            a=j*stride+i;b=a+1;c=a+stride+1;d=a+stride
            faces.extend([(a,d,c,b),(a+n,b+n,c+n,d+n)])
    rim=list(range(nx+1))+[j*stride+nx for j in range(1,ny+1)]+[ny*stride+i for i in range(nx-1,-1,-1)]+[j*stride for j in range(ny-1,0,-1)]
    for a,b in zip(rim,rim[1:]+rim[:1]):faces.append((a,b,b+n,a+n))
    obj=mesh(name,verts,faces,section=True)
    for p in obj.data.polygons:p.use_smooth=abs(p.normal.z)>.6
    return obj

def lathe(name,profile,thickness=.1,uneven=False,axis='Z',section=False):
    n=64;nr=len(profile);verts=[];faces=[]
    for inner in (False,True):
        for row,(z,r) in enumerate(profile):
            for i in range(n):
                a=i*math.tau/n
                t=thickness*(1+.72*math.cos(a) if uneven else 1)
                rr=max(.008,r-(t if inner else 0))
                zz=z+(thickness if inner and row==0 and r<.05 else 0)
                co=(rr*math.cos(a),rr*math.sin(a),zz)
                if axis=='X':co=(zz,co[0],co[1])
                verts.append(co)
    count=n*nr
    for j in range(nr-1):
        for i in range(n):
            a=j*n+i;b=j*n+(i+1)%n;c=b+n;d=a+n
            faces.extend([(a,b,c,d),(a+count,d+count,c+count,b+count)])
    for row in (0,nr-1):
        for i in range(n):
            a=row*n+i;b=row*n+(i+1)%n
            faces.append((a,a+count,b+count,b) if row==0 else (a,b,b+count,a+count))
    obj=mesh(name,verts,faces,section=section)
    for p in obj.data.polygons:p.use_smooth=True
    return obj

def ribbon(name,path,width=4,variable=None,thickness=.045):
    verts=[];faces=[];n=len(path)
    for i,(y,z) in enumerate(path):
        w=variable(i/(n-1)) if variable else width
        verts.extend([(-w/2,y,z),(w/2,y,z)])
    for i in range(n-1):faces.append((2*i,2*i+1,2*i+3,2*i+2))
    obj=mesh(name,verts,faces)
    mod=obj.modifiers.new('Thin sheet','SOLIDIFY');mod.thickness=thickness;apply(obj,mod)
    for p in obj.data.polygons:p.use_smooth=True
    return obj

def oscillator(obj,fn):
    obj.shape_key_add(name='Basis');key=obj.shape_key_add(name='Oscillate')
    for point in key.data:point.co=Vector(fn(*point.co))
    obj['oscillates']=True

def roller(y=0,z=1.3):
    obj=cyl('Roller',(0,y,z),1,4.6,'steel','X');obj['spin_axis']='x'
    witness=line('Roll witness',[(2.31,y,z),(2.31,y+.9,z)],.024,'amber')
    witness.parent=obj;witness.matrix_parent_inverse=obj.matrix_world.inverted()
    for x in (-2.5,2.5):box('Roll support',(x,y,.15),(.18,.6,.6),'dark')

def feed(state):
    box('Base',(0,0,-.15),(7,1.8,.25),'dark')
    cyl('Barrel',(0,0,.7),.44,5,'steel','X')
    box('Drive',(-3,0,.7),(1,1,1),'light')
    for x in (-1.8,-.8,.2,1.2):cyl('Heater band',(x,0,.7),.47,.18,'dark','X')
    bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.13,radius2=.72,depth=1.2,location=(-1.8,0,1.72));finish(bpy.context.object,'Hopper','steel')
    box('Die',(2.75,0,.7),(.4,1.2,1.2),'steel')
    if state=='inspection':
        for i,pos in enumerate([(-1.8,0,2.3),(-3,0,1.3),(2.8,0,1.4)]):
            sphere('Check position '+str(i+1),pos,(.19,.19,.19),'amber')

def film_speck(state):
    panel(thickness=.1)
    if state=='speck':
        sphere('Inclusion',(0,0,.09),(.33,.22,.15),'white')
        # Continuous raised skin over the inclusion; no assumed chemical identity.
        obj=panel('Raised film skin',top=lambda x,y:.20*math.exp(-(x*x/.45+y*y/.15)),thickness=.015)
        obj.location.z=.105

def die(state):
    obj=box('Die face',(0,0,0),(5,.6,2.3),'steel',section=True)
    for x in (-1.4,0,1.4):
        boolean(obj,cyl('Outlet',(x,0,0),.35,2,'dark','Y'))
        if state=='drool':
            for angle in (-.8,-.4,0,.4,.8):sphere('Lip residue',(x+.34*math.sin(angle),-.39,-.33*math.cos(angle)),(.18,.14,.13),'polymer')

def roll_release(state):
    roller()
    end=2.75 if state=='sticking' else 1.12
    path=[(-2.8,2.23)]+[(math.sin(a),1.3+1.035*math.cos(a)) for a in [(-.9+(end+.9)*i/35) for i in range(36)]]
    path += [(2.8,path[-1][1])]
    ribbon('Sheet release path',path)

def sheet_gauge(state):
    panel(top=(lambda x,y:.22+.21*math.cos(x*1.35)) if state=='uneven' else None,thickness=.12)

def short_shot(state):
    obj=box('Tray base',(0,0,.05),(5.8,3.8,.16),'polymer',.12,True)
    for pos,size in [((0,1.83,.48),(5.8,.17,.88)),((0,-1.83,.48),(5.8,.17,.88)),((-2.83,0,.48),(.17,3.8,.88)),((2.83,0,.48),(.17,3.8,.88))]:boolean(obj,box('Tray rim',pos,size,'polymer',.065),'UNION')
    if state=='short':
        cutter=cyl('Unfilled region',(2.6,1.65,.65),1.02,2,'dark')
        boolean(obj,cutter)

def silver(state):
    panel(thickness=.22)
    if state=='streak':
        for j in range(9):
            points=[]
            for i in range(25):
                t=i/24;points.append((-2.75+5.3*t,(j-4)*.16*t+(j-4)*.06*t*t,.225))
            line('Silver streak',points,.008+(j%3)*.003,'white')

def flash(state):
    short_shot('normal')
    if state=='flash':
        verts=[(x,y,.18+.015*math.sin(x*6)) for x,y in [(0,-1.95),(.5,-2.33),(1,-2.25),(1.5,-2.42),(2.2,-2.32),(2.85,-2.2),(2.85,-1.95)]]
        obj=mesh('Thin parting flash',verts,[tuple(range(len(verts)))])
        mod=obj.modifiers.new('Flash thickness','SOLIDIFY');mod.thickness=.025;apply(obj,mod)

def sink_void(state):
    obj=panel(top=(lambda x,y:-.18*math.exp(-((x/1.7)**4+(y/.47)**2))) if state=='sink' else None)
    boolean(obj,box('Rib',(0,0,-.43),(4.6,.90,1.02),'polymer',0),'UNION')
    if state=='void':boolean(obj,sphere('Internal void',(0,0,-.28),(1.35,.29,.37)))

def warp(state):
    panel(bend=(lambda x,y:.65*(x/3)**2+.22*math.sin(y*1.3)*x/3) if state=='warped' else None,thickness=.16)
    if state=='warped':
        for y in (-2,2):line('Reference plane',[(-3,y,-.03),(3,y,-.03)],.016,'dark')
        for x in (-3,3):line('Reference plane',[(x,-2,-.03),(x,2,-.03)],.016,'dark')

def thermoforming(state):
    # One-sided tool cutaway exposes the sheet and tapered plug.
    box('Machine base',(0,0,-.45),(6,4.7,.35),'dark')
    for x in (-2.65,2.65):
        for y in (-1.95,1.95):cyl('Frame column',(x,y,3),.075,6.4,'steel')
        box('Top beam',(x,0,6.25),(.26,4.3,.26),'light')
    box('Actuator bridge',(0,0,6.25),(5.55,.36,.28),'light')
    cyl('Plug actuator',(0,0,6),.27,1.0,'steel')
    for y in (-1.95,1.95):box('Clamp rail',(0,y,2.1),(5.5,.18,.24),'dark')['thermo_part']='clamp'
    for x in (-2.65,2.65):box('Clamp rail',(x,0,2.1),(.18,4,.24),'dark')['thermo_part']='clamp'
    mold=lathe('Female mold',[(.25,1.05),(2.04,1.65)],.35,section=False)
    mold.data.materials[0]=M['steel']
    boolean(mold,box('Tool cutaway',(0,-5,1),(15,10,10),None,0))
    cyl('Mold base',(0,0,.13),1.1,.24,'steel')
    line('Vacuum line',[(.5,.7,0),(1.6,.7,0),(1.6,1.8,-.15)],.065,'dark')
    cyl('Vacuum fitting',(1.6,1.8,-.15),.16,.25,'amber','Y')
    heater=box('Heater carriage',(0,0,3.25),(5.1,3.55,.12),'dark');heater['thermo_part']='heater'
    for x in (-2,-1,0,1,2):
        bar=box('Radiant heater',(x,0,3.12),(.30,3.1,.08),'amber');bar.parent=heater;bar.matrix_parent_inverse=heater.matrix_world.inverted()
    plug=lathe('Forming plug',[(0,.63),(1.5,1.10)],1.0,section=False)
    plug.location.z=3.5;plug.data.materials[0]=M['cut'];plug['thermo_part']='plug'
    # Fill the open plug ends; a forming plug is a solid tool.
    for z,r in ((3.52,.63),(4.97,1.1)):
        cap=cyl('Plug cap',(0,0,z),r,.05,'cut');cap.parent=plug;cap.matrix_parent_inverse=plug.matrix_world.inverted()
    stem=cyl('Plug rod',(0,0,5.25),.09,.5,'steel');stem['thermo_part']='rod'
    rings=[0.0,.24,.50,.72,.78,.86,.94,1.02,1.10,1.18,1.26,1.4,1.7,2.0,2.4,2.55]
    n=64;verts=[];formed=[];faces=[]
    for j,r in enumerate(rings):
        # Central cup floor, drafted side wall, then clamped flange.
        rz=.33 if r<=.72 else (.33+(r-.72)/.54*1.82 if r<1.26 else 2.15)
        for i in range(n):
            a=i*math.tau/n
            # Squared outer flange fits the rectangular clamp.
            rr=r if r<1.4 else r/(max(abs(math.cos(a)),abs(math.sin(a)))**.75)
            yscale=.72 if r>1.7 else 1
            verts.append((rr*math.cos(a),rr*math.sin(a)*yscale,2.15))
            formed.append((rr*math.cos(a),rr*math.sin(a)*yscale,rz))
    for j in range(len(rings)-1):
        for i in range(n):
            # A narrow opening through the drawn wall represents a visible crack.
            if state=='crack' and 4<=j<=9 and i==48:continue
            a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
    sheet=mesh('Forming sheet',verts,faces)
    sheet.shape_key_add(name='Basis');key=sheet.shape_key_add(name='Form')
    for v,p in zip(key.data,formed):v.co=p
    key.value=1
    if state=='whitening':
        sheet.data.materials.append(M['white'])
        for p in sheet.data.polygons:
            row=p.vertices[0]//n;sector=p.vertices[0]%n
            if 5<=row<=9 and 43<=sector<=52:p.material_index=1
    # Keep the forming sheet two-sided. Its thickness is only a visual surface,
    # not a thickness prediction; avoid applying a modifier over shape keys.
    for mat in sheet.data.materials:mat.use_backface_culling=False
    sheet['thermo_part']='sheet'
    for poly in sheet.data.polygons:poly.use_smooth=True

def bubble(state):
    profile=[(i*.14,.68+.44*math.sin(min(1,i/12)*math.pi/2)) for i in range(34)]
    obj=lathe('Film bubble',profile,.035)
    if state=='broken':boolean(obj,sphere('Rupture',(0,-1.02,2.3),(.48,.45,.48)))
    if state=='wobble':
        for v in obj.data.vertices:v.co.x+=.24*math.sin(v.co.z*1.0)
        obj.data.update()
        oscillator(obj,lambda x,y,z:(x-.48*math.sin(z),y,z))
    cyl('Die ring',(0,0,-.12),.90,.18,'steel')
    for x in (-1.55,1.55):box('Bubble guide',(x,0,2.3),(.08,.08,4.8),'dark')
    for y in (-.35,.35):cyl('Nip roll',(0,y,4.95),.22,2.8,'steel','X')

def blowmolding(state):
    if state in ('normal_parison','sag'):
        profile=[(i*.15,.60) for i in range(25)]
        obj=lathe('Parison',profile,.12)
        obj.location.z=.4
        cyl('Annular head',(0,0,4.35),.9,.4,'steel')
        if state=='sag':
            # Top remains at the die, lower material stretches in this drawing.
            for v in obj.data.vertices:
                frac=1-v.co.z/3.6;v.co.z-=.8*frac;v.co.x*=1-.2*frac;v.co.y*=1-.2*frac
            obj.data.update();oscillator(obj,lambda x,y,z:(x*(1.07 if z<2 else 1),y*(1.07 if z<2 else 1),z+.3*max(0,1-z/3.6)))
    else:
        profile=[(0,1.08),(.2,1.20),(2.8,1.20),(3.1,1.08),(3.65,.46),(4.15,.46)]
        obj=lathe('Bottle wall',profile,.13,state=='wall',section=True)
        boolean(obj,cyl('Bottle base',(0,0,.08),1.08,.16,'polymer'),'UNION')

def castfilm(state):
    roller(0,.9)
    box('Flat die',(0,-1.9,3.8),(4.6,.44,.55),'steel')
    path=[(-1.9+1.25*t,3.55-1.9*t) for t in [i/20 for i in range(21)]]
    end=2.6 if state=='release' else 1.2
    path += [(math.sin(a),.9+1.04*math.cos(a)) for a in [-.7+(end+.7)*i/25 for i in range(26)]]
    path += [(2.6,path[-1][1])]
    if state=='neckin':width=lambda t:4.1-1.45*min(1,t*3)
    elif state=='resonance':width=lambda t:3.6+.45*math.sin(t*math.tau*3)
    else:width=lambda t:4.1-.30*min(1,t*3)
    obj=ribbon('Cast web',path,variable=width)
    if state=='resonance':oscillator(obj,lambda x,y,z:(x*(1+.12*math.sin(y*3+z*2)),y,z))
    if state=='release':oscillator(obj,lambda x,y,z:(x,y,z+(.25*math.sin(y) if y>1 else 0)))

def straw(state):
    obj=lathe('Straw tube',[(-2.5,.48),(2.5,.48)],.14,axis='X',section=True)
    if state=='oval':
        for v in obj.data.vertices:v.co.y*=1.38;v.co.z*=.72
        obj.data.update()
    if state=='crack':
        tool=box('Cut-edge crack',(2.34,-.27,.37),(1.05,.12,.26),None,0)
        tool.rotation_euler.x=.5;boolean(obj,tool)
    if state=='dimension':
        obj.scale=(.86,.94,.94)
        for x in (-2.5,2.5):line('Reference rim',[(x,.48*math.cos(i*math.tau/64),.48*math.sin(i*math.tau/64)) for i in range(65)],.012,'dark')
        for a in (0,math.pi):line('Reference length',[(-2.5,.48*math.cos(a),.48*math.sin(a)),(2.5,.48*math.cos(a),.48*math.sin(a))],.012,'dark')

def vent(state):
    if state in ('normal_vent','flooding'):
        cyl('Barrel',(0,0,0),.6,5,'steel','X')
        tube=lathe('Vent port',[(.35,.48),(1.6,.48)],.12)
        tube.data.materials[0]=M['steel']
        for z in (.5,1.5):
            flange=lathe('Vent flange',[(z,.68),(z+.1,.68)],.26)
            flange.data.materials[0]=M['dark']
        if state=='flooding':
            for i in range(5):sphere('Melt at vent',(.15*math.sin(i),-.13*math.cos(i),1.1+i*.19),(.36,.36,.32))
    else:
        obj=cyl('Strand',(0,0,0),.53,6,'polymer','X',True)
        if state=='bubbles':
            for x in (-1.7,0,1.7):boolean(obj,sphere('Internal cavity',(x,0,0),(.57,.28,.28)))

BUILDERS={'feed':feed,'film-speck':film_speck,'die':die,'roll-release':roll_release,'sheet-gauge':sheet_gauge,'short-shot':short_shot,'silver':silver,'flash':flash,'sink-void':sink_void,'warp':warp,'thermoforming':thermoforming,'bubble':bubble,'blowmolding':blowmolding,'castfilm':castfilm,'straw':straw,'vent':vent}

def descendants(root):return [root]+list(root.children_recursive)

def set_thermo_pose(root,value):
    # Pose for posters. Runtime applies the same named educational stage sequence.
    for obj in root.children_recursive:
        role=obj.get('thermo_part')
        if role=='heater':obj.location.x=5.5*min(1,max(0,(value-.1)/.18))
        if role=='plug':
            down=min(1,max(0,(value-.2)/.35));up=min(1,max(0,(value-.76)/.18));obj.location.z=3.5-3.0*down*(1-up)
        if role=='rod':
            down=min(1,max(0,(value-.2)/.35));up=min(1,max(0,(value-.76)/.18));length=.5+3*down*(1-up)
            obj.scale.z=length/.5;obj.location.z=5.5-length/2
        if role=='clamp':obj.location.z=2.1+.75*min(1,max(0,(value-.82)/.08))
        if role=='sheet':
            obj.data.shape_keys.key_blocks['Form'].value=min(1,max(0,(value-.2)/.35))
            obj.location.z=.45*min(1,max(0,(value-.93)/.07))

def build(entry):
    global OWNER
    reset();family=entry['family'];groups=[]
    states=list(dict.fromkeys([c['normal'] for c in entry['cases']]+[c['state'] for c in entry['cases']]))
    section_states={s for c in entry['cases'] if c.get('section') for s in (c['normal'],c['state'])}
    for state in states:
        root=bpy.data.objects.new(state+'_full',None);bpy.context.collection.objects.link(root);OWNER=root
        root['state']=state;root['representation']='authored_educational_geometry';BUILDERS[family](state)
        groups.append(root)
        if state in section_states:
            clone=bpy.data.objects.new(state+'_section',None);bpy.context.collection.objects.link(clone);clone['state']=state;clone['section']=True
            for source in list(root.children):
                duplicate=source.copy();duplicate.data=source.data.copy();bpy.context.collection.objects.link(duplicate);duplicate.parent=clone
                if duplicate.type=='MESH' and duplicate.get('sectionable'):
                    OWNER=clone;tool=box('Cut plane',(0,-10,0),(40,20,40),None,0);boolean(duplicate,tool,cut=True)
            groups.append(clone)
    OWNER=None
    bpy.context.view_layer.update()
    # Export basis + all named states once, without studio content.
    bpy.ops.object.select_all(action='DESELECT')
    for root in groups:
        for obj in descendants(root):obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(DEST/(family+'.glb')),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_morph=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
    scene.render.threads_mode='FIXED';scene.render.threads=8
    scene.render.resolution_x=960;scene.render.resolution_y=640;scene.render.resolution_percentage=100
    scene.world.color=(.18,.18,.18);scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-.25
    for name,pos,power,size in [('Key',(-4,-5,9),1300,5),('Rim',(0,5,6),900,4),('Fill',(6,-3,3),240,4)]:
        bpy.ops.object.light_add(type='AREA',location=pos);light=bpy.context.object;light.name=name;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
    floor=box('Studio floor',(0,0,-1.2),(200,200,.05),'ground',0)
    bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';scene.camera=camera
    records=[]
    for root in groups:
        for other in groups:
            for obj in descendants(other):obj.hide_render=other!=root
        if family=='thermoforming':set_thermo_pose(root,.98)
        bpy.context.view_layer.update()
        coords=[obj.matrix_world@Vector(corner) for obj in root.children_recursive if obj.type=='MESH' and obj.get('thermo_part')!='heater' for corner in obj.bound_box]
        # For machine posters include the frame; exclude retracted heater children.
        if family=='thermoforming':coords=[obj.matrix_world@Vector(corner) for obj in root.children_recursive if obj.type=='MESH' and not (obj.get('thermo_part')=='heater' or obj.parent.get('thermo_part')=='heater') for corner in obj.bound_box]
        low=Vector(tuple(min(co[i] for co in coords) for i in range(3)));high=Vector(tuple(max(co[i] for co in coords) for i in range(3)))
        center=(low+high)/2;size=high-low
        floor.location.z=low.z-.07
        camera.location=center+Vector((7,-10,6 if family!='thermoforming' else 5))
        camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
        projected=[camera.rotation_euler.to_quaternion().inverted()@(co-center) for co in coords]
        projected_width=max(p.x for p in projected)-min(p.x for p in projected)
        projected_height=max(p.y for p in projected)-min(p.y for p in projected)
        camera.data.ortho_scale=max(projected_width,projected_height*1.5,2)*1.13
        scene.render.filepath=str(RENDERS/(family+'-'+root.name+'.png'));bpy.ops.render.render(write_still=True)
        records.append({'state':root.name,'png':str(Path(scene.render.filepath).relative_to(ROOT)).replace('\\','/'),'mesh_count':sum(obj.type=='MESH' for obj in root.children_recursive)})
    for i,root in enumerate(groups):
        for obj in descendants(root):obj.hide_set(i!=len(groups)-1);obj.hide_render=i!=len(groups)-1
    bpy.ops.wm.save_as_mainfile(filepath=str(ART/(family+'.blend')))
    report={'family':family,'blender':bpy.app.version_string,'units':'illustrative scene units','physical_process_solver':False,'glb':(DEST/(family+'.glb')).relative_to(ROOT).as_posix(),'states':records}
    (ART/(family+'-manifest.json')).write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print('TROUBLE_FAMILY_OK',family,len(records),flush=True)

for entry in SPEC['entries']:
    if not SELECT or entry['family'] in SELECT:build(entry)
print('TROUBLE_MODELS_COMPLETE',flush=True)
