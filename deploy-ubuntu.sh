#!/bin/bash

################################################################################
# Karuwa Takeaway - Ubuntu Server Deployment Script
# This script automates the complete deployment process on Ubuntu Server
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="karuwa-takeaway"
APP_DIR="/var/www/karuwa-takeaway"
FRONTEND_PORT=3000
BACKEND_PORT=3001
NODE_VERSION="20"  # LTS version

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Update system packages
update_system() {
    print_step "Step 1: Updating System Packages"
    apt-get update
    apt-get upgrade -y
    print_message "System packages updated successfully"
}

# Install Node.js and npm
install_nodejs() {
    print_step "Step 2: Installing Node.js ${NODE_VERSION}.x and npm"
    
    if command -v node &> /dev/null; then
        CURRENT_VERSION=$(node -v)
        print_warning "Node.js is already installed: $CURRENT_VERSION"
        read -p "Do you want to reinstall Node.js ${NODE_VERSION}.x? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "Skipping Node.js installation"
            return
        fi
    fi
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    print_message "Node.js version: $(node -v)"
    print_message "npm version: $(npm -v)"
}

# Install PM2 globally
install_pm2() {
    print_step "Step 3: Installing PM2 Process Manager"
    
    if command -v pm2 &> /dev/null; then
        print_warning "PM2 is already installed: $(pm2 -v)"
    else
        npm install -g pm2
        print_message "PM2 installed successfully: $(pm2 -v)"
    fi
    
    # Setup PM2 to start on system boot
    pm2 startup systemd -u root --hp /root
    print_message "PM2 configured to start on system boot"
}

# Install Nginx (optional - for reverse proxy)
install_nginx() {
    print_step "Step 4: Installing Nginx (Optional)"
    
    read -p "Do you want to install Nginx as a reverse proxy? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        apt-get install -y nginx
        systemctl enable nginx
        systemctl start nginx
        print_message "Nginx installed and started successfully"
    else
        print_message "Skipping Nginx installation"
    fi
}

# Install SQLite (if not already installed)
install_sqlite() {
    print_step "Step 5: Installing SQLite"
    
    if command -v sqlite3 &> /dev/null; then
        print_warning "SQLite is already installed: $(sqlite3 --version)"
    else
        apt-get install -y sqlite3
        print_message "SQLite installed successfully"
    fi
}

# Create application directory
setup_app_directory() {
    print_step "Step 6: Setting Up Application Directory"
    
    if [ -d "$APP_DIR" ]; then
        print_warning "Directory $APP_DIR already exists"
        read -p "Do you want to remove it and start fresh? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$APP_DIR"
            print_message "Removed existing directory"
        fi
    fi
    
    mkdir -p "$APP_DIR"
    print_message "Application directory created: $APP_DIR"
}

# Clone or copy application files
deploy_application() {
    print_step "Step 7: Deploying Application Files"
    
    echo "Choose deployment method:"
    echo "1) Clone from Git repository"
    echo "2) Copy from local directory"
    read -p "Enter choice (1 or 2): " choice
    
    case $choice in
        1)
            read -p "Enter Git repository URL: " git_url
            git clone "$git_url" "$APP_DIR"
            print_message "Application cloned from Git repository"
            ;;
        2)
            read -p "Enter source directory path: " source_dir
            cp -r "$source_dir"/* "$APP_DIR/"
            print_message "Application files copied from $source_dir"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Install application dependencies
install_dependencies() {
    print_step "Step 8: Installing Application Dependencies"
    
    cd "$APP_DIR"
    
    # Install frontend dependencies
    print_message "Installing frontend dependencies..."
    npm install
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        print_message "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
    fi
    
    print_message "All dependencies installed successfully"
}

# Setup environment variables
setup_environment() {
    print_step "Step 9: Setting Up Environment Variables"
    
    cd "$APP_DIR"
    
    # Frontend environment
    if [ ! -f ".env.local" ]; then
        print_message "Creating frontend .env.local file..."
        cat > .env.local << EOF
VITE_API_URL=http://localhost:${BACKEND_PORT}
EOF
        print_message "Frontend environment file created"
    else
        print_warning ".env.local already exists"
    fi
    
    # Backend environment
    if [ -d "backend" ] && [ ! -f "backend/.env" ]; then
        print_message "Creating backend .env file..."
        
        # Generate random JWT secret
        JWT_SECRET=$(openssl rand -base64 32)
        
        cat > backend/.env << EOF
PORT=${BACKEND_PORT}
JWT_SECRET=${JWT_SECRET}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
DATABASE_PATH=./karuwa.db

# Email Configuration (Optional - configure later)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
RESTAURANT_EMAIL=restaurant@example.com
EOF
        print_message "Backend environment file created"
        print_warning "IMPORTANT: Update backend/.env with your actual credentials!"
    else
        print_warning "backend/.env already exists or backend directory not found"
    fi
}

# Build frontend for production
build_frontend() {
    print_step "Step 10: Building Frontend for Production"
    
    cd "$APP_DIR"
    
    read -p "Do you want to build the frontend for production? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run build
        print_message "Frontend built successfully"
    else
        print_message "Skipping frontend build (will run in dev mode)"
    fi
}

# Configure PM2
configure_pm2() {
    print_step "Step 11: Configuring PM2 Process Manager"
    
    cd "$APP_DIR"
    
    # Check if ecosystem.config.js exists
    if [ ! -f "ecosystem.config.js" ]; then
        print_message "Creating PM2 ecosystem configuration..."
        cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'karuwa-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      log_file: '../logs/backend-combined.log',
      time: true
    },
    {
      name: 'karuwa-frontend',
      cwd: './',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
EOF
        print_message "PM2 ecosystem configuration created"
    else
        print_warning "ecosystem.config.js already exists"
    fi
    
    # Create logs directory
    mkdir -p logs
}

# Start application with PM2
start_application() {
    print_step "Step 12: Starting Application with PM2"
    
    cd "$APP_DIR"
    
    # Stop any existing PM2 processes
    pm2 delete all 2>/dev/null || true
    
    # Start application
    pm2 start ecosystem.config.js
    
    # Save PM2 process list
    pm2 save
    
    print_message "Application started successfully!"
    
    # Show PM2 status
    pm2 status
}

# Configure firewall
configure_firewall() {
    print_step "Step 13: Configuring Firewall (UFW)"
    
    read -p "Do you want to configure UFW firewall? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Skipping firewall configuration"
        return
    fi
    
    # Install UFW if not installed
    apt-get install -y ufw
    
    # Allow SSH
    ufw allow OpenSSH
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application ports
    ufw allow ${FRONTEND_PORT}/tcp
    ufw allow ${BACKEND_PORT}/tcp
    
    # Enable UFW
    ufw --force enable
    
    print_message "Firewall configured successfully"
    ufw status
}

# Setup Nginx reverse proxy (optional)
setup_nginx_proxy() {
    print_step "Step 14: Setting Up Nginx Reverse Proxy (Optional)"
    
    if ! command -v nginx &> /dev/null; then
        print_warning "Nginx is not installed. Skipping..."
        return
    fi
    
    read -p "Do you want to configure Nginx as a reverse proxy? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Skipping Nginx configuration"
        return
    fi
    
    read -p "Enter your domain name (or press Enter to use IP): " domain_name
    
    if [ -z "$domain_name" ]; then
        domain_name="_"
    fi
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/karuwa-takeaway << EOF
server {
    listen 80;
    server_name ${domain_name};

    # Frontend
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
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/karuwa-takeaway /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    print_message "Nginx reverse proxy configured successfully"
}

# Print final information
print_final_info() {
    print_step "Deployment Complete!"
    
    echo -e "${GREEN}✓ Application deployed successfully!${NC}\n"
    
    echo "Application Details:"
    echo "-------------------"
    echo "Installation Directory: $APP_DIR"
    echo "Frontend Port: $FRONTEND_PORT"
    echo "Backend Port: $BACKEND_PORT"
    echo ""
    
    echo "Access URLs:"
    echo "------------"
    if command -v nginx &> /dev/null && [ -f /etc/nginx/sites-enabled/karuwa-takeaway ]; then
        echo "Application: http://your-server-ip/ (via Nginx)"
    fi
    echo "Frontend: http://your-server-ip:$FRONTEND_PORT"
    echo "Backend API: http://your-server-ip:$BACKEND_PORT"
    echo ""
    
    echo "Useful Commands:"
    echo "----------------"
    echo "View logs:        pm2 logs"
    echo "Restart app:      pm2 restart all"
    echo "Stop app:         pm2 stop all"
    echo "App status:       pm2 status"
    echo "Monitor app:      pm2 monit"
    echo ""
    
    echo -e "${YELLOW}IMPORTANT:${NC}"
    echo "1. Update backend/.env with your actual credentials"
    echo "2. Change the default admin password"
    echo "3. Configure email settings in backend/.env"
    echo "4. Consider setting up SSL/HTTPS with Let's Encrypt"
    echo ""
    
    echo -e "${GREEN}Happy serving! 🍽️${NC}"
}

# Main execution
main() {
    print_step "Karuwa Takeaway - Ubuntu Server Deployment"
    
    check_root
    update_system
    install_nodejs
    install_pm2
    install_nginx
    install_sqlite
    setup_app_directory
    deploy_application
    install_dependencies
    setup_environment
    build_frontend
    configure_pm2
    start_application
    configure_firewall
    setup_nginx_proxy
    print_final_info
}

# Run main function
main
