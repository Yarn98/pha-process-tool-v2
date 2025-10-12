# PHA 공정 최적화 도구

PHA(Polyhydroxyalkanoate) 공정과 소재 특성을 한 번에 비교·분석할 수 있는 리치 대시보드입니다. S1000P와 A1000P 두 등급을 대상으
로 열적·기계적 특성, 가공 윈도우, 구조-물성 상관성, 적용 가능 분야를 탭 단위로 살펴볼 수 있으며, 현장 DOE를 바로 실행할 수 있는 CSV
템플릿·파이썬 스크립트·SOP 패키지를 함께 제공합니다.

## 주요 기능

- **Polymer 선택 카드**: P34HB S1000P와 A1000P 카드 중 하나를 선택하면 모든 탭의 그래프, 수치, 설명이 즉시 갱신됩니다.
- **Thermal 탭**: DMA 데이터(저장 탄성률, tan δ)를 온도 축으로 시각화하고 CSV로 내려받을 수 있습니다.
- **Mechanical 탭**: 로그 스케일 막대그래프로 기계적 물성을 비교하고 자동 생성된 해설을 제공합니다.
- **Processing 탭**: 융점/금형 온도/사출 압력/냉각시간을 범위 + 권장치 형태로 표시해 세팅값을 빠르게 결정합니다.
- **Structure 탭**: 결정성에 따른 Tg/Tm, 밀도, 생분해 속도 등의 변화를 그래프와 노트로 제공해 조성 설계를 돕습니다.
- **Applications 탭**: Radar 차트와 추천 리스트로 용도 적합성을 한눈에 확인할 수 있습니다.
- **Analytics 탭**: Crystallization window, modulus retention, 열분해 안전 여유 등 핵심 KPI를 실시간 계산해 보여줍니다.
- **Field DOE Kit 탭**: 사출 플래시 DOE 템플릿, 자동 분석 스크립트, SOP 체크리스트를 바로 다운로드할 수 있습니다.

## 현장 DOE 실행 세트

`public/` 디렉터리에 다음 파일이 포함되어 있어 정적 호스팅 시 그대로 배포할 수 있습니다.

| 파일 | 설명 |
| --- | --- |
| `doe_injection_flash_template.csv` | S1000P/A1000P 사출 플래시 최소화 & 용접선 강도 확보 DOE 입력용 템플릿 (UTF-8, 헤더 고정) |
| `analyze_doe_flash.py` | 2차 반응표면 + LASSO 선택 기반 플래시 최소화 권장조건 산출 스크립트 |
| `SOP_field_run_checklist.md` | 현장 실험 전·중·후 체크리스트 및 데이터 품질 가이드 |

### 빠른 실행 루프

1. 템플릿 CSV에 실험값을 기록하고 빈 응답열(flash, weld strength 등)을 측정 후 채웁니다.
2. `python analyze_doe_flash.py doe_injection_flash_template.csv`
3. 생성된 `results/recommendations.txt` 조건으로 5주기 재검증을 수행합니다.
4. 재검증 데이터를 CSV에 추가한 뒤 스크립트를 재실행해 모델을 업데이트합니다.

`patches/tars_doe_autofit_loop_fix.patch`는 TARS DOE 탭의 자동 재피팅 루프를 방지하기 위한 선택적 패치입니다.

## Python IGC → χ 변환 (기존 유틸리티)

`igc_chi.py`는 역기체 크로마토그래피(IGC) 데이터에서 Hansen 거리 및 Flory–Huggins χ 값을 계산하는 유틸리티입니다.

```bash
python igc_chi.py --csv igc_inputs.csv --temp_c 120 --vbar_cm3mol 100 --out result.csv
```

결과 파일에는 시료별 Ra, χ, 혼화성 판정이 포함됩니다.

## 개발 및 배포

```bash
npm install
npm run dev    # 로컬 개발 서버 (http://localhost:5173)
npm run build  # Cloudflare Pages 등 정적 호스팅용 번들 생성
```

Vite 빌드는 `public/` 디렉터리에 있는 DOE 세트, Excel 툴킷, `_redirects` 파일을 함께 복사합니다. Cloudflare Pages에서는 빌드 명령을
`npm run build`, 출력 디렉터리를 `dist`로 설정하세요.
