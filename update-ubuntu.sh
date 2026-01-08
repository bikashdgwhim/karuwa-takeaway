#!/bin/bash

################################################################################
# Karuwa Takeaway - Application Update Script
# Use this to update the application on Ubuntu server
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Updating Karuwa Takeaway Application...${NC}\n"

# Get current directory
APP_DIR=$(pwd)

# Backup database
echo -e "${GREEN}[1/7]${NC} Backing up database..."
if [ -f "backend/karuwa.db" ]; then
    cp backend/karuwa.db "backend/karuwa.db.backup-$(date +%Y%m%d-%H%M%S)"
    echo "Database backed up successfully"
else
    echo -e "${YELLOW}No database found to backup${NC}"
fi

# Pull latest changes (if using Git)
echo -e "${GREEN}[2/7]${NC} Pulling latest changes..."
if [ -d ".git" ]; then
    git pull
    echo "Changes pulled successfully"
else
    echo -e "${YELLOW}Not a Git repository - skipping pull${NC}"
fi

# Install/update frontend dependencies
echo -e "${GREEN}[3/7]${NC} Updating frontend dependencies..."
npm install

# Install/update backend dependencies
echo -e "${GREEN}[4/7]${NC} Updating backend dependencies..."
cd backend
npm install
cd ..

# Build frontend (optional)
echo -e "${GREEN}[5/7]${NC} Building frontend..."
read -p "Build frontend for production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run build
    echo "Frontend built successfully"
else
    echo "Skipping frontend build"
fi

# Restart application
echo -e "${GREEN}[6/7]${NC} Restarting application..."
pm2 restart all

# Show status
echo -e "${GREEN}[7/7]${NC} Checking application status..."
pm2 status

echo -e "\n${GREEN}✓ Update complete!${NC}\n"
echo "View logs: pm2 logs"
