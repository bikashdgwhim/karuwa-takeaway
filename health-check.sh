#!/bin/bash

################################################################################
# Karuwa Takeaway - Health Check Script
# Monitors application health and restarts if needed
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001/api/health"
MAX_RETRIES=3
RETRY_DELAY=5

echo "==================================================="
echo "Karuwa Takeaway - Health Check"
echo "==================================================="
echo ""

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
            echo -e "${GREEN}✓${NC} $name is healthy"
            return 0
        else
            retries=$((retries + 1))
            if [ $retries -lt $MAX_RETRIES ]; then
                echo -e "${YELLOW}⚠${NC} $name check failed, retrying in ${RETRY_DELAY}s... ($retries/$MAX_RETRIES)"
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    echo -e "${RED}✗${NC} $name is not responding"
    return 1
}

# Check PM2 processes
echo "Checking PM2 processes..."
pm2 status | grep -q "online" && echo -e "${GREEN}✓${NC} PM2 processes are running" || echo -e "${RED}✗${NC} PM2 processes are not running"
echo ""

# Check Frontend
echo "Checking Frontend ($FRONTEND_URL)..."
if check_url "$FRONTEND_URL" "Frontend"; then
    FRONTEND_OK=true
else
    FRONTEND_OK=false
fi
echo ""

# Check Backend
echo "Checking Backend ($BACKEND_URL)..."
if check_url "$BACKEND_URL" "Backend"; then
    BACKEND_OK=true
else
    BACKEND_OK=false
fi
echo ""

# Check Database
echo "Checking Database..."
if [ -f "backend/karuwa.db" ]; then
    DB_SIZE=$(du -h backend/karuwa.db | cut -f1)
    echo -e "${GREEN}✓${NC} Database exists (Size: $DB_SIZE)"
    DB_OK=true
else
    echo -e "${RED}✗${NC} Database file not found"
    DB_OK=false
fi
echo ""

# Check Disk Space
echo "Checking Disk Space..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${GREEN}✓${NC} Disk usage: ${DISK_USAGE}%"
else
    echo -e "${YELLOW}⚠${NC} Disk usage is high: ${DISK_USAGE}%"
fi
echo ""

# Check Memory
echo "Checking Memory..."
if command -v free &> /dev/null; then
    MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
    if [ "$MEM_USAGE" -lt 90 ]; then
        echo -e "${GREEN}✓${NC} Memory usage: ${MEM_USAGE}%"
    else
        echo -e "${YELLOW}⚠${NC} Memory usage is high: ${MEM_USAGE}%"
    fi
else
    echo -e "${YELLOW}⚠${NC} Cannot check memory (free command not available)"
fi
echo ""

# Overall Status
echo "==================================================="
if [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ] && [ "$DB_OK" = true ]; then
    echo -e "${GREEN}Overall Status: HEALTHY ✓${NC}"
    exit 0
else
    echo -e "${RED}Overall Status: UNHEALTHY ✗${NC}"
    echo ""
    echo "Attempting to restart application..."
    pm2 restart all
    echo "Application restarted. Please check status with: pm2 status"
    exit 1
fi
