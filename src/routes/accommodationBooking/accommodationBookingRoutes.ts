export {};
import express from "express";
import AccommodationBookingController from "../../controllers/accommodationBooking/accommodationBookingController";
import AccommodationBookingModel from "../../models/accommodationBooking/accommodationBookingModel";
import authMiddleware from '../../middleware/authMiddleware';

const router = express.Router();
const accommodationBookingModel = new AccommodationBookingModel();
const accommodationBookingController = new AccommodationBookingController(
  accommodationBookingModel
);

// Create confirmed booking directly after payment (NO pending status)
// MUST be before the generic POST "/" route to avoid routing conflicts
router.post(
  "/create-confirmed",
  accommodationBookingController.createConfirmedBookingAfterPayment.bind(
    accommodationBookingController
  )
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

// IMPORTANT: Specific routes must come BEFORE generic /:id routes
// to avoid routing conflicts

// Get bookings by traveler (specific path, must be before /:id)
router.get(
  "/traveler/:travelerId",
  accommodationBookingController.getBookingsByTraveler.bind(
    accommodationBookingController
  )
);

// Cancel booking and request refund (Traveler endpoint) - BEFORE /:id routes
router.patch(
  "/:id/cancel-and-refund",
  accommodationBookingController.cancelBookingAndRefund.bind(
    accommodationBookingController
  )
);

// Submit review for completed booking (Traveler endpoint) - BEFORE /:id routes
router.post(
  "/:id/review",
  accommodationBookingController.submitBookingReview.bind(
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

// Confirm booking after payment (Provider endpoint)
router.patch(
  "/:id/confirm",
  accommodationBookingController.confirmBookingAfterPayment.bind(
    accommodationBookingController
  )
);

// Request refund for booking (before payment)
router.patch(
  "/:id/refund",
  accommodationBookingController.requestRefund.bind(
    accommodationBookingController
  )
);

// Cancel unpaid booking
router.patch(
  "/:id/cancel-unpaid",
  accommodationBookingController.cancelUnpaidBooking.bind(
    accommodationBookingController
  )
);

// Mark booking as completed
router.patch(
  "/:id/complete",
  accommodationBookingController.markBookingCompleted.bind(
    accommodationBookingController
  )
);

// Extend checkout date
router.patch(
  "/:id/extend-checkout",
  accommodationBookingController.extendCheckout.bind(
    accommodationBookingController
  )
);

// Extend checkout date (allows any status except cancelled/completed)
router.patch(
  "/:id/extend-checkout-any",
  accommodationBookingController.extendCheckoutAny.bind(
    accommodationBookingController
  )
);

// Cancel booking (generic cancel)
router.patch(
  "/:id/cancel",
  accommodationBookingController.cancelAccommodationBooking.bind(
    accommodationBookingController
  )
);

// Get booking by ID - AFTER all specific /:id/* routes
router.get(
  "/:id",
  accommodationBookingController.getAccommodationBookingById.bind(
    accommodationBookingController
  )
);

// Update booking - AFTER all specific /:id/* routes
router.put(
  "/:id",
  accommodationBookingController.updateAccommodationBooking.bind(
    accommodationBookingController
  )
);

// Delete booking - AFTER all specific /:id/* routes
router.delete(
  "/:id",
  accommodationBookingController.deleteAccommodationBooking.bind(
    accommodationBookingController
  )
);

// Get bookings by provider - must be before generic /:id routes
router.get(
  "/provider/:providerId",
  accommodationBookingController.getBookingsByProvider.bind(
    accommodationBookingController
  )
);

module.exports = router;
