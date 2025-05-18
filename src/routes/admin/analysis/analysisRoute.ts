import express from 'express';
import { AnalyticsModel } from '../../../models/admin/analtics/analysis';
import { AnalyticsController } from '../../../controllers/admin/analysis/analysisController';

const router = express.Router();

 
const analyticsModel = new AnalyticsModel();
const analyticsController = new AnalyticsController(analyticsModel);


 
 
router.get(
    "/overview",
    analyticsController.getAnalyticsOverview  
);

 

 
router.get(
    "/users",
    analyticsController.getUserAnalytics
);

 
router.get(
    "/bookings/transportation",
    analyticsController.getTransportationBookingAnalytics
);

 
router.get(
    "/bookings/accommodation",
    analyticsController.getAccommodationBookingAnalytics
);

 
router.get(
    "/content",
    analyticsController.getContentAnalytics
);

 
router.get(
    "/ratings",
    analyticsController.getRatingAnalytics
);

 
router.get(
    "/providers",
    analyticsController.getProviderAnalytics
);


 
 
 
router.get(
    "/export",
    analyticsController.exportAnalytics
);


 
module.exports = router;  
 