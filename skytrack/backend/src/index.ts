import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyWebsocket from '@fastify/websocket'
import { config } from './config.js'
import { fetchFlights } from './opensky.js'
import { flightStore } from './flightState.js'
import { registerWebSocket } from './websocket.js'
import { registerFlightRoutes } from './routes/flights.js'
import { registerAiRoutes } from './routes/ai.js'
import { runMigrations } from './db.js'

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, ignore: 'pid,hostname' },
    },
  },
})

async function startPoller() {
  let consecutiveErrors = 0

  async function poll() {
    try {
      const flights = await fetchFlights()
      const update = flightStore.applyUpdate(flights)
      consecutiveErrors = 0
      app.log.info(
        `[opensky] ${flights.length} flights | +${update.added.length} new | -${update.removed.length} removed`
      )
    } catch (err) {
      consecutiveErrors++
      const backoff = Math.min(consecutiveErrors * 5_000, 60_000)
      app.log.warn(`[opensky] Fetch failed (attempt ${consecutiveErrors}), retry in ${backoff}ms: ${err}`)
      await new Promise(r => setTimeout(r, backoff))
    }
    setTimeout(poll, config.OPENSKY_POLL_INTERVAL_MS)
  }

  // Initial poll immediately
  await poll()
}

async function main() {
  await app.register(cors, {
    origin: [config.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
  })

  await app.register(fastifyWebsocket)

  registerWebSocket(app)
  registerFlightRoutes(app)
  registerAiRoutes(app)

  await runMigrations()

  await app.listen({ port: config.PORT, host: '0.0.0.0' })
  app.log.info(`SkyTrack backend running on http://0.0.0.0:${config.PORT}`)

  // Start OpenSky poller after server is up
  startPoller().catch(err => {
    app.log.error('Poller crashed:', err)
    process.exit(1)
  })
}

main().catch(err => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
