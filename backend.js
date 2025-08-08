import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { upsertUserTokens, getUserByAthleteId, deleteUserByAthleteId } from './server/db.js';
import { signAppToken, requireAppAuth } from './server/auth.js';


const isProduction = process.env.NODE_ENV?.trim() === 'production'.trim();

const app = express();
const port = 3000;
const REDIRECT_URI = process.env.RENDER ? process.env.RENDER_EXTERNAL_URL : process.env.REDIRECT_URI
console.log(process.env.RENDER, REDIRECT_URI)

import { initDb } from './server/db.js';

app.use(express.json());

async function refreshStravaTokenIfNeeded(user) {
  const now = Math.floor(Date.now() / 1000);
  if (user.strava_expires_at && user.strava_expires_at > now + 60) {
    return user; // still valid (60s leeway)
  }
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: user.strava_refresh_token,
  });
  const response = await axios.post('https://www.strava.com/api/v3/oauth/token', params);
  const { access_token, refresh_token, expires_at } = response.data;
  await upsertUserTokens({
    athleteId: user.strava_athlete_id,
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: expires_at,
  });
  return {
    ...user,
    strava_access_token: access_token,
    strava_refresh_token: refresh_token,
    strava_expires_at: expires_at,
  };
}

app.use(cors({
  origin: 'http://localhost:3001',
}));

// Basic GET endpoint to test server connectivity
app.get('/ping', (req, res) => {
  res.send('Server is up and running!');
});

// Step 1: Redirect user to Strava's authorization page
app.get('/auth/strava', (req, res) => {
    console.log('Redirecting to Strava authorization page...');
  const redirect_uri = `${REDIRECT_URI}/auth/strava/callback`;
  res.redirect(
    `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirect_uri}&scope=read,activity:read_all`
  );
});

// Step 2: Handle the callback from Strava
app.get('/auth/strava/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const response = await axios.post(
      'https://www.strava.com/oauth/token',
      {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }
    );

    const { access_token, athlete, refresh_token, expires_at } = response.data;
    console.log('Received tokens from Strava:',code,  response.data);
    // Persist Strava tokens server-side keyed by athlete id
    await upsertUserTokens({
      athleteId: athlete.id,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expires_at,
    });

    // Issue app JWT (7 days)
    const appToken = signAppToken(athlete.id);

    // Redirect to frontend with only the app token
    res.redirect(301, `${REDIRECT_URI}/?app_token=${appToken}`);
  } catch (error) {
    console.error(error || error.message);
    res.status(500).send('Authentication failed.');
  }
});

// No longer needed on client; server refreshes internally. Keep for compatibility but require app auth and do nothing.
app.post('/refresh-token', requireAppAuth, async (req, res) => {
  res.status(204).send();
});

app.get('/api/athlete', requireAppAuth, async (req, res) => {
  try {
    // Load user and refresh token if needed
    let user = await getUserByAthleteId(req.auth.athleteId);
    if (!user) return res.status(404).send('User not found');
    user = await refreshStravaTokenIfNeeded(user);

    const response = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${user.strava_access_token}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Failed to fetch athlete');
  }
});

app.post('/logout', requireAppAuth, async (req, res) => {
  try {
    const user = await getUserByAthleteId(req.auth.athleteId);
    if (user?.strava_access_token) {
      await axios.post(`https://www.strava.com/oauth/deauthorize?access_token=${user.strava_access_token}`);
    }
    await deleteUserByAthleteId(req.auth.athleteId);
    res.status(204).send();
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/activities', requireAppAuth, async (req, res) => {
  try {
    let user = await getUserByAthleteId(req.auth.athleteId);
    if (!user) return res.status(404).send('User not found');
    user = await refreshStravaTokenIfNeeded(user);

    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${user.strava_access_token}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Failed to fetch activities');
  }
});

if (isProduction) {
  console.log('using prod')
  app.use(express.static(path.join(import.meta.dirname, 'client/build')));

  app.get('/*fallback', (req, res) => {
    res.sendFile(path.join(import.meta.dirname, 'client/build', 'index.html'));
  });
}

// Initialize DB then start server
(async () => {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`Server running at ${REDIRECT_URI}`);
    });
  } catch (e) {
    console.error('DB init failed', e);
    process.exit(1);
  }
})();
