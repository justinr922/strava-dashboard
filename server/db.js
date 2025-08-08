import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

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

const _upsertUserTokens = db.prepare(`
  INSERT INTO users (strava_athlete_id, strava_access_token, strava_refresh_token, strava_expires_at)
  VALUES (@athleteId, @accessToken, @refreshToken, @expiresAt)
  ON CONFLICT(strava_athlete_id) DO UPDATE SET
    strava_access_token = excluded.strava_access_token,
    strava_refresh_token = excluded.strava_refresh_token,
    strava_expires_at = excluded.strava_expires_at,
    updated_at = CURRENT_TIMESTAMP
`);

const _getUserByAthleteId = db.prepare(`
  SELECT * FROM users WHERE strava_athlete_id = ?
`);

const _deleteUserByAthleteId = db.prepare(`
  DELETE FROM users WHERE strava_athlete_id = ?
`);

export function upsertUserTokens({ athleteId, accessToken, refreshToken, expiresAt }) {
  return _upsertUserTokens.run({ athleteId, accessToken, refreshToken, expiresAt });
}

export function getUserByAthleteId(athleteId) {
  return _getUserByAthleteId.get(athleteId);
}

export function deleteUserByAthleteId(athleteId) {
  return _deleteUserByAthleteId.run(athleteId);
}

export default db;

