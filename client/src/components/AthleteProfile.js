// src/AthleteProfile.js
import React from 'react';

export default function AthleteProfile({ athlete }) {
  if (!athlete) return null;

  return (
    <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow">
      <img
        src={athlete.profile}
        alt="avatar"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="text-sm">
        <div className="font-semibold">{athlete.firstname} {athlete.lastname}</div>
        <div className="text-gray-500">{athlete.username}</div>
      </div>
    </div>
  );
}