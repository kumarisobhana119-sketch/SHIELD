// ═══════════════════════════════════════════
// SHIELD — Analytics Routes
// ═══════════════════════════════════════════

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getUserStats,
  getSystemAnalytics,
  getAlertHeatmap,
  getGeographicDistribution,
  getEngagementMetrics,
  calculateSafetyScore
} = require('../services/analyticsService');

const router = express.Router();

// ── Get User Statistics ──
router.get('/stats', authenticate, (req, res) => {
  const result = getUserStats(req.user.id);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Get Safety Score ──
router.get('/safety-score', authenticate, (req, res) => {
  const result = calculateSafetyScore(req.user.id);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Get Engagement Metrics ──
router.get('/engagement', authenticate, (req, res) => {
  const result = getEngagementMetrics(req.user.id);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Get System Analytics (Admin only) ──
router.get('/system', authenticate, (req, res) => {
  // In production, check if user is admin
  // For demo, allow all users
  
  const result = getSystemAnalytics();
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Get Alert Heatmap ──
router.get('/heatmap', authenticate, (req, res) => {
  const result = getAlertHeatmap();
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Get Geographic Distribution ──
router.get('/geographic', authenticate, (req, res) => {
  const result = getGeographicDistribution();
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

module.exports = router;
