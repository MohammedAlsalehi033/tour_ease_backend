import express from 'express';
import { ReportController } from '../../controllers/report/reportController';
import { body, param, query, validationResult } from 'express-validator';
import authMiddleware from '../../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const reportController = new ReportController();
const prisma = new PrismaClient();


// Routes

// Create a new report (authenticated users only)
router.post(
  '/',
  authMiddleware,

  reportController.createReport
);

// Get all reports (admin only)
router.get(
  '/',
  authMiddleware,
 
  reportController.getAllReports
);

// Get report statistics (admin only)
router.get(
  '/statistics',
  authMiddleware,
  reportController.getReportStatistics
);

// Get reports by type (admin only)
router.get(
  '/type/:type',
  authMiddleware,
 
  reportController.getReportsByType
);

// Get reports by reported user ID (admin only)
router.get(
  '/user/:userId',
  authMiddleware,
 
  reportController.getReportsByReportedUser
);

// Get a specific report by ID (admin only)
router.get(
  '/:id',
  authMiddleware,

  reportController.getReportById
);

// Update report status (admin only)
router.patch(
  '/:id/status',
  authMiddleware,
  
  reportController.updateReportStatus
);

// Delete a report (admin only)
router.delete(
  '/:id',
  authMiddleware,
 
  reportController.deleteReport
);

// User routes (authenticated users)

// Get user's own reports
router.get(
  '/my-reports',
  authMiddleware,
  
  reportController.getReportsByReporter
);

module.exports = router;