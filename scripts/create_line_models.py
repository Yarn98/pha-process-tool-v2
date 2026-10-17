"""Shared control schema and manifest writer for the line rigs.

blender -b --factory-startup --python scripts/create_line_models.py

All seven lines are built at real scale by scripts/create_<kind>_motion.py on pha_blender_kit. Those scripts import
control() and write_manifest() from here so that every rig shares one control schema and one manifest writer; run on
its own, this script only rewrites equipment-models.js from the saved assets/equipment/*-motion.json files.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/equipment'
KINDS = ['extrusion', 'compounding', 'sheet', 'castfilm', 'blownfilm', 'blowmolding', 'straw']


def control(key, ko, en, maximum=720, unit='°', time_range=None):
    """One manual control: ``time_range`` maps 0..max onto the clip time of the motion group ``key``."""
    if time_range is None:
        raise ValueError('control ' + key + ' needs its clip time range')
    return {'key': key, 'label': [ko, en], 'max': maximum, 'unit': unit, 'step': 1 if unit == '°' else .1, 'range': time_range}


def write_manifest():
    """Collect every rig's control metadata (assets/equipment/*-motion.json) into equipment-models.js."""
    manifest = {}
    for kind in KINDS:
        file = OUT / (kind + '-motion.json')
        if file.exists():
            manifest[kind] = json.loads(file.read_text(encoding='utf-8'))
    (ROOT / 'equipment-models.js').write_text('/* Blender equipment control metadata. */\nwindow.PHAEquipmentModels = '
                                              + json.dumps(manifest, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')


if __name__ == '__main__':
    write_manifest()
