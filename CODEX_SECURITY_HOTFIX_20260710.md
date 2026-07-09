# My AI 탭 보안·견고성 핫픽스 — Codex 인수인계 (2026-07-10)

대상 리포: `D:\My_PJT\Application\pha_optimizer_convertor`
기반 커밋: `491c196 Add My AI tool-calling tab` 위에 적용
근거: 커밋 491c196에 대한 5차원 적대적 리뷰(보안·XSS / JS 정합성 / DOM 적응 / 루프·백엔드 / 배포·CSP)에서 **확정 10건**. 이 문서는 그 10건을 **직접 수정한 내역**을 Codex에게 인계하는 것이다.

> **커밋 안 함.** 변경은 워킹트리(`index.html`)에만 있다. 검증은 아래대로 통과했으니, 리뷰 후 커밋/푸시(자동 배포)는 Codex/사용자가 판단.

---

## 0. 가장 중요한 것 — QR/URL 동기화 보안 지뢰 (2건 결합)

두 결함이 맞물려 있었다. **반드시 함께** 이해할 것:

- **[보안·HIGH] `#myai-sync=` URL 조각 무확인 자동 import** — `window.initMyAI`가 부트 시 `myaiImportSync(myaiBootSyncHash)`를 **아무 확인 없이** 호출하고 `myaiSaveSettings()`로 영속화했다. 피싱 링크(`https://…/#myai-sync=<payload>`) 한 번이면 공격자가 **custom 백엔드 URL + `allowControl:true`**를 심어, 이후 사용자의 모든 대화·tool 결과(`get_current_tab_context`/`get_history`/`get_material_db`)가 공격자 서버로 유출되고 `set_tab_inputs`까지 조종된다. CSP가 `*.trycloudflare.com`/`*.ts.net`을 허용하므로 공격 엔드포인트가 CSP를 통과한다. export는 버튼+경고로 게이트돼 있는데 import만 무게이트인 **비대칭**이 결함이었다.
- **[정합성·HIGH] `myaiImportSync` off-by-one** — `code.slice(hashIdx + 12)` (5104). `#myai-sync=`는 11자라 `+12`가 프리픽스 `PHAMYAI1.`의 `P`를 먹어 **모든 URL import가 atob에서 throw**했다. 즉 QR 동기화 기능이 완전히 비작동이었고, **이 버그가 우연히 위 보안 구멍을 막고 있었다.** → off-by-one만 고치면 보안 구멍이 무장되므로 **둘을 한 세트로** 처리해야 했다.

**수정 방식**: (1) 부트 시 자동 import 제거 → URL 조각의 코드를 **동기화 입력란(`#myaiSyncCode`)에 스테이징만** 하고, 사용자가 확인 후 기존 "가져오기" 버튼을 눌러야 적용. (2) off-by-one을 `'#myai-sync='.length`로 수정해 수동 import가 정상 동작하도록 복구. (3) 부트 해시를 `let`으로 바꿔 1회만 소비.

---

## 1. 수정 내역 (10건, 모두 `index.html`)

| # | 리뷰 결함 | 위치(심볼) | 수정 |
|---|---|---|---|
| 1 | [HIGH] `#myai-sync=` 무확인 자동 import | `window.initMyAI` 부트 블록 | 자동 `myaiImportSync` 제거 → `#myaiSyncCode`에 코드 스테이징 + `syncStaged` 경고 sys 메시지. 사용자가 명시적 Import 눌러야 적용 |
| 2 | [HIGH] import hash strip off-by-one | `myaiImportSync` (`slice(hashIdx + 12)`) | `slice(hashIdx + '#myai-sync='.length)` (=+11)로 수정 |
| 3 | [MED] 부트 해시가 탭 활성화마다 재import | `myaiBootSyncHash` (`const`) | `let`으로 변경 + 부트 블록에서 `myaiBootSyncHash=''`로 1회 소비 |
| 4·5 | [HIGH] Hybrid에서 Stop이 폴백·재전송 유발 | `myaiChatWithFallback` catch, Stop 핸들러 | `let myaiUserStopped` 신설. Stop 핸들러가 플래그 set 후 abort; fallback catch 진입 시 `if(myaiUserStopped) throw err`로 폴백 차단 |
| 6 | [MED] tool 실행 중/라운드 사이 Stop no-op | `myaiRunLoop` | 진입부·tool 체인 각 단계에 `if(myaiUserStopped) return` 가드 |
| 7 | [MED] 깨진 JSON 재시도가 원본 답변 삼킴 | `myaiRunLoop` 재시도 분기 | `tried._jsonOriginal=content` 보존. 재시도 recursion `.catch`에서 원본 렌더; 라운드 한도 분기에서도 `_jsonOriginal` 있으면 원본 표시 |
| 8 | [LOW] `myaiAfterFrames` 콜백 throw → 영구 pending(busy 잠금) | `myaiAfterFrames` | `try{ resolve(fn()) }catch{ resolve({error}) }`로 모든 경로 settle |
| 9 | [LOW] intra-turn 토큰 예산 없음 | `myaiRunLoop` tool 메시지 push | tool payload 8000자 초과 시 `slice(0,8000)+'...[truncated]'` 클램프 |
| 10 | [MED] CSP allowlist가 custom/web_search/tool을 배포에서 조용히 차단 | `MYAI_PROVIDER_META.custom` noteKo/noteEn | 배포 CSP 허용 호스트(api.cerebras.ai·openai·x.ai·gateway·localhost·*.trycloudflare.com·*.ts.net)를 문구에 명시 |

**i18n**: `syncStaged`, `stopped` 키를 `I18N.ko`/`I18N.en` 두 로케일에 추가(하드코딩 언어 회피 — 리뷰 원칙).

**기각 1건**: "LM Studio localhost note 자기모순" — 실제로는 정확(브라우저가 localhost를 mixed-content 예외 처리). 수정 안 함.

---

## 2. 검증 (수정 반영 후 재실행)

- **인라인 스크립트 파싱 5/5** — 5개 `<script>` 블록 전부 `vm.Script` 컴파일 통과(구문 오류 없음).
- **`npm run build` 통과** — dist에 myai 포함.
- **`git diff --check` 클린** — whitespace 오류 없음. `index.html`만 변경.
- **동기화 라운드트립 4/4** — export→`#myai-sync=`→(수정 slice)→import가 정상 복구; 구버전(+12)은 실패(버그 회귀 가드); 바레 코드 정상.
- 라이브 LLM 왕복은 미실행(Pages Functions env 필요 — `wrangler pages dev` + `.dev.vars`).

---

## 3. 배포 주의 (Codex 커밋 시)

- **sw.js 캐시 bump 불필요.** myai 코드는 `index.html` 인라인이고 HTML은 sw.js에서 **network-first**라 배포 즉시 반영된다(별도 `?v=` 에셋 아님). 이미 `pha-cache-v14-myai`.
- **build.js 변경 불필요.** 새 파일 없음(index.html만 수정).
- 커밋 메시지 예: `fix(my-ai): harden QR sync (no auto-import), fix hash off-by-one, stop-button + loop robustness`.

---

## 4. 자매 앱 4HB — 동일 취약점 발견·수정함 (별도 리포)

이 QR 자동 import 설계는 **4HB(`4HB_P34HB-properties-modeling`)의 My Local AI 탭에서 이식된 것**이다. 확인 결과 **4HB도 동일한 무확인 자동 import**를 가지고 있었고(그쪽은 `initLocalAITab`의 `importSync(BOOT_SYNC_HASH…)`), **4HB는 slice offset이 정확해서 실제로 작동 = 프로덕션(p34hb.tarspolymer.com)에서 라이브 공격 가능**했다(pha는 off-by-one이 우연히 막고 있던 것과 대조). → **4HB도 동일하게 스테이징 방식으로 수정**하고(`index.html` 부트 블록 + `syncStaged` 3개 로케일 ko/en/fr), `sync:variants`·`verify:variants`(180/180)·`test:ci`(fail 0, eval:hdt PASS)로 검증했다. 4HB 변경도 **미커밋** 상태다(리포 루트 `CODEX_SECURITY_HOTFIX_20260710.md` 참조).

---

## 5. 후속 권장 (선택)

- 회귀 테스트 신설: "initMyAI가 `#myai-sync=`에서 자동 적용하지 않는다"(스테이징만), `myaiImportSync` 라운드트립, Stop 플래그가 폴백을 막는다 — jsdom 하네스로. pha는 테스트 인프라가 없어 러너부터 필요.
- `myaiImportSync`가 custom backend/allowControl을 켜는 코드를 적용할 때 **한 번 더 명시 confirm**(export 경고와 대칭)하는 것도 고려.
