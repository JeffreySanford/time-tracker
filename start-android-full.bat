@echo off
echo Starting Android Development Environment...
echo.

echo [1/3] Starting Frontend Server (with Android network binding)...
start "Frontend Server" cmd /c "npm run start:frontend:android"

echo [2/3] Starting Backend API Server...
start "Backend Server" cmd /c "npm run start:backend"

echo [3/3] Waiting for servers to start (15 seconds)...
timeout /t 15 /nobreak > nul

echo.
echo Servers should now be running. Starting Android app...
echo Frontend: http://localhost:4200 (accessible to emulator via 10.0.2.2:4200)
echo Backend: http://localhost:3000
echo.

call npm run android:dev
