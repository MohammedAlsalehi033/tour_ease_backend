import express from 'express';
import { ReviewController } from '../../controllers/review/reviewController';
import authMiddleware from '../../middleware/authMiddleware';

const router = express.Router();
const reviewController = new ReviewController();

// Routes

// Create a new review (authenticated users only)
router.post(
  '/',
  authMiddleware(),
  reviewController.createReview.bind(reviewController)
);

// Get all reviews with pagination and filtering
router.get(
  '/',
  authMiddleware(),
  reviewController.getAllReviews.bind(reviewController)
);

// Search reviews
router.get(
  '/search',
  authMiddleware(),
  reviewController.searchReviews.bind(reviewController)
);

// Get reviews for a specific reviewable item
router.get(
  '/item/:reviewableType/:reviewableId',
  authMiddleware(),
  reviewController.getReviewsByItem.bind(reviewController)
);

// Get review statistics for an item
router.get(
  '/stats/:reviewableType/:reviewableId',
  authMiddleware(),
  reviewController.getReviewStats.bind(reviewController)
);

// Get reviews by a specific reviewer
router.get(
  '/reviewer/:reviewerId',
  authMiddleware(),
  reviewController.getReviewsByReviewer.bind(reviewController)
);

// Get user's own reviews
router.get(
  '/my-reviews',
  authMiddleware(),
  reviewController.getMyReviews.bind(reviewController)
);

// Get a specific review by ID
router.get(
  '/:id',
  authMiddleware(),
  reviewController.getReviewById.bind(reviewController)
);

// Update a review (only by the reviewer)
router.put(
  '/:id',
  authMiddleware(),
  reviewController.updateReview.bind(reviewController)
);

// Delete a review (only by the reviewer or admin)
router.delete(
  '/:id',
  authMiddleware(),
  reviewController.deleteReview.bind(reviewController)
);

module.exports = router;
