import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';

const isProduction = process.env.NODE_ENV?.trim() === 'production'.trim();

const app = express();
const port = 3000;
const REDIRECT_URI = process.env.RENDER ? process.env.RENDER_EXTERNAL_URL : process.env.REDIRECT_URI
console.log(process.env.RENDER, REDIRECT_URI)

app.use(express.json());
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

    res.redirect(
        301, 
        `${REDIRECT_URI}/?token=${access_token}&refresh_token=${refresh_token}&expires_at=${expires_at}`      ) // Redirect to frontend with tokens
  } catch (error) {
    console.error(error.response.data);
    res.status(500).send('Authentication failed.');
  }
});

app.post('/refresh-token', async (req, res) => {
  console.log(req)
  const { refresh_token } = req.body;

  try {
    const response = await axios.post('https://www.strava.com/api/v3/oauth/token', null, {
      params: {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    res.status(400).send('Unable to refresh token');
  }
});

app.get('/api/athlete', async (req, res) => {
  const accessToken = req.query.access_token; 
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const athlete = response.data;
    res.json(athlete); 
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Failed to fetch athlete');
  }
});

app.post('/logout', async (req, res) => {
  const accessToken = req.query.access_token;
  try {
    const response = await axios.post(`https://www.strava.com/oauth/deauthorize?access_token=${accessToken}`)
    console.log(response.data)
    res.redirect(`${REDIRECT_URI}`)
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/activities', async (req, res) => {
  const accessToken = req.query.access_token;
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const activities = response.data;
    res.json(activities);
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
