const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI
const EARTH_RADIUS_M = 6_371_000

export function toRad(deg: number): number {
  return deg * DEG_TO_RAD
}

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Dead-reckon a new position given a starting point, heading (degrees CW from N),
 * velocity (m/s), and elapsed time (seconds).
 */
export function deadReckon(
  lat: number,
  lon: number,
  headingDeg: number,
  velocityMs: number,
  dtSeconds: number
): [number, number] {
  const headingRad = toRad(headingDeg)
  const distM = velocityMs * dtSeconds
  const dLat = (distM * Math.cos(headingRad)) / EARTH_RADIUS_M
  const dLon = (distM * Math.sin(headingRad)) / (EARTH_RADIUS_M * Math.cos(toRad(lat)))
  return [lat + dLat * RAD_TO_DEG, lon + dLon * RAD_TO_DEG]
}

export function metersToFeet(m: number): number {
  return m * 3.28084
}

export function msToKnots(ms: number): number {
  return ms * 1.94384
}

export function msToFtPerMin(ms: number): number {
  return ms * 196.85
}

export function formatAltitude(altM: number | null): string {
  if (altM === null || altM < 0) return '—'
  return `${Math.round(metersToFeet(altM)).toLocaleString()} ft`
}

export function formatSpeed(velocityMs: number | null): string {
  if (velocityMs === null) return '—'
  return `${Math.round(msToKnots(velocityMs))} kts`
}

export function formatVerticalRate(vrMs: number | null): string {
  if (vrMs === null || Math.abs(vrMs) < 0.2) return 'Level'
  const ftmin = Math.round(msToFtPerMin(vrMs))
  return `${ftmin > 0 ? '+' : ''}${ftmin.toLocaleString()} ft/min`
}

export function formatHeading(deg: number | null): string {
  if (deg === null) return '—'
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const idx = Math.round(deg / 45) % 8
  return `${Math.round(deg)}° ${dirs[idx]}`
}

/**
 * Returns N evenly-spaced [lon, lat] points along the great-circle between two coords.
 * Output is in [lon, lat] order for GeoJSON compatibility.
 */
export function greatCirclePoints(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  n = 80
): [number, number][] {
  const r1 = toRad(lat1), o1 = toRad(lon1)
  const r2 = toRad(lat2), o2 = toRad(lon2)
  const d = Math.acos(
    Math.min(1, Math.sin(r1) * Math.sin(r2) + Math.cos(r1) * Math.cos(r2) * Math.cos(o2 - o1))
  )
  if (d === 0) return [[lon1, lat1]]

  const points: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const f = i / n
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(r1) * Math.cos(o1) + B * Math.cos(r2) * Math.cos(o2)
    const y = A * Math.cos(r1) * Math.sin(o1) + B * Math.cos(r2) * Math.sin(o2)
    const z = A * Math.sin(r1) + B * Math.sin(r2)
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD_TO_DEG
    const lon = Math.atan2(y, x) * RAD_TO_DEG
    points.push([lon, lat])
  }
  return points
}

export function formatCoords(lat: number | null, lon: number | null): string {
  if (lat === null || lon === null) return '—'
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
  const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`
  return `${latStr}, ${lonStr}`
}
