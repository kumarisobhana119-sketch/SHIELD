# 🛡️ SHIELD Services Documentation

Complete documentation for all backend services.

---

## 📋 Table of Contents

1. [Notification Service](#notification-service)
2. [Analytics Service](#analytics-service)
3. [Scheduler Service](#scheduler-service)
4. [Geofence Service](#geofence-service)
5. [Payment Service](#payment-service)

---

## 🔔 Notification Service

**File:** `services/notificationService.js`

Handles all types of notifications: SMS, Email, and Push notifications.

### Functions

#### `sendSOSNotification(userId, alertData)`
Sends SOS alerts to all trusted contacts via SMS, email, and push.

**Parameters:**
- `userId` — User ID triggering SOS
- `alertData` — Alert details (latitude, longitude, etc.)

**Returns:**
```javascript
{
  success: true,
  sms: { successCount: 2, totalContacts: 2 },
  email: { successCount: 2, totalContacts: 2 },
  push: { successCount: 2, totalContacts: 2 },
  totalNotifications: 6
}
```

#### `sendSafeStatusNotification(userId)`
Notifies contacts that user is safe.

#### `sendLocationUpdateNotification(userId, locationData)`
Sends location updates during active SOS (to priority contacts only).

#### `sendCheckInReminder(userId)`
Sends scheduled check-in reminder to user.

#### `sendFamilyAlert(familyId, alertingMember, alertData)`
Alerts all family members when one triggers SOS.

#### `sendEvidenceReadyNotification(userId, evidenceData)`
Notifies contacts when evidence recording is complete.

### Usage Example

```javascript
const { sendSOSNotification } = require('./services/notificationService');

const result = await sendSOSNotification(userId, {
  latitude: 28.6139,
  longitude: 77.2090,
  triggerMethod: 'shake'
});

console.log(`Notifications sent: ${result.totalNotifications}`);
```

---

## 📊 Analytics Service

**File:** `services/analyticsService.js`

Tracks usage, generates insights, and calculates safety scores.

### Functions

#### `trackEvent(userId, eventType, eventData)`
Track any user event for analytics.

**Event Types:**
- `sos_triggered`
- `location_updated`
- `contact_added`
- `plan_upgraded`
- `ai_chat`
- `check_in_scheduled`

**Example:**
```javascript
trackEvent(userId, 'sos_triggered', {
  triggerMethod: 'shake',
  latitude: 28.6139,
  longitude: 77.2090
});
```

#### `getUserStats(userId)`
Get comprehensive user statistics.

**Returns:**
```javascript
{
  success: true,
  stats: {
    totalSOSAlerts: 5,
    activeAlerts: 0,
    resolvedAlerts: 5,
    totalLocationUpdates: 150,
    totalContacts: 3,
    avgResponseTimeSeconds: 180,
    alertsLast30Days: 2,
    lastAlertDate: "2026-04-21T10:30:00.000Z"
  }
}
```

#### `getSystemAnalytics()`
Get system-wide analytics (admin only).

**Returns:**
```javascript
{
  success: true,
  analytics: {
    users: {
      total: 1000,
      planDistribution: { free: 700, premium: 250, family: 50 },
      newUsersLast7Days: 50
    },
    sosAlerts: {
      total: 500,
      active: 5,
      resolved: 495,
      today: 10,
      last7Days: 50,
      last30Days: 200,
      triggerMethods: { shake: 300, voice: 100, manual: 100 },
      avgResponseTimeSeconds: 240
    },
    locations: {
      totalUpdates: 50000,
      updatesLast24Hours: 2000
    },
    families: {
      total: 50,
      totalMembers: 200
    }
  }
}
```

#### `calculateSafetyScore(userId)`
Calculate user's safety score (0-100).

**Scoring Factors:**
- Has trusted contacts (30 points)
- Premium/Family plan (20 points)
- Location sharing enabled (15 points)
- SOS tested (10 points)
- Quick response time (15 points)
- Active user (10 points)

**Returns:**
```javascript
{
  success: true,
  safetyScore: {
    score: 85,
    maxScore: 100,
    rating: "Excellent",
    factors: [
      { factor: "Has trusted contacts", points: 30 },
      { factor: "Premium features enabled", points: 20 }
    ],
    recommendations: [
      {
        priority: "medium",
        message: "Test your SOS trigger to ensure it works",
        action: "test_sos"
      }
    ]
  }
}
```

#### `getAlertHeatmap()`
Get hourly distribution of alerts (0-23 hours).

#### `getGeographicDistribution()`
Get geographic locations of all alerts.

#### `getEngagementMetrics(userId)`
Get user engagement statistics.

---

## ⏰ Scheduler Service

**File:** `services/schedulerService.js`

Handles scheduled tasks, check-ins, and auto-alerts.

### Functions

#### `scheduleCheckIn(userId, checkInTime, destination)`
Schedule a safety check-in.

**Parameters:**
- `userId` — User ID
- `checkInTime` — ISO timestamp when user should check in
- `destination` — Optional destination name

**Example:**
```javascript
const checkIn = scheduleCheckIn(userId, '2026-04-21T20:00:00.000Z', 'Home');
```

#### `completeCheckIn(checkInId, userId)`
Mark check-in as completed.

#### `cancelCheckIn(checkInId, userId)`
Cancel a scheduled check-in.

#### `getUserCheckIns(userId)`
Get all user's check-ins.

#### `processPendingCheckIns()`
Process all pending check-ins (runs every minute).

**Actions:**
- Send reminder 15 minutes before
- Trigger auto-alert if 10 minutes past scheduled time

#### `processAutoReAlerts()`
Re-send alerts for unresolved SOS (runs every 2 minutes).

**Behavior:**
- Re-alerts every 10 minutes if no location update
- Includes time since original alert

#### `cleanupOldData()`
Clean up old data (runs daily at 2 AM).

**Cleanup:**
- Check-ins older than 30 days
- Analytics events older than 90 days

#### `startScheduler()`
Start all scheduled tasks. **Call this when server starts.**

**Example:**
```javascript
const { startScheduler } = require('./services/schedulerService');
startScheduler();
```

### Auto-Alert Behavior

When a user misses a scheduled check-in:
1. Check-in marked as "missed"
2. Auto-triggered SOS alert created
3. All contacts notified via SMS
4. Message includes: missed time, destination (if provided)

---

## 📍 Geofence Service

**File:** `services/geofenceService.js`

Manage safe zones, danger zones, and location-based alerts.

### Functions

#### `createSafeZone(userId, zoneData)`
Create a safe zone.

**Parameters:**
```javascript
{
  name: "Home",
  latitude: 28.6139,
  longitude: 77.2090,
  radius: 500, // meters
  notifyOnEnter: true,
  notifyOnExit: true
}
```

#### `createDangerZone(userId, zoneData)`
Create a danger zone (for child safety mode).

**Parameters:**
```javascript
{
  name: "Restricted Area",
  latitude: 28.6139,
  longitude: 77.2090,
  radius: 200,
  alertLevel: "high" // low | medium | high
}
```

#### `getUserGeofences(userId)`
Get all user's geofences.

#### `updateGeofence(geofenceId, userId, updates)`
Update geofence settings.

#### `deleteGeofence(geofenceId, userId)`
Delete a geofence.

#### `checkGeofence(userId, latitude, longitude)`
Check if location is within any geofences.

**Returns:**
```javascript
{
  success: true,
  results: [
    {
      geofenceId: "uuid",
      name: "Home",
      type: "safe",
      isInside: true,
      distance: 150,
      alertLevel: null
    }
  ],
  alerts: [
    {
      type: "enter",
      geofence: "Home",
      zoneType: "safe",
      alertLevel: null
    }
  ]
}
```

#### `processGeofenceAlerts(userId, alerts)`
Process and send geofence alerts.

**Alert Messages:**
- **Enter Safe Zone:** "✅ SHIELD: [Name] has entered safe zone 'Home'."
- **Exit Safe Zone:** "⚠️ SHIELD: [Name] has left safe zone 'Home'."
- **Enter Danger Zone:** "⚠️ SHIELD ALERT: [Name] has entered danger zone 'Restricted Area'! Alert Level: HIGH."

#### `getNearbySafeZones(latitude, longitude, radiusKm)`
Find nearby safe zones (for recommendations).

#### `suggestSafeZones(userId)`
Suggest safe zones based on user's frequent locations.

**Uses clustering algorithm to identify:**
- Frequent visit locations
- Suggested radius based on visit patterns
- Top 5 suggestions

### Distance Calculation

Uses Haversine formula for accurate distance calculation:
```javascript
const distance = calculateDistance(lat1, lon1, lat2, lon2);
// Returns distance in meters
```

---

## 💳 Payment Service

**File:** `services/paymentService.js`

Handle subscriptions, payments, and billing.

### Pricing

```javascript
{
  premium: {
    monthly: 99,   // INR
    yearly: 799    // INR (33% discount)
  },
  family: {
    monthly: 199,  // INR
    yearly: 1499   // INR (37% discount)
  }
}
```

### Functions

#### `createSubscriptionOrder(userId, plan, billingCycle)`
Create a subscription order.

**Parameters:**
- `plan` — "premium" or "family"
- `billingCycle` — "monthly" or "yearly"

**Returns:**
```javascript
{
  success: true,
  order: {
    orderId: "uuid",
    amount: 99,
    currency: "INR",
    plan: "premium",
    billingCycle: "monthly",
    razorpayOrderId: "order_123456", // if using Razorpay
    stripeSessionId: "cs_123456"     // if using Stripe
  }
}
```

#### `verifyPayment(orderId, paymentData)`
Verify payment and activate subscription.

**Payment Data:**
```javascript
{
  paymentId: "pay_123456",
  signature: "abc123..." // for Razorpay
}
```

**On Success:**
- Order marked as completed
- Subscription activated
- User plan upgraded
- Expiry date set (1 month or 1 year)

#### `getUserSubscription(userId)`
Get user's active subscription.

**Returns:**
```javascript
{
  success: true,
  hasSubscription: true,
  subscription: {
    id: "uuid",
    plan: "premium",
    billingCycle: "monthly",
    status: "active",
    startDate: "2026-04-21T10:00:00.000Z",
    expiryDate: "2026-05-21T10:00:00.000Z",
    daysUntilExpiry: 30,
    autoRenew: true
  }
}
```

#### `cancelSubscription(userId)`
Cancel auto-renewal (user keeps access until expiry).

#### `processSubscriptionRenewals()`
Process subscription renewals (runs daily).

**Behavior:**
- Attempts renewal 3 days before expiry
- Expires subscriptions past expiry date
- Downgrades users to free plan on expiry

#### `getPaymentHistory(userId)`
Get user's payment history.

#### `getPricing()`
Get pricing information for all plans.

### Payment Provider Integration

**Supported Providers:**
- **Razorpay** (India) — Set `PAYMENT_PROVIDER=razorpay`
- **Stripe** (International) — Set `PAYMENT_PROVIDER=stripe`
- **Demo Mode** — Set `PAYMENT_PROVIDER=demo`

**Environment Variables:**
```env
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

---

## 🔗 Service Integration

### In SOS Route

```javascript
const { sendSOSNotification } = require('../services/notificationService');
const { trackEvent } = require('../services/analyticsService');

// Trigger SOS
router.post('/trigger', authenticate, async (req, res) => {
  // ... create alert ...
  
  // Send notifications
  await sendSOSNotification(req.user.id, alertData);
  
  // Track event
  trackEvent(req.user.id, 'sos_triggered', alertData);
  
  res.json({ success: true, alert });
});
```

### In Location Route

```javascript
const { checkGeofence, processGeofenceAlerts } = require('../services/geofenceService');

// Update location
router.post('/update', authenticate, async (req, res) => {
  // ... save location ...
  
  // Check geofences
  const geofenceResult = checkGeofence(req.user.id, latitude, longitude);
  
  // Process alerts
  if (geofenceResult.alerts.length > 0) {
    await processGeofenceAlerts(req.user.id, geofenceResult.alerts);
  }
  
  res.json({ success: true, location, geofenceResult });
});
```

### In Server Startup

```javascript
const { startScheduler } = require('./services/schedulerService');

app.listen(PORT, () => {
  console.log('Server started');
  
  // Start scheduler
  startScheduler();
});
```

---

## 📊 Database Collections Used

### Services create/use these collections:

1. **analytics_events** — Event tracking
2. **scheduled_checkins** — Check-in schedules
3. **geofences** — Safe/danger zones
4. **geofence_states** — Zone entry/exit tracking
5. **payment_orders** — Payment orders
6. **subscriptions** — Active subscriptions

---

## 🧪 Testing Services

### Test Notification Service
```bash
curl -X POST http://localhost:3000/api/sos/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude":28.6139,"longitude":77.2090,"triggerMethod":"manual"}'

# Check console for SMS demo logs
```

### Test Analytics Service
```bash
curl http://localhost:3000/api/analytics/stats \
  -H "Authorization: Bearer $TOKEN"

curl http://localhost:3000/api/analytics/safety-score \
  -H "Authorization: Bearer $TOKEN"
```

### Test Scheduler Service
```bash
# Schedule check-in
curl -X POST http://localhost:3000/api/checkin/schedule \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"checkInTime":"2026-04-21T20:00:00.000Z","destination":"Home"}'

# Get check-ins
curl http://localhost:3000/api/checkin \
  -H "Authorization: Bearer $TOKEN"
```

### Test Geofence Service
```bash
# Create safe zone
curl -X POST http://localhost:3000/api/geofence/safe-zone \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Home","latitude":28.6139,"longitude":77.2090,"radius":500}'

# Check geofence
curl -X POST http://localhost:3000/api/geofence/check \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude":28.6139,"longitude":77.2090}'
```

### Test Payment Service
```bash
# Get pricing
curl http://localhost:3000/api/payment/pricing

# Create subscription order
curl -X POST http://localhost:3000/api/payment/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"premium","billingCycle":"monthly"}'
```

---

## 🔧 Configuration

### Environment Variables

```env
# SMS Provider (for notifications)
SMS_PROVIDER=demo
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token

# Payment Provider
PAYMENT_PROVIDER=demo
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret
```

---

## 📈 Performance Considerations

### Scheduler Service
- Runs background tasks every 1-2 minutes
- Minimal CPU usage
- Processes only pending items

### Geofence Service
- Distance calculations are fast (Haversine formula)
- Clustering algorithm runs only on-demand
- State tracking prevents duplicate alerts

### Analytics Service
- Event tracking is async
- Statistics calculated on-demand
- Consider caching for high-traffic scenarios

### Notification Service
- SMS/Email sent asynchronously
- Batch processing for multiple contacts
- Retry logic for failed sends (in production)

---

**🛡️ SHIELD Services — Complete and Production-Ready!**

*Because safety should not wait.* 💜
