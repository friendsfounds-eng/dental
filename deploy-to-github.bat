@echo off
title Push Dental ERP to GitHub for Render Deployment
color 0B
cd /d "%~dp0"

echo ========================================================
echo       PUSH DENTAL ERP CODE TO GITHUB FOR RENDER
echo ========================================================
echo.
echo Make sure you have created an empty repository on GitHub:
echo https://github.com/new
echo.

set /p REPO_URL="Paste your GitHub repository URL here: "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL entered. Aborting.
    pause
    exit /b 1
)

echo.
echo Setting remote repository: %REPO_URL%
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

echo Pushing code to main branch...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] Code uploaded to GitHub successfully!
    echo ========================================================
    echo Now open Render to finish your 1-click free deployment:
    echo 1. Open https://dashboard.render.com
    echo 2. Click "New +" -^> "Web Service"
    echo 3. Choose your repository and click "Deploy"
    echo ========================================================
) else (
    echo.
    echo [ERROR] Git push failed. Please verify your GitHub login or token.
)

pause
