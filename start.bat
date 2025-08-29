@echo off
echo.
echo ========================================
echo    CampusClash - College vs College
echo ========================================
echo.
echo Starting CampusClash application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if MySQL is running (XAMPP)
echo Checking MySQL connection...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MySQL might not be running!
    echo Please start XAMPP or MySQL service first.
    echo.
)

echo.
echo Installing dependencies...
call npm run install-all

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    echo.
    pause
    exit /b 1
)

echo.
echo Setting up database...
call npm run setup-db

if %errorlevel% neq 0 (
    echo ERROR: Failed to setup database!
    echo.
    pause
    exit /b 1
)

echo.
echo Starting CampusClash...
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop the application
echo.

call npm run dev

pause
