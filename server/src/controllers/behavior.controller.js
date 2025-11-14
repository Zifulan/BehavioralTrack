const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

/**
 * @desc    Get behavior logs
 * @route   GET /api/behaviors/:behaviorId/logs
 * @access  Private
 */
exports.getBehaviorLogs = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Verify behavior belongs to user's session
    const [behaviors] = await pool.query(
      `SELECT b.* FROM behaviors b
       JOIN sessions s ON b.session_id = s.id
       WHERE b.id = ? AND s.user_id = ?`,
      [req.params.behaviorId, req.user.id]
    );

    if (behaviors.length === 0) {
      return res.status(404).json({ success: false, error: 'Behavior not found' });
    }

    const [logs] = await pool.query(
      `SELECT * FROM behavior_logs WHERE behavior_id = ? ORDER BY timestamp DESC`,
      [req.params.behaviorId]
    );

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new behavior
 * @route   POST /api/behaviors
 * @access  Private
 */
exports.createBehavior = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { sessionId, name, type, description, targetValue } = req.body;

    // Verify session belongs to user
    const [sessions] = await pool.query(
      'SELECT id FROM sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO behaviors (session_id, name, type, description, target_value)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, name, type, description || null, targetValue || null]
    );

    const [newBehavior] = await pool.query('SELECT * FROM behaviors WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      data: newBehavior[0],
      message: 'Behavior created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update behavior
 * @route   PUT /api/behaviors/:id
 * @access  Private
 */
exports.updateBehavior = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, targetValue } = req.body;
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (targetValue !== undefined) {
      updates.push('target_value = ?');
      values.push(targetValue);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(req.params.id, req.user.id);

    const [result] = await pool.query(
      `UPDATE behaviors b
       JOIN sessions s ON b.session_id = s.id
       SET ${updates.join(', ')}
       WHERE b.id = ? AND s.user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Behavior not found' });
    }

    const [updated] = await pool.query('SELECT * FROM behaviors WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      data: updated[0],
      message: 'Behavior updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete behavior
 * @route   DELETE /api/behaviors/:id
 * @access  Private
 */
exports.deleteBehavior = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const [result] = await pool.query(
      `DELETE b FROM behaviors b
       JOIN sessions s ON b.session_id = s.id
       WHERE b.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Behavior not found' });
    }

    res.json({
      success: true,
      message: 'Behavior deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log a behavior occurrence
 * @route   POST /api/behaviors/:behaviorId/logs
 * @access  Private
 */
exports.logBehavior = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { type, timestamp, startTime, endTime, duration, notes, antecedent, consequence } = req.body;

    // Verify behavior belongs to user
    const [behaviors] = await pool.query(
      `SELECT b.* FROM behaviors b
       JOIN sessions s ON b.session_id = s.id
       WHERE b.id = ? AND s.user_id = ?`,
      [req.params.behaviorId, req.user.id]
    );

    if (behaviors.length === 0) {
      return res.status(404).json({ success: false, error: 'Behavior not found' });
    }

    const behavior = behaviors[0];

    // Verify type matches
    if (behavior.type !== type) {
      return res.status(400).json({
        success: false,
        error: `Behavior type mismatch. Expected ${behavior.type}, got ${type}`
      });
    }

    let result;

    if (type === 'tally') {
      // Log tally increment
      [result] = await pool.query(
        `INSERT INTO behavior_logs (behavior_id, timestamp, tally_value, notes, antecedent, consequence)
         VALUES (?, ?, 1, ?, ?, ?)`,
        [
          req.params.behaviorId,
          timestamp || new Date(),
          notes || null,
          antecedent || null,
          consequence || null
        ]
      );
    } else {
      // Log duration
      [result] = await pool.query(
        `INSERT INTO behavior_logs (behavior_id, timestamp, start_time, end_time, duration_seconds, notes, antecedent, consequence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.params.behaviorId,
          timestamp || new Date(),
          startTime,
          endTime,
          duration || null,
          notes || null,
          antecedent || null,
          consequence || null
        ]
      );
    }

    const [newLog] = await pool.query('SELECT * FROM behavior_logs WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      data: newLog[0],
      message: 'Behavior logged successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete behavior log
 * @route   DELETE /api/behaviors/logs/:logId
 * @access  Private
 */
exports.deleteBehaviorLog = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const [result] = await pool.query(
      `DELETE bl FROM behavior_logs bl
       JOIN behaviors b ON bl.behavior_id = b.id
       JOIN sessions s ON b.session_id = s.id
       WHERE bl.id = ? AND s.user_id = ?`,
      [req.params.logId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Log not found' });
    }

    res.json({
      success: true,
      message: 'Log deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
