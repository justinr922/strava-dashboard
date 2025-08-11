import React from 'react';
import { NavLink } from 'react-router-dom';
import AthleteProfile from './AthleteProfile';

const HeaderBar = ({ athlete, onFetch, onLogout }) => (
  <div className="flex justify-center mb-6 gap-6 items-center">
    <nav className="flex gap-3">
      <NavLink to="/" className="px-3 py-2 rounded hover:bg-gray-200" end>
        Profile
      </NavLink>
      <NavLink to="/history" className="px-3 py-2 rounded hover:bg-gray-200">
        History
      </NavLink>
    </nav>
    <button
      onClick={onFetch}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
    >
      Fetch Activities
    </button>
    <div className="flex items-center gap-4">
      <AthleteProfile athlete={athlete} />
      <button
        onClick={onLogout}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
      >
        Logout
      </button>
    </div>
  </div>
);

export default HeaderBar;
