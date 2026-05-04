import { X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useFlightStore } from '../../store/flightStore'
import { FlightInfo } from './FlightInfo'

export function FlightSidebar() {
  const { selectedIcao, selectFlight } = useUiStore()
  const { getFlight, getTrail } = useFlightStore()

  const flight = selectedIcao ? getFlight(selectedIcao) : null
  const trail = selectedIcao ? getTrail(selectedIcao) : []
  const open = !!flight

  return (
    <div
      className={`absolute top-0 left-0 h-full w-[320px] z-20 transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      <div className="h-full flex flex-col shadow-2xl shadow-black/60"
        style={{
          background: 'rgba(7,11,16,0.92)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Status accent bar */}
        <div
          className="h-0.5 w-full shrink-0 transition-colors duration-500"
          style={{
            background: flight
              ? flight.onGround
                ? 'linear-gradient(90deg, #475569 0%, transparent 100%)'
                : 'linear-gradient(90deg, #22d3ee 0%, #6366f1 50%, transparent 100%)'
              : 'transparent'
          }}
        />

        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Flight Details
            </span>
          </div>
          <button
            onClick={() => selectFlight(null)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {flight ? (
            <FlightInfo flight={flight} trail={trail} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">
              Select a flight
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
