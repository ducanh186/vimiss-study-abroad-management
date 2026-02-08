@echo off
echo ========================================
echo Vimiss Study Abroad - Quick Demo Setup
echo ========================================
echo.
echo This script will:
echo   1. Install all dependencies
echo   2. Setup database with demo data
echo   3. Start development servers
echo.
echo Estimated time: 2-3 minutes
echo.
pause

REM Run full setup
call "%~dp0setup.bat"
if errorlevel 1 (
    echo Setup failed!
    pause
    exit /b 1
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

REM Start dev servers
call "%~dp0dev.bat"
