export {};
import express from "express";
import AccommodationController from "../../controllers/accommodation/accommodationController";
import AccommodationModel from "../../models/accommodation/accommodationModel";

const router = express.Router();
const accommodationModel = new AccommodationModel();
const accommodationController = new AccommodationController(accommodationModel);

// Create accommodation
router.post(
  "/",
  accommodationController.createAccommodation.bind(accommodationController)
);

// Get all accommodations
router.get(
  "/",
  accommodationController.getAllAccommodations.bind(accommodationController)
);

// Search accommodations by location
router.get(
  "/search",
  accommodationController.searchAccommodationsByLocation.bind(
    accommodationController
  )
);

// Debug: Check stored mediaUrls
router.get(
  "/debug/:id/media-urls",
  accommodationController.debugMediaUrls.bind(accommodationController)
);

// Get accommodation dashboard (home screen data)
router.get(
  "/:id/dashboard",
  accommodationController.getAccommodationDashboard.bind(
    accommodationController
  )
);

// Get accommodation by ID
router.get(
  "/:id",
  accommodationController.getAccommodationById.bind(accommodationController)
);

// Update accommodation
router.put(
  "/:id",
  accommodationController.updateAccommodation.bind(accommodationController)
);

// Delete accommodation
router.delete(
  "/:id",
  accommodationController.deleteAccommodation.bind(accommodationController)
);

module.exports = router;
