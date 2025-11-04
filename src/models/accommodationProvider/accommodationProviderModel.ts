import { prisma } from "../../utils/prismaClient";
import { AccommodationProvider } from "@prisma/client";

export default class AccommodationProviderModel {
  /**
   * Complete registration: Create provider, accommodation, rooms, and update user role
   * This is a transaction that does everything at once
   */
  async registerCompleteAccommodationProvider(data: {
    userId: string;
    provider: {
      accommodationName: string;
      address: string;
      contactNumber: string;
      mediaUrls?: string[];
    };
    accommodation: {
      name: string;
      location: string;
      description: string;
      mediaUrls?: string[];
    };
    rooms: Array<{
      roomType: string;
      pricePerNight: number;
      capacity: number;
      mediaUrls?: string[];
    }>;
  }): Promise<{
    provider: AccommodationProvider;
    accommodation: any;
    rooms: any[];
    user: any;
  }> {
    try {
      // Find the accommodation role
      const accommodationRole = await prisma.role.findUnique({
        where: { id: 4 }, // Role ID 4 is for accommodation
      });

      if (!accommodationRole) {
        throw new Error("Accommodation role not found");
      }

      // Use transaction to ensure all operations succeed or all fail
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Accommodation Provider
        const provider = await tx.accommodationProvider.create({
          data: {
            providerId: data.userId,
            accommodationName: data.provider.accommodationName,
            address: data.provider.address,
            contactNumber: data.provider.contactNumber,
            mediaUrls: data.provider.mediaUrls || [],
          },
        });

        // 2. Create Accommodation
        const accommodation = await tx.accommodation.create({
          data: {
            providerId: data.userId,
            name: data.accommodation.name,
            location: data.accommodation.location,
            description: data.accommodation.description,
            mediaUrls: data.accommodation.mediaUrls || [],
          },
        });

        // 3. Create all Rooms
        const rooms = await Promise.all(
          data.rooms.map((room) =>
            tx.room.create({
              data: {
                accommodationId: accommodation.id,
                roomType: room.roomType,
                pricePerNight: room.pricePerNight,
                capacity: room.capacity,
                mediaUrls: room.mediaUrls || [],
              },
            })
          )
        );

        // 4. Remove traveler role (roleId: 1) and add accommodation role (roleId: 4)
        console.log("=== BEFORE ROLE DELETION ===");
        const rolesBefore = await tx.userRole.findMany({
          where: { userId: data.userId },
          include: { role: true },
        });
        console.log("User roles before deletion:", rolesBefore.map(r => ({ id: r.id, roleId: r.roleId, roleName: r.role.roleName })));

        // Delete the traveler role
        const deleteResult = await tx.userRole.deleteMany({
          where: {
            userId: data.userId,
            roleId: 1, // Traveler role
          },
        });
        console.log("Delete result (count):", deleteResult.count);

        console.log("=== AFTER ROLE DELETION ===");
        const rolesAfterDelete = await tx.userRole.findMany({
          where: { userId: data.userId },
          include: { role: true },
        });
        console.log("User roles after deletion:", rolesAfterDelete.map(r => ({ id: r.id, roleId: r.roleId, roleName: r.role.roleName })));

        // 5. Check if user already has accommodation role
        const existingAccommodationRole = await tx.userRole.findFirst({
          where: {
            userId: data.userId,
            roleId: 4,
          },
        });
        console.log("Existing accommodation role:", existingAccommodationRole);

        // 6. Add accommodation role if not already present
        if (!existingAccommodationRole) {
          const newRole = await tx.userRole.create({
            data: {
              userId: data.userId,
              roleId: 4, // Accommodation role
            },
          });
          console.log("Created new accommodation role:", newRole);
        } else {
          console.log("User already has accommodation role, skipping creation");
        }

        console.log("=== AFTER ROLE ADDITION ===");
        const rolesAfterAdd = await tx.userRole.findMany({
          where: { userId: data.userId },
          include: { role: true },
        });
        console.log("User roles after addition:", rolesAfterAdd.map(r => ({ id: r.id, roleId: r.roleId, roleName: r.role.roleName })));

        // 7. Get updated user with all roles
        const user = await tx.user.findUnique({
          where: { id: data.userId },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });
        console.log("Final user roles:", user?.roles.map(r => ({ roleId: r.roleId, roleName: r.role.roleName })));

        return {
          provider,
          accommodation,
          rooms,
          user,
        };
      });

      return result;
    } catch (error) {
      console.error("Error in complete accommodation provider registration:", error);
      throw error;
    }
  }

  /**
   * Create a new accommodation provider
   */
  async createAccommodationProvider(
    providerId: string,
    accommodationName: string,
    address: string,
    contactNumber: string,
    mediaUrls: string[] = []
  ): Promise<AccommodationProvider> {
    try {
      const provider = await prisma.accommodationProvider.create({
        data: {
          providerId,
          accommodationName,
          address,
          contactNumber,
          mediaUrls,
        },
      });
      return provider;
    } catch (error) {
      console.error("Error creating accommodation provider:", error);
      throw error;
    }
  }

  /**
   * Get accommodation provider by ID
   */
  async getAccommodationProviderById(
    providerId: string
  ): Promise<AccommodationProvider | null> {
    try {
      const provider = await prisma.accommodationProvider.findUnique({
        where: { providerId },
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
          accommodations: {
            include: {
              rooms: true,
              reviews: true,
            },
          },
        },
      });
      return provider;
    } catch (error) {
      console.error("Error getting accommodation provider:", error);
      throw error;
    }
  }

  /**
   * Get all accommodation providers with pagination and filters
   */
  async getAllAccommodationProviders(
    page: number = 1,
    pageSize: number = 10,
    filter?: {
      accommodationName?: string;
      address?: string;
    }
  ): Promise<{
    providers: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;
      const where: any = {};

      if (filter) {
        if (filter.accommodationName) {
          where.accommodationName = {
            contains: filter.accommodationName,
            mode: "insensitive",
          };
        }
        if (filter.address) {
          where.address = { contains: filter.address, mode: "insensitive" };
        }
      }

      const [providers, total] = await Promise.all([
        prisma.accommodationProvider.findMany({
          where,
          skip,
          take: pageSize,
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
            accommodations: {
              include: {
                rooms: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.accommodationProvider.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        providers,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error("Error getting all accommodation providers:", error);
      throw error;
    }
  }

  /**
   * Update accommodation provider
   */
  async updateAccommodationProvider(
    providerId: string,
    data: {
      accommodationName?: string;
      address?: string;
      contactNumber?: string;
      mediaUrls?: string[];
    }
  ): Promise<AccommodationProvider> {
    try {
      const provider = await prisma.accommodationProvider.update({
        where: { providerId },
        data,
      });
      return provider;
    } catch (error) {
      console.error("Error updating accommodation provider:", error);
      throw error;
    }
  }

  /**
   * Delete accommodation provider
   */
  async deleteAccommodationProvider(providerId: string): Promise<void> {
    try {
      await prisma.accommodationProvider.delete({
        where: { providerId },
      });
    } catch (error) {
      console.error("Error deleting accommodation provider:", error);
      throw error;
    }
  }

  /**
   * Get accommodations by provider
   */
  async getAccommodationsByProvider(providerId: string): Promise<any[]> {
    try {
      const accommodations = await prisma.accommodation.findMany({
        where: { providerId },
        include: {
          rooms: true,
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
        orderBy: {
          createdAt: "desc",
        },
      });
      return accommodations;
    } catch (error) {
      console.error("Error getting accommodations by provider:", error);
      throw error;
    }
  }
}
