import React from "react";
import AthleteProfile from "../components/AthleteProfile";

export default function ProfilePage({ athlete }) {
  return (
    <div className="flex justify-center">
      <div className="max-w-xl w-full">
        <h2 className="text-2xl font-semibold mb-4">Profile</h2>
        <AthleteProfile athlete={athlete} />
      </div>
    </div>
  );
}

