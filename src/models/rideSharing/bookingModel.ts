import { prisma } from "../../utils/prismaClient";

export class transportationBookingModel {
  async getBookingByTravelerId(userId: string): Promise<any> {
    if (!userId) {
      throw new Error("User ID cannot be empty.");
    }
    try {
      const bookings = await prisma.transportationBooking.findMany({
        where: {
          travelerId: userId,
          status: {
            in: ["active", "pending", "complete", "cancelled"],
          },
        },
        // You might want to include related data, for example:
        include: {
          listing: {
            include: {
              provider: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      mediaUrls: true,
                      phoneNumber: true,
                      email: true,
                    },
                  },
                },
              },
            },
          }, // Include details of the associated listing with provider info
          request: true, // Include details of the associated request
          offer: {
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  mediaUrls: true,
                  phoneNumber: true,
                  email: true,
                  transportationProvider: {
                    select: {
                      vehicleType: true,
                      vehicleMediaUrls: true,
                      seatsAvailable: true,
                    },
                  },
                },
              },
            },
          }, // Include offer details with sender (provider) info for request bookings
        },
      });
      return bookings;
    } catch (e) {
      console.error(`Database error fetching bookings for user ${userId}:`, e);
      throw new Error(
        `Could not retrieve transportation bookings for user. Error: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  }

  async getBookingsByProviderId(providerId: string): Promise<any> {
    // Or Promise<TransportationBooking[]>

    if (!providerId) {
      throw new Error("Provider ID cannot be empty.");
    }

    try {
     const bookings = await prisma.transportationBooking.findMany({
  where: {
    OR: [
      // Case 1: The booking is for one of the provider's own listings.
      // This part is correct.
      {
        listing: {
          providerId: providerId,
        },
      },
      
      // Case 2: The booking resulted from an offer the provider made
      // on a traveler's RIDE REQUEST. This is the corrected logic.
      {
        AND: [
          {
            offer: {
              senderId: providerId, // The provider sent the offer...
            },
          },
          {
            // ...AND the booking is for a request, not another listing.
            // This is the crucial check to ensure the provider's role.
            transportationRequestId: {
              not: null,
            },
          },
        ],
      },
    ],
  },
  // Your includes and ordering remain the same:
  include: {
    listing: true, 
    request: true, 
    traveler: {
      select: { id: true, username: true, mediaUrls: true }, 
    },
    offer: true, 
  },
  orderBy: {
    createdAt: "desc", 
  },
});

      return bookings;
    } catch (e) {
      console.error(
        `Database error fetching bookings for provider ${providerId}:`,
        e
      );
      throw new Error(
        `Could not retrieve transportation bookings for provider. Error: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  }

  async changeBookingState(bookingId: string, status: string): Promise<any> {
    try {
      console.log(bookingId)
      const data = await prisma.transportationBooking.update({
        where: {
          id: Number(bookingId),
        },
        data: {
          status,
        },
      });
      return data;
    } catch (e) {
      throw e instanceof Error ? e : new Error(String(e));
    }
  }
}
