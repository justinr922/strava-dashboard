import { useEffect, useState } from 'react';
import axios from 'axios';

export default function useAuth() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
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
    if (!auth || auth.expiresAt > now) return;

    try {
      const res = await axios.post('/refresh-token', {
        refresh_token: auth.refreshToken,
      });
      const { access_token, refresh_token, expires_at } = res.data;
      const newAuth = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
      };
      setAuth(newAuth);
      localStorage.setItem('auth', JSON.stringify(newAuth));
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('activities');
  };

  return { auth, setAuth, maybeRefreshToken, logout };
}
