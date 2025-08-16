import { DateTime } from './../../../../node_modules/effect/dist/dts/DateTime.d';
import { r } from "@faker-js/faker/dist/airline-CBNP41sR";
import { PrismaOfferModel } from "../../../models/rideSharing/offerModel";
import { FileUploaderForS3 } from "../../../utils/FileUploader";
import { container } from "tsyringe";
import { FirebaseNotifier } from "../../../utils/firebaseNotficationsManger";


export class OfferController {
  private offerModel: PrismaOfferModel;
  private fileUploader: FileUploaderForS3;

  constructor(offerModel: PrismaOfferModel, fileUploader: FileUploaderForS3) {
    this.offerModel = offerModel;
    this.fileUploader = fileUploader;
  }

  // Get all offers with filters
  async getAllOffers(req, res) {
    try {
      const page = parseInt(req.body.page) || 1;
      const limit = parseInt(req.body.limit) || 10;
      const sort = req.body.sort || 'newest';
      const filter = {
        senderId: req.body.senderId,
        recipientId: req.body.recipientId,
        status: req.body.status,
        transportationListingId: req.body.listingId ? parseInt(req.body.listingId) : undefined,
        transportationRequestId: req.body.requestId ? parseInt(req.body.requestId) : undefined
      };

      // Remove undefined filters
      Object.keys(filter).forEach(key => filter[key] === undefined && delete filter[key]);

      const offers = await this.offerModel.getAllOffers(page, limit, sort, filter);
      const offersWithSignedUrls = await this.processMediaUrls(offers);

      res.status(200).json({
        success: true,
        data: offersWithSignedUrls
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get specific offer by ID
  async getOfferById(req, res) {
    try {
      const offerId = parseInt(req.params.id);
      const offer = await this.offerModel.getOfferById(offerId);

      if (!offer) {
        return res.status(404).json({
          success: false,
          message: "Offer not found"
        });
      }

      // Process any media URLs
      const offerWithSignedUrls = await this.processUserMediaUrls(offer);

      res.status(200).json({
        success: true,
        data: offerWithSignedUrls
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create a new offer
  async createOffer(req, res) {
    try {
      const { 
        senderId, 
        recipientId, 
        pricePerSeat, 
        seatsRequested, 
        message, 
        transportationListingId, 
        transportationRequestId 
      } = req.body;

      const offerData = {
        senderId,
        recipientId,
        pricePerSeat: parseFloat(pricePerSeat),
        seatsRequested: parseInt(seatsRequested),
        message,
        transportationListingId: transportationListingId ? parseInt(transportationListingId) : undefined,
        transportationRequestId: transportationRequestId ? parseInt(transportationRequestId) : undefined
      };

      const newOffer = await this.offerModel.createOffer(offerData);

        const notificationsManger = container.resolve(FirebaseNotifier)
              notificationsManger.sendNotification(recipientId, {
                title: "New Offer",
                body: `You have a New Offer for Ride /n ${message}`,
              });
            

      const offerWithSignedUrls = await this.processUserMediaUrls(newOffer);

      res.status(201).json({
        success: true,
        data: offerWithSignedUrls
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Accept an offer
  async acceptOffer(req, res) {
    
    
    try {
      const offerId = parseInt(req.params.id);
      const result = await this.offerModel.acceptOffer(offerId);
  const notificationManager = container.resolve(FirebaseNotifier)
  notificationManager.sendNotification(result.offer.senderId,{
    body: "Transportation offer was accepted",
    title: `the transportation offer made at ${result.offer.createdAt}`
  })
  notificationManager.sendNotification(result.offer.recipientId,{
    body: "Transportation offer was accepted",
    title: `the transportation offer made at ${result.offer.createdAt}`
  })
      
      // const notificationsManger = container.resolve(FirebaseNotifier)
      //   notificationsManger.sendNotification(result.booking.travelerId, {
      //     title: "New Message",
      //     body: `You have received a new message from ${user.username}`,
      //   });
      
      res.status(200).json({
        success: true,
        data: {
          offer: result.offer,
          booking: result.booking,
          message: "Offer accepted and booking created"
        }
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Reject an offer
  async rejectOffer(req, res) {
    try {
      const offerId = parseInt(req.params.id);
      const updatedOffer = await this.offerModel.rejectOffer(offerId);

      res.status(200).json({
        success: true,
        data: updatedOffer,
        message: "Offer rejected"
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get offers received by a user
  async getReceivedOffers(req, res) {
    try {
      const userId = req.params.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;

      const offers = await this.offerModel.getReceivedOffers(userId, page, limit, status);
      const offersWithSignedUrls = await this.processMediaUrls(offers);

      res.status(200).json({
        success: true,
        data: offersWithSignedUrls
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get offers sent by a user
  async getSentOffers(req, res) {
    try {
      const userId = req.params.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;

      const offers = await this.offerModel.getSentOffers(userId, page, limit, status);
      const offersWithSignedUrls = await this.processMediaUrls(offers);

      res.status(200).json({
        success: true,
        data: offersWithSignedUrls
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getOffersForListing(req, res) {
    try {
      const listingId = parseInt(req.params.listingId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;

      const offers = await this.offerModel.getOffersForListing(listingId, page, limit, status);
      const offersWithSignedUrls = await this.processMediaUrls(offers);

      res.status(200).json({
        success: true,
        data: offersWithSignedUrls
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getOffersForRequest(req, res) {
    try {
      const requestId = parseInt(req.params.requestId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;

      const offers = await this.offerModel.getOffersForRequest(requestId, page, limit, status);
      const offersWithSignedUrls = await this.processMediaUrls(offers);

      res.status(200).json({
        success: true,
        data: offersWithSignedUrls
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get offer statistics for a user
  async getUserOfferStats(req, res) {
    try {
      const userId = req.params.userId;
      const stats = await this.offerModel.countOffersByStatus(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error : any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Helper method to process media URLs for an array of offers
  private async processMediaUrls(offers) {
    return Promise.all(
      offers.map(async (offer) => {
        const processedOffer = { ...offer };
        
        // Process sender media URLs if they exist
        if (offer.sender?.mediaUrls?.length > 0) {
          const signedUrls = await Promise.all(
            offer.sender.mediaUrls.map(url => this.fileUploader.myGetSignedUrl(url))
          );
          processedOffer.sender = {
            ...offer.sender,
            mediaUrls: signedUrls
          };
        }
        
        // Process recipient media URLs if they exist
        if (offer.recipient?.mediaUrls?.length > 0) {
          const signedUrls = await Promise.all(
            offer.recipient.mediaUrls.map(url => this.fileUploader.myGetSignedUrl(url))
          );
          processedOffer.recipient = {
            ...offer.recipient,
            mediaUrls: signedUrls
          };
        }
        
        return processedOffer;
      })
    );
  }

  // Helper method to process media URLs for a single offer
  private async processUserMediaUrls(offer) {
    const processedOffer = { ...offer };
    
    // Process sender media URLs if they exist
    if (offer.sender?.mediaUrls?.length > 0) {
      const signedUrls = await Promise.all(
        offer.sender.mediaUrls.map(url => this.fileUploader.myGetSignedUrl(url))
      );
      processedOffer.sender = {
        ...offer.sender,
        mediaUrls: signedUrls
      };
    }
    
    // Process recipient media URLs if they exist
    if (offer.recipient?.mediaUrls?.length > 0) {
      const signedUrls = await Promise.all(
        offer.recipient.mediaUrls.map(url => this.fileUploader.myGetSignedUrl(url))
      );
      processedOffer.recipient = {
        ...offer.recipient,
        mediaUrls: signedUrls
      };
    }
    
    return processedOffer;
  }
}