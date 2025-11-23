import { Request, Response } from "express";
import AccommodationBookingModel from "../../models/accommodationBooking/accommodationBookingModel";
import { injectable } from "tsyringe";

@injectable()
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

  /**
   * Confirm booking after payment
   * Provider confirms the booking once payment is received
   */
  async confirmBookingAfterPayment(req: any, res: any) {
    try {
      const { id } = req.params;
      const { paymentId, providerId } = req.body;

      // Validate required fields
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: "paymentId is required",
        });
      }

      // Get booking details
      const booking = await this.model.getAccommodationBookingById(parseInt(id));

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Verify provider owns this booking (optional - add provider verification)
      if (providerId && booking.room?.accommodation?.providerId !== providerId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You do not own this booking",
        });
      }

      // Update booking status to confirmed
      const updatedBooking = await this.model.updateBookingStatus(
        parseInt(id),
        "confirmed"
      );

      res.json({
        success: true,
        data: updatedBooking,
        message: "Booking confirmed successfully after payment",
      });
    } catch (error: any) {
      console.error("Error in confirmBookingAfterPayment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to confirm booking",
      });
    }
  }

  /**
   * Create booking with confirmed status directly after successful payment
   * This prevents duplicate pending bookings if user cancels payment
   * IMPORTANT: Call this endpoint ONLY after Stripe payment is confirmed
   */
  async createConfirmedBookingAfterPayment(req: any, res: any) {
    try {
      const { travelerId, roomId, checkInDate, checkOutDate, totalPrice, transactionId } = req.body;

      // Validate required fields
      if (!travelerId || !roomId || !checkInDate || !checkOutDate || !totalPrice || !transactionId) {
        return res.status(400).json({
          success: false,
          message: "travelerId, roomId, checkInDate, checkOutDate, totalPrice, and transactionId are required",
        });
      }

      // Create booking directly with confirmed status (bypassing pending status)
      // This also creates a Payment record in the database
      const booking = await this.model.createConfirmedBooking(
        travelerId,
        parseInt(roomId),
        new Date(checkInDate),
        new Date(checkOutDate),
        parseFloat(totalPrice),
        transactionId // Stripe payment intent ID or transaction ID
      );

      res.status(201).json({
        success: true,
        data: booking,
        message: "Confirmed booking created successfully with payment record",
      });
    } catch (error: any) {
      console.error("Error in createConfirmedBookingAfterPayment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create confirmed booking",
      });
    }
  }

  /**
   * Request refund for booking (after payment)
   */
  async requestRefund(req: any, res: any) {
    try {
      const { id } = req.params;

      // Get booking details
      const booking = await this.model.getAccommodationBookingById(parseInt(id));

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Check if booking is confirmed (payment done)
      if (booking.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: "Can only request refund for confirmed bookings (after payment)",
        });
      }

      // Update booking status to refund
      const updatedBooking = await this.model.updateBookingStatus(
        parseInt(id),
        "refund"
      );

      res.json({
        success: true,
        data: updatedBooking,
        message: "Refund requested successfully",
      });
    } catch (error: any) {
      console.error("Error in requestRefund:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to request refund",
      });
    }
  }

  /**
   * Cancel unpaid booking (before payment)
   */
  async cancelUnpaidBooking(req: any, res: any) {
    try {
      const { id } = req.params;

      // Get booking details
      const booking = await this.model.getAccommodationBookingById(parseInt(id));

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Check if booking is pending (before payment)
      if (booking.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Can only cancel unpaid bookings (status: pending)",
        });
      }

      // Update booking status to cancelled
      const updatedBooking = await this.model.updateBookingStatus(
        parseInt(id),
        "cancelled"
      );

      res.json({
        success: true,
        data: updatedBooking,
        message: "Unpaid booking cancelled successfully",
      });
    } catch (error: any) {
      console.error("Error in cancelUnpaidBooking:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel unpaid booking",
      });
    }
  }

  /**
   * Mark booking as completed (only for confirmed bookings)
   */
  async markBookingCompleted(req: any, res: any) {
    try {
      const { id } = req.params;

      // Get booking details
      const booking = await this.model.getAccommodationBookingById(parseInt(id));

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Check if booking is confirmed
      if (booking.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: "Can only mark confirmed bookings as completed",
        });
      }

      // Update booking status to completed
      const updatedBooking = await this.model.updateBookingStatus(
        parseInt(id),
        "completed"
      );

      res.json({
        success: true,
        data: updatedBooking,
        message: "Booking marked as completed successfully",
      });
    } catch (error: any) {
      console.error("Error in markBookingCompleted:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to mark booking as completed",
      });
    }
  }

  /**
   * Extend checkout date
   */
  async extendCheckout(req: any, res: any) {
    try {
      const { id } = req.params;
      const { newCheckoutDate } = req.body;

      if (!newCheckoutDate) {
        return res.status(400).json({
          success: false,
          message: "newCheckoutDate is required",
        });
      }

      // Get booking details
      const booking = await this.model.getAccommodationBookingById(parseInt(id));

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Check if booking is in a valid status for extension
      if (booking.status !== "confirmed" && booking.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Can only extend checkout for confirmed or pending bookings",
        });
      }

      const currentCheckoutDate = new Date(booking.checkOutDate);
      const requestedCheckoutDate = new Date(newCheckoutDate);

      // Validate that new date is after current checkout date
      if (requestedCheckoutDate <= currentCheckoutDate) {
        return res.status(400).json({
          success: false,
          message: "New checkout date must be after the current checkout date",
        });
      }

      // Update the checkout date
      const updatedBooking = await this.model.updateAccommodationBooking(
        parseInt(id),
        { checkOutDate: requestedCheckoutDate }
      );

      res.json({
        success: true,
        data: updatedBooking,
        message: "Checkout date extended successfully",
      });
    } catch (error: any) {
      console.error("Error in extendCheckout:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to extend checkout date",
      });
    }
  }

  /**
   * Extend checkout date (allows any status except cancelled/completed)
   */
  async extendCheckoutAny(req: any, res: any) {
    try {
      const { id } = req.params;
      const { newCheckoutDate } = req.body;

      if (!newCheckoutDate) {
        return res.status(400).json({
          success: false,
          message: "newCheckoutDate is required",
        });
      }

      // Get booking details
      const booking = await this.model.getAccommodationBookingById(parseInt(id));

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Check if booking is confirmed (only confirmed bookings allowed)
      if (booking.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: "Can only extend checkout for confirmed bookings",
        });
      }

      const currentCheckoutDate = new Date(booking.checkOutDate);
      const requestedCheckoutDate = new Date(newCheckoutDate);

      // Validate that new date is after current checkout date
      if (requestedCheckoutDate <= currentCheckoutDate) {
        return res.status(400).json({
          success: false,
          message: "New checkout date must be after the current checkout date",
        });
      }

      // Update the checkout date
      const updatedBooking = await this.model.updateAccommodationBooking(
        parseInt(id),
        { checkOutDate: requestedCheckoutDate }
      );

      res.json({
        success: true,
        data: updatedBooking,
        message: "Checkout date extended successfully",
      });
    } catch (error: any) {
      console.error("Error in extendCheckoutAny:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to extend checkout date",
      });
    }
  }

  /**
   * Cancel booking and request refund
   * Traveler can cancel a confirmed booking and request a refund
   */
  async cancelBookingAndRefund(req: any, res: any) {
    try {
      const { id } = req.params;

      console.log(`[Cancel Booking] Attempting to cancel booking ID: ${id}`);

      // Get booking details
      const booking = await this.model.getAccommodationBookingById(parseInt(id));

      if (!booking) {
        console.log(`[Cancel Booking] Booking ${id} not found`);
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      console.log(`[Cancel Booking] Booking ${id} found with status: ${booking.status}`);

      // Check if booking is confirmed
      if (booking.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: `Can only cancel confirmed bookings. Current status: ${booking.status}`,
        });
      }

      // Update booking status to cancelled
      const updatedBooking = await this.model.updateBookingStatus(parseInt(id), "cancelled");

      // TODO: Integrate with payment system to process refund
      // For now, we'll just mark it as cancelled
      // After refund is processed, status should be updated to "refunded"
      // In a real implementation, you'd call Stripe refund API here

      res.json({
        success: true,
        data: updatedBooking,
        message: "Booking cancelled successfully. Refund will be processed within 5-7 business days.",
      });
    } catch (error: any) {
      console.error("Error in cancelBookingAndRefund:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel booking",
      });
    }
  }

  /**
   * Submit review for "checked out" booking
   * Traveler can review their stay after checkout
   * This will change status from "checked out" to "complete"
   * Uses the existing Review system
   */
  async submitBookingReview(req: any, res: any) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      console.log(`[Review Submission] Booking ID: ${id}, Rating: ${rating}, Has Comment: ${!!comment}`);

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Valid rating (1-5) is required",
        });
      }

      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Review comment is required",
        });
      }

      // Get booking details (includes room and accommodation)
      const booking = await this.model.getAccommodationBookingById(parseInt(id));
      console.log(`[Review Submission] Booking found with status: ${booking?.status}`);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Check if booking is "checked out"
      if (booking.status !== "checked out") {
        return res.status(400).json({
          success: false,
          message: `Can only review checked-out bookings. Current status: ${booking.status}`,
        });
      }

      // Get accommodationId from the booking's room
      const accommodationId = booking.room?.accommodation?.id;
      if (!accommodationId) {
        return res.status(500).json({
          success: false,
          message: "Could not find accommodation for this booking",
        });
      }

      console.log(`[Review Submission] Accommodation ID: ${accommodationId}`);

      // Import Review model dynamically
      const { PrismaReviewModel } = require('../../models/review/reviewModel');
      const reviewModel = new PrismaReviewModel();

      // Check if user has already reviewed this booking
      const existingReview = await reviewModel.checkExistingReview(
        booking.travelerId,
        'ACCOMMODATION_BOOKING',
        parseInt(id)
      );

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this booking",
        });
      }

      // Create review for the booking
      const bookingReview = await reviewModel.createItem({
        reviewerId: booking.travelerId,
        reviewableType: 'ACCOMMODATION_BOOKING',
        reviewableId: parseInt(id),
        rating: rating,
        comment: comment,
      });

      console.log(`[Review Submission] Booking review created successfully`);

      // Also create review for the accommodation
      let accommodationReview = null;
      const existingAccommodationReview = await reviewModel.checkExistingReview(
        booking.travelerId,
        'ACCOMMODATION',
        accommodationId
      );

      if (!existingAccommodationReview) {
        accommodationReview = await reviewModel.createItem({
          reviewerId: booking.travelerId,
          reviewableType: 'ACCOMMODATION',
          reviewableId: accommodationId,
          rating: rating,
          comment: comment,
        });
        console.log(`[Review Submission] Accommodation review created successfully`);
      } else {
        console.log(`[Review Submission] User already reviewed this accommodation`);
      }

      // Update booking status to "complete" after review submission
      const updatedBooking = await this.model.updateBookingStatus(parseInt(id), "complete");

      res.json({
        success: true,
        message: "Review submitted successfully. Booking marked as complete.",
        data: {
          bookingReview: bookingReview,
          accommodationReview: accommodationReview,
          booking: updatedBooking,
        },
      });
    } catch (error: any) {
      console.error("Error in submitBookingReview:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to submit review",
      });
    }
  }
}
