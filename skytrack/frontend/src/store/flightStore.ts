import { create } from 'zustand'
import type { FlightState, TrailPosition, GlobalStats, FlightFilters } from '../types'
import { DEFAULT_FILTERS } from '../lib/constants'

interface FlightStore {
  flights: Map<string, FlightState>
  trails: Map<string, TrailPosition[]>
  stats: GlobalStats | null
  filters: FlightFilters
  wsConnected: boolean
  wsReconnecting: boolean
  lastUpdateTs: number

  setFlights: (flights: FlightState[]) => void
  setTrails: (trails: Record<string, TrailPosition[]>) => void
  applyDelta: (added: FlightState[], updated: FlightState[], removed: string[]) => void
  setStats: (stats: GlobalStats) => void
  setFilters: (filters: Partial<FlightFilters>) => void
  resetFilters: () => void
  setWsConnected: (connected: boolean) => void
  setWsReconnecting: (reconnecting: boolean) => void

  getFilteredFlights: () => FlightState[]
  getFlight: (icao24: string) => FlightState | undefined
  getTrail: (icao24: string) => TrailPosition[]
}

export const useFlightStore = create<FlightStore>((set, get) => ({
  flights: new Map(),
  trails: new Map(),
  stats: null,
  filters: { ...DEFAULT_FILTERS },
  wsConnected: false,
  wsReconnecting: false,
  lastUpdateTs: 0,

  setFlights: (flights) => {
    const map = new Map<string, FlightState>()
    for (const f of flights) map.set(f.icao24, f)
    set({ flights: map, lastUpdateTs: Date.now() })
  },

  setTrails: (trails) => {
    const map = new Map<string, TrailPosition[]>()
    for (const [k, v] of Object.entries(trails)) map.set(k, v)
    set({ trails: map })
  },

  applyDelta: (added, updated, removed) => {
    set(state => {
      const flights = new Map(state.flights)
      for (const f of [...added, ...updated]) flights.set(f.icao24, f)
      for (const id of removed) flights.delete(id)
      return { flights, lastUpdateTs: Date.now() }
    })
  },

  setStats: (stats) => set({ stats }),

  setFilters: (partial) =>
    set(state => ({ filters: { ...state.filters, ...partial } })),

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  setWsConnected: (wsConnected) => set({ wsConnected }),
  setWsReconnecting: (wsReconnecting) => set({ wsReconnecting }),

  getFilteredFlights: () => {
    const { flights, filters } = get()
    const results: FlightState[] = []
    for (const f of flights.values()) {
      if (filters.onlyAirborne && f.onGround) continue
      if (filters.onlyGround && !f.onGround) continue
      if (f.baroAltitude !== null) {
        const altFt = f.baroAltitude * 3.28084
        if (altFt < filters.minAltitudeFt || altFt > filters.maxAltitudeFt) continue
      }
      if (f.velocity !== null) {
        const spdKts = f.velocity * 1.94384
        if (spdKts < filters.minSpeedKts || spdKts > filters.maxSpeedKts) continue
      }
      if (filters.countryFilter && !f.originCountry.toLowerCase().includes(filters.countryFilter.toLowerCase())) continue
      results.push(f)
    }
    return results
  },

  getFlight: (icao24) => get().flights.get(icao24),
  getTrail: (icao24) => get().trails.get(icao24) ?? [],
}))
