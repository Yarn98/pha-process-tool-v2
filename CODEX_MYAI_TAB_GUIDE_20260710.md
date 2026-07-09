# My AI 탭 구현 지침서 — PHA Optimizer/Convertor (Codex 붙여넣기용)

작성일: 2026-07-10
대상 리포: `D:\My_PJT\Application\pha_optimizer_convertor` (**바닐라 정적 사이트**: `index.html` 인라인 IIFE + `window.*` 전역 JS 모듈 + `tokens.css`/`overrides.css` + `build.js`(파일 복사) + `sw.js`(PWA) + Cloudflare Pages/Netlify 이중 배포)
목적: 사용자가 **구어체로 질문/지시** → LLM이 **OpenAI-compatible tool-calling**으로 이 앱의 계산·데이터·가이드를 실행/조회 → 결과를 **탭별 구조화 형식으로 정리·출력하고 해석**까지 제공하는 "My AI" 탭 추가.

> **이 앱은 자매 앱 `4HB_P34HB-properties-modeling`(My Local AI 탭 구현·검증 완료)과 스택이 거의 동일하다** — 같은 `tokens.css` 디자인 계열, 같은 "탭 버튼 + 섹션 + `window.*` 전역함수" 구조, 같은 TARS API 백엔드. **따라서 4HB의 localai IIFE를 가장 직접적으로 이식**한다. 이 문서는 "새로 설계"가 아니라 **"이식 + 6개 축 치환"** 지침이다.

**4HB 원본 참조**: `4HB_P34HB-properties-modeling/index.html`(탭 버튼 ~19821, `#section-localai` ~22068, JS IIFE ~44264–46372), 문서 `CODEX_HANDOFF_LOCALAI_20260709.md` + `CODEX_LOCALAI_UPGRADE_GUIDE_20260709.md`.

---

## 0. 요약 — 이식성 판정 & 6개 치환 축

**결론: 4HB "My Local AI" 패턴은 이 앱에 거의 그대로 이식 가능.** 브라우저→LLM 벤더 직통(서버 프록시 불필요), 설정·대화는 localStorage/IndexedDB, `#section-localai` CSS는 `var(--token, fallback)`이라 이 앱 `tokens.css`와 100% 호환. 기존 AI/LLM 통합은 **전무**(그린필드).

**이식 시 반드시 바꿔야 할 6개 축:**
1. **탭 마크업 규약**: 4HB는 `.tab-btn[data-tab] + #section-<key>`, 이 앱은 **`.tab[data-tab] + #<key>`(섹션 id = 탭 키, `section-` 접두 없음)**. 탭 전환은 `switchTab(tabId)`(index.html:3844). → 4HB의 섹션 선택자(`#section-<tab>`, `.tab-btn`)를 전부 이 앱 규약으로 치환.
2. **결과 id 맵**: `LAI_RESULT_IDS_BY_TAB`를 이 앱의 실제 결과 요소로 교체(§Phase 3-1 매핑안).
3. **앱특화 tool**: 4HB의 `get_composition`/`get_properties`를 이 앱 함수(`calcResidence`/`calculateFlashClampTonnage`/`PHA_DATA_BRIDGE.*`/`TarsAnomalyCodes`/`tsData`)로 재정의.
4. **i18n 2로케일**: 4HB는 ko/en/fr 3개, 이 앱은 **ko/en 2개**(`I18N.ko`/`I18N.en`, index.html:656). fr 블록 버림. `renderLocalAITranslations` 대신 이 앱 `i18nApply()`(:1896) 재사용.
5. **CSP 신설 + Netlify 확장**: 이 앱은 **`_headers` 파일이 없고** `netlify.toml`의 `connect-src`가 `'self' https://tars-api...`로 제한 → LLM 벤더 직통이 Netlify에서 **차단**됨. `_headers` 신설 + `netlify.toml` `connect-src` 확장 필수(§Part 0-5).
6. **build.js + sw.js 캐시**: 새 JS/CSS 추가 시 `build.js`의 `FILES_TO_COPY`(:12-27) 등록 + `sw.js`의 `PRECACHE_URLS`(:10) 추가 + **`CACHE` 버전 문자열 bump**(현재 `pha-cache-v13-tars-shell`) + `ASSET_V`(`?v=13`) 상향 + index.html `<script src=...?v=N>` 동기화.

---

## Part 0 — 불변 규칙 & 사전 확인

1. **canonical = 루트 파일.** `wrangler.toml`의 `pages_build_output_dir="."` → CF Pages는 루트를 직접 서빙(build 안 씀). `netlify.toml`은 `npm run build`→`dist` 서빙. `dist/`는 `.gitignore` 등재·매 빌드 `fs.rmSync`로 재생성 → **`dist/` 직접 수정 금지.**
2. **JS 모듈 패턴**: ES 모듈 아님. **IIFE + `window.*` 전역 노출**(4HB와 동일 ES5 톤 `var`/`function`). My AI는 신규 `myai.js`(권장) 또는 index.html 인라인 IIFE로 추가. 신규 파일이면 index.html `<script>` 로드(:3925-3933) + build.js + sw.js 등록.
3. **브라우저→LLM 직통**: 4HB처럼 서버 프록시 없이 벤더 직접 호출(LM Studio/Cerebras/OpenAI/Grok/Custom/Hybrid). 키·대화는 localStorage/IndexedDB에만.
4. **TARS 백엔드는 이미 연동**: `pha-integration.js:299-336` `loadTarsGrades()`가 `/api/grades`(프록시 `functions/api/[[path]].js`) 호출. `web_search`/Action을 이 워커로 프록시하면 CSP 추가 host 없이 가능.
5. **CSP (필수 조치)**: 4HB `_headers:9`의 `connect-src`를 참조 —
   `'self' https://tars-api.sorisem98.workers.dev http://localhost:* http://127.0.0.1:* https://gateway.ai.cloudflare.com https://api.cerebras.ai https://api.openai.com https://api.x.ai https://*.trycloudflare.com https://*.ts.net`.
   → (a) 이 앱에 **`_headers` 파일 신설**(CF Pages용), (b) `netlify.toml`의 `connect-src`도 동일 확장. 안 하면 Netlify 배포 HTTPS에서 LLM 호출이 CSP로 차단됨.
6. **i18n**: `I18N.ko`/`I18N.en`(index.html:656)에 신규 UI 라벨 추가. `data-i18n="<key>"` 마크업 + `i18nApply()`(:1896, `el.innerHTML=_t(key)`)로 적용. `setLanguage(lang)`(:2194)가 재적용.
7. **품질 게이트 전무**: 테스트·러너 없음(`package.json`에 `build`/`start`만). 4HB급 회귀 테스트를 붙이려면 테스트 러너·스크립트부터 신설(§Phase 6). 최소한 아래 격리 로직 테스트(파서/렌더/XSS/`LAI_RESULT_IDS_BY_TAB` DOM 드리프트)는 권장.
8. **비밀번호 게이트**: `functions/_middleware.js`가 서버측 인증(`PASSWORD='314'`, 쿠키 12h). My AI 탭도 인증 후 접근되므로 별도 처리 불필요.

---

## Part 1 — 현재 구조 지도 (Codex 탐색용 앵커)

| 구성요소 | 위치 |
|---|---|
| 최상위 탭 정의 | `index.html:363-374` (`.tabs` > `button.tab[data-tab][data-i18n]`) |
| 섹션 | `<section id="<key>" class="tabpage">` (proc:377, ts:433, hist:439, ana:452, calc:468, props:511, photos:537, flash:547, compounding:573, straw:578) |
| 탭 전환 | `switchTab(tabId)` (:3844); `ana`이면 `analyze()` 호출(:3858) |
| 모바일 탭바 | `#mobileTabBar`(:632), `#morePopover`(:639), `initMobileTabBar()`(:3860) |
| i18n | `I18N`(:656), `i18nApply()`(:1896), `setLanguage()`(:2194), `_t()`(:1877) |
| calc 계산기 | `calcResidence()`(:2072), `calcCooling()`(:2074), `calcBlownFilm()`(:2076) |
| flash 계산기 | `calculateFlashClampTonnage()`(:2271), `calculateFlashPressureLimit()`(:2287), `calculateFlashShearRate()`(:2303), `calculateFlashPackingPressure()`(:2330), `calculateShotWeight()`(:3283) |
| proc 폼/분석 | `rebuildForm()`(:1999), `SCHEMAS`(:1816), `RECO`(:1762), `saveEntry()`(:2027), `analyze()`(:2222) |
| 데이터 브릿지 | `pha-integration.js` `window.PHA_DATA_BRIDGE`(:246), `loadTarsGrades()`(:299) |
| 이상코드 | `anomaly-codes.js` `window.TarsAnomalyCodes` |
| 배치 스키마 | `tars-batch-schema.js` `window.TarsBatchSchema` (`tars-batch-v1`) |
| 트러블슈팅 | `custom.js` `window.tsData`(:724), `MATERIAL_CARDS`(:10) |
| 컴파운딩/스트로 | `compounding-guide.js` `cgUpdateComposition()`(:526), `straw-guide.js` `window.initStrawGuide`(:718) |
| 데이터 | `data/material_cards.json`, `data/troubleshooting_kb.json`, `data/grades/CA1180P_*.json` |
| 스타일 | `tokens.css`(4HB와 동일 `--paper/--accent/--rule/--rad-*`), `overrides.css`(`!important`) |
| 빌드 | `build.js` `FILES_TO_COPY`(:12-27), `DIRS_TO_COPY`(data,icons) |
| SW | `sw.js` `CACHE='pha-cache-v13-tars-shell'`(:5), `ASSET_V='?v=13'`(:9), `PRECACHE_URLS`(:10) |
| 배포 | `wrangler.toml`(`pages_build_output_dir="."`), `netlify.toml`(CSP:25), `functions/_middleware.js`, `functions/api/[[path]].js` |

---

## Phase 1 — 탭 스캐폴딩

**목표**: 빈 My AI 탭이 뜨고 열림. **4HB의 탭 추가 절차를 이 앱 규약으로.**

### 1-1. 탭 버튼 `index.html:373` 근처 (`.tabs` 안, 마지막 탭 뒤)
```html
<button class="tab" data-tab="myai" data-i18n="tab_myai">My AI</button>
```

### 1-2. 섹션 `index.html:580` 근처 (`#straw` 다음, `.tabs` 컨테이너 닫힘 전)
```html
<section id="myai" class="tabpage">
  <!-- 4HB #section-localai 마크업을 이식하되 id 접두 정리 -->
</section>
```

### 1-3. 모바일 접근 (선택) `#morePopover`(:645) 근처
```html
<button data-tab="myai" data-i18n="tab_myai">My AI</button>
```

### 1-4. 초기화 훅 `switchTab`(:3844) — `ana` 케이스(:3858) 방식
```js
if(tabId === 'myai' && typeof initMyAI === 'function') initMyAI();
```

### 1-5. i18n `I18N.ko`/`I18N.en`(:656)
`tab_myai` + My AI UI 라벨들(제목/플레이스홀더/버튼/상태) 추가. `data-i18n` 마크업은 `i18nApply()`가 자동 처리.

**검증**: 로컬 서버(`python -m http.server`) → My AI 탭 클릭 시 섹션 표시, 언어 토글 전환.

---

## Phase 2 — LLM 클라이언트 & 백엔드 (4HB 직접 이식)

4HB의 `chatOnce`·백엔드 6종·설정 저장을 그대로 이식한다(ES5 IIFE, `var`/`function`).

- **백엔드 6종**: LM Studio(`http://localhost:1234/v1`) / Cerebras(CF AI Gateway) / OpenAI / Grok / Custom / Hybrid(자동 라우팅+폴백).
- `chatOnce(backend, messages)` → `POST <base>/chat/completions`, body `{model, messages, tools:toolSchemas(), tool_choice:'auto', temperature:0.2, stream:false}`, 120s 타임아웃, AbortController 중지.
- **설정/대화 저장**: 4HB의 localStorage 키(`tars.localai.v1`)·IndexedDB(`tars-localai`) 패턴을 이 앱 네임스페이스(예: `pha.myai.v1`, `pha-myai`)로. API 키 평문 저장 경고 UI 유지.
- **CSP 전제**: Part 0-5의 `_headers`/`netlify.toml` 확장이 선행돼야 벤더 직통이 배포에서 동작.

**검증**: LM Studio로 왕복, 중지 버튼.

---

## Phase 3 — 지식 레지스트리 + Tool (이 앱 함수로 치환)

### 3-1. `LAI_RESULT_IDS_BY_TAB` (이 앱용 — 결과 DOM id 단일 원본)
```js
var LAI_RESULT_IDS_BY_TAB = {
  proc:  ['paramTable', 'guideLinks', 'tsHint'],
  ts:    ['tsContainer'],
  hist:  ['histBody'],
  ana:   ['anaText', 'anaCard'],
  calc:  ['kpi_res_out', 'cool_out', 'bf_out'],
  props: ['mat_tbody'],
  photos:['photoGrid'],
  flash: ['flash-clamp-result','flash-pressure-result','flash-shear-result','flash-packing-result'],
  compounding: ['compGuideContainer'],
  straw: ['strawGuideContainer']
};
```
> 실제 id는 구현 중 `index.html`에서 검증할 것(4HB 핸드오프 §6의 "DOM 드리프트 가드" 테스트 권장). 결과 컨테이너 id가 확실치 않으면 제네릭 셀렉터(`.tabpage.active` 내 결과 카드)로 폴백.

### 3-2. `LAI_TAB_KNOWLEDGE` (의미 레지스트리 — 10개 탭)
각 탭 `{label:{ko,en}, purpose, keyInputs, outputSchema, reading, cautions}`. 예:
- `proc`: 공정 셋포인트 vs 권장범위(RECO), 상태 정상/주의/위험. envelope=sectioned, sections `["공정조건","상태판정","가이드"]`.
- `calc`: 체류시간/냉각시간/블로운필름. envelope=property.
- `flash`: 형체력/사출압한계/전단속도/패킹압. envelope=sectioned, sections `["계산값","권장","조치"]`.
- `props`: 물성 DB(S1000P/A1000P/CA1180P/CB0104A). envelope=property.
- `ts`/`compounding`/`straw`: 가이드 KB 조회. envelope=sectioned.

### 3-3. Tool 정의/실행 (4HB `toolSchemas`/`execTool` 이식 + 앱특화 교체)
범용 tool은 4HB 그대로: `get_current_tab_context`, `get_tab_context(tab, switch_tab)`, `set_tab_inputs(tab, values)`, `web_search`, `update_tars_feature`. **앱특화 tool 교체:**

| tool | 감싸는 실제 대상 | 결과 |
|---|---|---|
| `calc_residence` | `calcResidence()` (index.html:2072) | 체류시간(분) `#kpi_res_out` |
| `calc_cooling` | `calcCooling()` (:2074) | 냉각시간(s) `#cool_out` |
| `calc_blown_film` | `calcBlownFilm()` (:2076) | 필름 두께·DDR `#bf_out` |
| `calc_flash_clamp` | `calculateFlashClampTonnage()` (:2271) | 형체력 + 권장 |
| `calc_flash_pressure` | `calculateFlashPressureLimit()` (:2287) | 사출압 한계 |
| `calc_flash_shear` | `calculateFlashShearRate()` (:2303) | 전단속도 |
| `calc_shot_weight` | `calculateShotWeight()` (:3283) | 샷 웨이트/형체력 |
| `get_material_info` | `PHA_DATA_BRIDGE.getMaterialInfo(grade)` | 물성 |
| `get_temp_suggestion` | `PHA_DATA_BRIDGE.getTempSuggestion(grade)` | 배럴/건조 온도 |
| `classify_compounding` | `PHA_DATA_BRIDGE.classifyForCompounding(grade)` | H/S/F 분류 |
| `get_anomaly_code` | `TarsAnomalyCodes.getAnomalyCodeMeta(code)` | 이상코드 메타 |
| `search_troubleshooting` | `window.tsData` 필터 | 증상→처방 |
| `get_material_db` | `getMatDB()` (:2081) | 물성 DB |
| `get_history` | `pha_hist` localStorage | 이력 |

- **입력이 DOM 요소인 계산기 tool**(calcResidence 등)은 두 방식: (a) tool 인자를 받아 해당 input id에 값을 set한 뒤 계산 함수 호출(allowControl 필요), (b) 인자를 받아 계산 로직을 **순수 재현**(권장 — 부작용 없음). 4HB는 `get_properties`에서 (b) 방식(엔진 직접 호출)을 썼다. 가능하면 계산 함수를 인자 기반으로 리팩터링해 순수 호출.
- **`set_tab_inputs`/`update_*`는 "기능 제어 허용" 토글 켜진 경우만**.

**검증**: "홀드업 부피 120cc 유량 20g/s 체류시간?" → `calc_residence` 호출·봉투 반환.

---

## Phase 4 — 프롬프트 & 루프 (4HB 이식, 도메인 교체)

### 4-1. 시스템 프롬프트 (4HB `systemPrompt()` 이식)
- 도메인 문구를 PHA 사출/압출로: "You are the PHA Optimizer embedded assistant — a copilot for PHA injection/extrusion process KPIs, flash control, troubleshooting, and material data."
- **언어는 `LANG`(ko/en) 연동** (4HB 리뷰 지적 반영).
- 활성 탭 1개 지식만 주입.

### 4-2. 출력 봉투 (4HB와 동일)
property/sectioned 2봉투. **표 행은 키 있는 객체**. flash 탭 섹션 예: `["계산값","권장","조치"]`.

### 4-3. 루프 (4HB `runLoop` 이식) — 리뷰 확정 교훈 3가지 필수
1. **깨진 JSON 재시도는 남은 라운드 예산 있을 때만**(`round + 1 < MAX_TOOL_ROUNDS`).
2. **tool 참조 breadcrumb 히스토리에 단일 메시지로**.
3. **모든 사용자 대면 문자열 i18n**.

---

## Phase 5 — UI & 렌더 (4HB 렌더러 직접 이식)

4HB의 렌더 체인을 **그대로 복붙**(이 앱 tokens.css와 100% 호환):
- `#section-localai` → `#myai` 로 CSS 스코프 셀렉터만 치환(4HB index.html의 `#section-localai` `<style>` 블록 전체).
- `extractStructured`/`laiFindLastJsonBlock`(균형-중괄호 파서), `renderStructuredMessage`(판정 배지+표), `laiRenderMarkdownLite`/`laiInlineMd`(**전체 `esc()` 후 화이트리스트 태그만 — XSS 안전**), `laiConfClass`(신뢰도 pill), `laiCopyButton`(복사) 그대로.
- `laiCollectInputs`/`laiCollectResults`/`laiReadTabContext`: **섹션 선택자를 `#section-<tab>` → `#<tab>`, `.tab-btn` → `.tab`로 치환**(§0 축1). `LAI_RESULT_IDS_BY_TAB`는 §3-1로 교체.
- 복사 버튼/실패 안내 라벨은 **ko/en i18n 키**로(4HB 리뷰 지적 반영 — `copyMsg`/`copiedMsg`/`singleBackendHint`).
- 다크모드 없음(라이트 고정).

**검증**: 구조 답변 표, 산문 마크다운, XSS 페이로드(`<img onerror>`) 이스케이프.

---

## Phase 6 — 검증 & 배포 조치

**품질 게이트가 전무하므로 아래를 신설/수행:**
1. **격리 로직 테스트**(4HB 방식): `extractStructured` 봉투 파서, `laiRenderMarkdownLite` XSS, `LAI_RESULT_IDS_BY_TAB` id들의 DOM 존재(드리프트 가드). Node + jsdom으로 index.html 로드해 검증(4HB의 격리 테스트 하네스 참고).
2. **build.js 등록**: 신규 `myai.js`/CSS를 `FILES_TO_COPY`(:12-27)에 추가(누락 시 Netlify dist 배포 누락).
3. **sw.js 캐시 bump**: `PRECACHE_URLS`(:10)에 `'./myai.js'+ASSET_V` 추가, `CACHE`를 `'pha-cache-v14-myai'`로, `ASSET_V`를 `'?v=14'`로, index.html `<script src=...?v=14>`(:3925-3933) 동기화. (cache-first라 안 올리면 구 JS 서빙. LLM POST는 `sw.js:50` `method!=='GET'` 우회라 안전.)
4. **CSP 신설**: `_headers` 파일 생성(4HB `_headers` connect-src 복제) + `netlify.toml`(:25) `connect-src` 확장.
5. **수동 스모크**: LM Studio 연결 → 계산 tool 왕복, 언어 토글, 모바일 탭바.

---

## 부록 — 이식 체크리스트 (4HB → 이 앱, 6개 축)

- [ ] 탭 버튼/섹션: `.tab-btn[data-tab]`/`#section-<key>` → `.tab[data-tab]`/`#<key>`, `switchTab` 훅
- [ ] `LAI_RESULT_IDS_BY_TAB` → §3-1 매핑안(구현 중 DOM 검증)
- [ ] 앱특화 tool: 4HB `get_composition`/`get_properties` → 이 앱 계산기/브릿지/이상코드/KB 함수
- [ ] i18n: fr 제거, ko/en만. `renderLocalAITranslations` → `i18nApply()`
- [ ] CSP: `_headers` 신설 + `netlify.toml` `connect-src` 확장
- [ ] build.js `FILES_TO_COPY` + sw.js `PRECACHE_URLS`/`CACHE`/`ASSET_V` + index.html `?v=N`
- [ ] (유지) 4HB 렌더러·파서·백엔드·루프·리뷰 확정 3교훈(재시도 예산 게이트·breadcrumb·i18n)
