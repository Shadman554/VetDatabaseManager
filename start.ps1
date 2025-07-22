# PowerShell script for starting Veterinary Admin Panel
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Veterinary Admin Panel - Quick Start" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow
    node setup.js
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please edit .env file with your API credentials" -ForegroundColor Yellow
    Write-Host "Then run this script again to start the application" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}

# Start the application
Write-Host ""
Write-Host "🚀 Starting Veterinary Admin Panel..." -ForegroundColor Green
Write-Host ""
Write-Host "The application will open at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Default login: admin / admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Set environment variable and start
$env:NODE_ENV = "development"
npm run dev