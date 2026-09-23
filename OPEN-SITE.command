#!/bin/bash
# Double-click this file in Finder to start the site and open your browser.
# Uses Cursor's bundled Node (no npm in PATH required).

cd "$(dirname "$0")"

NODE="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"
if [ ! -x "$NODE" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -x "$candidate" ]; then NODE="$candidate"; break; fi
  done
fi

if [ ! -x "$NODE" ]; then
  osascript -e 'display alert "Node.js not found" message "Install Node from https://nodejs.org or open this project in Cursor." as critical'
  exit 1
fi

if [ ! -d node_modules/next ]; then
  osascript -e 'display alert "Dependencies missing" message "Open Terminal in this folder and run: npm install" as critical'
  exit 1
fi

# Reuse port if our Next server is already running
for p in 3004 3005 3006 3007 3008 3009 3010; do
  pid=$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null | head -1)
  if [ -n "$pid" ]; then
    cmd=$(ps -p "$pid" -o command= 2>/dev/null)
    if echo "$cmd" | grep -qE 'next dev|next start|next/dist/bin/next'; then
      if curl -s -o /dev/null --connect-timeout 1 "http://127.0.0.1:$p/" 2>/dev/null; then
        open "http://127.0.0.1:$p"
        osascript -e "display notification \"Already running on port $p\" with title \"Funkaari\""
        echo "Server already running at http://127.0.0.1:$p"
        read -r -p "Press Enter to close..."
        exit 0
      fi
    fi
  fi
done

# Pick first free port (3000-3003 usually taken by Cursor/Code Helper)
PORT=""
for p in 3004 3005 3006 3007 3008 3009 3010; do
  if ! lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    PORT=$p
    break
  fi
done

if [ -z "$PORT" ]; then
  osascript -e 'display alert "No free port" message "Ports 3004-3010 are busy. Close other apps and try again." as critical'
  exit 1
fi

URL="http://127.0.0.1:$PORT"
echo "$PORT" > "$(dirname "$0")/.dev-port"

echo ""
echo "============================================"
echo "  Funkaari — starting..."
echo "============================================"
echo ""
echo "  URL:  $URL"
echo ""
echo "  Browser will open in a few seconds."
echo "  Keep this window open while browsing."
echo "  Press Ctrl+C to stop the server."
echo "============================================"
echo ""

# Open browser once server is ready (background watcher)
(
  for i in $(seq 1 30); do
    if curl -s -o /dev/null --connect-timeout 1 "$URL/" 2>/dev/null; then
      open "$URL"
      osascript -e "display notification \"Opening $URL\" with title \"Funkaari\""
      break
    fi
    sleep 1
  done
) &

# Run server in foreground — keeps Terminal alive when double-clicked
exec "$NODE" node_modules/next/dist/bin/next dev -p "$PORT" -H 127.0.0.1
