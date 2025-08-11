import React from "react";

const formatSpeed = (speedMps, type) => {
  if (type === "Run") {
    const secondsPerMile = 1609.34 / speedMps;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.round(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} min/mi`;
  }
  if (type === "Ride") {
    const mph = speedMps * 2.23694;
    return `${mph.toFixed(1)} mi/h`;
  }
  return `N/A`;
};

const ActivityTable = ({ activities, setSelectedActivity, selectedActivity }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md text-gray-500">
        No activities found.
      </div>
    );
  }

  const onCardClick = (act) =>
    setSelectedActivity({
      ...act,
      formattedSpeed: formatSpeed(act.average_speed, act.type),
    });

  return (
    <div className="w-full">
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        <h2 className="text-xl font-semibold mb-2">Recent Activities</h2>
        {activities.map((act) => (
          <button
            key={act.id}
            onClick={() => onCardClick(act)}
            className={`w-full text-left p-4 rounded-lg border transition
              ${selectedActivity?.id === act.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{act.name}</div>
              <span className="text-xs text-gray-500">{act.start_date_local.slice(0, 10)}</span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {act.type} • {(act.distance / 1609.34).toFixed(1)} mi • {(act.moving_time / 60).toFixed(0)} min • {formatSpeed(act.average_speed, act.type)}
            </div>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block p-6 bg-white rounded-xl shadow-md overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-4">Recent Activities</h2>
        <table className="min-w-full table-auto border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2 border-b">Date</th>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Type</th>
              <th className="px-4 py-2 border-b">Distance (mi)</th>
              <th className="px-4 py-2 border-b">Moving Time (Min)</th>
              <th className="px-4 py-2 border-b">Pace</th>
              <th className="px-4 py-2 border-b">Estimated Moving Calories</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act) => (
              <tr
                key={act.id}
                className={`rounded-xl shadow p-4 cursor-pointer transition ${
                  selectedActivity?.id === act.id
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-white hover:bg-blue-50'
                }`}
                onClick={() => onCardClick(act)}
                style={{ cursor: 'pointer' }}
              >
                <td className="px-4 py-2 border-b">{act.start_date_local.slice(0, 10)}</td>
                <td className="px-4 py-2 border-b">{act.name}</td>
                <td className="px-4 py-2 border-b">{act.type}</td>
                <td className="px-4 py-2 border-b">{(act.distance / 1609.34).toFixed(2)}</td>
                <td className="px-4 py-2 border-b">{(act.moving_time / 60).toFixed(1)}</td>
                <td className="px-4 py-2 border-b">{formatSpeed(act.average_speed, act.type)}</td>
                <td className="px-4 py-2 border-b">{((act.kilojoules || 0) * 4 / 4.184).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityTable;
