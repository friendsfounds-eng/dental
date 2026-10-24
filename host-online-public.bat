@echo off
title Apex Dental ERP - Instant Public Online Hosting
color 0A
cd /d "%~dp0"

echo ==============================================================================
echo       🦷 APEX DENTAL CLINIC ERP - INSTANT PUBLIC ONLINE HOSTING
echo ==============================================================================
echo.
echo [1/3] Verifying production assets...
if not exist "client\dist\index.html" (
    echo Building frontend production bundle...
    call npm run build
)

echo [2/3] Starting backend production server (Port 5000)...
start "Apex Dental Backend Server" /min cmd /c "node server/server.js"

:: Wait 3 seconds for server to initialize
timeout /t 3 /nobreak >nul

echo [3/3] Generating Public Secure HTTPS Tunnel...
for /f "tokens=*" %%a in ('curl.exe -s https://api.ipify.org') do set PUBLIC_IP=%%a

echo.
echo ==============================================================================
echo  ✅ CLINIC SYSTEM IS NOW ACCESSIBLE WORLDWIDE ONLINE!
echo ==============================================================================
echo  If the webpage asks for a "Tunnel Password", enter your IP below:
echo  👉 YOUR TUNNEL PASSWORD: %PUBLIC_IP%
echo ==============================================================================
echo.
echo Starting secure tunnel connection...
echo (Keep this window open while hosting)
echo.

call npx --yes localtunnel --port 5000 --open
pause
