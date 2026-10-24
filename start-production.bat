@echo off
title Apex Dental ERP - Production Server
color 0A
cd /d "%~dp0"

echo ========================================================
echo     APEX DENTAL CLINIC ERP - PRODUCTION SERVER
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js (v18+) from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if client production build exists
if not exist "client\dist\index.html" (
    echo [INFO] Client production build not detected. Building now...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to compile production frontend!
        pause
        exit /b 1
    )
)

set NODE_ENV=production
set PORT=5000

echo.
echo [OK] Production assets verified.
echo Starting Production Server on port 5000...
echo Access in browser: http://localhost:5000
echo.

:: Open browser after 2 seconds in background
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5000"

node server/server.js
pause
