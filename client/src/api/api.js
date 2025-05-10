import axios from 'axios';

export const fetchAthlete = async (accessToken) => {
  const res = await axios.get(`/api/athlete?access_token=${accessToken}`);
  return res.data;
};

export const fetchActivities = async (accessToken) => {
  const res = await axios.get(`/api/activities?access_token=${accessToken}`);
  return res.data;
};

export const refreshToken = async (refreshToken) => {
  const res = await axios.post('http://localhost:3000/refresh-token', {
    refresh_token: refreshToken,
  });
  return res.data;
};