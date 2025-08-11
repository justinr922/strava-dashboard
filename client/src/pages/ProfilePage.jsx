import AthleteProfile from "../components/AthleteProfile";

export default function ProfilePage({ athlete, activities = [] }) {
  const cachedAt = typeof window !== 'undefined' ? localStorage.getItem('activities_cached_at') : null;
  const lastFetch = cachedAt ? new Date(parseInt(cachedAt, 10)).toLocaleString() : null;

  const hasData = Array.isArray(activities) && activities.length > 0;

  const totalDistanceMiles = hasData
    ? activities.reduce((sum, a) => sum + ((a?.distance || 0) / 1609.34), 0)
    : 0;
  const totalMovingMinutes = hasData
    ? Math.round(activities.reduce((sum, a) => sum + (a?.moving_time || 0), 0) / 60)
    : 0;

  return (
    <div className="flex justify-center">
      <div className="max-w-3xl w-full space-y-6">
        <h2 className="text-2xl font-semibold">Profile</h2>
        <AthleteProfile athlete={athlete} />

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold mb-3">Activity Summary</h3>
          {!hasData ? (
            <p className="text-gray-600">Please fetch activities.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Activities</div>
                <div className="text-2xl font-bold">{activities.length}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Total Distance</div>
                <div className="text-2xl font-bold">{totalDistanceMiles.toFixed(1)} mi</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Total Moving Time</div>
                <div className="text-2xl font-bold">{totalMovingMinutes} min</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Last Fetch</div>
                <div className="text-2xl font-bold text-gray-800">{lastFetch || '—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

