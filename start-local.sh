#!/usr/bin/env bash
# Runs the FarmTrust backend and (optionally) the frontend dev server
# together, entirely on localhost. No network egress required except the
# Google OAuth / Stripe calls you opt into by setting keys in server/.env.
#
# Usage:
#   ./start-local.sh              # backend only
#   ./start-local.sh /path/to/app # backend + your existing frontend app

set -e
cd "$(dirname "$0")"

if [ ! -f server/.env ]; then
  echo "[setup] server/.env not found — copying from .env.example"
  cp server/.env.example server/.env
fi

if [ ! -d server/node_modules ]; then
  echo "[setup] installing server dependencies..."
  (cd server && npm install)
fi

echo "[start] backend on http://127.0.0.1:$(grep -E '^PORT=' server/.env | cut -d= -f2 || echo 3001)"
(cd server && npm run dev) &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null" EXIT

if [ -n "$1" ]; then
  APP_DIR="$1"
  echo "[start] frontend at $APP_DIR"
  if [ ! -f "$APP_DIR/.env.local" ] || ! grep -q VITE_API_BASE "$APP_DIR/.env.local" 2>/dev/null; then
    echo "VITE_API_BASE=http://127.0.0.1:3001/api" >> "$APP_DIR/.env.local"
  fi
  (cd "$APP_DIR" && npm run dev)
else
  echo "[info] no frontend path given — backend only. Run your app's"
  echo "       'npm run dev' separately once base44Client.js is patched."
  wait $SERVER_PID
fi
