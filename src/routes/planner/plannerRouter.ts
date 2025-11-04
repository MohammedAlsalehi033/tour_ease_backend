import express from 'express';
import { generatePlan, refinePlan, confirmBooking } from '../../controllers/planner/plannerController';
import { PrismaClient } from '@prisma/client';
import SavedPlansControllerClass from '../../controllers/planner/savedPlansControllerClass';
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
const prisma = new PrismaClient();
const savedPlansController = new SavedPlansControllerClass(prisma);

router.post('/saved', authMiddleware(), (req, res) => savedPlansController.saveTripPlan(req, res));

/**
 * GET /api/planner/saved
 * Get all saved plans for authenticated user
 * Query params: status, tag, sortBy, order
 */
router.get('/saved', authMiddleware(), (req, res) => savedPlansController.getSavedPlans(req, res));

/**
 * GET /api/planner/saved/:id
 * Get a specific saved plan by ID
 */
router.get('/saved/:id', authMiddleware(), (req, res) => savedPlansController.getSavedPlanById(req, res));

/**
 * PUT /api/planner/saved/:id
 * Update a saved trip plan
 */
router.put('/saved/:id', authMiddleware(), (req, res) => savedPlansController.updateSavedPlan(req, res));

/**
 * DELETE /api/planner/saved/:id
 * Delete a saved trip plan
 */
router.delete('/saved/:id', authMiddleware(), (req, res) => savedPlansController.deleteSavedPlan(req, res));

/**
 * POST /api/planner/saved/:id/book
 * Book a saved trip plan
 */
router.post('/saved/:id/book', authMiddleware(), (req, res) => savedPlansController.bookSavedPlan(req, res));

module.exports = router