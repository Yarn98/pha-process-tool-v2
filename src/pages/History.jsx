import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

const STORAGE_KEY = 'pha:v2:process-history';

const tabs = [
  { to: '/process', label: '공정 조건' },
  { to: '/troubleshooting', label: '트러블슈팅' },
  { to: '/history', label: '이력 관리' },
  { to: '/analysis', label: '데이터 분석' },
  { to: '/settings', label: '설정' },
];

const History = () => {
  const [snapshots, setSnapshots] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSnapshots(parsed);
      }
    } catch (error) {
      console.error('Failed to load history snapshots', error);
    }
  }, []);

  return (
    <section className="page p-4 max-w-4xl mx-auto">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">공정 조건 이력</h1>
        <p className="mt-1 text-sm text-slate-600">
          저장 버튼을 누를 때마다 현재 설정이 스냅샷으로 보존됩니다. CSV 혹은 JSON으로 추출하여 배포 라인과 공유하세요.
        </p>
      </header>

      <nav className="tabs mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {snapshots.length === 0 ? (
        <div className="card p-6 text-sm text-slate-600">
          아직 저장된 스냅샷이 없습니다. 공정 조건 탭에서 설정을 입력하고 “저장 및 분석”을 눌러 기록을 쌓아보세요.
        </div>
      ) : (
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="card p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{snapshot.label}</h2>
                  <p className="text-xs text-slate-500">{new Date(snapshot.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 text-xs text-slate-500">
                  <span>Sample: {snapshot.sampleSeries}</span>
                  <span>Process: {snapshot.processType}</span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {snapshot.parameters.map((parameter) => (
                  <div key={parameter.parameter} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-xs font-semibold text-slate-600">{parameter.parameter}</div>
                    <div className="text-sm">현재값: {parameter.current ?? '-'}</div>
                    <div className="text-xs text-slate-500">
                      권장: {parameter.rangeMin}–{parameter.rangeMax} ({parameter.status})
                    </div>
                  </div>
                ))}
              </div>
              {snapshot.note && <p className="mt-3 text-xs text-slate-600">메모: {snapshot.note}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default History;
