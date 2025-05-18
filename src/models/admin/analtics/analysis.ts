import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from "../../../utils/prismaClient"; // Assuming your prisma client instance is exported here
import { Decimal } from '@prisma/client/runtime/library';

// Optional: Define interfaces for filter parameters for better type safety
export interface DateRangeFilter {
    startDate?: Date;
    endDate?: Date;
}

export  interface LocationFilter {
    location?: string; // For accommodation
    startLocation?: string; // For transportation
    endLocation?: string; // For transportation
}

export interface UserTypeFilter {
    // Define how you identify user types, e.g., by role name or ID
    roleName?: string; // Example: 'TRAVELER', 'TRANSPORTATION_PROVIDER'
}

export interface StatusFilter {
    status?: string;
}

// Combined filter type
export  interface AnalyticsFilters extends DateRangeFilter, LocationFilter, UserTypeFilter, StatusFilter {}

// Define return types for clarity (examples)
export  interface CountOverTime {
    date: Date | string; // Date or truncated date string (e.g., YYYY-MM-DD)
    count: number;
}

export  interface ValueOverTime {
    date: Date | string;
    value: Decimal | number; // Prisma returns Decimal, might convert to number
}

export interface GroupedCount {
    category: string | number; // The category grouped by (e.g., status, type)
    count: number;
}

export interface GroupedAverage {
    category: string | number;
    average: number | null;
}


export class AnalyticsModel {

    // --- User Analytics ---

    async getTotalUserCount(filters: DateRangeFilter = {}): Promise<number> {
        const where: Prisma.UserWhereInput = {};
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        return await prisma.user.count({ where });
    }

    async getUserRegistrationsOverTime(interval: 'day' | 'week' | 'month' = 'day', filters: DateRangeFilter = {}): Promise<CountOverTime[]> {


        const startDate = filters.startDate?.toISOString();
        const endDate = filters.endDate?.toISOString();

        const dateTruncInterval = interval;

        const result: any[] = await prisma.$queryRaw`
            SELECT DATE_TRUNC(${dateTruncInterval}, "createdAt")::DATE as date, COUNT(id)::INTEGER as count
            FROM "User"
            WHERE ("createdAt" >= ${startDate}::TIMESTAMP OR ${startDate} IS NULL)
              AND ("createdAt" <= ${endDate}::TIMESTAMP OR ${endDate} IS NULL)
            GROUP BY date
            ORDER BY date ASC;
        `;
        return result.map(r => ({ ...r, date: r.date.toISOString().split('T')[0] })); // Format date string
    }

    async getUserCountByRole(filters: DateRangeFilter = {}): Promise<GroupedCount[]> {
         const where: Prisma.UserRoleWhereInput = {};
         if (filters.startDate || filters.endDate) {
             where.user = { createdAt: {} };
             if (filters.startDate) where.user.createdAt.gte = filters.startDate;
             if (filters.endDate) where.user.createdAt.lte = filters.endDate;
         }

         const result = await prisma.userRole.groupBy({
             by: ['roleId'],
             _count: {
                 userId: true
             },
             where: where,
         });

        // Fetch role names for better readability
        const roleIds = result.map(r => r.roleId);
        const roles = await prisma.role.findMany({ where: { id: { in: roleIds } } });
        const roleMap = new Map(roles.map(r => [r.id, r.roleName]));

        return result.map(r => ({
            category: roleMap.get(r.roleId) || `RoleID_${r.roleId}`, // Use role name or ID as fallback
            count: r._count.userId
        }));
    }

    async getUserCountByStatus(filters: DateRangeFilter = {}): Promise<GroupedCount[]> {
        const where: Prisma.UserWhereInput = {};
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        const result = await prisma.user.groupBy({
            by: ['accountStatus'],
            _count: {
                id: true
            },
            where: where
        });
        return result.map(r => ({ category: r.accountStatus, count: r._count.id }));
    }


    // --- Booking Analytics (Transportation) ---

    async getTotalTransportationBookings(filters: AnalyticsFilters = {}): Promise<number> {
        const where = this.buildTransportationBookingWhere(filters);
        return await prisma.transportationBooking.count({ where });
    }

    async getTransportationBookingVolumeOverTime(interval: 'day' | 'week' | 'month' = 'day', filters: AnalyticsFilters = {}): Promise<CountOverTime[]> {
        const whereClause = this.buildTransportationBookingWhereRaw(filters); // Helper to build WHERE parts
        const dateTruncInterval = interval;

         const result: any[] = await prisma.$queryRawUnsafe(`
            SELECT DATE_TRUNC('${dateTruncInterval}', "createdAt")::DATE as date, COUNT(id)::INTEGER as count
            FROM "TransportationBooking"
            ${whereClause}
            GROUP BY date
            ORDER BY date ASC;
        `); 

         return result.map(r => ({ ...r, date: r.date.toISOString().split('T')[0] }));
    }

     async getTransportationBookingValueOverTime(interval: 'day' | 'week' | 'month' = 'day', filters: AnalyticsFilters = {}): Promise<ValueOverTime[]> {
        const whereClause = this.buildTransportationBookingWhereRaw(filters);
        const dateTruncInterval = interval;

         const result: any[] = await prisma.$queryRawUnsafe(`
            SELECT DATE_TRUNC('${dateTruncInterval}', "createdAt")::DATE as date, SUM("totalPrice") as value
            FROM "TransportationBooking"
            ${whereClause}
            GROUP BY date
            ORDER BY date ASC;
        `);

         return result.map(r => ({
            date: r.date.toISOString().split('T')[0],
            value: r.value ? parseFloat(r.value.toString()) : 0 // Handle potential null SUM
         }));
    }

    async getAverageTransportationBookingValue(filters: AnalyticsFilters = {}): Promise<number | null> {
       const where = this.buildTransportationBookingWhere(filters);
       const result = await prisma.transportationBooking.aggregate({
           _avg: {
               totalPrice: true
           },
           where: where
       });
       // Convert Decimal to number
       return result._avg.totalPrice ? parseFloat(result._avg.totalPrice.toString()) : null;
    }

    async getTransportationBookingStatusDistribution(filters: AnalyticsFilters = {}): Promise<GroupedCount[]> {
        const where = this.buildTransportationBookingWhere(filters);
        const result = await prisma.transportationBooking.groupBy({
            by: ['status'],
            _count: {
                id: true
            },
            where: where
        });
        return result.map(r => ({ category: r.status, count: r._count.id }));
    }

    // --- Booking Analytics (Accommodation) --- (Similar structure as Transportation)

    async getTotalAccommodationBookings(filters: AnalyticsFilters = {}): Promise<number> {
        const where = this.buildAccommodationBookingWhere(filters);
        return await prisma.accommodationBooking.count({ where });
    }

     async getAccommodationBookingVolumeOverTime(interval: 'day' | 'week' | 'month' = 'day', filters: AnalyticsFilters = {}): Promise<CountOverTime[]> {
        const whereClause = this.buildAccommodationBookingWhereRaw(filters);
        const dateTruncInterval = interval;

         const result: any[] = await prisma.$queryRawUnsafe(`
            SELECT DATE_TRUNC('${dateTruncInterval}', "createdAt")::DATE as date, COUNT(id)::INTEGER as count
            FROM "AccommodationBooking"
            ${whereClause}
            GROUP BY date
            ORDER BY date ASC;
        `);

         return result.map(r => ({ ...r, date: r.date.toISOString().split('T')[0] }));
    }

     async getAccommodationBookingValueOverTime(interval: 'day' | 'week' | 'month' = 'day', filters: AnalyticsFilters = {}): Promise<ValueOverTime[]> {
        const whereClause = this.buildAccommodationBookingWhereRaw(filters);
        const dateTruncInterval = interval;

         const result: any[] = await prisma.$queryRawUnsafe(`
            SELECT DATE_TRUNC('${dateTruncInterval}', "createdAt")::DATE as date, SUM("totalPrice") as value
            FROM "AccommodationBooking"
            ${whereClause}
            GROUP BY date
            ORDER BY date ASC;
        `);

         return result.map(r => ({
            date: r.date.toISOString().split('T')[0],
            value: r.value ? parseFloat(r.value.toString()) : 0
         }));
    }

    async getAverageAccommodationBookingValue(filters: AnalyticsFilters = {}): Promise<number | null> {
       const where = this.buildAccommodationBookingWhere(filters);
       const result = await prisma.accommodationBooking.aggregate({
           _avg: {
               totalPrice: true
           },
           where: where
       });
       return result._avg.totalPrice ? parseFloat(result._avg.totalPrice.toString()) : null;
    }

    async getAccommodationBookingStatusDistribution(filters: AnalyticsFilters = {}): Promise<GroupedCount[]> {
        const where = this.buildAccommodationBookingWhere(filters);
        const result = await prisma.accommodationBooking.groupBy({
            by: ['status'],
            _count: {
                id: true
            },
            where: where
        });
        return result.map(r => ({ category: r.status, count: r._count.id }));
    }

    // --- Content & Engagement Analytics ---

    async getQuestionCountOverTime(interval: 'day' | 'week' | 'month' = 'day', filters: DateRangeFilter = {}): Promise<CountOverTime[]> {
        // $queryRaw for date grouping
        const startDate = filters.startDate?.toISOString();
        const endDate = filters.endDate?.toISOString();
        const dateTruncInterval = interval;

        const result: any[] = await prisma.$queryRaw`
            SELECT DATE_TRUNC(${dateTruncInterval}, "createdAt")::DATE as date, COUNT(id)::INTEGER as count
            FROM "Question"
            WHERE ("createdAt" >= ${startDate}::TIMESTAMP OR ${startDate} IS NULL)
              AND ("createdAt" <= ${endDate}::TIMESTAMP OR ${endDate} IS NULL)
            GROUP BY date
            ORDER BY date ASC;
        `;
        return result.map(r => ({ ...r, date: r.date.toISOString().split('T')[0] }));
    }

    async getReviewCountOverTime(interval: 'day' | 'week' | 'month' = 'day', filters: DateRangeFilter = {}): Promise<CountOverTime[]> {
         // $queryRaw for date grouping
        const startDate = filters.startDate?.toISOString();
        const endDate = filters.endDate?.toISOString();
        const dateTruncInterval = interval;

        const result: any[] = await prisma.$queryRaw`
            SELECT DATE_TRUNC(${dateTruncInterval}, "createdAt")::DATE as date, COUNT(id)::INTEGER as count
            FROM "Review"
            WHERE ("createdAt" >= ${startDate}::TIMESTAMP OR ${startDate} IS NULL)
              AND ("createdAt" <= ${endDate}::TIMESTAMP OR ${endDate} IS NULL)
            GROUP BY date
            ORDER BY date ASC;
        `;
        return result.map(r => ({ ...r, date: r.date.toISOString().split('T')[0] }));
    }

    async getOfferActivityByStatus(filters: DateRangeFilter = {}): Promise<GroupedCount[]> {
         const where: Prisma.OfferWhereInput = {};
         if (filters.startDate || filters.endDate) {
             where.createdAt = {};
             if (filters.startDate) where.createdAt.gte = filters.startDate;
             if (filters.endDate) where.createdAt.lte = filters.endDate;
         }
         const result = await prisma.offer.groupBy({
            by: ['status'],
            _count: { id: true },
            where: where
         });
          return result.map(r => ({ category: r.status, count: r._count.id }));
    }


    // --- Satisfaction & Rating Analytics ---

    async getAverageRatingOverall(filters: DateRangeFilter = {}): Promise<number | null> {
        const where: Prisma.ReviewWhereInput = {};
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        const result = await prisma.review.aggregate({
            _avg: { rating: true },
            where: where
        });
        return result._avg.rating; // Prisma aggregate avg returns number | null directly
    }

    async getAverageRatingByType(filters: DateRangeFilter = {}): Promise<GroupedAverage[]> {
         const where: Prisma.ReviewWhereInput = {};
         if (filters.startDate || filters.endDate) {
             where.createdAt = {};
             if (filters.startDate) where.createdAt.gte = filters.startDate;
             if (filters.endDate) where.createdAt.lte = filters.endDate;
         }
         const result = await prisma.review.groupBy({
             by: ['reviewableType'],
             _avg: { rating: true },
             where: where
         });
         return result.map(r => ({ category: r.reviewableType, average: r._avg.rating }));
    }

     async getRatingDistribution(filters: DateRangeFilter & { reviewableType?: string } = {}): Promise<GroupedCount[]> {
        const where: Prisma.ReviewWhereInput = {};
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        if (filters.reviewableType) {
            where.reviewableType = filters.reviewableType;
        }

        const result = await prisma.review.groupBy({
            by: ['rating'],
            _count: { id: true },
            orderBy: { rating: 'asc' },
            where: where
        });
        return result.map(r => ({ category: r.rating, count: r._count.id }));
    }

    // --- Provider Analytics ---

    async getTransportationProviderCountByStatus(filters: DateRangeFilter = {}): Promise<GroupedCount[]> {
        const where: Prisma.TransportationProviderWhereInput = {};
        if (filters.startDate || filters.endDate) {
            where.createdAt = {}; // Assuming you want to filter by registration date
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        const result = await prisma.transportationProvider.groupBy({
            by: ['accountStatus'],
            _count: { providerId: true },
            where: where
        });
        return result.map(r => ({ category: r.accountStatus, count: r._count.providerId }));
    }

    async getAccommodationProviderCount(filters: DateRangeFilter = {}): Promise<number> {
        const where: Prisma.AccommodationProviderWhereInput = {};
         if (filters.startDate || filters.endDate) {
             where.createdAt = {}; // Assuming filter by registration date
             if (filters.startDate) where.createdAt.gte = filters.startDate;
             if (filters.endDate) where.createdAt.lte = filters.endDate;
         }
         return await prisma.accommodationProvider.count({ where });
    }

    // --- Financial Analytics ---

    async getTotalRevenue(filters: DateRangeFilter & StatusFilter = {}): Promise<{ transportation: Decimal, accommodation: Decimal, total: Decimal }> {
        // Using 'confirmed' or similar status might be more accurate for revenue
        const bookingStatus = filters.status || 'confirmed'; // Default to confirmed? Or handle multiple statuses

        const transWhere: Prisma.TransportationBookingWhereInput = { status: bookingStatus };
        const accWhere: Prisma.AccommodationBookingWhereInput = { status: bookingStatus };

        if (filters.startDate || filters.endDate) {
            transWhere.createdAt = {};
            accWhere.createdAt = {};
            if (filters.startDate) {
                transWhere.createdAt.gte = filters.startDate;
                accWhere.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                transWhere.createdAt.lte = filters.endDate;
                 accWhere.createdAt.lte = filters.endDate;
            }
        }

        const transRevenue = await prisma.transportationBooking.aggregate({
            _sum: { totalPrice: true },
            where: transWhere
        });

        const accRevenue = await prisma.accommodationBooking.aggregate({
            _sum: { totalPrice: true },
            where: accWhere
        });

        const transTotal = transRevenue._sum.totalPrice ?? new Decimal(0);
        const accTotal = accRevenue._sum.totalPrice ?? new Decimal(0);
        const total = transTotal.add(accTotal);

        return {
            transportation: transTotal,
            accommodation: accTotal,
            total: total
        };
    }


    // --- Helper methods for building WHERE clauses ---

    private buildTransportationBookingWhere(filters: AnalyticsFilters): Prisma.TransportationBookingWhereInput {
        const where: Prisma.TransportationBookingWhereInput = {};

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        // Location filtering needs joins - complex with ORM's basic where.
        // Usually better handled in $queryRaw or by filtering after a broader fetch if performance allows.
        // Example (might require adjustments based on exact relations):
        // if (filters.startLocation || filters.endLocation) {
        //     where.listing = {
        //         ...(filters.startLocation && { startLocationText: filters.startLocation }),
        //         ...(filters.endLocation && { endLocationText: filters.endLocation }),
        //     };
        // }

        // UserType filtering also complex via ORM's basic where
        // if (filters.roleName) {
        //     where.traveler = {
        //         roles: { some: { role: { roleName: filters.roleName } } }
        //     }
        // }

        return where;
    }

     private buildAccommodationBookingWhere(filters: AnalyticsFilters): Prisma.AccommodationBookingWhereInput {
        const where: Prisma.AccommodationBookingWhereInput = {};

        if (filters.startDate || filters.endDate) {
            // Could filter on createdAt, checkInDate, checkOutDate depending on need
             where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        // Location filtering
        // if (filters.location) {
        //     where.room = {
        //         accommodation: {
        //             location: filters.location
        //         }
        //     };
        // }

         // UserType filtering
        // if (filters.roleName) {
        //     where.traveler = {
        //         roles: { some: { role: { roleName: filters.roleName } } }
        //     }
        // }


        return where;
    }

    // --- Helpers for building RAW WHERE clauses (example, needs expansion) ---
    // IMPORTANT: Ensure proper SQL injection prevention if using user inputs directly! Use parameterized queries.
    // These helpers are simplified and may need robust parameter handling.
    private buildTransportationBookingWhereRaw(filters: AnalyticsFilters): string {
        let conditions: string[] = [];
        // Use parameters in $queryRaw variants instead of direct interpolation for security
        // This helper shows logic; actual implementation should use parameter array passed to $queryRaw
        if (filters.startDate) conditions.push(`"createdAt" >= '${filters.startDate.toISOString()}'::TIMESTAMP`);
        if (filters.endDate) conditions.push(`"createdAt" <= '${filters.endDate.toISOString()}'::TIMESTAMP`);
        if (filters.status) conditions.push(`"status" = '${filters.status}'`); // Escape string properly!

        // Location/UserType filters would require adding JOINs to the raw query and filtering on joined tables

        return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }

     private buildAccommodationBookingWhereRaw(filters: AnalyticsFilters): string {
         let conditions: string[] = [];
        // Similar structure to transportation, potentially different date fields (e.g., checkInDate)
        if (filters.startDate) conditions.push(`"createdAt" >= '${filters.startDate.toISOString()}'::TIMESTAMP`);
        if (filters.endDate) conditions.push(`"createdAt" <= '${filters.endDate.toISOString()}'::TIMESTAMP`);
        if (filters.status) conditions.push(`"status" = '${filters.status}'`);

         // Location/UserType filters would require adding JOINs
        return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }

}

