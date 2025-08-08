import axios from 'axios';

const authHeader = (appToken) => ({ headers: { Authorization: `Bearer ${appToken}` } });

export const fetchAthlete = async (appToken) => {
  const res = await axios.get('/api/athlete', authHeader(appToken));
  return res.data;
};

export const fetchActivities = async (appToken) => {
  const res = await axios.get('/api/activities', authHeader(appToken));
  return res.data;
};

export const logoutBackend = async (appToken) => {
  await axios.post('/logout', null, authHeader(appToken));
};