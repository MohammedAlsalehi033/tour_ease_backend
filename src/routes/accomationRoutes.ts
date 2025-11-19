export {};
import express from "express";
import AccommodationProviderController from "../controllers/accommodationProvider/accommodationProviderController";
import AccommodationController from "../controllers/accommodation/accommodationController";
import RoomController from "../controllers/room/roomController";
import AccommodationBookingController from "../controllers/accommodationBooking/accommodationBookingController";
import AccommodationProviderModel from "../models/accommodationProvider/accommodationProviderModel";
import AccommodationModel from "../models/accommodation/accommodationModel";
import RoomModel from "../models/room/roomModel";
import AccommodationBookingModel from "../models/accommodationBooking/accommodationBookingModel";

const router = express.Router();

// Initialize models
const accommodationProviderModel = new AccommodationProviderModel();
const accommodationModel = new AccommodationModel();
const roomModel = new RoomModel();
const accommodationBookingModel = new AccommodationBookingModel();

// Initialize controllers
const accommodationProviderController = new AccommodationProviderController(accommodationProviderModel);
const accommodationController = new AccommodationController(accommodationModel);
const roomController = new RoomController(roomModel);
const accommodationBookingController = new AccommodationBookingController(accommodationBookingModel);

// ==================== ACCOMMODATION PROVIDER ROUTES ====================

// Create accommodation provider
router.post(
  "/provider",
  accommodationProviderController.createAccommodationProvider.bind(accommodationProviderController)
);

// Get all accommodation providers
router.get(
  "/provider",
  accommodationProviderController.getAllAccommodationProviders.bind(accommodationProviderController)
);

// Get accommodation provider by ID
router.get(
  "/provider/:id",
  accommodationProviderController.getAccommodationProviderById.bind(accommodationProviderController)
);

// Update accommodation provider
router.put(
  "/provider/:id",
  accommodationProviderController.updateAccommodationProvider.bind(accommodationProviderController)
);

// Delete accommodation provider
router.delete(
  "/provider/:id",
  accommodationProviderController.deleteAccommodationProvider.bind(accommodationProviderController)
);

// Get accommodations by provider
router.get(
  "/provider/:id/accommodations",
  accommodationProviderController.getAccommodationsByProvider.bind(accommodationProviderController)
);

// ==================== ACCOMMODATION ROUTES ====================

// Create accommodation
router.post(
  "/accommodation",
  accommodationController.createAccommodation.bind(accommodationController)
);

// Get all accommodations
router.get(
  "/accommodation",
  accommodationController.getAllAccommodations.bind(accommodationController)
);

// Search accommodations by location
router.get(
  "/accommodation/search",
  accommodationController.searchAccommodationsByLocation.bind(accommodationController)
);

// Get accommodation by ID
router.get(
  "/accommodation/:id",
  accommodationController.getAccommodationById.bind(accommodationController)
);

// Update accommodation
router.put(
  "/accommodation/:id",
  accommodationController.updateAccommodation.bind(accommodationController)
);

// Delete accommodation
router.delete(
  "/accommodation/:id",
  accommodationController.deleteAccommodation.bind(accommodationController)
);

// ==================== ROOM ROUTES ====================

// Create room
router.post(
  "/room",
  roomController.createRoom.bind(roomController)
);

// Get all rooms
router.get(
  "/room",
  roomController.getAllRooms.bind(roomController)
);

// Get room by ID
router.get(
  "/room/:id",
  roomController.getRoomById.bind(roomController)
);

// Update room
router.put(
  "/room/:id",
  roomController.updateRoom.bind(roomController)
);

// Delete room
router.delete(
  "/room/:id",
  roomController.deleteRoom.bind(roomController)
);

// Get rooms by accommodation
router.get(
  "/accommodation/:accommodationId/rooms",
  roomController.getRoomsByAccommodation.bind(roomController)
);

// Check room availability
router.get(
  "/room/:roomId/availability",
  roomController.checkRoomAvailability.bind(roomController)
);

// Debug booking data
router.get(
  "/accommodation/:accommodationId/debug-bookings",
  roomController.debugBookings.bind(roomController)
);

// ==================== ACCOMMODATION BOOKING ROUTES ====================

// Create accommodation booking
router.post(
  "/booking",
  accommodationBookingController.createAccommodationBooking.bind(accommodationBookingController)
);

// Get all accommodation bookings
router.get(
  "/booking",
  accommodationBookingController.getAllAccommodationBookings.bind(accommodationBookingController)
);

// Get accommodation booking by ID
router.get(
  "/booking/:id",
  accommodationBookingController.getAccommodationBookingById.bind(accommodationBookingController)
);

// Update booking status
router.patch(
  "/booking/:id/status",
  accommodationBookingController.updateBookingStatus.bind(accommodationBookingController)
);

// Update accommodation booking
router.put(
  "/booking/:id",
  accommodationBookingController.updateAccommodationBooking.bind(accommodationBookingController)
);

// Cancel accommodation booking
router.patch(
  "/booking/:id/cancel",
  accommodationBookingController.cancelAccommodationBooking.bind(accommodationBookingController)
);

// Delete accommodation booking
router.delete(
  "/booking/:id",
  accommodationBookingController.deleteAccommodationBooking.bind(accommodationBookingController)
);

// Get bookings by traveler
router.get(
  "/booking/traveler/:travelerId",
  accommodationBookingController.getBookingsByTraveler.bind(accommodationBookingController)
);

// Get bookings by provider
router.get(
  "/booking/provider/:providerId",
  accommodationBookingController.getBookingsByProvider.bind(accommodationBookingController)
);

module.exports = router;
