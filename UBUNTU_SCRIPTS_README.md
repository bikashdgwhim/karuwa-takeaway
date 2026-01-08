# 🚀 Ubuntu Server Automation Scripts

This directory contains automation scripts for deploying and managing the Karuwa Takeaway application on Ubuntu servers.

## 📦 Available Scripts

### 1. **deploy-ubuntu.sh** - Full Interactive Deployment
The complete deployment automation script with interactive prompts.

**Features:**
- ✅ System updates
- ✅ Node.js 20.x installation
- ✅ PM2 process manager setup
- ✅ Optional Nginx installation
- ✅ SQLite installation
- ✅ Application deployment (Git or local)
- ✅ Dependency installation
- ✅ Environment configuration
- ✅ PM2 configuration
- ✅ Firewall setup (UFW)
- ✅ Nginx reverse proxy configuration

**Usage:**
```bash
sudo chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

**Time:** ~10-15 minutes (depending on choices)

---

### 2. **quick-start-ubuntu.sh** - Quick Deployment
Fast deployment with minimal prompts and sensible defaults.

**Features:**
- ✅ Automatic system setup
- ✅ Dependency installation
- ✅ Environment file creation
- ✅ PM2 startup configuration
- ✅ Application launch

**Usage:**
```bash
chmod +x quick-start-ubuntu.sh
./quick-start-ubuntu.sh
```

**Time:** ~5 minutes

---

### 3. **update-ubuntu.sh** - Application Update
Updates the application with the latest code and dependencies.

**Features:**
- ✅ Database backup
- ✅ Git pull (if applicable)
- ✅ Dependency updates
- ✅ Optional production build
- ✅ Application restart

**Usage:**
```bash
chmod +x update-ubuntu.sh
./update-ubuntu.sh
```

**Time:** ~2-3 minutes

---

### 4. **health-check.sh** - Health Monitoring
Checks application health and automatically restarts if issues are detected.

**Features:**
- ✅ PM2 process check
- ✅ Frontend availability check
- ✅ Backend API check
- ✅ Database integrity check
- ✅ Disk space monitoring
- ✅ Memory usage monitoring
- ✅ Auto-restart on failure

**Usage:**
```bash
chmod +x health-check.sh
./health-check.sh
```

**Setup as Cron Job (runs every 5 minutes):**
```bash
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/karuwa-takeaway/health-check.sh >> /var/log/karuwa-health.log 2>&1") | crontab -
```

---

## 🎯 Quick Start Guide

### For First-Time Deployment

**Option A: Full Control (Recommended for first deployment)**
```bash
sudo ./deploy-ubuntu.sh
```
Follow the interactive prompts to customize your deployment.

**Option B: Quick & Easy**
```bash
./quick-start-ubuntu.sh
```
Uses sensible defaults for a rapid deployment.

### For Updating Existing Deployment

```bash
./update-ubuntu.sh
```

### For Monitoring

```bash
# Manual check
./health-check.sh

# Or set up automated monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/karuwa-takeaway/health-check.sh >> /var/log/karuwa-health.log 2>&1") | crontab -
```

---

## 📋 Prerequisites

### Minimum Server Requirements
- **OS:** Ubuntu 20.04 LTS or newer
- **RAM:** 1GB minimum (2GB recommended)
- **Disk:** 10GB free space
- **CPU:** 1 core minimum (2 cores recommended)

### Required Access
- Root or sudo access
- SSH access to the server
- Port 3000 and 3001 available (or configure firewall)

---

## 🔧 Post-Deployment Configuration

After running the deployment script, you should:

### 1. Update Admin Credentials
```bash
nano backend/.env
# Change ADMIN_PASSWORD to a strong password
```

### 2. Configure Email Settings
```bash
nano backend/.env
# Update EMAIL_* variables with your SMTP credentials
```

### 3. Set Up SSL (Production)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 4. Configure Domain (if applicable)
Update your DNS records to point to your server IP, then update Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/karuwa-takeaway
# Update server_name with your domain
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Management Commands

### PM2 Process Management
```bash
pm2 status              # View process status
pm2 logs                # View all logs
pm2 logs karuwa-backend # Backend logs only
pm2 logs karuwa-frontend # Frontend logs only
pm2 restart all         # Restart all processes
pm2 stop all            # Stop all processes
pm2 start all           # Start all processes
pm2 monit               # Real-time monitoring
```

### Nginx Management
```bash
sudo systemctl status nginx   # Check status
sudo systemctl restart nginx  # Restart Nginx
sudo nginx -t                 # Test configuration
sudo tail -f /var/log/nginx/error.log  # View error logs
```

### Database Management
```bash
# Backup database
cp backend/karuwa.db backend/karuwa.db.backup-$(date +%Y%m%d)

# View database
sqlite3 backend/karuwa.db
```

---

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs

# Check if ports are in use
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Restart
pm2 restart all
```

### Database Issues
```bash
# Check permissions
ls -la backend/karuwa.db

# Fix permissions
chmod 644 backend/karuwa.db
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart
sudo systemctl restart nginx
```

---

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Set up SSL/HTTPS with Let's Encrypt
- [ ] Configure firewall (UFW)
- [ ] Set up regular database backups
- [ ] Keep system and dependencies updated
- [ ] Use strong JWT secret (auto-generated by scripts)
- [ ] Restrict SSH access (key-based authentication)
- [ ] Set up fail2ban for brute-force protection

---

## 📁 File Structure After Deployment

```
/var/www/karuwa-takeaway/
├── backend/
│   ├── .env                    # Backend environment variables
│   ├── server.js               # Backend server
│   ├── karuwa.db              # SQLite database
│   └── ...
├── components/                 # React components
├── logs/                       # Application logs
├── .env.local                  # Frontend environment variables
├── ecosystem.config.cjs         # PM2 configuration
├── deploy-ubuntu.sh           # Deployment script
├── quick-start-ubuntu.sh      # Quick start script
├── update-ubuntu.sh           # Update script
├── health-check.sh            # Health check script
└── ...
```

---

## 🔄 Automated Backups

### Set Up Daily Database Backups

Create a backup script:
```bash
cat > /var/www/karuwa-takeaway/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/karuwa"
mkdir -p $BACKUP_DIR
cp /var/www/karuwa-takeaway/backend/karuwa.db \
   $BACKUP_DIR/karuwa-$(date +%Y%m%d-%H%M%S).db
# Keep only last 7 days
find $BACKUP_DIR -name "karuwa-*.db" -mtime +7 -delete
EOF

chmod +x /var/www/karuwa-takeaway/backup-db.sh
```

Add to crontab (daily at 2 AM):
```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/karuwa-takeaway/backup-db.sh") | crontab -
```

---

## 📞 Support & Documentation

- **Full Deployment Guide:** See `UBUNTU_DEPLOYMENT.md`
- **Environment Variables:** See `ENVIRONMENT_VARIABLES.md`
- **PM2 Guide:** See `PM2_GUIDE.md`
- **General Deployment:** See `DEPLOYMENT_GUIDE.md`

---

## 🎉 Success Indicators

After successful deployment, you should see:

✅ PM2 shows both processes as "online"
```bash
pm2 status
# karuwa-backend  | online
# karuwa-frontend | online
```

✅ Application accessible at:
- Frontend: http://your-server-ip:3000
- Backend API: http://your-server-ip:3001
- (Or via Nginx on port 80/443)

✅ Health check passes:
```bash
./health-check.sh
# Overall Status: HEALTHY ✓
```

---

## 📝 Notes

- All scripts are idempotent - safe to run multiple times
- Scripts create backups before making changes
- Logs are stored in the `logs/` directory
- PM2 automatically restarts processes on failure
- Scripts use color-coded output for easy reading

---

**Happy Deploying! 🚀**
