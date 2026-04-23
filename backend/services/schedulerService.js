// ═══════════════════════════════════════════
// SHIELD — Scheduler Service
// ═══════════════════════════════════════════
// Handle scheduled tasks, check-ins, and auto-alerts

const { findMany, findOne, insertOne, updateOne } = require('../utils/db');
const { sendCheckInReminder } = require('./notificationService');
const { v4: uuidv4 } = require('uuid');

/**
 * Schedule a check-in for user
 */
function scheduleCheckIn(userId, checkInTime, destination) {
  try {
    const checkIn = {
      id: uuidv4(),
      userId,
      scheduledTime: checkInTime,
      destination: destination || null,
      status: 'scheduled', // scheduled | completed | missed | cancelled
      reminderSent: false,
      createdAt: new Date().toISOString()
    };

    insertOne('scheduled_checkins', checkIn);

    return {
      success: true,
      checkIn
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Complete a check-in
 */
function completeCheckIn(checkInId, userId) {
  try {
    const checkIn = updateOne('scheduled_checkins',
      c => c.id === checkInId && c.userId === userId,
      {
        status: 'completed',
        completedAt: new Date().toISOString()
      }
    );

    if (!checkIn) {
      return { success: false, message: 'Check-in not found' };
    }

    return {
      success: true,
      message: '✅ Check-in completed',
      checkIn
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a check-in
 */
function cancelCheckIn(checkInId, userId) {
  try {
    const checkIn = updateOne('scheduled_checkins',
      c => c.id === checkInId && c.userId === userId,
      {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      }
    );

    if (!checkIn) {
      return { success: false, message: 'Check-in not found' };
    }

    return {
      success: true,
      message: 'Check-in cancelled',
      checkIn
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Process pending check-ins (run periodically)
 */
async function processPendingCheckIns() {
  try {
    const now = new Date();
    const checkIns = findMany('scheduled_checkins', c => c.status === 'scheduled');

    let remindersProcessed = 0;
    let missedCheckIns = 0;

    for (const checkIn of checkIns) {
      const scheduledTime = new Date(checkIn.scheduledTime);
      const timeDiff = scheduledTime - now;

      // Send reminder 15 minutes before
      if (timeDiff > 0 && timeDiff <= 15 * 60 * 1000 && !checkIn.reminderSent) {
        await sendCheckInReminder(checkIn.userId);
        updateOne('scheduled_checkins', c => c.id === checkIn.id, { reminderSent: true });
        remindersProcessed++;
      }

      // Mark as missed if 10 minutes past scheduled time
      if (timeDiff < -10 * 60 * 1000) {
        updateOne('scheduled_checkins', c => c.id === checkIn.id, {
          status: 'missed',
          missedAt: new Date().toISOString()
        });

        // Trigger auto-alert
        await triggerMissedCheckInAlert(checkIn.userId, checkIn);
        missedCheckIns++;
      }
    }

    console.log(`⏰ Check-ins processed: ${remindersProcessed} reminders, ${missedCheckIns} missed`);

    return {
      success: true,
      remindersProcessed,
      missedCheckIns
    };
  } catch (error) {
    console.error('Check-in processing error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger alert for missed check-in
 */
async function triggerMissedCheckInAlert(userId, checkIn) {
  try {
    const user = findOne('users', u => u.id === userId);
    if (!user) return;

    // Create auto-triggered SOS alert
    const alert = {
      id: uuidv4(),
      userId,
      userName: user.name,
      status: 'active',
      triggerMethod: 'auto_checkin',
      latitude: null,
      longitude: null,
      lastLatitude: null,
      lastLongitude: null,
      locationLink: null,
      reason: `Missed scheduled check-in at ${checkIn.scheduledTime}`,
      destination: checkIn.destination,
      contactsNotified: [],
      evidenceRecording: false,
      alarmTriggered: false,
      smsBackupSent: true,
      updateCount: 0,
      triggeredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      resolvedAt: null
    };

    insertOne('sos_alerts', alert);

    // Notify contacts
    const contacts = findMany('contacts', c => c.userId === userId);
    const { sendSMS } = require('../utils/sms');

    const message = `⚠️ SHIELD AUTO-ALERT: ${user.name} missed their scheduled check-in at ` +
      `${new Date(checkIn.scheduledTime).toLocaleTimeString()}. ` +
      `${checkIn.destination ? `Destination: ${checkIn.destination}. ` : ''}` +
      `Please verify their safety.`;

    for (const contact of contacts) {
      await sendSMS(contact.phone, message);
    }

    console.log(`🚨 Auto-alert triggered for ${user.name} (missed check-in)`);

    return { success: true, alertId: alert.id };
  } catch (error) {
    console.error('Missed check-in alert error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's scheduled check-ins
 */
function getUserCheckIns(userId) {
  try {
    const checkIns = findMany('scheduled_checkins', c => c.userId === userId);

    // Sort by scheduled time
    checkIns.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

    return {
      success: true,
      checkIns: checkIns.map(c => ({
        id: c.id,
        scheduledTime: c.scheduledTime,
        destination: c.destination,
        status: c.status,
        reminderSent: c.reminderSent,
        completedAt: c.completedAt,
        missedAt: c.missedAt
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Process auto re-alerts for unresolved SOS
 */
async function processAutoReAlerts() {
  try {
    const activeAlerts = findMany('sos_alerts', a => a.status === 'active');
    let reAlertsProcessed = 0;

    for (const alert of activeAlerts) {
      const timeSinceTriggered = Date.now() - new Date(alert.triggeredAt).getTime();
      const timeSinceLastUpdate = Date.now() - new Date(alert.lastUpdated).getTime();

      // Re-alert every 10 minutes if no update
      if (timeSinceLastUpdate >= 10 * 60 * 1000) {
        await sendReAlert(alert);
        updateOne('sos_alerts', a => a.id === alert.id, {
          lastUpdated: new Date().toISOString(),
          reAlertCount: (alert.reAlertCount || 0) + 1
        });
        reAlertsProcessed++;
      }
    }

    if (reAlertsProcessed > 0) {
      console.log(`🔄 Re-alerts sent: ${reAlertsProcessed}`);
    }

    return {
      success: true,
      reAlertsProcessed
    };
  } catch (error) {
    console.error('Re-alert processing error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send re-alert for ongoing SOS
 */
async function sendReAlert(alert) {
  try {
    const contacts = findMany('contacts', c => c.userId === alert.userId);
    const { sendSMS } = require('../utils/sms');

    const timeSinceTriggered = Math.floor((Date.now() - new Date(alert.triggeredAt).getTime()) / 60000);

    const message = `🚨 SHIELD RE-ALERT: ${alert.userName} is still in emergency (${timeSinceTriggered} min). ` +
      `${alert.locationLink ? `Location: ${alert.locationLink}. ` : ''}` +
      `No update received. Please check on them immediately.`;

    for (const contact of contacts) {
      await sendSMS(contact.phone, message);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Clean up old data (run daily)
 */
function cleanupOldData() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Clean up old check-ins (30 days)
    const checkIns = findMany('scheduled_checkins', () => true);
    const oldCheckIns = checkIns.filter(c => new Date(c.createdAt) < thirtyDaysAgo);
    
    // Clean up old analytics events (90 days)
    const events = findMany('analytics_events', () => true);
    const oldEvents = events.filter(e => new Date(e.timestamp) < ninetyDaysAgo);

    console.log(`🧹 Cleanup: ${oldCheckIns.length} old check-ins, ${oldEvents.length} old events`);

    return {
      success: true,
      checkInsRemoved: oldCheckIns.length,
      eventsRemoved: oldEvents.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Start scheduler (call this when server starts)
 */
function startScheduler() {
  console.log('⏰ SHIELD Scheduler started');

  // Process check-ins every minute
  setInterval(processPendingCheckIns, 60 * 1000);

  // Process re-alerts every 2 minutes
  setInterval(processAutoReAlerts, 2 * 60 * 1000);

  // Cleanup old data daily at 2 AM
  const now = new Date();
  const tomorrow2AM = new Date(now);
  tomorrow2AM.setDate(tomorrow2AM.getDate() + 1);
  tomorrow2AM.setHours(2, 0, 0, 0);
  const msUntil2AM = tomorrow2AM - now;

  setTimeout(() => {
    cleanupOldData();
    setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // Then every 24 hours
  }, msUntil2AM);

  return { success: true, message: 'Scheduler started' };
}

module.exports = {
  scheduleCheckIn,
  completeCheckIn,
  cancelCheckIn,
  processPendingCheckIns,
  getUserCheckIns,
  processAutoReAlerts,
  cleanupOldData,
  startScheduler
};
