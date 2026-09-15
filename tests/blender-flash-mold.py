"""Verify native and exported educational mold deformation, contact and isolation.

blender --background --factory-startup --python-exit-code 1 --python tests/blender-flash-mold.py
Checks teaching geometry and commands, not molding pressure or defect prediction.
"""
from pathlib import Path
import hashlib
import json
import math
import struct
import bpy
import bmesh
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
STATES=('normal','parting','vent','ejector')
NATIVE=ROOT/'art/flash-control/mold-detail.blend'
WEB=ROOT/'assets/flash-control/mold-detail.glb'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(NATIVE))
control=bpy.data.objects['InspectionControls']
roots=[bpy.data.objects[name] for name in STATES]
for root in roots:
    assert root.parent is None and root['physical_process_solver'] is False
    for obj in [root]+list(root.children_recursive):obj.hide_set(False)

def command(progress=1,opening=0,early=0):
    control['progress']=progress;control['opening']=opening;control['during_fill']=early
    control.update_tag();bpy.context.scene.frame_set(bpy.context.scene.frame_current+1)
    bpy.context.view_layer.update()
    return bpy.context.evaluated_depsgraph_get()

def objects(root,role):
    return [obj for obj in root.children_recursive if obj.get('flash_role')==role]

def coords(obj,world=False):
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    return [evaluated.matrix_world@v.co if world else v.co.copy() for v in evaluated.data.vertices]

def bounds(points):
    return [[min(p[i] for p in points) for i in range(3)],[max(p[i] for p in points) for i in range(3)]]

def span(obj,axis):
    limits=bounds(coords(obj));return limits[1][axis]-limits[0][axis]

def contains(obj,world_point):
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    local=evaluated.matrix_world.inverted()@Vector(world_point)
    found,point,normal,_=evaluated.closest_point_on_mesh(local)
    return found and (local-point).dot(normal)<-1e-6

command()
records=[]
for root in roots:
    meshes=[obj for obj in root.children_recursive if obj.type=='MESH']
    assert len(meshes)>=24
    assert all(len(obj.data.polygons)>0 for obj in meshes)
    assert all(math.isfinite(v) for obj in meshes for p in coords(obj) for v in p)
    assert len(objects(root,'upper_mold'))==1
    resin={role:objects(root,role)[0] for role in ('runner','gate','cavity')}
    for obj in resin.values():
        assert list(obj.data.shape_keys.key_blocks.keys())==['Basis']+['Fill'+str(i) for i in range(1,7)]
    flashes=objects(root,'flash')
    assert len(flashes)==(0 if root.name=='normal' else 1)
    if flashes:
        flash=flashes[0]
        assert flash['flash_location']==root.name
        assert flash.data.materials[0].name=='flash'
        bm=bmesh.new();bm.from_mesh(flash.evaluated_get(bpy.context.evaluated_depsgraph_get()).data)
        assert all(edge.is_manifold for edge in bm.edges), root.name+' flash is not closed'
        volume=bm.calc_volume(signed=True);bm.free()
        assert volume>1e-5, (root.name,volume)
    else:volume=0
    # Interior witness points overlap the three filled solids in sequence.
    for a,b,point in [('runner','gate',(-2.45,1.15,-.07)),('gate','cavity',(-2.16,1.15,-.07))]:
        assert contains(resin[a],point) and contains(resin[b],point), 'Disconnected resin path'
    lower=objects(root,'lower_mold')[0]
    for point in [(-2.45,1.15,-.07),(-2.16,1.15,-.07),(0,1,-.15)]:
        assert not contains(lower,point), 'Tool steel obstructs the teaching resin path'
    assert contains(lower,(2.8,1.4,-.6)), 'Lower tool is empty or inverted'
    attachment={'parting':(-2.19,1.9,.015),'vent':(-.65,2.385,.015),'ejector':(.95,.06,-.295)}
    if flashes:
        point=attachment[root.name]
        assert contains(flashes[0],point) and contains(resin['cavity'],point), 'Flash floats away from resin'
    # All non-defect geometry is shared, avoiding duplicate mobile payload.
    if root!=roots[0]:
        original={obj.name.split('__',1)[1]:obj for obj in roots[0].children_recursive if obj.type=='MESH'}
        for obj in meshes:
            if obj.get('flash_role')!='flash':assert obj.data==original[obj.name.split('__',1)[1]].data
    records.append({'state':root.name,'mesh_objects':len(meshes),'flash_volume_scene_units':round(volume,8),'resin_path_connected':True,'flash_attached':bool(flashes)})

motion=[]
for root in roots:
    upper=objects(root,'upper_mold')[0];lower=objects(root,'lower_mold')[0]
    command(opening=0);a=upper.matrix_world.translation.copy();fixed=lower.matrix_world.copy()
    command(opening=1);delta=upper.matrix_world.translation-a
    assert (delta-Vector((0,0,2.25))).length<1e-6
    assert lower.matrix_world==fixed
    assert list(upper['flash_open_vector'])==[0,2.25,0]
    motion.append({'state':root.name,'native_upper_delta_xyz':list(delta),'three_upper_delta_xyz':[0,2.25,0],'lower_fixed':True})

fill_samples=[]
for progress in (0,.08,.16,.205,.25,.35,.45,.55,.65,1):
    command(progress=progress)
    values={role:span(objects(roots[0],role)[0],0) for role in ('runner','gate','cavity')}
    fill_samples.append({'progress':progress,**values})
for role in ('runner','gate','cavity'):
    values=[row[role] for row in fill_samples]
    assert all(b>=a-1e-5 for a,b in zip(values,values[1:])), 'Nonmonotonic fill geometry'
    assert values[0]<.0002 and values[-1]>.4
assert fill_samples[2]['runner']>1.4 and fill_samples[2]['gate']<.0002
assert fill_samples[4]['gate']>.5 and fill_samples[4]['cavity']<.0002
assert abs(fill_samples[-2]['cavity']-4.4)<1e-4
flash_samples=[]
for early,progress in ((0,.6),(1,.6),(0,.7),(0,.825),(0,1)):
    command(progress=progress,early=early)
    weights=[objects(root,'flash')[0].data.shape_keys.key_blocks['FlashGrow'].value for root in roots[1:]]
    expected=max(0,min(1,(progress-(.55 if early else .70))/(.10 if early else .25)))
    assert all(abs(value-expected)<1e-5 for value in weights)
    flash_samples.append({'onset':'fill' if early else 'pack','progress':progress,'weight':round(weights[0],6)})

# Decode actual sparse GLB positions and morph deltas, rather than metadata only.
raw=WEB.read_bytes();assert raw[:4]==b'glTF' and struct.unpack_from('<II',raw,4)==(2,len(raw))
size,kind=struct.unpack_from('<II',raw,12);assert kind==0x4e4f534a
gltf=json.loads(raw[20:20+size]);offset=20+size
length,kind=struct.unpack_from('<II',raw,offset);assert kind==0x004e4942
binary=raw[offset+8:offset+8+length]
components={5121:('B',1),5123:('H',2),5125:('I',4),5126:('f',4)}
widths={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}

def block(view_id,offset,count,component,width):
    view=gltf['bufferViews'][view_id];fmt,unit=components[component]
    stride=view.get('byteStride',unit*width);start=view.get('byteOffset',0)+offset
    return [list(struct.unpack_from('<'+fmt*width,binary,start+i*stride)) for i in range(count)]

def accessor(index):
    item=gltf['accessors'][index];width=widths[item['type']]
    values=block(item['bufferView'],item.get('byteOffset',0),item['count'],item['componentType'],width) if 'bufferView' in item else [[0.]*width for _ in range(item['count'])]
    sparse=item.get('sparse')
    if sparse:
        ids=sparse['indices'];data=sparse['values']
        indices=block(ids['bufferView'],ids.get('byteOffset',0),sparse['count'],ids['componentType'],1)
        replacements=block(data['bufferView'],data.get('byteOffset',0),sparse['count'],item['componentType'],width)
        for (i,),value in zip(indices,replacements):values[i]=value
    assert all(math.isfinite(v) for p in values for v in p)
    return values

scene=gltf['scenes'][gltf.get('scene',0)]
assert {gltf['nodes'][i]['name'] for i in scene['nodes']}==set(STATES)
assert not gltf.get('animations')
assert len(raw)<2_000_000
exported=[]
command()
for node in gltf['nodes']:
    data=node.get('extras',{})
    if data.get('flash_role')=='upper_mold':
        assert node.get('translation',[0,0,0])==[0,0,0]
        assert data['flash_open_vector']==[0,2.25,0]
    if data.get('flash_role') not in ('runner','gate','cavity','flash'):continue
    mesh=gltf['meshes'][node['mesh']];primitive=mesh['primitives'][0]
    base=accessor(primitive['attributes']['POSITION'])
    targets=primitive['targets'];names=mesh['extras']['targetNames']
    expected=['FlashGrow'] if data['flash_role']=='flash' else ['Fill'+str(i) for i in range(1,7)]
    assert names==expected
    delta=accessor(targets[-1]['POSITION'])
    full=[[a+b for a,b in zip(p,q)] for p,q in zip(base,delta)]
    before,after=bounds(base),bounds(full)
    assert max(abs(x-y) for p,q in zip(before,after) for x,y in zip(p,q))>.03
    native=bpy.data.objects[node['name']]
    expected_bounds=bounds([Vector((v.x,v.z,-v.y)) for v in coords(native)])
    assert max(abs(x-y) for p,q in zip(after,expected_bounds) for x,y in zip(p,q))<2e-5, 'Exported full morph does not match native geometry'
    exported.append({'node':node['name'],'targets':names,'collapsed_bounds':before,'full_bounds':after,'matches_native_full_geometry':True})

manifest=json.loads((ROOT/'art/flash-control/manifest.json').read_text(encoding='utf-8'))
assert manifest['native_sha256']==sha(NATIVE)
for asset in manifest['assets']:
    assert sha(ROOT/asset['file'])==asset['sha256']
    assert sha(ROOT/asset['source'])==asset['source_sha256']
report={'status':'passed','blender':bpy.app.version_string,'native_sha256':sha(NATIVE),'glb_sha256':sha(WEB),'glb_bytes':len(raw),
        'states':records,'opening':motion,'native_fill_samples':fill_samples,'native_flash_samples':flash_samples,
        'exported_meshes':len(gltf['meshes']),'exported_nodes':len(gltf['nodes']),'exported_deformation':exported,
        'manifest_hashes_match':True,'actual_process_validation':False,
        'scope':'Original half-section teaching model. Arbitrary scene units. Exaggerated clearance, flash thickness, opening and phase fractions. No pressure, cooling, real flow or defect probability prediction.'}
out=ROOT/'docs/verification/flash-mold-geometry.json'
out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('FLASH_MOLD_GEOMETRY_OK',json.dumps({'states':len(records),'deformed_exported_nodes':len(exported),'bytes':len(raw)}),flush=True)
