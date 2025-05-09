import React from "react";

const formatSpeed = (speedMps, type) => {
    if (!speedMps) return "-";
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
    return `${speedMps.toFixed(2)} m/s`;
};

const ActivityTable = ({ activities, setSelectedActivity, selectedActivity }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-md text-gray-500">
                No activities found.
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-xl shadow-md overflow-x-auto">
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
                            className={`rounded-xl shadow p-4 cursor-pointer transition
                                ${selectedActivity?.id === act.id
                                ? 'bg-blue-100 border-2 border-blue-500'
                                : 'bg-white hover:bg-blue-50'}`
                            }
                            onClick={() => setSelectedActivity({ ...act, formattedSpeed: formatSpeed(act.average_speed, act.type) })} style={{ cursor: 'pointer' }}
                            >
                            <td className="px-4 py-2 border-b">{act.start_date_local.slice(0, 10)}</td>
                            <td className="px-4 py-2 border-b">{act.name}</td>
                            <td className="px-4 py-2 border-b">{act.type}</td>
                            <td className="px-4 py-2 border-b">
                                {(act.distance / 1609.34).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 border-b">{(act.moving_time / 60).toFixed(1)}</td>
                            <td className="px-4 py-2 border-b">
                                {formatSpeed(act.average_speed, act.type)}
                            </td>
                            <td className="px-4 py-2 border-b">{((act.kilojoules || 0) * 4 / 4.184).toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ActivityTable;
