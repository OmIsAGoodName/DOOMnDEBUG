#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "========================================================"
echo "        VOXFABLE DEMO LAUNCHER (UNIX/MACOS)"
echo "========================================================"

echo "[1/2] Starting FastAPI Backend on http://localhost:8000 ..."
python -m uvicorn backend.app.main:app --port 8000 --reload &
BACKEND_PID=$!

sleep 2

echo "[2/2] Starting Frontend Vite Dev Server on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Both servers running in background."
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "Press Ctrl+C to terminate both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT SIGTERM EXIT
wait
