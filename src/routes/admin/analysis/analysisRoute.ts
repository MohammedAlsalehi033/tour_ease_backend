import express from 'express';
import { AnalyticsModel } from '../../../models/admin/analtics/analysis';
import { AnalyticsController } from '../../../controllers/admin/analysis/analysisController';

const router = express.Router();

// Instantiate the model and controller
const analyticsModel = new AnalyticsModel();
const analyticsController = new AnalyticsController(analyticsModel);

/**
 * ========================================
 * Analytics Routes
 * ========================================
 * These routes provide access to various platform analytics data.
 * Filters like startDate, endDate, status, location, interval (day/week/month)
 * can often be applied via query parameters (e.g., ?startDate=YYYY-MM-DD&interval=week).
 * Check the specific controller methods for supported filters.
 */

// --- Overview ---
// GET /api/admin/analytics/overview - Fetches key summary metrics
router.get(
    "/overview",
    analyticsController.getAnalyticsOverview // .bind(analyticsController) is needed if not bound in constructor
);

// --- Detailed Analytics ---

// GET /api/admin/analytics/users - Fetches detailed user analytics (registrations, roles, status)
router.get(
    "/users",
    analyticsController.getUserAnalytics
);

// GET /api/admin/analytics/bookings/transportation - Fetches detailed transportation booking analytics
router.get(
    "/bookings/transportation",
    analyticsController.getTransportationBookingAnalytics
);

// GET /api/admin/analytics/bookings/accommodation - Fetches detailed accommodation booking analytics
router.get(
    "/bookings/accommodation",
    analyticsController.getAccommodationBookingAnalytics
);

// GET /api/admin/analytics/content - Fetches content engagement analytics (questions, reviews, offers)
router.get(
    "/content",
    analyticsController.getContentAnalytics
);

// GET /api/admin/analytics/ratings - Fetches rating analytics (averages, distribution)
router.get(
    "/ratings",
    analyticsController.getRatingAnalytics
);

// GET /api/admin/analytics/providers - Fetches provider analytics (counts, status)
router.get(
    "/providers",
    analyticsController.getProviderAnalytics
);


// --- Export ---
// GET /api/admin/analytics/export?reportType=overview&format=pdf - Exports specified analytics data
// Supported query parameters: reportType, format, plus any filters applicable to the reportType
router.get(
    "/export",
    analyticsController.exportAnalytics
);


// Export the router
module.exports = router; // Use this for CommonJS modules (typical Node.js)
// export default router; // Use this if your project is set up for ES modules