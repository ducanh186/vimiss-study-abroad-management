@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

:: ============================================================
::   Vimiss Study Abroad Management - Development Server
:: ============================================================

title Vimiss Dev Server

echo.
echo  ==========================================
echo    Vimiss Study Abroad - Dev Server
echo  ==========================================
echo.

:: ── [1/6] Kill existing processes on ports 8000 & 5173 ──────
echo  [1/6] Freeing ports 8000 ^& 5173...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr " :8000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr " :5173 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: ── [2/6] Clear all Laravel caches ─────────────────────────
echo  [2/6] Clearing Laravel caches...
php artisan cache:clear >nul 2>&1
php artisan config:clear >nul 2>&1
php artisan route:clear >nul 2>&1
php artisan view:clear >nul 2>&1

:: ── [3/6] Clear old session files ──────────────────────────
echo  [3/6] Clearing stale sessions...
del /Q "%~dp0storage\framework\sessions\*" >nul 2>&1

:: ── [4/6] Ensure DB is migrated + seeded ───────────────────
echo  [4/6] Checking database...
php artisan migrate --force >nul 2>&1
if %errorlevel% neq 0 (
    echo         WARNING: Migration failed - check DB config
) else (
    echo         Migrations OK
)
php artisan db:seed --force >nul 2>&1
if %errorlevel% neq 0 (
    echo         WARNING: Seeding failed
) else (
    echo         Demo accounts ready
)

:: ── [5/6] Start Vite dev server ─────────────────────────────
:: /D sets working dir - avoids nested-quote bug with cmd /k "..."
echo  [5/6] Starting Vite dev server (:5173)...
start "Vimiss - Vite" /D "%~dp0" cmd /k npm run dev
timeout /t 3 /nobreak >nul

:: ── [6/6] Start Laravel + open browser ─────────────────────
echo  [6/6] Starting Laravel (:8000)...
echo.
echo  ==========================================
echo    Laravel : http://localhost:8000
echo    Vite    : http://localhost:5173
echo  ==========================================
echo    Login   : admin@vimiss.vn / password
echo  ==========================================
echo.
echo  Press Ctrl+C to stop all servers
echo.

timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/auth/login"

:: Start Laravel (blocking)
php artisan serve --host=127.0.0.1 --port=8000

:: ── Cleanup: kill Vite when Laravel stops ───────────────────
echo.
echo  Shutting down Vite...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr " :5173 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
taskkill /FI "WINDOWTITLE eq Vimiss - Vite" /F >nul 2>&1
echo  All servers stopped.
echo.
endlocal