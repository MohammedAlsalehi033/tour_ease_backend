import { r } from "@faker-js/faker/dist/airline-CBNP41sR";
import ListingModel from "../../../models/rideSharing/listingModel";
import { Request, Response } from "express";
import { FileUploaderForS3 } from '../../../utils/FileUploader';

export default class ListingController {
  private listingModel: ListingModel;
  private fileUploaderForS3: FileUploaderForS3;
  constructor(listingModel: ListingModel , fileUploaderForS3: FileUploaderForS3) {
    this.listingModel = listingModel;
    this.fileUploaderForS3 = new FileUploaderForS3();
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
        status,
      } = req.body;

      if (
        !providerId ||
        !startLocationText ||
        !endLocationText ||
        !departureTime ||
        !seatsAvailable ||
        pricePerSeat === undefined
      ) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
      }

      const newListing = await this.listingModel.createListing(
        providerId,
        startLocationText,
        endLocationText,
        startLocationLat ? Number(startLocationLat) : 0,
        startLocationLng ? Number(startLocationLng) : 0,
        endLocationLat,
        endLocationLng,
        new Date(departureTime),
        Number(pricePerSeat),
        Number(seatsAvailable),
        mediaUrls || [],
        status || "active"
      );

      return res.status(200).json({
        success: true,
        data: newListing,
      });
    } catch (error : any) {
      console.error("Error in createListing controller:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async findNearbyListings(req: Request, res: Response) {
    try {
      const {
        lat,
        lng,
        endLat: queryEndLat,
        endLng: queryEndLng,
        radiusKm: queryRadiusKm,
        minSeats: queryMinSeats,
        maxPrice: queryMaxPrice,
        departureAfter: queryDepartureAfter,
        departureBefore: queryDepartureBefore,
      } = req.query;



    console.log(lat, lng, queryEndLat, queryEndLng, queryRadiusKm, queryMinSeats, queryMaxPrice, queryDepartureAfter, queryDepartureBefore)
      if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
        return res.status(400).json({
          success: false,
          error: "Valid latitude and longitude are required",
        });
      }

      const pStartLat = Number(lat);
      const pStartLng = Number(lng);
      const pEndLat = queryEndLat ? Number(queryEndLat) : undefined;
      const pEndLng = queryEndLng ? Number(queryEndLng) : undefined;
      const pRadiusKm = queryRadiusKm ? Number(queryRadiusKm) : 300000;
      const pMinSeats = queryMinSeats ? Number(queryMinSeats) : 1;
      const pMaxPrice = queryMaxPrice ? Number(queryMaxPrice) : undefined;
      const pDepartureAfter = queryDepartureAfter
        ? new Date(queryDepartureAfter as string)
        : undefined;
      const pDepartureBefore = queryDepartureBefore
        ? new Date(queryDepartureBefore as string)
        : undefined;

      const results = await this.listingModel.searchNearbyListings(
        pStartLat,
        pStartLng,
        pEndLat,
        pEndLng,
        pRadiusKm,
        pMinSeats,
        pMaxPrice,
        pDepartureAfter,
        pDepartureBefore
      );


      const resultWithSignedUrls = await Promise.all(
        results.map(async (listing) => {
          const provider = listing.provider || {};
          const user = provider.user || {};

          const [
            licenseMmediaUrlsSignedUrls,
            vehicleMediaUrlsSignedUrls,
            listingMediaSignedUrls,
            userMediaSignedUrls,
          ] = await Promise.all([
            Array.isArray(provider.licenseMmediaUrls) && provider.licenseMmediaUrls.length > 0
              ? Promise.all(provider.licenseMmediaUrls.map((url) => this.fileUploaderForS3.myGetSignedUrl(url)))
              : Promise.resolve(provider.licenseMmediaUrls || []),
            Array.isArray(provider.vehicleMediaUrls) && provider.vehicleMediaUrls.length > 0
              ? Promise.all(provider.vehicleMediaUrls.map((url) => this.fileUploaderForS3.myGetSignedUrl(url)))
              : Promise.resolve(provider.vehicleMediaUrls || []),
            Array.isArray(listing.mediaUrls) && listing.mediaUrls.length > 0
              ? Promise.all(listing.mediaUrls.map((url) => this.fileUploaderForS3.myGetSignedUrl(url)))
              : Promise.resolve(listing.mediaUrls || []),
            Array.isArray(user.mediaUrls) && user.mediaUrls.length > 0
              ? Promise.all(user.mediaUrls.map((url) => this.fileUploaderForS3.myGetSignedUrl(url)))
              : Promise.resolve(user.mediaUrls || []),
          ]);

          return {
            ...listing,
            mediaUrls: listingMediaSignedUrls,
            provider: {
              ...provider,
              licenseMmediaUrls: licenseMmediaUrlsSignedUrls,
              vehicleMediaUrls: vehicleMediaUrlsSignedUrls,
              user: {
                ...user,
                mediaUrls: userMediaSignedUrls,
              },
            },
          };
        })
      );

      
      
      return res.status(200).json({
        success: true,
        count: results.length,
        data: resultWithSignedUrls,
      });
    } catch (error) {
      console.error("Error in findNearbyListings controller:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getListingById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: "Valid listing ID is required",
        });
      }

      const listing = await this.listingModel.getListingById(Number(id));

      if (!listing) {
        return res.status(404).json({
          success: false,
          error: "Listing not found",
        });
      }

      const provider = listing.provider as any;
      const [
        licenseMmediaUrlsSignedUrls,
        vehicleMediaUrlsSignedUrls,
        listingMediaSignedUrls,
      ] = await Promise.all([
        Array.isArray(provider?.licenseMmediaUrls) && provider.licenseMmediaUrls.length > 0
          ? Promise.all(provider.licenseMmediaUrls.map((url: string) => this.fileUploaderForS3.myGetSignedUrl(url)))
          : Promise.resolve(provider?.licenseMmediaUrls || []),
        Array.isArray(provider?.vehicleMediaUrls) && provider.vehicleMediaUrls.length > 0
          ? Promise.all(provider.vehicleMediaUrls.map((url: string) => this.fileUploaderForS3.myGetSignedUrl(url)))
          : Promise.resolve(provider?.vehicleMediaUrls || []),
        Array.isArray((listing as any).mediaUrls) && (listing as any).mediaUrls.length > 0
          ? Promise.all(((listing as any).mediaUrls as string[]).map((url: string) => this.fileUploaderForS3.myGetSignedUrl(url)))
          : Promise.resolve((listing as any).mediaUrls || []),
      ]);

      const signedListing = {
        ...(listing as any),
        mediaUrls: listingMediaSignedUrls,
        provider: provider
          ? {
              ...provider,
              licenseMmediaUrls: licenseMmediaUrlsSignedUrls,
              vehicleMediaUrls: vehicleMediaUrlsSignedUrls,
            }
          : provider,
      };

      return res.status(200).json({
        success: true,
        data: signedListing,
      });
    } catch (error) {
      console.error("Error in getListingById controller:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
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
          error: "Valid listing ID is required",
        });
      }

      const updatedListing = await this.listingModel.updateListing(
        Number(id),
        updateData
      );

      return res.status(200).json({
        success: true,
        data: updatedListing,
      });
    } catch (error) {
      console.error("Error in updateListing controller:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async deleteListing(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          error: "Valid listing ID is required",
        });
      }

      const deletedListing = await this.listingModel.deleteListing(Number(id));

      return res.status(200).json({
        success: true,
        data: deletedListing,
      });
    } catch (error) {
      console.error("Error in deleteListing controller:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getListingsByProvider(req: Request, res: Response) {
    try {
      const { providerId } = req.params;

      if (!providerId) {
        return res.status(400).json({
          success: false,
          error: "Provider ID is required",
        });
      }

      const listings = await this.listingModel.getListingsByProvider(
        providerId
      );

      return res.status(200).json({
        success: true,
        count: listings.length,
        data: listings,
      });
    } catch (error) {
      console.error("Error in getListingsByProvider controller:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async searchListingsByRoute(req: Request, res: Response) {
    try {
      const { startLocation, endLocation, departureDate } = req.query;

      if (!startLocation || !endLocation) {
        return res.status(400).json({
          success: false,
          error: "Start and end locations are required",
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
        data: listings,
      });
    } catch (error) {
      console.error("Error in searchListingsByRoute controller:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
