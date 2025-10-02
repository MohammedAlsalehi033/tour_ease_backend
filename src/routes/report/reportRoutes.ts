import express from 'express';
import { ReportController } from '../../controllers/report/reportController';
import authMiddleware from '../../middleware/authMiddleware';
import adminMiddleware from '../../middleware/adminsMiddleware';

const router = express.Router();
const reportController = new ReportController();


// Routes

// Create a new report (authenticated users only)
router.post(
  '/',
  authMiddleware(),

  reportController.createReport.bind(reportController)
);

// Get all reports (admin only)
router.get(
  '/',
  adminMiddleware(["Super Admin","View Reports"]),
 
  reportController.getAllReports.bind(reportController)
);

// Get report statistics (admin only)
router.get(
  '/statistics',
  authMiddleware(),
  reportController.getReportStatistics.bind(reportController)
);

// Get reports by type (admin only)
router.get(
  '/type/:type',
  authMiddleware(),
 
  reportController.getReportsByType.bind(reportController)
);

// Get reports by reported user ID (admin only)
router.get(
  '/user/:userId',
  authMiddleware(),
 
  reportController.getReportsByReportedUser.bind(reportController)
);

// Get a specific report by ID (admin only)
router.get(
  '/:id',
  authMiddleware(),

  reportController.getReportById.bind(reportController)
);

// Update report status (admin only)
router.patch(
  '/:id/status',
  authMiddleware(),
  
  reportController.updateReportStatus.bind(reportController)
);

// Delete a report (admin only)
router.delete(
  '/:id',
  authMiddleware(),
 
  reportController.deleteReport.bind(reportController)
);

// User routes (authenticated users)

// Get user's own reports
router.get(
  '/my-reports',
  authMiddleware(),
  
  reportController.getReportsByReporter.bind(reportController)    
);

module.exports = router;