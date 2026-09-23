#!/bin/bash
# Start the Funkaari dev server.
# Works even when Node.js is not in your PATH (uses Cursor's bundled node).
set -e
cd "$(dirname "$0")"

# --- Find Node ---
NODE=""
for candidate in \
  "$(command -v node 2>/dev/null)" \
  "/opt/homebrew/bin/node" \
  "/usr/local/bin/node" \
  "/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    NODE="$candidate"
    break
  fi
done

if [ -z "$NODE" ]; then
  echo ""
  echo "ERROR: Node.js not found on this Mac."
  echo ""
  echo "Install it (pick one):"
  echo "  brew install node"
  echo "  https://nodejs.org  (download LTS installer)"
  echo ""
  exit 1
fi

# --- Ensure dependencies ---
if [ ! -d node_modules/next ]; then
  echo "Installing dependencies..."
  NPM=""
  for npm_candidate in \
    "$(command -v npm 2>/dev/null)" \
    "/opt/homebrew/bin/npm" \
    "/usr/local/bin/npm"; do
    if [ -n "$npm_candidate" ] && [ -x "$npm_candidate" ]; then
      NPM="$npm_candidate"
      break
    fi
  done
  if [ -z "$NPM" ]; then
    echo "ERROR: node_modules missing and npm not found."
    echo "Install Node.js (brew install node), then run: npm install"
    exit 1
  fi
  "$NPM" install
fi

# --- Stop stale Next.js servers (leave Code Helper / Cursor alone) ---
is_next_server() {
  local pid="$1"
  local cmd
  cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  echo "$cmd" | grep -qE 'next-server|next dev|node_modules/next|next/dist/bin/next'
}

for p in $(seq 3000 3010); do
  pids="$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true)"
  for pid in $pids; do
    if is_next_server "$pid"; then
      echo "Stopping stale Next.js server on port $p (PID $pid)..."
      kill "$pid" 2>/dev/null || true
    fi
  done
done
sleep 0.5

# --- Pick first free port (prefer 3006+ — 3000-3003 often hijacked by Cursor/Code Helper) ---
PORT=""
for p in 3006 3007 3008 3009 3010 3004 3005 3000 3001 3002 3003; do
  if ! lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    PORT=$p
    break
  fi
done

if [ -z "$PORT" ]; then
  echo ""
  echo "ERROR: Ports 3000-3010 are all in use."
  echo "Close other apps (or quit stale terminals) and retry."
  echo ""
  exit 1
fi

URL="http://127.0.0.1:$PORT"
echo "$PORT" > "$(dirname "$0")/.dev-port"

echo ""
echo "============================================"
echo "  Funkaari — dev server"
echo "============================================"
echo ""
echo "  OPEN THIS IN YOUR BROWSER:"
echo ""
echo "    $URL"
echo ""
echo "  (Also works: http://localhost:$PORT)"
echo "  (Use http:// not https://)"
echo "  (Do NOT just type 'localhost' — include :$PORT)"
echo ""
if [ "$PORT" != "3000" ]; then
  echo "  Note: Port 3000 is busy (often Code Helper/Cursor)."
  echo "        Using port $PORT instead."
  echo ""
fi
echo "  Press Ctrl+C to stop the server."
echo "============================================"
echo ""

# Auto-open browser on macOS
if [ "$(uname)" = "Darwin" ] && command -v open >/dev/null 2>&1; then
  (sleep 3 && open "$URL") &
fi

exec "$NODE" node_modules/next/dist/bin/next dev -p "$PORT" -H 127.0.0.1
