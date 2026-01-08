# PM2 Process Manager - Quick Reference

## 🚀 Starting the Application

### First Time Setup
```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Save the PM2 process list (so it persists after reboot)
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs
```

## 📊 Managing the Application

### View Status
```bash
# List all running processes
pm2 list

# Show detailed info about karuwa-backend
pm2 show karuwa-backend

# Monitor in real-time (CPU, memory usage)
pm2 monit
```

### Logs
```bash
# View all logs in real-time
pm2 logs

# View only karuwa-backend logs
pm2 logs karuwa-backend

# View last 100 lines
pm2 logs karuwa-backend --lines 100

# Clear all logs
pm2 flush
```

### Restart/Reload
```bash
# Restart the application
pm2 restart karuwa-backend

# Reload with zero-downtime (graceful reload)
pm2 reload karuwa-backend

# Stop the application
pm2 stop karuwa-backend

# Delete from PM2 process list
pm2 delete karuwa-backend
```

### After Code Updates
```bash
# Pull latest code
git pull

# Install dependencies (if package.json changed)
cd backend
npm install --production

# Restart the application
pm2 restart karuwa-backend

# Or use the update script
cd ~/karuwa-takeaway
./update-karuwa.sh
```

## 🔧 Advanced Commands

### Environment Management
```bash
# Start with production environment
pm2 start ecosystem.config.js --env production

# Start with development environment
pm2 start ecosystem.config.js --env development
```

### Scaling (Multiple Instances)
```bash
# Scale to 2 instances
pm2 scale karuwa-backend 2

# Scale to max CPU cores
pm2 scale karuwa-backend max
```

### Memory Management
```bash
# Restart if memory usage exceeds 1GB (already configured in ecosystem.config.js)
# This happens automatically

# View memory usage
pm2 list
```

## 📁 Log Files Location

Logs are stored in `./logs/`:
- `err.log` - Error logs only
- `out.log` - Standard output logs
- `combined.log` - All logs combined

## 🔄 Auto-Restart on Crash

PM2 automatically restarts your application if it crashes. This is configured with:
```javascript
autorestart: true
```

## 💾 Persistence

To ensure PM2 restarts your app after server reboot:

```bash
# Save current process list
pm2 save

# Generate startup script (run once)
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
# Copy and run that command
```

## 🛑 Stopping Everything

```bash
# Stop all PM2 processes
pm2 stop all

# Delete all PM2 processes
pm2 delete all

# Kill PM2 daemon
pm2 kill
```

## 📈 Monitoring & Metrics

### Built-in Monitoring
```bash
# Real-time monitoring dashboard
pm2 monit
```

### PM2 Plus (Optional - Advanced Monitoring)
```bash
# Sign up at https://pm2.io
pm2 plus

# Link your server
pm2 link <secret_key> <public_key>
```

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check logs for errors
pm2 logs karuwa-backend --err

# Try starting manually to see errors
cd backend
node server.js
```

### Port Already in Use
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change PORT in .env file
```

### High Memory Usage
```bash
# Check memory usage
pm2 list

# Restart to free memory
pm2 restart karuwa-backend
```

## 📚 Useful Resources

- [PM2 Official Documentation](https://pm2.keymetrics.io/docs)
- [PM2 Ecosystem File](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/process-management/)

## 🔐 Security Note

The `.env` file contains sensitive credentials. Ensure:
- ✅ It's in `.gitignore`
- ✅ File permissions are restricted: `chmod 600 backend/.env`
- ✅ Only the deploy user can read it
