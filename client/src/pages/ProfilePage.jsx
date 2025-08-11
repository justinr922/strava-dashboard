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

  // Compute earliest and latest activity start times (prefer start_date, fallback to start_date_local)
  const times = hasData ? activities.map(a => new Date(a.start_date || a.start_date_local).getTime()) : [];
  const earliest = hasData && times.length ? new Date(Math.min(...times)) : null;
  const latest = hasData && times.length ? new Date(Math.max(...times)) : null;

  return (
    <div className="px-3 sm:px-6 flex justify-center">
      <div className="max-w-3xl w-full space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold">Profile</h2>
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
                <div className="text-sm text-gray-500">Activity Range</div>
                <div className="text-sm text-gray-700">
                  {earliest && latest ? (
                    <>
                      <div><span className="text-gray-500">Earliest:</span> {earliest.toLocaleString()}</div>
                      <div><span className="text-gray-500">Latest:</span> {latest.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">Last fetch: {lastFetch || '—'}</div>
                    </>
                  ) : (
                    <div className="text-gray-500">—</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

