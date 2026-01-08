# 🔧 Nginx Default Page - Troubleshooting Guide

If you're seeing the Nginx default page instead of your Karuwa Takeaway application, follow this guide to fix it.

## 🚀 Quick Fix (Recommended)

Run the automated fix script on your Ubuntu server:

```bash
sudo chmod +x fix-nginx.sh
sudo ./fix-nginx.sh
```

This script will:
- ✅ Create proper Nginx configuration
- ✅ Remove the default Nginx site
- ✅ Enable your application site
- ✅ Test and restart Nginx

---

## 🔍 Manual Troubleshooting Steps

### Step 1: Check if Application is Running

```bash
# Check PM2 status
pm2 status

# You should see both processes as "online":
# karuwa-backend  | online
# karuwa-frontend | online
```

**If not running:**
```bash
cd /var/www/karuwa-takeaway
pm2 start ecosystem.config.cjs
pm2 save
```

### Step 2: Verify Ports are Listening

```bash
# Check if ports 3000 and 3001 are listening
sudo netstat -tulpn | grep -E ':(3000|3001)'

# Or use ss command
sudo ss -tulpn | grep -E ':(3000|3001)'
```

**Expected output:**
```
tcp   0   0 :::3000   :::*   LISTEN   12345/node
tcp   0   0 :::3001   :::*   LISTEN   12346/node
```

**If ports are not listening:**
- Application is not running - go back to Step 1
- Check PM2 logs: `pm2 logs`

### Step 3: Check Nginx Configuration

```bash
# List enabled sites
ls -la /etc/nginx/sites-enabled/

# Check if default site is still enabled
ls -la /etc/nginx/sites-enabled/default
```

**If default site exists:**
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### Step 4: Create/Update Nginx Configuration

```bash
# Create the configuration file
sudo nano /etc/nginx/sites-available/karuwa-takeaway
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name _;  # Replace with your domain if you have one

    # Increase client body size for file uploads
    client_max_body_size 10M;

    # Frontend (Vite dev server or built files)
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
        
        # WebSocket support for Vite HMR
        proxy_read_timeout 86400;
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

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Step 5: Enable the Site

```bash
# Create symbolic link to enable the site
sudo ln -sf /etc/nginx/sites-available/karuwa-takeaway /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default
```

### Step 6: Test and Restart Nginx

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## 🐛 Common Issues and Solutions

### Issue 1: "502 Bad Gateway"

**Cause:** Application is not running or ports are wrong.

**Solution:**
```bash
# Check if application is running
pm2 status

# Restart application
pm2 restart all

# Check logs
pm2 logs
```

### Issue 2: "Connection Refused"

**Cause:** Firewall blocking ports or application not listening.

**Solution:**
```bash
# Check firewall
sudo ufw status

# Allow ports if needed
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Check if application is listening
sudo netstat -tulpn | grep -E ':(3000|3001)'
```

### Issue 3: Still Seeing Default Page

**Cause:** Browser cache or Nginx cache.

**Solution:**
```bash
# Clear Nginx cache (if enabled)
sudo rm -rf /var/cache/nginx/*

# Restart Nginx
sudo systemctl restart nginx

# In browser: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
# Or open in incognito/private mode
```

### Issue 4: Nginx Configuration Test Fails

**Cause:** Syntax error in configuration.

**Solution:**
```bash
# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Validate configuration
sudo nginx -t

# Fix any syntax errors shown
```

### Issue 5: Permission Denied

**Cause:** Nginx user doesn't have permission to access files.

**Solution:**
```bash
# Check Nginx user
ps aux | grep nginx

# Ensure proper permissions
sudo chown -R www-data:www-data /var/www/karuwa-takeaway
sudo chmod -R 755 /var/www/karuwa-takeaway
```

---

## 📊 Verification Checklist

After making changes, verify everything is working:

- [ ] PM2 shows both processes as "online": `pm2 status`
- [ ] Ports 3000 and 3001 are listening: `sudo netstat -tulpn | grep -E ':(3000|3001)'`
- [ ] Nginx configuration is valid: `sudo nginx -t`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Default site is disabled: `ls /etc/nginx/sites-enabled/` (should not show "default")
- [ ] Karuwa site is enabled: `ls /etc/nginx/sites-enabled/` (should show "karuwa-takeaway")
- [ ] No errors in Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] Application accessible via browser

---

## 🔍 Diagnostic Commands

Use these commands to gather information:

```bash
# Check all services
echo "=== PM2 Status ==="
pm2 status

echo -e "\n=== Listening Ports ==="
sudo netstat -tulpn | grep -E ':(80|3000|3001)'

echo -e "\n=== Nginx Status ==="
sudo systemctl status nginx

echo -e "\n=== Enabled Sites ==="
ls -la /etc/nginx/sites-enabled/

echo -e "\n=== Nginx Test ==="
sudo nginx -t

echo -e "\n=== Recent Nginx Errors ==="
sudo tail -20 /var/log/nginx/error.log

echo -e "\n=== PM2 Logs (last 20 lines) ==="
pm2 logs --lines 20 --nostream
```

---

## 🆘 Still Not Working?

If you've tried everything above and it's still not working:

1. **Collect diagnostic information:**
   ```bash
   # Save diagnostic info to file
   {
     echo "=== System Info ==="
     uname -a
     echo -e "\n=== PM2 Status ==="
     pm2 status
     echo -e "\n=== Ports ==="
     sudo netstat -tulpn | grep -E ':(80|3000|3001)'
     echo -e "\n=== Nginx Config Test ==="
     sudo nginx -t
     echo -e "\n=== Nginx Error Log ==="
     sudo tail -50 /var/log/nginx/error.log
     echo -e "\n=== PM2 Logs ==="
     pm2 logs --lines 50 --nostream
   } > diagnostic-info.txt
   ```

2. **Review the diagnostic info:**
   ```bash
   cat diagnostic-info.txt
   ```

3. **Try accessing directly:**
   - Frontend: `http://your-server-ip:3000`
   - Backend: `http://your-server-ip:3001/api/health`
   
   If these work, the issue is with Nginx configuration.

4. **Restart everything:**
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```

---

## 📝 Alternative: Access Without Nginx

If you need immediate access while troubleshooting Nginx:

```bash
# Make sure firewall allows direct access
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Access application directly
# Frontend: http://your-server-ip:3000
# Backend: http://your-server-ip:3001
```

**Note:** This is not recommended for production, but useful for testing.

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Visiting `http://your-server-ip` shows the Karuwa Takeaway app (not Nginx default page)
2. ✅ No errors in: `sudo tail -f /var/log/nginx/error.log`
3. ✅ PM2 shows all processes online: `pm2 status`
4. ✅ Health check works: `curl http://your-server-ip/health` returns "healthy"

---

**Need more help?** Check the other documentation files:
- `UBUNTU_DEPLOYMENT.md` - Full deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
- `UBUNTU_SCRIPTS_README.md` - Scripts documentation
