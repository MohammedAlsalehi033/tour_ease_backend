import ListingModel from '../../../models/rideSharing/listingModel';
import { Request, Response } from 'express';

export default class ListingController {
  private listingModel: ListingModel;
  
  constructor(listingModel: ListingModel) {
    this.listingModel = listingModel;
  }

  async createListing(req: Request, res: Response) {
    try {
      const {
        providerId,
        startLocationText,
        endLocationText,
        startLocationLat,
        startLocationLng,
        endLocationLat,
        endLocationLng,
        departureTime,
        pricePerSeat,
        seatsAvailable,
        mediaUrls,
        status
      } = req.body;

      if (!providerId || !startLocationText || !endLocationText || 
          !departureTime || !seatsAvailable || pricePerSeat === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      const newListing = await this.listingModel.createListing(
        providerId,
        startLocationText,
        endLocationText,
        startLocationLat ? Number(startLocationLat) : null,
        startLocationLng ? Number(startLocationLng) : null,
        endLocationLat ? Number(endLocationLat) : null,
        endLocationLng ? Number(endLocationLng) : null,
        new Date(departureTime),
        Number(pricePerSeat),
        Number(seatsAvailable),
        mediaUrls || [],
        status || 'active'
      );

      return res.status(201).json({
        success: true,
        data: newListing
      });
    } catch (error) {
      console.error("Error in createListing controller:", error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  async findNearbyListings(req: Request, res: Response) {
    try {
      const { 
        lat, 
        lng, 
        radiusKm = 30, 
        minSeats = 1, 
        maxPrice, 
        departureAfter, 
        departureBefore 
      } = req.query;

      if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
        return res.status(400).json({
          success: false, 
          error: 'Valid latitude and longitude are required'
        });
      }

      const results = await this.listingModel.searchNearbyListings(
        Number(lat), 
        Number(lng), 
        Number(radiusKm),
        Number(minSeats),
        maxPrice ? Number(maxPrice) : undefined,
        departureAfter ? new Date(departureAfter as string) : undefined,
        departureBefore ? new Date(departureBefore as string) : undefined
      );
    
      return res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (error) {
      console.error("Error in findNearbyListings controller:", error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      }); 
    }
  }

  async getListingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: 'Valid listing ID is required'
        });
      }

      const listing = await this.listingModel.getListingById(Number(id));
      
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: listing
      });
    } catch (error) {
      console.error("Error in getListingById controller:", error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateListing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: 'Valid listing ID is required'
        });
      }

      const updatedListing = await this.listingModel.updateListing(Number(id), updateData);
      
      return res.status(200).json({
        success: true,
        data: updatedListing
      });
    } catch (error) {
      console.error("Error in updateListing controller:", error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async deleteListing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: 'Valid listing ID is required'
        });
      }

      const deletedListing = await this.listingModel.deleteListing(Number(id));
      
      return res.status(200).json({
        success: true,
        data: deletedListing
      });
    } catch (error) {
      console.error("Error in deleteListing controller:", error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getListingsByProvider(req: Request, res: Response) {
    try {
      const { providerId } = req.params;
      
      if (!providerId) {
        return res.status(400).json({
          success: false,
          error: 'Provider ID is required'
        });
      }

      const listings = await this.listingModel.getListingsByProvider(providerId);
      
      return res.status(200).json({
        success: true,
        count: listings.length,
        data: listings
      });
    } catch (error) {
      console.error("Error in getListingsByProvider controller:", error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async searchListingsByRoute(req: Request, res: Response) {
    try {
      const { startLocation, endLocation, departureDate } = req.query;
      
      if (!startLocation || !endLocation) {
        return res.status(400).json({
          success: false,
          error: 'Start and end locations are required'
        });
      }

      const listings = await this.listingModel.searchListingsByRoute(
        startLocation as string,
        endLocation as string,
        departureDate ? new Date(departureDate as string) : undefined
      );
      
      return res.status(200).json({
        success: true,
        count: listings.length,
        data: listings
      });
    } catch (error) {
      console.error("Error in searchListingsByRoute controller:", error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}