#!/bin/bash
# SkyTrack startup script — runs backend and frontend concurrently

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🛫  Starting SkyTrack..."
echo ""
echo "  Backend  → http://localhost:3001"
echo "  Frontend → http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Setup .env if missing
if [ ! -f "$ROOT/backend/.env" ]; then
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
  echo "  Created backend/.env from .env.example — add your OpenSky credentials there for better rate limits"
  echo ""
fi

# Run both
(cd "$ROOT/backend" && npm run dev) &
BACKEND_PID=$!

(cd "$ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'Stopped.'" EXIT INT TERM
wait
