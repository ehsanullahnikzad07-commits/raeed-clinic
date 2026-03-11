@echo off
cd /d "%~dp0"
title Raeed OPD Clinic - Build EXE (PKG Method)
color 0A
echo.
echo  ==========================================
echo   Raeed OPD Clinic - EXE Builder (PKG)
echo   Developer: Ehsanullah Nikzad
echo  ==========================================
echo.

:: Restore original package.json (not electron one)
copy /Y package-original.json package.json >nul 2>&1

echo [1/3] Installing pkg globally...
call npm install -g pkg
if %errorlevel% neq 0 (
    echo ERROR: Could not install pkg!
    pause & exit /b 1
)

echo [2/3] Installing app dependencies...
call npm install --ignore-scripts
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause & exit /b 1
)

echo [3/3] Building EXE...
call pkg app.js --targets node18-win-x64 --output "dist\RaeedClinic.exe" --compress GZip
if %errorlevel% neq 0 (
    echo ERROR: pkg build failed!
    pause & exit /b 1
)

echo.
echo  ==========================================
echo   SUCCESS! RaeedClinic.exe is in dist folder
echo   
echo   NOTE: Copy the "public" and "routes" and
echo   "database.js" folders next to the EXE
echo  ==========================================
explorer "%~dp0dist"
pause
