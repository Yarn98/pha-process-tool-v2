"""Read installed Blender add-ons without changing preferences or the scene."""
import addon_utils
import bpy
import json
from pathlib import Path

installed = []
for module in addon_utils.modules():
    info = getattr(module, 'bl_info', {})
    enabled, loaded = addon_utils.check(module.__name__)
    installed.append({'module': module.__name__, 'name': info.get('name'),
                      'version': info.get('version'), 'enabled': enabled, 'loaded': loaded})
report = {'blender': bpy.app.version_string, 'addons': installed,
          'extension_repositories': [repo.module for repo in bpy.context.preferences.extensions.repos]}
root = Path(__file__).resolve().parents[1]
(root / 'output/blender-capabilities.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False))
