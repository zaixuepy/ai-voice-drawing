const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.post('/', (req, res) => {
  const { sessionId, eventType, data } = req.body;

  if (eventType === 'command') {
    const stmt = db.prepare(`
      INSERT INTO command_logs (session_id, user_input, canvas_state, ai_output, latency_ms, token_count, is_clarify)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      sessionId,
      data.input || null,
      data.canvasState || null,
      data.output || null,
      data.latencyMs || null,
      data.tokenCount || null,
      data.isClarify ? 1 : 0
    );
    return res.json({ ok: true, id: result.lastInsertRowid });
  }

  if (eventType === 'feedback') {
    const stmt = db.prepare(`
      INSERT INTO feedback_logs (session_id, command_log_id, feedback_type, user_input, ai_output)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      sessionId,
      data.commandLogId || null,
      data.feedback || null,
      data.input || null,
      data.output || null
    );
    return res.json({ ok: true });
  }

  res.status(400).json({ error: 'Unknown eventType' });
});

router.get('/export', (req, res) => {
  const rows = db.prepare(`
    SELECT
      c.id as command_id,
      c.session_id,
      c.created_at,
      c.user_input,
      c.canvas_state,
      c.ai_output,
      c.latency_ms,
      c.token_count,
      c.is_clarify,
      f.feedback_type,
      f.created_at as feedback_at
    FROM command_logs c
    LEFT JOIN feedback_logs f ON f.command_log_id = c.id
    ORDER BY c.created_at DESC
  `).all();

  const headers = ['command_id', 'session_id', 'created_at', 'user_input', 'canvas_state',
    'ai_output', 'latency_ms', 'token_count', 'is_clarify', 'feedback_type', 'feedback_at'];
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=voicedraw_analytics.csv');
  res.send('﻿' + csv);
});

module.exports = router;
