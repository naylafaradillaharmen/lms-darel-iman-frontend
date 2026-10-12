@echo off
title PKBM Digital Dar El Iman - Frontend SPA
cd /d "%~dp0"
echo Membuka Frontend SPA PKBM Digital Dar El Iman di browser...
start index.html
echo Melayani via HTTP server lokal (Vite / Serve)...
call npx -y serve -l 5173 .
pause
