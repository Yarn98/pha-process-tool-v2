"""Bake Blender equipment rigs to FBX for the Unreal studio, without modifying the .blend sources.

blender -b --factory-startup --python scripts/unreal/export-equipment.py [-- injection compounding ...]

Adapted from Straw Optimizer v2 scripts/blender/export-die.py. The export is render-only: web
interaction keeps using the animated GLBs. Each record also carries the Principled values of every
material slot, so the Unreal studio reproduces the Blender look instead of guessing from names.
Without arguments all eight Blender-built kinds are exported; with arguments only those kinds are
re-exported and merged into the existing exports.json.
"""
import hashlib
import json
import sys
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/unreal/fbx'
OUT.mkdir(parents=True, exist_ok=True)
KINDS = ['injection', 'extrusion', 'sheet', 'castfilm', 'blownfilm', 'blowmolding', 'compounding', 'straw']
# Still frames: the injection steady cycle at 13.3 s shows the open mould, toggle and ejected part.
FRAMES = {'injection': 319, 'blowmolding': 165}
# Web staging only: the Unreal studio has its own ground, and a 3 m-wider floor would shrink the camera fit.
STAGING = {'Floor'}
requested = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else KINDS
assert set(requested) <= set(KINDS), requested


def principled(material):
    """Linear base colour, metallic, roughness and alpha of a material (glTF-compatible values)."""
    node = material.node_tree.nodes.get('Principled BSDF') if material.node_tree else None
    if node is None:
        return {'color': list(material.diffuse_color[:3]), 'metallic': material.metallic,
                'roughness': material.roughness, 'alpha': material.diffuse_color[3]}
    value = lambda name, default: node.inputs[name].default_value if name in node.inputs else default
    return {'color': [round(c, 5) for c in value('Base Color', (.8, .8, .8, 1))[:3]],
            'metallic': round(value('Metallic', 0), 4), 'roughness': round(value('Roughness', .5), 4),
            'alpha': round(value('Alpha', 1), 4)}


report = []
for kind in requested:
    source = ROOT / f'assets/equipment/{kind}-motion.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    frame = FRAMES.get(kind, 55)
    scene.frame_set(frame)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    originals = [obj for obj in scene.objects if obj.type in {'MESH', 'CURVE'} and not obj.hide_render
                 and obj.name not in STAGING]
    # Evaluated copies bake drivers, constraints, hierarchy, curve thickness and shape keys.
    copies = []
    for original in originals:
        evaluated = original.evaluated_get(depsgraph)
        mesh = bpy.data.meshes.new_from_object(evaluated, depsgraph=depsgraph)
        copy = bpy.data.objects.new(original.name + '_Still', mesh)
        scene.collection.objects.link(copy)
        copy.matrix_world = original.matrix_world.copy()
        copies.append(copy)
    materials = {m.name: principled(m) for obj in copies for m in obj.data.materials if m is not None}
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
        'objects': len(copies), 'vertices': len(combined.data.vertices), 'materials': materials})
    print('PHA_FBX_OK', kind, len(materials), 'materials', flush=True)
manifest = OUT.parent / 'exports.json'
if requested != KINDS and manifest.exists():
    kept = [r for r in json.loads(manifest.read_text(encoding='utf-8')) if r['kind'] not in requested]
    report = sorted(kept + report, key=lambda r: KINDS.index(r['kind']))
manifest.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
(OUT.parent / 'exports-requested.json').write_text(json.dumps(requested) + '\n', encoding='utf-8')
