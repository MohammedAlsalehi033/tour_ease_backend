import { User, Role, Review } from '@prisma/client';

// Extend the Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User & {
        roles: Array<{
          role: Role;
        }>;
      };
    }
  }
}

// Review-related types
export interface CreateReviewRequest {
  reviewableType: string;
  reviewableId: number;
  rating: number;
  comment: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

export interface ReviewWithRelations extends Review {
  reviewer: {
    id: string;
    username: string;
    mediaUrls: string[];
  };
  transportationListing?: {
    id: number;
    startLocationText: string;
    endLocationText: string;
    departureTime: Date;
  };
  accommodation?: {
    id: number;
    name: string;
    location: string;
  };
  room?: {
    id: number;
    roomType: string;
    capacity: number;
  };
  transportationBooking?: {
    id: number;
    status: string;
    totalPrice: number;
  };
  accommodationBooking?: {
    id: number;
    status: string;
    totalPrice: number;
  };
}

export {};
