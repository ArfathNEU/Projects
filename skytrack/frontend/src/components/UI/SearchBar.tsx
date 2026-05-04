import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useFlightStore } from '../../store/flightStore'
import { useUiStore } from '../../store/uiStore'
import { getAirlineName } from '../../lib/constants'
import { formatAltitude, formatSpeed } from '../../lib/geo'
import type { FlightState } from '../../types'

export function SearchBar() {
  const { showSearch, setShowSearch, searchQuery, setSearchQuery, selectFlight } = useUiStore()
  const { flights } = useFlightStore()
  const [results, setResults] = useState<FlightState[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showSearch) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showSearch])

  useEffect(() => {
    if (!searchQuery.trim()) { setResults([]); return }
    const q = searchQuery.toLowerCase()
    const found: FlightState[] = []
    for (const f of flights.values()) {
      if (f.icao24.toLowerCase().includes(q) || f.callsign?.toLowerCase().includes(q) || f.originCountry.toLowerCase().includes(q)) {
        found.push(f)
        if (found.length >= 10) break
      }
    }
    setResults(found)
  }, [searchQuery, flights])

  if (!showSearch) return null

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-md z-30 px-3 animate-slide-down">
      <div className="overflow-hidden shadow-2xl shadow-black/60"
        style={{
          background: 'rgba(7,11,16,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
        }}>
        {/* Input row */}
        <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Search size={14} className="text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Callsign, ICAO24, or country…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-600 hover:text-slate-300 transition-colors">
              <X size={13} />
            </button>
          )}
          <button onClick={() => { setShowSearch(false); setSearchQuery('') }}
            className="text-slate-600 hover:text-slate-300 transition-colors">
            <X size={14} />
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 py-1">
            {results.map(f => (
              <button key={f.icao24}
                onClick={() => { selectFlight(f.icao24); setShowSearch(false); setSearchQuery('') }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left group">
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${f.onGround ? 'bg-slate-600' : 'bg-emerald-400'}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white font-mono font-semibold text-sm group-hover:text-sky-300 transition-colors">
                      {f.callsign ?? f.icao24.toUpperCase()}
                    </span>
                    {f.onGround && <span className="text-[10px] text-slate-600">ground</span>}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">{getAirlineName(f.callsign)}</div>
                </div>

                {/* Metrics */}
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="text-xs text-slate-400 font-mono">{formatAltitude(f.baroAltitude)}</div>
                  <div className="text-[11px] text-slate-600 font-mono">{formatSpeed(f.velocity)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {searchQuery && results.length === 0 && (
          <div className="px-4 py-6 text-center text-slate-600 text-sm">No flights matching "{searchQuery}"</div>
        )}

        {!searchQuery && (
          <div className="px-4 py-4 text-xs text-slate-700 text-center">
            Try DLH441, a4b293, or United States
          </div>
        )}
      </div>
    </div>
  )
}
