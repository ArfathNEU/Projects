import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useFlightStore } from '../../store/flightStore'
import { useUiStore } from '../../store/uiStore'
import { MAP_STYLE } from '../../lib/constants'
import { greatCirclePoints } from '../../lib/geo'
import { useFlightRoute } from '../../hooks/useFlightRoute'
import type { FlightState, TrailPosition } from '../../types'

const SOURCE_FLIGHTS  = 'flights'
const SOURCE_TRAILS   = 'trails'
const SOURCE_ROUTE    = 'route'
const LAYER_GLOW_FAR  = 'planes-glow-far'
const LAYER_GLOW_NEAR = 'planes-glow-near'
const LAYER_HALOS     = 'planes-halo-layer'
const LAYER_PLANES    = 'planes-layer'
const LAYER_PLANES_SEL= 'planes-selected-layer'
const LAYER_TRAILS    = 'trails-layer'
const LAYER_ROUTE_LINE= 'route-line-layer'
const LAYER_ROUTE_AP  = 'route-airports-layer'

interface TrackedFlight extends FlightState { receivedAt: number }

function interpolatePosition(f: TrackedFlight, nowMs: number): [number, number] {
  if (f.onGround || !f.velocity || f.trueTrack === null || !f.latitude || !f.longitude)
    return [f.latitude ?? 0, f.longitude ?? 0]
  const dt = Math.min((nowMs - f.receivedAt) / 1000, 60)
  if (dt <= 0) return [f.latitude, f.longitude]
  const R = 6_371_000, hr = (f.trueTrack * Math.PI) / 180, d = f.velocity * dt
  const lat = f.latitude + (d * Math.cos(hr) / R) * (180 / Math.PI)
  const lon = f.longitude + (d * Math.sin(hr) / (R * Math.cos((f.latitude * Math.PI) / 180))) * (180 / Math.PI)
  return [lat, lon]
}

function buildTrailGeojson(trails: Map<string, TrailPosition[]>, selectedIcao: string | null) {
  if (!selectedIcao) return { type: 'FeatureCollection' as const, features: [] }
  const trail = trails.get(selectedIcao)
  if (!trail || trail.length < 2) return { type: 'FeatureCollection' as const, features: [] }
  return {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: trail.map(p => [p.lon, p.lat]) },
      properties: { icao24: selectedIcao },
    }],
  }
}

/** Draw a clean airplane silhouette pointing north on a canvas */
function drawPlaneIcon(size: number): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')!
  const s = size / 40

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  // Body + wings
  ctx.moveTo(20*s, 2*s)   // nose
  ctx.lineTo(22*s, 14*s)  // right shoulder
  ctx.lineTo(38*s, 22*s)  // right wingtip
  ctx.lineTo(36*s, 26*s)  // right wing TE
  ctx.lineTo(22*s, 20*s)  // right wing root TE
  ctx.lineTo(23*s, 30*s)  // right tail root
  ctx.lineTo(29*s, 33*s)  // right tailfin tip
  ctx.lineTo(28*s, 37*s)  // right tail TE
  ctx.lineTo(20*s, 34*s)  // center tail
  ctx.lineTo(12*s, 37*s)  // left tail TE
  ctx.lineTo(11*s, 33*s)  // left tailfin tip
  ctx.lineTo(17*s, 30*s)  // left tail root
  ctx.lineTo(18*s, 20*s)  // left wing root TE
  ctx.lineTo(4*s,  26*s)  // left wing TE
  ctx.lineTo(2*s,  22*s)  // left wingtip
  ctx.lineTo(18*s, 14*s)  // left shoulder
  ctx.closePath()
  ctx.fill()
  return ctx.getImageData(0, 0, size, size)
}

export function FlightMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<maplibregl.Map | null>(null)
  const mapReadyRef     = useRef(false)
  const rafRef          = useRef<number>()

  const trackedFlightsRef = useRef<Map<string, TrackedFlight>>(new Map())
  const selectedIcaoRef   = useRef<string | null>(null)
  const trailsRef         = useRef<Map<string, TrailPosition[]>>(new Map())
  const trailDirtyRef     = useRef(false)

  const { flights, trails, getFilteredFlights } = useFlightStore()
  const { selectedIcao, selectFlight } = useUiStore()
  const { data: routeData } = useFlightRoute(selectedIcao)

  // Sync store → refs
  useEffect(() => {
    const filtered = getFilteredFlights()
    const now = Date.now()
    const next = new Map<string, TrackedFlight>()
    for (const f of filtered) {
      const existing = trackedFlightsRef.current.get(f.icao24)
      const receivedAt = existing && existing.updatedAt === f.updatedAt ? existing.receivedAt : now
      next.set(f.icao24, { ...f, receivedAt })
    }
    trackedFlightsRef.current = next
  }, [flights, getFilteredFlights])

  useEffect(() => { trailsRef.current = trails; trailDirtyRef.current = true }, [trails])
  useEffect(() => { selectedIcaoRef.current = selectedIcao; trailDirtyRef.current = true }, [selectedIcao])

  // Route effect
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current) return
    const src = map.getSource(SOURCE_ROUTE) as maplibregl.GeoJSONSource | undefined
    if (!src) return

    if (!routeData?.origin || !routeData?.destination) {
      src.setData({ type: 'FeatureCollection', features: [] })
      return
    }

    const { origin, destination } = routeData
    const routeCoords = greatCirclePoints(origin.lat, origin.lon, destination.lat, destination.lon, 120)

    src.setData({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords }, properties: { type: 'route' } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [origin.lon, origin.lat] }, properties: { label: origin.iata, type: 'origin' } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [destination.lon, destination.lat] }, properties: { label: destination.iata, type: 'destination' } },
      ],
    })
  }, [routeData])

  // rAF loop — 60fps interpolation, no re-renders
  useEffect(() => {
    function frame() {
      rafRef.current = requestAnimationFrame(frame)
      const map = mapRef.current
      if (!map || !mapReadyRef.current) return

      const now = Date.now()
      const selected = selectedIcaoRef.current
      const features: GeoJSON.Feature[] = []

      for (const [icao24, f] of trackedFlightsRef.current) {
        if (f.latitude === null || f.longitude === null) continue
        const [lat, lon] = interpolatePosition(f, now)
        const altFt = (f.baroAltitude ?? 0) * 3.28084
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          properties: {
            icao24,
            heading: f.trueTrack ?? 0,
            selected: icao24 === selected,
            onGround: f.onGround,
            altFt,
          },
        })
      }

      const fs = map.getSource(SOURCE_FLIGHTS) as maplibregl.GeoJSONSource | undefined
      fs?.setData({ type: 'FeatureCollection', features })

      if (trailDirtyRef.current) {
        trailDirtyRef.current = false
        const ts = map.getSource(SOURCE_TRAILS) as maplibregl.GeoJSONSource | undefined
        ts?.setData(buildTrailGeojson(trailsRef.current, selected))
      }
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  // Map init
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [10, 30],
      zoom: 2.5,
      minZoom: 1,
      maxZoom: 18,
      attributionControl: false,
    })

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right')

    map.on('load', () => {
      // Plane icon — SDF so MapLibre can tint it any color
      map.addImage('plane-icon', drawPlaneIcon(48), { sdf: true })

      // ── Route source + layers ──────────────────────────────────
      map.addSource(SOURCE_ROUTE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })

      // Outer glow behind route
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: SOURCE_ROUTE,
        filter: ['==', ['get', 'type'], 'route'],
        paint: {
          'line-color': '#7c3aed',
          'line-width': 6,
          'line-opacity': 0.15,
          'line-blur': 4,
        },
      })
      map.addLayer({
        id: LAYER_ROUTE_LINE,
        type: 'line',
        source: SOURCE_ROUTE,
        filter: ['==', ['get', 'type'], 'route'],
        paint: {
          'line-color': '#a78bfa',
          'line-width': 1.5,
          'line-opacity': 0.85,
          'line-dasharray': [5, 4],
        },
      })
      map.addLayer({
        id: LAYER_ROUTE_AP,
        type: 'symbol',
        source: SOURCE_ROUTE,
        filter: ['in', ['get', 'type'], ['literal', ['origin', 'destination']]],
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, -1.4],
          'text-anchor': 'bottom',
          'icon-image': '',
        },
        paint: {
          'text-color': '#c4b5fd',
          'text-halo-color': '#070b10',
          'text-halo-width': 2,
        },
      })

      // ── Trail source + layer ───────────────────────────────────
      map.addSource(SOURCE_TRAILS, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })

      // Trail glow
      map.addLayer({
        id: 'trails-glow',
        type: 'line',
        source: SOURCE_TRAILS,
        paint: { 'line-color': '#38bdf8', 'line-width': 5, 'line-opacity': 0.12, 'line-blur': 4 },
      })
      map.addLayer({
        id: LAYER_TRAILS,
        type: 'line',
        source: SOURCE_TRAILS,
        paint: {
          'line-color': '#38bdf8',
          'line-width': 1.5,
          'line-opacity': 0.75,
          'line-dasharray': [3, 2],
        },
      })

      // ── Flights source ────────────────────────────────────────
      map.addSource(SOURCE_FLIGHTS, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })

      // Far glow ring (outer)
      map.addLayer({
        id: LAYER_GLOW_FAR,
        type: 'circle',
        source: SOURCE_FLIGHTS,
        filter: ['==', ['get', 'selected'], true],
        paint: {
          'circle-radius': 44,
          'circle-color': 'transparent',
          'circle-stroke-color': '#22d3ee',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.18,
          'circle-opacity': 0,
        },
      })
      // Near halo ring
      map.addLayer({
        id: LAYER_HALOS,
        type: 'circle',
        source: SOURCE_FLIGHTS,
        filter: ['==', ['get', 'selected'], true],
        paint: {
          'circle-radius': 26,
          'circle-color': 'rgba(34,211,238,0.06)',
          'circle-stroke-color': '#22d3ee',
          'circle-stroke-width': 2,
          'circle-stroke-opacity': 0.9,
          'circle-opacity': 1,
        },
      })

      // Altitude color expression (5 tiers)
      const altColor: maplibregl.ExpressionSpecification = [
        'case',
        ['get', 'onGround'],  '#64748b',           // ground: slate
        ['<', ['get', 'altFt'], 5_000],  '#fbbf24', // <5k ft: amber
        ['<', ['get', 'altFt'], 15_000], '#fb923c', // 5-15k: orange
        ['<', ['get', 'altFt'], 30_000], '#f1f5f9', // 15-30k: white
        '#7dd3fc',                                   // >30k: ice blue
      ]

      // All non-selected planes
      map.addLayer({
        id: LAYER_PLANES,
        type: 'symbol',
        source: SOURCE_FLIGHTS,
        filter: ['!=', ['get', 'selected'], true],
        layout: {
          'icon-image': 'plane-icon',
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-size': ['interpolate', ['linear'], ['zoom'], 2, 0.22, 5, 0.38, 8, 0.55, 11, 0.75],
        },
        paint: {
          'icon-color': altColor,
          'icon-opacity': 0.92,
          'icon-halo-color': 'rgba(0,0,0,0.4)',
          'icon-halo-width': 0.5,
          'icon-halo-blur': 0.5,
        },
      })

      // Selected plane — cyan, larger, glowing
      map.addLayer({
        id: LAYER_PLANES_SEL,
        type: 'symbol',
        source: SOURCE_FLIGHTS,
        filter: ['==', ['get', 'selected'], true],
        layout: {
          'icon-image': 'plane-icon',
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-size': ['interpolate', ['linear'], ['zoom'], 2, 0.32, 5, 0.52, 8, 0.75, 11, 1.0],
        },
        paint: {
          'icon-color': '#22d3ee',
          'icon-opacity': 1,
          'icon-halo-color': 'rgba(34,211,238,0.5)',
          'icon-halo-width': 2,
          'icon-halo-blur': 1,
        },
      })

      mapReadyRef.current = true
    })

    for (const layer of [LAYER_PLANES, LAYER_PLANES_SEL]) {
      map.on('click', layer, (e) => {
        const icao24 = e.features?.[0]?.properties?.icao24 as string | undefined
        if (icao24) { selectFlight(icao24); e.originalEvent.stopPropagation() }
      })
      map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
    }

    map.on('click', (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: [LAYER_PLANES, LAYER_PLANES_SEL] })
      if (hit.length === 0) selectFlight(null)
    })

    mapRef.current = map
    return () => {
      mapReadyRef.current = false
      try { map.remove() } catch { /* suppress AbortError */ }
      mapRef.current = null
    }
  }, [selectFlight])

  return (
    <div ref={mapContainerRef} className="absolute inset-0 w-full h-full"
      style={{ background: '#070b10' }} />
  )
}
