// ═══════════════════════════════════════════
// SHIELD — Main Server
// "Because safety should not wait."
// ═══════════════════════════════════════════
// Built by: Sobhana Kumari, Sanskriti Tyagi,
//           Vaidehi Gupta & Jay Tyagi
// Contact:  kumarisobhana119@gmail.com
// ═══════════════════════════════════════════

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS — allow Render domain + localhost ──
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://shield-safety-app.onrender.com',
  // Add your custom domain here if you have one
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve static frontend files ──
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// ── API Routes ──
const authRoutes      = require('./routes/auth');
const contactsRoutes  = require('./routes/contacts');
const sosRoutes       = require('./routes/sos');
const locationRoutes  = require('./routes/location');
const emergencyRoutes = require('./routes/emergency');
const aiRoutes        = require('./routes/ai');
const familyRoutes    = require('./routes/family');
const evidenceRoutes  = require('./routes/evidence');
const analyticsRoutes = require('./routes/analytics');
const checkinRoutes   = require('./routes/checkin');
const geofenceRoutes  = require('./routes/geofence');
const paymentRoutes   = require('./routes/payment');

app.use('/api/auth',      authRoutes);
app.use('/api/contacts',  contactsRoutes);
app.use('/api/sos',       sosRoutes);
app.use('/api/location',  locationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/family',    familyRoutes);
app.use('/api/evidence',  evidenceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/checkin',   checkinRoutes);
app.use('/api/geofence',  geofenceRoutes);
app.use('/api/payment',   paymentRoutes);

// ── API Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    app: 'SHIELD',
    tagline: 'Because safety should not wait',
    version: '1.0.0',
    status: 'active',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    endpoints: {
      auth:      '/api/auth (register, login, me, upgrade)',
      contacts:  '/api/contacts (CRUD)',
      sos:       '/api/sos (trigger, safe, active, history)',
      location:  '/api/location (update, latest, track)',
      emergency: '/api/emergency (helpline numbers)',
      ai:        '/api/ai (chat, safety-tips, history)',
      family:    '/api/family (create, invite, members, dashboard)',
      evidence:  '/api/evidence (start, upload, complete, download)',
      analytics: '/api/analytics (stats, safety-score, engagement)',
      checkin:   '/api/checkin (schedule, complete, cancel)',
      geofence:  '/api/geofence (safe-zone, danger-zone, check)',
      payment:   '/api/payment (pricing, subscribe, verify)'
    }
  });
});

// ── Privacy Policy & Terms (required for Play Store) ──
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/privacy.html'));
});
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/terms.html'));
});

// ── Serve frontend for all non-API routes ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Start Scheduler ──
const { startScheduler } = require('./services/schedulerService');
startScheduler();

// ── Start Server ──
app.listen(PORT, () => {
  console.log('\n🛡️════════════════════════════════════🛡️');
  console.log('🛡️   SHIELD Safety Server — ACTIVE');
  console.log(`🛡️   🌐 http://localhost:${PORT}`);
  console.log('🛡️   "Because safety should not wait."');
  console.log(`🛡️   ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('🛡️════════════════════════════════════🛡️\n');

  console.log('📡 API Endpoints:\n');
  console.log('🔐 AUTH:      POST /api/auth/register | login | upgrade');
  console.log('📇 CONTACTS:  GET/POST /api/contacts');
  console.log('🚨 SOS:       POST /api/sos/trigger | safe | GET /api/sos/history');
  console.log('📍 LOCATION:  POST /api/location/update | GET /api/location/latest');
  console.log('🆘 EMERGENCY: GET /api/emergency');
  console.log('🤖 AI:        POST /api/ai/chat | GET /api/ai/safety-tips');
  console.log('👨‍👩‍👧‍👦 FAMILY:   POST /api/family/create | GET /api/family/dashboard');
  console.log('🎥 EVIDENCE:  POST /api/evidence/start | upload');
  console.log('📊 ANALYTICS: GET /api/analytics/stats | safety-score');
  console.log('⏰ CHECK-IN:  POST /api/checkin/schedule');
  console.log('📍 GEOFENCE:  POST /api/geofence/safe-zone | check');
  console.log('💳 PAYMENT:   GET /api/payment/pricing | POST /api/payment/subscribe');
  console.log('💚 HEALTH:    GET /api/health\n');
});

module.exports = app;
