// ═══════════════════════════════════════════
// SHIELD — Evidence Recording Route (/api/evidence)
// "Because safety should not wait."
// ═══════════════════════════════════════════

const express = require('express');
const router = express.Router();

// ── In-memory evidence store (replace with cloud storage in production) ──
const evidenceSessions = {};
let evidenceIdCounter = 1;

// ── POST /api/evidence/start ──
// Marks the beginning of an evidence recording session
router.post('/start', (req, res) => {
  try {
    const { userId, sosId, type = 'audio_video', location } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required.' });
    }

    const evidenceId = `EVD-${Date.now()}-${evidenceIdCounter++}`;
    const session = {
      id: evidenceId,
      userId,
      sosId: sosId || null,
      type,
      status: 'recording',
      location: location || null,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationSeconds: 0,
      maxDurationSeconds: 1800, // 30 minutes (Premium), 7200 = 2hrs (Family)
      chunks: [],
      downloadUrl: null,
      sharedWithContacts: false,
      encrypted: true,
      tamperProof: true,
      timestamped: new Date().toISOString()
    };

    evidenceSessions[evidenceId] = session;

    console.log(`🎥 [Evidence] Recording started: ${evidenceId} for user ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'Evidence recording session started.',
      evidenceId,
      type: session.type,
      maxDurationMinutes: session.maxDurationSeconds / 60,
      startedAt: session.startedAt
    });
  } catch (err) {
    console.error('[Evidence Start Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to start evidence recording.' });
  }
});

// ── POST /api/evidence/upload ──
// Accepts a chunk upload (binary data in production, metadata here)
router.post('/upload', (req, res) => {
  try {
    const { evidenceId, chunkIndex, chunkType = 'video', durationMs } = req.body;

    if (!evidenceId) {
      return res.status(400).json({ success: false, error: 'evidenceId is required.' });
    }

    const session = evidenceSessions[evidenceId];
    if (!session) {
      return res.status(404).json({ success: false, error: 'Evidence session not found.' });
    }

    if (session.status !== 'recording') {
      return res.status(400).json({ success: false, error: 'Session is not in recording state.' });
    }

    const chunk = {
      index: chunkIndex || session.chunks.length,
      type: chunkType,
      durationMs: durationMs || 0,
      uploadedAt: new Date().toISOString(),
      size: `~${Math.floor(Math.random() * 500 + 100)}KB`, // Simulated in demo
      encrypted: true
    };

    session.chunks.push(chunk);
    session.durationSeconds = session.chunks.reduce((acc, c) => acc + (c.durationMs / 1000), 0);

    return res.json({
      success: true,
      message: `Chunk ${chunk.index} uploaded successfully.`,
      evidenceId,
      chunksUploaded: session.chunks.length,
      totalDurationSeconds: Math.round(session.durationSeconds)
    });
  } catch (err) {
    console.error('[Evidence Upload Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to upload evidence chunk.' });
  }
});

// ── POST /api/evidence/complete ──
// Ends the evidence recording session and generates a secure download link
router.post('/complete', (req, res) => {
  try {
    const { evidenceId, shareWithContacts = true } = req.body;

    if (!evidenceId) {
      return res.status(400).json({ success: false, error: 'evidenceId is required.' });
    }

    const session = evidenceSessions[evidenceId];
    if (!session) {
      return res.status(404).json({ success: false, error: 'Evidence session not found.' });
    }

    session.status = 'completed';
    session.endedAt = new Date().toISOString();
    session.sharedWithContacts = shareWithContacts;

    // Generate a secure, time-limited download token (simulated)
    const token = Buffer.from(`${evidenceId}:${Date.now()}`).toString('base64').replace(/=/g, '');
    session.downloadUrl = `/api/evidence/download?token=${token}`;
    session.downloadToken = token;
    session.tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const finalDurationMinutes = (session.durationSeconds / 60).toFixed(1);

    console.log(`✅ [Evidence] Recording complete: ${evidenceId} (${finalDurationMinutes} min, ${session.chunks.length} chunks)`);

    return res.json({
      success: true,
      message: 'Evidence recording completed and secured.',
      evidenceId,
      summary: {
        status: session.status,
        durationMinutes: parseFloat(finalDurationMinutes),
        chunksRecorded: session.chunks.length,
        encrypted: session.encrypted,
        tamperProof: session.tamperProof,
        sharedWithContacts: session.sharedWithContacts,
        downloadUrl: session.downloadUrl,
        tokenExpiresAt: session.tokenExpiresAt
      }
    });
  } catch (err) {
    console.error('[Evidence Complete Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to complete evidence session.' });
  }
});

// ── GET /api/evidence/download ──
// Retrieve evidence via secure token
router.get('/download', (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Download token is required.' });
    }

    // Find session by token
    const session = Object.values(evidenceSessions).find(s => s.downloadToken === token);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Invalid or expired download token.' });
    }

    if (new Date() > new Date(session.tokenExpiresAt)) {
      return res.status(410).json({ success: false, error: 'Download link has expired.' });
    }

    return res.json({
      success: true,
      message: 'Evidence retrieved successfully.',
      evidence: {
        id: session.id,
        userId: session.userId,
        type: session.type,
        status: session.status,
        durationMinutes: (session.durationSeconds / 60).toFixed(1),
        chunks: session.chunks.length,
        location: session.location,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        encrypted: session.encrypted,
        tamperProof: session.tamperProof,
        timestamped: session.timestamped
      }
    });
  } catch (err) {
    console.error('[Evidence Download Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve evidence.' });
  }
});

// ── GET /api/evidence/list ──
// Get all evidence sessions for a user
router.get('/list', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required.' });
    }

    const userEvidence = Object.values(evidenceSessions)
      .filter(s => s.userId === userId)
      .map(s => ({
        id: s.id,
        sosId: s.sosId,
        status: s.status,
        type: s.type,
        durationMinutes: (s.durationSeconds / 60).toFixed(1),
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        downloadUrl: s.downloadUrl || null
      }))
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    return res.json({
      success: true,
      evidence: userEvidence,
      total: userEvidence.length
    });
  } catch (err) {
    console.error('[Evidence List Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to list evidence.' });
  }
});

// ── DELETE /api/evidence/:id ──
// Delete evidence (user-initiated)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const session = evidenceSessions[id];
    if (!session) {
      return res.status(404).json({ success: false, error: 'Evidence not found.' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this evidence.' });
    }

    delete evidenceSessions[id];

    return res.json({ success: true, message: 'Evidence deleted successfully.', id });
  } catch (err) {
    console.error('[Evidence Delete Error]', err);
    return res.status(500).json({ success: false, error: 'Failed to delete evidence.' });
  }
});

module.exports = router;
