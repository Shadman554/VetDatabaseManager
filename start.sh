#!/bin/bash

echo "======================================"
echo " Veterinary Admin Panel - Quick Start"
echo "======================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    echo
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo
    echo "🔧 Setting up environment..."
    node setup.js
    echo
    echo "⚠️  IMPORTANT: Please edit .env file with your API credentials"
    echo "Then run this script again to start the application"
    echo
    exit 0
fi

# Start the application
echo
echo "🚀 Starting Veterinary Admin Panel..."
echo
echo "The application will open at: http://localhost:5000"
echo "Default login: admin / admin123"
echo
echo "Press Ctrl+C to stop the server"
echo

npm run dev