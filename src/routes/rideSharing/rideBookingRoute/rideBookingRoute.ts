import { transportationBookingController } from '../../../controllers/rideSharing/bookingConntroller/transportaionBookingController';
import { transportationBookingModel } from '../../../models/rideSharing/bookingModel';
export {};

const express = require('express');
const router = express.Router();
const transportationBookingControllerinstance = new transportationBookingController(new transportationBookingModel());

router.get("/booking/traveler/:travlerId", transportationBookingControllerinstance.getBookingByTravelerId.bind(transportationBookingControllerinstance));
router.get("/booking/provider/:providerId", transportationBookingControllerinstance.getBookingByTransporationProviderId.bind(transportationBookingControllerinstance));
router.post("/booking/status/", transportationBookingControllerinstance.updateBookingStatus.bind(transportationBookingControllerinstance));


module.exports = router;