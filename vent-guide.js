/* Short, source-linked lessons. Selection changes teaching content, never machine settings. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const model = 'assets/troubleshooting/vent-guide.glb';
  const configuration = id => id === 'upstream_reverse' ? id : 'without_reverse';
  const poster = id => 'assets/troubleshooting/vent-guide-' + configuration(id) + '_full.webp';
  function render(lang, config, symptom) {
    const data = window.PHAVentGuideData;
    if (!data) return '';
    lang = lang === 'en' ? 'en' : 'ko';
    const text = value => escape(value?.[lang] ?? '');
    const t = (ko, en) => lang === 'ko' ? ko : en;
    const list = values => '<ul>' + values.map(value => '<li>' + text(value) + '</li>').join('') + '</ul>';
    const refs = ids => '<span class="vent-inline-sources">' + ids.map(id => {
      const source = data.sources.find(item => item.id === id);
      return source && /^https:\/\//.test(source.url) ? `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)}</a>` : '';
    }).join(' · ') + '</span>';
    config = configuration(config);
    const selected = data.symptoms.find(item => item.id === symptom) || data.symptoms[0];
    return `<div class="vent-guide" data-vent-guide-version="${escape(data.version)}">
      <div class="vent-lead"><p class="vent-eyebrow">${t('먼저 볼 핵심','Start here')}</p><h3>${text(data.title)}</h3><p>${text(data.summary)}</p></div>
      <section class="vent-lesson" aria-labelledby="ventRolesTitle"><h3 id="ventRolesTitle">${t('왜 벤트가 두 곳에 있나요?','Why are there two vent locations?')}</h3>
        <figure class="vent-layout"><button type="button" data-ts-vent-model aria-label="${t('새 두 벤트 모형을 3D로 열기','Open the new two-vent model in 3D')}"><img src="${poster(config)}?v=31" alt="${t('원료 투입, 앞쪽 대기 벤트, 용융부, 씰 구간, 뒤쪽 진공 벤트와 다이를 구분한 새 Blender 모형','Original Blender model separating feed, early atmospheric vent, melting, seal region, downstream vacuum vent and die')}" width="1600" height="960"><span>${t('모형을 눌러 3D로 보기','Select the model to view in 3D')} ↗</span></button><figcaption>${t('새로 제작한 Blender 개념 모형 · 흐름과 배치는 설명용','Original Blender teaching model · illustrative layout and flow')}</figcaption></figure>
        <div class="vent-role-grid">${data.vents.map((vent, i) => `<article><h4><span>${i + 1}</span> ${text(vent.title)}</h4><p>${text(vent.purpose)}</p><p class="vent-state"><strong>${t('이 위치의 수지','Material here')}</strong> ${text(vent.state)}</p><details><summary>${t('이 역할이 부족하면','If this function is insufficient')}</summary><p>${text(vent.if_missing)}</p>${refs(vent.source_ids)}</details></article>`).join('')}</div>
        <p class="vent-key-point">${text(data.not_universal)}</p><details class="vent-detail"><summary>${t('두 위치를 나누는 이유 더 보기','More about separating the two functions')}</summary><p>${text(data.vent_rationale)}</p></details>
      </section>
      <section class="vent-lesson" aria-labelledby="ventConfigTitle"><h3 id="ventConfigTitle">${t('역이송 유무에 따라 무엇을 보나요?','What changes with the reverse element?')}</h3><p class="vent-comparison-note">${text(data.configuration_comparison_note)}</p>
        <div class="vent-config-grid" role="group" aria-label="${t('비교할 스크류 배치','Screw layout to inspect')}">${data.configurations.map(item => `<article class="${config === item.id ? 'is-selected' : ''}"><button type="button" data-ts-vent-config="${escape(item.id)}" aria-pressed="${config === item.id}">${text(item.title)}</button><p>${text(item.summary)}</p><details><summary>${t('확인할 점과 결과 해석','Checks and interpretation')}</summary>${list(item.check)}<p>${text(item.interpretation)}</p>${refs(item.source_ids)}</details></article>`).join('')}</div>
        <button type="button" data-ts-vent-model>${t('선택한 배치를 3D로 비교','Inspect the selected layout in 3D')} →</button>
      </section>
      <section class="vent-lesson" aria-labelledby="ventSymptomTitle"><h3 id="ventSymptomTitle">${t('보이는 현상부터 고르세요','Start with what you observe')}</h3><div class="vent-symptom-options" role="group" aria-label="${t('관찰 현상','Observed symptom')}">${data.symptoms.map(item => `<button type="button" data-ts-vent-symptom="${escape(item.id)}" aria-pressed="${item.id === selected.id}" aria-controls="ventSymptomDetail">${text(item.label)}</button>`).join('')}</div>
        <div class="vent-symptom-detail" id="ventSymptomDetail" aria-live="polite"><h4>${text(selected.label)}</h4><p>${text(selected.meaning)}</p><dl><dt>${t('먼저 확인','Check first')}</dt><dd>${list(selected.checks)}</dd><dt>${t('확인되면 조정','If confirmed')}</dt><dd>${text(selected.action)}</dd><dt>${t('좋아졌다고 볼 기준','Acceptance check')}</dt><dd>${text(selected.accept)}</dd></dl>${refs(selected.source_ids)}</div>
      </section>
      <details class="vent-lesson vent-temperature"><summary>${text(data.temperature.title)}</summary><dl><dt>${t('언제 검토하나요?','When is it worth testing?')}</dt><dd>${text(data.temperature.when)}</dd><dt>${t('무엇을 고정하고 비교하나요?','What stays fixed?')}</dt><dd>${text(data.temperature.trial)}</dd><dt>${t('채택 기준','Acceptance')}</dt><dd>${text(data.temperature.accept)}</dd><dt>${t('복귀·재검토 기준','Revert and review')}</dt><dd>${text(data.temperature.revert)}</dd></dl>${refs(data.temperature.source_ids)}</details>
      <section class="vent-lesson"><h3>${t('현장에서 확인하는 순서','Order of checks')}</h3><ol class="vent-sequence">${data.sequence.map(item => `<li><strong>${text(item.title)}</strong><p>${text(item.body)}</p></li>`).join('')}</ol></section>
      <details class="vent-lesson"><summary>${t('용어를 쉬운 말로 보기','Terms in plain language')}</summary><dl>${data.terms.map(item => `<dt>${text(item.term)}</dt><dd>${text(item.meaning)}</dd>`).join('')}</dl></details>
      <details class="vent-lesson vent-evidence"><summary>${t('조사 근거·적용 범위','Research sources and scope')}</summary><p>${text(data.scope)}</p>${data.sources.filter(source => /^https:\/\//.test(source.url)).map(source => `<p><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)}</a><br>${text(source.scope)}</p>`).join('')}<p>${t('검토일','Reviewed')} ${escape(data.review_date)}</p></details>
    </div>`;
  }
  window.PHAVentGuide = {render, model, poster, configuration};
})();
