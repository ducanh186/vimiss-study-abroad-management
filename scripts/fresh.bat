@echo off
cd /d "%~dp0.."
echo ========================================
echo Vimiss Study Abroad - Fresh Database
echo ========================================
echo.
echo WARNING: This will DELETE all existing data!
echo.
set /p confirm=Type 'yes' to continue: 

if /i not "%confirm%"=="yes" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [1/2] Dropping all tables and re-running migrations...
php artisan migrate:fresh
if errorlevel 1 (
    echo ERROR: Migration failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Seeding demo data...
php artisan db:seed
if errorlevel 1 (
    echo ERROR: Seeding failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database reset complete!
echo ========================================
echo.
echo Demo accounts restored:
echo   admin@vimiss.vn    / password (Admin)
echo   director@vimiss.vn / password (Director)
echo   mentor1@vimiss.vn  / password (Mentor)
echo   mentor2@vimiss.vn  / password (Mentor)
echo   student1@vimiss.vn / password (Student)
echo   student2@vimiss.vn / password (Student)
echo   student3@vimiss.vn / password (Student)
echo.
pause
