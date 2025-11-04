import AccommodationProviderModel from "../../models/accommodationProvider/accommodationProviderModel";

export default class AccommodationProviderController {
  private model: AccommodationProviderModel;

  constructor(model: AccommodationProviderModel) {
    this.model = model;
  }

  /**
   * Complete registration endpoint for accommodation provider
   * Creates provider, accommodation, rooms, and updates user role in one transaction
   */
  async registerCompleteProvider(req: any, res: any) {
    try {
      const { userId, provider, accommodation, rooms } = req.body;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      if (!provider || !provider.accommodationName || !provider.address || !provider.contactNumber) {
        return res.status(400).json({
          success: false,
          message: "Provider details (accommodationName, address, contactNumber) are required",
        });
      }

      if (!accommodation || !accommodation.name || !accommodation.location || !accommodation.description) {
        return res.status(400).json({
          success: false,
          message: "Accommodation details (name, location, description) are required",
        });
      }

      if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one room is required",
        });
      }

      // Validate each room
      for (const room of rooms) {
        if (!room.roomType || !room.pricePerNight || !room.capacity) {
          return res.status(400).json({
            success: false,
            message: "Each room must have roomType, pricePerNight, and capacity",
          });
        }
      }

      const result = await this.model.registerCompleteAccommodationProvider({
        userId,
        provider,
        accommodation,
        rooms,
      });

      res.status(201).json({
        success: true,
        data: {
          provider: result.provider,
          accommodation: result.accommodation,
          rooms: result.rooms,
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            roles: result.user.roles.map((ur: any) => ur.role.roleName),
            mediaUrls: result.user.mediaUrls || [],
            accountStatus: result.user.accountStatus,
            createdAt: result.user.createdAt,
            updatedAt: result.user.updatedAt,
          },
        },
        message: "Accommodation provider registered successfully",
      });
    } catch (error: any) {
      console.error("Error in registerCompleteProvider:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to register accommodation provider",
      });
    }
  }

  /**
   * Create accommodation provider
   */
  async createAccommodationProvider(req: any, res: any) {
    try {
      const { providerId, accommodationName, address, contactNumber, mediaUrls } = req.body;

      if (!providerId || !accommodationName || !address || !contactNumber) {
        return res.status(400).json({
          success: false,
          message: "providerId, accommodationName, address, and contactNumber are required",
        });
      }

      const provider = await this.model.createAccommodationProvider(
        providerId,
        accommodationName,
        address,
        contactNumber,
        mediaUrls || []
      );

      res.status(201).json({
        success: true,
        data: provider,
        message: "Accommodation provider created successfully",
      });
    } catch (error: any) {
      console.error("Error in createAccommodationProvider:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create accommodation provider",
      });
    }
  }

  /**
   * Get accommodation provider by ID
   */
  async getAccommodationProviderById(req: any, res: any) {
    try {
      const { id } = req.params;

      const provider = await this.model.getAccommodationProviderById(id);

      if (!provider) {
        return res.status(404).json({
          success: false,
          message: "Accommodation provider not found",
        });
      }

      res.json({
        success: true,
        data: provider,
      });
    } catch (error: any) {
      console.error("Error in getAccommodationProviderById:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get accommodation provider",
      });
    }
  }

  /**
   * Get all accommodation providers
   */
  async getAllAccommodationProviders(req: any, res: any) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const filter: any = {};
      if (req.query.accommodationName) filter.accommodationName = req.query.accommodationName;
      if (req.query.address) filter.address = req.query.address;

      const result = await this.model.getAllAccommodationProviders(
        page,
        pageSize,
        Object.keys(filter).length > 0 ? filter : undefined
      );

      res.json({
        success: true,
        data: result.providers,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error("Error in getAllAccommodationProviders:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get accommodation providers",
      });
    }
  }

  /**
   * Update accommodation provider
   */
  async updateAccommodationProvider(req: any, res: any) {
    try {
      const { id } = req.params;
      const { accommodationName, address, contactNumber, mediaUrls } = req.body;

      const data: any = {};
      if (accommodationName) data.accommodationName = accommodationName;
      if (address) data.address = address;
      if (contactNumber) data.contactNumber = contactNumber;
      if (mediaUrls) data.mediaUrls = mediaUrls;

      const provider = await this.model.updateAccommodationProvider(id, data);

      res.json({
        success: true,
        data: provider,
        message: "Accommodation provider updated successfully",
      });
    } catch (error: any) {
      console.error("Error in updateAccommodationProvider:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update accommodation provider",
      });
    }
  }

  /**
   * Delete accommodation provider
   */
  async deleteAccommodationProvider(req: any, res: any) {
    try {
      const { id } = req.params;

      await this.model.deleteAccommodationProvider(id);

      res.json({
        success: true,
        message: "Accommodation provider deleted successfully",
      });
    } catch (error: any) {
      console.error("Error in deleteAccommodationProvider:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete accommodation provider",
      });
    }
  }

  /**
   * Get accommodations by provider
   */
  async getAccommodationsByProvider(req: any, res: any) {
    try {
      const { id } = req.params;

      const accommodations = await this.model.getAccommodationsByProvider(id);

      res.json({
        success: true,
        data: accommodations,
      });
    } catch (error: any) {
      console.error("Error in getAccommodationsByProvider:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get accommodations",
      });
    }
  }
}
