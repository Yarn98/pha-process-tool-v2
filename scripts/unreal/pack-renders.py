"""Package verified Unreal images; retain provenance and reuse Straw bytes exactly."""
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
DEST.mkdir(parents=True, exist_ok=True)
records = json.loads((OUT / 'render-manifest.json').read_text(encoding='utf-8'))
assert {r['kind'] for r in records} == {'injection','extrusion','sheet','castfilm','blownfilm','blowmolding','compounding'}, 'Incomplete Unreal batch'
for record in records:
    png = ROOT / record['png']
    assert hashlib.sha256(png.read_bytes()).hexdigest() == record['png_sha256'], 'Stale render manifest'
    destination = DEST / (record['kind'] + '.webp')
    with Image.open(png) as image:
        rgb = image.convert('RGB')
        assert rgb.size == (1600, 900)
        assert min(ImageStat.Stat(rgb).stddev) > 15, 'Blank render'
        rgb.save(destination, 'WEBP', quality=90, method=6)
    record.update(webp=destination.relative_to(ROOT).as_posix(), webp_bytes=destination.stat().st_size,
        webp_sha256=hashlib.sha256(destination.read_bytes()).hexdigest())
source_image = SOURCE / 'src/assets/process/annular-die-unreal.webp'
straw = DEST / 'straw.webp'
shutil.copyfile(source_image, straw)
source_manifest = json.loads((SOURCE / 'output/unreal/render-manifest.json').read_text(encoding='utf-8'))
records.append({'kind': 'straw', 'source_repository': 'Yarn98/straw-optimizer-v2',
    'source_commit': subprocess.check_output(['git', '-C', str(SOURCE), 'rev-parse', 'HEAD'], text=True).strip(),
    'source_asset': 'src/assets/process/annular-die-unreal.webp',
    'source_task': '01a072b6-2784-7172-903c-201486003681',
    'webp': straw.relative_to(ROOT).as_posix(), 'webp_bytes': straw.stat().st_size,
    'webp_sha256': hashlib.sha256(straw.read_bytes()).hexdigest(),
    'reuse': 'Unmodified bytes', 'original_render': source_manifest})
(DEST / 'manifest.json').write_text(json.dumps(records, indent=2) + '\n', encoding='utf-8')
# A compact contact sheet for human review; the individual images stay unchanged.
sheet = Image.new('RGB', (1000, 4*309), '#e9eee9')
draw = ImageDraw.Draw(sheet)
for index, record in enumerate(records):
    x, y = index % 2 * 500, index // 2 * 309
    with Image.open(ROOT / record['webp']) as image:
        image.thumbnail((500, 281))
        sheet.paste(image, (x, y+28))
    draw.text((x+12, y+8), record['kind'].upper(), fill='#234739')
sheet.save(OUT / 'contact-sheet.webp', quality=88)
print('PHA_UNREAL_PACK_OK', len(records), sum(r['webp_bytes'] for r in records), 'bytes')
