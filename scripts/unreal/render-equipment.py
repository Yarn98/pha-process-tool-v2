"""Unreal DX12/Lumen batch studio, adapted from Straw Optimizer v2 render-die.py.

Run only in the dedicated PHAEquipment project via render-equipment.ps1.
All meshes are illustrative Blender equipment, not OEM or CFD measurements.
"""
import hashlib
import itertools
import json
import math
from pathlib import Path
import time
import traceback
import unreal

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/unreal'
ASSETS = '/Game/PHAStudy'
actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
editor = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem)
levels = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
exports = json.loads((OUT / 'exports.json').read_text(encoding='utf-8'))
results = []
PALETTE = {
    'steel': ((.50, .57, .57), .82, .27),
    'metal': ((.11, .27, .24), .62, .3),
    'gray': ((.11, .27, .24), .62, .3),
    'dark': ((.025, .045, .043), .5, .32),
    'bronze': ((.6, .3, .08), .65, .28),
    'polymer': ((.015, .3, .14), .05, .32),
    'green': ((.015, .3, .14), .05, .32),
    'flow': ((1, .36, .015), .15, .25),
    'paper': ((.45, .51, .47), .05, .52),
    'water': ((.03, .26, .33), .05, .12),
    'glass': ((.35, .58, .53), .05, .2),
    'floor': ((.13, .18, .18), .1, .6),
}


def material(key):
    path = ASSETS + '/M_' + key
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        return unreal.load_asset(path)
    color, metallic, roughness = PALETTE[key]
    asset = unreal.AssetToolsHelpers.get_asset_tools().create_asset('M_' + key, ASSETS, unreal.Material, unreal.MaterialFactoryNew())
    lib = unreal.MaterialEditingLibrary
    rgb = lib.create_material_expression(asset, unreal.MaterialExpressionConstant3Vector, -300, 0)
    rgb.set_editor_property('constant', unreal.LinearColor(*color, 1))
    lib.connect_material_property(rgb, '', unreal.MaterialProperty.MP_BASE_COLOR)
    values = [(metallic, unreal.MaterialProperty.MP_METALLIC), (roughness, unreal.MaterialProperty.MP_ROUGHNESS)]
    if key in ('glass', 'water'):
        asset.set_editor_property('blend_mode', unreal.BlendMode.BLEND_TRANSLUCENT)
        values.append((.08 if key == 'glass' else .22, unreal.MaterialProperty.MP_OPACITY))
    for index, (value, prop) in enumerate(values):
        node = lib.create_material_expression(asset, unreal.MaterialExpressionConstant, -300, 140 + index * 100)
        node.set_editor_property('r', value)
        lib.connect_material_property(node, '', prop)
    asset.set_editor_property('two_sided', True)
    lib.recompile_material(asset)
    unreal.EditorAssetLibrary.save_loaded_asset(asset)
    return asset


def aim(actor, target):
    actor.set_actor_rotation(unreal.MathLibrary.find_look_at_rotation(actor.get_actor_location(), unreal.Vector(*target)), False)


def build(record):
    unreal.EditorLoadingAndSavingUtils.new_blank_map(False)
    for existing in actors.get_all_level_actors():
        actors.destroy_actor(existing)
    world = editor.get_editor_world()
    unreal.SystemLibrary.execute_console_command(world, 'Interchange.FeatureFlags.Import.FBX 0')
    task = unreal.AssetImportTask()
    task.filename = str(ROOT / record['fbx'])
    task.destination_path = ASSETS
    task.destination_name = 'SM_' + record['kind']
    task.automated = True
    task.replace_existing = True
    task.save = True
    options = unreal.FbxImportUI()
    options.import_mesh = True
    options.import_materials = True
    options.import_textures = False
    options.import_as_skeletal = False
    options.static_mesh_import_data.combine_meshes = True
    options.static_mesh_import_data.auto_generate_collision = False
    options.static_mesh_import_data.remove_degenerates = False
    options.static_mesh_import_data.normal_import_method = unreal.FBXNormalImportMethod.FBXNIM_IMPORT_NORMALS
    options.static_mesh_import_data.normal_generation_method = unreal.FBXNormalGenerationMethod.BUILT_IN
    task.options = options
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    meshes = [unreal.load_asset(path) for path in task.imported_object_paths if isinstance(unreal.load_asset(path), unreal.StaticMesh)]
    if not meshes:
        raise RuntimeError('No mesh imported: ' + record['kind'])
    actor = actors.spawn_actor_from_object(meshes[0], unreal.Vector(0, 0, 0))
    actor.set_actor_label('PHA illustrative ' + record['kind'])
    center, extent = actor.get_actor_bounds(False)
    scale = 240 / (2 * max(extent.x, extent.y, extent.z))
    actor.set_actor_scale3d(unreal.Vector(scale, scale, scale))
    center, extent = actor.get_actor_bounds(False)
    actor.set_actor_location(unreal.Vector(-center.x, -center.y, -center.z + extent.z + 5), False, False)
    for index, slot in enumerate(meshes[0].static_materials):
        name = str(slot.material_slot_name).lower()
        key = next((k for k in sorted(PALETTE, key=len, reverse=True) if k in name), 'steel')
        actor.static_mesh_component.set_material(index, material(key))
    floor = actors.spawn_actor_from_object(unreal.load_asset('/Engine/BasicShapes/Cube.Cube'), unreal.Vector(0, 0, -1))
    floor.set_actor_scale3d(unreal.Vector(40, 40, .02))
    floor.static_mesh_component.set_material(0, material('floor'))
    target = (0, 0, extent.z + 5)
    for name, pos, intensity, width, height, temperature in (
        ('Key', (40, 120, 330), 28000, 260, 200, 5700),
        ('Rim', (-90, -180, 250), 30000, 230, 140, 6800),
        ('Fill', (220, 250, 180), 11000, 180, 160, 4900)):
        light = actors.spawn_actor_from_class(unreal.RectLight, unreal.Vector(*pos))
        light.set_actor_label(name)
        comp = light.get_component_by_class(unreal.RectLightComponent)
        comp.set_mobility(unreal.ComponentMobility.MOVABLE)
        for prop, value in [('intensity_units', unreal.LightUnits.LUMENS), ('intensity', intensity), ('source_width', width), ('source_height', height), ('use_temperature', True), ('temperature', temperature)]:
            comp.set_editor_property(prop, value)
        aim(light, target)
    # Fit all eight bounds corners to the camera frustum (including tall hoppers).
    def norm(values):
        length = math.sqrt(sum(value * value for value in values))
        return tuple(value / length for value in values)
    def dot(a, b):
        return sum(x * y for x, y in zip(a, b))
    direction = norm((.27, .91, .34))
    right = norm((-direction[1], direction[0], 0))
    up = (-direction[2] * right[1], direction[2] * right[0], direction[0] * right[1] - direction[1] * right[0])
    tan_h, tan_v = 36 / 90, 20.25 / 90
    distance = 0
    for x, y, z in itertools.product((-extent.x, extent.x), (-extent.y, extent.y), (-extent.z, extent.z)):
        vertex = (x, y, z)
        depth = dot(vertex, direction)
        distance = max(distance, abs(dot(vertex, right)) / tan_h + depth, abs(dot(vertex, up)) / tan_v + depth)
    location = unreal.Vector(*(target[i] + direction[i] * distance * 1.16 for i in range(3)))
    camera = actors.spawn_actor_from_class(unreal.CineCameraActor, location)
    aim(camera, target)
    component = camera.get_cine_camera_component()
    component.set_editor_property('current_focal_length', 45)
    component.set_editor_property('current_aperture', 11)
    filmback = component.get_editor_property('filmback')
    filmback.sensor_width, filmback.sensor_height = 36, 20.25
    component.set_editor_property('filmback', filmback)
    focus = component.get_editor_property('focus_settings')
    focus.focus_method = unreal.CameraFocusMethod.DISABLE
    component.set_editor_property('focus_settings', focus)
    post = component.get_editor_property('post_process_settings')
    post.override_auto_exposure_method = True
    post.auto_exposure_method = unreal.AutoExposureMethod.AEM_MANUAL
    post.override_auto_exposure_bias = True
    post.auto_exposure_bias = -7
    post.override_auto_exposure_apply_physical_camera_exposure = True
    post.auto_exposure_apply_physical_camera_exposure = False
    component.set_editor_property('post_process_settings', post)
    editor.set_level_viewport_camera_info(camera.get_actor_location(), camera.get_actor_rotation())
    levels.pilot_level_actor(camera)
    if not unreal.EditorLoadingAndSavingUtils.save_map(world, ASSETS + '/' + record['kind']):
        raise RuntimeError('Could not save studio level')
    unreal.EditorAssetLibrary.save_directory(ASSETS)
    return camera


def main():
    if 'PHAEquipment' not in unreal.Paths.get_project_file_path():
        raise RuntimeError('Use the dedicated PHAEquipment project')
    unreal.EditorPythonScripting.set_keep_python_script_alive(True)
    (OUT / 'render-error.txt').unlink(missing_ok=True)
    state = {'index': 0, 'camera': build(exports[0]), 'start': time.monotonic(), 'task': None, 'handle': None, 'busy': False}

    def tick(delta):
        # Import/save can pump Slate while this callback is still building a map.
        if state['busy']:
            return
        state['busy'] = True
        try:
            record = exports[state['index']]
            image = OUT / (record['kind'] + '-unreal.png')
            elapsed = time.monotonic() - state['start']
            if state['task'] is None and elapsed > 25:
                image.unlink(missing_ok=True)  # A failed new capture cannot pass using an old still.
                unreal.AutomationLibrary.finish_loading_before_screenshot()
                state['task'] = unreal.AutomationLibrary.take_high_res_screenshot(1600, 900, str(image), camera=state['camera'], delay=3)
            elif state['task'] is not None and state['task'].is_task_done() and image.exists():
                results.append({**record, 'engine': unreal.SystemLibrary.get_engine_version(), 'renderer': 'Unreal DX12 / Lumen', 'png': image.relative_to(ROOT).as_posix(), 'png_sha256': hashlib.sha256(image.read_bytes()).hexdigest(), 'scope': 'Illustrative equipment; no measured dimensions or CFD'})
                (OUT / 'render-manifest.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
                print('PHA_UNREAL_RENDER_OK', record['kind'], flush=True)
                state['index'] += 1
                if state['index'] == len(exports):
                    unreal.unregister_slate_post_tick_callback(state['handle'])
                    unreal.SystemLibrary.quit_editor()
                else:
                    state['task'] = None
                    state['camera'] = build(exports[state['index']])
                    state['start'] = time.monotonic()
            elif elapsed > 360:
                raise RuntimeError('Screenshot timed out: ' + record['kind'])
        except Exception:
            (OUT / 'render-error.txt').write_text(traceback.format_exc(), encoding='utf-8')
            unreal.unregister_slate_post_tick_callback(state['handle'])
            unreal.SystemLibrary.quit_editor()
        finally:
            state['busy'] = False

    state['handle'] = unreal.register_slate_post_tick_callback(tick)


try:
    main()
except Exception:
    (OUT / 'render-error.txt').write_text(traceback.format_exc(), encoding='utf-8')
    unreal.log_error(traceback.format_exc())
    unreal.SystemLibrary.quit_editor()
