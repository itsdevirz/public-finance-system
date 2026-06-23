@echo off
title Public Finance System
echo Starting Public Finance System...
echo.

:: Start backend in a new window
start "Backend - Public Finance" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Small delay
timeout /t 2 /nobreak >nul

:: Start frontend in a new window
start "Frontend - Public Finance" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Both servers are starting...
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5173
echo.
echo Close the opened terminal windows to stop the servers.
pause
