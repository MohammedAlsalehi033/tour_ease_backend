import { prisma } from "../../utils/prismaClient";
import { TransportationRequest } from "@prisma/client"; // Assuming you have a generated Prisma client type

interface NearbyTransportationRequest extends TransportationRequest {
  distance_km: number;
}

export default class RequestModel {

  async createRequest(
    travelerId: string,
    startLocationText: string,
    endLocationText: string,
    startLocationLat: number,
    startLocationLng: number,
    endLocationLat: number,
    endLocationLng: number,
    departureTime: Date,
    seatsNeeded: number,
    budget: number,
): Promise<TransportationRequest> {
  try {
    const newRequest = await prisma.transportationRequest.create({
      data: {
        travelerId,
        startLocationText,
        endLocationText,
        startLocationLat,
        startLocationLng,
        endLocationLat,
        endLocationLng,
        departureTime,
        seatsNeeded,
        budget: budget,  
      },
    });

    return newRequest;
  } catch (error) {
    console.error("Error creating transportation request:", error);
    throw error; 
  }
}

async searchNearbyRequests(
  startLat: number,
  startLng: number,
  endLat?: number,
  endLng?: number,
  radiusKm: number = 30
): Promise<any[]> {
  try {
    // Base query with selection including user fields
    let query = `
      SELECT
        tr.*,
        u.id as "user_id",
        u.email as "user_email",
        u.username as "user_username",
        u."mediaUrls" as "user_mediaUrls",
        u."accountStatus" as "user_accountStatus",
        u."createdAt" as "user_createdAt",
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tr."startLocationLng", tr."startLocationLat"), 4326)::geography
        ) / 1000 AS distance_to_start_km
    `;

    // Add end location distance calculation if provided
    if (endLat !== undefined && endLng !== undefined) {
      query += `,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${endLng}, ${endLat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tr."endLocationLng", tr."endLocationLat"), 4326)::geography
        ) / 1000 AS distance_to_end_km
      `;
    }

    // From clause with LEFT JOIN to check for existing bookings/offers
    query += `
      FROM "TransportationRequest" tr
      JOIN "User" u ON tr."travelerId" = u."id"
      LEFT JOIN "TransportationBooking" tb ON tr."id" = tb."transportationRequestId" 
        AND tb."status" IN ('pending', 'confirmed', 'compelet')
      WHERE tb."id" IS NULL  -- Exclude requests that already have bookings or accepted offers
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tr."startLocationLng", tr."startLocationLat"), 4326)::geography,
          ${radiusKm * 1000}
        )
    `;

    // Add end location proximity check if provided
    if (endLat !== undefined && endLng !== undefined) {
      query += `
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(${endLng}, ${endLat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tr."endLocationLng", tr."endLocationLat"), 4326)::geography,
          ${radiusKm * 1000}
        )
      `;
    }

    query += `
      AND tr."departureTime" > NOW()
    `;

    if (endLat !== undefined && endLng !== undefined) {
      query += `
        ORDER BY (
          ST_Distance(
            ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326)::geography,
            ST_SetSRID(ST_MakePoint(tr."startLocationLng", tr."startLocationLat"), 4326)::geography
          ) / 1000 +
          ST_Distance(
            ST_SetSRID(ST_MakePoint(${endLng}, ${endLat}), 4326)::geography,
            ST_SetSRID(ST_MakePoint(tr."endLocationLng", tr."endLocationLat"), 4326)::geography
          ) / 1000
        ) ASC
      `;
    } else {
      query += `
        ORDER BY ST_Distance(
          ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tr."startLocationLng", tr."startLocationLat"), 4326)::geography
        ) / 1000 ASC
      `;
    }

    const rows = await prisma.$queryRawUnsafe(query);
    const formatted = rows.map((row: any) => {
      const { user_id, user_email, user_username, user_mediaUrls, user_accountStatus, user_createdAt, ...rest } = row;
      return {
        ...rest,
        user: {
          id: user_id,
          email: user_email,
          username: user_username,
          mediaUrls: user_mediaUrls,
          accountStatus: user_accountStatus,
          createdAt: user_createdAt,
        },
      };
    });
    return formatted;
  } catch (error) {
    console.error("Error searching nearby requests:", error);
    throw error; 
  }
}

/* Original function (start location only)
async searchNearbyRequests(lat: number, lng: number, radiusKm: number = 30): Promise<NearbyTransportationRequest[]> {
  try {
    const nearbyRequests = await prisma.$queryRaw<NearbyTransportationRequest[]>`
      SELECT
        *,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint("startLocationLng", "startLocationLat"), 4326)::geography
        ) / 1000 AS distance_km
      FROM "TransportationRequest"
      WHERE ST_DWithin(
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ST_SetSRID(ST_MakePoint("startLocationLng", "startLocationLat"), 4326)::geography,
        ${radiusKm * 1000}
      )
      AND "departureTime" > NOW()
      ORDER BY distance_km ASC;
    `;
    return nearbyRequests;
  } catch (error) {
    console.error("Error searching nearby requests:", error);
    throw error; 
  }
}
*/
}