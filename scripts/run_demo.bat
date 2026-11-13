@echo off
echo ========================================================
echo        VOXFABLE DEMO LAUNCHER (WINDOWS)
echo ========================================================

set SCRIPT_DIR=%~dp0..
cd /d "%SCRIPT_DIR%"

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "VoxFable Backend (FastAPI)" cmd /k "python -m uvicorn backend.app.main:app --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Vite Dev Server on http://localhost:5173 ...
start "VoxFable Frontend (Vite)" cmd /k "cd frontend && npm run dev"

timeout /t 2 /nobreak >nul
echo.
echo Both servers started!
echo Open your browser to: http://localhost:5173
echo Backend API Docs at:  http://localhost:8000/docs
echo ========================================================
pause
