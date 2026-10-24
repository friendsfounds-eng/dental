@echo off
title Apex Dental ERP & Clinic System
color 0B
cd /d "%~dp0"

echo ========================================================
echo         APEX DENTAL CLINIC MANAGEMENT SOFTWARE
echo    WhatsApp Automation + AI Assistant + Odontogram
echo ========================================================
echo.
echo Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js from https://nodejs.org/ to run this software.
    pause
    exit /b 1
)

echo Starting Dental Clinic ERP System...
echo Web App will open at: http://localhost:3000
echo.
node run.js
pause
