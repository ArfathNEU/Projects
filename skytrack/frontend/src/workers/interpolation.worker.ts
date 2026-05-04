import type { FlightState, InterpolatedPosition } from '../types'

interface TrackedFlight extends FlightState {
  receivedAt: number
}

const flights = new Map<string, TrackedFlight>()

self.onmessage = (e: MessageEvent<{
  type: 'snapshot' | 'delta'
  flights?: FlightState[]
  added?: FlightState[]
  updated?: FlightState[]
  removed?: string[]
}>) => {
  const { type, flights: fl, added, updated, removed } = e.data
  const now = Date.now()

  if (type === 'snapshot' && fl) {
    flights.clear()
    for (const f of fl) {
      flights.set(f.icao24, { ...f, receivedAt: now })
    }
  } else if (type === 'delta') {
    for (const f of [...(added ?? []), ...(updated ?? [])]) {
      flights.set(f.icao24, { ...f, receivedAt: now })
    }
    for (const id of (removed ?? [])) {
      flights.delete(id)
    }
  }
}

// Dead-reckoning interpolation loop at ~10fps
setInterval(() => {
  const now = Date.now()
  const positions: InterpolatedPosition[] = []

  for (const [icao24, f] of flights) {
    if (f.onGround || f.latitude === null || f.longitude === null) {
      // On-ground flights: still include them at their last known position
      positions.push({
        icao24,
        lat: f.latitude ?? 0,
        lon: f.longitude ?? 0,
        heading: f.trueTrack ?? 0,
      })
      continue
    }

    const dt = (now - f.receivedAt) / 1000 // seconds since last server update
    if (dt > 60) continue // skip stale flights

    let lat = f.latitude
    let lon = f.longitude

    if (f.velocity !== null && f.trueTrack !== null && dt > 0) {
      const headingRad = (f.trueTrack * Math.PI) / 180
      const distM = f.velocity * dt
      const R = 6_371_000
      const dLat = (distM * Math.cos(headingRad)) / R
      const dLon = (distM * Math.sin(headingRad)) / (R * Math.cos((f.latitude * Math.PI) / 180))
      lat = f.latitude + dLat * (180 / Math.PI)
      lon = f.longitude + dLon * (180 / Math.PI)
    }

    positions.push({ icao24, lat, lon, heading: f.trueTrack ?? 0 })
  }

  self.postMessage({ type: 'positions', positions })
}, 100)
