// ═══════════════════════════════════════════
// SHIELD — Authentication Routes
// ═══════════════════════════════════════════
// POST /api/auth/register — Create account
// POST /api/auth/login    — Login & get token
// GET  /api/auth/me        — Get current user
// PUT  /api/auth/me        — Update profile

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { findOne, insertOne, updateOne } = require('../utils/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ── Register ──
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, phone, password'
      });
    }

    // Check if user exists
    const existing = findOne('users', u => u.email === email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = {
      id: uuidv4(),
      name,
      email,
      phone,
      password: hashedPassword,
      plan: 'free',        // free | premium | family
      sosTrigger: 'both',  // shake | voice | both
      sensitivity: 'medium',
      alarmEnabled: true,
      createdAt: new Date().toISOString()
    };

    insertOne('users', user);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password: _, ...safeUser } = user;
    res.status(201).json({
      success: true,
      message: '🛡️ Welcome to SHIELD! Your account is now protected.',
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ── Login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = findOne('users', u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      message: '🛡️ Welcome back! SHIELD is active.',
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// ── Get Current User ──
router.get('/me', authenticate, (req, res) => {
  const user = findOne('users', u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// ── Update Profile ──
router.put('/me', authenticate, (req, res) => {
  const { name, phone, sosTrigger, sensitivity, alarmEnabled } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (sosTrigger) updates.sosTrigger = sosTrigger;
  if (sensitivity) updates.sensitivity = sensitivity;
  if (typeof alarmEnabled === 'boolean') updates.alarmEnabled = alarmEnabled;

  const user = updateOne('users', u => u.id === req.user.id, updates);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  const { password: _, ...safeUser } = user;
  res.json({ success: true, message: 'Profile updated.', user: safeUser });
});

// ── Upgrade Plan ──
router.post('/upgrade', authenticate, (req, res) => {
  const { plan } = req.body;
  const validPlans = ['free', 'premium', 'family'];

  if (!validPlans.includes(plan)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid plan. Choose: free, premium, or family.'
    });
  }

  const user = updateOne('users', u => u.id === req.user.id, { plan });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const planDetails = {
    free: { contacts: 2, locationInterval: 30, evidenceRecording: false },
    premium: { contacts: 5, locationInterval: 10, evidenceRecording: true },
    family: { contacts: 10, locationInterval: 10, evidenceRecording: true }
  };

  res.json({
    success: true,
    message: `🛡️ Upgraded to ${plan.toUpperCase()} plan!`,
    plan,
    features: planDetails[plan]
  });
});

module.exports = router;
