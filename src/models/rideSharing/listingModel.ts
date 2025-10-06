import { prisma } from "../../utils/prismaClient";
import { TransportationListing } from "@prisma/client"; // Assuming you have a generated Prisma client type

interface NearbyTransportationListing extends TransportationListing {
  distance_km: number;
}

export default class ListingModel {
  async createListing(
    providerId: string,
    startLocationText: string,
    endLocationText: string,
    startLocationLat: number,
    startLocationLng: number,
    endLocationLat: number,
    endLocationLng: number,
    departureTime: Date,
    pricePerSeat: number,
    seatsAvailable: number,
    mediaUrls: string[] = [],
    status: string = "active",
    luggage?: number
  ): Promise<TransportationListing> {
    try {
      const newListing = await prisma.transportationListing.create({
        data: {
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
          luggage: luggage !== undefined ? luggage : 4,
        },
      });
      return newListing;
    } catch (error) {
      console.error("Error creating transportation listing:", error);
      throw error;
    }
  }

async searchNearbyListings(
  startLat: number,
  startLng: number,
  endLat?: number,
  endLng?: number,
  radiusKm: number = 100000,
  minSeats: number = 0,
  maxPrice?: number,
  departureAfter?: Date,
  departureBefore?: Date,
  luggage: number = 0
): Promise<any> {
  try {
    let query = `
      SELECT
        -- Listing fields with table prefix
        tl.id as "listing_id", 
        tl."providerId" as "listing_providerId",
        tl."startLocationLat" as "listing_startLocationLat",
        tl."startLocationLng" as "listing_startLocationLng",
        tl."startLocationText" as "listing_startLocationText",
        tl."endLocationLat" as "listing_endLocationLat",
        tl."endLocationLng" as "listing_endLocationLng",
        tl."endLocationText" as "listing_endLocationText",
        tl."departureTime" as "listing_departureTime",
        tl."seatsAvailable" as "listing_seatsAvailable",
        tl."pricePerSeat" as "listing_pricePerSeat",
        tl."status" as "listing_status",
        tl."mediaUrls" as "listing_mediaUrls",
        tl."createdAt" as "listing_createdAt",
        
        -- Distance calculation from user to start location
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tl."startLocationLng", tl."startLocationLat"), 4326)::geography
        ) / 1000 AS distance_to_start_km,
        
        -- Distance calculation from end location to listing's end location (if provided)
        ${endLat && endLng ? `
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${endLng}, ${endLat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tl."endLocationLng", tl."endLocationLat"), 4326)::geography
        ) / 1000 AS distance_to_end_km,
        ` : ''}
        
        -- Distance between listing's start and end locations
        ST_Distance(
          ST_SetSRID(ST_MakePoint(tl."startLocationLng", tl."startLocationLat"), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tl."endLocationLng", tl."endLocationLat"), 4326)::geography
        ) / 1000 AS route_distance_km,
        
        -- Provider fields with prefix
        tp."providerId" as "provider_providerId",
        tp."licenseMmediaUrls" as "provider_licenseMmediaUrls",
        tp."vehicleMediaUrls" as "provider_vehicleMediaUrls",
        tp."vehicleType" as "provider_vehicleType",
        tp."seatsAvailable" as "provider_seatsAvailable",
        tp."createdAt" as "provider_createdAt",
        tp."accountStatus" as "provider_accountStatus",
        
        -- User fields with prefix
        u.id as "user_id",
        u.email as "user_email",
        u.username as "user_username",
        u."mediaUrls" as "user_mediaUrls",
        u."accountStatus" as "user_accountStatus",
        u."createdAt" as "user_createdAt"
        
      FROM "TransportationListing" tl
      JOIN "TransportationProvider" tp ON tl."providerId" = tp."providerId"
      JOIN "User" u ON tp."providerId" = u."id"
      WHERE 
    `;

    // Search condition for starting point
    query += `
      ST_DWithin(
        ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(tl."startLocationLng", tl."startLocationLat"), 4326)::geography,
        ${radiusKm * 1000}
      )
    `;

    // Add search condition for end point if provided
    if (endLat && endLng) {
      query += `
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(${endLng}, ${endLat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tl."endLocationLng", tl."endLocationLat"), 4326)::geography,
          ${radiusKm * 1000}
        )
      `;
    }

    query += `
      AND tl."status" = 'active'
      AND tl."seatsAvailable" > 0
      AND tl."departureTime" > NOW()
      AND tl."seatsAvailable" >= ${minSeats}
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (maxPrice !== undefined) {
      query += ` AND tl."pricePerSeat" <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    if (departureAfter !== undefined) {
      query += ` AND tl."departureTime" >= $${paramIndex}`;
      params.push(departureAfter);
      paramIndex++;
    }

    if (departureBefore !== undefined) {
      query += ` AND tl."departureTime" <= $${paramIndex}`;
      params.push(departureBefore);
      paramIndex++;
    }

    // Luggage filter
    query += ` AND tl."luggage" >= $${paramIndex}`;
    params.push(luggage);
    paramIndex++;

    // Order by combined relevance if both start and end points provided
    if (endLat && endLng) {
      query += `
        ORDER BY (
          ST_Distance(
            ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326)::geography,
            ST_SetSRID(ST_MakePoint(tl."startLocationLng", tl."startLocationLat"), 4326)::geography
          ) / 1000 +
          ST_Distance(
            ST_SetSRID(ST_MakePoint(${endLng}, ${endLat}), 4326)::geography,
            ST_SetSRID(ST_MakePoint(tl."endLocationLng", tl."endLocationLat"), 4326)::geography
          ) / 1000
        ) ASC
      `;
    } else {
      query += `
        ORDER BY ST_Distance(
          ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tl."startLocationLng", tl."startLocationLat"), 4326)::geography
        ) / 1000 ASC
      `;
    }

    const results = await prisma.$queryRawUnsafe(query, ...params);
    
    const formattedResults = results.map((row: any) => {
      const listing: any = {};
      const provider: any = {};
      const user: any = {};
      
      for (const key in row) {
        if (key.startsWith('listing_')) {
          listing[key.replace('listing_', '')] = row[key];
        } else if (key.startsWith('provider_')) {
          provider[key.replace('provider_', '')] = row[key];
        } else if (key.startsWith('user_')) {
          user[key.replace('user_', '')] = row[key];
        } else if (key === 'distance_to_start_km' || key === 'distance_to_end_km' || key === 'route_distance_km') {
          listing[key] = row[key];
        }
      }
      
      provider.user = user;
      listing.provider = provider;
      
      return listing;
    });
    
    return formattedResults;
  } catch (error) {
    console.error("Error searching nearby listings:", error);
    throw error;
  }
}

/* Original search function (start location only)
async searchNearbyListings(
  lat: number,
  lng: number,
  radiusKm: number = 30,
  minSeats: number = 1,
  maxPrice?: number,
  departureAfter?: Date,
  departureBefore?: Date
): Promise<any> {
  try {
    let query = `
      SELECT
        -- Listing fields with table prefix
        tl.id as "listing_id", 
        tl."providerId" as "listing_providerId",
        tl."startLocationLat" as "listing_startLocationLat",
        tl."startLocationLng" as "listing_startLocationLng",
        tl."startLocationText" as "listing_startLocationText",
        tl."endLocationLat" as "listing_endLocationLat",
        tl."endLocationLng" as "listing_endLocationLng",
        tl."endLocationText" as "listing_endLocationText",
        tl."departureTime" as "listing_departureTime",
        tl."seatsAvailable" as "listing_seatsAvailable",
        tl."pricePerSeat" as "listing_pricePerSeat",
        tl."status" as "listing_status",
        tl."mediaUrls" as "listing_mediaUrls",
        tl."createdAt" as "listing_createdAt",
        
        -- Distance calculation from user to start
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tl."startLocationLng", tl."startLocationLat"), 4326)::geography
        ) / 1000 AS distance_km,
        
        -- Distance between start and end locations
        ST_Distance(
          ST_SetSRID(ST_MakePoint(tl."startLocationLng", tl."startLocationLat"), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tl."endLocationLng", tl."endLocationLat"), 4326)::geography
        ) / 1000 AS route_distance_km,
        
        -- Provider fields with prefix
        tp."providerId" as "provider_providerId",
        tp."licenseMmediaUrls" as "provider_licenseMmediaUrls",
        tp."vehicleMediaUrls" as "provider_vehicleMediaUrls",
        tp."vehicleType" as "provider_vehicleType",
        tp."seatsAvailable" as "provider_seatsAvailable",
        tp."createdAt" as "provider_createdAt",
        tp."accountStatus" as "provider_accountStatus",
        
        -- User fields with prefix
        u.id as "user_id",
        u.email as "user_email",
        u.username as "user_username",
        u."mediaUrls" as "user_mediaUrls",
        u."accountStatus" as "user_accountStatus",
        u."createdAt" as "user_createdAt"
        
      FROM "TransportationListing" tl
      JOIN "TransportationProvider" tp ON tl."providerId" = tp."providerId"
      JOIN "User" u ON tp."providerId" = u."id"
      WHERE 
    `;

    if (lat && lng) {
      query += `
        ST_DWithin(
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(tl."startLocationLng", tl."startLocationLat"), 4326)::geography,
          ${radiusKm * 1000}
        )
        AND 
      `;
    }

    query += `
      tl."status" = 'active'
      AND tl."departureTime" > NOW()
      AND tl."seatsAvailable" >= ${minSeats}
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (maxPrice !== undefined) {
      query += ` AND tl."pricePerSeat" <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    if (departureAfter !== undefined) {
      query += ` AND tl."departureTime" >= $${paramIndex}`;
      params.push(departureAfter);
      paramIndex++;
    }

    if (departureBefore !== undefined) {
      query += ` AND tl."departureTime" <= $${paramIndex}`;
      params.push(departureBefore);
      paramIndex++;
    }

    if (lat && lng) {
      query += ` ORDER BY distance_km ASC`;
    } else {
      query += ` ORDER BY tl."departureTime" ASC`;
    }

    const results = await prisma.$queryRawUnsafe(query, ...params);
    
    const formattedResults = results.map((row: any) => {
      const listing: any = {};
      const provider: any = {};
      const user: any = {};
      
      for (const key in row) {
        if (key.startsWith('listing_')) {
          listing[key.replace('listing_', '')] = row[key];
        } else if (key.startsWith('provider_')) {
          provider[key.replace('provider_', '')] = row[key];
        } else if (key.startsWith('user_')) {
          user[key.replace('user_', '')] = row[key];
        } else if (key === 'distance_km' || key === 'route_distance_km') {
          listing[key] = row[key];
        }
      }
      
      provider.user = user;
      listing.provider = provider;
      
      return listing;
    });
    
    return formattedResults;
  } catch (error) {
    console.error("Error searching nearby listings:", error);
    throw error;
  }
}
*/


  async getListingById(id: number): Promise<TransportationListing | null> {
    try {
      return await prisma.transportationListing.findUnique({
        where: { id },
        include: {
          provider: true,
          bookings: true,
          reviews: true,
        },
      });
    } catch (error) {
      console.error("Error retrieving listing:", error);
      throw error;
    }
  }

  async updateListing(
    id: number,
    updateData: Partial<TransportationListing>
  ): Promise<TransportationListing> {
    try {
      return await prisma.transportationListing.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      console.error("Error updating listing:", error);
      throw error;
    }
  }

  async deleteListing(id: number): Promise<TransportationListing> {
    try {
      return await prisma.transportationListing.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Error deleting listing:", error);
      throw error;
    }
  }

  async getListingsByProvider(providerId: string): Promise<TransportationListing[]> {
    try {
      return await prisma.transportationListing.findMany({
        where: { providerId },
        orderBy: { departureTime: 'asc' },
      });
    } catch (error) {
      console.error("Error retrieving provider listings:", error);
      throw error;
    }
  }

  async searchListingsByRoute(
    startLocationText: string,
    endLocationText: string,
    departureDate?: Date
  ): Promise<TransportationListing[]> {
    try {
      const whereClause: any = {
        startLocationText: { contains: startLocationText, mode: 'insensitive' },
        endLocationText: { contains: endLocationText, mode: 'insensitive' },
        status: 'active',
        seatsAvailable: { gt: 0 },
        departureTime: { gt: new Date() },
      };

      if (departureDate) {
        const startOfDay = new Date(departureDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(departureDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        whereClause.departureTime = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }

      return await prisma.transportationListing.findMany({
        where: whereClause,
        orderBy: { departureTime: 'asc' },
      });
    } catch (error) {
      console.error("Error searching listings by route:", error);
      throw error;
    }
  }
}