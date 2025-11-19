import { prisma } from "../../utils/prismaClient";
import { Room } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export default class RoomModel {
  /**
   * Create a new room
   */
  async createRoom(
    accommodationId: number,
    roomType: string,
    pricePerNight: number,
    capacity: number,
    mediaUrls: string[] = []
  ): Promise<Room> {
    try {
      const room = await prisma.room.create({
        data: {
          accommodationId,
          roomType,
          pricePerNight: new Decimal(pricePerNight),
          capacity,
          mediaUrls,
        },
        include: {
          accommodation: {
            include: {
              provider: true,
            },
          },
        },
      });
      return room;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  }

  /**
   * Get room by ID
   */
  async getRoomById(id: number): Promise<any | null> {
    try {
      const room = await prisma.room.findUnique({
        where: { id },
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
            orderBy: {
              createdAt: "desc",
            },
          },
          bookings: {
            where: {
              status: {
                in: ["pending", "confirmed"],
              },
            },
            select: {
              checkInDate: true,
              checkOutDate: true,
            },
          },
        },
      });
      return room;
    } catch (error) {
      console.error("Error getting room:", error);
      throw error;
    }
  }

  /**
   * Get all rooms with pagination and filters
   */
  async getAllRooms(
    page: number = 1,
    pageSize: number = 10,
    filter?: {
      accommodationId?: number;
      roomType?: string;
      minPrice?: number;
      maxPrice?: number;
      capacity?: number;
    }
  ): Promise<{
    rooms: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;
      const where: any = {};

      if (filter) {
        if (filter.accommodationId) {
          where.accommodationId = filter.accommodationId;
        }
        if (filter.roomType) {
          where.roomType = { contains: filter.roomType, mode: "insensitive" };
        }
        if (filter.minPrice || filter.maxPrice) {
          where.pricePerNight = {};
          if (filter.minPrice) {
            where.pricePerNight.gte = new Decimal(filter.minPrice);
          }
          if (filter.maxPrice) {
            where.pricePerNight.lte = new Decimal(filter.maxPrice);
          }
        }
        if (filter.capacity) {
          where.capacity = { gte: filter.capacity };
        }
      }

      const [rooms, total] = await Promise.all([
        prisma.room.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            accommodation: {
              select: {
                id: true,
                name: true,
                location: true,
                provider: {
                  select: {
                    accommodationName: true,
                  },
                },
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
          orderBy: {
            pricePerNight: "asc",
          },
        }),
        prisma.room.count({ where }),
      ]);

      // Calculate average rating for each room
      const roomsWithRatings = rooms.map((room) => {
        const avgRating =
          room.reviews.length > 0
            ? room.reviews.reduce((sum, r) => sum + r.rating, 0) /
              room.reviews.length
            : 0;
        return {
          ...room,
          averageRating: avgRating,
          reviewCount: room.reviews.length,
        };
      });

      const totalPages = Math.ceil(total / pageSize);

      return {
        rooms: roomsWithRatings,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error("Error getting all rooms:", error);
      throw error;
    }
  }

  /**
   * Update room
   */
  async updateRoom(
    id: number,
    data: {
      roomType?: string;
      pricePerNight?: number;
      capacity?: number;
      mediaUrls?: string[];
    }
  ): Promise<Room> {
    try {
      const updateData: any = { ...data };
      if (data.pricePerNight !== undefined) {
        updateData.pricePerNight = new Decimal(data.pricePerNight);
      }

      const room = await prisma.room.update({
        where: { id },
        data: updateData,
      });
      return room;
    } catch (error) {
      console.error("Error updating room:", error);
      throw error;
    }
  }

  /**
   * Delete room
   */
  async deleteRoom(id: number): Promise<void> {
    try {
      await prisma.room.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error;
    }
  }

  /**
   * Get rooms by accommodation (only rooms with NO bookings at all)
   * Excludes any rooms that have pending or confirmed bookings
   */
  async getRoomsByAccommodation(accommodationId: number): Promise<any[]> {
    try {
      // First, get all room IDs that have active bookings
      const bookedRooms = await prisma.accommodationBooking.findMany({
        where: {
          status: {
            in: ["pending", "confirmed"],
          },
          room: {
            accommodationId: accommodationId,
          },
        },
        select: {
          roomId: true,
        },
      });

      // Get unique room IDs using Set
      const bookedIds = Array.from(new Set(bookedRooms.map(b => b.roomId)));

      // Get all rooms for this accommodation that are NOT in the booked list
      const rooms = await prisma.room.findMany({
        where: { 
          accommodationId,
          ...(bookedIds.length > 0 ? {
            id: {
              notIn: bookedIds,
            },
          } : {}),
        },
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: {
          pricePerNight: "asc",
        },
      });

      const roomsWithRatings = rooms.map((room) => {
        const avgRating =
          room.reviews.length > 0
            ? room.reviews.reduce((sum, r) => sum + r.rating, 0) /
              room.reviews.length
            : 0;
        
        return {
          ...room,
          averageRating: avgRating,
          reviewCount: room.reviews.length,
        };
      });

      return roomsWithRatings;
    } catch (error) {
      console.error("Error getting rooms by accommodation:", error);
      throw error;
    }
  }

  /**
   * Check room availability
   */
  async checkRoomAvailability(
    roomId: number,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<boolean> {
    try {
      const conflictingBookings = await prisma.accommodationBooking.findMany({
        where: {
          roomId,
          status: {
            in: ["pending", "confirmed"],
          },
          OR: [
            {
              AND: [
                { checkInDate: { lte: checkInDate } },
                { checkOutDate: { gt: checkInDate } },
              ],
            },
            {
              AND: [
                { checkInDate: { lt: checkOutDate } },
                { checkOutDate: { gte: checkOutDate } },
              ],
            },
            {
              AND: [
                { checkInDate: { gte: checkInDate } },
                { checkOutDate: { lte: checkOutDate } },
              ],
            },
          ],
        },
      });

      return conflictingBookings.length === 0;
    } catch (error) {
      console.error("Error checking room availability:", error);
      throw error;
    }
  }

  /**
   * Debug booking data for accommodation
   */
  async debugBookingData(accommodationId: number): Promise<any> {
    try {
      const allBookings = await prisma.accommodationBooking.findMany({
        where: {
          room: {
            accommodationId: accommodationId,
          },
        },
        include: {
          room: {
            select: {
              id: true,
              roomType: true,
              accommodationId: true,
            },
          },
        },
      });

      const bookedRoomIds = await prisma.accommodationBooking.findMany({
        where: {
          status: {
            in: ["pending", "confirmed"],
          },
          room: {
            accommodationId: accommodationId,
          },
        },
        select: {
          roomId: true,
          status: true,
          checkInDate: true,
          checkOutDate: true,
        },
        distinct: ['roomId'],
      });

      const allRooms = await prisma.room.findMany({
        where: { accommodationId },
        select: {
          id: true,
          roomType: true,
          pricePerNight: true,
        },
      });

      return {
        allBookings,
        bookedRoomIds,
        allRooms,
        bookedIds: bookedRoomIds.map(b => b.roomId),
      };
    } catch (error) {
      console.error("Error debugging booking data:", error);
      throw error;
    }
  }
}
