# Claude 한영 시각자료 용어 검수

사용자가 요청한 Claude 용어 검수 범위에서 새 25개 형상의 제목·한영 설명만 전달했다. 파일·계정 정보·측정 데이터는 전달하지 않았다. 원본 KB의 수치·조건을 변경하는 검토가 아니다.

## 받은 답변

Terminology second opinion on the supplied labels/captions only. Basis: the evidence text you provided; I have not read any local files or models. Corrections below; everything not listed is acceptable, including the torque-inspection wording in `feed-check` ("not diagnosed from part appearance" correctly avoids causal certainty) and the closed-skin void set (`sink-mark`, `internal-void`, `strand-bubbles`), whose sink/void distinction is correct.

**Corrections (field: exact replacement)**

1. **parison-sag** — `caption_en`: "Compare the reference parison with an elongated one. The sag shown is illustrative and is not the output of a viscosity, temperature or gravity calculation."
   Reason: current EN "Sag is not a result of viscosity, temperature or gravity simulation" reads as denying the physical causes of sag (which *are* viscosity/temperature/gravity); KO "해석 결과가 아닙니다" only disclaims a computed value.
   Also `caption_ko`: "기준 패리슨과 늘어져 길어진 패리슨을 비교합니다. …" — EN mentions a reference parison; KO omits it.

2. **unstable-release** — `caption_ko`: "…접촉·고화·결정화 상태를 확인한 뒤 조치합니다."; `caption_en`: "…Check contact, solidification and crystallization behavior before taking action."
   Reason: "고정화/fixation" is not the polymer-processing term; solidification (고화) is intended, and "fixation" is misleading in EN.

3. **straw-crack** — `caption_ko`: "…칼날·정렬·수지의 고화 상태를 함께 봅니다."; `caption_en`: "…Inspect the blade, alignment and polymer solidification state together."
   Reason: same 고정화/fixation → 고화/solidification issue.

4. **thermo-whitening** — `en`: "Local whitening during thermoforming"
   Reason: "after thermoforming" implies post-process timing not present in KO; whitening arises during draw. Keeping generic "whitening" (not "stress whitening") is correct here, since the caption properly defers the mechanism.

5. **cross-web-gauge** — `caption_ko`: "폭 방향으로 두꺼운 곳과 얇은 곳을 과장해 표현했습니다. …"
   Reason: EN says "exaggerated" but 강조 means "highlighted"; 과장 is needed to signal the magnitude is not real.

6. **warpage** — `caption_ko`: "…변형 크기는 과장한 예시이며 실제 치수 예측이 아닙니다."
   Reason: same 강조/exaggerated equivalence gap.

7. **bubble-wobble** — `en`: "Bubble centerline oscillation"
   Reason: EN drops 중심 (centerline); plain "bubble oscillation" can be read as diameter pulsation, a different instability.

8. **internal-void** (minor) — `caption_en`: "…Confirm by sectioning, and investigate shrinkage versus gas-related causes separately."
   Reason: "Open the cutaway" narrows KO's generic sectioning guidance (단면을 열어 확인) to a feature of the 3D model; keep the fix only if the caption is meant as inspection guidance for real parts rather than a model interaction hint.

**Acceptable as-is:** feed-check, gel-fisheye ("Lump defect / fisheye" is non-standard but internally consistent with the KO, which also avoids "겔"; "Gel / fisheye" would be the industry term if you want it), die-drool, roll-sticking, short-shot ("Incomplete filling" vs. the loanword "short shot" — consistent with the KO title's plain-language choice), silver-streak, parting-flash, sink-mark, thermo-crack, bubble-break, bottle-wall, neck-in, draw-resonance, straw-oval, straw-dimension, vent-flooding, strand-bubbles.

Overall the set does well at avoiding causal certainty ("appearance alone does not distinguish…", "investigate separately") and at disclaiming that the visuals are illustrative rather than measured — the parison-sag EN caption was the one place the disclaimer flipped into a misleading causal denial.

## 반영

패리슨 해석 결과 표현, 고화/solidification, 열성형 백화의 시점, 과장/강조의 번역 일치, 버블 중심선 표현을 반영한다. 내부 보이드의 ‘단면 보기’는 실제 모형 조작 안내이므로 원문을 유지한다. 새 조치 처방은 추가하지 않는다.
