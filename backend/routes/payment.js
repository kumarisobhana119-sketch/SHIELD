// ═══════════════════════════════════════════
// SHIELD — Payment Routes
// ═══════════════════════════════════════════

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createSubscriptionOrder,
  verifyPayment,
  getUserSubscription,
  cancelSubscription,
  getPaymentHistory,
  getPricing
} = require('../services/paymentService');

const router = express.Router();

// ── Get Pricing Information ──
router.get('/pricing', (req, res) => {
  const result = getPricing();
  res.json(result);
});

// ── Create Subscription Order ──
router.post('/subscribe', authenticate, (req, res) => {
  const { plan, billingCycle } = req.body;

  if (!plan || !billingCycle) {
    return res.status(400).json({
      success: false,
      message: 'Plan and billing cycle are required'
    });
  }

  const result = createSubscriptionOrder(req.user.id, plan, billingCycle);

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

// ── Verify Payment ──
router.post('/verify', authenticate, (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Order ID is required'
    });
  }

  const result = verifyPayment(orderId, {
    paymentId,
    signature
  });

  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// ── Get User's Subscription ──
router.get('/subscription', authenticate, (req, res) => {
  const result = getUserSubscription(req.user.id);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// ── Cancel Subscription ──
router.post('/subscription/cancel', authenticate, (req, res) => {
  const result = cancelSubscription(req.user.id);

  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
});

// ── Get Payment History ──
router.get('/history', authenticate, (req, res) => {
  const result = getPaymentHistory(req.user.id);

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

module.exports = router;
