// ═══════════════════════════════════════════
// SHIELD — Live Location Tracking Routes
// ═══════════════════════════════════════════
// POST /api/location/update   — Push location update
// GET  /api/location/latest   — Get user's latest location
// GET  /api/location/track/:userId — Track a user (for contacts)

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { findMany, findOne, insertOne } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── Push Location Update ──
router.post('/update', authenticate, (req, res) => {
  const { latitude, longitude, accuracy, speed, battery } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required.'
    });
  }

  const locationEntry = {
    id: uuidv4(),
    userId: req.user.id,
    latitude,
    longitude,
    accuracy: accuracy || null,
    speed: speed || null,
    battery: battery || null,
    mapsLink: `https://maps.google.com/?q=${latitude},${longitude}`,
    timestamp: new Date().toISOString()
  };

  insertOne('locations', locationEntry);

  // If there's an active SOS, update the alert too
  const { updateOne } = require('../utils/db');
  const activeAlert = findOne('sos_alerts',
    a => a.userId === req.user.id && a.status === 'active'
  );

  if (activeAlert) {
    updateOne('sos_alerts',
      a => a.id === activeAlert.id,
      {
        lastLatitude: latitude,
        lastLongitude: longitude,
        locationLink: locationEntry.mapsLink,
        lastUpdated: new Date().toISOString(),
        updateCount: (activeAlert.updateCount || 1) + 1
      }
    );
  }

  res.json({
    success: true,
    message: '📍 Location updated.',
    location: {
      latitude,
      longitude,
      mapsLink: locationEntry.mapsLink,
      sosActive: !!activeAlert,
      timestamp: locationEntry.timestamp
    }
  });
});

// ── Get Latest Location ──
router.get('/latest', authenticate, (req, res) => {
  const locations = findMany('locations', l => l.userId === req.user.id);

  if (locations.length === 0) {
    return res.json({
      success: true,
      message: 'No location data available.',
      location: null
    });
  }

  // Get the most recent
  locations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const latest = locations[0];

  res.json({
    success: true,
    location: {
      latitude: latest.latitude,
      longitude: latest.longitude,
      mapsLink: latest.mapsLink,
      battery: latest.battery,
      timestamp: latest.timestamp
    }
  });
});

// ── Track User (for trusted contacts) ──
router.get('/track/:userId', (req, res) => {
  const { userId } = req.params;
  const { token } = req.query;

  // In production, validate the tracking token
  // For demo, we allow tracking if there's an active SOS
  const activeAlert = findOne('sos_alerts',
    a => a.userId === userId && a.status === 'active'
  );

  if (!activeAlert) {
    return res.status(403).json({
      success: false,
      message: 'No active SOS for this user. Tracking unavailable.'
    });
  }

  const locations = findMany('locations', l => l.userId === userId);
  locations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recent = locations.slice(0, 20); // Last 20 location points

  res.json({
    success: true,
    userName: activeAlert.userName,
    status: 'active',
    currentLocation: {
      latitude: activeAlert.lastLatitude,
      longitude: activeAlert.lastLongitude,
      mapsLink: activeAlert.locationLink
    },
    triggeredAt: activeAlert.triggeredAt,
    locationHistory: recent.map(l => ({
      latitude: l.latitude,
      longitude: l.longitude,
      timestamp: l.timestamp
    }))
  });
});

module.exports = router;
