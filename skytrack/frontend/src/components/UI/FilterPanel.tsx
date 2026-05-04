import { X, RotateCcw } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useFlightStore } from '../../store/flightStore'

function RangeSlider({
  label, min, max, value, unit, step = 1,
  onChange,
}: {
  label: string; min: number; max: number; value: [number, number]
  unit: string; step?: number; onChange: (val: [number, number]) => void
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <span className="text-xs font-mono font-semibold"
          style={{ background: 'rgba(56,189,248,0.1)', color: '#7dd3fc', padding: '1px 8px', borderRadius: '6px' }}>
          {value[0].toLocaleString()} – {value[1].toLocaleString()} {unit}
        </span>
      </div>
      <div className="space-y-2.5">
        <input type="range" min={min} max={max} step={step} value={value[0]}
          onChange={e => onChange([parseInt(e.target.value), value[1]])} />
        <input type="range" min={min} max={max} step={step} value={value[1]}
          onChange={e => onChange([value[0], parseInt(e.target.value)])} />
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-2 group">
      <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-all duration-200 focus:outline-none"
        style={{
          background: checked
            ? 'linear-gradient(135deg, #0ea5e9, #6366f1)'
            : 'rgba(255,255,255,0.08)',
          boxShadow: checked ? '0 0 10px rgba(56,189,248,0.3)' : 'none',
        }}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${
          checked ? 'left-4' : 'left-0.5'
        }`} />
      </button>
    </label>
  )
}

export function FilterPanel() {
  const { showFilters, setShowFilters } = useUiStore()
  const { filters, setFilters, resetFilters } = useFlightStore()

  if (!showFilters) return null

  return (
    <div className="absolute top-16 right-3 w-72 z-30 animate-slide-down">
      <div className="shadow-2xl shadow-black/60 overflow-hidden"
        style={{
          background: 'rgba(7,11,16,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="text-sm font-semibold text-white tracking-tight">Filters</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={resetFilters}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }} title="Reset">
              <RotateCcw size={12} />
            </button>
            <button onClick={() => setShowFilters(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <RangeSlider
            label="Altitude" min={0} max={60_000} step={500} unit="ft"
            value={[filters.minAltitudeFt, filters.maxAltitudeFt]}
            onChange={([min, max]) => setFilters({ minAltitudeFt: min, maxAltitudeFt: max })}
          />
          <RangeSlider
            label="Ground Speed" min={0} max={1_200} step={10} unit="kts"
            value={[filters.minSpeedKts, filters.maxSpeedKts]}
            onChange={([min, max]) => setFilters({ minSpeedKts: min, maxSpeedKts: max })}
          />

          <div className="pt-1 pb-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Toggle label="Airborne only" checked={filters.onlyAirborne}
              onChange={v => setFilters({ onlyAirborne: v, onlyGround: v ? false : filters.onlyGround })} />
            <Toggle label="On ground only" checked={filters.onlyGround}
              onChange={v => setFilters({ onlyGround: v, onlyAirborne: v ? false : filters.onlyAirborne })} />
          </div>

          <div className="mt-3">
            <label className="block text-xs text-slate-500 font-medium mb-2">Filter by country</label>
            <input
              type="text"
              placeholder="e.g. United States"
              value={filters.countryFilter}
              onChange={e => setFilters({ countryFilter: e.target.value })}
              className="w-full text-sm text-white placeholder-slate-700 outline-none rounded-lg px-3 py-2 transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
