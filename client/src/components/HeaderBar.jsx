import React from 'react';
import AthleteProfile from './AthleteProfile';

const HeaderBar = ({ athlete, onFetch, onLogout }) => (
  <div className="flex justify-center mb-6 gap-4">
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
