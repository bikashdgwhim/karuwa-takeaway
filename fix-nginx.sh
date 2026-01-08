#!/bin/bash

################################################################################
# Karuwa Takeaway - Nginx Configuration Fix Script
# Fixes the "Nginx default page" issue
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Karuwa Takeaway - Nginx Configuration Fix            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}"
   exit 1
fi

# Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001

# Get domain or use default
echo -e "${YELLOW}Enter your domain name (or press Enter to use server IP):${NC}"
read -r DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME="_"
    echo -e "${GREEN}Using default (server IP)${NC}"
else
    echo -e "${GREEN}Using domain: $DOMAIN_NAME${NC}"
fi

echo ""
echo -e "${BLUE}[1/5]${NC} Creating Nginx configuration..."

# Create Nginx configuration
cat > /etc/nginx/sites-available/karuwa-takeaway << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    # Increase client body size for file uploads
    client_max_body_size 10M;

    # Frontend (Vite dev server or built files)
    location / {
        proxy_pass http://localhost:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support for Vite HMR
        proxy_read_timeout 86400;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo -e "${GREEN}✓ Nginx configuration created${NC}"

echo -e "${BLUE}[2/5]${NC} Removing default Nginx site..."

# Remove default site
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo -e "${GREEN}✓ Default site removed${NC}"
else
    echo -e "${YELLOW}⚠ Default site already removed${NC}"
fi

echo -e "${BLUE}[3/5]${NC} Enabling Karuwa Takeaway site..."

# Enable the site
ln -sf /etc/nginx/sites-available/karuwa-takeaway /etc/nginx/sites-enabled/

echo -e "${GREEN}✓ Site enabled${NC}"

echo -e "${BLUE}[4/5]${NC} Testing Nginx configuration..."

# Test Nginx configuration
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    exit 1
fi

echo -e "${BLUE}[5/5]${NC} Restarting Nginx..."

# Restart Nginx
systemctl restart nginx

echo -e "${GREEN}✓ Nginx restarted successfully${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Nginx configuration fixed!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Check if PM2 processes are running
echo -e "${YELLOW}Checking application status...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 status
    echo ""
    
    # Check if processes are online
    if pm2 list | grep -q "online"; then
        echo -e "${GREEN}✓ Application is running${NC}"
    else
        echo -e "${RED}✗ Application is not running${NC}"
        echo -e "${YELLOW}Start the application with: pm2 start ecosystem.config.cjs${NC}"
    fi
else
    echo -e "${YELLOW}⚠ PM2 not found. Make sure your application is running.${NC}"
fi

echo ""
echo -e "${BLUE}Access your application:${NC}"
if [ "$DOMAIN_NAME" = "_" ]; then
    echo -e "  ${GREEN}http://your-server-ip/${NC}"
else
    echo -e "  ${GREEN}http://$DOMAIN_NAME/${NC}"
fi
echo ""

echo -e "${YELLOW}Troubleshooting:${NC}"
echo "  1. Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "  2. Check PM2 logs: pm2 logs"
echo "  3. Verify ports: sudo netstat -tulpn | grep -E ':(3000|3001)'"
echo ""
