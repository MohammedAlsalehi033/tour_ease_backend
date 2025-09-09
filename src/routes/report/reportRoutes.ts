import express from 'express';
import { ReportController } from '../../controllers/report/reportController';
import { body, param, query, validationResult } from 'express-validator';
import authMiddleware from '../../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const reportController = new ReportController();
const prisma = new PrismaClient();

// Middleware to check if user is admin
const adminMiddleware = async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { admin: true },
    });

    if (!user || !user.admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking admin privileges',
    });
  }
};

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Create report validation
const createReportValidation = [
  body('reportableType')
    .isIn([
      'USER',
      'TRANSPORTATION_LISTING',
      'ACCOMMODATION',
      'ROOM',
      'QUESTION',
      'COMMENT',
      'MESSAGE',
      'OFFER',
      'TRANSPORTATION_BOOKING',
      'ACCOMMODATION_BOOKING',
    ])
    .withMessage('Invalid reportableType'),
  body('reportReason')
    .isLength({ min: 1, max: 100 })
    .withMessage('Report reason must be between 1 and 100 characters'),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('reportedUserId')
    .optional()
    .isString()
    .withMessage('reportedUserId must be a string'),
  body('transportationListingId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('transportationListingId must be a positive integer'),
  body('accommodationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('accommodationId must be a positive integer'),
  body('roomId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('roomId must be a positive integer'),
  body('questionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('questionId must be a positive integer'),
  body('commentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('commentId must be a positive integer'),
  body('messageId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('messageId must be a positive integer'),
  body('offerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('offerId must be a positive integer'),
  body('transportationBookingId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('transportationBookingId must be a positive integer'),
  body('accommodationBookingId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('accommodationBookingId must be a positive integer'),
];

// Update report status validation
const updateReportStatusValidation = [
  body('status')
    .isIn(['pending', 'investigating', 'resolved', 'dismissed'])
    .withMessage('Status must be one of: pending, investigating, resolved, dismissed'),
  body('resolutionNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Resolution notes must be less than 500 characters'),
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'investigating', 'resolved', 'dismissed'])
    .withMessage('Invalid status'),
  query('reportableType')
    .optional()
    .isIn([
      'USER',
      'TRANSPORTATION_LISTING',
      'ACCOMMODATION',
      'ROOM',
      'QUESTION',
      'COMMENT',
      'MESSAGE',
      'OFFER',
      'TRANSPORTATION_BOOKING',
      'ACCOMMODATION_BOOKING',
    ])
    .withMessage('Invalid reportableType'),
];

// ID validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
];

const userIdValidation = [
  param('userId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('User ID must be a non-empty string'),
];

const typeValidation = [
  param('type')
    .isIn([
      'USER',
      'TRANSPORTATION_LISTING',
      'ACCOMMODATION',
      'ROOM',
      'QUESTION',
      'COMMENT',
      'MESSAGE',
      'OFFER',
      'TRANSPORTATION_BOOKING',
      'ACCOMMODATION_BOOKING',
    ])
    .withMessage('Invalid report type'),
];

// Routes

// Create a new report (authenticated users only)
router.post(
  '/',
  authMiddleware,
  createReportValidation,
  validateRequest,
  reportController.createReport
);

// Get all reports (admin only)
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  paginationValidation,
  validateRequest,
  reportController.getAllReports
);

// Get report statistics (admin only)
router.get(
  '/statistics',
  authMiddleware,
  adminMiddleware,
  reportController.getReportStatistics
);

// Get reports by type (admin only)
router.get(
  '/type/:type',
  authMiddleware,
  adminMiddleware,
  typeValidation,
  paginationValidation,
  validateRequest,
  reportController.getReportsByType
);

// Get reports by reported user ID (admin only)
router.get(
  '/user/:userId',
  authMiddleware,
  adminMiddleware,
  userIdValidation,
  paginationValidation,
  validateRequest,
  reportController.getReportsByReportedUser
);

// Get a specific report by ID (admin only)
router.get(
  '/:id',
  authMiddleware,
  adminMiddleware,
  idValidation,
  validateRequest,
  reportController.getReportById
);

// Update report status (admin only)
router.patch(
  '/:id/status',
  authMiddleware,
  adminMiddleware,
  idValidation,
  updateReportStatusValidation,
  validateRequest,
  reportController.updateReportStatus
);

// Delete a report (admin only)
router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  idValidation,
  validateRequest,
  reportController.deleteReport
);

// User routes (authenticated users)

// Get user's own reports
router.get(
  '/my-reports',
  authMiddleware,
  paginationValidation,
  validateRequest,
  reportController.getReportsByReporter
);

export default router;
