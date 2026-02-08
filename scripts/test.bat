@echo off
cd /d "%~dp0.."
echo ========================================
echo Vimiss Study Abroad - Run Tests
echo ========================================
echo.

echo Running PHPUnit tests...
echo.

call php vendor\bin\phpunit

if errorlevel 1 (
    echo.
    echo Tests FAILED!
    pause
    exit /b 1
) else (
    echo.
    echo All tests PASSED!
    pause
)
