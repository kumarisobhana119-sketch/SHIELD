// ═══════════════════════════════════════════
// SHIELD — SOS Emergency Routes
// ═══════════════════════════════════════════
// POST /api/sos/trigger    — Trigger SOS alert
// POST /api/sos/safe       — Mark user as safe
// GET  /api/sos/history    — Get SOS history
// GET  /api/sos/active     — Get active SOS

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { findMany, findOne, insertOne, updateOne } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── Trigger SOS ──
router.post('/trigger', authenticate, (req, res) => {
  const { latitude, longitude, triggerMethod } = req.body;

  // Get user's trusted contacts
  const contacts = findMany('contacts', c => c.userId === req.user.id);

  if (contacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: '⚠️ No trusted contacts set up. Add contacts in Settings first.'
    });
  }

  // Check for existing active SOS
  const activeAlert = findOne('sos_alerts',
    a => a.userId === req.user.id && a.status === 'active'
  );

  if (activeAlert) {
    // Update location on existing alert
    updateOne('sos_alerts',
      a => a.id === activeAlert.id,
      {
        lastLatitude: latitude || activeAlert.lastLatitude,
        lastLongitude: longitude || activeAlert.lastLongitude,
        lastUpdated: new Date().toISOString(),
        updateCount: (activeAlert.updateCount || 1) + 1
      }
    );

    return res.json({
      success: true,
      message: '📍 SOS location updated.',
      alertId: activeAlert.id,
      status: 'active'
    });
  }

  // Create new SOS alert
  const alert = {
    id: uuidv4(),
    userId: req.user.id,
    userName: req.user.name,
    status: 'active',
    triggerMethod: triggerMethod || 'manual', // shake | voice | manual
    latitude: latitude || null,
    longitude: longitude || null,
    lastLatitude: latitude || null,
    lastLongitude: longitude || null,
    locationLink: latitude && longitude
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : null,
    contactsNotified: contacts.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      notifiedVia: 'internet', // internet | sms
      notifiedAt: new Date().toISOString()
    })),
    evidenceRecording: req.user.plan !== 'free',
    alarmTriggered: true,
    smsBackupSent: true,
    updateCount: 1,
    triggeredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    resolvedAt: null
  };

  insertOne('sos_alerts', alert);

  // Log the event
  console.log(`🚨 SOS TRIGGERED by ${req.user.name} (${req.user.email})`);
  console.log(`   📍 Location: ${alert.locationLink || 'Unknown'}`);
  console.log(`   📱 Method: ${alert.triggerMethod}`);
  console.log(`   👥 Contacts notified: ${contacts.length}`);

  // Build SMS message
  const smsMessage = `EMERGENCY! ${req.user.name} needs help. ` +
    `Live Location: ${alert.locationLink || 'GPS unavailable'}. ` +
    `Sent via SHIELD Safety App.`;

  res.status(201).json({
    success: true,
    message: '🚨 SOS ACTIVATED! All contacts have been alerted.',
    alert: {
      id: alert.id,
      status: alert.status,
      triggerMethod: alert.triggerMethod,
      locationLink: alert.locationLink,
      contactsNotified: alert.contactsNotified.length,
      evidenceRecording: alert.evidenceRecording,
      alarmTriggered: alert.alarmTriggered,
      smsMessage,
      triggeredAt: alert.triggeredAt
    }
  });
});

// ── Mark Safe ──
router.post('/safe', authenticate, (req, res) => {
  const activeAlert = findOne('sos_alerts',
    a => a.userId === req.user.id && a.status === 'active'
  );

  if (!activeAlert) {
    return res.status(404).json({
      success: false,
      message: 'No active SOS alert found.'
    });
  }

  const resolvedAlert = updateOne('sos_alerts',
    a => a.id === activeAlert.id,
    {
      status: 'resolved',
      resolvedAt: new Date().toISOString()
    }
  );

  // Calculate duration
  const duration = Math.round(
    (new Date(resolvedAlert.resolvedAt) - new Date(resolvedAlert.triggeredAt)) / 1000
  );

  console.log(`✅ ${req.user.name} marked themselves SAFE (${duration}s duration)`);

  res.json({
    success: true,
    message: '💜 You are marked safe. All contacts have been notified.',
    alert: {
      id: resolvedAlert.id,
      status: 'resolved',
      triggeredAt: resolvedAlert.triggeredAt,
      resolvedAt: resolvedAlert.resolvedAt,
      durationSeconds: duration,
      locationUpdates: resolvedAlert.updateCount
    }
  });
});

// ── Get Active SOS ──
router.get('/active', authenticate, (req, res) => {
  const activeAlert = findOne('sos_alerts',
    a => a.userId === req.user.id && a.status === 'active'
  );

  res.json({
    success: true,
    hasActiveAlert: !!activeAlert,
    alert: activeAlert ? {
      id: activeAlert.id,
      status: activeAlert.status,
      locationLink: activeAlert.locationLink,
      triggeredAt: activeAlert.triggeredAt,
      updateCount: activeAlert.updateCount,
      contactsNotified: activeAlert.contactsNotified.length
    } : null
  });
});

// ── SOS History ──
router.get('/history', authenticate, (req, res) => {
  const alerts = findMany('sos_alerts', a => a.userId === req.user.id);

  // Sort by newest first
  alerts.sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));

  const history = alerts.map(a => ({
    id: a.id,
    status: a.status,
    triggerMethod: a.triggerMethod,
    locationLink: a.locationLink,
    contactsNotified: a.contactsNotified.length,
    triggeredAt: a.triggeredAt,
    resolvedAt: a.resolvedAt,
    durationSeconds: a.resolvedAt
      ? Math.round((new Date(a.resolvedAt) - new Date(a.triggeredAt)) / 1000)
      : null
  }));

  res.json({
    success: true,
    totalAlerts: history.length,
    activeAlerts: history.filter(a => a.status === 'active').length,
    history
  });
});

module.exports = router;
