import 'dotenv/config'

export const config = {
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  OPENSKY_BASE_URL: 'https://opensky-network.org/api',
  OPENSKY_USERNAME: process.env.OPENSKY_USERNAME ?? '',
  OPENSKY_PASSWORD: process.env.OPENSKY_PASSWORD ?? '',
  // Anonymous: 10s minimum; registered: 5s minimum. We poll at 15s to be safe.
  OPENSKY_POLL_INTERVAL_MS: 15_000,

  DATABASE_URL: process.env.DATABASE_URL ?? '',

  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',

  // Max trail positions to keep per flight in memory
  TRAIL_MAX_POSITIONS: 30,
  // Flights not updated within this window are considered stale and removed
  STALE_FLIGHT_TTL_MS: 120_000,
} as const
