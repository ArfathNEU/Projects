import { useQuery } from '@tanstack/react-query'
import type { RouteInfo } from '../types'
import { API_BASE } from '../lib/constants'

async function fetchRoute(icao24: string): Promise<RouteInfo> {
  const res = await fetch(`${API_BASE}/api/flights/${icao24}/route`)
  if (!res.ok) throw new Error('Route not found')
  return res.json() as Promise<RouteInfo>
}

export function useFlightRoute(icao24: string | null) {
  return useQuery<RouteInfo>({
    queryKey: ['route', icao24],
    queryFn: () => fetchRoute(icao24!),
    enabled: !!icao24,
    staleTime: 10 * 60 * 1000, // cache for 10 minutes
    retry: false,
  })
}
