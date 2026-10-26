@echo off
title PKBM Digital Dar El Iman - Frontend (React + Vite)
cd /d "%~dp0"
echo ========================================================
echo   PKBM DIGITAL DAR EL IMAN - FRONTEND (REACT + VITE)
echo   Development Server on http://localhost:5173
echo ========================================================
echo.
npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Gagal menjalankan Vite dev server. Memastikan dependensi npm terpasang...
    call npm install
    npm run dev
)
pause
