"""Package verified Unreal images; retain provenance and reuse Straw bytes exactly.

Only the kinds in output/unreal/render-manifest.json are re-packed; records of the other kinds in
assets/equipment/unreal/manifest.json are kept unchanged, so one machine can be re-rendered alone.
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
from PIL import Image, ImageStat, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/unreal'
DEST = ROOT / 'assets/equipment/unreal'
SOURCE = ROOT.parent / 'straw-optimizer-v2'
ORDER = ['injection', 'extrusion', 'sheet', 'castfilm', 'blownfilm', 'blowmolding', 'compounding', 'straw']
DEST.mkdir(parents=True, exist_ok=True)
rendered = json.loads((OUT / 'render-manifest.json').read_text(encoding='utf-8'))
assert rendered and {r['kind'] for r in rendered} <= set(ORDER[:-1]), 'Unexpected Unreal batch'
existing_file = DEST / 'manifest.json'
records = {r['kind']: r for r in json.loads(existing_file.read_text(encoding='utf-8'))} if existing_file.exists() else {}
for record in rendered:
    png = ROOT / record['png']
    assert hashlib.sha256(png.read_bytes()).hexdigest() == record['png_sha256'], 'Stale render manifest'
    destination = DEST / (record['kind'] + '.webp')
    with Image.open(png) as image:
        rgb = image.convert('RGB')
        assert rgb.size == (1600, 900)
        assert min(ImageStat.Stat(rgb).stddev) > 15, 'Blank render'
        rgb.save(destination, 'WEBP', quality=90, method=6)
    record = {k: v for k, v in record.items() if k != 'materials'}   # material values stay in exports.json
    record.update(webp=destination.relative_to(ROOT).as_posix(), webp_bytes=destination.stat().st_size,
                  webp_sha256=hashlib.sha256(destination.read_bytes()).hexdigest())
    records[record['kind']] = record
if 'straw' not in records:
    source_image = SOURCE / 'src/assets/process/annular-die-unreal.webp'
    straw = DEST / 'straw.webp'
    shutil.copyfile(source_image, straw)
    source_manifest = json.loads((SOURCE / 'output/unreal/render-manifest.json').read_text(encoding='utf-8'))
    records['straw'] = {'kind': 'straw', 'source_repository': 'Yarn98/straw-optimizer-v2',
        'source_commit': subprocess.check_output(['git', '-C', str(SOURCE), 'rev-parse', 'HEAD'], text=True).strip(),
        'source_asset': 'src/assets/process/annular-die-unreal.webp',
        'source_task': '01a072b6-2784-7172-903c-201486003681',
        'webp': straw.relative_to(ROOT).as_posix(), 'webp_bytes': straw.stat().st_size,
        'webp_sha256': hashlib.sha256(straw.read_bytes()).hexdigest(),
        'reuse': 'Unmodified bytes', 'original_render': source_manifest}
ordered = [records[kind] for kind in ORDER if kind in records]
existing_file.write_text(json.dumps(ordered, indent=2) + '\n', encoding='utf-8')
# A compact contact sheet for human review; the individual images stay unchanged.
sheet = Image.new('RGB', (1000, 4 * 309), '#e9eee9')
draw = ImageDraw.Draw(sheet)
for index, record in enumerate(ordered):
    x, y = index % 2 * 500, index // 2 * 309
    with Image.open(ROOT / record['webp']) as image:
        image.thumbnail((500, 281))
        sheet.paste(image, (x, y + 28))
    draw.text((x + 12, y + 8), record['kind'].upper(), fill='#234739')
sheet.save(OUT / 'contact-sheet.webp', quality=88)
print('PHA_UNREAL_PACK_OK', [r['kind'] for r in rendered], sum(r['webp_bytes'] for r in ordered), 'bytes')
