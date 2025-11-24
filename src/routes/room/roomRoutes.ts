export {};
import express from "express";
import RoomController from "../../controllers/room/roomController";
import RoomModel from "../../models/room/roomModel";

const router = express.Router();
const roomModel = new RoomModel();
const roomController = new RoomController(roomModel);

// Create room
router.post("/", roomController.createRoom.bind(roomController));

// Get all rooms
router.get("/", roomController.getAllRooms.bind(roomController));

// Search available rooms (must be before /:id route to avoid path conflicts)
router.get(
  "/search/available",
  roomController.searchAvailableRooms.bind(roomController)
);

// Get room by ID
router.get("/:id", roomController.getRoomById.bind(roomController));

// Update room
router.put("/:id", roomController.updateRoom.bind(roomController));
router.patch("/:id", roomController.updateRoom.bind(roomController));

// Update room images
router.post("/:id/images", roomController.updateRoomImages.bind(roomController));

// Delete room
router.delete("/:id", roomController.deleteRoom.bind(roomController));

// Get rooms by accommodation
router.get(
  "/accommodation/:accommodationId",
  roomController.getRoomsByAccommodation.bind(roomController)
);

// Check room availability
router.get(
  "/:roomId/availability",
  roomController.checkRoomAvailability.bind(roomController)
);

// Get rooms with occupancy status by provider ID
router.get(
  "/provider/:providerId/occupancy",
  roomController.getRoomsWithOccupancy.bind(roomController)
);

module.exports = router;
