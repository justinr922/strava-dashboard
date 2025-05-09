import React, { useEffect, useState } from 'react';
import axios from 'axios';

import ActivityTable from './components/AtivityTable';
import ActivityDetail from './components/ActivityDetail';

import './App.css';

function App() {
  const [auth, setAuth] = useState('');
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);

    const accessToken = urlParams.get('token');
    const refreshToken = urlParams.get('refresh_token');
    const expiresAt = urlParams.get('expires_at');

    if (accessToken && refreshToken && expiresAt) {
      const authData = { accessToken, refreshToken, expiresAt };
      localStorage.setItem('auth', JSON.stringify(authData));
      setAuth(authData);
      window.history.replaceState({}, document.title, '/');
    } else {
      const stored = localStorage.getItem('auth');
      if (stored) setAuth(JSON.parse(stored));
    }
  }, []);

  const maybeRefreshToken = async () => {
    const now = Math.floor(Date.now() / 1000);
    if (auth.expiresAt > now) return;

    try {
      const res = await axios.post('http://localhost:3000/refresh-token', {
        refresh_token: auth.refreshToken,
      });
      console.log('Token refreshed:', res.data);
      const { access_token, refresh_token, expires_at } = res.data;
      const newAuth = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
      };
      setAuth(newAuth);
      localStorage.setItem('auth', JSON.stringify(newAuth));
    } catch (err) {
      console.error('Failed to refresh token:', err);
      alert('Session expired. Please log in again.');
      logout();
    }
  };


  const logout = () => {
    setAuth('');
    localStorage.removeItem('auth');
  };

  const fetchActivities = async () => {
    try {
      await maybeRefreshToken();
      const res = await axios.get(`/api/activities?access_token=${auth.accessToken}`);
      setActivities(res.data);
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
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded shadow"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-6 justify-center">
            <div className="flex-2 justify-center">
              <ActivityTable activities={activities} setSelectedActivity={setSelectedActivity} selectedActivity={selectedActivity} />
            </div>

            {/* Activity Detail Panel */}
              <div className="sticky top-6" style={{alignSelf:"flex-start", flexGrow: 1}}>
                {selectedActivity && (
                <ActivityDetail activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
              )}
              </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
