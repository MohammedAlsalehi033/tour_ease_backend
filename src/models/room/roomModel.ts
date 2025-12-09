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
          status: true,
        },
      });

      // Get unique room IDs using Set
      const bookedIds = Array.from(new Set(bookedRooms.map(b => b.roomId)));

      // Get all rooms for this accommodation that are NOT in the booked list
      const whereClause: any = { 
        accommodationId: accommodationId,
      };
      
      if (bookedIds.length > 0) {
        whereClause.id = {
          notIn: bookedIds,
        };
      }

      const rooms = await prisma.room.findMany({
        where: whereClause,
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

  /**
   * Check if a room is available for given dates
   * Returns true if room has no conflicting bookings
   */
  async checkRoomAvailability(
    roomId: number,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<boolean> {
    try {
      // Find any overlapping bookings for this room
      const conflictingBookings = await prisma.accommodationBooking.findMany({
        where: {
          roomId,
          status: {
            in: ["confirmed", "pending"], // Only check active bookings
          },
          OR: [
            // Booking starts during our stay
            {
              checkInDate: {
                gte: checkInDate,
                lt: checkOutDate,
              },
            },
            // Booking ends during our stay
            {
              checkOutDate: {
                gt: checkInDate,
                lte: checkOutDate,
              },
            },
            // Booking completely encompasses our stay
            {
              checkInDate: {
                lte: checkInDate,
              },
              checkOutDate: {
                gte: checkOutDate,
              },
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
   * Get rooms with occupancy status by provider ID
   * Returns all rooms with their current booking status
   */
  async getRoomsWithOccupancyByProvider(providerId: string): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all accommodations for this provider
      const accommodations = await prisma.accommodation.findMany({
        where: { providerId },
        select: { id: true },
      });

      const accommodationIds = accommodations.map(a => a.id);

      if (accommodationIds.length === 0) {
        return {
          totalRooms: 0,
          occupiedRooms: 0,
          availableRooms: 0,
          rooms: [],
        };
      }

      // Get all rooms for these accommodations
      const rooms = await prisma.room.findMany({
        where: {
          accommodationId: { in: accommodationIds },
        },
        include: {
          accommodation: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
        orderBy: [
          { accommodationId: 'asc' },
          { id: 'asc' },
        ],
      });

      // Get current bookings (where today is between check-in and check-out)
      const currentBookings = await prisma.accommodationBooking.findMany({
        where: {
          roomId: { in: rooms.map(r => r.id) },
          checkInDate: { lte: today },
          checkOutDate: { gte: today },
          status: { in: ['confirmed', 'checked in'] },
        },
        include: {
          traveler: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // Create a map of room ID to current booking
      const bookingMap = new Map();
      currentBookings.forEach(booking => {
        bookingMap.set(booking.roomId, booking);
      });

      // Build room data with occupancy status
      const roomsWithOccupancy = rooms.map((room, index) => {
        const currentBooking = bookingMap.get(room.id);
        const isOccupied = !!currentBooking;

        return {
          ...room,
          roomNumber: `${room.id}`, // Use room ID as room number
          isOccupied,
          currentBooking: currentBooking ? {
            id: currentBooking.id,
            guestName: currentBooking.traveler?.username || 'Guest',
            guestEmail: currentBooking.traveler?.email,
            checkInDate: currentBooking.checkInDate,
            checkOutDate: currentBooking.checkOutDate,
            status: currentBooking.status,
            totalPrice: currentBooking.totalPrice,
          } : null,
        };
      });

      const occupiedCount = roomsWithOccupancy.filter(r => r.isOccupied).length;
      const availableCount = roomsWithOccupancy.length - occupiedCount;

      return {
        totalRooms: roomsWithOccupancy.length,
        occupiedRooms: occupiedCount,
        availableRooms: availableCount,
        rooms: roomsWithOccupancy,
      };
    } catch (error) {
      console.error("Error getting rooms with occupancy:", error);
      throw error;
    }
  }

  /**
   * Search for available rooms based on dates, capacity, location, and price
   * Returns only rooms that have NO booking conflicts for the specified dates
   */
  async searchAvailableRooms(filter: {
    checkInDate: Date;
    checkOutDate: Date;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    capacity?: number;
  }): Promise<any[]> {
    try {
      const { checkInDate, checkOutDate, location, minPrice, maxPrice, capacity } = filter;

      // Build accommodation filter for location
      const accommodationWhere: any = {};
      if (location) {
        accommodationWhere.location = { contains: location, mode: "insensitive" as const };
      }

      // Build room filter
      const roomWhere: any = {};
      if (capacity) {
        roomWhere.capacity = capacity;
      }
      if (minPrice || maxPrice) {
        roomWhere.pricePerNight = {};
        if (minPrice) {
          roomWhere.pricePerNight.gte = new Decimal(minPrice);
        }
        if (maxPrice) {
          roomWhere.pricePerNight.lte = new Decimal(maxPrice);
        }
      }

      // Get all rooms that match the basic filters
      const potentialRooms = await prisma.room.findMany({
        where: {
          ...roomWhere,
          ...(Object.keys(accommodationWhere).length > 0 && { accommodation: accommodationWhere }),
        },
        include: {
          accommodation: {
            select: {
              id: true,
              name: true,
              location: true,
              description: true,
              mediaUrls: true,
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
      });

      // Filter out rooms that have conflicting bookings
      const availableRooms: any[] = [];
      
      for (const room of potentialRooms) {
        // Check for overlapping bookings
        const conflictingBookings = await prisma.accommodationBooking.count({
          where: {
            roomId: room.id,
            status: {
              in: ["pending", "confirmed"],
            },
            OR: [
              // Booking starts during our stay
              {
                checkInDate: {
                  gte: checkInDate,
                  lt: checkOutDate,
                },
              },
              // Booking ends during our stay
              {
                checkOutDate: {
                  gt: checkInDate,
                  lte: checkOutDate,
                },
              },
              // Booking completely encompasses our stay
              {
                checkInDate: {
                  lte: checkInDate,
                },
                checkOutDate: {
                  gte: checkOutDate,
                },
              },
            ],
          },
        });

        // If no conflicts, room is available
        if (conflictingBookings === 0) {
          // Calculate average rating
          const avgRating =
            room.reviews.length > 0
              ? room.reviews.reduce((sum, r) => sum + r.rating, 0) / room.reviews.length
              : 0;

          availableRooms.push({
            ...room,
            averageRating: avgRating,
            reviewCount: room.reviews.length,
            pricePerNight: parseFloat(room.pricePerNight.toString()),
          });
        }
      }

      return availableRooms;
    } catch (error) {
      console.error("Error searching available rooms:", error);
      throw error;
    }
  }
}
