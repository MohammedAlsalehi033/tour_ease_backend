import { transportationBookingController } from '../../../controllers/rideSharing/bookingConntroller/transportaionBookingController';
import authMiddleware from '../../../middleware/authMiddleware';
import { transportationBookingModel } from '../../../models/rideSharing/bookingModel';
export {};

const express = require('express');
const router = express.Router();
const transportationBookingControllerinstance = new transportationBookingController(new transportationBookingModel());

router.get("/booking/traveler/:travlerId",authMiddleware(), transportationBookingControllerinstance.getBookingByTravelerId.bind(transportationBookingControllerinstance));
router.get("/booking/provider/:providerId",authMiddleware(), transportationBookingControllerinstance.getBookingByTransporationProviderId.bind(transportationBookingControllerinstance));
router.post("/booking/status/",authMiddleware(), transportationBookingControllerinstance.updateBookingStatus.bind(transportationBookingControllerinstance));


module.exports = router;