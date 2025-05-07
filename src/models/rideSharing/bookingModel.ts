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
            in: ["active", "pending"],
          },
        },
        // You might want to include related data, for example:
        include: {
          listing: true, // Include details of the associated listing
          request: true, // Include details of the associated request
          offer: true, // Include details of the associated offer
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
          // A booking belongs to a provider if EITHER:
          // 1. It's associated with a listing published by that provider
          // OR
          // 2. It originated from an offer sent by that provider (e.g., an offer on a traveler's request)
          OR: [
            {
              listing: {
                // Check the related listing
                providerId: providerId,
              },
            },
            {
              offer: {
                // Check the related offer
                senderId: providerId, // Check if the provider sent the offer
              },
            },
          ],
        },
        // Include related data often needed by providers:
        include: {
          listing: true, // Details of the listing (if booking came from a listing)
          request: true, // Details of the request (if booking came from a request via an offer)
          traveler: {
            // Details of the traveler who made the booking
            select: { id: true, username: true, mediaUrls: true }, // Select specific user fields
          },
          offer: true, // Details of the offer (if applicable)
        },
        orderBy: {
          createdAt: "desc", // Show newest bookings first
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
