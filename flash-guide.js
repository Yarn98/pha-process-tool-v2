/* Source-linked flash guidance. Choices explain observations; no machine setpoints are predicted. */
(function (global) {
  'use strict';
  const V = '?v=34', ASSET = './assets/flash-control/';
  const state = { location: 'unknown', timing: 'unknown', thermal: 'none', progress: .82, opening: .55, onset: 'fill', normal: false, modelOpen: false };
  const trial = { checks: new Set(), baseline: '', change: '', observed: '' };
  let lang = 'ko', viewer = null, loading = false, failed = false, generation = 0, playing = false, raf = 0, lastTime = 0;
  let visibilityObserver;
  const data = () => global.PHAFlashGuideData;
  const text = value => typeof value === 'string' ? value : (value?.[lang] || value?.ko || '');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = (ko, en) => lang === 'ko' ? ko : en;
  const el = id => document.getElementById(id);
  const locations = () => [['parting', t('금형 맞댐면', 'Parting line')], ['vent', t('금형 배기 홈', 'Mold vent')], ['ejector', t('이젝터 핀 둘레', 'Around ejector pin')], ['unknown', t('아직 모름', 'Not sure')]];
  const timings = () => [['unknown', t('아직 비교 안 함', 'Not compared yet')], ['fill', t('충전 중부터', 'From filling onward')], ['pack', t('보압을 적용했을 때', 'With packing applied')]];
  const labelOf = (items, id) => items.find(item => item[0] === id)?.[1] || id;
  function routeIds(selection = state) {
    const ids = [];
    if (selection.location === 'vent' || selection.location === 'ejector') ids.push(selection.location);
    if (selection.timing === 'unknown') ids.push('inspect');
    else if (selection.timing === 'fill') ids.push('fill');
    else if (selection.timing === 'pack') ids.push('pack');
    if (selection.location === 'parting') ids.push('parting');
    if (selection.thermal === 'heat' || selection.thermal === 'resistance') ids.push(selection.thermal);
    return [...new Set(ids.length ? ids : ['inspect'])];
  }
  function sourceLinks(ids) {
    return `<p class="fg-sources">${esc(t('근거', 'Evidence'))}: ${(ids || []).map(id => {
      const s = data().sources[id];
      return s && /^https:\/\//.test(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(text(s.title))}</a>` : '';
    }).join(' · ')}</p>`;
  }
  function routeBody(route, compact = false) {
    return `<p class="fg-when">${esc(text(route.when))}</p><dl class="fg-actions">${[
      [t('먼저 확인', 'Check first'), route.check], [t('조건이 맞을 때 조치', 'Act when conditions are met'), route.action],
      [t('다시 확인', 'Re-check'), route.verify], ...(!compact ? [[t('중단·복귀 기준', 'Stop/revert criteria'), route.stop]] : [])
    ].map(([title, value]) => `<div><dt>${esc(title)}</dt><dd>${esc(text(value))}</dd></div>`).join('')}</dl>${sourceLinks(route.sources)}`;
  }
  function results() {
    return routeIds().map((id, index) => {
      const route = data().routes.find(item => item.id === id);
      return route ? `<article class="fg-route" data-route="${id}"><h4><span>${index + 1}</span> ${esc(text(route.title))}</h4>${routeBody(route)}</article>` : '';
    }).join('');
  }
  const jump = (index, title) => `<button type="button" data-fg-tab="${index}">${esc(title)} <span aria-hidden="true">↗</span></button>`;
  function choices(name, options, selected) {
    return `<div class="fg-choices">${options.map(([value, title]) => `<button type="button" data-fg-choice="${name}" data-value="${value}" aria-pressed="${selected === value}">${esc(title)}</button>`).join('')}</div>`;
  }
  function model() {
    return `<details class="fg-model" id="fg-model-details" ${state.modelOpen ? 'open' : ''}><summary>${esc(t('3D로 금형 틈·수지 흐름 살펴보기', 'Explore the mold gap and resin in 3D'))}</summary>
      <p class="fg-caption">${esc(t('회색은 금형, 초록은 제품, 주황은 틈으로 나온 수지입니다. 금형 열기는 내부 관찰용이며 실제 압력으로 벌어진 양이 아닙니다.', 'Gray: mold. Green: part. Orange: resin escaping a gap. Opening separates the mold for inspection; it is not pressure-induced deflection.'))}</p>
      <div class="fg-model-grid"><div><div class="fg-canvas" id="fg-canvas"><img id="fg-poster" src="${ASSET}parting.webp${V}" alt="${esc(t('금형 단면과 맞댐면의 플래시를 보여주는 Blender 모형', 'Blender cutaway showing mold and parting-line flash'))}"></div><p id="fg-model-status" class="fg-caption" role="status"></p></div>
      <div class="fg-model-controls"><label class="fg-toggle"><input id="fg-normal" type="checkbox" ${state.normal ? 'checked' : ''}>${esc(t('정상 형상과 비교', 'Compare with a clean part'))}</label>
        <label for="fg-onset">${esc(t('모형의 발생 시점 예시', 'Illustrated onset'))}</label><select id="fg-onset"><option value="fill" ${state.onset === 'fill' ? 'selected' : ''}>${esc(t('충전 중 누출', 'Leak during filling'))}</option><option value="pack" ${state.onset === 'pack' ? 'selected' : ''}>${esc(t('보압 중 누출', 'Leak during packing'))}</option></select>
        <label for="fg-progress">${esc(t('충전 → 보압', 'Filling → packing'))} <output id="fg-phase-label"></output></label><input class="fg-motion-input" id="fg-progress" type="range" min="0" max="100" step="1" value="${Math.round(state.progress * 100)}">
        <label for="fg-opening">${esc(t('금형 펼쳐 보기 · 모형', 'Mold open view · model'))} <output id="fg-opening-label">${Math.round(state.opening * 100)}%</output></label><input class="fg-motion-input" id="fg-opening" type="range" min="0" max="100" step="1" value="${Math.round(state.opening * 100)}">
        <div class="fg-tools"><button type="button" id="fg-play">${esc(t('동작 재생', 'Play motion'))}</button><button type="button" data-fg-camera="reset">${esc(t('시점 초기화', 'Reset view'))}</button><button type="button" data-fg-camera="detail">${esc(t('틈 확대해 보기', 'Inspect gap'))}</button><button type="button" data-fg-camera="left" aria-label="${esc(t('왼쪽으로 회전', 'Orbit left'))}">↶</button><button type="button" data-fg-camera="right" aria-label="${esc(t('오른쪽으로 회전', 'Orbit right'))}">↷</button></div>
        <p class="fg-caption">${esc(t('단계와 틈 두께는 이해를 위한 과장 표현입니다. 진행률은 시간·충전 체적·유동 해석값이 아니며 선택만으로 실제 원인을 판정하지 않습니다.', 'Stages and gap thickness are illustrative and exaggerated. Progress is not time, filled volume or a flow simulation; selections do not establish the real cause.'))}</p>
      </div></div></details>`;
  }
  function overview() {
    return `<div class="fg-guide"><header class="fg-heading"><p class="fg-eyebrow">FLASH / ${esc(t('관찰부터 해결까지', 'From observation to resolution'))}</p><h3>${esc(t('얇은 수지막, 어디서 시작됐나요?', 'Where did the thin fringe start?'))}</h3><p>${esc(t('플래시(버)는 금형 틈으로 나온 얇은 수지입니다. 위치와 발생 시점을 나누면 먼저 확인할 원인이 좁혀집니다.', 'Flash is a thin layer of resin escaping through a mold gap. Location and onset help narrow the first checks.'))}</p></header>
      <div class="fg-overview"><figure class="fg-comparison"><button type="button" id="fg-image-open" aria-label="${esc(t('정상·플래시 예시 확대', 'Enlarge clean and flashed examples'))}"><img src="${ASSET}flash-comparison.png${V}" alt="${esc(t('왼쪽 정상 트레이, 오른쪽 금형 맞댐면에 얇은 수지막이 생긴 트레이', 'Clean tray on left; thin parting-line flash on the tray at right'))}"></button><figcaption><span>${esc(t('정상 가장자리', 'Clean edge'))}</span><span>${esc(t('얇게 삐져나온 플래시', 'Thin escaped resin'))}</span></figcaption><p class="fg-caption">${esc(t('이해를 위한 생성 이미지 · 실제 불량 샘플이나 치수 기준이 아닙니다. 클릭하면 확대됩니다.', 'Generated illustration, not a measured sample or dimensional reference. Select to enlarge.'))}</p></figure>
      <div class="fg-observe"><fieldset><legend>01 · ${esc(t('어디에 생겼나요?', 'Where is it?'))}</legend>${choices('location', locations(), state.location)}</fieldset><fieldset><legend>02 · ${esc(t('언제부터 보였나요?', 'When does it appear?'))}</legend>${choices('timing', timings(), state.timing)}</fieldset>
        <label for="fg-thermal">${esc(t('함께 나타난 징후', 'Accompanying observation'))}</label><select id="fg-thermal"><option value="none">${esc(t('모름 / 뚜렷한 변화 없음', 'Unknown / no clear change'))}</option><option value="heat">${esc(t('변색·냄새·점도 저하 의심', 'Discoloration / odor / viscosity loss'))}</option><option value="resistance">${esc(t('미충전·높은 충전 저항', 'Short filling / high flow resistance'))}</option></select><p class="fg-caption">${esc(t('조건을 바꾸기 전에 양품 기준과 실제 압력 기준을 기록하세요.', 'Record the acceptance criteria and actual pressure basis before changing a condition.'))}</p>
      </div></div>
      ${model()}<div class="fg-result-heading"><h3>03 · ${esc(t('지금 확인할 순서', 'Checks for these observations'))}</h3><span>${esc(t('확정 진단이 아닌 조건부 점검', 'Conditional checks, not a confirmed diagnosis'))}</span></div><div id="fg-results" aria-live="polite">${results()}</div>
      <nav class="fg-next">${jump(1, t('시험 순서 자세히', 'Trial sequence'))}${jump(4, t('체크하고 기록하기', 'Check and record'))}${jump(2, t('형체력·압력 계산', 'Force and pressure tools'))}</nav></div>`;
  }
  function sequence() {
    const items = [
      [t('금형과 기준 조건', 'Mold and baseline'), t('같은 위치에 반복되면 맞댐면·벤트·핀 손상부터 확인합니다. 재료 lot, 건조, 중량·치수, 쿠션과 압력 기준을 남깁니다.', 'Repeated local flash calls for inspection of parting surfaces, vents and pins. Record material lot, drying, mass, dimensions, cushion and pressure basis.'), 'parting'],
      [t('충전만 비교', 'Compare fill-only parts'), t('담당자 절차에 따라 보압 영향을 분리한 충전 시험을 합니다. 미충전 상태에서도 플래시가 보이는지 확인합니다. 고정된 충전율을 모든 제품에 적용하지 않습니다.', 'Use the approved fill-only procedure to separate packing influence. Check whether flash exists while filling is incomplete. Do not apply one fill-percentage target to every product.'), 'inspect'],
      [t('발생 단계만 조정', 'Adjust the relevant stage'), t('충전 중이면 V/P 전환과 말단 압력 피크를, 보압 후이면 보압 전달과 게이트 고화를 점검합니다. 한 번에 한 변수만 바꾸고 비교합니다.', 'During filling, inspect V/P transfer and the end-of-fill pressure peak. After packing, inspect pressure transmission and gate seal. Change one variable at a time.'), 'fill'],
      [t('제품과 공정 재확인', 'Verify product and process'), t('플래시만 줄었다고 완료하지 않습니다. 미충전·싱크·버닝, 중량·치수·조립성, 압력·쿠션 반복성과 열 이력을 함께 확인합니다.', 'Do not stop at less flash. Check short shots, sinks, burns, mass, dimensions, fit, pressure/cushion repeatability and thermal history.'), 'pack']
    ];
    return `<div class="fg-guide"><header class="fg-heading"><h3>${esc(t('한 번에 하나씩, 원인이 있는 단계부터', 'One variable at a time, at the relevant stage'))}</h3><p>${esc(t('설정값을 일괄 낮추거나 높이지 말고, 관찰 → 확인 → 조정 → 재확인을 연결합니다.', 'Connect the observation to a check, a justified adjustment and a verification.'))}</p></header><ol class="fg-sequence">${items.map(([title, body, id], i) => `<li><span class="fg-number">0${i + 1}</span><div><h4>${esc(title)}</h4><p>${esc(body)}</p>${sourceLinks(data().routes.find(r => r.id === id)?.sources)}</div></li>`).join('')}</ol>
      <div class="fg-split">${['heat', 'resistance'].map(id => { const r = data().routes.find(r => r.id === id); return `<article class="fg-route"><h4>${esc(text(r.title))}</h4>${routeBody(r)}</article>`; }).join('')}</div><nav class="fg-next">${jump(0, t('내 증상으로 돌아가기', 'Return to my observations'))}${jump(4, t('시험 체크리스트', 'Trial checklist'))}</nav></div>`;
  }
  function checklist() {
    return `<div class="fg-guide"><header class="fg-heading"><h3>${esc(t('바꾸기 전과 바꾼 뒤를 남기세요', 'Record the before and after'))}</h3><p>${esc(t('체크는 확인 메모입니다. 양품·설비 적합성을 자동 판정하지 않습니다.', 'Checks record your review; they do not automatically qualify the product or equipment.'))}</p></header><div class="fg-checklist">${data().checklist.map(item => `<label><input type="checkbox" data-fg-check="${esc(item.id)}" ${trial.checks.has(item.id) ? 'checked' : ''}><span>${esc(text(item.text))}</span></label>`).join('')}</div><div class="fg-trial"><label for="fg-baseline">${esc(t('기준 조건·양품 판정 기준', 'Baseline and acceptance criteria'))}</label><textarea id="fg-baseline" data-fg-note="baseline" rows="3">${esc(trial.baseline)}</textarea><label for="fg-change">${esc(t('이번에 바꿀 한 가지와 이유', 'One change and its reason'))}</label><textarea id="fg-change" data-fg-note="change" rows="3">${esc(trial.change)}</textarea><label for="fg-observed">${esc(t('결과·부작용·복귀 여부', 'Result, side effects and revert decision'))}</label><textarea id="fg-observed" data-fg-note="observed" rows="3">${esc(trial.observed)}</textarea><p class="fg-caption">${esc(t('작성 중 내용은 언어·탭 전환 시 유지됩니다. 새로고침 전에 시험 메모를 파일로 저장하거나 공정 로그에 남기세요.', 'Drafts survive language and tab changes. Before reloading, save the trial note to a file or enter it in the process log.'))}</p><div class="fg-next"><button type="button" id="fg-download">${esc(t('시험 메모 파일 저장', 'Download trial note'))}</button>${jump(6, t('공정 로그 열기', 'Open process log'))}</div></div></div>`;
  }
  function library() {
    return `<div class="fg-guide"><header class="fg-heading"><h3>${esc(t('원인별 확인·조치·재검사', 'Checks, actions and verification by cause'))}</h3><p>${esc(t('증거가 맞는 항목을 펼치세요. 여러 원인이 함께 존재할 수 있습니다.', 'Expand the route that matches the evidence. Causes can coexist.'))}</p></header>${data().routes.map(r => `<details class="fg-reference" data-fg-route-detail="${r.id}"><summary>${esc(text(r.title))}</summary>${routeBody(r)}</details>`).join('')}<nav class="fg-next">${jump(0, t('위치·시점으로 좁히기', 'Narrow by location and onset'))}</nav></div>`;
  }
  function references() {
    return `<div class="fg-guide"><header class="fg-heading"><h3>${esc(t('근거와 적용 범위를 같이 확인하세요', 'Check evidence and its scope together'))}</h3><p>${esc(t('제조사 일반 원리와 PHA 개별 그레이드 자료를 구분합니다. 특정 설비·배합의 생산 성공을 보장하는 레시피는 아닙니다.', 'General molding principles and PHA grade documents have different scopes. These are not guaranteed recipes for a particular machine or formulation.'))}</p></header><div class="fg-grade-notes">${data().gradeNotes.map(item => `<article class="fg-route"><h4>${esc(text(item.title))}</h4><p>${esc(text(item.text))}</p>${sourceLinks(item.sources)}</article>`).join('')}</div><h4 class="fg-section-title">${esc(t('헷갈리기 쉬운 용어', 'Terms at a glance'))}</h4><dl class="fg-glossary">${data().glossary.map(item => `<div><dt>${esc(text(item.term))}</dt><dd>${esc(text(item.definition))}</dd></div>`).join('')}</dl>
      <h4 class="fg-section-title">${esc(t('원문 자료', 'Primary documents'))}</h4><p class="fg-caption">${esc(t('검토일', 'Reviewed'))}: ${esc(data().reviewed)}</p><ul class="fg-source-list">${Object.values(data().sources).map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(text(s.title))}</a><p>${esc(text(s.scope))}</p></li>`).join('')}</ul>
      <details class="fg-reference"><summary>${esc(t('계산기·로그·오프라인 사용법', 'Using calculations, logs and offline access'))}</summary><p>${esc(t('계산 도구는 입력값을 환산합니다. 캐비티 평균압력을 사출기 유압·노즐 수지압으로 입력하지 마세요. 보압 비율은 직접 정한 값을 환산할 뿐, 적정값을 자동 추천하지 않습니다.', 'Calculators convert entered values. Mean cavity pressure is not a hydraulic or nozzle pressure setting. Packing ratios are user inputs, not automatic recommendations.'))}</p><p>${esc(t('공정 로그의 저장 데이터는 이 기기의 브라우저에 남습니다. CSV로 백업하세요. 배치 이벤트는 시작된 배치에서 기록하며 종료한 배치는 잠깁니다. 페이지와 자료가 한 번 정상 로드된 뒤에는 오프라인으로 다시 열 수 있습니다.', 'Process logs are stored in this browser on this device; back up with CSV. Batch events require a running batch; finalized batches are locked. After the page and its assets load successfully, the cached app can reopen offline.'))}</p><p>${esc(t('3D가 실행되지 않으면 Blender 대체 이미지와 설명을 사용하세요. 금형 틈·수지 이동은 이해용 표현이며 압력·온도·불량 크기를 계산하지 않습니다.', 'If 3D is unavailable, use the Blender posters and guidance. Mold gaps and resin motion are illustrative; they do not calculate pressure, temperature or defect size.'))}</p></details></div>`;
  }
  function template(locale, key) {
    if (!data()) return undefined;
    lang = locale === 'en' ? 'en' : 'ko';
    const renderers = { t0: overview, t1: sequence, t4: checklist, t5: library, t7: references };
    return renderers[key]?.();
  }
  function active() { return !!el('flash')?.classList.contains('active') && !!el('flash-tab-0')?.classList.contains('active') && !!el('fg-model-details')?.open && !document.hidden; }
  function stop() { playing = false; cancelAnimationFrame(raf); raf = 0; lastTime = 0; if (el('fg-play')) el('fg-play').textContent = t('동작 재생', 'Play motion'); }
  function updateModel() {
    const group = state.normal ? 'normal' : (['parting', 'vent', 'ejector'].includes(state.location) ? state.location : 'parting');
    if (el('fg-poster')) { const url = `${ASSET}${group}.webp${V}`; if (el('fg-poster').getAttribute('src') !== url) el('fg-poster').src = url; el('fg-poster').alt = `${labelOf(locations(), state.location)} · ${state.normal ? t('정상 비교', 'Clean comparison') : t('플래시 단면', 'Flash cutaway')}`; }
    if (el('fg-phase-label')) el('fg-phase-label').textContent = state.progress < .65 ? t('충전', 'Filling') : t('보압', 'Packing');
    if (el('fg-progress')) el('fg-progress').value = String(Math.round(state.progress * 100));
    if (el('fg-opening-label')) el('fg-opening-label').textContent = `${Math.round(state.opening * 100)}%`;
    if (viewer?.model) { if (viewer.group !== group) viewer.select(group); viewer.setState({ progress: state.progress, opening: state.opening, onset: state.onset }); }
  }
  async function loadModel() {
    if (viewer || loading || failed || !active()) return;
    const current = generation, host = el('fg-canvas'); loading = true;
    el('fg-model-status').textContent = t('3D 모형 불러오는 중…', 'Loading 3D model…');
    let instance;
    try {
      const { FlashMoldViewer } = await import('./flash-mold-viewer.js' + V);
      if (current !== generation) return;
      instance = new FlashMoldViewer(host);
      await instance.load(ASSET + 'mold-detail.glb' + V);
      if (current !== generation) { instance.dispose(); return; }
      viewer = instance; viewer.active = active(); updateModel(); viewer.frame();
      host.classList.add('fg-ready');
      el('fg-model-status').textContent = t('드래그 회전 · 두 손가락 확대 · 슬라이더로 동작 조작', 'Drag to orbit · pinch to zoom · move the sliders to inspect');
    } catch (_) {
      instance?.dispose();
      if (current !== generation) return;
      failed = true; viewer = null;
      el('fg-model-status').textContent = t('3D를 열 수 없어 Blender 이미지로 표시합니다. 위치를 바꾸면 해당 단면을 볼 수 있습니다.', '3D is unavailable. Blender posters remain available; change the location to inspect another cutaway.');
      document.querySelectorAll('#fg-model-details .fg-motion-input, #fg-model-details [data-fg-camera], #fg-play, #fg-onset').forEach(node => { node.disabled = true; });
    } finally { if (current === generation) loading = false; }
  }
  function tick(now) {
    if (!playing || !active() || !viewer) { stop(); return; }
    const delta = lastTime ? Math.min((now - lastTime) / 1000, .1) : 0; lastTime = now;
    state.progress = (state.progress + delta / 8) % 1; updateModel(); raf = requestAnimationFrame(tick);
  }
  function syncSurface() {
    if (viewer) { viewer.active = active(); if (viewer.active) { viewer.resize(); viewer.draw(); } }
    if (!active()) stop(); else loadModel();
  }
  function trialText() {
    return [t('PHA 플래시 시험 메모', 'PHA flash trial note'), new Date().toISOString(), `${t('위치', 'Location')}: ${labelOf(locations(), state.location)}`, `${t('시점', 'Onset')}: ${labelOf(timings(), state.timing)}`,
      ...data().checklist.map(item => `${trial.checks.has(item.id) ? '[x]' : '[ ]'} ${text(item.text)}`),
      `${t('기준 조건·판정 기준', 'Baseline / acceptance')}: ${trial.baseline}`, `${t('한 가지 변경', 'One change')}: ${trial.change}`, `${t('결과·복귀', 'Outcome / revert')}: ${trial.observed}`,
      t('작성자의 시험 메모이며 자동 양품 판정이 아닙니다.', 'Operator trial note; not an automatic qualification.')].join('\n\n');
  }
  function mount(locale) {
    if (!data()) return;
    generation++; stop(); viewer?.dispose(); viewer = null; loading = false; failed = false; visibilityObserver?.disconnect();
    lang = locale === 'en' ? 'en' : 'ko';
    document.querySelectorAll('#flash [data-fg-tab]').forEach(button => button.addEventListener('click', () => global.showFlashTab(Number(button.dataset.fgTab))));
    document.querySelectorAll('#flash [data-fg-choice]').forEach(button => button.addEventListener('click', () => {
      state[button.dataset.fgChoice] = button.dataset.value;
      document.querySelectorAll(`#flash [data-fg-choice="${button.dataset.fgChoice}"]`).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      if (state.timing !== 'unknown') state.onset = state.timing;
      if (el('fg-onset')) el('fg-onset').value = state.onset;
      el('fg-results').innerHTML = results(); updateModel();
    }));
    if (el('fg-thermal')) { el('fg-thermal').value = state.thermal; el('fg-thermal').addEventListener('change', event => { state.thermal = event.target.value; el('fg-results').innerHTML = results(); }); }
    el('fg-model-details')?.addEventListener('toggle', () => { state.modelOpen = el('fg-model-details').open; syncSurface(); });
    el('fg-normal')?.addEventListener('change', event => { state.normal = event.target.checked; updateModel(); });
    el('fg-onset')?.addEventListener('change', event => { state.onset = event.target.value; updateModel(); });
    for (const key of ['progress', 'opening']) el('fg-' + key)?.addEventListener('input', event => { stop(); state[key] = Number(event.target.value) / 100; updateModel(); });
    el('fg-play')?.addEventListener('click', async () => { if (playing) { stop(); return; } await loadModel(); if (!viewer || !active()) return; playing = true; el('fg-play').textContent = t('일시정지', 'Pause'); raf = requestAnimationFrame(tick); });
    document.querySelectorAll('#flash [data-fg-camera]').forEach(button => button.addEventListener('click', () => viewer?.cameraAction(button.dataset.fgCamera)));
    document.querySelectorAll('#flash [data-fg-check]').forEach(input => input.addEventListener('change', () => { if (input.checked) trial.checks.add(input.dataset.fgCheck); else trial.checks.delete(input.dataset.fgCheck); }));
    document.querySelectorAll('#flash [data-fg-note]').forEach(input => input.addEventListener('input', () => { trial[input.dataset.fgNote] = input.value; }));
    el('fg-download')?.addEventListener('click', () => { const url = URL.createObjectURL(new Blob(['\uFEFF' + trialText()], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'PHA-flash-trial-' + new Date().toISOString().slice(0, 10) + '.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
    el('fg-image-open')?.addEventListener('click', () => {
      const dialog = document.createElement('dialog'); dialog.className = 'fg-image-dialog';
      dialog.innerHTML = `<button type="button">${esc(t('닫기', 'Close'))} ×</button><img src="${ASSET}flash-comparison.png${V}" alt="${esc(t('정상 가장자리와 플래시 비교 생성 이미지', 'Generated comparison of clean edge and flash'))}"><p>${esc(t('왼쪽: 정상 / 오른쪽: 금형 틈으로 나온 얇은 수지막', 'Left: clean edge / right: thin resin escaping a mold gap'))}</p>`;
      document.body.append(dialog); dialog.addEventListener('close', () => dialog.remove(), { once: true }); dialog.querySelector('button').addEventListener('click', () => dialog.close()); dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }); dialog.showModal();
    });
    visibilityObserver = new MutationObserver(syncSurface);
    for (const id of ['flash', 'flash-tab-0']) if (el(id)) visibilityObserver.observe(el(id), { attributes: true, attributeFilter: ['class'] });
    updateModel();
  }
  document.addEventListener('visibilitychange', syncSurface);
  global.PHAFlashGuide = { template, mount, syncSurface, routeIds, snapshot: () => ({ ...state, playing, failed, model: viewer?.snapshot() || null }) };
})(window);
