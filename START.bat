@echo off
cd /d "%~dp0"
title Raeed OPD Clinic

echo.
echo  ==========================================
echo   Raeed OPD Clinic - Starting...
echo  ==========================================
echo.

if not exist "node_modules" (
    echo Installing dependencies, please wait...
    call npm install
    echo.
)

echo Starting server...
echo.
start "" /min cmd /c "node app.js"

timeout /t 3 /nobreak >nul

start http://localhost:47291

echo  Server is running at http://localhost:47291
echo  You can close this window.
echo.
pause
