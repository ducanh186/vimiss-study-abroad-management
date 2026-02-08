@echo off
cd /d "%~dp0.."
echo ========================================
echo Vimiss Study Abroad - Development Mode
echo ========================================
echo.
echo Starting Laravel server (localhost:8000)...
echo Starting Vite dev server (localhost:5173)...
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start Laravel serve in a new window
start "Laravel Server" cmd /k "php artisan serve"

REM Wait 2 seconds for Laravel to start
timeout /t 2 /nobreak >nul

REM Start Vite in current window
npx vite
