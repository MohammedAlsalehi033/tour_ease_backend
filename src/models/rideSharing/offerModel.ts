import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PrismaOfferModel {
  // Get all offers with pagination, filtering and sorting
  getAllOffers(
    page = 1,
    limit = 10,
    sort = 'newest',
    filter: {
      senderId?: string;
      recipientId?: string;
      status?: string;
      transportationListingId?: number;
      transportationRequestId?: number;
    } = {}
  ): Promise<any[]> {
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
  getOfferById(id: number): Promise<any | null> {
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
  }): Promise<any> {
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
  updateOfferStatus(id: number, status: string): Promise<any> {
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
  ): Promise<any[]> {
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
  ): Promise<any[]> {
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
  ): Promise<any[]> {
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

  // Accept an offer and create a booking
  async acceptOffer(offerId: number): Promise<any> {
    // First get the offer to access its details
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new Error("Offer not found");
    }

    // Start a transaction to ensure data consistency
    return prisma.$transaction(async (tx) => {
      // Update the offer status
      const updatedOffer = await tx.offer.update({
        where: { id: offerId },
        data: { status: "accepted" },
      });

      // Calculate total price
      const totalPrice = Number(offer.pricePerSeat) * offer.seatsRequested;

      // Create a booking based on the offer
      const booking = await tx.transportationBooking.create({
        data: {
          travelerId: offer.transportationListingId ? offer.senderId : offer.recipientId,
          seatsBooked: offer.seatsRequested,
          status: "pending",
          totalPrice,
          bookingSource: offer.transportationListingId ? "listing" : "request",
          transportationListingId: offer.transportationListingId,
          transportationRequestId: offer.transportationRequestId,
          offerId: offer.id,
        },
      });

      // If booking from a listing, update the available seats
      if (offer.transportationListingId) {
        const listing = await tx.transportationListing.findUnique({
          where: { id: offer.transportationListingId },
        });

        if (listing) {
          await tx.transportationListing.update({
            where: { id: offer.transportationListingId },
            data: {
              seatsAvailable: listing.seatsAvailable - offer.seatsRequested,
            },
          });
        }
      }

      return { offer: updatedOffer, booking };
    });
  }

  // Reject an offer
  rejectOffer(offerId: number): Promise<any> {
    return prisma.offer.update({
      where: { id: offerId },
      data: { status: "rejected" },
    });
  }

  // Count offers by status for a user
  countOffersByStatus(userId: string): Promise<any> {
    return prisma.$transaction([
      prisma.offer.count({
        where: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
          status: "pending",
        },
      }),
      prisma.offer.count({
        where: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
          status: "accepted",
        },
      }),
      prisma.offer.count({
        where: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
          status: "rejected",
        },
      }),
    ]).then(([pending, accepted, rejected]) => {
      return { pending, accepted, rejected };
    });
  }
}