# ✈ SkyTrack — Live Global Flight Tracker

A full-stack, real-time flight tracking web application in the style of Flightradar24 and FlightAware — built with React, MapLibre GL, Fastify, and WebSockets. Tracks **5,000+ aircraft worldwide** with live ADS-B data, smooth 60fps interpolation, great-circle route lines, and an AI-powered natural-language search.

---

## Screenshots

### Flight Detail — Route & Trail
> Select any aircraft to see its origin → destination, great-circle route on the map, speed, altitude, vertical rate, and live trail.

![Flight detail showing IXE to DEL route](docs/screenshot-india.png)

---

### Great-Circle Route Visualization
> Long-haul routes arc over the globe naturally. JAL407 Tokyo (NRT) → Frankfurt (FRA), 9,367 km over Russia.

![JAL407 NRT to FRA great-circle route](docs/screenshot-jal.png)

---

### Transatlantic Flights
> UAL1162 Aguadilla (BQN) → Newark (EWR). Route, altitude, and live stats visible at a glance.

![UAL1162 BQN to EWR](docs/screenshot-ual.png)

---

### Global Live Traffic
> 5,100+ aircraft live at any time. Altitude-coded colors: **ice blue** (>30k ft), **white** (15–30k ft), **orange** (<15k ft).

![Global live traffic view](docs/screenshot-global.png)

---

## Features

| | |
|---|---|
| **Live ADS-B data** | Powered by [adsb.lol](https://adsb.lol) — no API key, no rate limits, worldwide coverage |
| **Real-time WebSocket** | Snapshot on connect, delta updates every 15 s, auto-reconnect |
| **60fps interpolation** | Dead-reckoning via `requestAnimationFrame` — planes glide smoothly between server updates |
| **Great-circle routes** | Click any flight → origin/destination airports appear with a dashed arc on the map |
| **Flight info** | Callsign, airline, IATA route (e.g. `NRT → FRA`), altitude FL, speed, vertical rate, squawk, trail |
| **Altitude color tiers** | Ice blue · white · orange · amber · slate — see descent/climb patterns at a glance |
| **Trail tracking** | Up to 100 waypoints per aircraft, shown as a dashed blue trail on selection |
| **AI Search** | Natural-language queries powered by Claude (`"wide-body flights above 40,000ft heading west"`) |
| **Filters** | Altitude range, speed range, airborne-only / ground-only, country |
| **Search** | Instant search by callsign, ICAO24 hex, or country |
| **Stats bar** | Live totals: airborne · ground · avg FL · avg speed · connected viewers |

---

## Tech Stack

### Frontend
| | |
|---|---|
| **React 18** + TypeScript | UI framework |
| **MapLibre GL JS v4** | WebGL map renderer |
| **CARTO Dark Matter** | Map tile style |
| **Zustand** | Flight store + UI state |
| **TanStack Query** | Route lookup caching |
| **Tailwind CSS** | Utility styling |
| **Inter + JetBrains Mono** | Typography |
| **Vite** | Dev server + bundler |

### Backend
| | |
|---|---|
| **Fastify** + TypeScript | HTTP + WebSocket server |
| **adsb.lol API** | Real-time ADS-B flight feed |
| **RBush** | R-tree spatial index for bounding-box queries |
| **Anthropic SDK** | Claude `claude-sonnet-4-6` for AI search |
| **tsx** | TypeScript execution (dev) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Clone
```bash
git clone https://github.com/ArfathNEU/skytrack.git
cd skytrack
```

### 2. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure environment (optional)
```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...   # Only needed for AI Search feature
```

### 4. Run both servers
```bash
# From the skytrack root:
bash start.sh
```

Or separately:
```bash
# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

### 5. Open
```
http://localhost:5173
```

---

## Project Structure

```
skytrack/
├── backend/
│   └── src/
│       ├── index.ts          # Fastify server + WebSocket broadcast
│       ├── opensky.ts        # adsb.lol ADS-B poller
│       ├── flightState.ts    # In-memory store + RBush spatial index
│       ├── websocket.ts      # Snapshot/delta WebSocket handler
│       └── routes/
│           ├── flights.ts    # REST API (flights, search, route lookup)
│           └── ai.ts         # Claude AI natural-language search
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Map/
│       │   │   └── FlightMap.tsx     # MapLibre GL map + rAF loop
│       │   ├── Sidebar/
│       │   │   ├── FlightSidebar.tsx
│       │   │   └── FlightInfo.tsx
│       │   └── UI/
│       │       ├── Header.tsx
│       │       ├── StatsBar.tsx
│       │       ├── SearchBar.tsx
│       │       ├── FilterPanel.tsx
│       │       └── AiSearchPanel.tsx
│       ├── store/
│       │   ├── flightStore.ts        # Zustand — flights, trails, filters
│       │   └── uiStore.ts            # Zustand — selection, panel visibility
│       ├── hooks/
│       │   ├── useWebSocket.ts       # WS connection + snapshot/delta reducer
│       │   └── useFlightRoute.ts     # TanStack Query — route lookups
│       └── lib/
│           ├── geo.ts                # Great-circle math, formatters
│           └── constants.ts          # Map style, airline names
└── start.sh                          # Convenience launcher
```

---

## How It Works

```
adsb.lol ──(every 15s)──► Backend poller
                              │
                              ▼
                         FlightStore (Map + RBush)
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             REST API              WebSocket
          /api/flights          snapshot on connect
          /api/search           delta every 15s
          /api/.../route
          /api/ai/search
                    │                    │
                    └─────────┬──────────┘
                              ▼
                    React frontend (Zustand)
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             MapLibre GL           Flight sidebar
             rAF 60fps loop        Route bar
             5 altitude tiers      AI search panel
             glow halo             Stats bar
```

**Position interpolation:** The server pushes updates every 15 seconds. Between updates, each aircraft's position is dead-reckoned using its last known velocity and heading, updated at 60fps inside a `requestAnimationFrame` loop. This eliminates the "jump" you'd see with a naive setInterval approach.

**Route data:** When a flight is selected, the backend calls `api.adsbdb.com/v0/callsign/:callsign` to resolve origin/destination airports. Results are cached for 10 minutes. The frontend draws a great-circle arc using spherical linear interpolation.

**AI search:** The `/api/ai/search` endpoint sends the user's query to Claude with a `apply_flight_filter` tool. Claude extracts structured filter parameters (min/max altitude, speed, country, etc.) which are applied against the in-memory flight store.

---

## API Reference

| Endpoint | Description |
|---|---|
| `GET /api/flights` | All current flights (optional `?minLon=&minLat=&maxLon=&maxLat=` bbox) |
| `GET /api/flights/:icao24` | Single flight + trail |
| `GET /api/flights/:icao24/route` | Origin/destination via adsbdb.com |
| `GET /api/search?q=` | Search by callsign / ICAO24 / country |
| `GET /api/stats` | Global stats + connected client count |
| `POST /api/ai/search` | Claude-powered natural-language filter |
| `GET /api/health` | Health check |
| `WS /ws` | WebSocket — snapshot + live deltas |

---

## Data Sources

| Source | Used for |
|---|---|
| [adsb.lol](https://adsb.lol) | Live ADS-B flight positions (free, no key) |
| [adsbdb.com](https://www.adsbdb.com) | Callsign → route + airline lookup (free) |
| [CARTO](https://carto.com/basemaps) | Dark map tiles (free) |

---

## License

MIT
