import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/tools/chi-delta', label: 'χ–δ Dashboard' },
  { to: '/tools/excel-toolkit', label: 'Excel Toolkit' },
  { to: '/tools/igc-chi', label: 'IGC → χ (Python)' },
];

const TopNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="flex flex-wrap gap-2">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`px-3 py-2 rounded-md border transition-colors text-sm sm:text-base ${
            isActive(item.to)
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default TopNav;
