import { DateTime } from './../../../../node_modules/effect/dist/dts/DateTime.d';
import { r } from "@faker-js/faker/dist/airline-CBNP41sR";
import { PrismaOfferModel } from "../../../models/rideSharing/offerModel";
import { FileUploaderForS3 } from "../../../utils/FileUploader";
import { container } from "tsyringe";
import { FirebaseNotifier } from "../../../utils/firebaseNotficationsManger";
import { prisma } from "../../../utils/prismaClient";


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

      // Check if user is trying to make an offer on their own listing
      if (transportationListingId) {
        const listing = await prisma.transportationListing.findUnique({
          where: { id: parseInt(transportationListingId) },
          select: { providerId: true },
        });
        
        if (listing && listing.providerId === senderId) {
          return res.status(400).json({
            success: false,
            message: "You cannot make an offer on your own listing"
          });
        }
      }

      // Check if user is trying to make an offer on their own request
      if (transportationRequestId) {
        const request = await prisma.transportationRequest.findUnique({
          where: { id: parseInt(transportationRequestId) },
          select: { travelerId: true },
        });
        
        if (request && request.travelerId === senderId) {
          return res.status(400).json({
            success: false,
            message: "You cannot make an offer on your own request"
          });
        }
      }

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

        const notificationsManger = container.resolve(FirebaseNotifier);
        
        // Get sender info for better notification context
        const senderInfo = await prisma.user.findUnique({
          where: { id: senderId },
          select: { username: true }
        });

        await notificationsManger.sendContextualNotification(recipientId, 'OFFER', {
          title: "New Transportation Offer Received",
          body: `${senderInfo?.username || 'A provider'} has sent you a ride offer for ${seatsRequested} seat(s) at PKR ${pricePerSeat} per seat. ${message ? `Message: "${message}"` : ''}`,
          priority: 'high',
          actionRequired: true,
          actionUrl: `/offers/${newOffer.id}`,
          entityType: 'transportation_offer',
          entityId: newOffer.id,
          relatedUserId: senderId,
          relatedUserName: senderInfo?.username
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
      
      // Validate the offer before accepting
      await this.validateOfferAcceptance(offerId);
      
      const result = await this.offerModel.acceptOffer(offerId);
      const notificationManager = container.resolve(FirebaseNotifier);
      
      // Get user info for better context
      const [senderInfo, recipientInfo] = await Promise.all([
        prisma.user.findUnique({
          where: { id: result.offer.senderId },
          select: { username: true }
        }),
        prisma.user.findUnique({
          where: { id: result.offer.recipientId },
          select: { username: true }
        })
      ]);

      // Notify sender (offer provider)
      await notificationManager.sendContextualNotification(result.offer.senderId, 'OFFER_ACCEPTED', {
        title: "Great News! Your Offer Was Accepted",
        body: `${recipientInfo?.username || 'A traveler'} has accepted your transportation offer. A booking has been created and you can now coordinate the trip details.`,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/bookings/${result.booking?.id}`,
        entityType: 'transportation_offer',
        entityId: offerId,
        relatedUserId: result.offer.recipientId,
        relatedUserName: recipientInfo?.username
      });

      // Notify recipient (traveler)
      await notificationManager.sendContextualNotification(result.offer.recipientId, 'OFFER_ACCEPTED', {
        title: "Offer Accepted Successfully",
        body: `You have successfully accepted the transportation offer from ${senderInfo?.username || 'the provider'}. Your booking is confirmed and you can now prepare for your trip.`,
        priority: 'high',
        actionRequired: true,
        actionUrl: `/bookings/${result.booking?.id}`,
        entityType: 'transportation_offer',
        entityId: offerId,
        relatedUserId: result.offer.senderId,
        relatedUserName: senderInfo?.username
      });
      
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

      // Notify both parties with enhanced context
      try {
        const notificationManager = container.resolve(FirebaseNotifier);
        
        // Get user info for better context
        const [senderInfo, recipientInfo] = await Promise.all([
          prisma.user.findUnique({
            where: { id: updatedOffer.senderId },
            select: { username: true }
          }),
          prisma.user.findUnique({
            where: { id: updatedOffer.recipientId },
            select: { username: true }
          })
        ]);

        if (updatedOffer?.senderId) {
          await notificationManager.sendContextualNotification(updatedOffer.senderId, 'OFFER_REJECTED', {
            title: 'Transportation Offer Declined',
            body: `Unfortunately, ${recipientInfo?.username || 'the traveler'} has declined your transportation offer. Don't worry, there are more opportunities available.`,
            priority: 'normal',
            actionRequired: false,
            actionUrl: '/offers/available',
            entityType: 'transportation_offer',
            entityId: offerId,
            relatedUserId: updatedOffer.recipientId,
            relatedUserName: recipientInfo?.username
          });
        }
        
        if (updatedOffer?.recipientId) {
          await notificationManager.sendContextualNotification(updatedOffer.recipientId, 'OFFER_REJECTED', {
            title: 'Offer Rejected Successfully',
            body: `You have declined the transportation offer from ${senderInfo?.username || 'the provider'}. You can continue browsing other available options.`,
            priority: 'normal',
            actionRequired: false,
            actionUrl: '/browse/transportation',
            entityType: 'transportation_offer',
            entityId: offerId,
            relatedUserId: updatedOffer.senderId,
            relatedUserName: senderInfo?.username
          });
        }
      } catch (notifyError) {
        console.error('Failed to send offer rejection notifications:', notifyError);
      }

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

  // Validation method for offer acceptance
  private async validateOfferAcceptance(offerId: number): Promise<void> {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: true,
        request: true,
      }
    });
    
    if (!offer) {
      throw new Error("Offer not found");
    }
    
    // Validate offer status
    if (offer.status !== 'pending') {
      throw new Error(`Cannot accept offer with status: ${offer.status}`);
    }
    
    // Check for existing booking conflicts - TRAVELERS ONLY
    // Drivers can have multiple bookings for their own listings, but travelers should not
    if (offer.transportationListingId && offer.listing) {
      // This is a traveler making an offer on a listing
      const existingBookings = await this.validateUserBookingConflicts(
        offer.senderId, // This is the traveler
        offer.listing.departureTime,
        false // Not a driver
      );
      
      if (existingBookings.length > 0) {
        throw new Error(`Traveler cannot have multiple active bookings. Found ${existingBookings.length} conflicting booking(s) at similar times.`);
      }
    }
    
    if (offer.transportationRequestId && offer.request) {
      // This is a driver making an offer on a request
      // We don't restrict drivers from having multiple bookings as they manage their own capacity
      const existingBookings = await this.validateUserBookingConflicts(
        offer.recipientId, // This is the traveler who will receive the ride
        offer.request.departureTime,
        false // The recipient is a traveler, not a driver
      );
      
      if (existingBookings.length > 0) {
        throw new Error(`Traveler cannot have multiple active bookings. Found ${existingBookings.length} conflicting booking(s) at similar times.`);
      }
    }

    // Validate seat availability for listings (prevent overselling)
    if (offer.transportationListingId) {
      const currentListing = await prisma.transportationListing.findUnique({
        where: { id: offer.transportationListingId },
      });
      
      if (!currentListing) {
        throw new Error("Listing not found");
      }
      
      if (currentListing.seatsAvailable < offer.seatsRequested) {
        throw new Error(`Not enough seats available. Available: ${currentListing.seatsAvailable}, Requested: ${offer.seatsRequested}`);
      }
      
      if (currentListing.status !== 'active') {
        throw new Error(`Cannot accept offer for listing with status: ${currentListing.status}`);
      }
    }
  }

  // Validate if TRAVELER has existing bookings that conflict
  // Note: This method specifically checks for TRAVELER conflicts only
  // Drivers are allowed to have multiple bookings for their own listings
  private async validateUserBookingConflicts(
    travelerId: string,
    departureTime: Date,
    isDriver: boolean = false
  ): Promise<any[]> {
    // Only enforce booking conflicts for travelers, not drivers
    if (isDriver) {
      return []; // Drivers can manage their own capacity
    }
    
    const timeBuffer = 2 * 60 * 60 * 1000; // 2 hours buffer for bookings
    const conflictStart = new Date(departureTime.getTime() - timeBuffer);
    const conflictEnd = new Date(departureTime.getTime() + timeBuffer);
    
    // Check for existing bookings where this user is the TRAVELER
    const conflictingBookings = await prisma.transportationBooking.findMany({
      where: {
        travelerId: travelerId, // This person as a traveler
        status: { in: ['pending', 'confirmed', 'active'] },
        OR: [
          {
            listing: {
              departureTime: {
                gte: conflictStart,
                lte: conflictEnd,
              }
            }
          },
          {
            request: {
              departureTime: {
                gte: conflictStart,
                lte: conflictEnd,
              }
            }
          }
        ]
      },
      include: {
        listing: true,
        request: true
      }
    });
    
    return conflictingBookings;
  }
}