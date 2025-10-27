import express from 'express';
import { generatePlan, refinePlan, confirmBooking } from '../../controllers/planner/plannerController';
import { 
  saveTripPlan, 
  getSavedPlans, 
  getSavedPlanById, 
  updateSavedPlan, 
  deleteSavedPlan,
  bookSavedPlan 
} from '../../controllers/planner/savedPlansController';
import authMiddleware from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * POST /api/planner/generate
 * Generate comprehensive trip plans with all available options
 * Body: {
 *   startLocation: string,
 *   endLocation: string,
 *   startTime: string (ISO date),
 *   endTime: string (ISO date),
 *   interests: string[],
 *   budget: number,
 *   numberOfTravelers: number,
 *   needsReturnTransport?: boolean,
 *   useAIOptimization?: boolean,    // Enable AI-powered iterative optimization
 *   maxIterations?: number           // Max optimization iterations (default: 3)
 * }
 */
router.post('/generate', generatePlan);

/**
 * POST /api/planner/refine
 * Refine plans based on conversational user feedback
 * Body: {
 *   originalRequest: PlanGenerationRequest,
 *   currentResults: TripPlan,
 *   userMessage: string,
 *   conversationHistory?: Array<{ role: string, content: string }>
 * }
 */
router.post('/refine', refinePlan);

/**
 * POST /api/planner/confirm
 * Confirm and book a selected trip plan
 * Requires authentication
 * Body: {
 *   optionId: string,
 *   outboundTransportId?: number,
 *   returnTransportId?: number,
 *   seatsNeeded: number,
 *   accommodationId?: number,
 *   selectedRoomAllocations?: { roomId: number, numberOfRooms: number }[],
 *   checkInDate: string (ISO date),
 *   checkOutDate: string (ISO date),
 *   specialRequests?: string
 * }
 */
router.post('/confirm', authMiddleware(), confirmBooking);

/**
 * POST /api/planner/saved
 * Save a trip plan for later
 * Requires authentication
 */
router.post('/saved', authMiddleware(), saveTripPlan);

/**
 * GET /api/planner/saved
 * Get all saved plans for authenticated user
 * Query params: status, tag, sortBy, order
 */
router.get('/saved', authMiddleware(), getSavedPlans);

/**
 * GET /api/planner/saved/:id
 * Get a specific saved plan by ID
 */
router.get('/saved/:id', authMiddleware(), getSavedPlanById);

/**
 * PUT /api/planner/saved/:id
 * Update a saved trip plan
 */
router.put('/saved/:id', authMiddleware(), updateSavedPlan);

/**
 * DELETE /api/planner/saved/:id
 * Delete a saved trip plan
 */
router.delete('/saved/:id', authMiddleware(), deleteSavedPlan);

/**
 * POST /api/planner/saved/:id/book
 * Book a saved trip plan
 */
router.post('/saved/:id/book', authMiddleware(), bookSavedPlan);

export = router;
