@echo off
title Apex Dental ERP - Master Hosting & Operations Control Panel
color 0B
cd /d "%~dp0"

:MENU
cls
echo ==============================================================================
echo       🦷 APEX DENTAL CLINIC ERP & ODONTOGRAM MANAGEMENT SYSTEM
echo                    PRODUCTION HOSTING & CONTROL PANEL
echo ==============================================================================
echo.
echo   [1] 🚀 Run Local Production Server (Port 5000 - Fast & Stable)
echo   [2] 🌐 Host Online with Public HTTPS Link (Instant Worldwide Access)
echo   [3] ☁️  Push to GitHub for Cloud Hosting on Render (Render.com)
echo   [4] 🔨 Rebuild Frontend Production Bundle (npm run build)
echo   [5] 🩺 Run Health & Diagnostic Test
echo   [6] ❌ Exit
echo.
echo ==============================================================================
set /p CHOICE="Enter your choice (1-6): "

if "%CHOICE%"=="1" goto LOCAL_PROD
if "%CHOICE%"=="2" goto PUBLIC_ONLINE
if "%CHOICE%"=="3" goto DEPLOY_GITHUB
if "%CHOICE%"=="4" goto REBUILD
if "%CHOICE%"=="5" goto HEALTH_CHECK
if "%CHOICE%"=="6" exit /b 0

echo Invalid choice, try again.
timeout /t 2 >nul
goto MENU

:LOCAL_PROD
call start-production.bat
goto MENU

:PUBLIC_ONLINE
call host-online-public.bat
goto MENU

:DEPLOY_GITHUB
call deploy-to-github.bat
goto MENU

:REBUILD
echo.
echo Compiling production assets...
call npm run build
echo Build completed successfully.
pause
goto MENU

:HEALTH_CHECK
echo.
echo Running diagnostic health check on localhost:5000...
powershell -Command "try { $res = Invoke-RestMethod -Uri 'http://127.0.0.1:5000/health' -TimeoutSec 3; Write-Host '[OK] Server is running healthy:' ($res | ConvertTo-Json -Compress) -ForegroundColor Green } catch { Write-Host '[OFFLINE] Server is not currently running on port 5000.' -ForegroundColor Yellow }"
echo.
pause
goto MENU
