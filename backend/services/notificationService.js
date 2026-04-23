// ═══════════════════════════════════════════
// SHIELD — Notification Service
// ═══════════════════════════════════════════
// Handles all notification types: SMS, Email, Push

const { sendSMS, sendSOSAlert, sendSafeNotification } = require('../utils/sms');
const { findOne, findMany } = require('../utils/db');

/**
 * Send SOS notification to all trusted contacts
 */
async function sendSOSNotification(userId, alertData) {
  try {
    // Get user details
    const user = findOne('users', u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get trusted contacts
    const contacts = findMany('contacts', c => c.userId === userId);
    if (contacts.length === 0) {
      return {
        success: false,
        message: 'No trusted contacts found'
      };
    }

    // Prepare location link
    const locationLink = alertData.latitude && alertData.longitude
      ? `https://maps.google.com/?q=${alertData.latitude},${alertData.longitude}`
      : 'GPS unavailable';

    // Send SMS to all contacts
    const smsResult = await sendSOSAlert(user.name, locationLink, contacts);

    // Send email notifications (if configured)
    const emailResult = await sendSOSEmails(user, contacts, alertData);

    // Send push notifications (if configured)
    const pushResult = await sendSOSPushNotifications(user, contacts, alertData);

    // Log notification
    console.log(`📢 SOS Notifications sent for ${user.name}`);
    console.log(`   SMS: ${smsResult.successCount}/${smsResult.totalContacts}`);
    console.log(`   Email: ${emailResult.successCount}/${emailResult.totalContacts}`);
    console.log(`   Push: ${pushResult.successCount}/${pushResult.totalContacts}`);

    return {
      success: true,
      sms: smsResult,
      email: emailResult,
      push: pushResult,
      totalNotifications: smsResult.successCount + emailResult.successCount + pushResult.successCount
    };
  } catch (error) {
    console.error('Notification Service Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send "I'm Safe" notification
 */
async function sendSafeStatusNotification(userId) {
  try {
    const user = findOne('users', u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const contacts = findMany('contacts', c => c.userId === userId);
    if (contacts.length === 0) {
      return { success: false, message: 'No contacts found' };
    }

    // Send SMS
    const smsResult = await sendSafeNotification(user.name, contacts);

    // Send email
    const emailResult = await sendSafeEmails(user, contacts);

    // Send push
    const pushResult = await sendSafePushNotifications(user, contacts);

    console.log(`✅ Safe notifications sent for ${user.name}`);

    return {
      success: true,
      sms: smsResult,
      email: emailResult,
      push: pushResult
    };
  } catch (error) {
    console.error('Safe Notification Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send location update notification
 */
async function sendLocationUpdateNotification(userId, locationData) {
  try {
    const user = findOne('users', u => u.id === userId);
    const contacts = findMany('contacts', c => c.userId === userId);

    // Only send if there's an active SOS
    const activeAlert = findOne('sos_alerts', 
      a => a.userId === userId && a.status === 'active'
    );

    if (!activeAlert) {
      return { success: false, message: 'No active SOS' };
    }

    const locationLink = `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}`;
    const message = `📍 Location Update: ${user.name} is now at ${locationLink}. Battery: ${locationData.battery || 'Unknown'}%`;

    // Send to high-priority contacts only
    const priorityContacts = contacts.filter(c => c.priority === 1);

    const results = [];
    for (const contact of priorityContacts) {
      const result = await sendSMS(contact.phone, message);
      results.push(result);
    }

    return {
      success: true,
      notificationsSent: results.filter(r => r.success).length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send email notifications for SOS
 */
async function sendSOSEmails(user, contacts, alertData) {
  // Email service integration would go here
  // Using SendGrid, AWS SES, or SMTP
  
  const emailsWithEmail = contacts.filter(c => c.email);
  
  if (emailsWithEmail.length === 0) {
    return { successCount: 0, totalContacts: 0, results: [] };
  }

  // Demo mode - log to console
  console.log('📧 Email Notifications (Demo):');
  emailsWithEmail.forEach(contact => {
    console.log(`   To: ${contact.email || contact.name}`);
    console.log(`   Subject: 🚨 EMERGENCY: ${user.name} needs help!`);
  });

  return {
    successCount: emailsWithEmail.length,
    totalContacts: emailsWithEmail.length,
    results: emailsWithEmail.map(c => ({ email: c.email, success: true }))
  };
}

/**
 * Send safe status emails
 */
async function sendSafeEmails(user, contacts) {
  const emailsWithEmail = contacts.filter(c => c.email);
  
  console.log('📧 Safe Status Emails (Demo):');
  emailsWithEmail.forEach(contact => {
    console.log(`   To: ${contact.email || contact.name}`);
    console.log(`   Subject: ✅ ${user.name} is now SAFE`);
  });

  return {
    successCount: emailsWithEmail.length,
    totalContacts: emailsWithEmail.length
  };
}

/**
 * Send push notifications for SOS
 */
async function sendSOSPushNotifications(user, contacts, alertData) {
  // Firebase Cloud Messaging integration would go here
  
  console.log('📱 Push Notifications (Demo):');
  console.log(`   Title: 🚨 EMERGENCY ALERT`);
  console.log(`   Body: ${user.name} needs help immediately!`);
  console.log(`   Recipients: ${contacts.length} contacts`);

  return {
    successCount: contacts.length,
    totalContacts: contacts.length
  };
}

/**
 * Send safe status push notifications
 */
async function sendSafePushNotifications(user, contacts) {
  console.log('📱 Safe Status Push (Demo):');
  console.log(`   Title: ✅ All Clear`);
  console.log(`   Body: ${user.name} is now safe`);

  return {
    successCount: contacts.length,
    totalContacts: contacts.length
  };
}

/**
 * Send scheduled check-in reminder
 */
async function sendCheckInReminder(userId) {
  try {
    const user = findOne('users', u => u.id === userId);
    if (!user) return { success: false };

    const message = `🛡️ SHIELD Check-In: Please confirm you're safe. Reply SAFE or open the app.`;
    
    // Send to user's own phone
    const result = await sendSMS(user.phone, message);

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send family member alert
 */
async function sendFamilyAlert(familyId, alertingMember, alertData) {
  try {
    const family = findOne('families', f => f.id === familyId);
    if (!family) return { success: false };

    // Get all family members except the one triggering alert
    const otherMembers = family.members.filter(m => m.userId !== alertingMember.userId);

    const message = `🚨 FAMILY ALERT: ${alertingMember.name} has triggered an SOS. ` +
      `Location: ${alertData.locationLink || 'Unknown'}. Check SHIELD app for details.`;

    const results = [];
    for (const member of otherMembers) {
      const memberUser = findOne('users', u => u.id === member.userId);
      if (memberUser) {
        const result = await sendSMS(memberUser.phone, message);
        results.push(result);
      }
    }

    return {
      success: true,
      notificationsSent: results.filter(r => r.success).length,
      totalMembers: otherMembers.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send evidence ready notification
 */
async function sendEvidenceReadyNotification(userId, evidenceData) {
  try {
    const user = findOne('users', u => u.id === userId);
    const contacts = findMany('contacts', c => c.userId === userId);

    const message = `🎥 SHIELD Evidence: Recording completed for ${user.name}. ` +
      `Duration: ${Math.floor(evidenceData.durationSeconds / 60)} minutes. ` +
      `Access link sent separately.`;

    const results = [];
    for (const contact of contacts) {
      const result = await sendSMS(contact.phone, message);
      results.push(result);
    }

    return {
      success: true,
      notificationsSent: results.filter(r => r.success).length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendSOSNotification,
  sendSafeStatusNotification,
  sendLocationUpdateNotification,
  sendCheckInReminder,
  sendFamilyAlert,
  sendEvidenceReadyNotification
};
