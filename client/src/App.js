import React, { useEffect, useState } from 'react';

import HeaderBar from './components/HeaderBar';
import ActivityTable from './components/ActivityTable';
import ActivityDetail from './components/ActivityDetail';

import useAuth from './hooks/useAuth';
import { fetchAthlete as fetchAthleteAPI, fetchActivities as fetchActivitiesAPI } from './api/api';

import './App.css';

const ACTIVITY_CACHE_TTL = 60 * 60 * 1000 * 24

function App() {
  const { auth, maybeRefreshToken, logout } = useAuth();
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
    const fetchAthleteOnce = async () => {
      const now = Math.floor(Date.now() / 1000);
      if (!auth || auth.expiresAt <= now || athlete) return;
  
      try {
        const data = await fetchAthleteAPI(auth.accessToken); 
        setAthlete(data);
      } catch (err) {
        console.error('Error fetching athlete:', err);
      }
    };
  
    fetchAthleteOnce();
  }, [auth, athlete]);
  

  const fetchActivities = async () => {
    try {
      await maybeRefreshToken();
      const data = await fetchActivitiesAPI(auth.accessToken);
      setActivities(data);
      localStorage.setItem('activities', JSON.stringify(data));
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
          <HeaderBar athlete={athlete} onFetch={fetchActivities} onLogout={logout} />

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
