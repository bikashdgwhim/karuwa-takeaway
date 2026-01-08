# Ubuntu Server Deployment Guide

This guide provides instructions for deploying the Karuwa Takeaway application on an Ubuntu server.

## 🚀 Quick Start (Automated)

### Option 1: Full Interactive Deployment

This script will guide you through the complete setup process:

```bash
# Download or transfer the deployment script to your Ubuntu server
sudo chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

**What it does:**
- ✅ Updates system packages
- ✅ Installs Node.js 20.x LTS
- ✅ Installs PM2 process manager
- ✅ Optionally installs Nginx
- ✅ Installs SQLite
- ✅ Sets up application directory
- ✅ Deploys application files
- ✅ Installs dependencies
- ✅ Creates environment files
- ✅ Configures PM2 for auto-restart
- ✅ Starts the application
- ✅ Optionally configures firewall
- ✅ Optionally sets up Nginx reverse proxy

### Option 2: Quick Start (Minimal Prompts)

For a faster deployment with sensible defaults:

```bash
chmod +x quick-start-ubuntu.sh
./quick-start-ubuntu.sh
```

---

## 📋 Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

### 1. Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node -v  # Should show v20.x.x
npm -v
```

### 3. Install PM2 Process Manager

```bash
sudo npm install -g pm2
```

### 4. Install SQLite (if not already installed)

```bash
sudo apt-get install -y sqlite3
```

### 5. Clone or Upload Application

**Option A: Clone from Git**
```bash
cd /var/www
sudo git clone <your-repo-url> karuwa-takeaway
cd karuwa-takeaway
```

**Option B: Upload via SCP**
```bash
# From your local machine:
scp -r /path/to/karuwa-takeaway user@server-ip:/var/www/
```

### 6. Install Dependencies

```bash
cd /var/www/karuwa-takeaway

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 7. Configure Environment Variables

**Frontend (.env.local):**
```bash
cat > .env.local << EOF
VITE_API_URL=http://localhost:3001
EOF
```

**Backend (backend/.env):**
```bash
# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

cat > backend/.env << EOF
PORT=3001
JWT_SECRET=${JWT_SECRET}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
DATABASE_PATH=./karuwa.db

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
RESTAURANT_EMAIL=restaurant@example.com
EOF
```

⚠️ **Important:** Change the `ADMIN_PASSWORD` and configure email settings!

### 8. Create Logs Directory

```bash
mkdir -p logs
```

### 9. Start Application with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

The last command will output a command to run - execute it to enable PM2 on system boot.

### 10. Verify Application is Running

```bash
pm2 status
pm2 logs
```

---

## 🔧 PM2 Management Commands

### View Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs                    # All logs
pm2 logs karuwa-backend     # Backend only
pm2 logs karuwa-frontend    # Frontend only
```

### Restart Application
```bash
pm2 restart all             # Restart all processes
pm2 restart karuwa-backend  # Restart backend only
pm2 restart karuwa-frontend # Restart frontend only
```

### Stop Application
```bash
pm2 stop all
```

### Start Application
```bash
pm2 start all
```

### Monitor Resources
```bash
pm2 monit
```

### Delete Processes
```bash
pm2 delete all
```

---

## 🌐 Nginx Reverse Proxy Setup (Optional but Recommended)

### 1. Install Nginx

```bash
sudo apt-get install -y nginx
```

### 2. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/karuwa-takeaway
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable Site and Restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/karuwa-takeaway /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## 🔒 SSL/HTTPS Setup with Let's Encrypt (Recommended for Production)

### 1. Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

### 3. Auto-Renewal

Certbot automatically sets up auto-renewal. Test it with:

```bash
sudo certbot renew --dry-run
```

---

## 🔥 Firewall Configuration (UFW)

### 1. Install UFW

```bash
sudo apt-get install -y ufw
```

### 2. Configure Rules

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports (if not using Nginx)
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

### 3. Enable Firewall

```bash
sudo ufw enable
sudo ufw status
```

---

## 📊 Monitoring and Maintenance

### View System Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# PM2 monitoring
pm2 monit
```

### Database Backup

```bash
# Backup SQLite database
cp backend/karuwa.db backend/karuwa.db.backup-$(date +%Y%m%d)

# Or create a backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/karuwa"
mkdir -p $BACKUP_DIR
cp /var/www/karuwa-takeaway/backend/karuwa.db \
   $BACKUP_DIR/karuwa-$(date +%Y%m%d-%H%M%S).db
# Keep only last 7 days of backups
find $BACKUP_DIR -name "karuwa-*.db" -mtime +7 -delete
EOF

chmod +x backup-db.sh

# Add to crontab for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/karuwa-takeaway/backup-db.sh") | crontab -
```

### Update Application

```bash
cd /var/www/karuwa-takeaway

# Pull latest changes (if using Git)
git pull

# Install any new dependencies
npm install
cd backend && npm install && cd ..

# Restart application
pm2 restart all
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs

# Check if ports are in use
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Restart PM2
pm2 restart all
```

### Database Issues

```bash
# Check database file permissions
ls -la backend/karuwa.db

# Fix permissions if needed
chmod 644 backend/karuwa.db
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

---

## 📝 Post-Deployment Checklist

- [ ] Change default admin password
- [ ] Configure email settings in `backend/.env`
- [ ] Set up SSL/HTTPS with Let's Encrypt
- [ ] Configure firewall (UFW)
- [ ] Set up database backups
- [ ] Configure domain name (if applicable)
- [ ] Test all application features
- [ ] Set up monitoring/alerts
- [ ] Document any custom configurations

---

## 🆘 Support

For issues or questions:
1. Check the logs: `pm2 logs`
2. Review the troubleshooting section above
3. Check the main `DEPLOYMENT_GUIDE.md` for additional information

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [UFW Documentation](https://help.ubuntu.com/community/UFW)
