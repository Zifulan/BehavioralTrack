const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const sessionController = require('../controllers/session.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All session routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/sessions
 * @desc    Get all sessions for current user
 * @access  Private
 */
router.get(
  '/',
  [
    query('clientId').optional().isInt(),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  sessionController.getAllSessions
);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get single session with behaviors
 * @access  Private
 */
router.get(
  '/:id',
  [param('id').isInt().withMessage('Invalid session ID')],
  sessionController.getSessionById
);

/**
 * @route   POST /api/sessions
 * @desc    Create new session
 * @access  Private
 */
router.post(
  '/',
  [
    body('clientId').isInt().withMessage('Client ID required'),
    body('sessionDate').isISO8601().toDate().withMessage('Valid date required'),
    body('startTime').isISO8601().toDate().withMessage('Valid start time required'),
    body('location').optional().trim(),
    body('notes').optional().trim()
  ],
  sessionController.createSession
);

/**
 * @route   PUT /api/sessions/:id
 * @desc    Update session
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid session ID'),
    body('endTime').optional().isISO8601().toDate(),
    body('location').optional().trim(),
    body('notes').optional().trim()
  ],
  sessionController.updateSession
);

/**
 * @route   POST /api/sessions/:id/end
 * @desc    End session (set end time to now)
 * @access  Private
 */
router.post(
  '/:id/end',
  [param('id').isInt().withMessage('Invalid session ID')],
  sessionController.endSession
);

/**
 * @route   DELETE /api/sessions/:id
 * @desc    Delete session
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid session ID')],
  sessionController.deleteSession
);

module.exports = router;
