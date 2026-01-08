#!/bin/bash

################################################################################
# Karuwa Takeaway - Quick Start Script for Ubuntu
# Use this for a fast deployment with minimal prompts
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Karuwa Takeaway Quick Deployment...${NC}\n"

# Update system
echo -e "${GREEN}[1/8]${NC} Updating system..."
sudo apt-get update -qq

# Install Node.js 20.x
echo -e "${GREEN}[2/8]${NC} Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2
echo -e "${GREEN}[3/8]${NC} Installing PM2..."
sudo npm install -g pm2

# Install dependencies
echo -e "${GREEN}[4/8]${NC} Installing application dependencies..."
npm install
cd backend && npm install && cd ..

# Setup environment files
echo -e "${GREEN}[5/8]${NC} Setting up environment files..."
if [ ! -f .env.local ]; then
    echo "VITE_API_URL=http://localhost:3001" > .env.local
fi

if [ ! -f backend/.env ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    cat > backend/.env << EOF
PORT=3001
JWT_SECRET=${JWT_SECRET}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
DATABASE_PATH=./karuwa.db
EOF
fi

# Create logs directory
echo -e "${GREEN}[6/8]${NC} Creating logs directory..."
mkdir -p logs

# Stop existing PM2 processes
echo -e "${GREEN}[7/8]${NC} Stopping existing processes..."
pm2 delete all 2>/dev/null || true

# Start application
echo -e "${GREEN}[8/8]${NC} Starting application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "\n${GREEN}✓ Deployment complete!${NC}\n"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo ""
echo "Commands:"
echo "  pm2 status  - View app status"
echo "  pm2 logs    - View logs"
echo "  pm2 restart all - Restart app"
