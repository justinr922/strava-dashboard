const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = 3000;

// Basic GET endpoint to test server connectivity
app.get('/ping', (req, res) => {
    res.send('Server is up and running!');
});

// Step 1: Redirect user to Strava's authorization page
app.get('/auth/strava', (req, res) => {
    console.log('Redirecting to Strava authorization page...');
  const redirect_uri = `http://localhost:${port}/auth/strava/callback`;
  res.redirect(
    `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirect_uri}&scope=read,activity:read`
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

    const { access_token, athlete } = response.data;
    res.redirect(`http://localhost:3001/?token=${access_token}`)
  } catch (error) {
    console.error(error.response.data);
    res.status(500).send('Authentication failed.');
  }
});

app.get('/api/activities', async (req, res) => {
  const accessToken = req.query.access_token; // You got this earlier
  console.log(accessToken)
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const activities = response.data;
    res.json(activities); // You can later filter/format this
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Failed to fetch activities');
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
