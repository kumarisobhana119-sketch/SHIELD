// ═══════════════════════════════════════════
// SHIELD — Payment Service
// ═══════════════════════════════════════════
// Handle subscriptions, payments, and billing

const { findOne, findMany, insertOne, updateOne } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

// Payment provider configuration
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'demo'; // razorpay | stripe | demo
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// Pricing (in INR)
const PRICING = {
  premium: {
    monthly: 99,
    yearly: 799,
    currency: 'INR'
  },
  family: {
    monthly: 199,
    yearly: 1499,
    currency: 'INR'
  }
};

/**
 * Create subscription order
 */
function createSubscriptionOrder(userId, plan, billingCycle) {
  try {
    const user = findOne('users', u => u.id === userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Validate plan and billing cycle
    if (!['premium', 'family'].includes(plan)) {
      return { success: false, message: 'Invalid plan' };
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return { success: false, message: 'Invalid billing cycle' };
    }

    const amount = PRICING[plan][billingCycle];

    const order = {
      id: uuidv4(),
      userId,
      plan,
      billingCycle,
      amount,
      currency: 'INR',
      status: 'pending', // pending | completed | failed | cancelled
      paymentProvider: PAYMENT_PROVIDER,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    };

    insertOne('payment_orders', order);

    // In production, create order with payment gateway
    if (PAYMENT_PROVIDER === 'razorpay') {
      // Razorpay integration would go here
      order.razorpayOrderId = 'order_' + Date.now();
    } else if (PAYMENT_PROVIDER === 'stripe') {
      // Stripe integration would go here
      order.stripeSessionId = 'cs_' + Date.now();
    }

    return {
      success: true,
      order: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: order.plan,
        billingCycle: order.billingCycle,
        razorpayOrderId: order.razorpayOrderId,
        stripeSessionId: order.stripeSessionId
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Verify payment and activate subscription
 */
function verifyPayment(orderId, paymentData) {
  try {
    const order = findOne('payment_orders', o => o.id === orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    if (order.status !== 'pending') {
      return { success: false, message: 'Order already processed' };
    }

    // In production, verify payment with gateway
    let paymentVerified = false;

    if (PAYMENT_PROVIDER === 'demo') {
      paymentVerified = true;
    } else if (PAYMENT_PROVIDER === 'razorpay') {
      // Verify Razorpay signature
      paymentVerified = verifyRazorpaySignature(paymentData);
    } else if (PAYMENT_PROVIDER === 'stripe') {
      // Verify Stripe webhook
      paymentVerified = verifyStripePayment(paymentData);
    }

    if (!paymentVerified) {
      updateOne('payment_orders', o => o.id === orderId, {
        status: 'failed',
        failedAt: new Date().toISOString()
      });
      return { success: false, message: 'Payment verification failed' };
    }

    // Update order status
    updateOne('payment_orders', o => o.id === orderId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      paymentId: paymentData.paymentId || 'demo_' + Date.now()
    });

    // Activate subscription
    const subscription = activateSubscription(order.userId, order.plan, order.billingCycle);

    // Update user plan
    updateOne('users', u => u.id === order.userId, { plan: order.plan });

    console.log(`💳 Payment verified for user ${order.userId}: ${order.plan} (${order.billingCycle})`);

    return {
      success: true,
      message: '🎉 Payment successful! Your subscription is now active.',
      subscription
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Activate subscription
 */
function activateSubscription(userId, plan, billingCycle) {
  const now = new Date();
  const expiryDate = new Date(now);

  if (billingCycle === 'monthly') {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  } else if (billingCycle === 'yearly') {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }

  const subscription = {
    id: uuidv4(),
    userId,
    plan,
    billingCycle,
    status: 'active', // active | cancelled | expired
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    autoRenew: true,
    createdAt: now.toISOString()
  };

  insertOne('subscriptions', subscription);

  return subscription;
}

/**
 * Get user's subscription
 */
function getUserSubscription(userId) {
  try {
    const subscriptions = findMany('subscriptions', s => s.userId === userId);

    if (subscriptions.length === 0) {
      return {
        success: true,
        hasSubscription: false,
        message: 'No active subscription'
      };
    }

    // Get most recent active subscription
    const activeSubscription = subscriptions
      .filter(s => s.status === 'active')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (!activeSubscription) {
      return {
        success: true,
        hasSubscription: false,
        message: 'No active subscription'
      };
    }

    const daysUntilExpiry = Math.ceil(
      (new Date(activeSubscription.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    return {
      success: true,
      hasSubscription: true,
      subscription: {
        id: activeSubscription.id,
        plan: activeSubscription.plan,
        billingCycle: activeSubscription.billingCycle,
        status: activeSubscription.status,
        startDate: activeSubscription.startDate,
        expiryDate: activeSubscription.expiryDate,
        daysUntilExpiry,
        autoRenew: activeSubscription.autoRenew
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancel subscription
 */
function cancelSubscription(userId) {
  try {
    const subscriptions = findMany('subscriptions', 
      s => s.userId === userId && s.status === 'active'
    );

    if (subscriptions.length === 0) {
      return { success: false, message: 'No active subscription found' };
    }

    const subscription = subscriptions[0];

    updateOne('subscriptions', s => s.id === subscription.id, {
      status: 'cancelled',
      autoRenew: false,
      cancelledAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Subscription cancelled. You can continue using premium features until expiry.',
      expiryDate: subscription.expiryDate
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Process subscription renewals (run daily)
 */
function processSubscriptionRenewals() {
  try {
    const now = new Date();
    const subscriptions = findMany('subscriptions', 
      s => s.status === 'active' && s.autoRenew
    );

    let renewalsProcessed = 0;
    let renewalsFailed = 0;

    for (const subscription of subscriptions) {
      const expiryDate = new Date(subscription.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      // Attempt renewal 3 days before expiry
      if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
        const renewed = attemptRenewal(subscription);
        if (renewed) {
          renewalsProcessed++;
        } else {
          renewalsFailed++;
        }
      }

      // Expire subscription if past expiry date
      if (expiryDate < now) {
        updateOne('subscriptions', s => s.id === subscription.id, {
          status: 'expired',
          expiredAt: now.toISOString()
        });

        // Downgrade user to free plan
        updateOne('users', u => u.id === subscription.userId, { plan: 'free' });

        console.log(`⏰ Subscription expired for user ${subscription.userId}`);
      }
    }

    if (renewalsProcessed > 0 || renewalsFailed > 0) {
      console.log(`💳 Renewals: ${renewalsProcessed} successful, ${renewalsFailed} failed`);
    }

    return {
      success: true,
      renewalsProcessed,
      renewalsFailed
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Attempt to renew subscription
 */
function attemptRenewal(subscription) {
  try {
    // In production, charge payment method on file
    // For demo, auto-renew
    if (PAYMENT_PROVIDER === 'demo') {
      const newExpiryDate = new Date(subscription.expiryDate);
      if (subscription.billingCycle === 'monthly') {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      } else {
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      }

      updateOne('subscriptions', s => s.id === subscription.id, {
        expiryDate: newExpiryDate.toISOString(),
        lastRenewed: new Date().toISOString()
      });

      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get payment history
 */
function getPaymentHistory(userId) {
  try {
    const orders = findMany('payment_orders', o => o.userId === userId);

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      success: true,
      payments: orders.map(o => ({
        orderId: o.id,
        plan: o.plan,
        billingCycle: o.billingCycle,
        amount: o.amount,
        currency: o.currency,
        status: o.status,
        createdAt: o.createdAt,
        completedAt: o.completedAt
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Verify Razorpay signature (placeholder)
 */
function verifyRazorpaySignature(paymentData) {
  // In production, verify using Razorpay SDK
  // const crypto = require('crypto');
  // const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
  // hmac.update(paymentData.orderId + '|' + paymentData.paymentId);
  // const generatedSignature = hmac.digest('hex');
  // return generatedSignature === paymentData.signature;
  
  return true; // Demo mode
}

/**
 * Verify Stripe payment (placeholder)
 */
function verifyStripePayment(paymentData) {
  // In production, verify using Stripe SDK
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const session = await stripe.checkout.sessions.retrieve(paymentData.sessionId);
  // return session.payment_status === 'paid';
  
  return true; // Demo mode
}

/**
 * Get pricing information
 */
function getPricing() {
  return {
    success: true,
    pricing: {
      free: {
        price: 0,
        currency: 'INR',
        features: [
          '2 trusted contacts',
          'Basic SOS trigger',
          'Offline SMS alerts',
          '110dB alarm',
          'Location sharing (30s updates)'
        ]
      },
      premium: {
        monthly: PRICING.premium.monthly,
        yearly: PRICING.premium.yearly,
        currency: PRICING.premium.currency,
        yearlyDiscount: Math.round((1 - (PRICING.premium.yearly / (PRICING.premium.monthly * 12))) * 100),
        features: [
          '5 trusted contacts',
          'Auto evidence recording',
          'Cloud storage',
          'Location updates (10s)',
          'Auto re-alert',
          'Route safety check',
          'Full AI assistant 24/7'
        ]
      },
      family: {
        monthly: PRICING.family.monthly,
        yearly: PRICING.family.yearly,
        currency: PRICING.family.currency,
        yearlyDiscount: Math.round((1 - (PRICING.family.yearly / (PRICING.family.monthly * 12))) * 100),
        features: [
          '5 family members',
          '10 contacts per member',
          'Family dashboard',
          'Group SOS alerts',
          'Child & senior safety modes',
          'Extended cloud storage (2 hours)',
          'Priority support'
        ]
      }
    }
  };
}

module.exports = {
  createSubscriptionOrder,
  verifyPayment,
  getUserSubscription,
  cancelSubscription,
  processSubscriptionRenewals,
  getPaymentHistory,
  getPricing
};
