# 🚀 Karuwa Takeaway - Deployment Guide

Complete step-by-step guide for deploying your restaurant management application to production.

## 📋 Table of Contents

1. [Application Overview](#application-overview)
2. [Quick Start - Recommended Setup](#quick-start)
3. [Deployment Options Comparison](#deployment-options)
4. [Option A: Vercel + Railway (Recommended)](#option-a-vercel--railway)
5. [Option B: DigitalOcean App Platform](#option-b-digitalocean-app-platform)
6. [Option C: VPS Deployment](#option-c-vps-deployment)
7. [Production Checklist](#production-checklist)
8. [Post-Deployment](#post-deployment)

---

## 📱 Application Overview

**Karuwa Takeaway** is a full-stack restaurant management system with:

### Frontend (React + Vite)
- Customer-facing menu and ordering
- Real-time cart management
- Responsive design

### Backend (Node.js + Express)
- RESTful API
- SQLite database
- Email notifications (Brevo SMTP)
- User authentication (bcrypt)

### Database (SQLite)
- Menu items & categories
- Orders & customers
- Users & roles
- Email templates
- Promo codes

---

## ⚡ Quick Start - Recommended Setup

**Best for:** Most users, easy setup, free tier available

| Component | Platform | Cost |
|-----------|----------|------|
| Frontend | Vercel | Free |
| Backend | Railway | $5/month |
| Database | SQLite (included) | Free |
| Email | Brevo | Free (300/day) |

**Total: ~$5/month**

[Jump to detailed guide →](#option-a-vercel--railway)

---

## 🔍 Deployment Options

### Option A: Vercel + Railway ⭐ **RECOMMENDED**
**Best for:** Easy deployment, auto-scaling, great free tier

**Pros:**
- ✅ Easiest setup (< 30 minutes)
- ✅ Automatic deployments from Git
- ✅ Built-in SSL certificates
- ✅ Global CDN
- ✅ Free frontend hosting

**Cons:**
- ❌ Backend costs ~$5/month
- ❌ Limited to SQLite (not scalable to millions)

---

### Option B: DigitalOcean App Platform
**Best for:** Single platform management, predictable costs

**Pros:**
- ✅ Everything in one platform
- ✅ Predictable pricing
- ✅ Simple management
- ✅ Good documentation

**Cons:**
- ❌ $10-15/month minimum
- ❌ Less automatic optimization

---

### Option C: VPS (DigitalOcean/Linode/AWS EC2)
**Best for:** Full control, advanced users, cost optimization

**Pros:**
- ✅ Full server control
- ✅ Can run multiple apps
- ✅ Cheaper for multiple projects
- ✅ Can upgrade database to PostgreSQL

**Cons:**
- ❌ Requires server management
- ❌ Manual SSL setup
- ❌ More complex deployment
- ❌ Need to handle security updates

---

## 🎯 Option A: Vercel + Railway

### Prerequisites
- GitHub/GitLab account
- Vercel account (free)
- Railway account (free trial, then $5/month)
- Brevo account for emails (free)

### Part 1: Prepare Your Code

#### 1.1 Create Git Repository

```bash
cd karuwa-takeaway
git init
git add .
git commit -m "Initial commit"
```

Create a new repository on GitHub and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/karuwa-takeaway.git
git branch -M main
git push -u origin main
```

#### 1.2 Create `.gitignore`

```bash
# .gitignore
node_modules/
.env
.env.local
*.db
dist/
build/
.DS_Store
backend/uploads/
```

#### 1.3 Update Backend for Production

Create `backend/.env.production`:

```bash
PORT=3001
NODE_ENV=production
DATABASE_PATH=./karuwa.db
```

### Part 2: Deploy Backend to Railway

#### 2.1 Sign up for Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your repositories

#### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `karuwa-takeaway` repository
4. Railway will auto-detect Node.js

#### 2.3 Configure Backend Service
1. Click on your service
2. Go to "Settings" tab
3. **Root Directory**: Set to `backend`
4. **Start Command**: `npm start`
5. **Build Command**: `npm install`

#### 2.4 Set Environment Variables
In Railway dashboard → Variables tab:

```
PORT=3001
NODE_ENV=production
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-email@example.com
BREVO_SMTP_PASSWORD=your-brevo-smtp-key
RESTAURANT_EMAIL=orders@yourrestaurant.com
```

#### 2.5 Enable Public URL
1. Go to "Settings" tab
2. Click "Generate Domain"
3. Copy the URL (e.g., `karuwa-backend-production.up.railway.app`)

#### 2.6 Wait for Deployment
- Railway will automatically deploy
- Check "Deployments" tab for status
- Look for green checkmark ✅

### Part 3: Deploy Frontend to Vercel

#### 3.1 Sign up for Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

#### 3.2 Update Frontend API URL

Edit `src/services/storage.ts` and other files with API calls:

```typescript
// Change from localhost to Railway URL
const API_URL = 'https://your-railway-url.up.railway.app';
```

Or better, use environment variable:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

Create `.env.production` in root:

```
VITE_API_URL=https://your-railway-url.up.railway.app
```

Commit changes:

```bash
git add .
git commit -m "Update API URL for production"
git push
```

#### 3.3 Import Project to Vercel
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Vercel auto-detects Vite

#### 3.4 Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### 3.5 Add Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://your-railway-url.up.railway.app
```

#### 3.6 Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Vercel provides a URL (e.g., `karuwa-takeaway.vercel.app`)

### Part 4: Configure CORS

Update `backend/server.js` to allow your Vercel domain:

```javascript
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'https://karuwa-takeaway.vercel.app',
  'https://your-custom-domain.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

Commit and push - Railway will auto-deploy.

### Part 5: Set Up Custom Domain (Optional)

#### For Frontend (Vercel):
1. Vercel dashboard → Settings → Domains
2. Add your domain
3. Add DNS records as instructed by Vercel
4. SSL is automatic

#### For Backend (Railway):
1. Railway dashboard → Settings → Domains
2. Add custom domain
3. Update DNS CNAME record
4. SSL is automatic

---

## 🌊 Option B: DigitalOcean App Platform

### Prerequisites
- DigitalOcean account
- GitHub account
- Credit card (for billing)

### Step 1: Prepare Repository
Same as Option A - ensure code is on GitHub.

### Step 2: Create App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect to GitHub
4. Select your repository

### Step 3: Configure Components

#### Backend Component:
- **Name**: `karuwa-backend`
- **Type**: Web Service
- **Source Directory**: `/backend`
- **Build Command**: `npm install`
- **Run Command**: `npm start`
- **HTTP Port**: 3001
- **Environment Variables**:
  ```
  PORT=3001
  NODE_ENV=production
  BREVO_SMTP_HOST=smtp-relay.brevo.com
  BREVO_SMTP_PORT=587
  BREVO_SMTP_USER=your-email@example.com
  BREVO_SMTP_PASSWORD=your-smtp-key
  ```

#### Frontend Component:
- **Name**: `karuwa-frontend`
- **Type**: Static Site
- **Source Directory**: `/`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  ```
  VITE_API_URL=${karuwa-backend.PUBLIC_URL}
  ```

### Step 4: Choose Plan
- **Basic**: $5/month (512MB RAM)
- **Professional**: $12/month (1GB RAM) - **Recommended**

### Step 5: Deploy
1. Click "Create Resources"
2. Wait for deployment (5-10 minutes)
3. App Platform provides URLs for both components

---

## 💻 Option C: VPS Deployment

### Prerequisites
- VPS (DigitalOcean Droplet, Linode, AWS EC2)
- Domain name
- SSH access
- Basic Linux knowledge

### Step 1: Create VPS

**Recommended Specs:**
- **CPU**: 1-2 cores
- **RAM**: 1-2GB
- **Storage**: 25GB SSD
- **OS**: Ubuntu 22.04 LTS

**Providers:**
- DigitalOcean: $6/month
- Linode: $5/month  
- Vultr: $5/month

### Step 2: Initial Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser deploy
usermod -aG sudo deploy

# Setup firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# Switch to deploy user
su - deploy
```

### Step 3: Install Dependencies

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### Step 4: Clone and Setup Application

```bash
# Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/karuwa-takeaway.git
cd karuwa-takeaway

# Setup backend
cd backend
npm install --production
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Step 5: Build Frontend

```bash
cd ~/karuwa-takeaway
npm install
npm run build

# Frontend build is in dist/ folder
```

### Step 6: Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'karuwa-backend',
    cwd: '/home/deploy/karuwa-takeaway/backend',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

Start backend:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/karuwa
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend
    location / {
        root /home/deploy/karuwa-takeaway/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/karuwa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will auto-configure HTTPS.

### Step 9: Configure Auto-Updates

```bash
# Create update script
nano ~/update-karuwa.sh
```

Add:

```bash
#!/bin/bash
cd ~/karuwa-takeaway
git pull
cd backend
npm install --production
pm2 restart karuwa-backend
cd ..
npm install
npm run build
echo "Update complete!"
```

Make executable:

```bash
chmod +x ~/update-karuwa.sh
```

---

## ✅ Production Checklist

### Security

- [ ] Change default admin password
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for your domain
- [ ] Set secure session cookies
- [ ] Keep dependencies updated
- [ ] Implement rate limiting
- [ ] Add security headers

### Performance

- [ ] Enable gzip compression
- [ ] Optimize images
- [ ] Enable caching headers
- [ ] Use CDN for static assets
- [ ] Minify CSS/JS (automatic with Vite)
- [ ] Monitor API response times

### Database

- [ ] Set up automated backups
- [ ] Test backup restoration
- [ ] Consider migration to PostgreSQL for scale
- [ ] Implement database indexing

### Email

- [ ] Verify sender email in Brevo
- [ ] Test all email templates
- [ ] Set up email monitoring
- [ ] Configure SPF/DKIM records

### Monitoring

- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error logging (Sentry)
- [ ] Monitor server resources
- [ ] Set up alerts for downtime

---

## 🎉 Post-Deployment

### 1. Test Everything

```bash
# Test frontend
curl https://your-domain.com

# Test backend API
curl https://your-domain.com/api/menu

# Test user login
# Use browser to test full flow
```

### 2. Configure Admin Access

1. Login with default credentials
2. Change admin password immediately
3. Create staff users
4. Test permissions

### 3. Configure Email Settings

1. Go to Admin Panel → Email Management
2. Add Brevo SMTP credentials
3. Send test email
4. Verify templates work

### 4. Add Content

1. Upload menu items with images
2. Set up promo codes
3. Configure opening hours
4. Customize homepage content

### 5. Set Up Monitoring

**Recommended Tools:**
- **Uptime**: [UptimeRobot](https://uptimerobot.com) (Free)
- **Errors**: [Sentry](https://sentry.io) (Free tier)
- **Analytics**: Google Analytics

---

## 🆘 Troubleshooting

### Frontend Issues

**Problem**: API calls fail (CORS errors)
- **Solution**: Check CORS configuration in backend allows your frontend domain

**Problem**: Environment variables not loading
- **Solution**: Ensure `.env.production` exists and redeploy

### Backend Issues

**Problem**: Database not persisting
- **Solution**: Check volume mounts in Railway/DigitalOcean

**Problem**: Port already in use
- **Solution**: Change PORT in environment variables

**Problem**: Emails not sending
- **Solution**: Verify Brevo SMTP credentials and sender email verification

### Deployment Issues

**Problem**: Build fails on Vercel
- **Solution**: Check build logs, ensure all dependencies in `package.json`

**Problem**: Railway deployment times out
- **Solution**: Increase timeout in settings or optimize build

---

## 📚 Additional Resources

- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

## 💰 Cost Summary

| Setup | Monthly Cost | Effort | Scalability |
|-------|--------------|--------|-------------|
| Vercel + Railway | $5 | Easy | Medium |
| DigitalOcean App | $12-15 | Easy | Medium |
| VPS | $5-10 | Hard | High |

**Recommendation**: Start with Vercel + Railway, migrate to VPS if you need more control or run multiple apps.

---

**🎉 Congratulations! Your Karuwa Takeaway app is now live!**

For support or questions, refer to the documentation files in your project or create an issue on GitHub.
