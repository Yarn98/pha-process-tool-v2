"""Bake seven existing Blender rigs to FBX without modifying the .blend sources.

Adapted from Straw Optimizer v2 scripts/blender/export-die.py. The export is
render-only: web interaction continues to use the original animated GLBs.
"""
import hashlib
import json
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/unreal/fbx'
OUT.mkdir(parents=True, exist_ok=True)
KINDS = ['injection', 'extrusion', 'sheet', 'castfilm', 'blownfilm', 'blowmolding', 'compounding']
report = []
for kind in KINDS:
    source = ROOT / f'assets/equipment/{kind}-motion.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    frame = 278 if kind == 'injection' else 165 if kind == 'blowmolding' else 55
    scene.frame_set(frame)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    originals = [obj for obj in scene.objects if obj.type in {'MESH', 'CURVE'} and not obj.hide_render]
    # Evaluated copies bake drivers, hierarchy, curve thickness and bottle shape keys.
    copies = []
    for original in originals:
        evaluated = original.evaluated_get(depsgraph)
        mesh = bpy.data.meshes.new_from_object(evaluated, depsgraph=depsgraph)
        copy = bpy.data.objects.new(original.name + '_Still', mesh)
        scene.collection.objects.link(copy)
        copy.matrix_world = original.matrix_world.copy()
        copies.append(copy)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in copies:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.join()
    combined = bpy.context.object
    combined.name = 'PHA_' + kind
    destination = OUT / f'{kind}.fbx'
    bpy.ops.export_scene.fbx(filepath=str(destination), use_selection=True,
        object_types={'MESH'}, use_mesh_modifiers=True, mesh_smooth_type='FACE',
        bake_anim=False, axis_forward='-Y', axis_up='Z')
    report.append({'kind': kind, 'blender': bpy.app.version_string,
        'source': source.relative_to(ROOT).as_posix(), 'frame': frame,
        'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'fbx': destination.relative_to(ROOT).as_posix(),
        'fbx_sha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
        'objects': len(copies), 'vertices': len(combined.data.vertices)})
    print('PHA_FBX_OK', kind, flush=True)
(OUT.parent / 'exports.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
