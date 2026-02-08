@echo off
cd /d "%~dp0.."
echo ========================================
echo Vimiss Study Abroad - Clean Cache/Logs
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
pause
