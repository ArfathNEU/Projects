import axios from 'axios'
import type { FlightState } from './types.js'

// adsb.lol — free, no auth, no rate limits, worldwide ADS-B feed
const ADSB_URL = 'https://api.adsb.lol/v2/lat/0/lon/0/dist/20000'

interface AdsbAircraft {
  hex: string
  flight?: string
  lat?: number
  lon?: number
  alt_baro?: number | 'ground'
  alt_geom?: number
  gs?: number          // knots
  track?: number       // degrees true
  baro_rate?: number   // ft/min
  geom_rate?: number
  squawk?: string
  type?: string
  // country derivable from ICAO prefix — omitted from this endpoint
}

interface AdsbResponse {
  ac: AdsbAircraft[]
  now: number
}

function parseAircraft(a: AdsbAircraft, nowMs: number): FlightState | null {
  if (!a.hex || a.lat === undefined || a.lon === undefined) return null

  const onGround = a.alt_baro === 'ground'
  const baroAltM = onGround || a.alt_baro === undefined
    ? null
    : (a.alt_baro as number) / 3.28084          // feet → meters
  const geoAltM = a.alt_geom !== undefined
    ? a.alt_geom / 3.28084
    : null
  const velocityMs = a.gs !== undefined
    ? a.gs * 0.514444                            // knots → m/s
    : null
  const vertRateMs = (a.baro_rate ?? a.geom_rate) !== undefined
    ? (a.baro_rate ?? a.geom_rate)! * 0.00508   // ft/min → m/s
    : null

  return {
    icao24: a.hex.toLowerCase(),
    callsign: a.flight?.trim() || null,
    originCountry: icaoCountry(a.hex),
    timePosition: nowMs / 1000,
    lastContact: nowMs / 1000,
    longitude: a.lon,
    latitude: a.lat,
    baroAltitude: baroAltM,
    onGround,
    velocity: velocityMs,
    trueTrack: a.track ?? null,
    verticalRate: vertRateMs,
    geoAltitude: geoAltM,
    squawk: a.squawk ?? null,
    updatedAt: nowMs,
  }
}

// Rough ICAO24 prefix → country (top ~30 most common, fallback 'Unknown')
function icaoCountry(hex: string): string {
  const prefix = hex.toUpperCase().slice(0, 3)
  const p2 = hex.toUpperCase().slice(0, 2)
  const p1 = hex.toUpperCase().slice(0, 1)
  if (prefix >= 'A00' && prefix <= 'AFF') return 'United States'
  if (prefix >= 'C00' && prefix <= 'CFF') return 'Canada'
  if (prefix >= '400' && prefix <= '43F') return 'United Kingdom'
  if (prefix >= '440' && prefix <= '47F') return 'Germany'
  if (prefix >= '380' && prefix <= '3BF') return 'France'
  if (prefix >= '300' && prefix <= '33F') return 'Italy'
  if (prefix >= '340' && prefix <= '37F') return 'Spain'
  if (prefix >= '480' && prefix <= '4FF') return 'Netherlands'
  if (prefix >= '500' && prefix <= '53F') return 'Belgium'
  if (prefix >= '460' && prefix <= '47F') return 'Austria'
  if (prefix >= '760' && prefix <= '77F') return 'Mexico'
  if (prefix >= '780' && prefix <= '7BF') return 'Brazil'
  if (prefix >= '810' && prefix <= '83F') return 'Australia'
  if (prefix >= '680' && prefix <= '6BF') return 'Japan'
  if (prefix >= '780' && prefix <= '7FF') return 'China'
  if (prefix >= '800' && prefix <= '80F') return 'India'
  if (prefix >= '720' && prefix <= '727') return 'Russia'
  if (p1 === '7') return 'Asia'
  if (p1 === '6') return 'Middle East / Asia'
  if (p1 === '0') return 'Europe'
  return 'Unknown'
}

export async function fetchFlights(): Promise<FlightState[]> {
  const response = await axios.get<AdsbResponse>(ADSB_URL, { timeout: 15_000 })
  const now = Date.now()
  const aircraft = response.data?.ac ?? []
  const flights: FlightState[] = []
  for (const a of aircraft) {
    const f = parseAircraft(a, now)
    if (f) flights.push(f)
  }
  return flights
}
