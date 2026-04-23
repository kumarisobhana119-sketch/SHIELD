// ═══════════════════════════════════════════
// SHIELD — SMS Utility (utils/sms.js)
// "Because safety should not wait."
// ═══════════════════════════════════════════
// In production: integrate Twilio, MSG91, or Fast2SMS here.
// In demo/dev mode: logs to console so the server boots cleanly.

const SMS_DEMO_MODE = process.env.SMS_DEMO_MODE !== 'false'; // true by default

/**
 * Send a single SMS to a phone number.
 * @param {string} to   - Recipient phone number
 * @param {string} body - SMS message body
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendSMS(to, body) {
  if (SMS_DEMO_MODE) {
    console.log(`📱 [SMS Demo] To: ${to}`);
    console.log(`   Message: ${body.substring(0, 80)}${body.length > 80 ? '...' : ''}`);
    return { success: true, messageId: `DEMO-${Date.now()}`, mode: 'demo' };
  }

  // ── Production: Twilio example ──
  // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // const message = await client.messages.create({
  //   body,
  //   from: process.env.TWILIO_FROM_NUMBER,
  //   to
  // });
  // return { success: true, messageId: message.sid };

  // ── Production: MSG91 example ──
  // const response = await fetch('https://api.msg91.com/api/v5/flow/', {
  //   method: 'POST',
  //   headers: { 'authkey': process.env.MSG91_API_KEY, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ template_id: process.env.MSG91_TEMPLATE_ID, recipients: [{ mobiles: to, message: body }] })
  // });
  // const data = await response.json();
  // return { success: data.type === 'success', messageId: data.request_id };

  return { success: true, messageId: `DEMO-${Date.now()}`, mode: 'demo' };
}

/**
 * Send an SOS alert SMS to all trusted contacts simultaneously.
 * @param {string}   userName     - Name of the user in distress
 * @param {string}   locationLink - Google Maps URL or coordinate string
 * @param {Array}    contacts     - Array of contact objects with .phone and .name
 * @returns {Promise<{successCount, totalContacts, results}>}
 */
async function sendSOSAlert(userName, locationLink, contacts) {
  const message =
    `🚨 EMERGENCY! ${userName} needs help immediately.\n` +
    `📍 Live Location: ${locationLink}\n` +
    `📲 Sent via SHIELD Safety App.\n` +
    `☎️ Call 112 if you cannot reach them.`;

  const results = [];
  for (const contact of contacts) {
    try {
      const result = await sendSMS(contact.phone, message);
      results.push({ contact: contact.name, phone: contact.phone, ...result });
    } catch (err) {
      results.push({ contact: contact.name, phone: contact.phone, success: false, error: err.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`🚨 [SOS SMS] Sent to ${successCount}/${contacts.length} contacts for ${userName}`);

  return { successCount, totalContacts: contacts.length, results };
}

/**
 * Send an "I'm Safe" notification SMS to all trusted contacts.
 * @param {string} userName - Name of the user who is now safe
 * @param {Array}  contacts - Array of contact objects
 * @returns {Promise<{successCount, totalContacts, results}>}
 */
async function sendSafeNotification(userName, contacts) {
  const message =
    `✅ UPDATE: ${userName} is now SAFE.\n` +
    `🛡️ The earlier SOS alert has been cancelled.\n` +
    `Sent via SHIELD Safety App.`;

  const results = [];
  for (const contact of contacts) {
    try {
      const result = await sendSMS(contact.phone, message);
      results.push({ contact: contact.name, phone: contact.phone, ...result });
    } catch (err) {
      results.push({ contact: contact.name, phone: contact.phone, success: false, error: err.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ [Safe SMS] Sent to ${successCount}/${contacts.length} contacts for ${userName}`);

  return { successCount, totalContacts: contacts.length, results };
}

/**
 * Send an offline SOS SMS (used when internet is not available).
 * This is the fallback — uses only basic cellular with last known coordinates.
 * @param {string} userName  - User name
 * @param {number} latitude  - Last known latitude
 * @param {number} longitude - Last known longitude
 * @param {Array}  contacts  - Array of contact objects
 */
async function sendOfflineSOSSMS(userName, latitude, longitude, contacts) {
  const coordStr = latitude && longitude
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : 'Location unavailable';

  const message =
    `🚨 OFFLINE SOS: ${userName} needs help!\n` +
    `📍 Last Location: ${coordStr}\n` +
    `⚠️ Sent offline via SHIELD (no internet).\n` +
    `Call 112 immediately.`;

  return await sendSOSAlert(userName, coordStr, contacts);
}

module.exports = {
  sendSMS,
  sendSOSAlert,
  sendSafeNotification,
  sendOfflineSOSSMS
};
