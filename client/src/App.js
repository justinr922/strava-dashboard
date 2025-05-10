import React, { useEffect, useState } from 'react';
import axios from 'axios';

import ActivityTable from './components/ActivityTable';
import ActivityDetail from './components/ActivityDetail';
import AthleteProfile from './components/AthleteProfile';

import useAuth from './hooks/useAuth';

import './App.css';

const ACTIVITY_CACHE_TTL = 60 * 60 * 1000 * 24

function App() {
  const { auth, setAuth, maybeRefreshToken, logout } = useAuth();
  const [athlete, setAthlete] = useState(null);
  const [activities, setActivities] = useState(() => {
    const cached = localStorage.getItem('activities');
    const cachedAt = localStorage.getItem('activities_cached_at');
    if (cached && cachedAt) {
      const age = Date.now() - parseInt(cachedAt, 10);
      if (age < ACTIVITY_CACHE_TTL) {
        return JSON.parse(cached);
      }
    }
    return [];
  });
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const res = await axios.get(`/api/athlete?access_token=${auth.accessToken}`);
        setAthlete(res.data);
      } catch (err) {
        console.error('Error fetching athlete:', err);
        alert('You may need to log in.');
      }
    };

    const now = Math.floor(Date.now() / 1000);
    if (auth && auth.expiresAt > now && !athlete) {
      fetchAthlete();
    }
  }, [auth, athlete]);

  const fetchActivities = async () => {
    try {
      await maybeRefreshToken();
      const res = await axios.get(`/api/activities?access_token=${auth.accessToken}`);
      setActivities(res.data);
      localStorage.setItem('activities', JSON.stringify(res.data));
      localStorage.setItem('activities_cached_at', Date.now().toString());
    } catch (err) {
      console.error('Error fetching activities:', err);
      alert('You may need to log in.');
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Strava Activity Analysis
      </h1>

      {!auth && (
        <div className="flex justify-center">
          <a href="http://localhost:3000/auth/strava">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow">
              Connect with Strava
            </button>
          </a>
        </div>
      )}

      {auth && (
        <>
          <div className="flex justify-center mb-6 gap-4">
            <button
              onClick={fetchActivities}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
            >
              Fetch Activities
            </button>
            <div className="flex items-center gap-4">
              <AthleteProfile athlete={athlete} />
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="flex gap-6 justify-center">
            <div className="justify-center">
              <ActivityTable
                activities={activities}
                setSelectedActivity={setSelectedActivity}
                selectedActivity={selectedActivity}
              />
            </div>

            {selectedActivity && (
              <div className="sticky top-6" style={{ alignSelf: 'flex-start', flexGrow: 1 }}>
                <ActivityDetail activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
