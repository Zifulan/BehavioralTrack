const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const exportController = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All export routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/export/csv/:sessionId
 * @desc    Export session data to CSV
 * @access  Private
 */
router.get(
  '/csv/:sessionId',
  [param('sessionId').isInt().withMessage('Invalid session ID')],
  exportController.exportSessionCSV
);

/**
 * @route   GET /api/export/pdf/:sessionId
 * @desc    Export session data to PDF
 * @access  Private
 */
router.get(
  '/pdf/:sessionId',
  [param('sessionId').isInt().withMessage('Invalid session ID')],
  exportController.exportSessionPDF
);

/**
 * @route   POST /api/export/bulk
 * @desc    Export multiple sessions
 * @access  Private
 */
router.post(
  '/bulk',
  [
    body('format').isIn(['csv', 'pdf']).withMessage('Format must be "csv" or "pdf"'),
    body('sessionIds').optional().isArray(),
    body('clientId').optional().isInt(),
    body('startDate').optional().isISO8601().toDate(),
    body('endDate').optional().isISO8601().toDate()
  ],
  exportController.exportBulk
);

module.exports = router;
