import { prisma } from "../../utils/prismaClient";
import { FileUploaderForS3 } from "../../utils/FileUploader";
import { Accommodation } from "@prisma/client";

export default class AccommodationModel {
  private fileUploader: FileUploaderForS3;

  constructor() {
    try {
      this.fileUploader = new FileUploaderForS3();
    } catch (error) {
      console.error("Failed to initialize S3 FileUploader:", error);
      throw error;
    }
  }

  /**
   * Helper function to convert S3 keys to signed URLs (async)
   */
  private async s3ToSignedUrl(key: string): Promise<string> {
    try {
      return await this.fileUploader.myGetSignedUrl(key, 3600); // 1 hour expiry
    } catch (error) {
      console.error(`Failed to generate signed URL for key: ${key}`, error);
      // Fallback to direct S3 URL if signing fails
      const bucket = process.env.S3_BUCKET_NAME || 'tour-ease';
      const region = process.env.AWS_REGION || 'ap-south-1';
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }
  }

  /**
   * Helper function to transform accommodation data with S3 signed URLs
   */
  private async transformAccommodationWithS3Urls(accommodation: any): Promise<any> {
    if (!accommodation) return null;

    try {
      // Transform media URLs in parallel
      const [
        accommodationMediaUrls,
        providerMediaUrls,
        roomsWithUrls,
        reviewsWithUrls
      ] = await Promise.all([
        // Accommodation media URLs
        Promise.all((accommodation.mediaUrls || []).map((key: string) => this.s3ToSignedUrl(key))),
        // Provider user media URLs
        accommodation.provider?.user?.mediaUrls 
          ? Promise.all((accommodation.provider.user.mediaUrls || []).map((key: string) => this.s3ToSignedUrl(key)))
          : Promise.resolve([]),
        // Room media URLs
        accommodation.rooms 
          ? Promise.all(accommodation.rooms.map(async (room: any) => ({
              ...room,
              mediaUrls: await Promise.all((room.mediaUrls || []).map((key: string) => this.s3ToSignedUrl(key))),
            })))
          : Promise.resolve([]),
        // Reviewer media URLs
        accommodation.reviews 
          ? Promise.all(accommodation.reviews.map(async (review: any) => ({
              ...review,
              reviewer: review.reviewer ? {
                ...review.reviewer,
                mediaUrls: await Promise.all((review.reviewer.mediaUrls || []).map((key: string) => this.s3ToSignedUrl(key))),
              } : review.reviewer,
            })))
          : Promise.resolve([]),
      ]);

      // Calculate review statistics
      const reviewCount = accommodation.reviews?.length || 0;
      const averageRating = reviewCount > 0
        ? accommodation.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviewCount
        : 0;

      return {
        ...accommodation,
        mediaUrls: accommodationMediaUrls,
        reviewCount,
        averageRating: parseFloat(averageRating.toFixed(2)),
        provider: accommodation.provider ? {
          ...accommodation.provider,
          user: accommodation.provider.user ? {
            ...accommodation.provider.user,
            mediaUrls: providerMediaUrls,
          } : accommodation.provider.user,
        } : accommodation.provider,
        rooms: roomsWithUrls,
        reviews: reviewsWithUrls,
      };
    } catch (error) {
      console.error("Error transforming accommodation with S3 URLs:", error);
      return accommodation; // Return original data if transformation fails
    }
  }

  /**
   * Create a new accommodation
   */
  async createAccommodation(
    providerId: string,
    name: string,
    location: string,
    description: string,
    mediaUrls: string[] = []
  ): Promise<Accommodation> {
    try {
      const accommodation = await prisma.accommodation.create({
        data: {
          providerId,
          name,
          location,
          description,
          mediaUrls,
        },
        include: {
          provider: true,
          rooms: true,
        },
      });
      return accommodation;
    } catch (error) {
      console.error("Error creating accommodation:", error);
      throw error;
    }
  }

  /**
   * Get accommodation by ID (excludes rooms with any bookings)
   */
  async getAccommodationById(id: number): Promise<any | null> {
    try {
      // First get room IDs that have active bookings for this accommodation
      const bookedRooms = await prisma.accommodationBooking.findMany({
        where: {
          status: {
            in: ["pending", "confirmed"],
          },
          room: {
            accommodationId: id,
          },
        },
        select: {
          roomId: true,
        },
      });

      // Get unique room IDs using Set
      const bookedIds = Array.from(new Set(bookedRooms.map(b => b.roomId)));

      const roomWhereClause: any = {};
      if (bookedIds.length > 0) {
        roomWhereClause.id = {
          notIn: bookedIds,
        };
      }

      const accommodation = await prisma.accommodation.findUnique({
        where: { id },
        include: {
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  phoneNumber: true,
                  mediaUrls: true,
                },
              },
            },
          },
          rooms: {
            where: roomWhereClause,
            orderBy: {
              pricePerNight: "asc",
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
        },
      });
      
      if (!accommodation) return null;
      
      return this.transformAccommodationWithS3Urls(accommodation);
    } catch (error) {
      console.error("Error getting accommodation:", error);
      throw error;
    }
  }

  /**
   * Get all accommodations with pagination and filters (excludes rooms with bookings)
   */
  async getAllAccommodations(
    page: number = 1,
    pageSize: number = 10,
    filter?: {
      name?: string;
      location?: string;
      providerId?: string;
      minPrice?: number;
      maxPrice?: number;
    }
  ): Promise<{
    accommodations: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;
      const where: any = {};

      if (filter) {
        if (filter.name) {
          where.name = { contains: filter.name, mode: "insensitive" };
        }
        if (filter.location) {
          where.location = { contains: filter.location, mode: "insensitive" };
        }
        if (filter.providerId) {
          where.providerId = filter.providerId;
        }
      }

      // Get all booked room IDs
      const bookedRooms = await prisma.accommodationBooking.findMany({
        where: {
          status: {
            in: ["pending", "confirmed"],
          },
        },
        select: {
          roomId: true,
        },
      });

      // Get unique room IDs using Set
      const bookedIds = Array.from(new Set(bookedRooms.map(b => b.roomId)));

      const roomWhereClause: any = {};
      if (bookedIds.length > 0) {
        roomWhereClause.id = {
          notIn: bookedIds,
        };
      }

      const [accommodations, total] = await Promise.all([
        prisma.accommodation.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            provider: {
              select: {
                providerId: true,
                accommodationName: true,
                address: true,
                contactNumber: true,
              },
            },
            rooms: {
              where: roomWhereClause,
              orderBy: {
                pricePerNight: "asc",
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.accommodation.count({ where }),
      ]);

      // Calculate average rating
      const accommodationsWithRatings = accommodations.map((acc) => {
        const avgRating =
          acc.reviews.length > 0
            ? acc.reviews.reduce((sum, r) => sum + r.rating, 0) /
              acc.reviews.length
            : 0;
        
        return {
          ...acc,
          averageRating: avgRating,
          reviewCount: acc.reviews.length,
        };
      });

      // Transform all accommodations with S3 URLs
      const transformedAccommodations = await Promise.all(
        accommodationsWithRatings.map((acc) => 
          this.transformAccommodationWithS3Urls(acc)
        )
      );

      const totalPages = Math.ceil(total / pageSize);

      return {
        accommodations: transformedAccommodations,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error("Error getting all accommodations:", error);
      throw error;
    }
  }

  /**
   * Update accommodation
   */
  async updateAccommodation(
    id: number,
    data: {
      name?: string;
      location?: string;
      description?: string;
      mediaUrls?: string[];
    }
  ): Promise<Accommodation> {
    try {
      const accommodation = await prisma.accommodation.update({
        where: { id },
        data,
      });
      return accommodation;
    } catch (error) {
      console.error("Error updating accommodation:", error);
      throw error;
    }
  }

  /**
   * Delete accommodation
   */
  async deleteAccommodation(id: number): Promise<void> {
    try {
      await prisma.accommodation.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Error deleting accommodation:", error);
      throw error;
    }
  }

  /**
   * Search accommodations by location (excludes rooms with bookings)
   */
  async searchAccommodationsByLocation(
    location: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    accommodations: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;
      const where = {
        location: { contains: location, mode: "insensitive" as const },
      };

      // Get all booked room IDs
      const bookedRooms = await prisma.accommodationBooking.findMany({
        where: {
          status: {
            in: ["pending", "confirmed"],
          },
        },
        select: {
          roomId: true,
        },
      });

      // Get unique room IDs using Set
      const bookedIds = Array.from(new Set(bookedRooms.map(b => b.roomId)));

      const roomWhereClause: any = {};
      if (bookedIds.length > 0) {
        roomWhereClause.id = {
          notIn: bookedIds,
        };
      }

      const [accommodations, total] = await Promise.all([
        prisma.accommodation.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            provider: true,
            rooms: {
              where: roomWhereClause,
              orderBy: {
                pricePerNight: "asc",
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        }),
        prisma.accommodation.count({ where }),
      ]);

      const accommodationsWithRatings = accommodations.map((acc) => {
        const avgRating =
          acc.reviews.length > 0
            ? acc.reviews.reduce((sum, r) => sum + r.rating, 0) /
              acc.reviews.length
            : 0;
        
        return {
          ...acc,
          averageRating: avgRating,
          reviewCount: acc.reviews.length,
        };
      });

      const totalPages = Math.ceil(total / pageSize);

      return {
        accommodations: accommodationsWithRatings,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error("Error searching accommodations:", error);
      throw error;
    }
  }

  /**
   * Get accommodation dashboard data (for home screen)
   * Includes: accommodation details, performance parameters, rooms info
   */
  async getAccommodationDashboard(accommodationId: number): Promise<any> {
    try {
      const accommodation = await prisma.accommodation.findUnique({
        where: { id: accommodationId },
        include: {
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  phoneNumber: true,
                  mediaUrls: true,
                },
              },
            },
          },
          rooms: {
            select: {
              id: true,
              roomType: true,
              pricePerNight: true,
              capacity: true,
              mediaUrls: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              rooms: true,
              reviews: true,
            },
          },
        },
      });

      if (!accommodation) {
        return null;
      }

      // Convert S3 keys to signed URLs
      const accommodationMediaUrls = await Promise.all(
        (accommodation.mediaUrls || []).map((key: string) => this.s3ToSignedUrl(key))
      );
      const providerProfileImage = accommodation.provider.user.mediaUrls?.[0] 
        ? await this.s3ToSignedUrl(accommodation.provider.user.mediaUrls[0])
        : null;
      const roomsWithSignedUrls = await Promise.all(
        accommodation.rooms.map(async (room: any) => ({
          ...room,
          mediaUrls: await Promise.all(
            (room.mediaUrls || []).map((key: string) => this.s3ToSignedUrl(key))
          ),
        }))
      );

      // Get bookings data for performance metrics
      const bookings = await prisma.accommodationBooking.findMany({
        where: {
          room: {
            accommodationId: accommodationId,
          },
        },
        include: {
          room: true,
        },
      });

      // Calculate performance metrics
      const averageRating =
        accommodation.reviews.length > 0
          ? accommodation.reviews.reduce((sum, r) => sum + r.rating, 0) /
            accommodation.reviews.length
          : 0;

      // Calculate occupancy rate
      const totalRooms = accommodation._count.rooms;
      const currentBookings = bookings.filter(b => {
        const now = new Date();
        return (
          new Date(b.checkInDate) <= now &&
          new Date(b.checkOutDate) >= now &&
          b.status !== "cancelled"
        );
      }).length;
      const occupancyRate = totalRooms > 0 ? (currentBookings / totalRooms) * 100 : 0;

      // Calculate total revenue
      const totalRevenue = bookings
        .filter(b => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + Number(b.totalPrice), 0);

      // Get guest count
      const uniqueGuests = new Set(bookings.map(b => b.travelerId)).size;

      // Get available rooms count
      const availableRooms = totalRooms - currentBookings;

      // Build dashboard response with signed URLs
      const dashboard = {
        accommodationId: accommodation.id,
        name: accommodation.name,
        location: accommodation.location,
        description: accommodation.description,
        mediaUrls: accommodationMediaUrls,
        provider: {
          id: accommodation.provider.user.id,
          username: accommodation.provider.user.username,
          email: accommodation.provider.user.email,
          phoneNumber: accommodation.provider.user.phoneNumber,
          profileImage: providerProfileImage,
          accommodationName: accommodation.provider.accommodationName,
          address: accommodation.provider.address,
          contactNumber: accommodation.provider.contactNumber,
        },
        performance: {
          occupancyRate: Math.round(occupancyRate),
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          revenue: Math.round(totalRevenue),
          guests: uniqueGuests,
          totalRooms: totalRooms,
          availableRooms: availableRooms,
          reviewCount: accommodation._count.reviews,
        },
        rooms: roomsWithSignedUrls.map(room => ({
          id: room.id,
          type: room.roomType,
          price: Number(room.pricePerNight),
          capacity: room.capacity,
          images: room.mediaUrls,
        })),
        createdAt: accommodation.createdAt,
      };

      return dashboard;
    } catch (error) {
      console.error("Error getting accommodation dashboard:", error);
      throw error;
    }
  }
}
