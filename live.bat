@echo off
color 0a
echo ========================================================
echo       FocusFlow LIVE DEVELOPMENT MODE
echo ========================================================
echo.
echo  [x] Instant Updates (HMR) Enabled
echo  [x] Backend Watch Mode Enabled
echo  [x] Local Network Access Enabled
echo.
echo  YOUR LIVE DEV LINKS:
echo  -------------------------------------------------------
echo  Main Laptop:    http://localhost:5173
echo  Other Devices:  http://192.168.1.3:5173
echo  -------------------------------------------------------
echo.
echo  Starting Backend API (Auto-Restart)...
start "FocusFlow Backend" cmd /k "cd backend && npm run dev"

echo  Starting Frontend Live Dev...
cd frontend
npm run dev
pause
