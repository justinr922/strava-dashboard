import { useEffect, useState } from 'react';
import { logoutBackend } from '../api/api';

export default function useAuth() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const appToken = urlParams.get('app_token');

    if (appToken) {
      const authData = { appToken };
      localStorage.setItem('auth', JSON.stringify(authData));
      setAuth(authData);
      window.history.replaceState({}, document.title, '/');
    } else {
      const stored = localStorage.getItem('auth');
      if (stored) setAuth(JSON.parse(stored));
    }
  }, []);

  const logout = () => {
    logoutBackend(auth?.appToken);
    setAuth(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('activities');
    localStorage.removeItem('activities_cached_at');
  };

  return { auth, setAuth, logout };
}
