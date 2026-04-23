// ═══════════════════════════════════════════
// SHIELD — Trusted Contacts Routes
// ═══════════════════════════════════════════
// GET    /api/contacts       — List contacts
// POST   /api/contacts       — Add contact
// PUT    /api/contacts/:id   — Update contact
// DELETE /api/contacts/:id   — Remove contact

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { findMany, findOne, insertOne, updateOne, deleteOne } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Plan limits
const PLAN_LIMITS = { free: 2, premium: 5, family: 10 };

// ── List Contacts ──
router.get('/', authenticate, (req, res) => {
  const contacts = findMany('contacts', c => c.userId === req.user.id);
  res.json({
    success: true,
    count: contacts.length,
    limit: PLAN_LIMITS[req.user.plan] || 2,
    contacts
  });
});

// ── Add Contact ──
router.post('/', authenticate, (req, res) => {
  const { name, phone, relationship } = req.body;

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Name and phone number are required.'
    });
  }

  // Check plan limit
  const existing = findMany('contacts', c => c.userId === req.user.id);
  const limit = PLAN_LIMITS[req.user.plan] || 2;

  if (existing.length >= limit) {
    return res.status(403).json({
      success: false,
      message: `Your ${req.user.plan} plan allows ${limit} contacts. Upgrade to add more.`,
      currentCount: existing.length,
      limit
    });
  }

  // Check duplicate phone
  const duplicate = existing.find(c => c.phone === phone);
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: 'This phone number is already in your contacts.'
    });
  }

  const contact = {
    id: uuidv4(),
    userId: req.user.id,
    name,
    phone,
    relationship: relationship || 'Other',
    verified: false,
    priority: existing.length + 1,
    addedAt: new Date().toISOString()
  };

  insertOne('contacts', contact);

  res.status(201).json({
    success: true,
    message: `✅ ${name} added as trusted contact.`,
    contact
  });
});

// ── Update Contact ──
router.put('/:id', authenticate, (req, res) => {
  const { name, phone, relationship, priority } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (relationship) updates.relationship = relationship;
  if (priority) updates.priority = priority;

  const contact = updateOne('contacts',
    c => c.id === req.params.id && c.userId === req.user.id,
    updates
  );

  if (!contact) {
    return res.status(404).json({ success: false, message: 'Contact not found.' });
  }

  res.json({ success: true, message: 'Contact updated.', contact });
});

// ── Delete Contact ──
router.delete('/:id', authenticate, (req, res) => {
  const deleted = deleteOne('contacts',
    c => c.id === req.params.id && c.userId === req.user.id
  );

  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Contact not found.' });
  }

  res.json({ success: true, message: 'Contact removed.' });
});

module.exports = router;
