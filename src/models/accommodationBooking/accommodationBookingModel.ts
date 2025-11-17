import { prisma } from "../../utils/prismaClient";
import { AccommodationBooking } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export default class AccommodationBookingModel {
  /**
   * Create a new accommodation booking
   */
  async createAccommodationBooking(
    travelerId: string,
    roomId: number,
    checkInDate: Date,
    checkOutDate: Date,
    totalPrice: number
  ): Promise<AccommodationBooking> {
    try {
      const booking = await prisma.accommodationBooking.create({
        data: {
          travelerId,
          roomId,
          checkInDate,
          checkOutDate,
          totalPrice: new Decimal(totalPrice),
          status: "pending",
        },
        include: {
          room: {
            include: {
              accommodation: {
                include: {
                  provider: true,
                },
              },
            },
          },
          traveler: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });
      return booking;
    } catch (error) {
      console.error("Error creating accommodation booking:", error);
      throw error;
    }
  }

  /**
   * Create a booking with confirmed status directly after successful payment
   * This prevents duplicate pending bookings if the user cancels payment
   * IMPORTANT: Call this ONLY after payment is confirmed in Stripe
   * We don't store paymentId in DB - it's only used for reference
   */
  async createConfirmedBooking(
    travelerId: string,
    roomId: number,
    checkInDate: Date,
    checkOutDate: Date,
    totalPrice: number,
    paymentId: string // For reference only, not stored in DB
  ): Promise<AccommodationBooking> {
    try {
      const booking = await prisma.accommodationBooking.create({
        data: {
          travelerId,
          roomId,
          checkInDate,
          checkOutDate,
          totalPrice: new Decimal(totalPrice),
          status: "confirmed", // Create directly with confirmed status, NOT pending
          // paymentId is passed for reference but we don't store it in the booking table
        },
        include: {
          room: {
            include: {
              accommodation: {
                include: {
                  provider: true,
                },
              },
            },
          },
          traveler: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });
      console.log(`✅ Confirmed booking created after successful payment (Payment ID: ${paymentId})`);
      return booking;
    } catch (error) {
      console.error("Error creating confirmed booking:", error);
      throw error;
    }
  }

  /**
   * Get accommodation booking by ID
   */
  async getAccommodationBookingById(id: number): Promise<any | null> {
    try {
      const booking = await prisma.accommodationBooking.findUnique({
        where: { id },
        include: {
          room: {
            include: {
              accommodation: {
                include: {
                  provider: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          username: true,
                          email: true,
                          phoneNumber: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          traveler: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
              mediaUrls: true,
            },
          },
          payment: true,
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  username: true,
                  mediaUrls: true,
                },
              },
            },
          },
        },
      });
      return booking;
    } catch (error) {
      console.error("Error getting accommodation booking:", error);
      throw error;
    }
  }

  /**
   * Get all accommodation bookings with pagination and filters
   */
  async getAllAccommodationBookings(
    page: number = 1,
    pageSize: number = 10,
    filter?: {
      travelerId?: string;
      roomId?: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    bookings: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;
      const where: any = {};

      if (filter) {
        if (filter.travelerId) {
          where.travelerId = filter.travelerId;
        }
        if (filter.roomId) {
          where.roomId = filter.roomId;
        }
        if (filter.status) {
          where.status = filter.status;
        }
        if (filter.startDate || filter.endDate) {
          where.checkInDate = {};
          if (filter.startDate) {
            where.checkInDate.gte = filter.startDate;
          }
          if (filter.endDate) {
            where.checkInDate.lte = filter.endDate;
          }
        }
      }

      const [bookings, total] = await Promise.all([
        prisma.accommodationBooking.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            room: {
              include: {
                accommodation: {
                  include: {
                    provider: {
                      select: {
                        accommodationName: true,
                        address: true,
                        contactNumber: true,
                      },
                    },
                  },
                },
              },
            },
            traveler: {
              select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
              },
            },
            payment: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.accommodationBooking.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        bookings,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error("Error getting all accommodation bookings:", error);
      throw error;
    }
  }

  /**
   * Update accommodation booking status
   */
  async updateBookingStatus(
    id: number,
    status: string
  ): Promise<AccommodationBooking> {
    try {
      const booking = await prisma.accommodationBooking.update({
        where: { id },
        data: { status },
      });
      return booking;
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    }
  }

  /**
   * Update accommodation booking
   */
  async updateAccommodationBooking(
    id: number,
    data: {
      checkInDate?: Date;
      checkOutDate?: Date;
      totalPrice?: number;
      status?: string;
    }
  ): Promise<AccommodationBooking> {
    try {
      const updateData: any = { ...data };
      if (data.totalPrice !== undefined) {
        updateData.totalPrice = new Decimal(data.totalPrice);
      }

      const booking = await prisma.accommodationBooking.update({
        where: { id },
        data: updateData,
      });
      return booking;
    } catch (error) {
      console.error("Error updating accommodation booking:", error);
      throw error;
    }
  }

  /**
   * Cancel accommodation booking
   */
  async cancelAccommodationBooking(id: number): Promise<AccommodationBooking> {
    try {
      const booking = await prisma.accommodationBooking.update({
        where: { id },
        data: { status: "cancelled" },
      });
      return booking;
    } catch (error) {
      console.error("Error cancelling accommodation booking:", error);
      throw error;
    }
  }

  /**
   * Delete accommodation booking
   */
  async deleteAccommodationBooking(id: number): Promise<void> {
    try {
      await prisma.accommodationBooking.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Error deleting accommodation booking:", error);
      throw error;
    }
  }

  /**
   * Get bookings by traveler
   */
  async getBookingsByTraveler(
    travelerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    bookings: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;

      const [bookings, total] = await Promise.all([
        prisma.accommodationBooking.findMany({
          where: { travelerId },
          skip,
          take: pageSize,
          include: {
            room: {
              include: {
                accommodation: {
                  include: {
                    provider: true,
                  },
                },
              },
            },
            payment: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.accommodationBooking.count({ where: { travelerId } }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        bookings,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error("Error getting bookings by traveler:", error);
      throw error;
    }
  }

  /**
   * Get bookings by provider
   */
  async getBookingsByProvider(
    providerId: string,
    page: number = 1,
    pageSize: number = 10,
    filter?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    bookings: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;
      const where: any = {
        room: {
          accommodation: {
            providerId,
          },
        },
      };

      if (filter) {
        if (filter.status) {
          where.status = filter.status;
        }
        if (filter.startDate || filter.endDate) {
          where.checkInDate = {};
          if (filter.startDate) {
            where.checkInDate.gte = filter.startDate;
          }
          if (filter.endDate) {
            where.checkInDate.lte = filter.endDate;
          }
        }
      }

      const [bookings, total] = await Promise.all([
        prisma.accommodationBooking.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            room: {
              include: {
                accommodation: true,
              },
            },
            traveler: {
              select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
              },
            },
            payment: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.accommodationBooking.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        bookings,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error("Error getting bookings by provider:", error);
      throw error;
    }
  }
}
