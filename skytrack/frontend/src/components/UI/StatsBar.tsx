import { useFlightStore } from '../../store/flightStore'

export function StatsBar() {
  const { stats, lastUpdateTs } = useFlightStore()
  if (!stats) return null

  const secAgo = lastUpdateTs ? Math.round((Date.now() - lastUpdateTs) / 1000) : null
  const freshness = secAgo === null ? '—' : secAgo < 5 ? 'just now' : `${secAgo}s ago`

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-max max-w-[calc(100vw-2rem)]">
      <div className="flex items-center gap-0 glass rounded-2xl px-1 py-1 shadow-2xl shadow-black/50 animate-fade-in overflow-x-auto scrollbar-thin">
        <Pill
          value={stats.airborne.toLocaleString()}
          label="airborne"
          dot="bg-emerald-400"
        />
        <Sep />
        <Pill
          value={stats.onGround.toLocaleString()}
          label="ground"
          dot="bg-slate-500"
        />
        <Sep />
        <Pill
          value={stats.avgAltitudeFt
            ? `FL${Math.round(stats.avgAltitudeFt / 100).toString().padStart(3,'0')}`
            : '—'}
          label="avg alt"
          dot="bg-violet-400"
        />
        <Sep />
        <Pill
          value={stats.avgSpeedKts ? `${stats.avgSpeedKts} kts` : '—'}
          label="avg spd"
          dot="bg-sky-400"
        />
        {stats.connectedClients !== undefined && (
          <>
            <Sep />
            <Pill
              value={stats.connectedClients.toString()}
              label="viewers"
              dot="bg-amber-400"
            />
          </>
        )}
        <Sep />
        <div className="px-2.5 py-1 text-xs text-slate-600 font-mono tabular-nums">
          {freshness}
        </div>
      </div>
    </div>
  )
}

function Pill({ value, label, dot }: { value: string; label: string; dot: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span className="text-white text-sm font-semibold font-mono tabular-nums">{value}</span>
      <span className="text-slate-500 text-xs">{label}</span>
    </div>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-white/[0.06]" />
}
