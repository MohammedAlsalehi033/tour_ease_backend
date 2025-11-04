import { Request, Response } from "express";
import AccommodationBookingModel from "../../models/accommodationBooking/accommodationBookingModel";

export default class AccommodationBookingController {
  private model: AccommodationBookingModel;

  constructor(model: AccommodationBookingModel) {
    this.model = model;
  }

  /**
   * Create accommodation booking
   */
  async createAccommodationBooking(req: any, res: any) {
    try {
      const { travelerId, roomId, checkInDate, checkOutDate, totalPrice } = req.body;

      if (!travelerId || !roomId || !checkInDate || !checkOutDate || !totalPrice) {
        return res.status(400).json({
          success: false,
          message: "travelerId, roomId, checkInDate, checkOutDate, and totalPrice are required",
        });
      }

      const booking = await this.model.createAccommodationBooking(
        travelerId,
        parseInt(roomId),
        new Date(checkInDate),
        new Date(checkOutDate),
        parseFloat(totalPrice)
      );

      res.status(201).json({
        success: true,
        data: booking,
        message: "Accommodation booking created successfully",
      });
    } catch (error: any) {
      console.error("Error in createAccommodationBooking:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create accommodation booking",
      });
    }
  }

  /**
   * Get accommodation booking by ID
   */
  async getAccommodationBookingById(req: any, res: any) {
    try {
      const { id } = req.params;

      const booking = await this.model.getAccommodationBookingById(parseInt(id));

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Accommodation booking not found",
        });
      }

      res.json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      console.error("Error in getAccommodationBookingById:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get accommodation booking",
      });
    }
  }

  /**
   * Get all accommodation bookings
   */
  async getAllAccommodationBookings(req: any, res: any) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const filter: any = {};
      if (req.query.travelerId) filter.travelerId = req.query.travelerId;
      if (req.query.roomId) filter.roomId = parseInt(req.query.roomId);
      if (req.query.status) filter.status = req.query.status;
      if (req.query.startDate) filter.startDate = new Date(req.query.startDate);
      if (req.query.endDate) filter.endDate = new Date(req.query.endDate);

      const result = await this.model.getAllAccommodationBookings(
        page,
        pageSize,
        Object.keys(filter).length > 0 ? filter : undefined
      );

      res.json({
        success: true,
        data: result.bookings,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error("Error in getAllAccommodationBookings:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get accommodation bookings",
      });
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const booking = await this.model.updateBookingStatus(parseInt(id), status);

      res.json({
        success: true,
        data: booking,
        message: "Booking status updated successfully",
      });
    } catch (error: any) {
      console.error("Error in updateBookingStatus:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update booking status",
      });
    }
  }

  /**
   * Update accommodation booking
   */
  async updateAccommodationBooking(req: any, res: any) {
    try {
      const { id } = req.params;
      const { checkInDate, checkOutDate, totalPrice, status } = req.body;

      const data: any = {};
      if (checkInDate) data.checkInDate = new Date(checkInDate);
      if (checkOutDate) data.checkOutDate = new Date(checkOutDate);
      if (totalPrice) data.totalPrice = parseFloat(totalPrice);
      if (status) data.status = status;

      const booking = await this.model.updateAccommodationBooking(parseInt(id), data);

      res.json({
        success: true,
        data: booking,
        message: "Accommodation booking updated successfully",
      });
    } catch (error: any) {
      console.error("Error in updateAccommodationBooking:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update accommodation booking",
      });
    }
  }

  /**
   * Cancel accommodation booking
   */
  async cancelAccommodationBooking(req: any, res: any) {
    try {
      const { id } = req.params;

      const booking = await this.model.cancelAccommodationBooking(parseInt(id));

      res.json({
        success: true,
        data: booking,
        message: "Accommodation booking cancelled successfully",
      });
    } catch (error: any) {
      console.error("Error in cancelAccommodationBooking:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel accommodation booking",
      });
    }
  }

  /**
   * Delete accommodation booking
   */
  async deleteAccommodationBooking(req: any, res: any) {
    try {
      const { id } = req.params;

      await this.model.deleteAccommodationBooking(parseInt(id));

      res.json({
        success: true,
        message: "Accommodation booking deleted successfully",
      });
    } catch (error: any) {
      console.error("Error in deleteAccommodationBooking:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete accommodation booking",
      });
    }
  }

  /**
   * Get bookings by traveler
   */
  async getBookingsByTraveler(req: any, res: any) {
    try {
      const { travelerId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const result = await this.model.getBookingsByTraveler(travelerId, page, pageSize);

      res.json({
        success: true,
        data: result.bookings,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error("Error in getBookingsByTraveler:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get bookings",
      });
    }
  }

  /**
   * Get bookings by provider
   */
  async getBookingsByProvider(req: any, res: any) {
    try {
      const { providerId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const filter: any = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.startDate) filter.startDate = new Date(req.query.startDate);
      if (req.query.endDate) filter.endDate = new Date(req.query.endDate);

      const result = await this.model.getBookingsByProvider(
        providerId,
        page,
        pageSize,
        Object.keys(filter).length > 0 ? filter : undefined
      );

      res.json({
        success: true,
        data: result.bookings,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error("Error in getBookingsByProvider:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get bookings",
      });
    }
  }
}
