import express from 'express';
import { AnalyticsModel } from '../../../models/admin/analtics/analysis';
import { AnalyticsController } from '../../../controllers/admin/analysis/analysisController';
import adminMiddleware from '../../../middleware/adminsMiddleware';

const router = express.Router();

 
const analyticsModel = new AnalyticsModel();
const analyticsController = new AnalyticsController(analyticsModel);


 
 
router.get(
    "/overview",
    adminMiddleware(["Access Analytics"]),
    analyticsController.getAnalyticsOverview
);

 

 
router.get(
    "/users",
    adminMiddleware(["Access Analytics"]),
    analyticsController.getUserAnalytics
);

 
router.get(
    "/bookings/transportation",
    adminMiddleware(["Access Analytics"]),
    analyticsController.getTransportationBookingAnalytics
);

 
router.get(
    "/bookings/accommodation",
    adminMiddleware(["Access Analytics"]),
    analyticsController.getAccommodationBookingAnalytics
);

 
router.get(
    "/content",
    adminMiddleware(["Access Analytics"]),
    analyticsController.getContentAnalytics
);

 
router.get(
    "/ratings",
    adminMiddleware(["Access Analytics"]),
    analyticsController.getRatingAnalytics
);

 
router.get(
    "/providers",
    adminMiddleware(["Access Analytics"]),
    analyticsController.getProviderAnalytics
);


 
 
 
router.get(
    "/export",
    adminMiddleware(["Access Analytics"]),
    analyticsController.exportAnalytics
);


 
module.exports = router;  
 