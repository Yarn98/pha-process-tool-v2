import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

const HISTORY_KEY = 'pha:v2:process-history';

const tabs = [
  { to: '/process', label: '공정 조건' },
  { to: '/troubleshooting', label: '트러블슈팅' },
  { to: '/history', label: '이력 관리' },
  { to: '/analysis', label: '데이터 분석' },
  { to: '/settings', label: '설정' },
];

const Analysis = () => {
  const [snapshots, setSnapshots] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSnapshots(parsed);
      }
    } catch (error) {
      console.error('Failed to load snapshots for analysis', error);
    }
  }, []);

  const stats = useMemo(() => {
    if (snapshots.length === 0) return null;
    const parameterMap = new Map();

    snapshots.forEach((snapshot) => {
      snapshot.parameters.forEach((parameter) => {
        if (!parameterMap.has(parameter.parameter)) {
          parameterMap.set(parameter.parameter, []);
        }
        const list = parameterMap.get(parameter.parameter);
        const numeric = Number(parameter.current);
        if (!Number.isNaN(numeric)) {
          list.push(numeric);
        }
      });
    });

    const summary = [];
    parameterMap.forEach((values, key) => {
      if (values.length === 0) return;
      const total = values.reduce((sum, value) => sum + value, 0);
      const avg = total / values.length;
      const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
      summary.push({
        parameter: key,
        count: values.length,
        average: Number(avg.toFixed(2)),
        stddev: Number(Math.sqrt(variance).toFixed(2)),
      });
    });

    return summary.sort((a, b) => a.parameter.localeCompare(b.parameter));
  }, [snapshots]);

  return (
    <section className="page p-4 max-w-4xl mx-auto">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">데이터 분석</h1>
        <p className="mt-1 text-sm text-slate-600">
          저장된 스냅샷을 기반으로 각 파라미터의 평균과 표준편차를 산출합니다. 공정 안정성 모니터링에 활용하세요.
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
          분석할 스냅샷이 없습니다. 공정 조건 탭에서 데이터를 저장하면 통계가 자동으로 계산됩니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table min-w-[480px]">
            <thead>
              <tr>
                <th>파라미터</th>
                <th>표본 수</th>
                <th>평균</th>
                <th>표준편차</th>
              </tr>
            </thead>
            <tbody>
              {stats?.map((row) => (
                <tr key={row.parameter}>
                  <td>{row.parameter}</td>
                  <td>{row.count}</td>
                  <td>{row.average}</td>
                  <td>{row.stddev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default Analysis;
