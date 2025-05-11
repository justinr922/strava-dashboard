import { useEffect, useState } from 'react';
import { refreshToken as requestRefreshToken, logoutBackend } from '../api/api';

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
        if (auth.expiresAt > now) return;
    
        try {
        const data = await requestRefreshToken(auth.refreshToken);
        const newAuth = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at,
        };
        setAuth(newAuth);
        localStorage.setItem('auth', JSON.stringify(newAuth));
        } catch (err) {
        console.error('Failed to refresh token:', err);
        logout();
        throw err;
        }
    };

  const logout = () => {
    logoutBackend(auth.accessToken)
    setAuth(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('activities');
    localStorage.removeItem('activities_cached_at');
  };
  

  return { auth, setAuth, maybeRefreshToken, logout };
}
