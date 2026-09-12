# Equipment study: Unreal images and web operation

## Design contract

Visual thesis: a quiet equipment inspection bench, with a large readable cutaway and controls immediately beside or below it. Keep the existing warm PHA interface; use dark studio lighting only inside the equipment photograph.

Content plan: keep the process explanation and interactive line first; add an explicit “Unreal detail” view, a concise description of the visible mechanisms, and a collapsible calculator for motion quantities. Labels and units remain Korean/English. Avoid adding another application or streaming service.

Interaction thesis: manual axes keep their existing interlocks; selected constant-rate rotation shows the effect of RPM on the actual model; switching image/3D pauses movement and preserves the inspection state. Reduced motion, keyboard use, mobile scrolling and offline use remain supported.

## Coverage and review

| Equipment | Image subject | Inspection and calculation |
| --- | --- | --- |
| Injection | Screw, barrel, clamp and open cavity | Screw RPM and axial stroke / velocity → travel time; mold/ejector interlocks retained |
| Extrusion | Single screw, strand bath, puller, pelletizer | Line speed / roller diameter → RPM; speed / cut pitch → cuts per minute |
| Sheet | Flat die and three-roll upstack example | Cooling roll and winding RPM from diameter and line speed |
| Cast film | Flat die, air gap, chill roll and winder | Chill roll and winding RPM from diameter and line speed |
| Blown film | Annular die, air ring, bubble, nip and winder | Nip/winding RPM; existing mass-balance thickness calculation stays authoritative |
| Blow molding | Parison, split mold, blow pin and bottle | Mold stroke / velocity → one-way travel time; pin and inflation interlocks retained |
| Compounding | Co-rotating screws, side feeder, vent, bath, pelletizer | Screw RPM, puller RPM and cutting frequency; no mixing-quality prediction |
| Straw | Reused Unreal annular-die study from Straw Optimizer v2 | Existing full-line model retained; line speed / finished length → cutting rate |

The models depict example equipment arrangements. They are not dimensioned OEM drawings. Water/guards use cutaway or transparent illustration; flow markers indicate direction, not a solved velocity field. A three-roll upstack is one sheet layout, and the blow-molding rig is extrusion blow molding. Other production layouts require separate geometry and evidence.

## Reuse and reproduction

Source repository: `D:\My_PJT\Application\straw-optimizer-v2`, user-selected task `01a072b6-2784-7172-903c-201486003681`, commit `8d4459dcbb3392b0535f438448327b87343c7d55`. Its completed annular-die Unreal image is copied byte-for-byte. The focused asset manifest records the exact source commit and SHA-256. The source repository remains unchanged.

The Blender → FBX → Unreal DX12/Lumen workflow adapts `scripts/blender/export-die.py`, `scripts/unreal/render-die.py` and `render-die.ps1` from that repository. The seven other equipment images use this project's existing editable Blender rigs. Web controls use the existing local Three.js build, independently of Unreal.

Rebuild FBX with Blender's Python runner and `scripts/unreal/export-equipment.py`; then run `scripts/unreal/render-equipment.ps1`, followed by `scripts/unreal/pack-renders.py`. Unreal Content, DerivedDataCache, Intermediate, Saved and exported FBX are local reproducible build output. Only the small WebP images, source recipes and evidence manifests belong to the web deliverable.

Motion calculations use explicit units and ideal kinematics: angular velocity = 6 × RPM (degrees/s); roll RPM = 1000 × line speed / (π × diameter); cuts/min = 1000 × line speed / cut pitch; one-way stroke time = stroke / velocity. Examples are illustrative user-editable inputs, not recommended production conditions. A fixed diameter assumes no roll buildup; cutting rate is per strand/lane, not total throughput. The pelletizer has four edges and the straw cutter one. Smaller sheet/cast-film guide rolls use the authored radius ratios (0.46/0.29 and 0.70/0.29) to preserve the same illustrated surface speed; these ratios are not measured OEM dimensions. Other mechanisms remain paused during the selected motion study.

All eight delivered images are 1600×900. Their combined WebP payload is **409,462 bytes** (~400 KiB). Seven new stills were rendered with Blender **5.2.1 LTS** exports and Unreal **5.8.2-56702186+++UE5+Release-5.8**, DX12/Lumen. `assets/equipment/unreal/manifest.json` records export frames, source/FBX/image hashes and the unmodified Straw reuse. `output/unreal/contact-sheet.webp` shows all eight images for review.

The batch uses a separate, hidden PHAEquipment editor process. A Slate callback re-entry issue found during the first batch was fixed with a callback guard; the full seven-image batch then completed. Existing user editors and the Straw project were left running/unchanged. Screenshot capture removes only its own prior output so an unsuccessful new capture cannot be mistaken for a successful old render.

## Validation

Validated on the deployment build (`PHA_TEST_ROOT=dist`):

- `npm run test:study`: **13 groups passed**. All eight actual image decodes, pause on image view, measured GLB quaternion vs RPM/time, zero RPM, blank/invalid input, straw cutting rate, primary/guide roll surface-speed ratio, injection and mold one-way travel, KO/EN state retention, 390px mobile layout, all-eight offline reload, GLB failure and WebGL context loss. Evidence: `output/playwright/equipment-study/report.json` and 16 captured views.
- `npm run test:equipment`: **12 groups passed**, including seven rigs, native tracks and world transforms, bottle morph and pin/clamp interlocks, mobile controls, keyboard, offline and bounded renderer cache.
- `npm run test:motion`: **12 groups passed**, including injection/Flash reuse, cavity filling, manual interlocks, reduced motion and offline fallback.
- `npm run test:ui`: **22 groups passed**, including 32 KO/EN desktop/mobile process/guide views, preserved records/measurements, manufacturer scopes and My AI calculation parity.
- `npm run test:kinematics`: **4 unit tests passed**; `npm run test:process`: **9 passed**; `npm run check:kb`: **16 entries agree**; `npm run test:myai`: **smoke passed**. Zero RPM and zero stroke leave the selected mechanism stationary.
- All eight Unreal images were visually inspected. The mobile floating save/navigation overlap found in the new calculator was corrected; those overlays are hidden while an equipment study is open. Small-screen 3D remains visible above the calculation fields.

Cache generation is `pha-cache-v21-unreal-equipment`. Build output contains local WebP/GLB/JS only, with editable Blender/Unreal projects, FBX, caches and logs excluded. Reviewed material/TARS conditions, measured values and production records were not changed by motion calculations. Production deployment status is separate from the Git push result.

The production build was exercised with isolated temporary browser-test servers. Starting a persistent local preview server was rejected by automatic approval policy, so the review deliverables are the contact sheet and captured browser views. The versioned deliverable contains the source recipes, checks, images and provenance; `dist/` is reproduced with `npm run build`.
