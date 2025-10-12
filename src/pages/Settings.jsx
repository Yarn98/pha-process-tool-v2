import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/process', label: '공정 조건' },
  { to: '/troubleshooting', label: '트러블슈팅' },
  { to: '/history', label: '이력 관리' },
  { to: '/analysis', label: '데이터 분석' },
  { to: '/settings', label: '설정' },
];

const Settings = () => {
  const [autoSave, setAutoSave] = useState(true);
  const [notification, setNotification] = useState('email');

  return (
    <section className="page p-4 max-w-4xl mx-auto">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">환경 설정</h1>
        <p className="mt-1 text-sm text-slate-600">
          공정 조건 도구의 기본 동작을 사용자 환경에 맞춰 조정하세요. 설정은 로컬 스토리지에 저장됩니다.
        </p>
      </header>

      <nav className="tabs mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-5">
        <div className="card p-4">
          <h2 className="text-base font-semibold">자동 저장</h2>
          <p className="mt-1 text-sm text-slate-600">
            입력값을 변경할 때마다 자동으로 로컬 스토리지에 저장합니다. 현장 장비에서 끊김 없이 이어서 작업할 수 있습니다.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(event) => setAutoSave(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              자동 저장 활성화
            </label>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-base font-semibold">알림 방식</h2>
          <p className="mt-1 text-sm text-slate-600">
            공정 조건이 권장 범위를 벗어났을 때 받을 알림 채널을 선택하세요.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {['email', 'slack', 'none'].map((value) => (
              <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <input
                  type="radio"
                  name="notification"
                  value={value}
                  checked={notification === value}
                  onChange={(event) => setNotification(event.target.value)}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {value === 'email' && '이메일'}
                {value === 'slack' && 'Slack'}
                {value === 'none' && '알림 끄기'}
              </label>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-base font-semibold">데이터 초기화</h2>
          <p className="mt-1 text-sm text-slate-600">
            모든 저장된 공정 조건과 이력을 제거합니다. 삭제된 데이터는 복구할 수 없으니 주의하세요.
          </p>
          <button
            type="button"
            className="btn btn-ghost mt-3 text-red-600 hover:text-red-700"
            onClick={() => {
              if (window.confirm('모든 공정 조건 데이터를 삭제하시겠습니까?')) {
                window.localStorage.removeItem('pha:v2:process');
                window.localStorage.removeItem('pha:v2:process-history');
                window.alert('저장된 공정 조건 데이터가 삭제되었습니다.');
              }
            }}
          >
            데이터 삭제
          </button>
        </div>
      </div>
    </section>
  );
};

export default Settings;
