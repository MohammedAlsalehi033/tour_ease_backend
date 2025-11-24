export {};
import express from "express";
import multer from "multer";
import AccommodationController from "../../controllers/accommodation/accommodationController";
import AccommodationModel from "../../models/accommodation/accommodationModel";

const router = express.Router();
const accommodationModel = new AccommodationModel();
const accommodationController = new AccommodationController(accommodationModel);

// Multer configuration for image uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// Update accommodation (PUT - full update)
router.put(
  "/:id",
  accommodationController.updateAccommodation.bind(accommodationController)
);

// Update accommodation (PATCH - partial update)
router.patch(
  "/:id",
  accommodationController.updateAccommodation.bind(accommodationController)
);

// Update accommodation image
router.post(
  "/:id/image",
  upload.single('images'),
  accommodationController.updateAccommodationImage.bind(accommodationController)
);

// Delete accommodation
router.delete(
  "/:id",
  accommodationController.deleteAccommodation.bind(accommodationController)
);

module.exports = router;
