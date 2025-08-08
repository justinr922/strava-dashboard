import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render typically requires SSL. If your DATABASE_URL doesn't include ssl params,
  // this enforces SSL. Prefer using a CA and rejectUnauthorized: true when possible.
  ssl: { rejectUnauthorized: false },
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      strava_athlete_id BIGINT UNIQUE NOT NULL,
      strava_access_token TEXT,
      strava_refresh_token TEXT,
      strava_expires_at INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export async function upsertUserTokens({ athleteId, accessToken, refreshToken, expiresAt }) {
  await pool.query(
    `INSERT INTO users (strava_athlete_id, strava_access_token, strava_refresh_token, strava_expires_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (strava_athlete_id) DO UPDATE SET
       strava_access_token = EXCLUDED.strava_access_token,
       strava_refresh_token = EXCLUDED.strava_refresh_token,
       strava_expires_at = EXCLUDED.strava_expires_at,
       updated_at = NOW()`,
    [athleteId, accessToken, refreshToken, expiresAt]
  );
}

export async function getUserByAthleteId(athleteId) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE strava_athlete_id = $1`,
    [athleteId]
  );
  return rows[0] || null;
}

export async function deleteUserByAthleteId(athleteId) {
  await pool.query(
    `DELETE FROM users WHERE strava_athlete_id = $1`,
    [athleteId]
  );
}

export default pool;
