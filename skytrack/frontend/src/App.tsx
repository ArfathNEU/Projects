import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FlightMap } from './components/Map/FlightMap'
import { FlightSidebar } from './components/Sidebar/FlightSidebar'
import { Header } from './components/UI/Header'
import { SearchBar } from './components/UI/SearchBar'
import { FilterPanel } from './components/UI/FilterPanel'
import { StatsBar } from './components/UI/StatsBar'
import { AiSearchPanel } from './components/UI/AiSearchPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { useUiStore } from './store/uiStore'

const queryClient = new QueryClient()

function AppInner() {
  useWebSocket()
  const { showFilters, showSearch, showAiSearch, setShowSearch, setShowFilters, setShowAiSearch } = useUiStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSearch) setShowSearch(false)
        if (showFilters) setShowFilters(false)
        if (showAiSearch) setShowAiSearch(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showSearch, showFilters, showAiSearch, setShowSearch, setShowFilters, setShowAiSearch])

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#070b10' }}>
      {/* Full-screen map */}
      <FlightMap />

      {/* Sidebar */}
      <FlightSidebar />

      {/* Header + dropdowns overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <Header />
        </div>
        <div className="pointer-events-auto">
          <SearchBar />
        </div>
        <div className="pointer-events-auto">
          <AiSearchPanel />
        </div>
        <div className="pointer-events-auto">
          <FilterPanel />
        </div>
      </div>

      {/* Floating stats bar */}
      <StatsBar />
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}
