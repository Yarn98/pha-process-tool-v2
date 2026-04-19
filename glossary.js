(() => {
  const STORAGE_KEY = 'pha.glossary.seen.v1';
  const TERM_ORDER = [
    'moisture',
    'hydrolysis',
    'karlFischer',
    'dewPoint',
    'kb',
    'ce',
    'kb90',
    'kb45',
    'kb30',
    'le',
    'zme',
    'residenceTime',
    'deadZone',
    'gel',
    'gateSeal',
    'vpTransfer',
    'eof',
    'shortShot',
    'flash',
    'splay',
    'sinkMark',
    'nucleatingAgent',
    'antiOxidant',
    'mw',
    'backPressure',
    'devolatilization',
    'purge'
  ];

  const GLOSSARY_PHA = {
    moisture: {
      label: { ko: '수분', en: 'Moisture' },
      gloss: {
        ko: '펠릿이 머금은 물기. 과다하면 가수분해로 분자량이 떨어지고 기포와 splay가 생깁니다.',
        en: 'Pellet-level moisture. Excess moisture drives hydrolysis, lowers Mw, and triggers bubbles or splay.'
      },
      why: {
        ko: 'PHA/PLA는 가공 전 200 ppm 이하 건조가 기본입니다.',
        en: 'PHA/PLA should be dried below 200 ppm before processing.'
      },
      aliases: { ko: ['수분'], en: ['Moisture'] }
    },
    hydrolysis: {
      label: { ko: '가수분해', en: 'Hydrolysis' },
      gloss: {
        ko: '물 분자가 폴리머 사슬을 끊어 분자량을 낮추는 반응. 온도와 습도에 민감합니다.',
        en: 'Water-driven chain scission that lowers molecular weight. Sensitive to both temperature and humidity.'
      },
      why: {
        ko: '점도 저하와 취화의 직접 원인입니다.',
        en: 'Directly causes viscosity loss and brittleness.'
      },
      aliases: { ko: ['가수분해'], en: ['Hydrolysis'] }
    },
    karlFischer: {
      label: { ko: 'Karl Fischer / KF 수분 측정기', en: 'Karl Fischer / KF moisture meter' },
      gloss: {
        ko: '시약 적정 방식으로 수분량을 정밀 측정하는 장비입니다.',
        en: 'A titration-based instrument that measures moisture precisely.'
      },
      why: {
        ko: '감량법보다 수분 정밀도가 높습니다.',
        en: 'More accurate than loss-on-drying for low-moisture pellets.'
      },
      aliases: { ko: ['Karl Fischer', 'KF 수분 측정기', 'KF'], en: ['Karl Fischer', 'KF moisture meter', 'KF'] }
    },
    dewPoint: {
      label: { ko: '이슬점', en: 'Dew point' },
      gloss: {
        ko: '건조 공기의 건조 정도를 온도로 나타낸 값입니다.',
        en: 'The temperature reading used to express how dry the process air is.'
      },
      why: {
        ko: 'PHA 건조는 보통 -40 °C 이하 이슬점을 권장합니다.',
        en: 'PHA drying typically targets a dew point of -40 °C or lower.'
      },
      aliases: { ko: ['이슬점', 'dew point'], en: ['dew point', 'Dew point'] }
    },
    kb: {
      label: { ko: 'KB (kneading block · 혼합 블록)', en: 'KB (kneading block)' },
      gloss: {
        ko: '스크류 내부의 혼합 전용 섹션. 분산은 올라가지만 전단 발열도 함께 커집니다.',
        en: 'The screw mixing section. It improves dispersion but also increases shear heat.'
      },
      why: {
        ko: 'KB가 과하면 색변화와 열분해가 빨라집니다.',
        en: 'Too much KB raises color shift and thermal-degradation risk.'
      },
      aliases: { ko: ['KB', '혼합 블록'], en: ['KB', 'kneading block'] }
    },
    ce: {
      label: { ko: 'CE (conveying element · 전도 엘리먼트)', en: 'CE (conveying element)' },
      gloss: {
        ko: '고형 펠릿과 용융을 축 방향으로 앞으로 보내는 기본 스크류 엘리먼트입니다.',
        en: 'The base screw element that mainly conveys solids and melt forward in the axial direction.'
      },
      why: {
        ko: '혼합은 약하지만 압력 형성과 체류 시간 관리의 기준 구간이 됩니다.',
        en: 'Mixing is limited, but it sets the baseline for pressure build-up and residence-time control.'
      },
      aliases: { ko: ['CE', '전도 엘리먼트'], en: ['CE', 'conveying element', 'Conveying element'] }
    },
    kb90: {
      label: { ko: 'KB90 (혼합 블록 90°)', en: 'KB90 (kneading block 90°)' },
      gloss: {
        ko: '가장 강한 분산 혼합을 주는 KB 배열. 전단 발열도 가장 크게 올라갑니다.',
        en: 'The most aggressive KB arrangement for dispersive mixing, with the highest shear-heat penalty.'
      },
      why: {
        ko: '분산 불량에는 유리하지만 과하면 갈변과 Mw 저하가 빨라집니다.',
        en: 'Useful for poor dispersion, but too much of it accelerates browning and Mw loss.'
      },
      aliases: { ko: ['KB90', '혼합 블록 90°'], en: ['KB90', 'kneading block 90°'] }
    },
    kb45: {
      label: { ko: 'KB45 (혼합 블록 45°)', en: 'KB45 (kneading block 45°)' },
      gloss: {
        ko: '분산과 전단의 균형을 맞춘 중간 강도의 혼합 블록입니다.',
        en: 'A medium-intensity kneading block that balances dispersion against shear.'
      },
      why: {
        ko: '가장 범용적으로 쓰이는 KB 세팅입니다.',
        en: 'The most general-purpose KB setting in routine compounding.'
      },
      aliases: { ko: ['KB45', '혼합 블록 45°'], en: ['KB45', 'kneading block 45°'] }
    },
    kb30: {
      label: { ko: 'KB30 (혼합 블록 30°)', en: 'KB30 (kneading block 30°)' },
      gloss: {
        ko: '전단을 낮게 유지하면서 약한 분산만 주는 완만한 KB 배열입니다.',
        en: 'A gentle KB arrangement that keeps shear low and provides only mild dispersion.'
      },
      why: {
        ko: '열민감한 조성에서 과혼련을 피할 때 유용합니다.',
        en: 'Helpful when the formulation is heat-sensitive and over-mixing must be avoided.'
      },
      aliases: { ko: ['KB30', '혼합 블록 30°'], en: ['KB30', 'kneading block 30°'] }
    },
    le: {
      label: { ko: 'LE (left-hand element · 왼손 엘리먼트)', en: 'LE (left-hand element)' },
      gloss: {
        ko: '역류를 만들어 충전 밀도와 혼합 압력을 높이는 반대 방향 스크류 엘리먼트입니다.',
        en: 'A reverse-pitch screw element that creates backflow, raising fill density and mixing pressure.'
      },
      why: {
        ko: '분산에는 도움 되지만 체류 시간과 발열도 함께 늘릴 수 있습니다.',
        en: 'Can improve dispersion, but also increases residence time and heat generation.'
      },
      aliases: { ko: ['LE', '왼손 엘리먼트'], en: ['LE', 'left-hand element', 'Left-hand element'] }
    },
    zme: {
      label: { ko: 'ZME (zone mixing element · 존 믹싱 엘리먼트)', en: 'ZME (zone mixing element)' },
      gloss: {
        ko: '존 단위 균일 혼합을 위해 쓰는 완만한 혼합 엘리먼트입니다.',
        en: 'A gentle mixing element used to even out composition across a processing zone.'
      },
      why: {
        ko: '조성 균일도는 올리되 KB보다 전단 부담은 낮출 수 있습니다.',
        en: 'Improves composition uniformity with less shear penalty than a strong KB section.'
      },
      aliases: { ko: ['ZME', '존 믹싱 엘리먼트'], en: ['ZME', 'zone mixing element', 'Zone mixing element'] }
    },
    residenceTime: {
      label: { ko: '체류 시간', en: 'Residence time' },
      gloss: {
        ko: '수지가 스크류와 배럴 안에 머무는 총 시간입니다.',
        en: 'The total time the resin stays inside the screw and barrel.'
      },
      why: {
        ko: 'PHA는 3–5분을 넘기면 열분해 위험이 빠르게 커집니다.',
        en: 'PHA thermal-degradation risk rises quickly beyond roughly 3–5 minutes.'
      },
      aliases: { ko: ['체류 시간'], en: ['residence time', 'Residence time'] }
    },
    deadZone: {
      label: { ko: '데드존', en: 'Dead zone' },
      gloss: {
        ko: '용융이 흐르지 않고 고이는 정체 공간입니다.',
        en: 'A stagnant melt region where material stops moving.'
      },
      why: {
        ko: '겔과 갈색 스트릭의 출발점이 됩니다.',
        en: 'A common source of gels and brown streaks.'
      },
      aliases: { ko: ['데드존', '정체 영역'], en: ['dead zone', 'Dead zone'] }
    },
    gel: {
      label: { ko: '겔 / fish-eye', en: 'Gel / fish-eye' },
      gloss: {
        ko: '녹지 않거나 가교된 덩어리 점 결함입니다.',
        en: 'A spot defect caused by unmelted or crosslinked material.'
      },
      why: {
        ko: '표면 품질과 필름 외관을 직접 망칩니다.',
        en: 'It directly damages surface quality and film appearance.'
      },
      aliases: { ko: ['겔', 'fish-eye', '피시아이'], en: ['gel', 'fish-eye', 'Gel'] }
    },
    gateSeal: {
      label: { ko: '게이트 동결', en: 'Gate seal' },
      gloss: {
        ko: '게이트 수지가 굳어 더 이상 보압이 들어가지 않는 시점입니다.',
        en: 'The moment the gate solidifies and hold pressure can no longer feed the cavity.'
      },
      why: {
        ko: '보압 시간의 최소 기준을 정합니다.',
        en: 'Defines the lower bound for hold time.'
      },
      aliases: { ko: ['게이트 동결'], en: ['gate seal', 'Gate seal'] }
    },
    vpTransfer: {
      label: { ko: 'V/P transfer', en: 'V/P transfer' },
      gloss: {
        ko: '사출 속도 제어에서 압력 제어로 넘어가는 전환 시점입니다.',
        en: 'The switchover point from velocity control to pressure control.'
      },
      why: {
        ko: '충진 구간과 보압 구간의 경계를 정합니다.',
        en: 'Defines the boundary between filling and packing.'
      },
      aliases: { ko: ['V/P transfer', 'V/P 전환'], en: ['V/P transfer'] }
    },
    eof: {
      label: { ko: 'EoF (end-of-fill · 충진 완료 지점)', en: 'EoF (end-of-fill)' },
      gloss: {
        ko: '캐비티가 거의 다 차서 속도 제어에서 보압 제어로 넘어갈 기준 지점입니다.',
        en: 'The near-full cavity point used as the reference for transitioning from fill to pack.'
      },
      why: {
        ko: 'EoF가 흔들리면 short shot과 flash가 동시에 늘어납니다.',
        en: 'If EoF drifts, both short-shot risk and flash risk increase.'
      },
      aliases: { ko: ['EoF', '충진 완료 지점'], en: ['EoF', 'end-of-fill', 'End-of-fill'] }
    },
    shortShot: {
      label: { ko: '미충전 / Short shot', en: 'Short shot' },
      gloss: {
        ko: '캐비티가 끝까지 채워지지 않는 결함입니다.',
        en: 'A defect where the cavity does not fill completely.'
      },
      why: {
        ko: '충진 압력과 점도 문제를 가장 먼저 드러냅니다.',
        en: 'Usually the first visible sign of fill-pressure or viscosity problems.'
      },
      aliases: { ko: ['미충전', 'Short shot'], en: ['short shot', 'Short shot'] }
    },
    flash: {
      label: { ko: '플래시', en: 'Flash' },
      gloss: {
        ko: '파팅라인 바깥으로 수지가 새어 얇게 굳는 결함입니다.',
        en: 'A thin film defect caused by material escaping the parting line.'
      },
      why: {
        ko: '과보압, 과열, 클램프 부족을 의심해야 합니다.',
        en: 'Usually points to over-pack, excess temperature, or low clamp force.'
      },
      aliases: { ko: ['플래시'], en: ['flash', 'Flash'] }
    },
    splay: {
      label: { ko: '실버 스트릭 / Splay', en: 'Splay / silver streaks' },
      gloss: {
        ko: '표면에 보이는 은빛 줄무늬. 대부분 수분 기포가 원인입니다.',
        en: 'Silvery surface streaking, usually driven by moisture bubbles.'
      },
      why: {
        ko: '건조 상태와 노즐 온도 점검이 우선입니다.',
        en: 'Dryness and nozzle temperature are the first checks.'
      },
      aliases: { ko: ['실버 스트릭', '스플레이', 'Splay'], en: ['splay', 'silver streaks', 'Splay'] }
    },
    sinkMark: {
      label: { ko: '수축 자국 / Sink mark', en: 'Sink mark' },
      gloss: {
        ko: '두꺼운 부위 뒷면이 오목하게 들어가는 결함입니다.',
        en: 'A concavity defect on the back of a thick section.'
      },
      why: {
        ko: '보압 부족이나 빠른 게이트 동결을 뜻합니다.',
        en: 'Usually points to under-packing or a gate that seals too early.'
      },
      aliases: { ko: ['수축 자국', '싱크'], en: ['sink mark', 'Sink mark'] }
    },
    nucleatingAgent: {
      label: { ko: '결정핵제', en: 'Nucleating agent' },
      gloss: {
        ko: '결정화가 더 빨리 시작되게 돕는 첨가제입니다.',
        en: 'An additive that makes crystallization start faster.'
      },
      why: {
        ko: '점착 냉각과 느린 고화를 줄이는 데 도움 됩니다.',
        en: 'Useful when tacky cooling or slow solidification is the bottleneck.'
      },
      aliases: { ko: ['결정핵제'], en: ['nucleating agent', 'Nucleating agent'] }
    },
    antiOxidant: {
      label: { ko: 'AO / 산화방지제', en: 'AO / anti-oxidant' },
      gloss: {
        ko: '열산화 분해를 늦추는 안정제입니다.',
        en: 'A stabilizer that slows thermal-oxidative degradation.'
      },
      why: {
        ko: '긴 체류 시간이나 높은 용융 온도에서 특히 중요합니다.',
        en: 'Especially important at long residence time or high melt temperature.'
      },
      aliases: { ko: ['AO', '산화방지제'], en: ['AO', 'anti-oxidant', 'Anti-oxidant'] }
    },
    mw: {
      label: { ko: 'Mw', en: 'Mw' },
      gloss: {
        ko: '무게 평균 분자량입니다. 가수분해나 열분해가 일어나면 떨어집니다.',
        en: 'Weight-average molecular weight. It falls when hydrolysis or thermal degradation occurs.'
      },
      why: {
        ko: '점도, 취성, 가공 안정성과 직접 연결됩니다.',
        en: 'Directly tied to viscosity, brittleness, and processing stability.'
      },
      aliases: { ko: ['Mw', '분자량'], en: ['Mw', 'molecular weight'] }
    },
    backPressure: {
      label: { ko: '백 프레셔', en: 'Back pressure' },
      gloss: {
        ko: '스크류 후퇴 중 용융에 걸어 주는 저항 압력입니다.',
        en: 'The resisting pressure applied while the screw recovers.'
      },
      why: {
        ko: '균질화는 좋아지지만 전단 발열도 같이 증가합니다.',
        en: 'Improves homogenization but also raises shear heat.'
      },
      aliases: { ko: ['백 프레셔'], en: ['back pressure', 'Back pressure'] }
    },
    devolatilization: {
      label: { ko: '탈가스', en: 'Devolatilization' },
      gloss: {
        ko: '진공 벤트로 수분과 분해 가스를 빼는 공정 단계입니다.',
        en: 'The vacuum-vent step that removes moisture and volatile degradation gases.'
      },
      why: {
        ko: '갇힌 가스 결함과 토크 불안을 줄입니다.',
        en: 'Helps prevent trapped-gas defects and torque instability.'
      },
      aliases: { ko: ['탈가스'], en: ['devolatilization', 'Devolatilization'] }
    },
    purge: {
      label: { ko: '퍼지', en: 'Purge' },
      gloss: {
        ko: '배럴 안 잔류 수지를 전이 수지로 밀어내는 청소 절차입니다.',
        en: 'A cleaning step that pushes residual resin out of the barrel with a transition resin.'
      },
      why: {
        ko: '그레이드 변경과 열화 후 잔류물 제거에 필수입니다.',
        en: 'Essential during grade changes and after degradation events.'
      },
      aliases: { ko: ['퍼지'], en: ['purge', 'Purge'] }
    }
  };

  function currentLang(lang) {
    return lang === 'en' ? 'en' : 'ko';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  }

  function glossaryTooltip(termKey, lang) {
    const locale = currentLang(lang);
    const entry = GLOSSARY_PHA[termKey];
    if (!entry) return '';
    return `${entry.label[locale]}: ${entry.gloss[locale]}`;
  }

  function glossAttach(element, termKey, lang) {
    if (!element || !GLOSSARY_PHA[termKey]) return element;
    const locale = currentLang(lang || window.LANG);
    element.classList.add('glossary-term');
    element.dataset.glossaryTerm = termKey;
    element.title = glossaryTooltip(termKey, locale);
    element.setAttribute('aria-label', element.title);
    element.style.textDecoration = 'underline dotted';
    element.style.textUnderlineOffset = '0.12em';
    element.style.cursor = 'help';
    return element;
  }

  function renderPhaGlossary(container, lang) {
    if (!container) return;
    const locale = currentLang(lang || window.LANG);
    const seen = localStorage.getItem(STORAGE_KEY) === '1';
    const titles = {
      ko: {
        title: '현장 용어 사전 · Field terminology',
        intro: '현장 대응에서 자주 나오는 용어만 추렸습니다. 의미와 왜 중요한지까지 바로 확인할 수 있습니다.',
        why: '왜 중요한가'
      },
      en: {
        title: 'Field terminology · 현장 용어 사전',
        intro: 'Common floor terms only. Each entry states what it means and why it matters.',
        why: 'Why it matters'
      }
    };
    const ui = titles[locale];
    const detailsOpen = seen ? '' : ' open';
    if (!seen) localStorage.setItem(STORAGE_KEY, '1');
    const rows = TERM_ORDER.map(key => {
      const entry = GLOSSARY_PHA[key];
      return `
        <div style="padding:8px 0;border-top:1px solid #E2DAC6;">
          <div style="font-weight:600;color:#2C5D3F;">${escapeHtml(entry.label[locale])}</div>
          <div style="margin-top:4px;color:#3A352D;line-height:1.55;">${escapeHtml(entry.gloss[locale])}</div>
          <div style="margin-top:4px;color:#757065;font-size:13px;"><strong>${escapeHtml(ui.why)}:</strong> ${escapeHtml(entry.why[locale])}</div>
        </div>
      `;
    }).join('');
    container.innerHTML = `
      <details class="card" data-glossary-skip="true"${detailsOpen}>
        <summary style="cursor:pointer;font-weight:700;color:#2C5D3F;">${escapeHtml(ui.title)}</summary>
        <p style="margin:10px 0 0;color:#6B665C;line-height:1.55;">${escapeHtml(ui.intro)}</p>
        <div style="margin-top:10px;">${rows}</div>
      </details>
    `;
  }

  function glossFirstInRoot(root, lang) {
    if (!root || typeof document === 'undefined') return;
    const locale = currentLang(lang || window.LANG);
    const seenKeys = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[data-glossary-skip]')) return NodeFilter.FILTER_REJECT;
        if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(node => {
      const source = node.nodeValue;
      const haystack = source.toLowerCase();
      let chosen = null;
      TERM_ORDER.forEach(termKey => {
        if (chosen || seenKeys.has(termKey)) return;
        const aliases = GLOSSARY_PHA[termKey]?.aliases?.[locale] || [];
        aliases.forEach(alias => {
          if (chosen || !alias) return;
          const idx = haystack.indexOf(String(alias).toLowerCase());
          if (idx >= 0) chosen = { termKey, alias: source.slice(idx, idx + alias.length), idx, len: alias.length };
        });
      });
      if (!chosen) return;
      const frag = document.createDocumentFragment();
      const before = source.slice(0, chosen.idx);
      const hit = source.slice(chosen.idx, chosen.idx + chosen.len);
      const after = source.slice(chosen.idx + chosen.len);
      if (before) frag.append(before);
      const marker = document.createElement('abbr');
      marker.textContent = hit;
      glossAttach(marker, chosen.termKey, locale);
      frag.append(marker);
      if (after) frag.append(after);
      node.parentNode.replaceChild(frag, node);
      seenKeys.add(chosen.termKey);
    });
  }

  window.PHA_GLOSSARY_STORAGE_KEY = STORAGE_KEY;
  window.GLOSSARY_PHA = GLOSSARY_PHA;
  window.glossAttach = glossAttach;
  window.glossFirstInRoot = glossFirstInRoot;
  window.renderPhaGlossary = renderPhaGlossary;
})();
