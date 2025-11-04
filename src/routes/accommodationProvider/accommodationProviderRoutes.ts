export {};
import express from "express";
import AccommodationProviderController from "../../controllers/accommodationProvider/accommodationProviderController";
import AccommodationProviderModel from "../../models/accommodationProvider/accommodationProviderModel";

const router = express.Router();
const accommodationProviderModel = new AccommodationProviderModel();
const accommodationProviderController = new AccommodationProviderController(
  accommodationProviderModel
);

// Complete registration endpoint (provider + accommodation + rooms + role update)
router.post(
  "/register-complete",
  accommodationProviderController.registerCompleteProvider.bind(
    accommodationProviderController
  )
);

// Create accommodation provider
router.post(
  "/",
  accommodationProviderController.createAccommodationProvider.bind(
    accommodationProviderController
  )
);

// Get all providers
router.get(
  "/",
  accommodationProviderController.getAllAccommodationProviders.bind(
    accommodationProviderController
  )
);

// Get provider by ID
router.get(
  "/:id",
  accommodationProviderController.getAccommodationProviderById.bind(
    accommodationProviderController
  )
);

// Update provider
router.put(
  "/:id",
  accommodationProviderController.updateAccommodationProvider.bind(
    accommodationProviderController
  )
);

// Delete provider
router.delete(
  "/:id",
  accommodationProviderController.deleteAccommodationProvider.bind(
    accommodationProviderController
  )
);

// Get provider's accommodations
router.get(
  "/:id/accommodations",
  accommodationProviderController.getAccommodationsByProvider.bind(
    accommodationProviderController
  )
);

module.exports = router;
