#!/bin/bash
# Stop any Next.js dev/start server for this project.
cd "$(dirname "$0")"

for p in $(seq 3004 3010); do
  for pid in $(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null); do
    cmd=$(ps -p "$pid" -o command= 2>/dev/null)
    if echo "$cmd" | grep -qE 'next dev|next start|next/dist/bin/next'; then
      echo "Stopping PID $pid on port $p..."
      kill "$pid" 2>/dev/null
    fi
  done
done

rm -f .dev-port
echo "Done."
