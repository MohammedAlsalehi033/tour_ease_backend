import { container } from "tsyringe";
import { prisma } from "../../utils/prismaClient";
import { Offer } from "@prisma/client"; 
import { FirebaseNotifier } from "../../utils/firebaseNotficationsManger";

export class PrismaOfferModel {
  getAllOffers(
    page = 1,
    limit = 10,
    sort = "newest",
    filter: {
      senderId?: string;
      recipientId?: string;
      status?: string;
      transportationListingId?: number;
      transportationRequestId?: number;
    } = {}
  ): Promise<Offer[]> {
    const skip = (page - 1) * limit;

    let orderBy = {};
    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "price-high":
        orderBy = { pricePerSeat: "desc" };
        break;
      case "price-low":
        orderBy = { pricePerSeat: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    return prisma.offer.findMany({
      skip,
      take: limit,
      orderBy,
      where: filter,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        listing: filter.transportationListingId ? true : false,
        request: filter.transportationRequestId ? true : false,
      },
    });
  }

  // Get a specific offer by ID
  getOfferById(id: number): Promise<Offer | null> {
    return prisma.offer.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        listing: true,
        request: true,
      },
    });
  }

  // Create a new offer
  createOffer(data: {
    senderId: string;
    recipientId: string;
    pricePerSeat: number;
    seatsRequested: number;
    message?: string;
    transportationListingId?: number;
    transportationRequestId?: number;
  }): Promise<Offer> {
    return prisma.offer.create({
      data: {
        senderId: data.senderId,
        recipientId: data.recipientId,
        pricePerSeat: data.pricePerSeat,
        seatsRequested: data.seatsRequested,
        message: data.message,
        transportationListingId: data.transportationListingId,
        transportationRequestId: data.transportationRequestId,
        status: "pending",
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
      },
    });
  }

  // Update an offer's status
  updateOfferStatus(id: number, status: string): Promise<Offer> {
    return prisma.offer.update({
      where: { id },
      data: { status },
    });
  }

  // Get all offers received by a user
  getReceivedOffers(
    userId: string,
    page = 1,
    limit = 10,
    status?: string
  ): Promise<Offer[]> {
    const skip = (page - 1) * limit;

    return prisma.offer.findMany({
      skip,
      take: limit,
      where: {
        recipientId: userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        listing: true,
        request: true,
      },
    });
  }

  // Get all offers sent by a user
  getSentOffers(
    userId: string,
    page = 1,
    limit = 10,
    status?: string
  ): Promise<Offer[]> {
    const skip = (page - 1) * limit;

    return prisma.offer.findMany({
      skip,
      take: limit,
      where: {
        senderId: userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        recipient: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        listing: true,
        request: true,
      },
    });
  }

  // Get offers for a specific listing
  getOffersForListing(
    listingId: number,
    page = 1,
    limit = 10,
    status?: string
  ): Promise<Offer[]> {
    const skip = (page - 1) * limit;

    return prisma.offer.findMany({
      skip,
      take: limit,
      where: {
        transportationListingId: listingId,
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
      },
    });
  }

  // Get offers for a specific request
  getOffersForRequest(
    requestId: number,
    page = 1,
    limit = 10,
    status?: string
  ): Promise<any[]> {
    const skip = (page - 1) * limit;

    return prisma.offer.findMany({
      skip,
      take: limit,
      where: {
        transportationRequestId: requestId,
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
      },
    });
  }

// Accept an offer and create a booking with proper edge case handling
async acceptOffer(offerId: number): Promise<any> {
  // Get the offer to access its details
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
  
  const returnedValue = await prisma.$transaction(async (tx) => {
    // Update the offer status
    const updatedOffer = await tx.offer.update({
      where: { id: offerId },
      data: { status: "accepted" },
    });
    
    // Handle different scenarios based on offer type
    if (offer.transportationListingId) {
      // LISTING SCENARIO: Driver can accept multiple offers for their listing
      // Multiple travelers can book the same listing until seats run out
      // Don't cancel other offers, just validate availability
      
      // EDGE CASE: Cancel traveler's active requests when their offer for listing is accepted
      // Since TransportationRequest doesn't have a status field, we delete the requests
      // as they are no longer needed once the traveler has a confirmed ride
      await tx.transportationRequest.deleteMany({
        where: {
          travelerId: offer.senderId, // The traveler who made the offer
          departureTime: {
            gte: new Date(), // Only future requests
          },
          // Optional: Add time/route overlap check here
        }
      });
      
    } else if (offer.transportationRequestId) {
      // REQUEST SCENARIO: Cancel competing offers and check for driver conflicts
      
      // Cancel all other offers for the same request
      await tx.offer.updateMany({
        where: {
          transportationRequestId: offer.transportationRequestId,
          id: { not: offerId },
          status: { in: ["pending", "countered"] }  
        },
        data: {
          status: "rejected"
        }
      });
      
      // EDGE CASE: Check for driver's conflicting listings when their offer to request is accepted
      const driverId = offer.senderId; // Driver who made the offer
      const offerDepartureTime = offer.request?.departureTime;
      
      if (offerDepartureTime) {
        // Find conflicting listings (same time period - within 4 hours)
        const timeBuffer = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
        const conflictStart = new Date(offerDepartureTime.getTime() - timeBuffer);
        const conflictEnd = new Date(offerDepartureTime.getTime() + timeBuffer);
        
        const conflictingListings = await tx.transportationListing.findMany({
          where: {
            providerId: driverId,
            status: 'active',
            departureTime: {
              gte: conflictStart,
              lte: conflictEnd,
            }
          }
        });
        
        // Auto-cancel conflicting listings
        if (conflictingListings.length > 0) {
          console.log(`Driver ${driverId} has ${conflictingListings.length} potentially conflicting listings - auto-cancelling`);
          
          await tx.transportationListing.updateMany({
            where: {
              id: { in: conflictingListings.map(l => l.id) }
            },
            data: {
              status: 'cancelled_due_to_conflict'
            }
          });
        }
      }
    }
    
    const totalPrice = Number(offer.pricePerSeat) * offer.seatsRequested;
    
    const booking = await tx.transportationBooking.create({
      data: {
        travelerId: offer.transportationListingId
          ? offer.senderId
          : offer.recipientId,
        seatsBooked: offer.seatsRequested,
        status: "pending",
        totalPrice,
        bookingSource: offer.transportationListingId ? "listing" : "request",
        transportationListingId: offer.transportationListingId,
        transportationRequestId: offer.transportationRequestId,
        offerId: offer.id,
      },
    });
    
    // If booking from a listing, update the available seats and status
    if (offer.transportationListingId) {
      const listing = await tx.transportationListing.findUnique({
        where: { id: offer.transportationListingId },
      });
      if (listing) {
        const newSeatsAvailable = listing.seatsAvailable - offer.seatsRequested;
        const updateData: any = {
          seatsAvailable: newSeatsAvailable,
        };
        
        // If no seats left, mark as booked
        if (newSeatsAvailable <= 0) {
          updateData.status = 'booked';
        }
        
        await tx.transportationListing.update({
          where: { id: offer.transportationListingId },
          data: updateData,
        });
      }
    }
    
    return { 
      offer: updatedOffer, 
      booking,
      conflictResolution: {
        cancelledRequests: offer.transportationListingId ? 
          await tx.transportationRequest.count({
            where: {
              travelerId: offer.senderId,
              status: 'fulfilled'
            }
          }) : 0,
        cancelledListings: offer.transportationRequestId ?
          await tx.transportationListing.count({
            where: {
              providerId: offer.senderId,
              status: 'cancelled_due_to_conflict'
            }
          }) : 0,
        rejectedOffers: offer.transportationRequestId ?
          await tx.offer.count({
            where: {
              transportationRequestId: offer.transportationRequestId,
              id: { not: offerId },
              status: "rejected"
            }
          }) : 0
      }
    };
  });
  
  console.log('Offer acceptance result:', returnedValue);
  return returnedValue;
}
  // Reject an offer
  rejectOffer(offerId: number): Promise<Offer> {
    return prisma.offer.update({
      where: { id: offerId },
      data: { status: "rejected" },
    });
  }

  // Count offers by status for a user
  countOffersByStatus(userId: string): Promise<Offer> {
    return prisma
      .$transaction([
        prisma.offer.count({
          where: {
            OR: [{ senderId: userId }, { recipientId: userId }],
            status: "pending",
          },
        }),
        prisma.offer.count({
          where: {
            OR: [{ senderId: userId }, { recipientId: userId }],
            status: "accepted",
          },
        }),
        prisma.offer.count({
          where: {
            OR: [{ senderId: userId }, { recipientId: userId }],
            status: "rejected",
          },
        }),
      ])
      .then(([pending, accepted, rejected]) => {
        return { pending, accepted, rejected };
      });
  }
}
