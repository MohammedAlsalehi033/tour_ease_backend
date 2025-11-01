import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PlannerModel } from '../../models/planner/plannerModel';
import { AIPlannerAgent } from '../../services/aiPlannerAgent';
import { 
  PlanGenerationRequest, 
  BookingConfirmationRequest,
  BookingConfirmationResponse 
} from '../../Types/plannerTypes';

const prisma = new PrismaClient();

/**
 * Generate comprehensive trip plans with all available options
 */
export const generatePlan = async (req: Request, res: Response) => {
  try {
    const { 
      startLocation, 
      endLocation, 
      startTime, 
      endTime, 
      interests = [], 
      budget,
      numberOfTravelers = 1,
      needsReturnTransport = true,
      useAIOptimization = false,
      maxIterations = 3,
      preferredTransportMode = 'Any',
      specialRequirements
    } = req.body;

    // Validation
    if (!startLocation || !endLocation || !startTime || !endTime || !budget || !numberOfTravelers) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: startLocation, endLocation, startTime, endTime, budget, numberOfTravelers are required' 
      });
    }

    if (numberOfTravelers < 1) {
      return res.status(400).json({ 
        success: false,
        message: 'numberOfTravelers must be at least 1' 
      });
    }

    if (budget <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'budget must be greater than 0' 
      });
    }

    // Parse dates if they're strings
    const parsedStartTime = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const parsedEndTime = typeof endTime === 'string' ? new Date(endTime) : endTime;

    // Validate dates
    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO 8601 format (e.g., 2025-11-15T00:00:00.000Z)'
      });
    }

    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be after startTime'
      });
    }

    // Extract city name from "City, Country" format
    const cleanStartLocation = startLocation.split(',')[0].trim();
    const cleanEndLocation = endLocation.split(',')[0].trim();

    console.log('📋 Processing trip request:');
    console.log(`   Route: ${cleanStartLocation} → ${cleanEndLocation}`);
    console.log(`   Budget: ${budget.toLocaleString()} PKR`);
    console.log(`   Travelers: ${numberOfTravelers}`);
    console.log(`   Duration: ${parsedStartTime.toLocaleDateString()} to ${parsedEndTime.toLocaleDateString()}`);
    if (specialRequirements) {
      console.log(`   Special Requirements: ${specialRequirements}`);
    }

    const planRequest: PlanGenerationRequest = {
      startLocation: cleanStartLocation,
      endLocation: cleanEndLocation,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      interests,
      budget,
      numberOfTravelers,
      needsReturnTransport
    };

    // Generate trip plans - use AI optimization if requested
    let tripPlan;
    
    if (useAIOptimization) {
      console.log('🤖 Using AI-powered iterative optimization...');
      tripPlan = await PlannerModel.generateTripPlansWithAI(
        planRequest,
        maxIterations,
        true
      );
    } else {
      tripPlan = await PlannerModel.generateTripPlans(planRequest);
    }

    // Filter accommodations by special requirements if provided
    if (specialRequirements && tripPlan.availableOptions.accommodations.length > 0) {
      const lowerReq = specialRequirements.toLowerCase();
      
      const originalCount = tripPlan.availableOptions.accommodations.length;
      tripPlan.availableOptions.accommodations = tripPlan.availableOptions.accommodations.filter(acc => {
        // Check for gym/fitness
        if (lowerReq.includes('gym') || lowerReq.includes('fitness')) {
          return acc.description?.toLowerCase().includes('gym') || 
                 acc.description?.toLowerCase().includes('fitness') ||
                 acc.name?.toLowerCase().includes('gym');
        }
        // Check for pool
        if (lowerReq.includes('pool') || lowerReq.includes('swimming')) {
          return acc.description?.toLowerCase().includes('pool') || 
                 acc.description?.toLowerCase().includes('swimming');
        }
        // Check for spa
        if (lowerReq.includes('spa')) {
          return acc.description?.toLowerCase().includes('spa');
        }
        // Check for restaurant
        if (lowerReq.includes('restaurant') || lowerReq.includes('dining')) {
          return acc.description?.toLowerCase().includes('restaurant') || 
                 acc.description?.toLowerCase().includes('dining');
        }
        return true; // If no specific requirement matched, include all
      });

      console.log(`   🔍 Filtered accommodations: ${tripPlan.availableOptions.accommodations.length}/${originalCount} match special requirements`);
      
      // Regenerate recommended plans with filtered accommodations
      if (tripPlan.availableOptions.accommodations.length > 0) {
        const filteredPlans = tripPlan.recommendedPlans.filter(plan => 
          plan.accommodation && 
          tripPlan.availableOptions.accommodations.some(acc => acc.id === plan.accommodation?.id)
        );
        tripPlan.recommendedPlans = filteredPlans;
        tripPlan.optimalPlan = filteredPlans.length > 0 ? filteredPlans[0] : null;
      } else {
        tripPlan.recommendedPlans = [];
        tripPlan.optimalPlan = null;
      }
    }

    res.status(200).json({
      success: true,
      data: tripPlan,
      metadata: {
        requestedBudget: budget,
        budgetCurrency: 'PKR',
        specialRequirementsApplied: !!specialRequirements,
        requestProcessedAt: new Date().toISOString()
      },
      message: useAIOptimization 
        ? 'AI-optimized trip plans generated successfully' 
        : 'Trip plans generated successfully'
    });

  } catch (error) {
    console.error("❌ Error in plan generation:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to generate trip plans",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Refine plans based on user feedback (conversational AI)
 */
export const refinePlan = async (req: Request, res: Response) => {
  try {
    const {
      originalRequest,
      currentResults,
      userMessage,
      conversationHistory = []
    } = req.body;

    if (!originalRequest || !userMessage) {
      return res.status(400).json({
        error: 'Missing required fields: originalRequest, userMessage'
      });
    }

    // Get AI interpretation of user's feedback
    const aiResponse = await AIPlannerAgent.handleUserFeedback(
      originalRequest,
      currentResults,
      userMessage,
      conversationHistory
    );

    // Merge adjusted parameters with original request
    const refinedRequest: PlanGenerationRequest = {
      ...originalRequest,
      ...aiResponse.adjustedRequest
    };

    // Generate new plans with refined parameters
    const newPlans = await PlannerModel.generateTripPlans(refinedRequest);

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
      { 
        role: 'assistant', 
        content: `${aiResponse.explanation} ${aiResponse.suggestedChanges.join('. ')}`
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        refinedPlans: newPlans,
        refinedRequest,
        aiExplanation: aiResponse.explanation,
        changesMade: aiResponse.suggestedChanges,
        conversationHistory: updatedHistory
      },
      message: 'Plans refined based on your feedback'
    });

  } catch (error) {
    console.error("Error in plan refinement:", error);
    res.status(500).json({
      error: "An internal server error occurred.",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Confirm and book a selefcted trip plan
 */
export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      optionId,
      outboundTransportId,
      returnTransportId,
      seatsNeeded,
      accommodationId,
      selectedRoomAllocations,
      checkInDate,
      checkOutDate,
      specialRequests
    }: BookingConfirmationRequest = req.body;

    if (!seatsNeeded || seatsNeeded < 1) {
      return res.status(400).json({ error: 'seatsNeeded is required and must be at least 1' });
    }

    const bookingResult: BookingConfirmationResponse = {
      success: true,
      bookings: {
        transportationBookings: {},
        accommodationBookings: []
      },
      totalCost: 0,
      message: '',
      errors: []
    };

    // Process transportation bookings
    if (outboundTransportId) {
      try {
        const outboundBooking = await processTransportationBooking(
          userId,
          outboundTransportId,
          seatsNeeded,
          'outbound'
        );
        bookingResult.bookings.transportationBookings.outbound = outboundBooking;
        bookingResult.totalCost += outboundBooking.totalPrice;
      } catch (error) {
        bookingResult.errors?.push(`Outbound transport booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (returnTransportId) {
      try {
        const returnBooking = await processTransportationBooking(
          userId,
          returnTransportId,
          seatsNeeded,
          'return'
        );
        bookingResult.bookings.transportationBookings.return = returnBooking;
        bookingResult.totalCost += returnBooking.totalPrice;
      } catch (error) {
        bookingResult.errors?.push(`Return transport booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Process accommodation bookings
    if (accommodationId && selectedRoomAllocations && checkInDate && checkOutDate) {
      try {
        const accommodationBookings = await processAccommodationBookings(
          userId,
          selectedRoomAllocations,
          new Date(checkInDate),
          new Date(checkOutDate)
        );
        
        bookingResult.bookings.accommodationBookings = accommodationBookings;
        bookingResult.totalCost += accommodationBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      } catch (error) {
        bookingResult.errors?.push(`Accommodation booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Determine overall success
    const hasAnyBooking = 
      bookingResult.bookings.transportationBookings.outbound ||
      bookingResult.bookings.transportationBookings.return ||
      bookingResult.bookings.accommodationBookings.length > 0;

    bookingResult.success = hasAnyBooking && (bookingResult.errors?.length || 0) === 0;
    
    if (bookingResult.success) {
      bookingResult.message = 'All bookings confirmed successfully';
    } else if (hasAnyBooking) {
      bookingResult.message = 'Some bookings confirmed with errors';
    } else {
      bookingResult.message = 'No bookings were confirmed';
    }

    const statusCode = bookingResult.success ? 200 : (hasAnyBooking ? 207 : 400);
    res.status(statusCode).json(bookingResult);

  } catch (error) {
    console.error("Error in booking confirmation:", error);
    res.status(500).json({ 
      error: "An internal server error occurred.",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Process a transportation booking and send offer to driver
 */
async function processTransportationBooking(
  userId: string,
  listingId: number,
  seatsNeeded: number,
  type: 'outbound' | 'return'
) {
  // Get the listing
  const listing = await prisma.transportationListing.findUnique({
    where: { id: listingId },
    include: { provider: true }
  });

  if (!listing) {
    throw new Error(`Transportation listing ${listingId} not found`);
  }

  if (listing.seatsAvailable < seatsNeeded) {
    throw new Error(`Insufficient seats available. Requested: ${seatsNeeded}, Available: ${listing.seatsAvailable}`);
  }

  const totalPrice = Number(listing.pricePerSeat) * seatsNeeded;

  // Create an offer to the driver
  const offer = await prisma.offer.create({
    data: {
      senderId: userId,
      recipientId: listing.providerId,
      transportationListingId: listingId,
      pricePerSeat: listing.pricePerSeat,
      seatsRequested: seatsNeeded,
      message: `Booking request for ${seatsNeeded} seat(s) - ${type} trip`,
      status: 'pending'
    }
  });

  // Create a pending booking
  const booking = await prisma.transportationBooking.create({
    data: {
      travelerId: userId,
      transportationListingId: listingId,
      offerId: offer.id,
      seatsBooked: seatsNeeded,
      totalPrice: totalPrice,
      status: 'pending',
      bookingSource: 'planner'
    }
  });

  // Send notification to driver
  await prisma.notification.create({
    data: {
      userId: listing.providerId,
      message: `New booking request for ${seatsNeeded} seat(s) on your ${listing.startLocationText} to ${listing.endLocationText} trip`,
      type: 'booking_request'
    }
  });

  return {
    id: booking.id,
    status: booking.status,
    totalPrice: Number(booking.totalPrice),
    offerId: offer.id
  };
}

/**
 * Process accommodation bookings for multiple rooms
 */
async function processAccommodationBookings(
  userId: string,
  roomAllocations: { roomId: number; numberOfRooms: number }[],
  checkInDate: Date,
  checkOutDate: Date
) {
  const bookings: Array<{
    id: number;
    roomId: number;
    status: string;
    totalPrice: number;
  }> = [];
  const numberOfNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  for (const allocation of roomAllocations) {
    const room = await prisma.room.findUnique({
      where: { id: allocation.roomId }
    });

    if (!room) {
      throw new Error(`Room ${allocation.roomId} not found`);
    }

    // Check availability
    const conflictingBookings = await prisma.accommodationBooking.count({
      where: {
        roomId: allocation.roomId,
        status: { in: ['confirmed', 'pending'] },
        OR: [
          {
            checkInDate: { lte: checkOutDate },
            checkOutDate: { gte: checkInDate }
          }
        ]
      }
    });

    if (conflictingBookings > 0) {
      throw new Error(`Room ${allocation.roomId} is not available for the selected dates`);
    }

    // Create booking for each room
    for (let i = 0; i < allocation.numberOfRooms; i++) {
      const totalPrice = Number(room.pricePerNight) * numberOfNights;

      const booking = await prisma.accommodationBooking.create({
        data: {
          travelerId: userId,
          roomId: allocation.roomId,
          checkInDate,
          checkOutDate,
          totalPrice: totalPrice,
          status: 'confirmed' // Auto-confirm accommodation bookings
        }
      });

      bookings.push({
        id: booking.id,
        roomId: booking.roomId,
        status: booking.status,
        totalPrice: Number(booking.totalPrice)
      });
    }
  }

  // Notify accommodation provider
  if (bookings.length > 0) {
    const firstRoom = await prisma.room.findUnique({
      where: { id: roomAllocations[0].roomId },
      include: { accommodation: true }
    });

    if (firstRoom) {
      await prisma.notification.create({
        data: {
          userId: firstRoom.accommodation.providerId,
          message: `New booking: ${bookings.length} room(s) from ${checkInDate.toLocaleDateString()} to ${checkOutDate.toLocaleDateString()}`,
          type: 'accommodation_booking'
        }
      });
    }
  }

  return bookings;
}