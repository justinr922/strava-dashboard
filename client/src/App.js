import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [accessToken, setAccessToken] = useState('');
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      setAccessToken(token);
      localStorage.setItem('access_token', token); // optionally persist
      window.history.replaceState({}, document.title, '/'); // clean up URL
    } else {
      const stored = localStorage.getItem('access_token');
      if (stored) setAccessToken(stored);
    }
  }, []);

  const logout = () => {
    setAccessToken('');
    localStorage.removeItem('access_token');
  };

  const fetchActivities = async () => {
    try {
      const res = await axios.get(`/api/activities?access_token=${accessToken}`);
      setActivities(res.data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      alert('You may need to log in.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Strava Activity Viewer</h1>

      {!accessToken && (
        <a href="http://localhost:3000/auth/strava">
          <button>Connect with Strava</button>
        </a>
      )}

      {accessToken && (
        <>
          <button onClick={fetchActivities}>Fetch Activities</button>
          <button onClick={logout} style={{ marginLeft: '1rem' }}>Logout</button>
          <ul>
            {activities.map((act) => (
              <li key={act.id}>
                <strong>{act.name}</strong> — {act.type} — {(act.distance / 1000).toFixed(2)} km
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
