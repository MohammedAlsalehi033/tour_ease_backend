import { OfferController } from "../../../controllers/rideSharing/OfferController/OfferController";
import { PrismaOfferModel } from "../../../models/rideSharing/offerModel";
import { FileUploaderForS3 } from "../../../utils/FileUploader";
import authMiddleware from '../../../middleware/authMiddleware';
export {};

const express = require('express');
const router = express.Router();
const offerController = new OfferController(new PrismaOfferModel(), new FileUploaderForS3());

// General offer routes
router.get("/offers",authMiddleware(), offerController.getAllOffers.bind(offerController));
router.get("/offers/:id", authMiddleware(), offerController.getOfferById.bind(offerController));
router.post("/offers", authMiddleware(), offerController.createOffer.bind(offerController));
router.put("/offers/:id/accept", authMiddleware(), offerController.acceptOffer.bind(offerController));
router.put("/offers/:id/reject", authMiddleware(), offerController.rejectOffer.bind(offerController));

// User-specific offer routes
router.get("/users/:userId/received-offers", authMiddleware(), offerController.getReceivedOffers.bind(offerController));
router.get("/users/:userId/sent-offers", authMiddleware(), offerController.getSentOffers.bind(offerController));
router.get("/users/:userId/offer-stats", authMiddleware(), offerController.getUserOfferStats.bind(offerController));

// Listing and request specific routes
router.get("/listings/:listingId/offers", authMiddleware(), offerController.getOffersForListing.bind(offerController));
router.get("/requests/:requestId/offers", authMiddleware(), offerController.getOffersForRequest.bind(offerController));

module.exports = router;