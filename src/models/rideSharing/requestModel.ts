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
}