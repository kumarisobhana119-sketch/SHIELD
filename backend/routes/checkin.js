// ═══════════════════════════════════════════
// SHIELD — Check-In Routes
// ═══════════════════════════════════════════

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  scheduleCheckIn,
  completeCheckIn,
  cancelCheckIn,
  getUserCheckIns
} = require('../services/schedulerService');

const router = express.Router();

// ── Schedule Check-In ──
router.post('/schedule', authenticate, (req, res) => {
  const { checkInTime, destination } = req.body;

  if (!checkInTime) {
    return res.status(400).json({
      success: false,
      message: 'Check-in time is required'
    });
  }

  const result = scheduleCheckIn(req.user.id, checkInTime, destination);

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Complete Check-In ──
router.post('/:id/complete', authenticate, (req, res) => {
  const result = completeCheckIn(req.params.id, req.user.id);

  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

// ── Cancel Check-In ──
router.delete('/:id', authenticate, (req, res) => {
  const result = cancelCheckIn(req.params.id, req.user.id);

  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

// ── Get User's Check-Ins ──
router.get('/', authenticate, (req, res) => {
  const result = getUserCheckIns(req.user.id);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

module.exports = router;
