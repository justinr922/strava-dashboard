# Straviewer

A full‑stack Strava dashboard that lets you explore your activities with rich visuals.

- OAuth login with Strava
- History table and mobile cards, sticky detail view
- Profile summary (counts, totals, earliest/latest range, last fetch)
- Per‑activity page with:
  - Real‑time line chart (time on x‑axis) for Heart Rate or Speed
  - Route map colored by the selected metric with legend and tooltips
  - Unit‑aware speed: runs in min/mi, rides in mph
- Local caching for faster loads
- Token handling and secure server‑side refresh

## Tech stack
- Frontend: React (Create React App), React Router, Tailwind CSS, Leaflet
- Backend: Node.js (Express)
- Database: PostgreSQL (pg)
- Hosting: Render (or any Node host)

## Repository layout
```
project-root/
├── backend.js          # Express server entry
├── server/             # Auth and DB helpers
│   ├── auth.js
│   └── db.js
├── client/             # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── build/          # Production build output
├── .env                # Environment variables (local)
├── package.json        # Backend scripts and deps
└── readme.md
```

## Environment variables
Create a `.env` in the project root. Required keys:

```env
# Strava API
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret

# App auth
APP_JWT_SECRET=replace_with_a_strong_secret

# Database (Postgres)
DATABASE_URL=postgres://user:password@host:5432/dbname

# Frontend base used for redirects after OAuth
# Dev with CRA: http://localhost:3001
# Single‑server prod‑like: http://localhost:3000
REDIRECT_URI=http://localhost:3001

# Render hosting (optional)
RENDER=false
# If deploying on Render, set this to your public URL
a# RENDER is auto‑set by Render; use this when RENDER is truthy
RENDER_EXTERNAL_URL=https://your-service.onrender.com
```

Notes
- In dev with CRA, set REDIRECT_URI to http://localhost:3001 and set your Strava app callback URL to http://localhost:3001/auth/strava/callback
- In single‑server mode, set REDIRECT_URI to http://localhost:3000 and use http://localhost:3000/auth/strava/callback as the Strava callback

## Install
```bash
# From project root
npm install
cd client && npm install
```

## Run (dev, recommended)
Two servers: Express API on 3000, CRA dev server on 3001.

```bash
# Terminal 1 (root)
npm run dev

# Terminal 2 (client)
cd client
npm start
```
Open http://localhost:3001.

## Run (single‑server prod‑like)
Serves the built React app from Express at http://localhost:3000.

```bash
# Build the client
cd client && npm run build && cd ..

# Start the server with production settings (loads .env)
NODE_ENV=production node -r dotenv/config backend.js
```
Open http://localhost:3000.

## Frontend routes
- `/` Profile page
- `/history` Activity history (table on desktop, cards on mobile) + sticky detail
- `/activities/:id` Per‑activity visualization page (chart + colored map)

## API routes (server)
- `GET /auth/strava` → redirect to Strava OAuth
- `GET /auth/strava/callback` → handle OAuth, issue app token, redirect to REDIRECT_URI
- `POST /logout` → revoke Strava token and clear server data
- `GET /api/athlete` → current athlete (requires app token)
- `GET /api/activities` → recent activities (requires app token)
- `GET /api/activities/:id` → a single activity (requires app token)
- `GET /api/activities/:id/streams` → streams for an activity (latlng, altitude, velocity_smooth, heartrate, cadence, time)

## Usage tips
- Use the header tabs to switch between Profile and History
- Click an activity row/card to preview; use “Open” to view the dedicated page
- In the activity page, use the metric selector to switch between HR and Speed
  - Line chart x‑axis shows real elapsed time
  - Route map colors update and the legend/tooltips reflect the chosen metric
  - Runs show speed in min/mi; rides in mph

## Build & deploy (Render)
- Build command: `npm run build` (root script builds client too)
- Start command: `npm start` (or `NODE_ENV=production node -r dotenv/config backend.js`)
- Set environment variables in the Render dashboard:
  - STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
  - APP_JWT_SECRET
  - DATABASE_URL
  - RENDER_EXTERNAL_URL (and ensure RENDER is set by Render)

## Scripts (root)
```json
{
  "dev": "nodemon -r dotenv/config backend.js",
  "start": "node backend.js",
  "prod": "node backend.js",
  "build": "npm install && cd client && npm install && npm run build"
}
```

## License
MIT
