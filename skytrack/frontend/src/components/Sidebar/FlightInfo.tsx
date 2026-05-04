import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, Minus, MapPin, Gauge,
  Compass, Radio, Globe, Clock, Loader2, ArrowRight, Plane
} from 'lucide-react'
import { formatAltitude, formatSpeed, formatVerticalRate, formatHeading, formatCoords } from '../../lib/geo'
import { getAirlineName } from '../../lib/constants'
import { useFlightRoute } from '../../hooks/useFlightRoute'
import type { FlightState, TrailPosition } from '../../types'
import { formatDistanceToNow } from 'date-fns'

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, d2r = Math.PI / 180
  const a = Math.sin((lat2-lat1)*d2r/2)**2 + Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin((lon2-lon1)*d2r/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function VRIcon({ rate }: { rate: number | null }) {
  if (rate === null || Math.abs(rate) < 0.5) return <Minus size={13} className="text-slate-500" />
  return rate > 0
    ? <TrendingUp size={13} className="text-emerald-400" />
    : <TrendingDown size={13} className="text-red-400" />
}

function Row({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors hover:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-slate-500 text-xs">{icon}<span>{label}</span></div>
      <span className={`text-xs font-mono font-medium ${color ?? 'text-slate-200'}`}>{value}</span>
    </div>
  )
}

function AltBadge({ altM }: { altM: number | null }) {
  if (altM === null || altM <= 0)
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 tracking-wider">GND</span>
  const fl = Math.round((altM * 3.28084) / 100)
  return (
    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono tracking-wider"
      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
      FL{fl.toString().padStart(3,'0')}
    </span>
  )
}

function RouteBar({ icao24, callsign }: { icao24: string; callsign: string | null }) {
  const { data: route, isLoading, isError } = useFlightRoute(icao24)

  if (isLoading) return (
    <div className="px-4 py-4 flex items-center gap-2 text-slate-600 text-xs"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <Loader2 size={12} className="animate-spin text-violet-500" />
      Looking up route…
    </div>
  )

  if (isError || !route?.origin || !route?.destination) return (
    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between text-slate-600 text-xs">
        <span>Route unavailable</span>
        <span className="font-mono text-slate-500">{callsign ?? '—'}</span>
      </div>
    </div>
  )

  const { origin, destination, flightNumber, airline } = route
  const distKm = Math.round(haversineKm(origin.lat, origin.lon, destination.lat, destination.lon))

  return (
    <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Flight number + airline */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold font-mono tracking-widest px-2.5 py-1 rounded-lg"
          style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.2)' }}>
          {flightNumber}
        </span>
        {airline && <span className="text-xs text-slate-500 truncate max-w-[55%] text-right">{airline}</span>}
      </div>

      {/* Origin → Destination */}
      <div className="flex items-center gap-2">
        {/* Origin */}
        <div className="flex-1 text-center">
          <div className="text-3xl font-black text-white font-mono tracking-tight leading-none">{origin.iata}</div>
          <div className="text-[10px] text-slate-500 mt-1 truncate leading-tight">{origin.city}</div>
        </div>

        {/* Arrow + distance */}
        <div className="flex flex-col items-center shrink-0 px-1">
          <div className="flex items-center gap-1">
            <div className="w-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, #6366f1)' }} />
            <Plane size={12} className="text-violet-400 rotate-90" style={{ transform: 'rotate(90deg)' }} />
            <div className="w-6 h-px" style={{ background: 'linear-gradient(90deg, #6366f1, transparent)' }} />
          </div>
          <div className="text-[10px] text-slate-600 font-mono mt-1">{distKm.toLocaleString()} km</div>
        </div>

        {/* Destination */}
        <div className="flex-1 text-center">
          <div className="text-3xl font-black text-white font-mono tracking-tight leading-none">{destination.iata}</div>
          <div className="text-[10px] text-slate-500 mt-1 truncate leading-tight">{destination.city}</div>
        </div>
      </div>

      {/* Airport full names */}
      <div className="flex justify-between mt-3">
        <span className="text-[10px] text-slate-600 truncate max-w-[46%]">{origin.name}</span>
        <span className="text-[10px] text-slate-600 truncate max-w-[46%] text-right">{destination.name}</span>
      </div>
    </div>
  )
}

export function FlightInfo({ flight, trail }: { flight: FlightState; trail: TrailPosition[] }) {
  const [relTime, setRelTime] = useState('')

  useEffect(() => {
    const update = () => setRelTime(formatDistanceToNow(new Date(flight.updatedAt), { addSuffix: true }))
    update()
    const id = setInterval(update, 15_000)
    return () => clearInterval(id)
  }, [flight.updatedAt])

  const vrMs = flight.verticalRate
  const vrColor = vrMs === null || Math.abs(vrMs) < 0.5
    ? 'text-slate-400' : vrMs > 0 ? 'text-emerald-400' : 'text-red-400'

  const speedKts = flight.velocity !== null ? Math.round(flight.velocity * 1.94384) : null
  const altFt = flight.baroAltitude !== null && flight.baroAltitude > 0
    ? Math.round(flight.baroAltitude * 3.28084 / 100) * 100 : null

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <div className="text-2xl font-black text-white tracking-widest font-mono leading-none">
              {flight.callsign?.trim() ?? flight.icao24.toUpperCase()}
            </div>
            <div className="text-xs text-slate-500 mt-1.5">{getAirlineName(flight.callsign)}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0 mt-0.5">
            <AltBadge altM={flight.baroAltitude} />
            {flight.onGround
              ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">Ground</span>
              : <span className="text-[10px] px-2 py-0.5 rounded-full font-medium animate-pulse-slow"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                  Airborne
                </span>
            }
          </div>
        </div>
      </div>

      {/* ── Route Bar ── */}
      <RouteBar icao24={flight.icao24} callsign={flight.callsign} />

      {/* ── Big Metrics ── */}
      <div className="px-3 py-3 grid grid-cols-2 gap-2">
        <MetricCard
          value={speedKts !== null ? speedKts.toLocaleString() : '—'}
          unit="knots"
          color="#38bdf8"
          label="Ground Speed"
        />
        <MetricCard
          value={altFt !== null ? (altFt / 1000).toFixed(1) : '—'}
          unit="× 1000 ft"
          color="#a78bfa"
          label="Altitude"
        />
      </div>

      {/* ── Vertical Rate ── */}
      <div className="px-3 pb-1">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <VRIcon rate={vrMs} />
            <span>Vertical Rate</span>
          </div>
          <span className={`text-xs font-mono font-semibold ${vrColor}`}>
            {formatVerticalRate(vrMs)}
          </span>
        </div>
      </div>

      {/* ── Detail Rows ── */}
      <div className="px-1 py-2 space-y-0.5">
        <Row icon={<Compass size={13} />}  label="Heading"       value={formatHeading(flight.trueTrack)} />
        <Row icon={<MapPin size={13} />}   label="Position"      value={formatCoords(flight.latitude, flight.longitude)} />
        <Row icon={<Globe size={13} />}    label="Country"       value={flight.originCountry} />
        <Row icon={<Radio size={13} />}    label="ICAO24"        value={flight.icao24.toUpperCase()} />
        {flight.squawk && (
          <Row icon={<Radio size={13} />}  label="Squawk"        value={flight.squawk} />
        )}
        <Row icon={<Clock size={13} />}    label="Last Update"   value={relTime} />
      </div>

      {/* ── Trail ── */}
      {trail.length > 1 && (
        <div className="mx-3 mb-4 mt-2 rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-0.5 rounded-full bg-sky-500" />
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Trail</span>
          </div>
          <div className="flex gap-5">
            <div>
              <div className="text-white text-base font-bold font-mono">{trail.length}</div>
              <div className="text-slate-600 text-[10px] mt-0.5">waypoints</div>
            </div>
            <div>
              <div className="text-white text-base font-bold font-mono">
                {Math.round((Date.now() - trail[0].ts) / 60000)}m
              </div>
              <div className="text-slate-600 text-[10px] mt-0.5">tracked</div>
            </div>
            <div>
              <div className="text-white text-base font-bold font-mono">
                {trail[trail.length-1].alt !== null
                  ? `FL${Math.round((trail[trail.length-1].alt! * 3.28084) / 100).toString().padStart(3,'0')}`
                  : '—'}
              </div>
              <div className="text-slate-600 text-[10px] mt-0.5">current FL</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ value, unit, color, label }: { value: string; unit: string; color: string; label: string }) {
  return (
    <div className="rounded-xl p-3 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="text-2xl font-black font-mono leading-none" style={{ color }}>{value}</div>
      <div className="text-[10px] mt-1 leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>{unit}</div>
      <div className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  )
}
