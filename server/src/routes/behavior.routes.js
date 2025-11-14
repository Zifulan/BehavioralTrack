const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const behaviorController = require('../controllers/behavior.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All behavior routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/behaviors/:behaviorId/logs
 * @desc    Get all logs for a behavior
 * @access  Private
 */
router.get(
  '/:behaviorId/logs',
  [param('behaviorId').isInt().withMessage('Invalid behavior ID')],
  behaviorController.getBehaviorLogs
);

/**
 * @route   POST /api/behaviors
 * @desc    Create new behavior for a session
 * @access  Private
 */
router.post(
  '/',
  [
    body('sessionId').isInt().withMessage('Session ID required'),
    body('name').trim().notEmpty().withMessage('Behavior name required'),
    body('type').isIn(['tally', 'duration']).withMessage('Type must be "tally" or "duration"'),
    body('description').optional().trim(),
    body('targetValue').optional().isInt()
  ],
  behaviorController.createBehavior
);

/**
 * @route   PUT /api/behaviors/:id
 * @desc    Update behavior
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Invalid behavior ID'),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('targetValue').optional().isInt()
  ],
  behaviorController.updateBehavior
);

/**
 * @route   DELETE /api/behaviors/:id
 * @desc    Delete behavior
 * @access  Private
 */
router.delete(
  '/:id',
  [param('id').isInt().withMessage('Invalid behavior ID')],
  behaviorController.deleteBehavior
);

/**
 * @route   POST /api/behaviors/:behaviorId/logs
 * @desc    Log a behavior occurrence
 * @access  Private
 */
router.post(
  '/:behaviorId/logs',
  [
    param('behaviorId').isInt().withMessage('Invalid behavior ID'),
    body('type').isIn(['tally', 'duration']).withMessage('Type must be "tally" or "duration"'),
    body('timestamp').optional().isISO8601().toDate(),
    body('startTime').optional().isISO8601().toDate(),
    body('endTime').optional().isISO8601().toDate(),
    body('duration').optional().isInt(),
    body('notes').optional().trim(),
    body('antecedent').optional().trim(),
    body('consequence').optional().trim()
  ],
  behaviorController.logBehavior
);

/**
 * @route   DELETE /api/behaviors/logs/:logId
 * @desc    Delete a behavior log
 * @access  Private
 */
router.delete(
  '/logs/:logId',
  [param('logId').isInt().withMessage('Invalid log ID')],
  behaviorController.deleteBehaviorLog
);

module.exports = router;
