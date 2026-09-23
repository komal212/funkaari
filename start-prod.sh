#!/bin/bash
# Production mode: build once, then serve (more stable than dev).
set -e
cd "$(dirname "$0")"

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
  echo "ERROR: Node.js not found. Install: brew install node"
  exit 1
fi

PORT=""
for p in 3000 3001 3002 3003 3004 3005; do
  if ! lsof -i :"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    PORT=$p
    break
  fi
done

if [ -z "$PORT" ]; then
  echo "ERROR: Ports 3000-3005 are all in use."
  exit 1
fi

URL="http://127.0.0.1:$PORT"
echo "$PORT" > "$(dirname "$0")/.dev-port"

echo "Building..."
"$NODE" node_modules/next/dist/bin/next build

echo ""
echo "============================================"
echo "  OPEN THIS IN YOUR BROWSER:"
echo "    $URL"
echo "============================================"
echo ""

if [ "$(uname)" = "Darwin" ] && command -v open >/dev/null 2>&1; then
  (sleep 2 && open "$URL") &
fi

exec "$NODE" node_modules/next/dist/bin/next start -p "$PORT" -H 127.0.0.1
