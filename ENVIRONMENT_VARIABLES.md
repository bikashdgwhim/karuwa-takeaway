# 📦 Environment Variables Reference

## Frontend (.env.production)

Create this file in the **root directory**:

```bash
# API Configuration
VITE_API_URL=https://your-backend-url.up.railway.app
```

### Usage in Code:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

---

## Backend (backend/.env or Environment Variables)

### Required Variables:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Email Configuration (Brevo SMTP)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-email@example.com
BREVO_SMTP_PASSWORD=your-brevo-smtp-key
RESTAURANT_EMAIL=orders@yourrestaurant.com
RESTAURANT_NAME=Karuwa Takeaway

# Database (optional, defaults to ./karuwa.db)
DATABASE_PATH=./karuwa.db
```

### How to Get Brevo SMTP Credentials:

1. **Sign up**: Go to [brevo.com](https://www.brevo.com)
2. **Login**: Access your dashboard
3. **Navigate**: Settings → SMTP & API
4. **Create Key**: Click "Create a new SMTP key"
5. **Copy**: Save both email and key
6. **Verify Sender**: Add and verify your sender email

---

## Platform-Specific Configuration

### Vercel (Frontend)
Set in: **Project Settings → Environment Variables**

```
VITE_API_URL=https://your-backend.railway.app
```

### Railway (Backend)
Set in: **Service → Variables tab**

```
PORT=3001
NODE_ENV=production
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-email@example.com
BREVO_SMTP_PASSWORD=your-key
RESTAURANT_EMAIL=orders@yourrestaurant.com
```

### DigitalOcean App Platform
Set in: **App Settings → Environment Variables** (for each component)

**Backend Component:**
```
PORT=3001
NODE_ENV=production
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-email@example.com
BREVO_SMTP_PASSWORD=your-key
```

**Frontend Component:**
```
VITE_API_URL=${karuwa-backend.PUBLIC_URL}
```

### VPS (Manual Setup)
Create `/home/deploy/karuwa-takeaway/backend/.env`:

```bash
PORT=3001
NODE_ENV=production
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-email@example.com
BREVO_SMTP_PASSWORD=your-key
RESTAURANT_EMAIL=orders@yourrestaurant.com
```

---

## Security Best Practices

### ✅ DO:
- Use environment variables for all secrets
- Never commit `.env` files to Git
- Use different credentials for dev/prod
- Rotate SMTP keys regularly
- Use strong passwords

### ❌ DON'T:
- Hardcode credentials in source code
- Share `.env` files publicly
- Use same credentials across environments
- Commit sensitive data to Git

---

## Testing Environment Variables

### Test Backend:
```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env)"
```

### Test Frontend Build:
```bash
npm run build
# Check if API URL is correct in dist/assets/*.js
```

---

## Troubleshooting

### Issue: Environment variables not loading

**Vercel:**
- Redeploy after adding variables
- Check variable names match exactly
- Ensure no typos in var names

**Railway:**
- Variables update on next deploy
- Trigger manual deploy after changes
- Check service logs for errors

**VPS:**
- Restart PM2: `pm2 restart all`
- Check file permissions on `.env`
- Verify file location

### Issue: CORS errors

Update backend CORS configuration to include your frontend URL:

```javascript
const allowedOrigins = [
  'https://your-vercel-app.vercel.app',
  'https://your-custom-domain.com'
];
```

---

## Quick Copy Templates

### .gitignore
```
node_modules/
.env
.env.local
.env.production
*.db
dist/
build/
.DS_Store
backend/uploads/
```

### .env.example (safe to commit)
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-email@example.com
BREVO_SMTP_PASSWORD=your-smtp-key
RESTAURANT_EMAIL=orders@yourrestaurant.com
RESTAURANT_NAME=Karuwa Takeaway

# Database
DATABASE_PATH=./karuwa.db
```
