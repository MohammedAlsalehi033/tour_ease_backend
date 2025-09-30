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

// Accept an offer and create a booking, rejecting all other competing offers
async acceptOffer(offerId: number): Promise<any> {
  // First get the offer to access its details
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
  });
  
  
  
  if (!offer) {
    throw new Error("Offer not found");
  }
  
  const returnedValue =await prisma.$transaction(async (tx) => {
  
    // Update the offer status
    const updatedOffer = await tx.offer.update({
      where: { id: offerId },
      data: { status: "accepted" },
    });
    
    // Automatically reject all other offers for the same listing or request
    if (offer.transportationListingId) {
      await tx.offer.updateMany({
        where: {
          transportationListingId: offer.transportationListingId,
          id: { not: offerId },
          status: { in: ["pending", "countered"] }  
        },
        data: {
          status: "rejected"
        }
      });
    } else if (offer.transportationRequestId) {
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
        
        // If no seats left or all seats are booked, mark as unavailable
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
      // Optionally return information about rejected offers
      rejectedOffersCount: offer.transportationListingId || offer.transportationRequestId ? 
        await tx.offer.count({
          where: {
            OR: [
              { transportationListingId: offer.transportationListingId },
              { transportationRequestId: offer.transportationRequestId }
            ],
            id: { not: offerId },
            status: "rejected"
          }
        }) : 0
    };
  });
  console.log(returnedValue)
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
