@echo off
REM Windows development script
set NODE_ENV=development

REM Check if tsx is available
where tsx >nul 2>&1
if errorlevel 1 (
    echo Installing tsx globally...
    npm install -g tsx
    if errorlevel 1 (
        echo Failed to install tsx
        echo Trying with npx instead...
        npx tsx server/index.ts
        exit /b %errorlevel%
    )
)

echo Starting server with tsx...
echo Wait for "serving on port 5000" message...
tsx server/index.ts
echo.
echo Server has stopped.