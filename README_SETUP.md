# 🛡️ SHIELD - Quick Setup Guide

## 📁 Project Structure

```
SHIELD/
├── backend/              # Backend API server
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── middleware/      # Authentication middleware
│   ├── utils/           # Utility functions
│   ├── data/            # JSON database files
│   ├── server.js        # Main server file
│   ├── package.json     # Backend dependencies
│   └── .env             # Environment variables
│
├── frontend/            # Frontend web app
│   ├── js/             # JavaScript files
│   │   ├── auth.js     # Authentication module
│   │   └── app.js      # Main app logic
│   ├── css/            # Stylesheets
│   │   ├── style.css   # Main styles
│   │   └── modals.css  # Modal styles
│   ├── assets/         # Images and assets
│   └── index.html      # Main HTML file
│
└── start.bat           # Windows startup script
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Start the Server

**Option A: Using the startup script (Windows)**
```bash
# From project root
start.bat
```

**Option B: Manual start**
```bash
cd backend
npm start
```

### Step 3: Open the App

Open your browser and go to:
```
http://localhost:3000
```

---

## ✅ What's Working

### ✓ Backend Features
- **Authentication** - Register, Login, JWT tokens
- **Local Database** - JSON file-based storage (no external DB needed)
- **All API Endpoints** - 64+ endpoints ready
- **Services** - Notifications, Analytics, Scheduler, Geofence, Payment
- **Auto-scheduler** - Background tasks running automatically

### ✓ Frontend Features
- **Functional Buttons** - All buttons are clickable and working
- **Auth Modals** - Login and Register modals
- **Real Authentication** - Connects to backend API
- **Local Storage** - Saves user session
- **Toast Notifications** - Success/error messages
- **AI Chatbot** - Interactive assistant
- **SOS Demo** - Try the SOS feature

---

## 🧪 Test the App

### 1. Register a New User

1. Click "Sign Up" button
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Phone: +919876543210
   - Password: Test123
3. Click "Create Account"
4. You'll be logged in automatically!

### 2. Test SOS Feature

1. After logging in, click the red "SOS" button
2. See the emergency overlay
3. Click "I'm Safe" to dismiss

### 3. Try the AI Chatbot

1. Click the chat icon (💬) in bottom-right
2. Ask: "How does SOS work?"
3. Get instant AI responses

### 4. Check Your Data

Your user data is stored in:
```
backend/data/users.json
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### SOS Emergency
- `POST /api/sos/trigger` - Trigger SOS
- `POST /api/sos/safe` - Mark safe
- `GET /api/sos/history` - View history

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Add contact

### AI Chatbot
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/safety-tips` - Get tips

### Analytics
- `GET /api/analytics/stats` - User stats
- `GET /api/analytics/safety-score` - Safety score

### Payment
- `GET /api/payment/pricing` - Get pricing
- `POST /api/payment/subscribe` - Subscribe

**See full API docs:** `API_DOCUMENTATION.md`

---

## 🔧 Configuration

### Backend (.env file)

Located at: `backend/.env`

```env
PORT=3000
JWT_SECRET=your-secret-key
SMS_PROVIDER=demo
```

### Frontend (auth.js)

Located at: `frontend/js/auth.js`

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

---

## 🗄️ Database

### JSON File-Based Database

- **Location:** `backend/data/`
- **Files Created Automatically:**
  - `users.json` - User accounts
  - `contacts.json` - Trusted contacts
  - `sos_alerts.json` - SOS alerts
  - `locations.json` - Location data
  - `ai_conversations.json` - Chat history

### View Your Data

```bash
# Windows
type backend\data\users.json

# Or open in any text editor
notepad backend\data\users.json
```

---

## 🎯 Common Tasks

### Add a Trusted Contact

1. Login to the app
2. Open browser console (F12)
3. Run:
```javascript
ShieldAuth.apiCall('/contacts', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Mom',
    phone: '+919876543210',
    relationship: 'Mother'
  })
}).then(console.log);
```

### Trigger SOS (API)

```javascript
ShieldAuth.apiCall('/sos/trigger', {
  method: 'POST',
  body: JSON.stringify({
    latitude: 28.6139,
    longitude: 77.2090,
    triggerMethod: 'manual'
  })
}).then(console.log);
```

### Check Safety Score

```javascript
ShieldAuth.apiCall('/analytics/safety-score')
  .then(console.log);
```

---

## 🐛 Troubleshooting

### Port Already in Use

Change port in `backend/.env`:
```env
PORT=3001
```

### Cannot Connect to Server

1. Make sure server is running
2. Check console for errors
3. Verify URL: `http://localhost:3000`

### Login Not Working

1. Check browser console (F12)
2. Verify backend is running
3. Check `backend/data/users.json` exists

### Buttons Not Clickable

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check browser console for errors

---

## 📱 Features to Test

### ✓ Authentication
- [x] Register new user
- [x] Login with credentials
- [x] Logout
- [x] Session persistence

### ✓ SOS Features
- [x] SOS demo button
- [x] Emergency overlay
- [x] Dismiss alert

### ✓ AI Chatbot
- [x] Open chat
- [x] Send messages
- [x] Quick replies
- [x] Emergency detection

### ✓ Pricing
- [x] View plans
- [x] Click upgrade buttons
- [x] Plan comparison

---

## 🚀 Next Steps

### For Development
1. ✅ Backend is running
2. ✅ Frontend is connected
3. ✅ Authentication works
4. ✅ Database stores data
5. ⏭️ Add more contacts
6. ⏭️ Test SOS flow
7. ⏭️ Try all features

### For Production
1. Change `JWT_SECRET` in `.env`
2. Configure SMS provider (Twilio/MSG91)
3. Set up cloud storage (AWS S3)
4. Migrate to PostgreSQL/MongoDB
5. Deploy to hosting (see `DEPLOYMENT.md`)

---

## 📚 Documentation

- **README.md** - Project overview
- **API_DOCUMENTATION.md** - All API endpoints
- **SERVICES_DOCUMENTATION.md** - Backend services
- **QUICKSTART.md** - 5-minute guide
- **DEPLOYMENT.md** - Production deployment

---

## 💡 Tips

1. **Keep server running** - Don't close the terminal
2. **Check console** - F12 for debugging
3. **Test features** - Try everything!
4. **Read docs** - Comprehensive guides available

---

## 🆘 Need Help?

**Email:** kumarisobhana119@gmail.com

**Check:**
- Browser console (F12)
- Server terminal output
- `backend/data/` folder

---

**🛡️ SHIELD - Because safety should not wait!**

Everything is set up and ready to use! 🎉
