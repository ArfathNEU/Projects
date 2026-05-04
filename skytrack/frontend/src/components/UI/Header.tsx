import { Wifi, WifiOff, Loader2, SlidersHorizontal, Search, Sparkles } from 'lucide-react'
import { useFlightStore } from '../../store/flightStore'
import { useUiStore } from '../../store/uiStore'

function ConnectionDot() {
  const { wsConnected, wsReconnecting } = useFlightStore()
  if (wsReconnecting) return (
    <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
      <Loader2 size={11} className="animate-spin" />
      Reconnecting
    </span>
  )
  return wsConnected ? (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span className="text-emerald-400 text-xs font-medium tracking-wide">LIVE</span>
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-slate-500 text-xs">
      <WifiOff size={11} />
      Offline
    </span>
  )
}

function StatChip({ value, label, color = 'text-white' }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-sm font-semibold font-mono tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

export function Header() {
  const { stats } = useFlightStore()
  const { showFilters, setShowFilters, showSearch, setShowSearch, showAiSearch, setShowAiSearch } = useUiStore()

  return (
    <header className="px-3 pt-3 pb-0 flex items-center gap-2">
      {/* Logo pill */}
      <div className="flex items-center gap-2.5 glass rounded-xl px-3 py-2 shadow-lg shadow-black/30 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' }}>
          <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
            <path d="M10 1 L11.2 7.5 L18 10.5 L17 12.5 L11.2 10 L12 15.5 L14.5 17 L14.5 18.5 L10 16.5 L5.5 18.5 L5.5 17 L8 15.5 L8.8 10 L3 12.5 L2 10.5 L8.8 7.5 Z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-base tracking-tight leading-none">SkyTrack</span>
          <ConnectionDot />
        </div>
      </div>

      {/* Stats pill — hidden on small screens */}
      {stats && (
        <div className="hidden md:flex items-center gap-4 glass rounded-xl px-4 py-2 shadow-lg shadow-black/30">
          <StatChip value={stats.totalFlights.toLocaleString()} label="total" />
          <div className="w-px h-3 bg-white/10" />
          <StatChip value={stats.airborne.toLocaleString()} label="airborne" color="text-sky-300" />
          <div className="w-px h-3 bg-white/10" />
          <StatChip value={stats.onGround.toLocaleString()} label="ground" color="text-slate-400" />
          <div className="w-px h-3 bg-white/10" />
          <StatChip
            value={stats.avgAltitudeFt ? `FL${Math.round(stats.avgAltitudeFt / 100).toString().padStart(3,'0')}` : '—'}
            label="avg alt"
            color="text-violet-300"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => { setShowAiSearch(!showAiSearch); if (showSearch) setShowSearch(false) }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 shadow-lg shadow-black/30 ${
            showAiSearch
              ? 'bg-violet-600 text-white shadow-violet-900/40'
              : 'glass text-slate-300 hover:text-white hover:border-violet-500/30'
          }`}
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">AI Search</span>
        </button>

        <button
          onClick={() => { setShowSearch(!showSearch); if (showAiSearch) setShowAiSearch(false) }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 shadow-lg shadow-black/30 ${
            showSearch
              ? 'bg-sky-600 text-white shadow-sky-900/40'
              : 'glass text-slate-300 hover:text-white hover:border-sky-500/30'
          }`}
        >
          <Search size={13} />
          <span className="hidden sm:inline">Search</span>
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 shadow-lg shadow-black/30 ${
            showFilters
              ? 'bg-sky-600 text-white shadow-sky-900/40'
              : 'glass text-slate-300 hover:text-white hover:border-sky-500/30'
          }`}
        >
          <SlidersHorizontal size={13} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>
    </header>
  )
}
