@echo off
echo ======================================
echo  Veterinary Admin Panel - Simple Start
echo ======================================
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Install dependencies if needed
if not exist "node_modules" (
    echo.
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Setup environment if needed
if not exist ".env" (
    echo.
    echo 🔧 Creating .env file...
    copy ".env.example" ".env" >nul 2>&1
    if not exist ".env" (
        echo VET_API_USERNAME=your_api_username > .env
        echo VET_API_PASSWORD=your_api_password >> .env
        echo NODE_ENV=development >> .env
        echo PORT=5000 >> .env
    )
    echo ⚠️  Edit .env file with your API credentials before continuing
    echo Press any key when ready...
    pause >nul
)

echo.
echo 🚀 Starting application...
echo.
echo Visit: http://localhost:5000
echo Login: admin / admin123
echo.
echo Press Ctrl+C to stop, or close this window
echo.

REM Start with npm run dev
set NODE_ENV=development
echo Starting server... (this may take a moment)
start "" "http://localhost:5000"
npm run dev

echo.
echo Server stopped. Press any key to exit...
pause >nul