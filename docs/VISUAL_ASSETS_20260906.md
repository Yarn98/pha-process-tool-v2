# 시각자료 제작 — 2026-09-06

현재 앱에는 Blender 설비 PNG **총 8종**과 생성 플래시 형상 1종을 사용합니다. 아래에는 최초 6종과 후속 2종의 제작 기록을 구분했습니다.

Blender 5.2.0 LTS background Python으로 6개 scene을 렌더했습니다. scripts/render_equipment.py를 재실행하면 재생성됩니다. PNG는 1280×640, Cycles 24 samples + denoise입니다. 회색 설비와 초록 수지 경로로 통일했습니다.

| 파일 (assets/equipment/) | 내용 |
|---|---|
| injection.png | 가소화부·노즐·금형·형체부·수지 |
| extrusion.png | 대표 스트랜드 냉각·펠릿 절단 |
| sheet.png | 평다이·3롤 스택·시트 |
| blownfilm.png | 환형 다이·버블·닙롤·권취 |
| blowmolding.png | 헤드·패리슨·금형·중공 제품 |
| castfilm.png | 평다이·칠롤·필름·권취 |
| pha-equipment.blend | 6개 scene 편집 원본; 웹 배포 제외 |

설비 배치와 형상은 개념도입니다. 치수·스크류 설계·충전 해석·실제 특정 장비를 나타내지 않습니다. 각 단계에 KO/EN 관찰 항목·제어 변수 설명을 연결했습니다.

assets/flash-example.png는 내장 image_gen 도구로 생성한 1536×1024 PNG입니다. 트레이 파팅라인 밖의 얇은 수지를 보여주는 설명용이며 실측 불량 또는 원인 증거가 아닙니다. 그림에 문자를 넣지 않고 별도 HTML 캡션·대체 텍스트로 번역합니다.

최종 생성 프롬프트:

> Use case: scientific-educational. Create a single high-quality macro product photograph for an educational polymer processing app showing a pale sage green injection-moulded shallow rectangular tray, about palm sized, on a warm ivory seamless studio background. The rim has a clearly visible thin feather-like excess film of the SAME green polymer extending outside one section of the parting-line edge, a realistic example of moulding flash. Thick smooth tray wall and delicate thin excess fin must be distinct, no cracks, no burns, no holes. Three-quarter close-up view, soft even studio lighting, credible matte bioplastic material and sharp edge detail. One physical object in one continuous image, no collage, no split screen, no labels, no text, no logos, no arrows, no UI. Landscape composition with some breathing room. This is a conceptual defect illustration, not a photo of a tested PHA material or evidence of any process cause.

생성 원본을 프로젝트로 복사했습니다. 웹앱 실행에는 Blender나 이미지 생성 API가 필요하지 않습니다.

## 전체 가공 검토 추가

- `compounding.png`: 두 스크류의 개념 단면·상류/사이드 공급·벤트·다이·펠릿 절단.
- `straw.png`: 환형 다이·수조·인취·절단과 중공 스트로 형상.
- `pha-guides.blend`: 위 두 장면의 편집 원본. 기존 `pha-equipment.blend`는 보존했습니다.
- 두 PNG를 1280×640로 렌더한 뒤 직접 확인했습니다. 각각 가이드의 한영 캡션·대체 텍스트와 연결했습니다.

추가 두 장면만 재생성:

```powershell
blender --background --factory-startup --python scripts/render_equipment.py -- compounding straw
```

인자 없이 재실행하면 전체 8개 장면을 생성합니다. 모든 도형은 기능과 흐름을 설명하는 개념도이며 실제 스크류 간극·수조 치수·열전달 성능을 나타내지 않습니다.
