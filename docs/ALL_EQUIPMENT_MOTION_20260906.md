# 전체 공정 설비의 동작·조작 확장

## 목표와 제작 방향

사출과 같은 수준의 실시간 3D 관찰·수동 조작을 일반 압출, 시트, 블로운 필름, 압출 블로우 성형, 캐스트 필름, 컴파운딩, 스트로에 제공합니다.

- 시각 방향: 절개한 금속 설비와 수지의 이동 경로를 크게 보여주고, 부품의 맞물림·회전 방향·중공 형상을 읽을 수 있게 합니다.
- 화면 구성: 3D 설비 → 재생·진행 위치·관찰 부위 → 직접 조작 → 기존 공정 설명과 근거 자료. 기존 입력과 현장 기록은 계속 사용합니다.
- 상호작용: 스크류·롤·벨트·절단부를 실제 3D 객체로 움직이고, 수지 표시는 경로를 따라 이동합니다. 공정별 관찰 위치와 0.1%/1° 단위 조작을 제공합니다.

재생 시간·회전각·상대 이동량은 설명용 모형의 값입니다. 제조사 운전값, 물성 예측, 실제 CFD·냉각·결정화·품질 계산과 연결하지 않습니다. 연속 공정에서는 여러 부품이 동시에 작동합니다.

## 스트로 원본 차용

`D:/My_PJT/Application/straw-optimizer-v2/output/blender/straw-equipment.blend`의 작업 중 원본을 사용자가 지정하여 가져왔습니다. 소스 프로젝트의 HEAD는 `91d3a22e284f9296aed668bfec9d55dd58553777`이며, 차용한 Blender 파일은 해당 커밋에 아직 포함되지 않은 작업 트리 스냅샷입니다.

- 보존 위치: `assets/equipment/sources/straw-optimizer-v2.blend`
- 원본 SHA-256: `91b712018468ed304c4101eeaf5e57ffd6da8a2a5ef337e24ea0344ab3ee2bb1`
- 복사 전·후 원본 해시와 복사본의 해시가 일치함을 확인했습니다.
- 이번 차용 기준은 20:39:48의 스냅샷입니다. 원본 프로젝트에서 이후 20:51:11에 파일이 별도로 갱신된 것을 확인했으며, 그 후속 파일과 본 프로젝트의 검증된 스냅샷을 같은 버전으로 간주하지 않습니다.
- 열린 호퍼·스크류·절개 배럴·환형 다이·두 수조·상하 벨트·회전 절단기·중공 스트로 형상을 차용합니다. 원본 프로젝트 파일은 수정하지 않습니다.
- 스트로 원본은 이미지/동영상 재생용이므로, 이 프로젝트에서 GLB로 변환하고 부품별 조작을 연결합니다.

## 모델별 구성과 직접 조작

기존 사출을 포함해 총 8개 공정에 조작 가능한 설비를 제공합니다. 새 컨트롤러가 담당하는 7개 라인은 다음과 같습니다.

| 라인 / 화면 | 구성 | 직접 조작 |
| --- | --- | --- |
| 일반 압출 / 공정 조건 | 단축 절개 압출기 → 스트랜드 다이 → 수조 → 상하 인취 롤 → 펠릿 절단기 | 스크류, 수지 표시, 인취 롤, 절단날 |
| 시트 / 공정 조건 | 평다이 → 3롤 upstack 예시 → 가이드 롤 → 권취 | 스크류, 시트 경로 표시, 냉각 롤, 권취축 |
| 캐스트 필름 / 공정 조건 | 평다이 → 에어 갭 → 칠롤 → 가이드 롤 → 권취 | 스크류, 필름 경로 표시, 칠롤, 권취축 |
| 블로운 필름 / 공정 조건 | 환형 다이·에어 링 → 버블 → 접힘부·닙롤 → 가이드·권취 | 스크류, 흐름 표시, 버블 형상, 닙롤, 권취축 |
| 압출 블로우 성형 / 공정 조건 | 압출 헤드 → 중공 패리슨 → 분할 금형·블로우 핀 → 팽창·냉각 → 배출 | 패리슨 토출 진행, 금형 개방, 핀 삽입, 팽창 |
| 컴파운딩 / 전용 탭 | 동방향 이축·니딩 블록·사이드 피더·벤트 → 다이·수조·펠릿 절단 | 두 스크류, 사이드 피더, 수지 표시, 인취 롤, 절단날 |
| 스트로 / 전용 탭 | 차용한 단축 압출기·환형 다이·두 수조·상하 벨트·회전 절단기·중공 스트로 | 스크류, 흐름 표시, 벨트 순환, 절단날·절단물 배출 |

자동 재생은 각 동작 그룹의 Blender 트랙을 함께 진행합니다. 연속 공정의 네 단계 설명은 관찰 구간이며, 설비가 단계별로 하나씩만 켜지는 순서를 뜻하지 않습니다. 일반 압출은 스트랜드 펠릿화, 시트는 upstack 배치의 한 예입니다. 블로우 성형은 EBM의 설명용 구성으로, 사출 연신 블로우 성형(ISBM)이나 특정 제조사 장비의 복제 모델이 아닙니다.

`직접 조작`은 초기 위치에서 부품별로 시작하며, 회전각 1°·상대 위치 0.1% 단위 슬라이더와 키보드 화살표를 지원합니다. 일반 동작 설정에서는 목표 위치까지 부드럽게 움직이고, 동작 줄이기 설정에서는 즉시 이동합니다. 한영 전환과 화면 이동 후에도 각 모델의 수동 상태를 보존합니다. 전체·스크류·후단 및 스트로 다이 확대, 측면 보기, 시점 초기화를 제공합니다.

블로우 성형은 **패리슨 100% → 금형 개방 0% → 핀 삽입 100% → 팽창 100% → 핀 삽입 0% → 금형 개방 100%**로 조작하면 제품이 받침으로 배출됩니다. 핀이 들어간 상태의 금형 개방, 열린 금형에서의 팽창을 잠급니다. 이는 설명을 위한 동작 순서 제한이며 실제 장비의 안전 PLC나 인증된 인터록을 재현한 것은 아닙니다.

## 형상·동작 구현

- `scripts/create_line_models.py`가 새 6개 설비를 만들고 보존한 스트로 스냅샷을 변환합니다. 외부 링크 없이 다시 열 수 있는 `.blend`와 웹용 `.glb`, 대체 포스터, 동작 메타데이터를 저장합니다.
- `motion_group` 사용자 속성으로 GLB 트랙을 부품별로 묶습니다. Blender 내보내기의 시작 시간을 0으로 맞춰 웹의 100%·최대 회전각이 실제 키프레임 끝과 일치하게 했습니다.
- 단축 코어는 공급부에서 계량부로 깊이가 달라지고, 이축은 같은 방향으로 회전합니다. 사이드 피더는 절개 하우징 안의 나선형 스크류를 보여줍니다.
- 상하 인취 롤과 스트로 벨트는 수지와 접촉하는 면이 같은 하류 방향으로 이동합니다. 시트의 3롤·캐스트 필름 칠롤·블로운 필름 닙롤 및 후단 롤에서 웹 경로와 접촉 회전 방향을 맞췄습니다.
- 블로운 필름은 실제 메시 형상 키로 버블을 조절하고, 접힘 방향을 닙롤 간극에 맞췄습니다. 반복해서 시점을 바꿔도 흐름 표시의 변위가 누적되지 않게 했습니다.
- 블로우 성형은 패리슨의 위 끝을 헤드에 고정해 아래로 늘리고, 같은 위치의 원통형 메시를 병 형태로 팽창시킵니다. 핀 복귀 후 금형이 열리고, 제품은 금형 위치에서 받침으로 이동합니다.
- 스트로 복사본의 작은 BoltFactory 체결부를 의도한 가시 크기로 조정했습니다. 기존 중공 절단물 메시를 보존해 절단 후 이동·배출, 다음 구간이 길어지는 동작을 추가했습니다.

새 7개 모델은 단일 WebGL 렌더러를 사용하고, 메모리의 모델 캐시는 최대 2개로 제한합니다. 사출을 포함해 현재 활성 화면에만 캔버스를 붙이며, 비활성 탭과 숨긴 문서에서는 재생을 멈춥니다. 로드 실패 시 포스터와 공정 설명을 유지합니다. 직접 조작 중에는 떠 있는 저장 버튼과 모바일 하단 메뉴를 숨겨 슬라이더를 가리지 않게 했습니다.

PC의 직접 조작 화면은 설비와 조작부를 좌우로 배치하고, 공정 근거 패널을 아래로 옮겨 모델의 폭을 확보합니다. 모바일에서는 작은 설비 화면이 상단에 고정되어 마지막 슬라이더를 조작할 때도 동작을 볼 수 있습니다. 자동 공정으로 돌아가면 일반 배치와 하단 메뉴를 복원합니다.

필름·스트랜드의 이동 표시는 질량 추적자가 아니며, 두께·냉각·결정화·체적 보존을 계산하지 않습니다. 버블 형상 %는 BUR가 아닙니다. 스크류 간극·금형 치수·장비 구동비·절단 길이·사이클 시간은 모형 값이며 기존 공정 조건이나 계산기에 되먹이지 않습니다.

## 구조 참고와 용어 검수

공정 조건의 숫자는 기존 GPT-6 Pro 검토 및 제조사 원문 근거를 유지했습니다. 이번 참고 자료는 설비의 구성과 흐름을 대조하는 용도입니다.

- [Coperion STS](https://www.coperion.com/en/products-services/extruders-compounding-machines/sts-twin-screw-extruders), [보조 설비](https://www.coperion.com/en/products-services/extruders-compounding-machines/auxiliary-equipment): 이축 압출·공급·벤트·스트랜드 후단 구성 참고.
- [Davis-Standard Sheet Overview](https://davis-standard.com/DS_wordpress/wp-content/uploads/2022/08/SHEET_Overview_EN.pdf): 여러 롤 스택 배치 중 upstack을 설명용 예시로 선택.
- [LyondellBasell Film Extrusion Guide](https://www.lyondellbasell.com/globalassets/lyb/our-solutions/products/documents/polymers-technical-literature/A_Guide_to_Polyolefin_Film_Extrusion.pdf): 블로운 필름의 접힘·닙롤·인취 구조 참고. PHA 수치 조건의 근거로 사용하지 않음.
- [Kautex Blow Molding](https://www.kautex-group.com/en/our-know-how/blow-molding/): 헤드·패리슨·분할 금형·공기 팽창의 구성 참고. 제조사별 핀·니들·이송 방식의 차이는 단순화.
- 스트로 원본의 제조사 참고 자료: [Conair CPC](https://www.conairgroup.com/product/combination-puller-cutter-cpc-models/), [Davis-Standard Pipe/Profile/Tubing](https://davis-standard.com/extrusion_system/pipe-profile-and-tubing/). 차용 범위는 형상·동작이며 운전 설정값은 아님.

[Claude 검수 원문](../output/claude-all-equipment-terms-review.txt)에 따라 `패리슨 토출량`을 `패리슨 토출 진행`으로, `버블 형상 전개`를 `버블 형상 조절`로 바꿨습니다. 영문 회전 조작명을 `rotation angle`로 명시하고 `Resin marker position`, `Nip roll`, `Chill roll`, `Devolatilization` 표현을 정리했습니다. 검수에는 UI 문구만 전달했습니다.

## 재생성과 검증

```powershell
blender --background --factory-startup --python-exit-code 1 --python scripts/create_line_models.py
blender --background --factory-startup --python-exit-code 1 --python tests/blender-line-models.py
npm run build
$env:PHA_TEST_ROOT='dist'
npm run test:equipment
npm run test:motion
npm run test:ui
npm run test:myai
npm run test:process
npm run check:kb
```

특정 모델만 재생성하려면 스크립트 뒤에 `-- sheet straw`처럼 ID를 지정합니다. 사출은 기존 `scripts/create_injection_motion.py`를 사용합니다. Blender 원본과 차용 스냅샷은 배포에서 제외하며, 로컬 Three.js·8개 GLB·포스터는 v20 서비스워커에서 오프라인용으로 캐시합니다.

- Blender 원본: 15개 검사 통과. 7개 모델의 외부 링크·동작 그룹, 축 정렬, 접촉 방향, 웹/롤 간극, 패리슨 기준점, 병의 금형 내 위치, 핀 복귀·배출, 스트로 스냅샷·벨트·절단물을 검사. [결과](../output/blender-all-equipment-check.json).
- 새 7개 설비: 배포 산출물에서 12개 검사 통과. 실제 GLB 트랙·끝값·부품 좌표·형상 키·수동 조작·키보드, PC/모바일·한영 상태 유지, 모바일 마지막 슬라이더와 모델의 동시 가시성, 오프라인, 로드 실패·다른 설비 복구 포함. [결과](../output/playwright/all-equipment/results.json), [스트로 PC](../output/playwright/all-equipment/straw-desktop.png), [모바일 조작 중 설비](../output/playwright/all-equipment/straw-mobile-controls-visible.png), [블로우 성형 팽창](../output/playwright/all-equipment/blowmolding-expanded.png).
- 기존 사출: 배포 산출물에서 12개 동작 검사 통과. [결과](../output/playwright/injection-motion/results.json).
- 기존 UI: 배포 산출물에서 22개 검사 통과. 공정·가이드의 한영/데스크톱·모바일 32개 조합, 입력·저장 기록 보존, 계산과 오프라인 동작 포함.
- 계산/근거 9개, KB 16개 항목 일치, My AI 회귀 검사 통과.
- v20 소스/배포 JS·CSS·HTML 및 GLB의 바이트 일치, 8개 GLB 총 9.68 MiB, Blender 원본의 배포 제외, JavaScript 구문과 `git diff --check`를 확인했습니다. 로컬 미리보기에서 실제 스트로의 스크류·벨트·절단날 조작과 PC의 설비/조작부 동시 표시를 확인했습니다.
