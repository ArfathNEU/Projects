import { create } from 'zustand'

interface UiStore {
  selectedIcao: string | null
  showFilters: boolean
  showSearch: boolean
  searchQuery: string
  showAiSearch: boolean
  aiQuery: string
  mapCenter: [number, number]
  mapZoom: number

  selectFlight: (icao24: string | null) => void
  setShowFilters: (show: boolean) => void
  setShowSearch: (show: boolean) => void
  setSearchQuery: (q: string) => void
  setShowAiSearch: (show: boolean) => void
  setAiQuery: (q: string) => void
  setMapView: (center: [number, number], zoom: number) => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedIcao: null,
  showFilters: false,
  showSearch: false,
  searchQuery: '',
  showAiSearch: false,
  aiQuery: '',
  mapCenter: [0, 20],
  mapZoom: 2.5,

  selectFlight: (icao24) => set({ selectedIcao: icao24 }),
  setShowFilters: (showFilters) => set({ showFilters }),
  setShowSearch: (showSearch) => set({ showSearch }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setShowAiSearch: (showAiSearch) => set({ showAiSearch }),
  setAiQuery: (aiQuery) => set({ aiQuery }),
  setMapView: (mapCenter, mapZoom) => set({ mapCenter, mapZoom }),
}))
