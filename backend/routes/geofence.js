// ═══════════════════════════════════════════
// SHIELD — Geofence Routes
// ═══════════════════════════════════════════

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createSafeZone,
  createDangerZone,
  getUserGeofences,
  updateGeofence,
  deleteGeofence,
  checkGeofence,
  processGeofenceAlerts,
  getNearbySafeZones,
  suggestSafeZones
} = require('../services/geofenceService');

const router = express.Router();

// ── Create Safe Zone ──
router.post('/safe-zone', authenticate, (req, res) => {
  const { name, latitude, longitude, radius, notifyOnEnter, notifyOnExit } = req.body;

  if (!name || !latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Name, latitude, and longitude are required'
    });
  }

  const result = createSafeZone(req.user.id, {
    name,
    latitude,
    longitude,
    radius,
    notifyOnEnter,
    notifyOnExit
  });

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Create Danger Zone ──
router.post('/danger-zone', authenticate, (req, res) => {
  const { name, latitude, longitude, radius, alertLevel } = req.body;

  if (!name || !latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Name, latitude, and longitude are required'
    });
  }

  const result = createDangerZone(req.user.id, {
    name,
    latitude,
    longitude,
    radius,
    alertLevel
  });

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Get User's Geofences ──
router.get('/', authenticate, (req, res) => {
  const result = getUserGeofences(req.user.id);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Update Geofence ──
router.put('/:id', authenticate, (req, res) => {
  const { name, radius, notifyOnEnter, notifyOnExit, active } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (radius) updates.radius = radius;
  if (typeof notifyOnEnter === 'boolean') updates.notifyOnEnter = notifyOnEnter;
  if (typeof notifyOnExit === 'boolean') updates.notifyOnExit = notifyOnExit;
  if (typeof active === 'boolean') updates.active = active;

  const result = updateGeofence(req.params.id, req.user.id, updates);

  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

// ── Delete Geofence ──
router.delete('/:id', authenticate, (req, res) => {
  const result = deleteGeofence(req.params.id, req.user.id);

  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

// ── Check Geofence (with location) ──
router.post('/check', authenticate, async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const result = checkGeofence(req.user.id, latitude, longitude);

  if (result.success) {
    // Process any alerts
    if (result.alerts.length > 0) {
      await processGeofenceAlerts(req.user.id, result.alerts);
    }

    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Get Nearby Safe Zones ──
router.get('/nearby', authenticate, (req, res) => {
  const { latitude, longitude, radius } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const result = getNearbySafeZones(
    parseFloat(latitude),
    parseFloat(longitude),
    radius ? parseFloat(radius) : 5
  );

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Get Safe Zone Suggestions ──
router.get('/suggestions', authenticate, (req, res) => {
  const result = suggestSafeZones(req.user.id);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

module.exports = router;
