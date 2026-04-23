// ═══════════════════════════════════════════
// SHIELD — Main Server
// "Because safety should not wait."
// ═══════════════════════════════════════════
// Built by: Sobhana Kumari, Sanskriti Tyagi,
//           Vaidehi Gupta & Jay Tyagi
// Contact:  kumarisobhana119@gmail.com
// ═══════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve static frontend files ──
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// ── API Routes ──
const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const sosRoutes = require('./routes/sos');
const locationRoutes = require('./routes/location');
const emergencyRoutes = require('./routes/emergency');
const aiRoutes = require('./routes/ai');
const familyRoutes = require('./routes/family');
const evidenceRoutes = require('./routes/evidence');
const analyticsRoutes = require('./routes/analytics');
const checkinRoutes = require('./routes/checkin');
const geofenceRoutes = require('./routes/geofence');
const paymentRoutes = require('./routes/payment');

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/geofence', geofenceRoutes);
app.use('/api/payment', paymentRoutes);

// ── API Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    app: 'SHIELD',
    tagline: 'Because safety should not wait',
    version: '1.0.0',
    status: 'active',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth (register, login, me, upgrade)',
      contacts: '/api/contacts (CRUD)',
      sos: '/api/sos (trigger, safe, active, history)',
      location: '/api/location (update, latest, track)',
      emergency: '/api/emergency (helpline numbers)',
      ai: '/api/ai (chat, safety-tips, history)',
      family: '/api/family (create, invite, members, dashboard)',
      evidence: '/api/evidence (start, upload, complete, download)',
      analytics: '/api/analytics (stats, safety-score, engagement)',
      checkin: '/api/checkin (schedule, complete, cancel)',
      geofence: '/api/geofence (safe-zone, danger-zone, check)',
      payment: '/api/payment (pricing, subscribe, verify)'
    }
  });
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
  console.log("\n🛡️════════════════════════════════════🛡️");
  console.log("🛡️   SHIELD Safety Server — ACTIVE");
  console.log(`🛡️   🌐 http://localhost:${PORT}`);
  console.log('🛡️   "Because safety should not wait."');
  console.log("🛡️════════════════════════════════════🛡️\n");

  console.log("📡 API Endpoints:\n");

  console.log("🔐 AUTH:");
  console.log("   POST /api/auth/register");
  console.log("   POST /api/auth/login");
  console.log("   GET  /api/auth/me");
  console.log("   POST /api/auth/upgrade\n");

  console.log("📇 CONTACTS:");
  console.log("   GET  /api/contacts");
  console.log("   POST /api/contacts\n");

  console.log("🚨 SOS:");
  console.log("   POST /api/sos/trigger");
  console.log("   POST /api/sos/safe");
  console.log("   GET  /api/sos/history\n");

  console.log("📍 LOCATION:");
  console.log("   POST /api/location/update");
  console.log("   GET  /api/location/latest\n");

  console.log("🆘 EMERGENCY:");
  console.log("   GET  /api/emergency\n");

  console.log("🤖 AI CHATBOT:");
  console.log("   POST /api/ai/chat");
  console.log("   GET  /api/ai/safety-tips\n");

  console.log("👨‍👩‍👧‍👦 FAMILY:");
  console.log("   POST /api/family/create");
  console.log("   GET  /api/family/dashboard\n");

  console.log("🎥 EVIDENCE:");
  console.log("   POST /api/evidence/start");
  console.log("   POST /api/evidence/upload\n");

  console.log("📊 ANALYTICS:");
  console.log("   GET  /api/analytics/stats");
  console.log("   GET  /api/analytics/safety-score\n");

  console.log("⏰ CHECK-IN:");
  console.log("   POST /api/checkin/schedule");
  console.log("   POST /api/checkin/:id/complete\n");

  console.log("📍 GEOFENCE:");
  console.log("   POST /api/geofence/safe-zone");
  console.log("   POST /api/geofence/check\n");

  console.log("💳 PAYMENT:");
  console.log("   GET  /api/payment/pricing");
  console.log("   POST /api/payment/subscribe\n");

  console.log("💚 HEALTH CHECK:");
  console.log("   GET  /api/health\n");
});

module.exports = app;
