import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './components/TopNav';

const App = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <TopNav />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default App;
