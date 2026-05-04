export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001/ws'
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001'

export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export const DEFAULT_FILTERS = {
  minAltitudeFt: 0,
  maxAltitudeFt: 60_000,
  minSpeedKts: 0,
  maxSpeedKts: 1_200,
  onlyAirborne: false,
  onlyGround: false,
  countryFilter: '',
}

// Airplane SVG pointing north (up), white fill — used as MapLibre SDF icon
export const PLANE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <path d="M20 3 L23 16 L36 22 L34 25 L23 20 L24 30 L28 33 L28 36 L20 33 L12 36 L12 33 L16 30 L17 20 L6 25 L4 22 L17 16 Z" fill="white"/>
</svg>`

export const AIRLINE_NAMES: Record<string, string> = {
  AAL: 'American Airlines', DAL: 'Delta Air Lines', UAL: 'United Airlines',
  SWA: 'Southwest Airlines', ASA: 'Alaska Airlines', JBU: 'JetBlue',
  BAW: 'British Airways', DLH: 'Lufthansa', AFR: 'Air France',
  KLM: 'KLM Royal Dutch', UAE: 'Emirates', QTR: 'Qatar Airways',
  SIA: 'Singapore Airlines', ANA: 'All Nippon Airways', JAL: 'Japan Airlines',
  CCA: 'Air China', CSN: 'China Southern', CES: 'China Eastern',
  THY: 'Turkish Airlines', ETH: 'Ethiopian Airlines', QFA: 'Qantas',
  EZY: 'easyJet', RYR: 'Ryanair', VLG: 'Vueling', IBE: 'Iberia',
  SWR: 'Swiss International', AUA: 'Austrian Airlines', FIN: 'Finnair',
  SAS: 'Scandinavian Airlines', TAP: 'TAP Portugal', LOT: 'LOT Polish',
  WZZ: 'Wizz Air', NOZ: 'Norwegian', TRA: 'Transavia',
  ETD: 'Etihad Airways', SVA: 'Saudia', KAC: 'Kuwait Airways',
  MEA: 'Middle East Airlines', GFA: 'Gulf Air', OMA: 'Oman Air',
  FLY: 'flydubai', ABY: 'Air Arabia', ELY: 'El Al', MSR: 'EgyptAir',
  RAM: 'Royal Air Maroc', KQA: 'Kenya Airways', SAA: 'South African Airways',
  AMX: 'Aeromexico', GLO: 'Gol', TAM: 'LATAM Brasil', LAN: 'LATAM',
  AVA: 'Avianca', CAL: 'China Airlines', AXM: 'AirAsia',
  MAS: 'Malaysia Airlines', THA: 'Thai Airways', PAL: 'Philippine Airlines',
  GIA: 'Garuda Indonesia', KAL: 'Korean Air', AAR: 'Asiana Airlines',
  FDX: 'FedEx Express', UPS: 'UPS Airlines', GTI: 'Atlas Air',
  HAL: 'Hawaiian Airlines', SKW: 'SkyWest', ENY: 'Envoy Air',
}

export function getAirlineName(callsign: string | null): string {
  if (!callsign) return 'Unknown Airline'
  const prefix = callsign.replace(/[0-9]/g, '').toUpperCase().slice(0, 3)
  return AIRLINE_NAMES[prefix] ?? `${prefix} (Unknown)`
}
