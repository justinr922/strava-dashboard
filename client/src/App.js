import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import HeaderBar from './components/HeaderBar';
import useAuth from './hooks/useAuth';
import { fetchAthlete as fetchAthleteAPI, fetchActivities as fetchActivitiesAPI } from './api/api';

import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';

import './App.css';

const ACTIVITY_CACHE_TTL = 60 * 60 * 1000 * 24
function App() {
  const { auth, logout } = useAuth();
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
      if (!auth || athlete) return;

      try {
        const data = await fetchAthleteAPI(auth.appToken);
        setAthlete(data);
      } catch (err) {
        console.error('Error fetching athlete:', err);
      }
    };

    fetchAthleteOnce();
  }, [auth, athlete]);


  const fetchActivities = async () => {
    try {
      const data = await fetchActivitiesAPI(auth.appToken);
      setActivities(data);
      localStorage.setItem('activities', JSON.stringify(data));
      localStorage.setItem('activities_cached_at', Date.now().toString());
    } catch (err) {
      console.error('Error fetching activities:', err);
      alert('You may need to log in.');
    }
  };

  return (
    <BrowserRouter>
      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Strava Activity Analysis
        </h1>

        {!auth && (
          <div className="flex justify-center">
            <a href="/auth/strava">
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow">
                Connect with Strava
              </button>
            </a>
          </div>
        )}

        {auth && (
          <>
            <HeaderBar athlete={athlete} onFetch={fetchActivities} onLogout={logout} />
            <Routes>
              <Route path="/" element={<ProfilePage athlete={athlete} activities={activities} />} />
              <Route
                path="/history"
                element={
                  <HistoryPage
                    activities={activities}
                    selectedActivity={selectedActivity}
                    setSelectedActivity={setSelectedActivity}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
