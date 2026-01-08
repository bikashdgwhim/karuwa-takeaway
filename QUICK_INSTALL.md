# Karuwa Takeaway - One-Line Installation Commands

## 🚀 Quick Installation (Copy & Paste)

### Option 1: Full Interactive Deployment
```bash
curl -fsSL https://raw.githubusercontent.com/YOUR-USERNAME/karuwa-takeaway/main/deploy-ubuntu.sh | sudo bash
```

### Option 2: Quick Start (Minimal Prompts)
```bash
curl -fsSL https://raw.githubusercontent.com/YOUR-USERNAME/karuwa-takeaway/main/quick-start-ubuntu.sh | bash
```

---

## 📥 Manual Download & Run

If you prefer to review scripts before running:

### Download All Scripts
```bash
# Create directory
mkdir -p ~/karuwa-deployment
cd ~/karuwa-deployment

# Download scripts
wget https://raw.githubusercontent.com/YOUR-USERNAME/karuwa-takeaway/main/deploy-ubuntu.sh
wget https://raw.githubusercontent.com/YOUR-USERNAME/karuwa-takeaway/main/quick-start-ubuntu.sh
wget https://raw.githubusercontent.com/YOUR-USERNAME/karuwa-takeaway/main/update-ubuntu.sh
wget https://raw.githubusercontent.com/YOUR-USERNAME/karuwa-takeaway/main/health-check.sh

# Make executable
chmod +x *.sh

# Run deployment
sudo ./deploy-ubuntu.sh
```

---

## 🔧 From Local Files

If you have the repository locally:

```bash
cd /path/to/karuwa-takeaway
sudo ./deploy-ubuntu.sh
```

---

## 📦 What Gets Installed

- Node.js 20.x LTS
- npm (latest)
- PM2 Process Manager
- SQLite3
- Nginx (optional)
- UFW Firewall (optional)
- Application dependencies

---

## ⚡ After Installation

1. **Access your app:**
   - Frontend: `http://your-server-ip:3000`
   - Backend: `http://your-server-ip:3001`

2. **Update credentials:**
   ```bash
   nano /var/www/karuwa-takeaway/backend/.env
   # Change ADMIN_PASSWORD
   ```

3. **Check status:**
   ```bash
   pm2 status
   ```

---

## 🆘 Need Help?

See the full documentation:
- `UBUNTU_SCRIPTS_README.md` - Script documentation
- `UBUNTU_DEPLOYMENT.md` - Detailed deployment guide
- `DEPLOYMENT_GUIDE.md` - General deployment info

---

**Note:** Replace `YOUR-USERNAME` with your actual GitHub username if using the curl commands.
