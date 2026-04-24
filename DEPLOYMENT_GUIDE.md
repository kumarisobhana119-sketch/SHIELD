# 🛡️ SHIELD Deployment Guide

## ✅ SERVER STATUS: RUNNING
Your SHIELD backend is currently running at: **http://localhost:3000**

---

## 🚀 DEPLOYMENT OPTIONS

### Option 1: Vercel (Recommended - Easiest)

**Step 1:** Install Vercel CLI
```bash
npm install -g vercel
```

**Step 2:** Login to Vercel
```bash
vercel login
```

**Step 3:** Deploy
```bash
vercel
```

**Step 4:** Follow prompts:
- Project name: `shield-safety-app`
- Setup and deploy: `Y`
- Which scope: Choose your account
- Link to existing project: `N`
- What's your project's name: `shield-safety-app`
- In which directory is your code located: `./`

**Step 5:** Production deployment
```bash
vercel --prod
```

**Your app will be live at:** `https://shield-safety-app.vercel.app`

---

### Option 2: Render (Free Tier)

**Step 1:** Go to https://render.com and sign up

**Step 2:** Click "New +" → "Web Service"

**Step 3:** Connect your GitHub repository (or upload code)

**Step 4:** Configure:
- **Name:** shield-backend
- **Environment:** Node
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`
- **Plan:** Free

**Step 5:** Add Environment Variables:
```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key-here
```

**Step 6:** Click "Create Web Service"

**Your API will be live at:** `https://shield-backend.onrender.com`

---

### Option 3: Railway (Free $5 Credit)

**Step 1:** Go to https://railway.app and sign up

**Step 2:** Click "New Project" → "Deploy from GitHub repo"

**Step 3:** Select your SHIELD repository

**Step 4:** Railway auto-detects Node.js

**Step 5:** Add Environment Variables:
```
NODE_ENV=production
JWT_SECRET=your-secret-key-here
```

**Step 6:** Deploy automatically starts

**Your app will be live at:** `https://shield-backend.up.railway.app`

---

### Option 4: Heroku (Paid)

**Step 1:** Install Heroku CLI
```bash
npm install -g heroku
```

**Step 2:** Login
```bash
heroku login
```

**Step 3:** Create app
```bash
heroku create shield-safety-app
```

**Step 4:** Set environment variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key-here
```

**Step 5:** Deploy
```bash
git push heroku main
```

**Your app will be live at:** `https://shield-safety-app.herokuapp.com`

---

## 📝 BEFORE DEPLOYING - CHECKLIST

### 1. Update Frontend API URL

Edit `frontend/js/auth.js` line 6:

**Current (Local):**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**Change to (Production):**
```javascript
const API_BASE_URL = 'https://your-deployed-backend-url.com/api';
```

### 2. Update Environment Variables

Edit `backend/.env` for production:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=CHANGE-THIS-TO-STRONG-SECRET-KEY
CORS_ORIGINS=https://your-frontend-url.com
```

### 3. Add .gitignore

Create `.gitignore` in root:
```
node_modules/
backend/node_modules/
backend/.env
backend/data/*.json
.DS_Store
*.log
```

---

## 🔥 QUICK DEPLOY (Vercel - 2 Minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production
vercel --prod
```

**Done! Your app is live! 🎉**

---

## 🌐 AFTER DEPLOYMENT

### Update Frontend API URL

Once backend is deployed, update `frontend/js/auth.js`:

```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

### Test Your Deployment

1. Visit your deployed URL
2. Click "Sign Up"
3. Create an account
4. Login
5. Test SOS button
6. Check if all features work

---

## 🛡️ PRODUCTION SECURITY

### 1. Change JWT Secret
```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Enable HTTPS Only
All deployment platforms provide free SSL certificates automatically.

### 3. Set Secure CORS
Update `backend/.env`:
```env
CORS_ORIGINS=https://your-frontend-domain.com
```

---

## 📊 MONITORING

### Check Server Health
```
GET https://your-backend-url.com/api/health
```

### Check Logs
- **Vercel:** `vercel logs`
- **Render:** Dashboard → Logs tab
- **Railway:** Dashboard → Deployments → Logs

---

## 🆘 TROUBLESHOOTING

### Server not starting?
- Check environment variables are set
- Check Node.js version (requires 14+)
- Check logs for errors

### API calls failing?
- Update API_BASE_URL in frontend
- Check CORS settings
- Check network tab in browser

### Database not working?
- Ensure `backend/data/` folder exists
- Check file permissions
- Check logs for write errors

---

## 📞 SUPPORT

**Email:** kumarisobhana119@gmail.com

**Emergency:** Call 112

---

🛡️ **SHIELD is ready to protect. Deploy with confidence!**
