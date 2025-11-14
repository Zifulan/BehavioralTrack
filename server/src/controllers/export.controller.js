const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { createObjectCsvStringifier } = require('csv-writer');
const PDFDocument = require('pdfkit');

/**
 * @desc    Export session to CSV
 * @route   GET /api/export/csv/:sessionId
 * @access  Private
 */
exports.exportSessionCSV = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Get session data
    const [sessions] = await pool.query(
      `SELECT s.*, CONCAT(c.first_name, ' ', c.last_name) AS client_name,
       CONCAT(u.first_name, ' ', u.last_name) AS therapist_name
       FROM sessions s
       JOIN clients c ON s.client_id = c.id
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.user_id = ?`,
      [req.params.sessionId, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const session = sessions[0];

    // Get all behavior logs
    const [logs] = await pool.query(
      `SELECT
        b.name AS behavior_name,
        b.type AS behavior_type,
        bl.*
       FROM behavior_logs bl
       JOIN behaviors b ON bl.behavior_id = b.id
       WHERE b.session_id = ?
       ORDER BY bl.timestamp`,
      [req.params.sessionId]
    );

    // Create CSV stringifier
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'session_id', title: 'Session ID' },
        { id: 'client_name', title: 'Client Name' },
        { id: 'session_date', title: 'Session Date' },
        { id: 'behavior_name', title: 'Behavior Name' },
        { id: 'behavior_type', title: 'Type' },
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'value', title: 'Value' },
        { id: 'duration', title: 'Duration (seconds)' },
        { id: 'notes', title: 'Notes' },
        { id: 'antecedent', title: 'Antecedent' },
        { id: 'consequence', title: 'Consequence' }
      ]
    });

    // Format data
    const records = logs.map(log => ({
      session_id: session.id,
      client_name: session.client_name,
      session_date: session.session_date,
      behavior_name: log.behavior_name,
      behavior_type: log.behavior_type,
      timestamp: log.timestamp,
      value: log.tally_value || '',
      duration: log.duration_seconds || '',
      notes: log.notes || '',
      antecedent: log.antecedent || '',
      consequence: log.consequence || ''
    }));

    // Generate CSV
    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    // Set headers for file download
    const filename = `session_${session.id}_${session.session_date}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Log export
    await pool.query(
      `INSERT INTO export_history (user_id, session_ids, format, file_name)
       VALUES (?, ?, 'csv', ?)`,
      [req.user.id, JSON.stringify([session.id]), filename]
    );

    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export session to PDF
 * @route   GET /api/export/pdf/:sessionId
 * @access  Private
 */
exports.exportSessionPDF = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Get session data
    const [sessions] = await pool.query(
      `SELECT s.*, CONCAT(c.first_name, ' ', c.last_name) AS client_name,
       CONCAT(u.first_name, ' ', u.last_name) AS therapist_name,
       u.credentials
       FROM sessions s
       JOIN clients c ON s.client_id = c.id
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.user_id = ?`,
      [req.params.sessionId, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const session = sessions[0];

    // Get behaviors with statistics
    const [behaviors] = await pool.query(
      `SELECT b.*,
       (SELECT COUNT(*) FROM behavior_logs WHERE behavior_id = b.id) AS log_count,
       (SELECT SUM(tally_value) FROM behavior_logs WHERE behavior_id = b.id AND b.type = 'tally') AS total_count,
       (SELECT SUM(duration_seconds) FROM behavior_logs WHERE behavior_id = b.id AND b.type = 'duration') AS total_duration
       FROM behaviors b
       WHERE b.session_id = ?
       ORDER BY b.created_at`,
      [req.params.sessionId]
    );

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    const filename = `session_${session.id}_${session.session_date}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Behavior Tracking Session Report', { align: 'center' });
    doc.moveDown();

    // Session Info
    doc.fontSize(12).text(`Client: ${session.client_name}`, { continued: false });
    doc.text(`Session Date: ${session.session_date}`);
    doc.text(`Start Time: ${new Date(session.start_time).toLocaleString()}`);
    if (session.end_time) {
      doc.text(`End Time: ${new Date(session.end_time).toLocaleString()}`);
    }
    if (session.location) {
      doc.text(`Location: ${session.location}`);
    }
    doc.text(`Therapist: ${session.therapist_name}${session.credentials ? ', ' + session.credentials : ''}`);
    doc.moveDown();

    // Session Notes
    if (session.notes) {
      doc.fontSize(14).text('Session Notes:', { underline: true });
      doc.fontSize(10).text(session.notes);
      doc.moveDown();
    }

    // Behaviors Summary
    doc.fontSize(14).text('Behaviors Summary:', { underline: true });
    doc.moveDown(0.5);

    for (const behavior of behaviors) {
      doc.fontSize(12).text(behavior.name, { continued: true, underline: true });
      doc.fontSize(10).text(` (${behavior.type})`, { underline: false });

      if (behavior.description) {
        doc.text(`Description: ${behavior.description}`);
      }

      if (behavior.type === 'tally') {
        doc.text(`Total Count: ${behavior.total_count || 0}`);
        if (behavior.target_value) {
          doc.text(`Target: ${behavior.target_value}`);
        }
      } else {
        const minutes = Math.floor((behavior.total_duration || 0) / 60);
        const seconds = (behavior.total_duration || 0) % 60;
        doc.text(`Total Duration: ${minutes}m ${seconds}s`);
      }

      doc.moveDown(0.5);
    }

    // Footer
    doc.fontSize(8).text(
      `Generated on ${new Date().toLocaleString()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();

    // Log export
    await pool.query(
      `INSERT INTO export_history (user_id, session_ids, format, file_name)
       VALUES (?, ?, 'pdf', ?)`,
      [req.user.id, JSON.stringify([session.id]), filename]
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export multiple sessions (bulk export)
 * @route   POST /api/export/bulk
 * @access  Private
 */
exports.exportBulk = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { format, sessionIds, clientId, startDate, endDate } = req.body;

    // Build query to get sessions
    let query = 'SELECT id FROM sessions WHERE user_id = ?';
    const params = [req.user.id];

    if (sessionIds && sessionIds.length > 0) {
      query += ` AND id IN (${sessionIds.map(() => '?').join(',')})`;
      params.push(...sessionIds);
    } else {
      if (clientId) {
        query += ' AND client_id = ?';
        params.push(clientId);
      }
      if (startDate) {
        query += ' AND session_date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND session_date <= ?';
        params.push(endDate);
      }
    }

    const [sessions] = await pool.query(query, params);

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No sessions found matching criteria'
      });
    }

    // For now, redirect to single session export for the first session
    // In a full implementation, you would combine multiple sessions into one file
    const firstSessionId = sessions[0].id;

    if (format === 'csv') {
      return exports.exportSessionCSV({ ...req, params: { sessionId: firstSessionId } }, res, next);
    } else {
      return exports.exportSessionPDF({ ...req, params: { sessionId: firstSessionId } }, res, next);
    }
  } catch (error) {
    next(error);
  }
};
