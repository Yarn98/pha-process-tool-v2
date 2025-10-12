import React from 'react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/process', label: '공정 조건' },
  { to: '/troubleshooting', label: '트러블슈팅' },
  { to: '/history', label: '이력 관리' },
  { to: '/analysis', label: '데이터 분석' },
  { to: '/settings', label: '설정' },
];

const Troubleshooting = () => (
  <section className="page p-4 max-w-4xl mx-auto">
    <header className="mb-4">
      <h1 className="text-xl font-semibold">트러블슈팅 가이드</h1>
      <p className="mt-1 text-sm text-slate-600">
        장비에서 자주 발생하는 결함을 유형별로 정리했습니다. 공정 조건 탭에서 기록한 데이터를 참고하여 즉시 대응 전략을 결정하세요.
      </p>
    </header>

    <nav className="tabs mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
          {tab.label}
        </NavLink>
      ))}
    </nav>

    <div className="space-y-4 text-sm">
      <div className="card p-4">
        <h2 className="text-base font-semibold text-red-600">사출 불량 · 은줄(Silver Streak)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Zone 1–2 온도가 권장 범위보다 낮거나, 예열이 충분하지 않은 경우입니다.</li>
          <li>공정 조건 탭에서 용융 압력과 금형 온도를 확인하고, 재료 건조 시간을 늘리세요.</li>
          <li>게이트 부근에서 과도한 전단이 발생하면 스크류 속도를 10% 낮춰 해결할 수 있습니다.</li>
        </ul>
      </div>

      <div className="card p-4">
        <h2 className="text-base font-semibold text-amber-600">필름 · 압출 라인 편두 현상</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Die 온도가 권장 범위보다 높거나, 냉각 탱크 온도가 너무 낮을 때 발생합니다.</li>
          <li>라인 속도를 5 m/min 줄이고 Zone 3 이후 온도를 3°C씩 조정하여 안정화를 확인하세요.</li>
          <li>필요 시 공정 조건 탭에서 수정한 권장 범위를 다시 저장해 팀과 공유합니다.</li>
        </ul>
      </div>

      <div className="card p-4">
        <h2 className="text-base font-semibold text-blue-600">점도 상승 · 스크류 토크 경고</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>수지 내 수분이 남아 있거나, Zone 4가 권장값보다 낮을 수 있습니다.</li>
          <li>스크류 속도를 줄이는 대신 사출 시간과 보압 프로파일을 조정해 균형을 맞추세요.</li>
          <li>분석 탭에서 토크 로그와 비교하면 추세 파악이 쉽습니다.</li>
        </ul>
      </div>
    </div>
  </section>
);

export default Troubleshooting;
