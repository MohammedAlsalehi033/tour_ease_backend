import { Request, Response } from "express";
import RoomModel from "../../models/room/roomModel";

export default class RoomController {
  private model: RoomModel;

  constructor(model: RoomModel) {
    this.model = model;
  }

  /**
   * Create room
   */
  async createRoom(req: any, res: any) {
    try {
      const { accommodationId, roomType, pricePerNight, capacity, mediaUrls } = req.body;

      if (!accommodationId || !roomType || !pricePerNight || !capacity) {
        return res.status(400).json({
          success: false,
          message: "accommodationId, roomType, pricePerNight, and capacity are required",
        });
      }

      const room = await this.model.createRoom(
        parseInt(accommodationId),
        roomType,
        parseFloat(pricePerNight),
        parseInt(capacity),
        mediaUrls || []
      );

      res.status(201).json({
        success: true,
        data: room,
        message: "Room created successfully",
      });
    } catch (error: any) {
      console.error("Error in createRoom:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create room",
      });
    }
  }

  /**
   * Get room by ID
   */
  async getRoomById(req: any, res: any) {
    try {
      const { id } = req.params;

      const room = await this.model.getRoomById(parseInt(id));

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      res.json({
        success: true,
        data: room,
      });
    } catch (error: any) {
      console.error("Error in getRoomById:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get room",
      });
    }
  }

  /**
   * Get all rooms
   */
  async getAllRooms(req: any, res: any) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const filter: any = {};
      if (req.query.accommodationId) filter.accommodationId = parseInt(req.query.accommodationId);
      if (req.query.roomType) filter.roomType = req.query.roomType;
      if (req.query.minPrice) filter.minPrice = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.maxPrice = parseFloat(req.query.maxPrice);
      if (req.query.capacity) filter.capacity = parseInt(req.query.capacity);

      const result = await this.model.getAllRooms(
        page,
        pageSize,
        Object.keys(filter).length > 0 ? filter : undefined
      );

      res.json({
        success: true,
        data: result.rooms,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error("Error in getAllRooms:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get rooms",
      });
    }
  }

  /**
   * Update room
   */
  async updateRoom(req: any, res: any) {
    try {
      const { id } = req.params;
      const { roomType, pricePerNight, capacity, mediaUrls } = req.body;

      const data: any = {};
      if (roomType) data.roomType = roomType;
      if (pricePerNight) data.pricePerNight = parseFloat(pricePerNight);
      if (capacity) data.capacity = parseInt(capacity);
      if (mediaUrls) data.mediaUrls = mediaUrls;

      const room = await this.model.updateRoom(parseInt(id), data);

      res.json({
        success: true,
        data: room,
        message: "Room updated successfully",
      });
    } catch (error: any) {
      console.error("Error in updateRoom:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update room",
      });
    }
  }

  /**
   * Delete room
   */
  async deleteRoom(req: any, res: any) {
    try {
      const { id } = req.params;

      await this.model.deleteRoom(parseInt(id));

      res.json({
        success: true,
        message: "Room deleted successfully",
      });
    } catch (error: any) {
      console.error("Error in deleteRoom:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete room",
      });
    }
  }

  /**
   * Get rooms by accommodation
   */
  async getRoomsByAccommodation(req: any, res: any) {
    try {
      const { accommodationId } = req.params;

      const rooms = await this.model.getRoomsByAccommodation(parseInt(accommodationId));

      res.json({
        success: true,
        data: rooms,
      });
    } catch (error: any) {
      console.error("Error in getRoomsByAccommodation:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get rooms",
      });
    }
  }

  /**
   * Check room availability
   */
  async checkRoomAvailability(req: any, res: any) {
    try {
      const { roomId } = req.params;
      const { checkInDate, checkOutDate } = req.query;

      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({
          success: false,
          message: "checkInDate and checkOutDate are required",
        });
      }

      const isAvailable = await this.model.checkRoomAvailability(
        parseInt(roomId),
        new Date(checkInDate),
        new Date(checkOutDate)
      );

      res.json({
        success: true,
        data: {
          roomId: parseInt(roomId),
          available: isAvailable,
          checkInDate,
          checkOutDate,
        },
      });
    } catch (error: any) {
      console.error("Error in checkRoomAvailability:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check room availability",
      });
    }
  }
}
