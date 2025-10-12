import React from 'react'

const highlights = [
  {
    title: '공정 인사이트 한눈에',
    description:
      'PHA 레진별 핵심 특성과 장비 조건을 하나의 대시보드에서 정리합니다. 아직은 준비 중이지만, 곧 데이터 기반 의사결정이 가능해질 것입니다.'
  },
  {
    title: '실험부터 생산까지 연결',
    description:
      '실험실에서 측정한 TMA, DMA, Rheology 결과를 공정 표준서와 자동으로 연결해 빠르게 최적 조건을 도출합니다.'
  },
  {
    title: '협업을 위한 플랫폼',
    description:
      '연구, 생산, 영업팀이 동일한 화면에서 진행 상황을 공유하고 주석을 남길 수 있도록 설계하고 있습니다.'
  }
]

const roadmap = [
  {
    date: '2024 Q4',
    title: '폐쇄 베타 시작',
    body: '내부 실험 데이터를 연동한 대시보드와 공정 가이드라인 자동 생성 기능을 한정된 사용자와 검증합니다.'
  },
  {
    date: '2025 Q1',
    title: 'Optimizer PWA 공개',
    body: '모바일에서도 공정 조건을 빠르게 조정할 수 있는 경량 PWA를 제공할 예정입니다.'
  },
  {
    date: '2025 Q2',
    title: '파트너사 확대',
    body: '외부 가공 파트너와의 협업을 위해 계정 및 접근 제어 기능을 확장합니다.'
  }
]

const contactChannels = [
  {
    label: '문의 메일',
    value: 'pha-tools@sk.com'
  },
  {
    label: '담당자',
    value: '공정혁신팀 홍길동 책임'
  },
  {
    label: 'Slack',
    value: '#pha-process-tool'
  }
]

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-lg font-semibold text-blue-200">
              PHA
            </span>
            <div>
              <p className="text-lg font-semibold">PHA Processing Tool</p>
              <p className="text-sm text-slate-300">차세대 공정 최적화 플랫폼</p>
            </div>
          </div>
          <a
            href="mailto:pha-tools@sk.com"
            className="hidden rounded-full border border-blue-400/40 px-4 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-300/70 hover:text-white md:inline-flex"
          >
            조기 도입 문의
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1 text-sm text-blue-100">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              Internal Preview
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              PHA 공정을 위한 데이터 기반 의사결정, 지금 준비 중입니다.
            </h1>
            <p className="max-w-xl text-lg text-slate-300">
              실험 데이터와 생산 설비 조건을 하나의 워크플로우로 묶어주는 PHA Processing Tool은 현재 내부 미리보기 단계에 있습니다.
              곧 정식 버전을 통해 공정 혁신의 속도를 높일 수 있도록 준비하고 있습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:pha-tools@sk.com?subject=PHA%20Processing%20Tool%20%EC%A1%B0%EA%B8%B0%20%EB%8F%84%EC%9E%85%20%EB%AC%B8%EC%9D%98"
                className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
              >
                조기 도입 신청하기
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="https://pha.sk.com"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/60"
              >
                제품 소개 살펴보기
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -translate-y-6 translate-x-6 rounded-[3rem] bg-blue-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/80 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
                <span className="text-sm font-medium text-slate-200">PHA 공정 시뮬레이터</span>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200">Preview</span>
              </div>
              <div className="space-y-6 px-6 py-8 text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">선택 Grade</p>
                  <div className="mt-2 flex items-center justify-between rounded-2xl bg-slate-800/70 px-4 py-3">
                    <span className="font-semibold text-white">S1000P</span>
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-100">Pilot</span>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">공정 목표</p>
                    <p className="mt-2 text-sm font-medium text-white">압출 생산량 +12%</p>
                    <p className="mt-1 text-xs text-slate-400">라인 안정화까지 3 Step 남음</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">추천 조건</p>
                    <p className="mt-2 text-sm font-medium text-white">175 ℃ · 140 bar</p>
                    <p className="mt-1 text-xs text-slate-400">Rheology 기반 자동 계산</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Coming soon</p>
                  <p className="mt-2 text-sm font-medium text-white">실험 데이터 업로드 → 즉시 공정 레시피 제안</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-2xl font-semibold text-white">우리가 준비 중인 기능</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/40"
              >
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">로드맵</h2>
            <span className="text-sm text-slate-400">업데이트 소식을 곧 공유드릴게요.</span>
          </div>
          <div className="mt-10 space-y-8">
            {roadmap.map((item) => (
              <div key={item.title} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:gap-8">
                <div className="text-sm font-semibold text-blue-200 md:w-32">{item.date}</div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 rounded-[3rem] border border-blue-400/30 bg-blue-500/10 px-8 py-12 text-center">
          <h2 className="text-3xl font-semibold text-white">함께 공정 혁신을 만들어갈 파트너를 찾고 있습니다.</h2>
          <p className="mt-4 text-base text-blue-100">
            조기 도입에 관심이 있으시다면 아래 채널로 연락을 남겨 주세요. 정식 출시 전 소식을 가장 먼저 전달드리겠습니다.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {contactChannels.map((item) => (
              <div key={item.label} className="rounded-2xl border border-blue-300/40 bg-blue-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-blue-200/80">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/40 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} SK Chemicals · PHA Process Innovation</span>
          <span>현재 페이지는 플레이스홀더 버전입니다.</span>
        </div>
      </footer>
    </div>
  )
}
