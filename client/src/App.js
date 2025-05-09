import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [auth, setAuth] = useState('');
  const [activities, setActivities] = useState([]);

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
    <div style={{ padding: '2rem' }}>
      <h1>Strava Activity Viewer</h1>

      {!auth && (
        <a href="http://localhost:3000/auth/strava">
          <button>Connect with Strava</button>
        </a>
      )}

      {auth && (
        <>
          <button onClick={fetchActivities}>Fetch Activities</button>
          <button onClick={logout} style={{ marginLeft: '1rem' }}>Logout</button>
          <table>
            <thead>
              <th>Date</th>
              <th>Name</th>
              <th>Type</th>
              <th>Distance (mi)</th>
              <th>Moving Time (min)</th>
              <th>Pace</th>
              <th>Estimated Moving Calories</th>
            </thead>
            <tbody>
              {activities.map((act) => {
                var speed;
                switch (act.type) {
                  case "Run":
                    const secondsPerMile = 1609.34 / act.average_speed;
                    const minutes = Math.floor(secondsPerMile / 60);
                    const seconds = Math.round(secondsPerMile % 60);
                    speed = `${minutes}:${seconds.toString().padStart(2, '0')} min/mi`;
                  case "Ride":
                    speed = act.average_speed * 2.23694
                    speed = `${speed.toFixed(1)} mph`
                  default:
                    speed = "N/A"
                  }                  
                return (
                <tr key={act.id}>
                  <td>{act.start_date_local.slice(0,10)}</td>
                  <td>{act.name}</td>
                  <td>{act.type}</td>
                  <td>{(act.distance / 1609).toFixed(2)}</td>
                  <td>{(act.moving_time / 60).toFixed(1)}</td>
                  <td>{speed}</td>
                  <td>{( (act.kilojoules || 0) * 4 / 4.184).toFixed(1)}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
