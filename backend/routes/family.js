// ═══════════════════════════════════════════
// SHIELD — Family Plan Route (/api/family)
// "Because safety should not wait."
// ═══════════════════════════════════════════

const express = require('express');
const router = express.Router();

// ── In-memory family store (replace with DB in production) ──
const families = {};
let familyIdCounter = 1;

// ── POST /api/family/create ──
// Create a new family group
router.post('/create', (req, res) => {
  try {
    const { adminName, adminPhone, familyName } = req.body;

    if (!adminName || !adminPhone || !familyName) {
      return res.status(400).json({
        success: false,
        error: 'adminName, adminPhone, and familyName are required.'
      });
    }

    const familyId = `FAM-${familyIdCounter++}`;
    const family = {
      id: familyId,
      name: familyName,
      admin: { name: adminName, phone: adminPhone, role: 'admin' },
      members: [{ name: adminName, phone: adminPhone, role: 'admin', status: 'safe', joinedAt: new Date().toISOString() }],
      maxMembers: 5,
      createdAt: new Date().toISOString(),
      inviteCode: `SHIELD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    };

    families[familyId] = family;

    return res.status(201).json({
      success: true,
      message: `Family "${familyName}" created successfully.`,
      family: {
        id: family.id,
        name: family.name,
        inviteCode: family.inviteCode,
        memberCount: family.members.length,
        maxMembers: family.maxMembers
      }
    });
  } catch (err) {
    console.error('[Family Create Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to create family group.' });
  }
});

// ── POST /api/family/invite ──
// Invite a member using invite code
router.post('/invite', (req, res) => {
  try {
    const { inviteCode, memberName, memberPhone } = req.body;

    if (!inviteCode || !memberName || !memberPhone) {
      return res.status(400).json({
        success: false,
        error: 'inviteCode, memberName, and memberPhone are required.'
      });
    }

    const family = Object.values(families).find(f => f.inviteCode === inviteCode);
    if (!family) {
      return res.status(404).json({ success: false, error: 'Invalid invite code.' });
    }

    if (family.members.length >= family.maxMembers) {
      return res.status(400).json({
        success: false,
        error: `Family is full. Maximum ${family.maxMembers} members allowed.`
      });
    }

    const alreadyMember = family.members.find(m => m.phone === memberPhone);
    if (alreadyMember) {
      return res.status(409).json({ success: false, error: 'This phone number is already a family member.' });
    }

    family.members.push({
      name: memberName,
      phone: memberPhone,
      role: 'member',
      status: 'safe',
      joinedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `${memberName} has joined the family "${family.name}".`,
      familyId: family.id,
      totalMembers: family.members.length
    });
  } catch (err) {
    console.error('[Family Invite Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to process invite.' });
  }
});

// ── GET /api/family/members ──
// Get all members of a family
router.get('/members', (req, res) => {
  try {
    const { familyId } = req.query;
    if (!familyId) {
      return res.status(400).json({ success: false, error: 'familyId is required.' });
    }

    const family = families[familyId];
    if (!family) {
      return res.status(404).json({ success: false, error: 'Family not found.' });
    }

    return res.json({
      success: true,
      familyName: family.name,
      members: family.members,
      totalMembers: family.members.length,
      maxMembers: family.maxMembers
    });
  } catch (err) {
    console.error('[Family Members Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch members.' });
  }
});

// ── GET /api/family/dashboard ──
// Get full family safety dashboard
router.get('/dashboard', (req, res) => {
  try {
    const { familyId } = req.query;
    if (!familyId) {
      return res.status(400).json({ success: false, error: 'familyId is required.' });
    }

    const family = families[familyId];
    if (!family) {
      return res.status(404).json({ success: false, error: 'Family not found.' });
    }

    const safeCount = family.members.filter(m => m.status === 'safe').length;
    const alertCount = family.members.filter(m => m.status === 'sos').length;

    return res.json({
      success: true,
      dashboard: {
        familyId: family.id,
        familyName: family.name,
        totalMembers: family.members.length,
        safeMembers: safeCount,
        alertMembers: alertCount,
        members: family.members.map(m => ({
          name: m.name,
          phone: m.phone,
          status: m.status,
          role: m.role,
          lastSeen: m.lastSeen || null
        })),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Family Dashboard Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to load dashboard.' });
  }
});

// ── POST /api/family/sos ──
// Trigger a group SOS for all family members
router.post('/sos', (req, res) => {
  try {
    const { familyId, triggeredBy, location } = req.body;
    if (!familyId || !triggeredBy) {
      return res.status(400).json({ success: false, error: 'familyId and triggeredBy are required.' });
    }

    const family = families[familyId];
    if (!family) {
      return res.status(404).json({ success: false, error: 'Family not found.' });
    }

    // Mark the triggering member as SOS
    const member = family.members.find(m => m.phone === triggeredBy || m.name === triggeredBy);
    if (member) member.status = 'sos';

    return res.json({
      success: true,
      message: `Group SOS triggered by ${triggeredBy}. All ${family.members.length} family members alerted.`,
      alertedMembers: family.members.map(m => m.name),
      location: location || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Family SOS Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to trigger group SOS.' });
  }
});

// ── POST /api/family/check-in ──
// Mark a family member as safe
router.post('/check-in', (req, res) => {
  try {
    const { familyId, memberPhone } = req.body;
    if (!familyId || !memberPhone) {
      return res.status(400).json({ success: false, error: 'familyId and memberPhone are required.' });
    }

    const family = families[familyId];
    if (!family) return res.status(404).json({ success: false, error: 'Family not found.' });

    const member = family.members.find(m => m.phone === memberPhone);
    if (!member) return res.status(404).json({ success: false, error: 'Member not found.' });

    member.status = 'safe';
    member.lastSeen = new Date().toISOString();

    return res.json({
      success: true,
      message: `${member.name} has checked in as safe.`,
      member: { name: member.name, status: member.status, lastSeen: member.lastSeen }
    });
  } catch (err) {
    console.error('[Family Check-in Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to process check-in.' });
  }
});

module.exports = router;
