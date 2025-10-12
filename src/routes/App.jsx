import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const loc = useLocation()
  const tabs = [
    { to: '/dashboard', label: '대시보드' },
    { to: '/optimizer', label: 'Optimizer' }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-3 flex items-center justify-between">
        <div className="font-semibold">PHA 공정 최적화 도구</div>
        <nav className="flex gap-2">
          {tabs.map((t) => {
            const isDashboard = t.to === '/dashboard'
            const active = isDashboard
              ? loc.pathname === '/' || loc.pathname.startsWith(t.to)
              : loc.pathname.startsWith(t.to)
            return (
              <Link
                key={t.to}
                className={`px-3 py-1 rounded-md ${active ? 'bg-blue-600 text-white' : 'bg-transparent'}`}
                to={t.to}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
