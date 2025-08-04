import { Router } from "express";
import ListingController from "../../../controllers/rideSharing/listingController/listingController";
import ListingModel from "../../../models/rideSharing/listingModel";
import { FileUploaderForS3 } from "../../../utils/FileUploader";

const router = Router();

const listingController = new ListingController(new ListingModel(), new FileUploaderForS3());

router.post("/createRideSharingListing", listingController.createListing.bind(listingController));
router.get("/searchForNearByListing", listingController.findNearbyListings.bind(listingController));


module.exports = router;