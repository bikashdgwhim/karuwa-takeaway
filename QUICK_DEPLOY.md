# 🚀 Quick Deployment Guide

**Fast track: Get your app live in 30 minutes**

## Choose Your Path

### 🌟 Path A: Easiest (Vercel + Railway)
**Time**: 30 minutes | **Cost**: $5/month | **Difficulty**: ⭐☆☆☆☆

[👉 Jump to instructions](#path-a-vercel--railway)

### 🔧 Path B: Moderate (DigitalOcean)
**Time**: 45 minutes | **Cost**: $12/month | **Difficulty**: ⭐⭐☆☆☆

[View full guide](./DEPLOYMENT_GUIDE.md#option-b-digitalocean-app-platform)

### 💪 Path C: Advanced (VPS)
**Time**: 2 hours | **Cost**: $5/month | **Difficulty**: ⭐⭐⭐⭐☆

[View full guide](./DEPLOYMENT_GUIDE.md#option-c-vps-deployment)

---

## Path A: Vercel + Railway

### Pre-flight Checklist
- [ ] GitHub account
- [ ] Code pushed to GitHub
- [ ] Credit card (for Railway, free trial available)

### Step 1: Deploy Backend (10 min)

1. **Go to**: [railway.app](https://railway.app)
2. **Click**: "Start a New Project"
3. **Select**: "Deploy from GitHub repo"  
4. **Choose**: Your repository
5. **Configure**:
   - Root Directory: `backend`
   - Start Command: `npm start`
6. **Add Variables**:
   ```
   PORT=3001
   BREVO_SMTP_HOST=smtp-relay.brevo.com
   BREVO_SMTP_PORT=587
   BREVO_SMTP_USER=your-email
   BREVO_SMTP_PASSWORD=your-key
   ```
7. **Generate Domain**: Copy the Railway URL

### Step 2: Update Code (5 min)

Update API URL in your code:

```typescript
// Option 1: Use environment variable (recommended)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Option 2: Direct replacement
const API_URL = 'https://your-app.railway.app';
```

Create `.env.production` in root:
```
VITE_API_URL=https://your-app.railway.app
```

Commit and push:
```bash
git add .
git commit -m "Add production API URL"
git push
```

### Step 3: Deploy Frontend (10 min)

1. **Go to**: [vercel.com](https://vercel.com)
2. **Click**: "New Project"
3. **Import**: Your GitHub repo
4. **Configure**:
   - Framework: Vite
   - Root: `./`
   - Build Command: `npm run build`
   - Output: `dist`
5. **Add Variable**:
   ```
   VITE_API_URL=https://your-app.railway.app
   ```
6. **Deploy**: Click "Deploy"
7. **Done**: Get your URL!

### Step 4: Configure CORS (5 min)

Update `backend/server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-app.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

Commit and push - Railway auto-deploys.

### Step 5: First Login

1. Visit your Vercel URL
2. Click "Staff Access"
3. Login: `admin` / `admin123`
4. **IMMEDIATELY change password**
5. Configure email settings
6. Start adding menu items!

---

## ⚡ Super Quick Commands

### Push to deploy:
```bash
git add .
git commit -m "Update"
git push
```

Both Vercel and Railway auto-deploy!

### Check backend:
```bash
curl https://your-backend.railway.app/api/menu
```

### Check frontend:
```bash
curl https://your-frontend.vercel.app
```

---

## 🆘 Common Issues

### Frontend can't reach backend
- Check CORS in `server.js`
- Verify `VITE_API_URL` is set
- Redeploy frontend after env var changes

### Database resets on deploy
- Railway: Database should persist
- Check Railway volumes in dashboard

### Build fails
- Check all dependencies in `package.json`
- Review build logs in Vercel/Railway
- Ensure Node version compatibility

---

## 📝 Post-Deployment Tasks

- [ ] Change admin password
- [ ] Add Brevo SMTP credentials  
- [ ] Test email sending
- [ ] Upload menu items with images
- [ ] Create staff users
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring

---

## 💡 Pro Tips

1. **Use Railway's free trial** - No credit card for 14 days
2. **Vercel is 100% free** for frontend
3. **Auto-deploy on push** - Just commit and push!
4. **Check logs** - Both platforms have great log viewers
5. **Start small** - Add features gradually

---

## 🎉 You're Live!

**Your app is now accessible at**:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`

**Next steps**:
1. Share with your team
2. Start taking orders!
3. Monitor with UptimeRobot
4. Set up custom domain when ready

**Need help?** Check the [full deployment guide](./DEPLOYMENT_GUIDE.md)
