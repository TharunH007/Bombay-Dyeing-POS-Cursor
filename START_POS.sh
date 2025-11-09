#!/bin/bash

echo "========================================"
echo "  Bombay Dyeing POS System"
echo "  Starting Server..."
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies for first-time setup..."
    npm install
    echo ""
fi

# Start the server and open browser
echo "Server is starting..."
echo ""
echo "Opening browser in 3 seconds..."
echo ""
sleep 3

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:5000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:5000 2>/dev/null || echo "Please open http://localhost:5000 in your browser"
fi

echo ""
echo "========================================"
echo "  POS System is now running!"
echo "  Browser window should open automatically"
echo ""
echo "  Access from this computer:"
echo "  http://localhost:5000"
echo ""
echo "  Access from mobile/tablet (same WiFi):"
echo "  http://YOUR_COMPUTER_IP:5000"
echo ""
echo "  Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Start the Node.js server
npm start
