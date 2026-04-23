// ═══════════════════════════════════════════
// SHIELD — Emergency Numbers Route
// ═══════════════════════════════════════════
// GET /api/emergency — Get all emergency numbers

const express = require('express');
const router = express.Router();

const EMERGENCY_NUMBERS = [
  { number: '112',   label: 'All Emergencies',         description: 'Police + Ambulance + Fire',   icon: '📞', priority: 1 },
  { number: '100',   label: 'Police Direct',           description: 'Direct police helpline',      icon: '🚔', priority: 2 },
  { number: '1091',  label: 'Women Helpline',          description: 'National women helpline',     icon: '👮', priority: 3 },
  { number: '181',   label: 'Women Helpline (State)',   description: 'State-level women helpline',  icon: '🆘', priority: 4 },
  { number: '1098',  label: 'Child Helpline',           description: 'Child protection services',   icon: '👧', priority: 5 },
  { number: '102',   label: 'Ambulance',                description: 'Medical emergency',           icon: '🚑', priority: 6 },
  { number: '101',   label: 'Fire Emergency',           description: 'Fire department',             icon: '🚒', priority: 7 },
  { number: '1930',  label: 'Cyber Crime',              description: 'Online crime helpline',        icon: '🔒', priority: 8 },
  { number: '14567', label: 'Senior Citizen Helpline',  description: 'Elderly assistance',           icon: '👴', priority: 9 }
];

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'India Emergency Helpline Numbers',
    primaryNumber: '112',
    numbers: EMERGENCY_NUMBERS
  });
});

module.exports = router;
