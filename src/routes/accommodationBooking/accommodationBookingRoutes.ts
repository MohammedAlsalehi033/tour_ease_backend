export {};
import express from "express";
import AccommodationBookingController from "../../controllers/accommodationBooking/accommodationBookingController";
import AccommodationBookingModel from "../../models/accommodationBooking/accommodationBookingModel";

const router = express.Router();
const accommodationBookingModel = new AccommodationBookingModel();
const accommodationBookingController = new AccommodationBookingController(
  accommodationBookingModel
);

// Create accommodation booking
router.post(
  "/",
  accommodationBookingController.createAccommodationBooking.bind(
    accommodationBookingController
  )
);

// Get all bookings
router.get(
  "/",
  accommodationBookingController.getAllAccommodationBookings.bind(
    accommodationBookingController
  )
);

// Get booking by ID
router.get(
  "/:id",
  accommodationBookingController.getAccommodationBookingById.bind(
    accommodationBookingController
  )
);

// Update booking status
router.patch(
  "/:id/status",
  accommodationBookingController.updateBookingStatus.bind(
    accommodationBookingController
  )
);

// Update booking
router.put(
  "/:id",
  accommodationBookingController.updateAccommodationBooking.bind(
    accommodationBookingController
  )
);

// Cancel booking
router.patch(
  "/:id/cancel",
  accommodationBookingController.cancelAccommodationBooking.bind(
    accommodationBookingController
  )
);

// Delete booking
router.delete(
  "/:id",
  accommodationBookingController.deleteAccommodationBooking.bind(
    accommodationBookingController
  )
);

// Get bookings by traveler
router.get(
  "/traveler/:travelerId",
  accommodationBookingController.getBookingsByTraveler.bind(
    accommodationBookingController
  )
);

// Get bookings by provider
router.get(
  "/provider/:providerId",
  accommodationBookingController.getBookingsByProvider.bind(
    accommodationBookingController
  )
);

module.exports = router;
