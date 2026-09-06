# 사출 공정 동작 시각화

## 제작 방향

- 시각 방향: 기존 종이색·회색 설비와 초록 수지를 유지하고, 배럴과 금형을 절개해 내부 동작이 보이게 합니다.
- 화면 구성: 설비 3D 화면 → 재생/속도/진행 위치 → 기존 공정 단계와 점검 설명. 근거 패널과 입력값은 유지합니다.
- 상호작용: 스크류 회전·후퇴와 전진, 이동하는 수지와 캐비티 충전, 금형 개폐·이젝터를 같은 타임라인에 연결합니다. 직접 조작에서는 각 축을 부드럽게 움직이고 작동 순서를 제한하며, 스크류·금형 확대 보기를 제공합니다.

Blender 애니메이션을 GLB로 내보내 브라우저에서 재생합니다. 설명용 시간축이며 실제 사이클 시간·유동해석·특정 장비 치수를 나타내지 않습니다. 실제 장비에서는 계량과 냉각이 겹칠 수 있으며, 이 화면은 각 동작을 구분해 보이기 위한 순서입니다.

모델은 `scripts/create_injection_motion.py`로 재생성합니다. 편집 원본은 `assets/equipment/injection-motion.blend`, 웹 재생 파일은 같은 폴더의 `.glb`입니다. Three.js 0.185.1의 필요한 파일과 MIT 라이선스를 로컬에 포함해 오프라인에서도 재생하도록 구성합니다.

웹 렌더링 구현은 [Three.js GLTFLoader](https://github.com/mrdoob/three.js/blob/r185/examples/jsm/loaders/GLTFLoader.js), [AnimationMixer](https://github.com/mrdoob/three.js/blob/r185/src/animation/AnimationMixer.js), [OrbitControls](https://github.com/mrdoob/three.js/blob/r185/examples/jsm/controls/OrbitControls.js)의 공개 API를 사용합니다.

## 사용과 구현

- 공정 조건 → 사출의 설비 흐름, 플래시 제어 → 공정 흐름 두 위치에서 재생합니다. 동일한 렌더러를 이동해 GPU 컨텍스트를 중복 생성하지 않습니다.
- 재생/일시정지, 0.5×/1×/1.5× 재생 속도, 타임라인, 단계 이동, 시점 초기화·측면 보기, 드래그 회전·휠/두 손가락 확대를 제공합니다.
- 단계 선택과 타임라인 조작은 해당 위치에서 멈춥니다. 언어·그레이드·화면을 바꿔도 재생 위치와 속도를 유지합니다.
- 동작 줄이기 환경에서는 일시정지로 시작하고 명시적으로 재생할 수 있습니다. 다른 탭·공정·화면 밖에서는 프레임 재생을 중단합니다.
- GLB 또는 WebGL 실패 시 대체 포스터를 표시합니다. 외부 CDN 없이 재생하며 v18 서비스워커가 GLB와 모든 렌더러 모듈을 보관합니다.
- 금형 앞부분을 절개해 충전과 취출이 보이게 했습니다. 스크류가 회전하는 동안 후퇴하고, 충전 동안 회전 없이 전진합니다. 금형은 충전·보압·냉각 동안 닫힌 상태이며 이후 열립니다.
- 제품은 이동 금형 쪽으로 이동한 후 이젝터에 의해 분리되어 받침으로 떨어집니다. 냉각 중 계량 중첩, 수축, 체크링 상세 동작, 실제 유변/열전달은 재현하지 않습니다.

제조사 PHA 설정값, 계산기와 저장 기록을 이 애니메이션의 시간·좌표로 보정하지 않습니다.

## 추가기능 확인 및 정밀 조작

2026-09-06 실제 Blender 5.2.0 LTS 설정에서 활성 상태를 확인했습니다. [전체 검사 기록](../output/blender-capabilities.json)은 사용자 경로를 제외한 설치 버전과 활성 상태입니다.

| 추가기능 | 확인 버전 | 이번 작업에서의 활용 |
| --- | --- | --- |
| BoltFactory | 0.7.1 | 금형의 육각 소켓 볼트 4개 생성 |
| Bool Tool / LoopTools | 2.1.0 / 4.7.7 | 설치·활성 확인. 절개 형상은 재생성 가능한 메시로 유지 |
| Add Camera Rigs | 1.8.2 | 설치·활성 확인. 웹 확대 시점은 OrbitControls 사용 |
| Extra Mesh Objects / Extra Curve Objects | 0.4.1 / 0.2.0 | 설치·활성 확인 |
| Material Utilities | 2.2.3 | 설치·활성 확인 |
| A.N.T.Landscape / Sapling Tree Gen | 0.2.0 / 0.3.7 | 설치·활성 확인. 사출기 제작에는 사용하지 않음 |
| Blender MCP | 1.5 | 활성 확인. 백그라운드 모드에서는 서버를 시작하지 않으므로 제작·검증은 Blender CLI로 실행 |

기존 기능으로 요구 동작을 구현해 추가 설치는 하지 않았습니다. 재생성 시 factory 모드에서 BoltFactory만 명시적으로 불러오며, 전역 설정을 저장하거나 서버 추가기능을 시작하지 않습니다.

- 스크류의 깊은 공급 채널과 얕아지는 계량 채널을 연결하는 코어, 팁, 가이드 부시, 이젝터 플레이트를 보강했습니다.
- 자동 사이클은 스트로크 끝의 속도·가속도가 0이 되는 곡선으로 감속합니다. 형체 실린더 로드의 양 끝이 이동 플래튼과 실린더에 맞물리게 연결됩니다.
- `직접 조작`을 누르면 금형이 닫히고 계량이 완료된 설명용 상태로 시작합니다. 스크류 후퇴량을 100→0%로 줄이면 전진하며 캐비티가 채워집니다.
- 스크류 후퇴, 금형 개방, 이젝터 전진은 0.1% 단위, 회전각은 1° 단위로 키보드 화살표와 슬라이더를 조작할 수 있습니다. 숫자는 모형의 상대 이동값입니다.
- 금형이 완전히 열려야 이젝터를 조작할 수 있습니다. 이젝터가 복귀해야 금형을 닫을 수 있고, 금형이 열려 있으면 스크류 조작을 잠급니다. 실제 장비의 안전 시스템을 모사·검증한 기능은 아닙니다.
- 이젝터가 100% 전진하면 제품이 분리되어 받침으로 떨어집니다. `새 샷 준비`는 모형을 초기 상태로 되돌립니다.
- `관찰 부위`에서 스크류 또는 금형·취출을 확대할 수 있습니다. 조작 상태와 시점은 한·영 전환 및 두 공정 화면 사이에서 유지합니다.
- Blender 원본의 `MachineControls` 객체에는 `screw_retraction`, `screw_rotation_deg`, `mold_opening`, `ejector_extension` 속성이 있습니다. 타임라인의 키프레임과 드라이버가 기계 축을 연결하며 GLB에는 평가된 결과를 굽습니다. 제품과 수지의 자동 사이클은 별도 애니메이션입니다.
- 동작 줄이기 설정에서 직접 조작하면 중간 애니메이션 없이 목표 위치를 표시합니다. 직접 조작 중에는 떠 있는 저장 버튼을 숨겨 모바일 슬라이더를 가리지 않게 합니다.
- [Claude 용어 검수](../output/claude-injection-terms-review.txt)를 받아 `Ejector advance`로 대응을 맞추고, 후퇴량 감소가 스크류 전진을 뜻한다는 설명을 명시했습니다. `스크류` 표기는 기존 프로젝트와 일치시켰습니다.

```powershell
blender --background --python scripts/inspect_blender_capabilities.py
blender --background --factory-startup --python scripts/create_injection_motion.py
blender --background --factory-startup --python tests/blender-injection-rig.py
```

## 검증

사출 완료 후 나머지 7개 라인에 같은 재생·관찰·직접 조작 방식을 확장했습니다. 사출 컨트롤러와 새 공용 컨트롤러는 활성 화면에만 캔버스를 붙이고, 직접 조작 중 떠 있는 저장 버튼을 숨기는 동작을 공유합니다. 현재 전체 자산 버전은 v20입니다. [전체 설비 확장 기록](ALL_EQUIPMENT_MOTION_20260906.md).

`npm run test:motion`은 실제 Blender GLB의 트랙과 스크류·금형·수지 노드의 변화를 브라우저에서 검사합니다.

- Blender 원본 검사 통과: 드라이버, 이젝터의 금형 개방 조건, 실린더 로드 연결 위치, 볼트 치수와 스크류 중심축.
- `PHA_TEST_ROOT=dist npm run test:motion`: 12개 검사 통과. 자동·직접 조작, 부품 노드의 실제 변화, 인터록, 제품 분리, 확대 시점, 언어·모바일 전환, 숨긴 화면의 재생 중지, 서비스워커 오프라인 로드, 동작 줄이기와 로드 실패 처리를 포함합니다.
- `PHA_TEST_ROOT=dist npm run test:ui`: 기존 22개 검사 통과. 공정·컴파운딩·스트로의 한·영/데스크톱·모바일 32개 조합과 계산·저장 데이터 유지 확인.
- [웹 조작 결과](../output/playwright/injection-motion/results.json), [금형 확대](../output/playwright/injection-motion/06-manual-mold.png), [모바일 직접 조작](../output/playwright/injection-motion/08-manual-mobile.png).
