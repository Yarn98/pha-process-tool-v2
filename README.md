# PHA Process Optimizer & Convertor

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production-green.svg)
![License](https://img.shields.io/badge/license-ISC-lightgrey.svg)

**완전 정적(static) HTML/JavaScript 웹 애플리케이션**으로 PHA(Polyhydroxyalkanoate) 사출 성형 공정 최적화 및 단위 변환을 지원합니다.

---

## 📋 목차

1. [개요](#개요)
2. [주요 기능](#주요-기능)
3. [설치 및 배포](#설치-및-배포)
4. [기능 상세 가이드](#기능-상세-가이드)
5. [기술 스택](#기술-스택)
6. [브라우저 호환성](#브라우저-호환성)
7. [문제 해결](#문제-해결)
8. [라이선스](#라이선스)

---

## 개요

이 애플리케이션은 **PHA(Polyhydroxyalkanoate) 바이오플라스틱** 사출 성형 공정의 현장 엔지니어와 품질 관리자를 위한 종합 도구입니다.

### 주요 목적

- **단위 변환**: 사출 성형에서 사용되는 다양한 단위 간 빠른 변환
- **클램프 톤수 계산**: 36 캐비티 금형의 최적 클램프 톤수 산출
- **플래시 저감 가이드**: 체계적인 공정 조건 최적화 방법론 제공
- **현장 로그 관리**: 실시간 공정 조건 기록 및 트렌드 분석
- **지능형 추천 엔진**: 공정 조건 분석을 통한 플래시 저감 방안 자동 제시

---

## 주요 기능

### 1. 단위 변환기 (Unit Converter)

**지원 변환:**
- **압력**: bar ↔ MPa ↔ psi ↔ kgf/cm²
- **온도**: °C ↔ °F ↔ K
- **길이**: mm ↔ cm ↔ inch
- **속도**: mm/s ↔ cm/s ↔ inch/s

**사용 방법:**
1. 변환하려는 단위 유형 선택 (압력/온도/길이/속도)
2. 입력 단위 선택
3. 변환할 값 입력
4. 출력 단위 선택 → 즉시 변환 결과 표시

**특징:**
- 실시간 계산 (입력 즉시 결과 업데이트)
- 소수점 4자리까지 정밀 변환
- 모바일 친화적 UI

---

### 2. 클램프 톤수 계산기 (Clamp Tonnage Calculator)

**36 캐비티 금형**에 특화된 클램프 톤수 계산 도구입니다.

**입력 파라미터:**
- **Grade**: PHA 재료 등급 (CA1180P, S1000P, A1000P, P3HB, P3HB4HB, PHB)
- **제품 투영 면적 (cm²)**: 단일 캐비티 제품의 투영 면적
- **러너/스프루 투영 면적 (cm²)**: 러너 시스템 투영 면적
- **사출압력 (bar)**: 계획된 최대 사출압력

**출력 결과:**
- **총 투영 면적**: 제품 + 러너 면적 합계
- **필요 클램프 톤수 (ton)**: 권장 클램프 톤수
- **안전 계수 적용**: 1.2배 안전 계수 포함

**계산식:**
```
총 투영 면적 = (제품 투영 면적 × 36) + 러너 투영 면적
필요 클램프 톤수 = (총 투영 면적 × 사출압력 × 1.2) / 98.0665
```

**특징:**
- Grade별 특성 자동 반영
- 실시간 계산 및 결과 표시
- 안전 계수 포함 보수적 설계

---

### 3. Flash Control Guide (플래시 저감 가이드)

**6개 탭으로 구성된 체계적 플래시 저감 방법론:**

#### Tab 1: 사출 속도 최적화
- **V0 속도 (스프루/러너 충전)**: 고속 충전으로 전단발열 최소화
- **V1 속도 (캐비티 충전)**: 중속 충전으로 안정적 흐름 유지
- **V2 감속 구간**: End-of-Fill 압력 스파이크 방지

**핵심 원칙:**
- V0: 300-600 mm/s (러너 크기에 따라 조정)
- V1: 120-180 mm/s (제품 형상에 따라 조정)
- V2 감속: 최소 5-8mm 구간 확보

#### Tab 2: 사출압력 조정
- **압력 리밋 설정**: 과도한 압력으로 인한 플래시 방지
- **V0 압력 리밋**: 러너 충전 시 압력 제한
- **보압 설정**: 게이트 동결까지의 최적 보압 유지

**권장값:**
- V0 압력 리밋: 70-80% (기계 최대 압력 기준)
- 사출압력: 800-1200 bar (PHA 재료 특성 고려)
- 보압: 사출압력의 40-60%

#### Tab 3: 온도 관리
- **실린더 온도**: PHA 재료별 최적 온도 범위
- **금형 온도**: 파팅라인 영역 차등 온도 설정
- **냉각 시간**: 충분한 냉각으로 치수 안정성 확보

**PHA 재료별 온도 범위:**
- CA1180P: 실린더 165-175°C, 금형 25-35°C
- S1000P: 실린더 170-180°C, 금형 30-40°C
- P3HB: 실린더 160-170°C, 금형 25-30°C

#### Tab 4: 금형 점검
- **파팅라인 검사**: 마모, 손상, 이물질 확인
- **벤트 점검**: 공기 배출 경로 확보
- **스프루 부싱 점검**: 정확한 노즐 밀착 확인
- **타이바 변형 측정**: 클램프 톤수 균일성 확인

#### Tab 5: 문제 해결 가이드
5가지 주요 문제와 해결책:
1. 🔴 스프루/러너 근처 플래시
2. 🟠 캐비티 충전 불완전 (Short Shot)
3. 🟡 EoF 압력 스파이크
4. 🟢 캐비티 간 무게 편차
5. 🔵 PHA 재료 열화 징후

#### Tab 6: 공정 조건 로그
**실시간 공정 기록 및 분석 시스템** (상세 내용은 하단 참조)

---

### 4. 공정 조건 로그 시스템 (Process Log System)

**완전 기능 공정 관리 플랫폼으로 다음 기능 제공:**

#### 📊 실시간 트렌드 차트

**4가지 차트 유형:**
1. **온도 차트**: 실린더 온도 + 금형 온도 트렌드
2. **압력 차트**: 사출압력 + 보압 트렌드
3. **무게 차트**: 제품 무게 + 러너 무게 + 총 무게 트렌드
4. **시간 차트**: 보압시간 + 냉각시간 트렌드

**기능:**
- **실시간 업데이트**: 로그 수정 시 즉시 차트 반영
- **최근 20개 데이터**: 최신 데이터부터 시간순 표시
- **인터랙티브**: Chart.js 4.4.0 기반 줌/팬 지원
- **반응형 디자인**: 모바일/태블릿 최적화

**사용 방법:**
1. 로그 데이터 입력/수정
2. 차트 타입 버튼 클릭 (온도/압력/무게/시간)
3. 마우스 호버로 상세 값 확인

#### 🔍 검색 및 필터 기능

**3가지 필터링 방식:**
1. **키워드 검색**: 비고란 텍스트 실시간 검색
2. **날짜 범위 필터**: 시작일 ~ 종료일 범위 선택
3. **복합 필터**: 키워드 + 날짜 동시 적용

**특징:**
- **실시간 필터링**: 입력 즉시 결과 표시
- **클라이언트 사이드 처리**: 빠른 응답 속도
- **필터 초기화**: 한 번의 클릭으로 전체 데이터 복원

**사용 방법:**
1. 검색창에 키워드 입력 (예: "플래시", "불량")
2. 날짜 필터 설정 (예: 2025-10-01 ~ 2025-10-31)
3. "필터 초기화" 버튼으로 전체 로그 복원

#### 📋 템플릿 시스템

**자주 사용하는 공정 조건을 템플릿으로 저장하여 빠르게 재사용:**

**템플릿 저장 항목:**
- 실린더 온도
- 금형 온도
- 사출속도
- 사출압력
- 보압
- 보압시간
- 냉각시간
- 저장 일시

**기능:**
1. **💾 템플릿 저장**: 현재 최신 로그의 조건을 템플릿으로 저장
2. **📥 템플릿 불러오기**: 저장된 템플릿 목록에서 선택하여 로그에 적용
3. **🗑️ 템플릿 관리**: 저장된 템플릿 목록 확인 및 삭제

**사용 사례:**
- 표준 공정 조건 템플릿 (예: "표준_CA1180P")
- 계절별 조건 템플릿 (예: "여름용_저온")
- 제품별 조건 템플릿 (예: "제품A_최적조건")

**저장 위치:**
- 브라우저 localStorage에 영구 저장
- 브라우저 삭제 전까지 유지

#### 📸 사진 첨부 기능

**각 로그 엔트리에 사진 첨부 가능:**

**기능:**
- **다중 파일 업로드**: 한 번에 여러 사진 첨부 가능
- **이미지 미리보기**: 썸네일 형태로 첨부된 사진 확인
- **IndexedDB 저장**: 브라우저 내장 데이터베이스에 안전하게 저장
- **파일 크기 제한**: 최대 5MB per file

**지원 형식:**
- JPEG/JPG
- PNG
- GIF
- WebP

**사용 방법:**
1. 로그 테이블의 "사진" 열에서 "📷 첨부" 버튼 클릭
2. 파일 선택 다이얼로그에서 이미지 선택 (다중 선택 가능)
3. 업로드 완료 후 "📷 사진 (N개)" 형태로 표시
4. 클릭하여 첨부된 사진 확인

**주의사항:**
- IndexedDB는 브라우저별 저장 용량 제한 있음 (일반적으로 50MB+)
- 브라우저 캐시 삭제 시 사진도 함께 삭제됨
- 중요 사진은 별도 백업 권장

#### ⚖️ 무게 측정 및 계량 계산기

**제품 무게 기반 계량 계산 및 로그 자동 입력:**

**입력 파라미터:**
1. **제품 1개 무게 (g)**: 단일 캐비티 제품 무게
2. **러너 무게 (g)**: 러너 시스템 전체 무게
3. **캐비티 수**: 기본값 36 (수정 가능)
4. **재료 밀도 (g/cm³)**: 수동 입력 또는 Grade에서 자동 불러오기

**계산 결과:**
- **총 샷 계량 (g)**: (제품 무게 × 캐비티 수) + 러너 무게
- **샷 용적 (cm³)**: 총 샷 계량 / 재료 밀도

**PHA 재료별 밀도 데이터베이스:**
```javascript
CA1180P: 1.25 g/cm³
S1000P:  1.24 g/cm³
A1000P:  1.23 g/cm³
P3HB:    1.25 g/cm³
P3HB4HB: 1.22 g/cm³
PHB:     1.26 g/cm³
기본값:   1.25 g/cm³
```

**사용 방법:**
1. 제품 1개를 저울로 측정하여 무게 입력
2. 러너를 저울로 측정하여 무게 입력
3. "Grade에서 불러오기" 버튼으로 밀도 자동 입력
4. 총 샷 계량 및 용적 자동 계산
5. "⬇️ 최신 로그에 무게 적용" 버튼으로 로그에 자동 입력

**특징:**
- **실시간 계산**: 값 입력 즉시 결과 업데이트
- **자동 로그 연동**: 한 번의 클릭으로 로그에 무게 데이터 적용
- **밀도 자동 조회**: Grade 정보에서 재료 밀도 자동 가져오기

#### 💡 플래시 저감 공정 조건 추천 엔진

**현재 공정 조건을 실시간 분석하여 플래시 저감 방안 자동 제시:**

**분석 파라미터 (5가지):**

1. **사출압력 (Injection Pressure)**
   - 기준값: 900 bar
   - 초과 시: ⚠️ 경고 + 감소 추천 (-50 bar)
   - 근거: 과도한 압력 → 파팅라인 벌어짐 → 플래시 발생

2. **실린더 온도 (Cylinder Temperature)**
   - 기준값: 185°C
   - 초과 시: ⚠️ 주의 + 감소 추천 (-5°C)
   - 근거: 고온 → 점도 감소 → 미세 틈새 침투 증가

3. **사출속도 (Injection Speed)**
   - 기준값: 180 mm/s
   - 초과 시: ⚠️ 주의 + 감소 추천 (-20 mm/s)
   - 근거: 고속 → 압력 스파이크 → 플래시 위험 증가

4. **보압 (Holding Pressure)**
   - 기준값: 700 bar
   - 초과 시: ⚠️ 주의 + 감소 추천 (-50 bar)
   - 근거: 과도한 보압 → 지속적 압력 → 플래시 악화

5. **냉각시간 (Cooling Time)**
   - 기준값: 12초
   - 미달 시: 💡 제안 + 증가 추천 (+2초)
   - 근거: 불충분한 냉각 → 취출 시 변형 → 치수 불안정

**추천 표시 방식:**

각 문제 항목은 **3가지 심각도**로 구분:
- 🔴 **warning** (빨간색): 즉시 조치 필요 (사출압력 과다)
- 🟡 **caution** (노란색): 주의 및 개선 권장 (온도/속도/보압 과다)
- 🟢 **suggestion** (녹색): 품질 향상 제안 (냉각시간 증가)

**추천 형식:**
```
🔴 사출압력 과다
현재 사출압력이 950 bar로 높습니다.
💡 사출압력을 900 bar로 감소시키세요. (약 -50 bar)

🟡 실린더 온도 과다
현재 실린더 온도가 190°C로 높습니다.
💡 실린더 온도를 185°C로 감소시키세요. (약 -5°C, 점도 증가로 플래시 감소)
```

**자동 트리거:**
- 최신 로그 수정 시 자동 실행
- 무게 계산기에서 "최신 로그에 무게 적용" 시 자동 실행
- 로그 테이블의 +/- 버튼으로 값 조정 시 자동 실행

**특징:**
- **실시간 분석**: 로그 수정 즉시 추천 업데이트
- **근거 기반 추천**: 각 추천마다 기술적 근거 제시
- **구체적 수치 제시**: "약간 낮추세요"가 아닌 "-50 bar" 등 구체적 수치
- **우선순위 표시**: 심각도에 따른 색상 구분

#### 로그 데이터 관리

**데이터 입력:**
- **직접 입력**: 각 필드에 직접 값 입력
- **+/- 버튼**: 미세 조정 (온도 ±1°C, 압력 ±10 bar 등)
- **비고 입력**: 현상 및 특이사항 기록

**저장 항목:**
- 일시 (자동 기록)
- 실린더 온도 (°C)
- 금형 온도 (°C)
- 사출속도 (mm/s)
- 사출압력 (bar)
- 보압 (bar)
- 보압시간 (s)
- 냉각시간 (s)
- 제품 무게 (g)
- 러너 무게 (g)
- 총 무게 (g)
- 비고/현상
- 첨부 사진

**데이터 내보내기:**
- **CSV 다운로드**: "CSV 다운로드" 버튼으로 엑셀 호환 CSV 파일 생성
- **UTF-8 BOM 인코딩**: 한글 정상 표시
- **타임스탬프 파일명**: `process_log_YYYYMMDD_HHMMSS.csv`

**저장 위치:**
- **localStorage**: 브라우저에 영구 저장
- **용량**: 일반적으로 5-10MB (수천 개 로그 저장 가능)

---

## 설치 및 배포

### 로컬 실행

이 애플리케이션은 **완전 정적 웹사이트**이므로 웹 서버 없이도 실행 가능합니다.

**방법 1: 브라우저에서 직접 열기**
```bash
# 다운로드 후
D:\My_PJT\Application\pha_optimizer_convertor\index.html 파일을 브라우저에서 열기
```

**방법 2: 로컬 웹 서버 실행 (권장)**
```bash
# Python 3이 설치된 경우
cd D:\My_PJT\Application\pha_optimizer_convertor
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속

# Node.js가 설치된 경우
npx http-server -p 8000
```

### Netlify 배포

**자동 배포 구성:**

1. **Git 저장소 연결**: GitHub, GitLab, Bitbucket 중 선택
2. **Build 설정**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **배포**: 자동 빌드 및 배포 (약 1-2분 소요)

**netlify.toml 구성:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**build.js 스크립트:**
- `index.html`, `custom.js`, `sw.js`, `manifest.webmanifest`, `README.txt` 복사
- `data/`, `icons/` 디렉토리 재귀 복사
- `dist/` 디렉토리 생성 및 파일 배치

### 배포 요구사항

**필수:**
- Node.js (빌드 스크립트 실행용)
- npm (패키지 관리)

**선택:**
- Git (버전 관리 및 자동 배포)
- Netlify CLI (로컬 배포 테스트)

---

## 기능 상세 가이드

### Chart.js 통합

**버전**: Chart.js 4.4.0 (CDN)

**CDN 링크:**
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

**차트 구성:**
```javascript
processChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [...timestamps],
    datasets: [
      {
        label: '실린더 온도 (°C)',
        data: [...temperatures],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    }
  }
});
```

**업데이트 메커니즘:**
- 로그 수정 시 `updateCharts()` 자동 호출
- 최근 20개 데이터만 표시 (성능 최적화)
- 실시간 반영 (애니메이션 포함)

### IndexedDB 사진 저장

**데이터베이스 구조:**
```javascript
Database: ProcessLogPhotos
Version: 1
ObjectStore: photos
  - keyPath: 'id' (auto-increment)
  - Fields:
    - logIndex: number (로그 인덱스)
    - data: string (Base64 인코딩 이미지)
    - name: string (파일명)
    - timestamp: string (ISO 8601)
```

**저장 프로세스:**
1. `FileReader.readAsDataURL()` → Base64 변환
2. IndexedDB transaction 시작
3. `photos` ObjectStore에 추가
4. Transaction 완료 후 로그에 파일명 기록

**용량 관리:**
- 파일당 5MB 제한
- 브라우저별 IndexedDB 용량: 일반적으로 50MB 이상
- 초과 시 사용자에게 경고 메시지

### localStorage 데이터 관리

**저장 항목:**
1. **processLogData**: 공정 로그 전체 데이터 (JSON 배열)
2. **processTemplates**: 템플릿 목록 (JSON 배열)

**데이터 구조:**
```javascript
// processLogData
[
  {
    timestamp: "2025-11-01T10:30:00",
    cylinderTemp: 180,
    moldTemp: 35,
    injectionSpeed: 150,
    injectionPressure: 900,
    holdingPressure: 500,
    holdingTime: 3,
    coolingTime: 15,
    partWeight: 2.5,
    runnerWeight: 8.0,
    totalWeight: 98.0,
    note: "정상 생산",
    photos: ["image1.jpg", "image2.png"]
  }
]

// processTemplates
[
  {
    name: "표준_CA1180P",
    cylinderTemp: 175,
    moldTemp: 30,
    injectionSpeed: 150,
    injectionPressure: 850,
    holdingPressure: 450,
    holdingTime: 3,
    coolingTime: 15,
    savedAt: "2025-11-01 10:30:00"
  }
]
```

**용량 최적화:**
- localStorage 용량: 일반적으로 5-10MB
- JSON 압축 미사용 (가독성 우선)
- 사진은 IndexedDB에 별도 저장 (localStorage 부담 최소화)

---

## 기술 스택

### 프론트엔드

**핵심 기술:**
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, 애니메이션
- **JavaScript (ES6+)**: 모듈화 없이 단일 파일 구성

**라이브러리:**
- **Chart.js 4.4.0**: 데이터 시각화
- **없음**: jQuery, React, Vue 등 프레임워크 미사용

**브라우저 API:**
- **localStorage**: 영구 데이터 저장
- **IndexedDB**: 사진 저장
- **FileReader API**: 파일 읽기
- **Blob API**: CSV 생성 및 다운로드

### 빌드 시스템

**Node.js 스크립트:**
- `build.js`: 정적 파일 복사 스크립트
- `package.json`: NPM 스크립트 정의

**배포 자동화:**
- Netlify: Git push → 자동 빌드 → 배포
- GitHub Actions (선택사항): CI/CD 파이프라인

---

## 브라우저 호환성

### 지원 브라우저

**데스크톱:**
- ✅ Chrome 90+ (권장)
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

**모바일:**
- ✅ Chrome Android 90+
- ✅ Safari iOS 14+
- ✅ Samsung Internet 14+

### 필수 브라우저 기능

**필수:**
- ES6+ 지원 (arrow functions, const/let, template literals)
- localStorage API
- IndexedDB API
- FileReader API
- Blob API
- Canvas API (Chart.js)

**권장:**
- CSS Grid / Flexbox
- Touch Events (모바일)
- Viewport Meta Tag

### 호환성 문제

**IE11 미지원 사유:**
- ES6 문법 사용 (트랜스파일 미적용)
- Arrow functions 사용
- Template literals 사용
- Chart.js 4.x는 IE11 미지원

---

## 문제 해결

### 로그 데이터가 사라짐

**원인:**
- 브라우저 캐시/쿠키 삭제
- 시크릿 모드 사용 (종료 시 데이터 삭제)
- 브라우저 설정에서 "사이트 데이터 삭제" 실행

**해결:**
1. 정기적으로 "CSV 다운로드" 버튼으로 백업
2. 중요 데이터는 외부 저장소에 보관
3. 시크릿 모드 사용 자제

**예방:**
- 주 1회 CSV 백업 실행
- 브라우저 설정에서 localStorage 보존 설정

### 사진이 표시되지 않음

**원인:**
- IndexedDB 용량 초과
- 브라우저 IndexedDB 삭제
- 파일 크기 5MB 초과

**해결:**
1. 콘솔에서 에러 메시지 확인 (F12 → Console)
2. 5MB 이하 파일로 리사이즈 후 재업로드
3. 불필요한 오래된 로그 삭제하여 공간 확보

**권장:**
- 사진 압축 툴 사용 (TinyPNG, ImageOptim 등)
- 해상도 1920×1080 이하로 리사이즈

### 차트가 표시되지 않음

**원인:**
- Chart.js CDN 로딩 실패
- 인터넷 연결 문제
- 브라우저 Canvas API 미지원

**해결:**
1. 네트워크 연결 확인
2. F12 → Network 탭에서 Chart.js CDN 로딩 확인
3. 브라우저 캐시 삭제 후 새로고침 (Ctrl + Shift + R)

**대안:**
- Chart.js 로컬 복사본 사용 (오프라인 환경)

### 필터/검색이 작동하지 않음

**원인:**
- 날짜 형식 불일치
- 특수문자 입력 오류
- 로그 데이터 손상

**해결:**
1. 필터 초기화 버튼 클릭
2. 날짜 입력란에서 달력 선택기 사용
3. 키워드에 특수문자 사용 자제

### 템플릿을 불러올 수 없음

**원인:**
- localStorage 데이터 손상
- 템플릿 JSON 구조 오류
- 브라우저 localStorage 용량 초과

**해결:**
1. F12 → Application → Local Storage 확인
2. `processTemplates` 항목 삭제 후 재생성
3. 브라우저 재시작

### CSV 다운로드 시 한글 깨짐

**원인:**
- 엑셀의 기본 인코딩 (ANSI)과 CSV 인코딩 (UTF-8) 불일치

**해결:**
- 이 앱은 **UTF-8 BOM**을 자동 추가하여 엑셀에서 한글 정상 표시
- 그래도 깨질 경우:
  1. 메모장에서 CSV 열기
  2. "다른 이름으로 저장" → 인코딩: UTF-8
  3. 엑셀에서 "데이터 → 텍스트 파일 가져오기"

### 플래시 추천이 표시되지 않음

**원인:**
- 로그 데이터가 없음
- 모든 파라미터가 정상 범위 내
- JavaScript 오류

**해결:**
1. 먼저 로그를 추가하거나 수정
2. 최신 로그(첫 번째 행)의 값을 조정
3. F12 → Console에서 에러 확인

**정상 동작 조건:**
- processLogData.length > 0
- 최신 로그(index 0) 수정 시 자동 트리거

---

## 자주 묻는 질문 (FAQ)

### Q1: 오프라인에서 사용 가능한가요?

**A:**
- **부분 가능**: 일단 페이지를 로드하면 대부분 기능 사용 가능
- **Chart.js CDN**: 오프라인에서는 차트 기능 미작동
- **완전 오프라인 사용**: Chart.js를 로컬에 복사하여 `<script src="./chart.min.js">`로 변경 필요

### Q2: 여러 사람이 동시에 사용할 수 있나요?

**A:**
- **불가능**: localStorage는 브라우저별로 독립적
- **대안**:
  - 각 사용자가 CSV로 내보내기 → 공유 폴더에 저장
  - Google Sheets 등 클라우드 도구와 병행 사용
  - 서버 기반 백엔드 추가 (향후 개선 사항)

### Q3: 모바일에서도 사용 가능한가요?

**A:**
- **완전 지원**: 터치 최적화 UI
- **권장**: 태블릿 이상 (화면 크기 7인치+)
- **제약**: 스마트폰은 표 가로 스크롤 필요

### Q4: 데이터 보안은 어떻게 되나요?

**A:**
- **로컬 저장**: 모든 데이터가 사용자 브라우저에만 저장
- **서버 전송 없음**: 외부로 데이터 전송 안 함
- **주의**: 공용 PC 사용 시 로그아웃 후 브라우저 데이터 삭제 권장

### Q5: 재료 Grade를 추가하고 싶어요

**A:**
`index.html` 파일 수정:

1. **Grade 선택 옵션 추가** (line ~200):
```html
<select id="grade">
  <option value="CA1180P">CA1180P</option>
  <option value="NEW_GRADE">NEW_GRADE</option> <!-- 추가 -->
</select>
```

2. **밀도 데이터베이스 수정** (line ~2115):
```javascript
const densityDB = {
  'CA1180P': 1.25,
  'NEW_GRADE': 1.28, // 추가
  'default': 1.25
};
```

---

## 향후 개발 계획

### v1.1.0 (계획 중)
- [ ] 다국어 지원 (영어, 중국어)
- [ ] 다크 모드 테마
- [ ] PDF 보고서 생성
- [ ] 로그 비교 기능 (2개 로그 차이 분석)

### v1.2.0 (계획 중)
- [ ] 서버 기반 백엔드 (선택사항)
- [ ] 사용자 계정 및 팀 공유
- [ ] 실시간 협업 기능
- [ ] API 엔드포인트 제공

### v2.0.0 (장기 계획)
- [ ] AI 기반 공정 최적화 추천
- [ ] 머신러닝 플래시 예측 모델
- [ ] IoT 센서 연동 (실시간 데이터 수집)
- [ ] 모바일 앱 (iOS/Android)

---

## 기여 가이드

현재는 개인 프로젝트이지만, 기여를 환영합니다!

**기여 방법:**
1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

**코딩 스타일:**
- 2 spaces indentation
- camelCase for JavaScript
- BEM for CSS (if applicable)
- 한글 주석 권장 (국내 사용자 대상)

---

## 라이선스

**ISC License**

Copyright (c) 2025

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE.

---

## 연락처 및 지원

**프로젝트 관리자**: [Your Name]
**이메일**: [your.email@example.com]
**GitHub**: [https://github.com/yourusername/pha_optimizer_convertor](https://github.com/yourusername/pha_optimizer_convertor)
**Issue Tracker**: [GitHub Issues](https://github.com/yourusername/pha_optimizer_convertor/issues)

---

## 감사의 글

**참고 자료:**
- PHA 재료 데이터: 과학 문헌 및 제조사 데이터시트
- 사출 성형 이론: 플라스틱 가공 표준 문헌
- Chart.js: https://www.chartjs.org/

**기술 지원:**
- MDN Web Docs (JavaScript API)
- Stack Overflow Community
- Netlify Documentation

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-01
**빌드**: production

---

## 부록: API 레퍼런스

### 주요 JavaScript 함수

#### 단위 변환

```javascript
function convert()
```
- **설명**: 입력값을 선택된 단위로 변환
- **파라미터**: 없음 (DOM에서 직접 읽기)
- **반환**: 없음 (DOM에 직접 쓰기)

#### 클램프 톤수 계산

```javascript
function calculateClampTonnage()
```
- **설명**: 36 캐비티 금형 클램프 톤수 계산
- **파라미터**: 없음 (DOM에서 직접 읽기)
- **반환**: 없음 (DOM에 직접 쓰기)

#### 로그 관리

```javascript
function addProcessLog()
```
- **설명**: 새 공정 로그 추가
- **파라미터**: 없음 (DOM에서 직접 읽기)
- **반환**: 없음
- **부수 효과**: localStorage 업데이트, 차트 갱신

```javascript
function updateProcessLogValue(index, field, value)
```
- **설명**: 특정 로그 필드 값 업데이트
- **파라미터**:
  - `index` (number): 로그 인덱스
  - `field` (string): 필드명
  - `value` (number): 새 값
- **반환**: 없음
- **부수 효과**: localStorage 업데이트, 추천 엔진 트리거

```javascript
function deleteProcessLog(index)
```
- **설명**: 로그 삭제
- **파라미터**:
  - `index` (number): 삭제할 로그 인덱스
- **반환**: 없음

#### 필터 및 검색

```javascript
function filterProcessLog()
```
- **설명**: 키워드 및 날짜 필터 적용
- **파라미터**: 없음 (DOM에서 직접 읽기)
- **반환**: 없음
- **전역 변수**: `filteredLogData` 업데이트

```javascript
function clearFilter()
```
- **설명**: 필터 초기화
- **파라미터**: 없음
- **반환**: 없음

#### 템플릿 관리

```javascript
function saveTemplate()
```
- **설명**: 현재 조건을 템플릿으로 저장
- **파라미터**: 없음
- **반환**: 없음
- **부수 효과**: localStorage의 `processTemplates` 업데이트

```javascript
function loadTemplate()
```
- **설명**: 저장된 템플릿 불러오기
- **파라미터**: 없음
- **반환**: 없음
- **사용자 상호작용**: 템플릿 선택 프롬프트

```javascript
function manageTemplates()
```
- **설명**: 템플릿 관리 (목록 표시 및 삭제)
- **파라미터**: 없음
- **반환**: 없음

#### 무게 계산

```javascript
function calculateShotWeight()
```
- **설명**: 총 샷 계량 및 용적 계산
- **파라미터**: 없음 (DOM에서 직접 읽기)
- **반환**: 없음 (DOM에 직접 쓰기)
- **부수 효과**: 추천 엔진 트리거

```javascript
function applyWeightToLog()
```
- **설명**: 계산된 무게를 최신 로그에 적용
- **파라미터**: 없음
- **반환**: 없음
- **부수 효과**: localStorage 업데이트, 차트 갱신, 추천 엔진 트리거

```javascript
function loadDensityFromGrade()
```
- **설명**: Grade 선택값에서 밀도 자동 조회
- **파라미터**: 없음
- **반환**: 없음
- **데이터베이스**: 내장 `densityDB` 객체

#### 추천 엔진

```javascript
function generateFlashRecommendations()
```
- **설명**: 현재 공정 조건 분석 및 플래시 저감 추천 생성
- **파라미터**: 없음
- **반환**: 없음 (DOM에 직접 쓰기)
- **분석 항목**: 사출압력, 실린더 온도, 사출속도, 보압, 냉각시간

#### 사진 관리

```javascript
function attachPhoto(logIndex)
```
- **설명**: 로그에 사진 첨부
- **파라미터**:
  - `logIndex` (number): 로그 인덱스
- **반환**: 없음
- **부수 효과**: IndexedDB에 사진 저장, localStorage 업데이트

```javascript
function viewPhotos(logIndex)
```
- **설명**: 첨부된 사진 보기
- **파라미터**:
  - `logIndex` (number): 로그 인덱스
- **반환**: 없음
- **사용자 상호작용**: 모달 창 표시

#### 차트

```javascript
function initChart()
```
- **설명**: Chart.js 초기화
- **파라미터**: 없음
- **반환**: 없음
- **전역 변수**: `processChart` 생성

```javascript
function showChart(type)
```
- **설명**: 차트 타입 전환
- **파라미터**:
  - `type` (string): 'temp', 'pressure', 'weight', 'time'
- **반환**: 없음
- **부수 효과**: 차트 데이터 및 UI 업데이트

```javascript
function updateCharts()
```
- **설명**: 최신 로그 데이터로 차트 갱신
- **파라미터**: 없음
- **반환**: 없음
- **데이터 소스**: `processLogData` (최근 20개)

#### 데이터 내보내기

```javascript
function downloadCSV()
```
- **설명**: 로그 데이터를 CSV 파일로 다운로드
- **파라미터**: 없음
- **반환**: 없음
- **파일명**: `process_log_YYYYMMDD_HHMMSS.csv`
- **인코딩**: UTF-8 with BOM

---

**End of Documentation**
