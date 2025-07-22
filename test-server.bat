@echo off
echo Testing server startup...
echo.

REM Set environment
set NODE_ENV=development
set PORT=5000

echo Current directory:
cd

echo.
echo Node.js version:
node --version

echo.
echo NPM version:
npm --version

echo.
echo Checking if server files exist:
if exist "server\index.ts" (
    echo ✅ server\index.ts found
) else (
    echo ❌ server\index.ts NOT found
)

if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json NOT found
)

if exist "node_modules" (
    echo ✅ node_modules found
) else (
    echo ❌ node_modules NOT found
)

if exist ".env" (
    echo ✅ .env found
) else (
    echo ❌ .env NOT found
)

echo.
echo Environment variables:
echo NODE_ENV=%NODE_ENV%
echo PORT=%PORT%

echo.
echo Trying to start server with npm run dev...
echo Look for "serving on port 5000" message:
echo.

npm run dev

echo.
echo Script ended. Press any key to close...
pause >nul