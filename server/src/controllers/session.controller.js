const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

/**
 * @desc    Get all sessions
 * @route   GET /api/sessions
 * @access  Private
 */
exports.getAllSessions = async (req, res, next) => {
  try {
    const { clientId, startDate, endDate, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        s.id, s.session_date, s.start_time, s.end_time, s.location, s.notes,
        s.created_at,
        c.id AS client_id,
        CONCAT(c.first_name, ' ', c.last_name) AS client_name,
        COUNT(DISTINCT b.id) AS behavior_count
      FROM sessions s
      JOIN clients c ON s.client_id = c.id
      LEFT JOIN behaviors b ON s.id = b.session_id
      WHERE s.user_id = ?
    `;
    const params = [req.user.id];

    if (clientId) {
      query += ` AND s.client_id = ?`;
      params.push(clientId);
    }
    if (startDate) {
      query += ` AND s.session_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND s.session_date <= ?`;
      params.push(endDate);
    }

    query += ` GROUP BY s.id ORDER BY s.session_date DESC, s.start_time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [sessions] = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT s.id) AS total FROM sessions s WHERE s.user_id = ?`;
    const countParams = [req.user.id];
    if (clientId) {
      countQuery += ` AND s.client_id = ?`;
      countParams.push(clientId);
    }
    if (startDate) {
      countQuery += ` AND s.session_date >= ?`;
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ` AND s.session_date <= ?`;
      countParams.push(endDate);
    }

    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: sessions.map(s => ({
        id: s.id,
        clientId: s.client_id,
        clientName: s.client_name,
        sessionDate: s.session_date,
        startTime: s.start_time,
        endTime: s.end_time,
        location: s.location,
        notes: s.notes,
        behaviorCount: s.behavior_count,
        createdAt: s.created_at
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + sessions.length < total
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single session with behaviors
 * @route   GET /api/sessions/:id
 * @access  Private
 */
exports.getSessionById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Get session
    const [sessions] = await pool.query(
      `SELECT s.*, CONCAT(c.first_name, ' ', c.last_name) AS client_name
       FROM sessions s
       JOIN clients c ON s.client_id = c.id
       WHERE s.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const session = sessions[0];

    // Get behaviors for this session
    const [behaviors] = await pool.query(
      `SELECT b.*,
       (SELECT COUNT(*) FROM behavior_logs WHERE behavior_id = b.id) AS log_count,
       (SELECT SUM(tally_value) FROM behavior_logs WHERE behavior_id = b.id AND b.type = 'tally') AS total_count,
       (SELECT SUM(duration_seconds) FROM behavior_logs WHERE behavior_id = b.id AND b.type = 'duration') AS total_duration
       FROM behaviors b
       WHERE b.session_id = ?
       ORDER BY b.created_at`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        id: session.id,
        clientId: session.client_id,
        clientName: session.client_name,
        sessionDate: session.session_date,
        startTime: session.start_time,
        endTime: session.end_time,
        location: session.location,
        notes: session.notes,
        createdAt: session.created_at,
        behaviors: behaviors.map(b => ({
          id: b.id,
          name: b.name,
          type: b.type,
          description: b.description,
          targetValue: b.target_value,
          logCount: b.log_count,
          totalCount: b.total_count || 0,
          totalDuration: b.total_duration || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new session
 * @route   POST /api/sessions
 * @access  Private
 */
exports.createSession = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { clientId, sessionDate, startTime, location, notes } = req.body;

    // Verify client belongs to user
    const [clients] = await pool.query(
      'SELECT id FROM clients WHERE id = ? AND user_id = ?',
      [clientId, req.user.id]
    );

    if (clients.length === 0) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO sessions (user_id, client_id, session_date, start_time, location, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, clientId, sessionDate, startTime, location || null, notes || null]
    );

    const [newSession] = await pool.query('SELECT * FROM sessions WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      data: newSession[0],
      message: 'Session created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update session
 * @route   PUT /api/sessions/:id
 * @access  Private
 */
exports.updateSession = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { endTime, location, notes } = req.body;
    const updates = [];
    const values = [];

    if (endTime !== undefined) {
      updates.push('end_time = ?');
      values.push(endTime);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(req.params.id, req.user.id);

    const [result] = await pool.query(
      `UPDATE sessions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const [updated] = await pool.query('SELECT * FROM sessions WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      data: updated[0],
      message: 'Session updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    End session
 * @route   POST /api/sessions/:id/end
 * @access  Private
 */
exports.endSession = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'UPDATE sessions SET end_time = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const [updated] = await pool.query('SELECT * FROM sessions WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      data: updated[0],
      message: 'Session ended successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete session
 * @route   DELETE /api/sessions/:id
 * @access  Private
 */
exports.deleteSession = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM sessions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
