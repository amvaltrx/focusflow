@echo off
echo Starting FocusFlow Background Services with Auto-Reload...

REM Start the Node.js Backend Server with --watch
start "FocusFlow Backend" cmd /k "cd backend && npm run dev"

REM Start the Vite React Frontend
start "FocusFlow Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers are starting up in separate windows.
echo Backend: Watch mode enabled (will restart on changes)
echo Frontend: http://localhost:5173 (Hot Module Replacement enabled)
