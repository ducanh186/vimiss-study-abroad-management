@echo off
cd /d "%~dp0.."
echo ========================================
echo Vimiss Study Abroad - Initial Setup
echo ========================================
echo.

echo [1/7] Installing Composer dependencies...
call composer install
if errorlevel 1 (
    echo ERROR: Composer install failed!
    pause
    exit /b 1
)

echo.
echo [2/7] Installing NPM dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: NPM install failed!
    pause
    exit /b 1
)

echo.
echo [3/7] Copying .env file...
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
    exit /b 1
)

echo.
echo [7/7] Seeding demo data...
php artisan db:seed
if errorlevel 1 (
    echo ERROR: Seeding failed!
    pause
    exit /b 1
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
echo Next steps:
echo   1. Run 'scripts\dev.bat' to start development server
echo   2. Open http://localhost:8000 in your browser
echo.
pause
