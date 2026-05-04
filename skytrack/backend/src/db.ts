import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getDb(): pg.Pool | null {
  if (!config.DATABASE_URL) return null
  if (!pool) {
    pool = new Pool({ connectionString: config.DATABASE_URL })
    pool.on('error', (err) => {
      console.error('[db] unexpected error on idle client', err)
    })
  }
  return pool
}

const MIGRATION = `
CREATE TABLE IF NOT EXISTS flight_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  icao24      TEXT NOT NULL,
  callsign    TEXT,
  country     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  altitude_m  DOUBLE PRECISION,
  velocity_ms DOUBLE PRECISION,
  heading     DOUBLE PRECISION,
  on_ground   BOOLEAN,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_icao24 ON flight_snapshots (icao24);
CREATE INDEX IF NOT EXISTS idx_snapshots_recorded_at ON flight_snapshots (recorded_at DESC);
`

export async function runMigrations() {
  const db = getDb()
  if (!db) {
    console.log('[db] No DATABASE_URL set – skipping migrations (history disabled)')
    return
  }
  try {
    await db.query(MIGRATION)
    console.log('[db] Migrations applied')
  } catch (err) {
    console.error('[db] Migration failed:', err)
  }
}
