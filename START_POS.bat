@echo off
echo ========================================
echo   Bombay Dyeing POS System
echo   Starting Server...
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies for first-time setup...
    call npm install
    echo.
)

REM Start the server and open browser
echo Server is starting...
echo.
echo Opening browser in 3 seconds...
echo.
timeout /t 3 /nobreak >nul
start http://localhost:5000

echo.
echo ========================================
echo   POS System is now running!
echo   Browser window should open automatically
echo.
echo   Access from this computer:
echo   http://localhost:5000
echo.
echo   Access from mobile/tablet (same WiFi):
echo   http://YOUR_COMPUTER_IP:5000
echo.
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the Node.js server
npm start
