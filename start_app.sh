#!/bin/bash

# Function to kill backend on exit
cleanup() {
  echo "Stopping backend..."
  kill $BACKEND_PID
  exit
}

trap cleanup INT TERM

echo "=================================="
echo "   Karuwa Takeaway Setup & Run    "
echo "=================================="

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH."
    exit 1
fi

echo "--> Setting up Backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "Seeding database..."
npm run seed

echo "--> Starting Backend Server..."
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

echo "--> Starting Frontend..."
cd ..
npm run dev

# After frontend quits, kill backend
kill $BACKEND_PID
