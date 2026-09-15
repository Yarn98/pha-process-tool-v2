"""Original educational mold cutaway, with inspectable fill and flash shape keys.

blender --background --factory-startup --python-exit-code 1 --python scripts/create_flash_mold_model.py
python scripts/create_flash_mold_model.py --pack

Scene dimensions, gaps, flash thickness and phase timing are explanatory only.
This is neither tooling CAD nor pressure, filling, material or defect prediction.
"""
from pathlib import Path
import hashlib
import json
import math
import sys

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'art/flash-control'
WEB=ROOT/'assets/flash-control'
STATES=('normal','parting','vent','ejector')
for path in (ART,WEB):path.mkdir(parents=True,exist_ok=True)
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()

if '--pack' in sys.argv:
    from PIL import Image,ImageStat
    manifest=json.loads((ART/'manifest.json').read_text(encoding='utf-8'))
    assets=[]
    for state in STATES:
        src=ART/(state+'.png');dst=WEB/(state+'.webp')
        with Image.open(src) as image:
            image=image.convert('RGB')
            assert min(ImageStat.Stat(image).stddev)>10
            image.save(dst,'WEBP',quality=88,method=6)
        assets.append({'file':dst.relative_to(ROOT).as_posix(),'source':src.relative_to(ROOT).as_posix(),'bytes':dst.stat().st_size,'sha256':sha(dst),'source_sha256':sha(src)})
    path=WEB/'mold-detail.glb'
    assets.append({'file':path.relative_to(ROOT).as_posix(),'source':'scripts/create_flash_mold_model.py','bytes':path.stat().st_size,'sha256':sha(path),'source_sha256':sha(Path(__file__))})
    manifest.update(assets=assets,native_sha256=sha(ART/'mold-detail.blend'))
    (ART/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    (WEB/'manifest.json').write_text(json.dumps({k:v for k,v in manifest.items() if k!='native_sha256'},indent=2)+'\n',encoding='utf-8')
    print('FLASH_MOLD_PACKED',len(assets),flush=True)
    raise SystemExit(0)

import bpy
import bmesh
from mathutils import Vector

M={};OWNER=None;PREFIX='normal__'
for obj in list(bpy.data.objects):bpy.data.objects.remove(obj,do_unlink=True)
for name,color,metal,rough in [('steel',(.32,.44,.48),.66,.31),('cut_steel',(.61,.71,.70),.55,.36),('dark',(.025,.065,.082),.35,.4),('polymer',(.055,.48,.35),.03,.34),('flash',(.96,.29,.055),.02,.36),('air',(.06,.50,.69),.1,.32),('ground',(.83,.84,.78),0,.85),('brass',(.58,.39,.15),.55,.4)]:
    mat=bpy.data.materials.new(name);mat.diffuse_color=(*color,1);mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*color,1)
    shader.inputs['Metallic'].default_value=metal;shader.inputs['Roughness'].default_value=rough;M[name]=mat

def finish(obj,name,mat='steel',role=None,parent=None):
    obj.name=PREFIX+name;obj.parent=parent if parent is not None else OWNER
    if mat:obj.data.materials.append(M[mat])
    if role:obj['flash_role']=role
    return obj

def mesh(name,vertices,faces,mat='steel',role=None,parent=None):
    data=bpy.data.meshes.new(PREFIX+name);data.from_pydata(vertices,[],faces);data.update()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    obj=bpy.data.objects.new(PREFIX+name,data);bpy.context.collection.objects.link(obj)
    return finish(obj,name,mat,role,parent)

def apply(obj,modifier):
    bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=modifier.name)

def box(name,position,size,mat='steel',bevel=.035,role=None,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=position);obj=bpy.context.object;obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('Machined edge','BEVEL');mod.width=bevel;mod.segments=2;apply(obj,mod)
    return finish(obj,name,mat,role,parent)

def cyl(name,position,radius,depth,mat='steel',axis='Z',role=None,parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=radius,depth=depth,location=position)
    obj=bpy.context.object
    if axis=='X':obj.rotation_euler.y=math.pi/2
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    for p in obj.data.polygons:p.use_smooth=len(p.vertices)==4
    return finish(obj,name,mat,role,parent)

def cut(body,tool):
    mod=body.modifiers.new('Teaching section or cavity','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=tool
    apply(body,mod);bpy.data.objects.remove(tool,do_unlink=True)

def plaque(name,bottom=-.30,top=.02,mat='polymer',role=None):
    nx,ny=28,16;vertices=[];faces=[]
    for z in (bottom,top):
        for j in range(ny+1):
            y=2.4*j/ny
            half=2.2 if y<=2.2 else 2.0+math.sqrt(max(0,.2**2-(y-2.2)**2))
            for i in range(nx+1):vertices.append(((2*i/nx-1)*half,y,z))
    stride=nx+1;n=stride*(ny+1)
    for j in range(ny):
        for i in range(nx):
            a=j*stride+i;b=a+1;c=b+stride;d=a+stride
            faces.extend(((a,d,c,b),(a+n,b+n,c+n,d+n)))
    rim=list(range(nx+1))+[j*stride+nx for j in range(1,ny+1)]+[ny*stride+i for i in range(nx-1,-1,-1)]+[j*stride for j in range(ny-1,0,-1)]
    for a,b in zip(rim,rim[1:]+rim[:1]):faces.append((a,b,b+n,a+n))
    return mesh(name,vertices,faces,mat,role)

def driver(block,property_name,expression,variables):
    curve=block.driver_add(property_name);drv=curve.driver;drv.type='SCRIPTED';drv.expression=expression
    for name,key in variables.items():
        var=drv.variables.new();var.name=name;var.type='SINGLE_PROP';var.targets[0].id=CONTROL;var.targets[0].data_path='["'+key+'"]'
    return curve

def filling(obj,start,end):
    original=[v.co.copy() for v in obj.data.vertices];low=min(v.x for v in original);high=max(v.x for v in original)
    obj.shape_key_add(name='Basis')
    for point,full in zip(obj.data.shape_keys.key_blocks['Basis'].data,original):point.co.x=min(full.x,low+.0001)
    for i in range(1,7):
        key=obj.shape_key_add(name='Fill'+str(i),from_mix=False)
        for point,full in zip(key.data,original):point.co=full;point.co.x=min(full.x,low+(high-low)*i/6)
        driver(key,'value',f'max(0,1-abs(min(1,max(0,(p-{start})/{end-start}))*6-{i}))',{'p':'progress'})
    obj['flash_fill_start']=start;obj['flash_fill_end']=end;obj['flash_morph_count']=6;obj['sectionable']=True

def grow(obj,collapse):
    original=[v.co.copy() for v in obj.data.vertices];obj.shape_key_add(name='Basis')
    for point,full in zip(obj.data.shape_keys.key_blocks['Basis'].data,original):point.co=collapse(full)
    key=obj.shape_key_add(name='FlashGrow',from_mix=False)
    for point,full in zip(key.data,original):point.co=full
    driver(key,'value','min(1,max(0,(p-.55)/.10)) if early>.5 else min(1,max(0,(p-.70)/.25))',{'p':'progress','early':'during_fill'})
    obj['flash_role']='flash';obj['sectionable']=True

def half_ring(name,x,inner,outer,z0,z1):
    n=32;vertices=[];faces=[]
    for z,r in ((z0,inner),(z1,inner),(z0,outer),(z1,outer)):
        vertices.extend((x+r*math.cos(math.pi*i/n),r*math.sin(math.pi*i/n),z) for i in range(n+1))
    s=n+1
    for i in range(n):
        j=i+1;faces.extend(((i,s+i,s+j,j),(2*s+i,2*s+j,3*s+j,3*s+i),(i,j,2*s+j,2*s+i),(s+i,3*s+i,3*s+j,s+j)))
    for i in (0,n):faces.append((i,2*s+i,3*s+i,s+i))
    return mesh(name,vertices,faces,'flash','flash')

CONTROL=bpy.data.objects.new('InspectionControls',None);bpy.context.collection.objects.link(CONTROL)
CONTROL['progress']=1.0;CONTROL['opening']=0.0;CONTROL['during_fill']=0.0
for key in ('progress','opening','during_fill'):CONTROL.id_properties_ui(key).update(min=0,max=1)
CONTROL['scope']='Normalized explanatory controls; no machine settings or defect prediction.'
OWNER=bpy.data.objects.new('normal',None);bpy.context.collection.objects.link(OWNER)
OWNER['representation']='original_educational_half_section';OWNER['physical_process_solver']=False

lower=box('LowerMold',(0,1.6,-.60),(7.4,3.2,1.2),'cut_steel',.065,'lower_mold')
cut(lower,plaque('Cavity tool',-.315,.08,None))
cut(lower,cyl('Runner tool',(-3.12,1.15,-.07),.145,1.45,None,'X'))
cut(lower,box('Gate tool',(-2.40,1.15,-.065),(.54,.29,.20),None,.012))
cut(lower,box('Vent relief',(-.65,2.82,-.025),(.44,.84,.10),None,0))
for x,y in ((.65,0),(-1.15,1.65)):
    cut(lower,cyl('Ejector bore',(x,y,-.82),.34,1.8,None))
    pin=cyl('Ejector pin',(x,y,-.96),.255,1.32,'steel',role='ejector_pin')
    if y==0:
        cut(pin,box('Pin section',(x,-2,-.95),(1,4,3),None,0))
        pin['sectionable']=True
box('Ejector plate',(0,1.35,-1.75),(5.8,2.7,.20),'dark',.05,'ejector_plate')
box('Lower backing plate',(0,1.6,-1.28),(7.8,3.45,.18),'steel')
for x in (-3.1,3.1):
    for y in (.50,2.73):
        cyl('Guide pin',(x,y,.19),.13,2.42,'steel')
        cyl('Guide seat',(x,y,-.03),.23,.1,'brass')
upper=bpy.data.objects.new(PREFIX+'UpperMold',None);bpy.context.collection.objects.link(upper);upper.parent=OWNER
upper['flash_role']='upper_mold';upper['flash_open_vector']=[0,2.25,0]
curve=upper.driver_add('location',2);drv=curve.driver;drv.type='SCRIPTED';drv.expression='2.25*opening'
var=drv.variables.new();var.name='opening';var.targets[0].id=CONTROL;var.targets[0].data_path='["opening"]'
tool=box('UpperMoldSection',(0,1.6,.43),(7.4,3.2,.78),'steel',.06,parent=upper)
cut(tool,box('Upper observation cut',(0,1.1,.45),(4.85,2.86,2),None,0))
for x in (-3.1,3.1):
    for y in (.50,2.73):
        cut(tool,cyl('Guide bushing bore',(x,y,.5),.15,1.4,None))
        cyl('Upper bushing',(x,y,.80),.24,.11,'dark',parent=upper)
tool['educational_cutaway']=True;lower['educational_cutaway']=True
for x in (-3.5,3.5):box('Parting line witness',(x,1.6,.025),(.06,3.0,.025),'brass',.006)
runner=cyl('RunnerResin',(-3.11,1.15,-.07),.133,1.46,'polymer','X','runner')
gate=box('GateResin',(-2.40,1.15,-.067),(.54,.26,.17),'polymer',.010,'gate')
part=plaque('CavityResin',role='cavity')
filling(runner,0,.16);filling(gate,.16,.25);filling(part,.25,.65)
box('Air vent indicator',(-.65,3.16,.035),(.39,.065,.025),'air',.004,role='vent_path')

normal=OWNER;groups=[normal]
for state in STATES[1:]:
    root=bpy.data.objects.new(state,None);bpy.context.collection.objects.link(root)
    for key,value in normal.items():root[key]=value
    mapping={normal:root}
    pending=list(normal.children_recursive)
    while pending:
        for original in pending[:]:
            if original.parent not in mapping:continue
            clone=original.copy();bpy.context.collection.objects.link(clone);clone.name=state+'__'+original.name.split('__',1)[1]
            clone.parent=mapping[original.parent];mapping[original]=clone;pending.remove(original)
    groups.append(root)
for root in groups:
    OWNER=root;PREFIX=root.name+'__';root['case']=root.name
    if root.name=='parting':
        outline=[(-2.18,1.68),(-2.66,1.68),(-3.23,1.79),(-3.13,1.97),(-3.35,2.14),(-2.93,2.32),(-2.18,2.22)]
        vertices=[(x,y,z) for z in (.003,.042) for x,y in outline];n=len(outline)
        faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        obj=mesh('PartingFlash',vertices,faces,'flash','flash');obj['flash_location']='parting'
        grow(obj,lambda v:Vector((-2.18+(v.x+2.18)*.0001,v.y,.015+(v.z-.015)*.001)))
    elif root.name=='vent':
        obj=box('VentFlash',(-.65,2.70,.022),(.41,.67,.044),'flash',.006,'flash');obj['flash_location']='vent'
        # Translate mesh into parent coordinates before defining a spatially attached morph.
        obj.data.transform(obj.matrix_local);obj.location=(0,0,0)
        grow(obj,lambda v:Vector((v.x,2.395+(v.y-2.395)*.0001,.015+(v.z-.015)*.001)))
    elif root.name=='ejector':
        obj=half_ring('EjectorRingFlash',.65,.257,.333,-.62,-.287);obj['flash_location']='ejector'
        grow(obj,lambda v:Vector((.65+(v.x-.65)*.98,v.y*.98,-.296+(v.z+.296)*.001)))

OWNER=None;PREFIX='Studio__';bpy.context.view_layer.update()
CONTROL['opening']=0.;CONTROL['progress']=1.;CONTROL['during_fill']=0.
CONTROL.update_tag();bpy.context.scene.frame_set(1);bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for root in groups:
    for obj in [root]+list(root.children_recursive):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(WEB/'mold-detail.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_morph=True)

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED';scene.render.threads=8
scene.render.resolution_x=1440;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.world.color=(.22,.22,.22)
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
for name,pos,energy,size in [('Key',(-4,-4,8),1500,5),('Rim',(2,6,7),1750,5),('Fill',(6,-2,4),600,4)]:
    bpy.ops.object.light_add(type='AREA',location=pos);obj=bpy.context.object;obj.name=name;obj.data.energy=energy;obj.data.shape='DISK';obj.data.size=size
    obj.rotation_euler=(Vector((0,1,.1))-obj.location).to_track_quat('-Z','Y').to_euler()
box('Floor',(0,0,-1.94),(100,100,.05),'ground',0)
bpy.ops.object.camera_add(location=(6,-10,6.5));camera=bpy.context.object;scene.camera=camera
target=Vector((0,1.30,.12));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=10.1
CONTROL['opening']=.62;CONTROL.update_tag();scene.frame_set(2)
for root in groups:
    for other in groups:
        for obj in [other]+list(other.children_recursive):obj.hide_render=other!=root
    scene.render.filepath=str(ART/(root.name+'.png'));bpy.ops.render.render(write_still=True)
for root in groups:
    for obj in [root]+list(root.children_recursive):obj.hide_set(root.name!='parting');obj.hide_render=root.name!='parting'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.shading.color_type='MATERIAL';area.spaces.active.region_3d.view_location=target
            area.spaces.active.region_3d.view_rotation=camera.rotation_euler.to_quaternion();area.spaces.active.region_3d.view_distance=12;area.spaces.active.region_3d.view_perspective='ORTHO'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ART/'mold-detail.blend'),compress=True)
manifest={'id':'flash-mold-detail','blender':bpy.app.version_string,'states':list(STATES),'model':'assets/flash-control/mold-detail.glb',
          'representation':'Original half-section teaching mold; not a manufacturer design or measured defect image.',
          'physical_process_solver':False,'units':'arbitrary scene units; openings, clearance and flash thickness are exaggerated',
          'geometry':'Continuous left runner to narrow gate to half-section plaque cavity. Shared tool/resin mesh data across four separate state groups.',
          'native_controls':'InspectionControls custom properties progress/opening/during_fill drive fill keys, flash keys and upper mold position.',
          'viewer_contract':{'class':'FlashMoldViewer','module':'flash-mold-viewer.js','state':['progress','opening','onset'],'onset':['fill','pack'],
                             'frame':'glTF Y-up; upper mold flash_open_vector=[0,2.25,0]',
                             'fill':'runner 0-.16; gate .16-.25; cavity .25-.65; Fill1..Fill6; these are illustrative phase fractions, not fill times',
                             'flash':'FlashGrow; fill onset .55-.65 or packing onset .70-.95; normal case has no flash mesh'},
          'colors':{'steel':'blue-gray','resin':'green','unwanted_flash':'orange','air_vent':'blue'}}
(ART/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('FLASH_MOLD_BUILT',len(groups),flush=True)
