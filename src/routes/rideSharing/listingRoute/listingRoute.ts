import { Router } from "express";
import ListingController from "../../../controllers/rideSharing/listingController/listingController";
import ListingModel from "../../../models/rideSharing/listingModel";
import { FileUploaderForS3 } from "../../../utils/FileUploader";
import authMiddleware from "../../../middleware/authMiddleware";

const router = Router();

const listingController = new ListingController(new ListingModel(), new FileUploaderForS3());

router.post("/createRideSharingListing",authMiddleware(["transportationProvider" ]), listingController.createListing.bind(listingController));
router.get("/searchForNearByListing", authMiddleware(["transportationProvider" ]), listingController.findNearbyListings.bind(listingController));


module.exports = router;