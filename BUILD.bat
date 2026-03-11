@echo off
cd /d "%~dp0"
title Raeed OPD Clinic - Build EXE
color 0A
echo.
echo  ==========================================
echo   Raeed OPD Clinic - EXE Builder
echo   Developer: Ehsanullah Nikzad
echo  ==========================================
echo.

if not exist "package-electron.json" (
    echo ERROR: Run this from raeed-clinic folder!
    pause & exit /b 1
)

echo [1/4] Setting up package.json...
copy /Y "package-electron.json" "package.json" >nul
echo     Done!

echo [2/4] Removing old modules...
if exist node_modules rmdir /s /q node_modules

echo [3/4] Installing all dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause & exit /b 1
)
echo     Done!

echo [4/4] Building EXE (this takes 5-15 minutes)...
call npm run build-win
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause & exit /b 1
)

echo.
echo  ==========================================
echo   SUCCESS! Check the "dist" folder
echo  ==========================================
explorer "%~dp0dist"
pause
