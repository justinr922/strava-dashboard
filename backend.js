import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import fs from 'fs';


const isProduction = process.env.NODE_ENV?.trim() === 'production'.trim();

const app = express();
const port = 3000;
const REDIRECT_URI = process.env.REDIRECT_URI

app.use(express.json());
// Database setup for storing Strava tokens
const DB_PATH = process.env.STRAVA_DB_PATH || './data/strava.db';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strava_athlete_id INTEGER UNIQUE NOT NULL,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    strava_expires_at INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const upsertUserTokens = db.prepare(`
  INSERT INTO users (strava_athlete_id, strava_access_token, strava_refresh_token, strava_expires_at)
  VALUES (@athleteId, @accessToken, @refreshToken, @expiresAt)
  ON CONFLICT(strava_athlete_id) DO UPDATE SET
    strava_access_token = excluded.strava_access_token,
    strava_refresh_token = excluded.strava_refresh_token,
    strava_expires_at = excluded.strava_expires_at,
    updated_at = CURRENT_TIMESTAMP
`);

const getUserByAthleteId = db.prepare(`
  SELECT * FROM users WHERE strava_athlete_id = ?
`);

const deleteUserByAthleteId = db.prepare(`
  DELETE FROM users WHERE strava_athlete_id = ?
`);

function signAppToken(athleteId) {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) throw new Error('APP_JWT_SECRET is not set');
  return jwt.sign(
    { sub: String(athleteId), type: 'app', iss: 'strava-dashboard' },
    secret,
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}

function verifyAppToken(token) {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) throw new Error('APP_JWT_SECRET is not set');
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

function requireAppAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).send('Missing Authorization header');
  try {
    const payload = verifyAppToken(token);
    req.auth = { athleteId: parseInt(payload.sub, 10) };
    next();
  } catch (e) {
    return res.status(401).send('Invalid or expired token');
  }
}

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
  upsertUserTokens.run({
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
    upsertUserTokens.run({
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
    let user = getUserByAthleteId.get(req.auth.athleteId);
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
    const user = getUserByAthleteId.get(req.auth.athleteId);
    if (user?.strava_access_token) {
      await axios.post(`https://www.strava.com/oauth/deauthorize?access_token=${user.strava_access_token}`);
    }
    deleteUserByAthleteId.run(req.auth.athleteId);
    res.status(204).send();
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/activities', requireAppAuth, async (req, res) => {
  try {
    let user = getUserByAthleteId.get(req.auth.athleteId);
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

app.listen(port, () => {
  console.log(`Server running at ${REDIRECT_URI}`);
});
