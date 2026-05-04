import { useState } from 'react'
import { Sparkles, X, Search, Loader2 } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { API_BASE, getAirlineName } from '../../lib/constants'
import { formatAltitude, formatSpeed } from '../../lib/geo'
import type { FlightState } from '../../types'

export function AiSearchPanel() {
  const { showAiSearch, setShowAiSearch, aiQuery, setAiQuery, selectFlight } = useUiStore()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FlightState[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  if (!showAiSearch) return null

  const handleSearch = async () => {
    if (!aiQuery.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/ai/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      })
      if (!res.ok) { const j = await res.json() as { error: string }; throw new Error(j.error ?? 'Search failed') }
      const data = await res.json() as { flights: FlightState[]; total: number }
      setResults(data.flights); setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-lg z-30 px-3 animate-slide-down">
      <div className="overflow-hidden shadow-2xl shadow-black/60"
        style={{
          background: 'rgba(7,11,16,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '16px',
        }}>
        {/* Input row */}
        <div className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Sparkles size={14} className="text-violet-400 shrink-0" />
          <input
            type="text"
            placeholder='e.g. "wide-body flights above 40,000ft heading west"'
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
            autoFocus
          />
          <button onClick={handleSearch} disabled={loading || !aiQuery.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: 'white' }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            Search
          </button>
          <button onClick={() => setShowAiSearch(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
            <X size={14} />
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 text-xs text-red-400" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {error}
          </div>
        )}

        {!loading && total > 0 && (
          <div className="px-4 py-2.5" style={{ background: 'rgba(139,92,246,0.06)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            <p className="text-xs font-medium" style={{ color: '#c4b5fd' }}>
              {total.toLocaleString()} flights match your query
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 py-1">
            {results.map(f => (
              <button key={f.icao24}
                onClick={() => { selectFlight(f.icao24); setShowAiSearch(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left group">
                <div className={`w-2 h-2 rounded-full shrink-0 ${f.onGround ? 'bg-slate-600' : 'bg-violet-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-mono font-semibold text-sm group-hover:text-violet-300 transition-colors">
                    {f.callsign ?? f.icao24.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">{getAirlineName(f.callsign)}</div>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="text-xs text-slate-400 font-mono">{formatAltitude(f.baroAltitude)}</div>
                  <div className="text-[11px] text-slate-600 font-mono">{formatSpeed(f.velocity)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="px-4 py-5 text-center">
            <p className="text-xs text-slate-600">Describe flights in plain English — Claude will find them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
