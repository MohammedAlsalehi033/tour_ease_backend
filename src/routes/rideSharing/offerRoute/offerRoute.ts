import { OfferController } from "../../../controllers/rideSharing/OfferController/OfferController";
import { PrismaOfferModel } from "../../../models/rideSharing/offerModel";
import { FileUploaderForS3 } from "../../../utils/FileUploader";
export {};

const express = require('express');
const router = express.Router();
const offerController = new OfferController(new PrismaOfferModel(), new FileUploaderForS3());

// General offer routes
router.get("/offers", offerController.getAllOffers.bind(offerController));
router.get("/offers/:id", offerController.getOfferById.bind(offerController));
router.post("/offers", offerController.createOffer.bind(offerController));
router.put("/offers/:id/accept", offerController.acceptOffer.bind(offerController));
router.put("/offers/:id/reject", offerController.rejectOffer.bind(offerController));

// User-specific offer routes
router.get("/users/:userId/received-offers", offerController.getReceivedOffers.bind(offerController));
router.get("/users/:userId/sent-offers", offerController.getSentOffers.bind(offerController));
router.get("/users/:userId/offer-stats", offerController.getUserOfferStats.bind(offerController));

// Listing and request specific routes
router.get("/listings/:listingId/offers", offerController.getOffersForListing.bind(offerController));
router.get("/requests/:requestId/offers", offerController.getOffersForRequest.bind(offerController));

module.exports = router;