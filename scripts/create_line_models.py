"""Adapt the user-selected Straw Optimizer rig and collect every rig's metadata into equipment-models.js.

blender -b --factory-startup --python scripts/create_line_models.py [-- straw]

The six generated lines are built at real scale by scripts/create_<kind>_motion.py on pha_blender_kit. Those
scripts import control() and write_manifest() from here so that every rig shares one control schema and one
manifest writer.
"""
import bpy
import json
import sys
import hashlib
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/equipment'


def key(obj, frame, *props, group=None):
    if group: obj['motion_group']=group
    for prop in props: obj.keyframe_insert(data_path=prop,frame=frame)


def control(key,ko,en,maximum=720,unit='°',time_range=None):
    """One manual control: ``time_range`` maps 0..max onto the clip time of the motion group ``key``."""
    if time_range is None:raise ValueError('control '+key+' needs its clip time range')
    return {'key':key,'label':[ko,en],'max':maximum,'unit':unit,'step':1 if unit=='°' else .1,'range':time_range}


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


def export(meta):
    scene=bpy.context.scene
    linear_keys();convert_curves()
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
    export(meta)


KINDS=['extrusion','compounding','sheet','castfilm','blownfilm','blowmolding','straw']


def write_manifest():
    """Collect every rig's control metadata (assets/equipment/*-motion.json) into equipment-models.js."""
    manifest={}
    for kind in KINDS:
        file=OUT/(kind+'-motion.json')
        if file.exists():manifest[kind]=json.loads(file.read_text(encoding='utf-8'))
    (ROOT/'equipment-models.js').write_text('/* Blender equipment control metadata. */\nwindow.PHAEquipmentModels = '+json.dumps(manifest,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')


if __name__=='__main__':
    requested=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['straw']
    for kind in requested:
        if kind=='straw':straw_model()
        else:raise ValueError(kind+' is built by scripts/create_'+kind+'_motion.py')
    write_manifest()
