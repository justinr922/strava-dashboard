# Strava Activity Visualizer

A full-stack web application that integrates with Strava to visualize user workout data with interactive charts and layout tools.

## Features

* 🔐 OAuth-based login with Strava
* 🏃 Activity table showing runs and rides with metrics
* 🗺️ Interactive detail pane with maps
* 👤 Athlete profile display
* ♻️ Automatic token refresh using Strava's API
* 📌 Sticky detail view
* 🧠 Local caching for activity data
* ⚒️ Drag-and-drop canvas (coming soon)

## Tech Stack

* **Frontend:** React (Create React App), Tailwind CSS
* **Backend:** Node.js, Express
* **Deployment:** Render
* **API Integration:** Strava

## Folder Structure

```
project-root/
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # React UI components
│   │   ├── hooks/      # Custom React hooks
│   └── build/          # Production build (auto-generated)
├── server.js           # Express backend
├── .env                # Environment variables
├── package.json        # Backend scripts and dependencies
```

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/strava-visualizer.git
cd strava-visualizer
```

### 2. Install dependencies

```bash
npm install
cd client && npm install
```

### 3. Environment Variables

Create a `.env` file in the root:

```env
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_secret
REDIRECT_URI=http://localhost:3000/auth/strava
```

### 4. Development

Start the backend and frontend:

```bash
# In project root
node server.js

# In a separate terminal
cd client
npm start
```

## Deployment (Render)

1. Push the repo to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set the build command:

   ```bash
   npm run build
   ```
4. Set the start command:

   ```bash
   npm start
   ```
5. Add your environment variables on Render:

   * STRAVA\_CLIENT\_ID
   * STRAVA\_CLIENT\_SECRET
   * REDIRECT\_URI (your Render URL + /auth/strava)

## TODO / In Progress

* [x] Activity detail with map
* [x] Athlete profile display
* [x] Refresh token support
* [x] Activity caching in localStorage
* [ ] Persist oauth tokens serverside
* [ ] Drag and drop layout canvas
* [ ] Image export for social sharing
* [ ] Chart customizations

## License

MIT
