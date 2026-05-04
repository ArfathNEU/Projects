import type { FastifyInstance } from 'fastify'
import axios from 'axios'
import { flightStore } from '../flightState.js'
import { getClientCount } from '../websocket.js'

// Route cache — 10 minute TTL so repeat clicks are instant
const routeCache = new Map<string, { data: RouteInfo | null; ts: number }>()
const ROUTE_CACHE_TTL = 10 * 60 * 1000

interface RouteInfo {
  callsign: string
  flightNumber: string
  airline: string
  origin: { icao: string; iata: string; name: string; city: string; country: string; lat: number; lon: number } | null
  destination: { icao: string; iata: string; name: string; city: string; country: string; lat: number; lon: number } | null
}

interface AdsdbResponse {
  response: {
    flightroute: {
      callsign: string
      callsign_iata: string
      airline: { name: string; iata: string; icao: string }
      origin: { icao_code: string; iata_code: string; name: string; municipality: string; country_name: string; latitude: number; longitude: number } | null
      destination: { icao_code: string; iata_code: string; name: string; municipality: string; country_name: string; latitude: number; longitude: number } | null
    }
  }
}

async function fetchRoute(callsign: string): Promise<RouteInfo | null> {
  const cacheKey = callsign.trim().toUpperCase()
  const cached = routeCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < ROUTE_CACHE_TTL) return cached.data

  try {
    const resp = await axios.get<AdsdbResponse>(
      `https://api.adsbdb.com/v0/callsign/${encodeURIComponent(cacheKey)}`,
      { timeout: 6000 }
    )

    const fr = resp.data?.response?.flightroute
    if (!fr) throw new Error('No flightroute in response')

    const mapAp = (ap: AdsdbResponse['response']['flightroute']['origin']) =>
      ap ? { icao: ap.icao_code, iata: ap.iata_code, name: ap.name, city: ap.municipality, country: ap.country_name, lat: ap.latitude, lon: ap.longitude } : null

    const result: RouteInfo = {
      callsign: cacheKey,
      flightNumber: fr.callsign_iata || cacheKey,
      airline: fr.airline?.name ?? '',
      origin: mapAp(fr.origin),
      destination: mapAp(fr.destination),
    }

    routeCache.set(cacheKey, { data: result, ts: Date.now() })
    return result
  } catch {
    routeCache.set(cacheKey, { data: null, ts: Date.now() })
    return null
  }
}

export function registerFlightRoutes(app: FastifyInstance) {
  // All current flights (optionally filtered by bounding box)
  app.get('/api/flights', async (req) => {
    const { minLon, minLat, maxLon, maxLat } = req.query as Record<string, string>
    if (minLon && minLat && maxLon && maxLat) {
      return flightStore.getInBounds({
        minLon: parseFloat(minLon),
        minLat: parseFloat(minLat),
        maxLon: parseFloat(maxLon),
        maxLat: parseFloat(maxLat),
      })
    }
    return flightStore.getAll()
  })

  // Single flight by ICAO24
  app.get<{ Params: { icao24: string } }>('/api/flights/:icao24', async (req, reply) => {
    const flight = flightStore.getFlight(req.params.icao24.toLowerCase())
    if (!flight) return reply.status(404).send({ error: 'Flight not found' })
    const trail = flightStore.getTrail(req.params.icao24.toLowerCase())
    return { flight, trail }
  })

  // Search by callsign / country
  app.get('/api/search', async (req) => {
    const { q } = req.query as { q?: string }
    return flightStore.search(q ?? '')
  })

  // Global stats + server info
  app.get('/api/stats', async () => {
    return {
      ...flightStore.getStats(),
      connectedClients: getClientCount(),
    }
  })

  // Route info (origin + destination airports) for a specific flight
  app.get<{ Params: { icao24: string } }>('/api/flights/:icao24/route', async (req, reply) => {
    const flight = flightStore.getFlight(req.params.icao24.toLowerCase())
    if (!flight) return reply.status(404).send({ error: 'Flight not found' })
    if (!flight.callsign) return reply.status(404).send({ error: 'No callsign' })
    const route = await fetchRoute(flight.callsign)
    if (!route) return reply.status(404).send({ error: 'Route not found' })
    return route
  })

  // Health check
  app.get('/api/health', async () => ({ status: 'ok', ts: Date.now() }))
}
