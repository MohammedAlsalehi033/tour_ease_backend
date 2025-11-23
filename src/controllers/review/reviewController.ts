import { Request, Response } from 'express';
import { PrismaReviewModel } from '../../models/review/reviewModel';
import { PrismaClient, Review } from '@prisma/client';

const prisma = new PrismaClient();
const reviewModel = new PrismaReviewModel();

export class ReviewController {
  // Create a new review
  async createReview(req: Request, res: Response) {
    try {
      const {
        reviewableType,
        reviewableId,
        rating,
        comment,
        accommodationBookingId, // Extract accommodation booking ID if provided
      } = req.body;

      // DEBUG LOGGING - Remove after testing
      console.log('==========================================');
      console.log('📝 REVIEW CREATION REQUEST');
      console.log('reviewableType:', reviewableType);
      console.log('reviewableId:', reviewableId);
      console.log('accommodationBookingId:', accommodationBookingId);
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('==========================================');

      const reviewerId = req.user?.id;
      if (!reviewerId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Validate required fields
      if (!reviewableType || !reviewableId || !rating || !comment) {
        return res.status(400).json({
          success: false,
          message: 'reviewableType, reviewableId, rating, and comment are required',
        });
      }

      // Validate rating (1-5)
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      // Check if user has already reviewed this item
      const existingReview = await reviewModel.checkExistingReview(
        reviewerId,
        reviewableType,
        parseInt(reviewableId)
      );

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this item',
        });
      }

      // // Validate that the reviewable item exists and user has access to review it
      // const hasAccess = await this.validateReviewAccess(
      //   reviewerId,
      //   reviewableType,
      //   parseInt(reviewableId)
      // );

      // if (!hasAccess) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'You do not have permission to review this item',
      //   });
      // }

      let reviews: Review[] = [];
      
      if (reviewableType === 'TRANSPORTATION_BOOKING') {
        // First, create the booking review
        const bookingReview = await reviewModel.createItem({
          reviewerId,
          reviewableType: 'TRANSPORTATION_BOOKING',
          reviewableId: parseInt(reviewableId),
          rating,
          comment,
        });
        reviews.push(bookingReview);

        // Then, create a review for the driver
        const booking = await prisma.transportationBooking.findUnique({
          where: { id: parseInt(reviewableId) },
          include: {
            listing: {
              include: {
                provider: true
              }
            }
          }
        });

        if (booking && booking.listing?.provider) {
          const driverReview = await reviewModel.createItem({
            reviewerId,
            reviewableType: 'TRANSPORTATION_PROVIDER',
            reviewableId: parseInt(booking.listing.providerId),
            rating,
            comment,
          });
          reviews.push(driverReview);
        }
      } else if (reviewableType === 'ACCOMMODATION' && accommodationBookingId) {
        console.log('🎯 DUAL REVIEW MODE: Creating 2 reviews for accommodation booking');
        // When reviewing accommodation from a booking, create TWO reviews:
        // 1. Review for the accommodation (with booking association)
        const accommodationReview = await reviewModel.createItem({
          reviewerId,
          reviewableType: 'ACCOMMODATION',
          reviewableId: parseInt(reviewableId),
          rating,
          comment,
          accommodationBookingId: parseInt(accommodationBookingId),
        });
        reviews.push(accommodationReview);
        console.log('✅ Created accommodation review with booking association:', accommodationReview.id);

        // 2. Review for the accommodation booking itself
        const bookingReview = await reviewModel.createItem({
          reviewerId,
          reviewableType: 'ACCOMMODATION_BOOKING',
          reviewableId: parseInt(accommodationBookingId),
          rating,
          comment,
        });
        reviews.push(bookingReview);
        console.log('✅ Created accommodation booking review:', bookingReview.id);
      } else if (reviewableType === 'ACCOMMODATION') {
        console.log('⚠️ SINGLE REVIEW MODE: No accommodationBookingId provided');
        console.log('   This happens when reviewing accommodation directly (not from booking)');
        // Default case for single review
        const reviewData: any = {
          reviewerId,
          reviewableType,
          reviewableId: parseInt(reviewableId),
          rating,
          comment,
        };
        
        // Add accommodationBookingId if provided
        if (accommodationBookingId) {
          reviewData.accommodationBookingId = parseInt(accommodationBookingId);
          console.log('✅ accommodationBookingId added to reviewData:', reviewData.accommodationBookingId);
        }
        
        console.log('Final reviewData:', JSON.stringify(reviewData, null, 2));
        const review = await reviewModel.createItem(reviewData);
        console.log('✅ Review created with ID:', review.id);
        console.log('   accommodationBookingId in DB:', review.accommodationBookingId || 'NOT SET');
        reviews.push(review);
      } else {
        // Default case for single review
        const reviewData: any = {
          reviewerId,
          reviewableType,
          reviewableId: parseInt(reviewableId),
          rating,
          comment,
        };
        
        // Add accommodationBookingId if provided
        if (accommodationBookingId) {
          reviewData.accommodationBookingId = parseInt(accommodationBookingId);
          console.log('✅ accommodationBookingId added to reviewData:', reviewData.accommodationBookingId);
        }
        
        console.log('Final reviewData:', JSON.stringify(reviewData, null, 2));
        const review = await reviewModel.createItem(reviewData);
        console.log('✅ Review created with ID:', review.id);
        console.log('   accommodationBookingId in DB:', review.accommodationBookingId || 'NOT SET');
        reviews.push(review);
      }

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: reviews.length === 1 ? reviews[0] : reviews,
      });
    } catch (error: any) {
      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Get all reviews with pagination and filtering
  async getAllReviews(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'newest',
        reviewableType,
        minRating,
        maxRating,
      } = req.query;

      let reviews = await reviewModel.getAllItems(
        parseInt(page as string),
        parseInt(limit as string),
        sort as string
      );

      // Apply additional filters
      if (reviewableType) {
        reviews = reviews.filter(review => review.reviewableType === reviewableType);
      }

      if (minRating) {
        reviews = reviews.filter(review => review.rating >= parseInt(minRating as string));
      }

      if (maxRating) {
        reviews = reviews.filter(review => review.rating <= parseInt(maxRating as string));
      }

      res.status(200).json({
        success: true,
        data: reviews,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: reviews.length,
        },
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get reviews for a specific reviewable item
  async getReviewsByItem(req: Request, res: Response) {
    try {
      const { reviewableType, reviewableId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Special handling for driver stats
      if (reviewableType === 'TRANSPORTATION_PROVIDER') {
        // First get all listings for this provider
        const listings = await prisma.transportationListing.findMany({
          where: {
            providerId: reviewableId
          },
          include: {
            bookings: {
              where: {
                status: 'complete' 
              },
              include: {
                reviews: {
                  include: {
                    reviewer: {
                      select: {
                        id: true,
                        username: true,
                        mediaUrls: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        // Collect all reviews from complete bookings
        const reviews = listings.flatMap(listing => 
          listing.bookings.flatMap(booking => booking.reviews)
        ).slice((parseInt(page as string) - 1) * parseInt(limit as string), parseInt(page as string) * parseInt(limit as string));

        // Calculate stats
        const totalReviews = reviews.length;
        const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

        // Calculate rating distribution
        const ratingDistribution = reviews.reduce((acc, review) => {
          acc[review.rating] = (acc[review.rating] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        return res.status(200).json({
          success: true,
          data: {
            reviews,
            stats: {
              totalReviews,
              averageRating,
              ratingDistribution
            }
          },
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: reviews.length,
          },
        });
      }

      const reviews = await reviewModel.getReviewsByReviewableType(
        reviewableType,
        parseInt(reviewableId),
        parseInt(page as string),
        parseInt(limit as string)
      );

      const stats = await reviewModel.getReviewStats(
        reviewableType,
        parseInt(reviewableId)
      );

      res.status(200).json({
        success: true,
        data: {
          reviews,
          stats,
        },
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: reviews.length,
        },
      });
    } catch (error: any) {
      console.error('Error fetching reviews by item:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Get reviews by a specific reviewer
  async getReviewsByReviewer(req: Request, res: Response) {
    try {
      const { reviewerId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const reviews = await reviewModel.getReviewsByReviewer(
        reviewerId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: reviews,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: reviews.length,
        },
      });
    } catch (error : any) {
      console.error('Error fetching reviews by reviewer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  async getMyReviews(req: Request, res: Response) {
    try {
      const reviewerId = req.user?.id;
      if (!reviewerId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const { page = 1, limit = 10 } = req.query;

      const reviews = await reviewModel.getReviewsByReviewer(
        reviewerId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: reviews,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: reviews.length,
        },
      });
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getReviewById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const review = await reviewModel.getItemById(id);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error) {
      console.error('Error fetching review:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update a review (only by the reviewer)
  async updateReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      // Check if review exists and belongs to user
      const existingReview = await reviewModel.getItemById(id);
      if (!existingReview) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      if (existingReview.reviewerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own reviews',
        });
      }

      const updatedReview = await reviewModel.updateItem(id, {
        rating: rating || existingReview.rating,
        comment: comment || existingReview.comment,
      });

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: updatedReview,
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete a review (only by the reviewer or admin)
  async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const userRole = req.user?.roles?.[0]?.role?.roleName; // Assuming role is available in req.user

      // Check if review exists
      const existingReview = await reviewModel.getItemById(id);
      if (!existingReview) {
        return res.status(404).json({
          success: false,
          message: 'Review not found',
        });
      }

      // Check if user can delete (reviewer or admin)
      if (existingReview.reviewerId !== userId && !userRole?.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own reviews',
        });
      }

      await reviewModel.deleteItem(id);

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get review statistics for an item
  async getReviewStats(req: Request, res: Response) {
    try {
      const { reviewableType, reviewableId } = req.params;

      const stats = await reviewModel.getReviewStats(
        reviewableType,
        parseInt(reviewableId)
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching review statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Search reviews
  async searchReviews(req: Request, res: Response) {
    try {
      const { query, page = 1, limit = 10 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const reviews = await reviewModel.searchItems(
        query as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: reviews,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: reviews.length,
        },
      });
    } catch (error) {
      console.error('Error searching reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Helper method to validate if user has access to review an item
  private async validateReviewAccess(
    userId: string,
    reviewableType: string,
    reviewableId: number
  ): Promise<boolean> {
    try {
      switch (reviewableType) {
        case 'TRANSPORTATION_LISTING':
          // Check if user has a booking for this listing
          const booking = await prisma.transportationBooking.findFirst({
            where: {
              travelerId: userId,
              transportationListingId: reviewableId,
              status: 'complete', // Only allow reviews for complete bookings
            },
          });
          return !!booking;

        case 'ACCOMMODATION':
          // Check if user has a booking for this accommodation
          const accommodationBooking = await prisma.accommodationBooking.findFirst({
            where: {
              travelerId: userId,
              room: {
                accommodationId: reviewableId,
              },
              status: 'complete', // Only allow reviews for complete bookings
            },
          });
          return !!accommodationBooking;

        case 'ROOM':
          // Check if user has a booking for this room
          const roomBooking = await prisma.accommodationBooking.findFirst({
            where: {
              travelerId: userId,
              roomId: reviewableId,
              status: 'complete', // Only allow reviews for complete bookings
            },
          });
          return !!roomBooking;

        case 'TRANSPORTATION_BOOKING':
          // Check if user is the traveler for this booking
          const transportBooking = await prisma.transportationBooking.findFirst({
            where: {
              id: reviewableId,
              travelerId: userId,
              status: 'complete', // Only allow reviews for complete bookings
            },
          });
          return !!transportBooking;

        case 'ACCOMMODATION_BOOKING':
          // Check if user is the traveler for this booking
          const accBooking = await prisma.accommodationBooking.findFirst({
            where: {
              id: reviewableId,
              travelerId: userId,
              status: 'complete', // Only allow reviews for complete bookings
            },
          });
          return !!accBooking;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error validating review access:', error);
      return false;
    }
  }
}
