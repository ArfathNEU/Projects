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
  trueTrack: number | null      // degrees clockwise from north
  verticalRate: number | null   // m/s positive = climbing
  geoAltitude: number | null    // meters
  squawk: string | null
  updatedAt: number             // local ms timestamp when received
}

export interface FlightTrail {
  icao24: string
  positions: Array<{ lat: number; lon: number; alt: number | null; ts: number }>
}

export interface GlobalStats {
  totalFlights: number
  airborne: number
  onGround: number
  countries: number
  avgAltitudeFt: number
  avgSpeedKts: number
  updatedAt: number
}

export interface BoundingBox {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
}

// WebSocket protocol: server → client
export type ServerMessage =
  | { type: 'snapshot'; flights: FlightState[]; trails: Record<string, FlightTrail['positions']>; stats: GlobalStats; ts: number }
  | { type: 'delta'; added: FlightState[]; updated: FlightState[]; removed: string[]; stats: GlobalStats; ts: number }
  | { type: 'pong'; ts: number }

// WebSocket protocol: client → server
export type ClientMessage =
  | { type: 'ping' }
  | { type: 'viewport'; bounds: BoundingBox }
  | { type: 'subscribe'; icao24: string }
  | { type: 'unsubscribe' }
