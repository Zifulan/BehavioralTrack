const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const clientController = require('../controllers/client.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All client routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/clients
 * @desc    Get all clients for current user
 * @access  Private
 */
router.get(
  '/',
  [
    query('search').optional().trim(),
    query('active').optional().isBoolean().toBoolean()
  ],
  clientController.getAllClients
);

/**
 * @route   GET /api/clients/:id
 * @desc    Get single client by ID
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isInt().withMessage('Invalid client ID')],
  clientController.getClientById
);

/**
 * @route   POST /api/clients
 * @desc    Create new client
 * @access  Private
 */
router.post(
  '/',
  [
    body('firstName').trim().notEmpty().withMessage('First name required'),
    body('lastName').trim().notEmpty().withMessage('Last name required'),
    body('dateOfBirth').optional().isISO8601().toDate().withMessage('Invalid date format'),
    body('notes').optional().trim()
  ],
  clientController.createClient
);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid client ID'),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601().toDate(),
    body('notes').optional().trim(),
    body('active').optional().isBoolean().toBoolean()
  ],
  clientController.updateClient
);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid client ID')],
  clientController.deleteClient
);

module.exports = router;
