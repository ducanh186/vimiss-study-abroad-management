@echo off
cd /d "%~dp0.."
setlocal enabledelayedexpansion

:MENU
cls
echo ========================================
echo    Vimiss Study Abroad Management
echo ========================================
echo.
echo [1] SETUP - First time setup (install deps + migrate + seed)
echo [2] DEV   - Start development servers (Laravel + Vite)
echo [3] FRESH - Reset database (drop all + migrate + seed)
echo [4] BUILD - Build production assets
echo [5] TEST  - Run PHPUnit tests
echo [6] CLEAN - Clear all caches and logs
echo [7] DEMO  - Full setup + start servers (one command)
echo [8] EXIT  - Exit
echo.
set /p choice="Select option (1-8): "

if "%choice%"=="1" goto SETUP
if "%choice%"=="2" goto DEV
if "%choice%"=="3" goto FRESH
if "%choice%"=="4" goto BUILD
if "%choice%"=="5" goto TEST
if "%choice%"=="6" goto CLEAN
if "%choice%"=="7" goto DEMO
if "%choice%"=="8" goto EXIT
echo Invalid choice. Try again.
timeout /t 2 /nobreak >nul
goto MENU

:SETUP
echo ========================================
echo SETUP - First Time Setup
echo ========================================
echo.
echo [1/7] Installing Composer dependencies...
call composer install
if errorlevel 1 (
    echo ERROR: Composer install failed!
    pause
    goto MENU
)

echo.
echo [2/7] Installing NPM dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: NPM install failed!
    pause
    goto MENU
)

echo.
echo [3/7] Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env file created
) else (
    echo .env already exists, skipping...
)

echo.
echo [4/7] Generating application key...
php artisan key:generate

echo.
echo [5/7] Creating SQLite database...
if not exist database\database.sqlite (
    type nul > database\database.sqlite
    echo database.sqlite created
) else (
    echo database.sqlite already exists
)

echo.
echo [6/7] Running migrations...
php artisan migrate
if errorlevel 1 (
    echo ERROR: Migration failed!
    pause
    goto MENU
)

echo.
echo [7/7] Seeding demo data...
php artisan db:seed
if errorlevel 1 (
    echo ERROR: Seeding failed!
    pause
    goto MENU
)

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Demo accounts:
echo   admin@vimiss.vn    / password (Admin)
echo   director@vimiss.vn / password (Director)
echo   mentor1@vimiss.vn  / password (Mentor)
echo   student1@vimiss.vn / password (Student)
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:DEV
echo ========================================
echo DEV - Development Servers
echo ========================================
echo.
echo Starting Laravel server (localhost:8000)...
echo Starting Vite dev server (localhost:5173)...
echo.
echo Press Ctrl+C to stop servers and return to menu
echo.
start "Laravel Server" cmd /k "cd /d "%CD%" && php artisan serve"
timeout /t 2 /nobreak >nul
npx vite
goto MENU

:FRESH
echo ========================================
echo FRESH - Reset Database
echo ========================================
echo.
echo WARNING: This will DELETE all existing data!
echo.
set /p confirm=Type 'yes' to continue: 
if /i not "%confirm%"=="yes" (
    echo Cancelled.
    timeout /t 2 /nobreak >nul
    goto MENU
)

echo.
echo [1/2] Dropping all tables and re-running migrations...
php artisan migrate:fresh
if errorlevel 1 (
    echo ERROR: Migration failed!
    pause
    goto MENU
)

echo.
echo [2/2] Seeding demo data...
php artisan db:seed
if errorlevel 1 (
    echo ERROR: Seeding failed!
    pause
    goto MENU
)

echo.
echo ========================================
echo Database reset complete!
echo ========================================
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:BUILD
echo ========================================
echo BUILD - Production Build
echo ========================================
echo.
echo [1/3] Clearing Laravel caches...
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo.
echo [2/3] Building frontend assets...
call npx vite build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    goto MENU
)

echo.
echo [3/3] Optimizing Laravel...
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo.
echo ========================================
echo Production build complete!
echo ========================================
echo.
echo Assets are in: public/build/
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:TEST
echo ========================================
echo TEST - Run Tests
echo ========================================
echo.
echo Running PHPUnit tests...
echo.
call php vendor\bin\phpunit
if errorlevel 1 (
    echo.
    echo Tests FAILED!
) else (
    echo.
    echo All tests PASSED!
)
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:CLEAN
echo ========================================
echo CLEAN - Clear Cache/Logs
echo ========================================
echo.
echo Clearing Laravel caches...
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo.
echo Clearing logs...
if exist storage\logs\laravel.log (
    del storage\logs\laravel.log
    echo Logs cleared
) else (
    echo No logs to clear
)

echo.
echo Clearing compiled views...
if exist storage\framework\views\*.php (
    del /q storage\framework\views\*.php
    echo Compiled views cleared
)

echo.
echo ========================================
echo Clean complete!
echo ========================================
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:DEMO
echo ========================================
echo DEMO - Full Setup + Start
echo ========================================
echo.
echo This will:
echo   1. Install all dependencies
echo   2. Setup database with demo data
echo   3. Start development servers
echo.
echo Estimated time: 2-3 minutes
echo.
set /p confirm=Continue? (y/n): 
if /i not "%confirm%"=="y" goto MENU

REM Run setup
echo.
echo Running full setup...
call :SETUP_SILENT
if errorlevel 1 (
    echo Setup failed!
    pause
    goto MENU
)

echo.
echo ========================================
echo Starting development servers...
echo ========================================
echo.
echo The application will open at: http://localhost:8000
echo.
echo Login with:
echo   Email: admin@vimiss.vn
echo   Password: password
echo.
timeout /t 3 /nobreak

REM Start servers
goto DEV

:SETUP_SILENT
call composer install >nul 2>&1 || exit /b 1
call npm install >nul 2>&1 || exit /b 1
if not exist .env copy .env.example .env >nul 2>&1
php artisan key:generate >nul 2>&1
if not exist database\database.sqlite type nul > database\database.sqlite 2>&1
php artisan migrate >nul 2>&1 || exit /b 1
php artisan db:seed >nul 2>&1 || exit /b 1
exit /b 0

:EXIT
echo.
echo Thanks for using Vimiss Study Abroad Management!
echo.
timeout /t 2 /nobreak >nul
exit /b 0