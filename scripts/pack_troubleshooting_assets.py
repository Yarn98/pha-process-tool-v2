"""Package own generated images and Blender posters for web delivery; retain originals."""
from pathlib import Path
import json,hashlib,shutil
from PIL import Image,ImageDraw,ImageFont,ImageStat
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'art/troubleshooting';DEST=ROOT/'assets/troubleshooting';OUT=ROOT/'output/troubleshooting-build'
spec=json.loads((ROOT/'data/troubleshooting_visuals.json').read_text(encoding='utf-8'))
records=[]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def pack(source,dest,size,quality):
    with Image.open(source) as im:
        im=im.convert('RGB');im.thumbnail(size,Image.Resampling.LANCZOS)
        assert min(ImageStat.Stat(im).stddev)>4,('Blank image',source)
        im.save(dest,'WEBP',quality=quality,method=6)
    records.append({'file':dest.relative_to(ROOT).as_posix(),'source':source.relative_to(ROOT).as_posix(),'source_sha256':sha(source),'sha256':sha(dest),'bytes':dest.stat().st_size})

for entry in spec['entries']:
    family=entry['family'];manifest=json.loads((ART/(family+'-manifest.json')).read_text(encoding='utf-8'))
    for state in manifest['states']:
        source=ROOT/state['png'];name=family+'-'+state['state']
        pack(source,DEST/(name+'.webp'),(960,640),87)
    glb=DEST/(family+'.glb')
    records.append({'file':glb.relative_to(ROOT).as_posix(),'source':'scripts/create_troubleshooting_models.py','source_sha256':sha(ROOT/'scripts/create_troubleshooting_models.py'),'sha256':sha(glb),'bytes':glb.stat().st_size})

# Promote the previously reviewed generated sink and flash examples without visual edits.
for source,name in [(ROOT/'output/troubleshooting-visual-review/sink-mark-example.png','sink'),(ROOT/'assets/flash-example.png','flash')]:
    target=ART/'images'/(name+'.png')
    if not target.exists():shutil.copyfile(source,target)
for image in sorted({case['image'] for entry in spec['entries'] for case in entry['cases'] if case.get('image')}):
    pack(ART/'images'/(image+'.png'),DEST/(image+'-example.webp'),(1200,800),88)

for entry in spec['entries']:
    case=entry['cases'][0]
    image=DEST/(case['image']+'-example.webp') if case.get('image') else DEST/(entry['family']+'-'+case['state']+('_section' if case.get('default_section') else '_full')+'.webp')
    pack(image,DEST/(entry['kb_id']+'-thumb.webp'),(360,240),82)

cases=[(entry,case) for entry in spec['entries'] for case in entry['cases']]
sheet=Image.new('RGB',(1200,5*198),'#f5f1e8');draw=ImageDraw.Draw(sheet)
for i,(entry,case) in enumerate(cases):
    path=DEST/(entry['family']+'-'+case['state']+('_section' if case.get('default_section') else '_full')+'.webp')
    with Image.open(path) as im:im.thumbnail((240,160));sheet.paste(im,(i%5*240,i//5*198+28))
    draw.text((i%5*240+8,i//5*198+7),case['id'],fill='#203b28')
(ROOT/'docs/verification').mkdir(parents=True,exist_ok=True)
sheet.save(ROOT/'docs/verification/troubleshooting-models.webp',quality=90)
(DEST/'manifest.json').write_text(json.dumps({'version':spec['version'],'representation':'educational imagery and geometry; no measured samples or process predictions','files':records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('TROUBLE_ASSETS_PACKED',len(records),sum(r['bytes'] for r in records),'bytes')
