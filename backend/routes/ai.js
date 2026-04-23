// ═══════════════════════════════════════════
// SHIELD — AI Chatbot Route (/api/ai)
// "Because safety should not wait."
// ═══════════════════════════════════════════

const express = require('express');
const router = express.Router();

// ── In-memory chat history (keyed by session/user) ──
const chatHistories = {};

// ── Distress keywords (English + Hindi) ──
const DISTRESS_KEYWORDS_EN = [
  'help', 'danger', 'scared', 'unsafe', 'emergency', 'following me',
  'attack', 'threat', 'afraid', 'sos', 'someone is following',
  'i need help', 'please help', 'i am scared', 'he is following',
  'someone is chasing', 'i am in danger'
];
const DISTRESS_KEYWORDS_HI = [
  'bachao', 'darr', 'khatara', 'madad karo', 'help karo',
  'dar lag raha', 'koi peeche aa raha', 'mujhe darr lag raha',
  'mujhe bachao', 'khatarnak'
];

function isDistress(message) {
  const lower = message.toLowerCase();
  return (
    DISTRESS_KEYWORDS_EN.some(k => lower.includes(k)) ||
    DISTRESS_KEYWORDS_HI.some(k => lower.includes(k))
  );
}

function getEmergencyResponse() {
  return {
    type: 'emergency',
    message:
      '🚨 SHIELD EMERGENCY MODE — I AM WITH YOU\n\n' +
      '→ SHAKE YOUR PHONE 3 TIMES RIGHT NOW\n' +
      '→ OR SAY: "SHIELD HELP" out loud\n' +
      '→ CALL 112 IMMEDIATELY\n\n' +
      '📍 Your location will be sent to all your trusted contacts now.\n\n' +
      '✅ Move toward people and bright lights\n' +
      '✅ Keep moving — do not stop\n' +
      '✅ Stay on call with someone you trust\n' +
      '✅ Activate loud alarm if needed\n\n' +
      '🛡️ You are not alone. Help is being sent your way. I am here with you.\n\n' +
      '📞 Emergency Numbers:\n' +
      '• 112 — All emergencies (Police + Ambulance + Fire)\n' +
      '• 100 — Police direct\n' +
      '• 1091 — Women Helpline (National)\n' +
      '• 181 — Women Helpline (State)\n' +
      '• 1098 — Child Helpline',
    quickReplies: ['Call 112 now', 'How does SOS work?', "I'm safe now"]
  };
}

// ── POST /api/ai/chat ──
router.post('/chat', (req, res) => {
  try {
    const { message, sessionId = 'default', language = 'en' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    // Init history
    if (!chatHistories[sessionId]) chatHistories[sessionId] = [];

    // Store user message
    chatHistories[sessionId].push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    // Check for distress FIRST — highest priority
    let response;
    if (isDistress(message)) {
      response = getEmergencyResponse();
    } else {
      response = {
        type: 'info',
        message: generateSafetyResponse(message, language),
        quickReplies: ['How does SOS work?', 'Set up contacts', "I'm in danger!", 'Pricing plans']
      };
    }

    // Store bot reply
    chatHistories[sessionId].push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date().toISOString()
    });

    // Keep last 50 messages per session
    if (chatHistories[sessionId].length > 50) {
      chatHistories[sessionId] = chatHistories[sessionId].slice(-50);
    }

    return res.json({ success: true, response, sessionId });
  } catch (err) {
    console.error('[AI Chat Error]', err);
    return res.status(500).json({ success: false, error: 'AI service temporarily unavailable.' });
  }
});

// ── GET /api/ai/safety-tips ──
router.get('/safety-tips', (req, res) => {
  const tips = [
    { id: 1, tip: 'Test your SOS trigger every week to make sure it works perfectly.', category: 'sos' },
    { id: 2, tip: 'Always share your live location when traveling alone at night.', category: 'location' },
    { id: 3, tip: 'Save 112 as your first speed dial contact.', category: 'emergency' },
    { id: 4, tip: 'Keep your phone above 20% charge when going out alone.', category: 'device' },
    { id: 5, tip: 'Tell someone your route and expected arrival time always.', category: 'communication' },
    { id: 6, tip: 'Enable Travel Mode when commuting late — SHIELD auto-tracks your route.', category: 'travel' },
    { id: 7, tip: 'Add your most trusted person as Contact #1 for fastest response.', category: 'contacts' },
    { id: 8, tip: 'Keep SHIELD running in the background always for instant activation.', category: 'app' },
    { id: 9, tip: 'Avoid isolated areas and poorly lit routes, especially after dark.', category: 'awareness' },
    { id: 10, tip: "Trust your instincts — if something feels wrong, it probably is. Act immediately.", category: 'awareness' }
  ];

  // Return a random tip or all
  const { random } = req.query;
  if (random === 'true') {
    const tip = tips[Math.floor(Math.random() * tips.length)];
    return res.json({ success: true, tip });
  }

  return res.json({ success: true, tips, total: tips.length });
});

// ── GET /api/ai/history ──
router.get('/history', (req, res) => {
  const { sessionId = 'default', limit = 20 } = req.query;
  const history = chatHistories[sessionId] || [];
  const recent = history.slice(-parseInt(limit));
  return res.json({ success: true, history: recent, total: history.length });
});

// ── Basic response generator (fallback for non-emergency messages) ──
function generateSafetyResponse(message, language) {
  const q = message.toLowerCase();

  if (language === 'hi' || q.includes('namaste') || q.includes('namaskar')) {
    return '🛡️ नमस्ते! मैं SHIELD AI हूँ — आपकी सुरक्षा के लिए 24/7 यहाँ हूँ। आप सुरक्षित हैं। मैं आपकी मदद कर सकती हूँ — SOS setup, contacts, या किसी भी सुरक्षा सवाल में।';
  }

  if (q.includes('sos') || q.includes('trigger') || q.includes('shake')) {
    return '🆘 SHIELD SOS activates in 3 ways: shake your phone 3×, say "SHIELD HELP", or tap the SOS button. Works from the lock screen in under 2 seconds — no unlocking needed.';
  }

  if (q.includes('location') || q.includes('gps') || q.includes('track')) {
    return '📍 SHIELD shares your real-time GPS location with all trusted contacts via a live map link the moment SOS is triggered. Updates every 10 seconds (Premium) or 30 seconds (Free).';
  }

  if (q.includes('price') || q.includes('plan') || q.includes('cost') || q.includes('premium') || q.includes('free')) {
    return '💰 SHIELD Plans:\n🆓 Free — ₹0: SOS + 2 contacts + offline SMS + alarm\n⭐ Premium — ₹99/mo or ₹799/yr: 5 contacts + evidence recording + 10s GPS + full AI\n👨‍👩‍👧‍👦 Family — ₹199/mo or ₹1499/yr: 5 members + 10 contacts each + family dashboard';
  }

  if (q.includes('offline') || q.includes('sms') || q.includes('no internet')) {
    return '📶 No internet? SHIELD auto-switches to SMS mode. Your SOS message + last GPS coordinates are sent via basic 2G — zero data needed. Always reachable.';
  }

  if (q.includes('record') || q.includes('evidence') || q.includes('video') || q.includes('audio')) {
    return '🎥 Auto Evidence Recording (Premium): Silent audio + video starts automatically on SOS. Runs in background, encrypted and saved to cloud. Evidence link shared with your trusted contacts.';
  }

  if (q.includes('contact') || q.includes('trusted') || q.includes('setup') || q.includes('set up')) {
    return '👥 Add trusted contacts: Settings → Trusted Contacts → Add numbers. They\'ll get a verification link. Free: 2 contacts | Premium: 5 | Family: 10 per member. All alerted simultaneously on SOS.';
  }

  if (q.includes('alarm') || q.includes('loud') || q.includes('sound') || q.includes('siren')) {
    return '🔊 SHIELD\'s alarm is 110dB — louder than a car horn. Works even on silent/vibrate mode. Deactivates only with your PIN. Designed to deter threats and attract bystanders.';
  }

  if (q.includes('safe') || q.includes('thank') || q.includes('okay') || q.includes('good')) {
    return '💜 So glad you\'re safe! Remember to keep SHIELD running in the background, test your SOS weekly, and keep your contacts verified. You are strong — SHIELD has your back 24/7. 🛡️';
  }

  if (q.includes('112') || q.includes('police') || q.includes('helpline') || q.includes('number')) {
    return '📞 India Emergency Numbers:\n• 112 — All emergencies\n• 100 — Police\n• 1091 — Women Helpline\n• 181 — Women Helpline (State)\n• 1098 — Child Helpline\n• 102 — Ambulance\n• 101 — Fire\n• 1930 — Cyber Crime\n• 14567 — Senior Citizen';
  }

  return 'I\'m here to help! Ask me about: SOS setup, live location tracking, evidence recording, offline alerts, trusted contacts, pricing plans, or safety tips. You are not alone. 🛡️';
}

module.exports = router;
