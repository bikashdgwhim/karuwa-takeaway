#!/bin/bash

# Karuwa Takeaway - Update Script
# This script pulls the latest code and restarts the application

echo "🔄 Starting update process..."

# Navigate to project directory
cd ~/karuwa-takeaway || exit 1

# Pull latest code from git
echo "📥 Pulling latest code from GitHub..."
git pull

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed. Please resolve conflicts manually."
    exit 1
fi

# Update backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Backend npm install failed."
    exit 1
fi

# Restart backend with PM2
echo "🔄 Restarting backend..."
pm2 restart karuwa-backend

if [ $? -ne 0 ]; then
    echo "❌ PM2 restart failed. Is PM2 running?"
    exit 1
fi

# Update frontend dependencies and rebuild
echo "📦 Installing frontend dependencies..."
cd ..
npm install

if [ $? -ne 0 ]; then
    echo "❌ Frontend npm install failed."
    exit 1
fi

echo "🏗️  Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed."
    exit 1
fi

# Show PM2 status
echo ""
echo "✅ Update complete!"
echo ""
echo "📊 Current PM2 status:"
pm2 list

echo ""
echo "💡 To view logs, run: pm2 logs karuwa-backend"
