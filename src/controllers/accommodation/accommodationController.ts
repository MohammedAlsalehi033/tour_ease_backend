import { Request, Response } from "express";
import AccommodationModel from "../../models/accommodation/accommodationModel";

export default class AccommodationController {
  private model: AccommodationModel;

  constructor(model: AccommodationModel) {
    this.model = model;
  }

  /**
   * Create accommodation
   */
  async createAccommodation(req: any, res: any) {
    try {
      const { providerId, name, location, description, mediaUrls } = req.body;

      if (!providerId || !name || !location || !description) {
        return res.status(400).json({
          success: false,
          message: "providerId, name, location, and description are required",
        });
      }

      const accommodation = await this.model.createAccommodation(
        providerId,
        name,
        location,
        description,
        mediaUrls || []
      );

      res.status(201).json({
        success: true,
        data: accommodation,
        message: "Accommodation created successfully",
      });
    } catch (error: any) {
      console.error("Error in createAccommodation:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create accommodation",
      });
    }
  }

  /**
   * Get accommodation by ID
   */
  async getAccommodationById(req: any, res: any) {
    try {
      const { id } = req.params;

      const accommodation = await this.model.getAccommodationById(parseInt(id));

      if (!accommodation) {
        return res.status(404).json({
          success: false,
          message: "Accommodation not found",
        });
      }

      res.json({
        success: true,
        data: accommodation,
      });
    } catch (error: any) {
      console.error("Error in getAccommodationById:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get accommodation",
      });
    }
  }

  /**
   * Get all accommodations
   */
  async getAllAccommodations(req: any, res: any) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const filter: any = {};
      if (req.query.name) filter.name = req.query.name;
      if (req.query.location) filter.location = req.query.location;
      if (req.query.providerId) filter.providerId = req.query.providerId;
      if (req.query.minPrice) filter.minPrice = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.maxPrice = parseFloat(req.query.maxPrice);

      const result = await this.model.getAllAccommodations(
        page,
        pageSize,
        Object.keys(filter).length > 0 ? filter : undefined
      );

      res.json({
        success: true,
        data: result.accommodations,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error("Error in getAllAccommodations:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get accommodations",
      });
    }
  }

  /**
   * Update accommodation
   */
  async updateAccommodation(req: any, res: any) {
    try {
      const { id } = req.params;
      const { name, location, description, mediaUrls } = req.body;

      const data: any = {};
      if (name) data.name = name;
      if (location) data.location = location;
      if (description) data.description = description;
      if (mediaUrls) data.mediaUrls = mediaUrls;

      const accommodation = await this.model.updateAccommodation(parseInt(id), data);

      res.json({
        success: true,
        data: accommodation,
        message: "Accommodation updated successfully",
      });
    } catch (error: any) {
      console.error("Error in updateAccommodation:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update accommodation",
      });
    }
  }

  /**
   * Delete accommodation
   */
  async deleteAccommodation(req: any, res: any) {
    try {
      const { id } = req.params;

      await this.model.deleteAccommodation(parseInt(id));

      res.json({
        success: true,
        message: "Accommodation deleted successfully",
      });
    } catch (error: any) {
      console.error("Error in deleteAccommodation:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete accommodation",
      });
    }
  }

  /**
   * Search accommodations by location
   */
  async searchAccommodationsByLocation(req: any, res: any) {
    try {
      const { location } = req.query;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      if (!location) {
        return res.status(400).json({
          success: false,
          message: "Location is required",
        });
      }

      const result = await this.model.searchAccommodationsByLocation(
        location,
        page,
        pageSize
      );

      res.json({
        success: true,
        data: result.accommodations,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error("Error in searchAccommodationsByLocation:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to search accommodations",
      });
    }
  }

  /**
   * Get accommodation dashboard data (for home screen)
   */
  async getAccommodationDashboard(req: any, res: any) {
    try {
      const { id } = req.params;

      const dashboard = await this.model.getAccommodationDashboard(parseInt(id));

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: "Accommodation not found",
        });
      }

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      console.error("Error in getAccommodationDashboard:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get accommodation dashboard",
      });
    }
  }

  /**
   * Debug endpoint to check stored mediaUrls
   */
  async debugMediaUrls(req: any, res: any) {
    try {
      const { id } = req.params;
      
      const accommodation = await this.model.getAccommodationById(parseInt(id));
      
      if (!accommodation) {
        return res.status(404).json({
          success: false,
          message: "Accommodation not found",
        });
      }

      res.json({
        success: true,
        data: {
          accommodationId: accommodation.id,
          storedMediaUrls: accommodation.mediaUrls,
          mediaUrlsType: typeof accommodation.mediaUrls,
          mediaUrlsLength: accommodation.mediaUrls?.length || 0,
          firstMediaUrl: accommodation.mediaUrls?.[0] || null,
        },
      });
    } catch (error: any) {
      console.error("Error in debugMediaUrls:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to debug media URLs",
      });
    }
  }
}
