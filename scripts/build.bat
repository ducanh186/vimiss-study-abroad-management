@echo off
echo ========================================
echo Vimiss Study Abroad - Production Build
echo ========================================
echo.

echo [1/3] Clearing Laravel caches...
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo.
echo [2/3] Building frontend assets...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
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
pause
