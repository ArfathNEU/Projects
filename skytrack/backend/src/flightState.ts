import RBush from 'rbush'
import { EventEmitter } from 'node:events'
import { config } from './config.js'
import type { FlightState, FlightTrail, GlobalStats, BoundingBox } from './types.js'

interface RBushItem {
  minX: number
  minY: number
  maxX: number
  maxY: number
  icao24: string
}

export interface FlightStateUpdate {
  added: FlightState[]
  updated: FlightState[]
  removed: string[]
  stats: GlobalStats
}

class FlightStateStore extends EventEmitter {
  private flights = new Map<string, FlightState>()
  private trails = new Map<string, FlightTrail['positions']>()
  private tree = new RBush<RBushItem>()
  private treeItems = new Map<string, RBushItem>()
  private stats: GlobalStats = {
    totalFlights: 0, airborne: 0, onGround: 0,
    countries: 0, avgAltitudeFt: 0, avgSpeedKts: 0, updatedAt: 0,
  }

  applyUpdate(incoming: FlightState[]): FlightStateUpdate {
    const now = Date.now()
    const added: FlightState[] = []
    const updated: FlightState[] = []

    for (const flight of incoming) {
      const existing = this.flights.get(flight.icao24)
      this.flights.set(flight.icao24, flight)

      // Update spatial index
      const item = this.treeItems.get(flight.icao24)
      if (item) this.tree.remove(item)
      const newItem: RBushItem = {
        minX: flight.longitude!,
        minY: flight.latitude!,
        maxX: flight.longitude!,
        maxY: flight.latitude!,
        icao24: flight.icao24,
      }
      this.tree.insert(newItem)
      this.treeItems.set(flight.icao24, newItem)

      // Update trail ring buffer
      if (!flight.onGround && flight.latitude && flight.longitude) {
        let trail = this.trails.get(flight.icao24)
        if (!trail) {
          trail = []
          this.trails.set(flight.icao24, trail)
        }
        trail.push({
          lat: flight.latitude,
          lon: flight.longitude,
          alt: flight.baroAltitude,
          ts: flight.updatedAt,
        })
        if (trail.length > config.TRAIL_MAX_POSITIONS) {
          trail.shift()
        }
      }

      if (existing) updated.push(flight)
      else added.push(flight)
    }

    // Remove stale flights
    const removed: string[] = []
    for (const [icao24, flight] of this.flights) {
      if (now - flight.updatedAt > config.STALE_FLIGHT_TTL_MS) {
        this.flights.delete(icao24)
        this.trails.delete(icao24)
        const item = this.treeItems.get(icao24)
        if (item) {
          this.tree.remove(item)
          this.treeItems.delete(icao24)
        }
        removed.push(icao24)
      }
    }

    this.stats = this.computeStats()
    const update: FlightStateUpdate = { added, updated, removed, stats: this.stats }
    this.emit('update', update)
    return update
  }

  private computeStats(): GlobalStats {
    const countries = new Set<string>()
    let airborne = 0, onGround = 0
    let totalAltFt = 0, altCount = 0
    let totalSpdKts = 0, spdCount = 0

    for (const f of this.flights.values()) {
      countries.add(f.originCountry)
      if (f.onGround) onGround++
      else airborne++
      if (f.baroAltitude !== null && f.baroAltitude > 0) {
        totalAltFt += f.baroAltitude * 3.28084
        altCount++
      }
      if (f.velocity !== null) {
        totalSpdKts += f.velocity * 1.94384
        spdCount++
      }
    }

    return {
      totalFlights: this.flights.size,
      airborne,
      onGround,
      countries: countries.size,
      avgAltitudeFt: altCount ? Math.round(totalAltFt / altCount) : 0,
      avgSpeedKts: spdCount ? Math.round(totalSpdKts / spdCount) : 0,
      updatedAt: Date.now(),
    }
  }

  getAll(): FlightState[] {
    return Array.from(this.flights.values())
  }

  getInBounds(box: BoundingBox): FlightState[] {
    const items = this.tree.search({
      minX: box.minLon, minY: box.minLat,
      maxX: box.maxLon, maxY: box.maxLat,
    })
    return items.map(i => this.flights.get(i.icao24)!).filter(Boolean)
  }

  getFlight(icao24: string): FlightState | undefined {
    return this.flights.get(icao24)
  }

  getTrail(icao24: string): FlightTrail['positions'] {
    return this.trails.get(icao24) ?? []
  }

  getAllTrails(): Record<string, FlightTrail['positions']> {
    return Object.fromEntries(this.trails)
  }

  getStats(): GlobalStats {
    return this.stats
  }

  search(query: string): FlightState[] {
    const q = query.toLowerCase().trim()
    if (!q) return []
    const results: FlightState[] = []
    for (const f of this.flights.values()) {
      if (
        f.icao24.toLowerCase().includes(q) ||
        f.callsign?.toLowerCase().includes(q) ||
        f.originCountry.toLowerCase().includes(q)
      ) {
        results.push(f)
        if (results.length >= 20) break
      }
    }
    return results
  }
}

export const flightStore = new FlightStateStore()
