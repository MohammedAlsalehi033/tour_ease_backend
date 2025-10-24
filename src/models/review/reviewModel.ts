import { BaseReviewModel } from "./reviewBaseModel";
import { Review, PrismaClient } from "@prisma/client";
import { prisma } from '../../utils/prismaClient';

export class PrismaReviewModel extends BaseReviewModel<Review> {
  async getAllItems(
    page = 1,
    limit = 10,
    sort = "newest"
  ): Promise<Review[]> {
    const skip = (page - 1) * limit;

    let orderBy = {};
    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "highest_rating":
        orderBy = { rating: "desc" };
        break;
      case "lowest_rating":
        orderBy = { rating: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    return prisma.review.findMany({
      skip,
      take: limit,
      orderBy,
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        transportationListing: {
          select: {
            id: true,
            startLocationText: true,
            endLocationText: true,
            departureTime: true,
          },
        },
        accommodation: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        room: {
          select: {
            id: true,
            roomType: true,
            capacity: true,
          },
        },
        transportationBooking: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
        accommodationBooking: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
      },
    });
  }

  async getItemById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { id: typeof id === "string" ? parseInt(id) : id },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        transportationListing: {
          select: {
            id: true,
            startLocationText: true,
            endLocationText: true,
            departureTime: true,
          },
        },
        accommodation: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        room: {
          select: {
            id: true,
            roomType: true,
            capacity: true,
          },
        },
        transportationBooking: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
        accommodationBooking: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
      },
    });
  }

  async createItem(data: any): Promise<Review> {
    const reviewData: any = {
      reviewerId: data.reviewerId,
      reviewableType: data.reviewableType,
      rating: data.rating,
      comment: data.comment,
    };

    // Add the appropriate foreign key based on reviewableType
    switch (data.reviewableType) {
      case "TRANSPORTATION_LISTING":
        reviewData.transportationListingId = data.reviewableId;
        break;
      case "TRANSPORTATION_PROVIDER":
        // No special field needed for transportation provider reviews
        // The reviewableType and reviewableId are sufficient
        break;
      case "ACCOMMODATION":
        reviewData.accommodationId = data.reviewableId;
        break;
      case "ROOM":
        reviewData.roomId = data.reviewableId;
        break;
      case "TRANSPORTATION_BOOKING":
        reviewData.transportationBookingId = data.reviewableId;
        break;
      case "ACCOMMODATION_BOOKING":
        reviewData.accommodationBookingId = data.reviewableId;
        break;
    }

    return prisma.review.create({
      data: reviewData,
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
      },
    });
  }

  async updateItem(id: number | string, data: any): Promise<Review> {
    return prisma.review.update({
      where: { id: typeof id === "string" ? parseInt(id) : id },
      data: {
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
      },
    });
  }

  async deleteItem(id: number | string): Promise<Review> {
    return prisma.review.delete({
      where: { id: typeof id === "string" ? parseInt(id) : id },
    });
  }

  async searchItems(query: string, page = 1, limit = 10): Promise<Review[]> {
    const skip = (page - 1) * limit;

    return prisma.review.findMany({
      where: {
        OR: [
          { comment: { contains: query, mode: "insensitive" } },
          { reviewableType: { contains: query, mode: "insensitive" } },
        ],
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
      },
    });
  }

  async getReviewsByReviewableType(
    reviewableType: string,
    reviewableId: number,
    page = 1,
    limit = 10
  ): Promise<Review[]> {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      reviewableType,
    };

    // Add the appropriate foreign key condition
    switch (reviewableType) {
      case "TRANSPORTATION_LISTING":
        whereClause.transportationListingId = reviewableId;
        break;
      case "ACCOMMODATION":
        whereClause.accommodationId = reviewableId;
        break;
      case "ROOM":
        whereClause.roomId = reviewableId;
        break;
      case "TRANSPORTATION_BOOKING":
        whereClause.transportationBookingId = reviewableId;
        break;
      case "ACCOMMODATION_BOOKING":
        whereClause.accommodationBookingId = reviewableId;
        break;
    }

    return prisma.review.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
      },
    });
  }

  async getReviewsByReviewer(
    reviewerId: string,
    page = 1,
    limit = 10
  ): Promise<Review[]> {
    const skip = (page - 1) * limit;

    return prisma.review.findMany({
      where: { reviewerId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        transportationListing: {
          select: {
            id: true,
            startLocationText: true,
            endLocationText: true,
            departureTime: true,
          },
        },
        accommodation: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        room: {
          select: {
            id: true,
            roomType: true,
            capacity: true,
          },
        },
        transportationBooking: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
        accommodationBooking: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
      },
    });
  }

  async getAverageRating(reviewableType: string, reviewableId: number): Promise<number> {
    const whereClause: any = {
      reviewableType,
    };

    // Add the appropriate foreign key condition
    switch (reviewableType) {
      case "TRANSPORTATION_LISTING":
        whereClause.transportationListingId = reviewableId;
        break;
      case "ACCOMMODATION":
        whereClause.accommodationId = reviewableId;
        break;
      case "ROOM":
        whereClause.roomId = reviewableId;
        break;
      case "TRANSPORTATION_BOOKING":
        whereClause.transportationBookingId = reviewableId;
        break;
      case "ACCOMMODATION_BOOKING":
        whereClause.accommodationBookingId = reviewableId;
        break;
    }

    const result = await prisma.review.aggregate({
      where: whereClause,
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating || 0;
  }

  async getReviewStats(reviewableType: string, reviewableId: number): Promise<any> {
    const whereClause: any = {
      reviewableType,
    };

    // Add the appropriate foreign key condition
    switch (reviewableType) {
      case "TRANSPORTATION_LISTING":
        whereClause.transportationListingId = reviewableId;
        break;
      case "TRANSPORTATION_PROVIDER":
        // For transportation provider reviews, we don't need to add any additional conditions
        // since the reviewableType and reviewableId are sufficient
        break;
      case "ACCOMMODATION":
        whereClause.accommodationId = reviewableId;
        break;
      case "ROOM":
        whereClause.roomId = reviewableId;
        break;
      case "TRANSPORTATION_BOOKING":
        whereClause.transportationBookingId = reviewableId;
        break;
      case "ACCOMMODATION_BOOKING":
        whereClause.accommodationBookingId = reviewableId;
        break;
    }

    const [totalReviews, averageRating, ratingDistribution] = await Promise.all([
      prisma.review.count({ where: whereClause }),
      prisma.review.aggregate({
        where: whereClause,
        _avg: { rating: true },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: whereClause,
        _count: { rating: true },
      }),
    ]);

    return {
      totalReviews,
      averageRating: averageRating._avg.rating || 0,
      ratingDistribution: ratingDistribution.reduce((acc, item) => {
        acc[item.rating] = item._count.rating;
        return acc;
      }, {} as Record<number, number>),
    };
  }

  async checkExistingReview(
    reviewerId: string,
    reviewableType: string,
    reviewableId: number
  ): Promise<Review | null> {
    const whereClause: any = {
      reviewerId,
      reviewableType,
    };

    // Add the appropriate foreign key condition
    switch (reviewableType) {
      case "TRANSPORTATION_LISTING":
        whereClause.transportationListingId = reviewableId;
        break;
      case "ACCOMMODATION":
        whereClause.accommodationId = reviewableId;
        break;
      case "ROOM":
        whereClause.roomId = reviewableId;
        break;
      case "TRANSPORTATION_BOOKING":
        whereClause.transportationBookingId = reviewableId;
        break;
      case "ACCOMMODATION_BOOKING":
        whereClause.accommodationBookingId = reviewableId;
        break;
    }

    return prisma.review.findFirst({
      where: whereClause,
    });
  }
}
