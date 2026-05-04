export interface FlightState {
  icao24: string
  callsign: string | null
  originCountry: string
  timePosition: number | null
  lastContact: number
  longitude: number | null
  latitude: number | null
  baroAltitude: number | null   // meters
  onGround: boolean
  velocity: number | null       // m/s
  trueTrack: number | null      // degrees CW from north
  verticalRate: number | null   // m/s
  geoAltitude: number | null    // meters
  squawk: string | null
  updatedAt: number
}

export interface TrailPosition {
  lat: number
  lon: number
  alt: number | null
  ts: number
}

export interface GlobalStats {
  totalFlights: number
  airborne: number
  onGround: number
  countries: number
  avgAltitudeFt: number
  avgSpeedKts: number
  updatedAt: number
  connectedClients?: number
}

export interface FlightFilters {
  minAltitudeFt: number
  maxAltitudeFt: number
  minSpeedKts: number
  maxSpeedKts: number
  onlyAirborne: boolean
  onlyGround: boolean
  countryFilter: string
}

export type ServerMessage =
  | { type: 'snapshot'; flights: FlightState[]; trails: Record<string, TrailPosition[]>; stats: GlobalStats; ts: number }
  | { type: 'delta'; added: FlightState[]; updated: FlightState[]; removed: string[]; stats: GlobalStats; ts: number }
  | { type: 'pong'; ts: number }

export interface AirportInfo {
  icao: string
  iata: string
  name: string
  city: string
  country: string
  lat: number
  lon: number
}

export interface RouteInfo {
  callsign: string
  flightNumber: string
  airline: string
  origin: AirportInfo | null
  destination: AirportInfo | null
}

export interface InterpolatedPosition {
  icao24: string
  lat: number
  lon: number
  heading: number
}
