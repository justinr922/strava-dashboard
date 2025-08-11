import React from 'react';
import { NavLink } from 'react-router-dom';

const HeaderBar = ({ athlete, onFetch, onLogout }) => (
  <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b mb-6">
    <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
      {/* Left: Title */}
      <div className="text-lg font-semibold">Straviewer</div>

      {/* Center: Tabs */}
      <nav className="flex gap-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `px-3 py-2 rounded-md text-sm ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Profile
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `px-3 py-2 rounded-md text-sm ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          History
        </NavLink>
      </nav>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onFetch}
          aria-label="Refresh"
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          title="Refresh"
        >
          <span className="sm:hidden">⟳</span>
          <span className="hidden sm:inline">Fetch Activities</span>
        </button>
        <details className="relative">
          <summary className="flex items-center gap-2 cursor-pointer list-none">
            <img src={athlete?.profile} alt="" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-sm font-medium">{athlete?.firstname}</span>
          </summary>
          <ul className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow">
            <li>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
              >
                Logout
              </button>
            </li>
          </ul>
        </details>
      </div>
    </div>
  </header>
);

export default HeaderBar;
