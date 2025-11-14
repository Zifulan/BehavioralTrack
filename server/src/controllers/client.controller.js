const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

/**
 * @desc    Get all clients for current user
 * @route   GET /api/clients
 * @access  Private
 */
exports.getAllClients = async (req, res, next) => {
  try {
    const { search, active } = req.query;

    let query = `
      SELECT id, first_name, last_name, date_of_birth, active, notes, created_at, updated_at
      FROM clients
      WHERE user_id = ?
    `;
    const params = [req.user.id];

    // Add search filter
    if (search) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Add active filter
    if (active !== undefined) {
      query += ` AND active = ?`;
      params.push(active === 'true' || active === true ? 1 : 0);
    }

    query += ` ORDER BY last_name, first_name`;

    const [clients] = await pool.query(query, params);

    // Transform data for response
    const formattedClients = clients.map(client => ({
      id: client.id,
      firstName: client.first_name,
      lastName: client.last_name,
      dateOfBirth: client.date_of_birth,
      active: client.active === 1,
      notes: client.notes,
      createdAt: client.created_at,
      updatedAt: client.updated_at
    }));

    res.json({
      success: true,
      data: formattedClients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single client by ID
 * @route   GET /api/clients/:id
 * @access  Private
 */
exports.getClientById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const [clients] = await pool.query(
      `SELECT id, first_name, last_name, date_of_birth, active, notes, created_at, updated_at
       FROM clients
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const client = clients[0];

    res.json({
      success: true,
      data: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        dateOfBirth: client.date_of_birth,
        active: client.active === 1,
        notes: client.notes,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new client
 * @route   POST /api/clients
 * @access  Private
 */
exports.createClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, dateOfBirth, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO clients (user_id, first_name, last_name, date_of_birth, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, firstName, lastName, dateOfBirth || null, notes || null]
    );

    const clientId = result.insertId;

    // Get created client
    const [clients] = await pool.query(
      `SELECT id, first_name, last_name, date_of_birth, active, notes, created_at
       FROM clients WHERE id = ?`,
      [clientId]
    );

    const client = clients[0];

    res.status(201).json({
      success: true,
      data: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        dateOfBirth: client.date_of_birth,
        active: client.active === 1,
        notes: client.notes,
        createdAt: client.created_at
      },
      message: 'Client created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Private
 */
exports.updateClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if client exists and belongs to user
    const [existing] = await pool.query(
      'SELECT id FROM clients WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const { firstName, lastName, dateOfBirth, notes, active } = req.body;
    const updates = [];
    const values = [];

    if (firstName) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (dateOfBirth !== undefined) {
      updates.push('date_of_birth = ?');
      values.push(dateOfBirth);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      values.push(active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(req.params.id);

    await pool.query(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated client
    const [clients] = await pool.query(
      `SELECT id, first_name, last_name, date_of_birth, active, notes, updated_at
       FROM clients WHERE id = ?`,
      [req.params.id]
    );

    const client = clients[0];

    res.json({
      success: true,
      data: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        dateOfBirth: client.date_of_birth,
        active: client.active === 1,
        notes: client.notes,
        updatedAt: client.updated_at
      },
      message: 'Client updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete client
 * @route   DELETE /api/clients/:id
 * @access  Private
 */
exports.deleteClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if client exists and belongs to user
    const [existing] = await pool.query(
      'SELECT id FROM clients WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Delete client (cascade will delete sessions, behaviors, logs)
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
