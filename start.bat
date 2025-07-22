@echo off
echo ======================================
echo  Veterinary Admin Panel - Quick Start
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Check if dependencies are installed
if not exist "node_modules" (
    echo.
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env exists
if not exist ".env" (
    echo.
    echo 🔧 Setting up environment...
    call node setup.js
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file with your API credentials
    echo Then run this script again to start the application
    echo.
    pause
    exit /b 0
)

REM Start the application
echo.
echo 🚀 Starting Veterinary Admin Panel...
echo.
echo The application will open at: http://localhost:5000
echo Default login: admin / admin123
echo.
echo Press Ctrl+C to stop the server
echo.

echo.
echo Opening browser to http://localhost:5000 in 10 seconds...
timeout /t 10 /nobreak >nul
start "" "http://localhost:5000"

echo.
echo Keep this window open to keep the server running
echo Wait for "serving on port 5000" message below...
echo.

REM Use Windows-compatible development script
call dev.bat

echo.
echo ✅ Server has stopped
echo.
pause