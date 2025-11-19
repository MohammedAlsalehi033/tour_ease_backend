import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PlannerModel } from "../../models/planner/plannerModel";
import { AIPlannerAgent } from "../../services/aiPlannerAgent";
import {
  PlanGenerationRequest,
  BookingConfirmationRequest,
  BookingConfirmationResponse,
} from "../../Types/plannerTypes";
import { OfferController } from "../rideSharing/OfferController/OfferController";
import AccommodationBookingController from "../accommodationBooking/accommodationBookingController";
import PaymentController from "../payment/paymentController";
import PaymentModel from "../../models/payment/paymentModel";
import RoomModel from "../../models/room/roomModel";
import { PrismaOfferModel } from "../../models/rideSharing/offerModel";
import { FileUploaderForS3 } from "../../utils/FileUploader";
import AccommodationBookingModel from "../../models/accommodationBooking/accommodationBookingModel";

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
      preferredTransportMode = "Any",
      specialRequirements,
      detailedStartLocation, // Optional specific starting location for better ride matching
    } = req.body;

    // Validation
    if (
      !startLocation ||
      !endLocation ||
      !startTime ||
      !endTime ||
      !budget ||
      !numberOfTravelers
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: startLocation, endLocation, startTime, endTime, budget, numberOfTravelers are required",
      });
    }

    if (numberOfTravelers < 1) {
      return res.status(400).json({
        success: false,
        message: "numberOfTravelers must be at least 1",
      });
    }

    if (budget <= 0) {
      return res.status(400).json({
        success: false,
        message: "budget must be greater than 0",
      });
    }

    // Parse dates if they're strings
    const parsedStartTime =
      typeof startTime === "string" ? new Date(startTime) : startTime;
    const parsedEndTime =
      typeof endTime === "string" ? new Date(endTime) : endTime;

    // Validate dates
    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid date format. Use ISO 8601 format (e.g., 2025-11-15T00:00:00.000Z)",
      });
    }

    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({
        success: false,
        message: "endTime must be after startTime",
      });
    }

    // Extract city name from "City, Country" format
    const cleanStartLocation = startLocation.split(",")[0].trim();
    const cleanEndLocation = endLocation.split(",")[0].trim();

    console.log("📋 Processing trip request:");
    console.log(`   Route: ${cleanStartLocation} → ${cleanEndLocation}`);
    console.log(`   Budget: ${budget.toLocaleString()} PKR`);
    console.log(`   Travelers: ${numberOfTravelers}`);
    console.log(
      `   Duration: ${parsedStartTime.toLocaleDateString()} to ${parsedEndTime.toLocaleDateString()}`
    );
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
      needsReturnTransport,
      detailedStartLocation: detailedStartLocation, // Pass coordinates as-is
    };

    // Generate trip plans - use AI optimization if requested
    let tripPlan;

    if (useAIOptimization) {
      console.log("🤖 Using AI-powered iterative optimization...");
      tripPlan = await PlannerModel.generateTripPlansWithAI(
        planRequest,
        maxIterations,
        true
      );
    } else {
      tripPlan = await PlannerModel.generateTripPlans(planRequest);
    }

    // Filter accommodations by special requirements if provided
    if (
      specialRequirements &&
      tripPlan.availableOptions.accommodations.length > 0
    ) {
      const lowerReq = specialRequirements.toLowerCase();

      const originalCount = tripPlan.availableOptions.accommodations.length;
      tripPlan.availableOptions.accommodations =
        tripPlan.availableOptions.accommodations.filter((acc) => {
          // Check for gym/fitness
          if (lowerReq.includes("gym") || lowerReq.includes("fitness")) {
            return (
              acc.description?.toLowerCase().includes("gym") ||
              acc.description?.toLowerCase().includes("fitness") ||
              acc.name?.toLowerCase().includes("gym")
            );
          }
          // Check for pool
          if (lowerReq.includes("pool") || lowerReq.includes("swimming")) {
            return (
              acc.description?.toLowerCase().includes("pool") ||
              acc.description?.toLowerCase().includes("swimming")
            );
          }
          // Check for spa
          if (lowerReq.includes("spa")) {
            return acc.description?.toLowerCase().includes("spa");
          }
          // Check for restaurant
          if (lowerReq.includes("restaurant") || lowerReq.includes("dining")) {
            return (
              acc.description?.toLowerCase().includes("restaurant") ||
              acc.description?.toLowerCase().includes("dining")
            );
          }
          return true; // If no specific requirement matched, include all
        });

      console.log(
        `   🔍 Filtered accommodations: ${tripPlan.availableOptions.accommodations.length}/${originalCount} match special requirements`
      );

      // Regenerate recommended plans with filtered accommodations
      if (tripPlan.availableOptions.accommodations.length > 0) {
        const filteredPlans = tripPlan.recommendedPlans.filter(
          (plan) =>
            plan.accommodation &&
            tripPlan.availableOptions.accommodations.some(
              (acc) => acc.id === plan.accommodation?.id
            )
        );
        tripPlan.recommendedPlans = filteredPlans;
        tripPlan.optimalPlan =
          filteredPlans.length > 0 ? filteredPlans[0] : null;
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
        budgetCurrency: "PKR",
        specialRequirementsApplied: !!specialRequirements,
        requestProcessedAt: new Date().toISOString(),
      },
      message: useAIOptimization
        ? "AI-optimized trip plans generated successfully"
        : "Trip plans generated successfully",
    });
  } catch (error) {
    console.error("❌ Error in plan generation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate trip plans",
      error: error instanceof Error ? error.message : "Unknown error",
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
      conversationHistory = [],
    } = req.body;

    if (!originalRequest || !userMessage) {
      return res.status(400).json({
        error: "Missing required fields: originalRequest, userMessage",
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
      ...aiResponse.adjustedRequest,
    };

    // Generate new plans with refined parameters
    const newPlans = await PlannerModel.generateTripPlans(refinedRequest);

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: userMessage },
      {
        role: "assistant",
        content: `${aiResponse.explanation} ${aiResponse.suggestedChanges.join(
          ". "
        )}`,
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        refinedPlans: newPlans,
        refinedRequest,
        aiExplanation: aiResponse.explanation,
        changesMade: aiResponse.suggestedChanges,
        conversationHistory: updatedHistory,
      },
      message: "Plans refined based on your feedback",
    });
  } catch (error) {
    console.error("Error in plan refinement:", error);
    res.status(500).json({
      error: "An internal server error occurred.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Confirm and book a selefcted trip plan
 */
export const confirmBooking = async (req: Request, res: Response) => {
  try {
    console.log("🎯 === BOOKING CONFIRMATION STARTED ===");
    const userId = (req as any).user?.id;
    console.log(`👤 User ID: ${userId}`);

    if (!userId) {
      console.log("❌ Authentication failed: No user ID found");
      return res.status(401).json({ error: "User not authenticated" });
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
      specialRequests,
      paymentMethod,
      stripePaymentIntentId,
    }: BookingConfirmationRequest & {
      paymentMethod?: string;
      stripePaymentIntentId?: string;
    } = req.body;

    console.log("📦 Request Body:");
    console.log(`   - Option ID: ${optionId}`);
    console.log(`   - Outbound Transport ID: ${outboundTransportId}`);
    console.log(`   - Return Transport ID: ${returnTransportId}`);
    console.log(`   - Seats Needed: ${seatsNeeded}`);
    console.log(`   - Accommodation ID: ${accommodationId}`);
    console.log(`   - Room Allocations: ${JSON.stringify(selectedRoomAllocations)}`);
    console.log(`   - Check-in: ${checkInDate}`);
    console.log(`   - Check-out: ${checkOutDate}`);
    console.log(`   - Payment Method: ${paymentMethod}`);
    console.log(`   - Stripe Payment Intent ID: ${stripePaymentIntentId}`);

    if (!seatsNeeded || seatsNeeded < 1) {
      console.log("❌ Validation failed: Invalid seatsNeeded");
      return res
        .status(400)
        .json({ error: "seatsNeeded is required and must be at least 1" });
    }

    // Validate payment info if accommodation booking is requested
    if (
      accommodationId &&
      selectedRoomAllocations &&
      (!paymentMethod || !stripePaymentIntentId)
    ) {
      console.log("❌ Validation failed: Missing payment information for accommodation");
      return res.status(400).json({
        error:
          "Payment information (paymentMethod and stripePaymentIntentId) is required for accommodation booking",
      });
    }

    console.log("✅ Initial validation passed");

    const bookingResult: BookingConfirmationResponse = {
      success: true,
      bookings: {
        transportationBookings: {},
        accommodationBookings: [],
      },
      totalCost: 0,
      message: "",
      errors: [],
    };
    console.log("📋 Initialized booking result object");

    // Get accommodation details if provided (for outbound transport message)
    let accommodationDetails: { name: string; location: string } | undefined;
    if (accommodationId) {
      console.log(`🏨 Fetching accommodation details for ID: ${accommodationId}`);
      try {
        const accommodation = await prisma.accommodation.findUnique({
          where: { id: accommodationId },
          select: { name: true, location: true },
        });
        if (accommodation) {
          accommodationDetails = {
            name: accommodation.name,
            location: accommodation.location,
          };
          console.log(`✅ Accommodation found: ${accommodation.name} at ${accommodation.location}`);
        } else {
          console.log("⚠️ Accommodation not found in database");
        }
      } catch (error) {
        console.log("❌ Error fetching accommodation details:", error);
      }
    }

    // Process transportation bookings
    console.log("\n🚗 === PROCESSING TRANSPORTATION BOOKINGS ===");
    if (outboundTransportId) {
      console.log(`📍 Processing outbound transport (ID: ${outboundTransportId})`);
      try {
        const outboundBooking = await processTransportationBooking(
          userId,
          outboundTransportId,
          seatsNeeded,
          "outbound",
          accommodationDetails
        );
        bookingResult.bookings.transportationBookings.outbound =
          outboundBooking;
        bookingResult.totalCost += outboundBooking.totalPrice;
        console.log(`✅ Outbound booking created: ${JSON.stringify(outboundBooking)}`);
        console.log(`💰 Running total cost: ${bookingResult.totalCost} PKR`);
      } catch (error) {
        const errorMsg = `Outbound transport booking failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.log(`❌ ${errorMsg}`);
        bookingResult.errors?.push(errorMsg);
      }
    } else {
      console.log("ℹ️ No outbound transport requested");
    }

    if (returnTransportId) {
      console.log(`📍 Processing return transport (ID: ${returnTransportId})`);
      try {
        const returnBooking = await processTransportationBooking(
          userId,
          returnTransportId,
          seatsNeeded,
          "return"
        );
        bookingResult.bookings.transportationBookings.return = returnBooking;
        bookingResult.totalCost += returnBooking.totalPrice;
        console.log(`✅ Return booking created: ${JSON.stringify(returnBooking)}`);
        console.log(`💰 Running total cost: ${bookingResult.totalCost} PKR`);
      } catch (error) {
        const errorMsg = `Return transport booking failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.log(`❌ ${errorMsg}`);
        bookingResult.errors?.push(errorMsg);
      }
    } else {
      console.log("ℹ️ No return transport requested");
    }

    // Process accommodation bookings with availability check and payment
    console.log("\n🏨 === PROCESSING ACCOMMODATION BOOKINGS ===");
    if (
      accommodationId &&
      selectedRoomAllocations &&
      checkInDate &&
      checkOutDate
    ) {
      console.log(`🏨 Accommodation ID: ${accommodationId}`);
      console.log(`📅 Check-in: ${checkInDate}, Check-out: ${checkOutDate}`);
      console.log(`🛏️ Room allocations: ${JSON.stringify(selectedRoomAllocations)}`);
      
      try {
        // Check availability for all rooms first
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const roomModel = new RoomModel();

        console.log("🔍 Checking room availability...");
        for (const allocation of selectedRoomAllocations) {
          console.log(`   - Checking room ${allocation.roomId} (${allocation.numberOfRooms} room(s))`);
          const isAvailable = await roomModel.checkRoomAvailability(
            allocation.roomId,
            checkIn,
            checkOut
          );

          if (!isAvailable) {
            const room = await prisma.room.findUnique({
              where: { id: allocation.roomId },
            });
            console.log(`❌ Room ${allocation.roomId} is NOT available`);
            throw new Error(
              `Room "${
                room?.roomType || allocation.roomId
              }" is not available for the selected dates`
            );
          }
          console.log(`✅ Room ${allocation.roomId} is available`);
        }

        console.log("✅ All rooms available, proceeding with booking...");
        // Create confirmed accommodation bookings after payment validation
        const accommodationBookings =
          await processAccommodationBookingsWithPayment(
            userId,
            selectedRoomAllocations,
            checkIn,
            checkOut,
            stripePaymentIntentId!
          );

        bookingResult.bookings.accommodationBookings = accommodationBookings;
        const accommodationTotalCost = accommodationBookings.reduce(
          (sum, b) => sum + b.totalPrice,
          0
        );
        bookingResult.totalCost += accommodationTotalCost;
        console.log(`💰 Accommodation total: ${accommodationTotalCost} PKR`);
        console.log(`💰 Running total cost: ${bookingResult.totalCost} PKR`);

        // Create payment records for tracking
        console.log("💳 Creating payment records...");
        const paymentModel = new PaymentModel();
        for (const booking of accommodationBookings) {
          await paymentModel.createPayment(
            booking.totalPrice,
            paymentMethod!,
            `${stripePaymentIntentId}_booking_${booking.id}`,
            booking.id,
            "completed"
          );
          console.log(`   - Payment record created for booking ${booking.id}`);
        }

        console.log(
          `✅ ${accommodationBookings.length} accommodation booking(s) confirmed with payment processed`
        );
      } catch (error) {
        const errorMsg = `Accommodation booking failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.log(`❌ ${errorMsg}`);
        bookingResult.errors?.push(errorMsg);
      }
    } else {
      console.log("ℹ️ No accommodation booking requested");
    }

    // Determine overall success
    console.log("\n🎯 === FINALIZING BOOKING RESULT ===");
    const hasAnyBooking =
      bookingResult.bookings.transportationBookings.outbound ||
      bookingResult.bookings.transportationBookings.return ||
      bookingResult.bookings.accommodationBookings.length > 0;

    console.log(`📊 Has any booking: ${hasAnyBooking}`);
    console.log(`📊 Number of errors: ${bookingResult.errors?.length || 0}`);
    
    bookingResult.success =
      hasAnyBooking && (bookingResult.errors?.length || 0) === 0;

    console.log(`📊 Overall success: ${bookingResult.success}`);

    if (bookingResult.success) {
      // Check if transportation bookings are pending offers
      const hasPendingOffers =
        (bookingResult.bookings.transportationBookings.outbound?.status ===
          "pending" &&
          !bookingResult.bookings.transportationBookings.outbound?.id) ||
        (bookingResult.bookings.transportationBookings.return?.status ===
          "pending" &&
          !bookingResult.bookings.transportationBookings.return?.id);

      console.log(`📊 Has pending offers: ${hasPendingOffers}`);

      if (hasPendingOffers) {
        bookingResult.message =
          "Offers sent to transportation providers. Accommodation bookings confirmed. Awaiting provider approval for transportation.";
      } else {
        bookingResult.message = "All bookings confirmed successfully";
      }
    } else if (hasAnyBooking) {
      bookingResult.message = "Some bookings confirmed with errors";
    } else {
      bookingResult.message = "No bookings were confirmed";
    }

    console.log(`📝 Final message: ${bookingResult.message}`);
    console.log(`💰 Final total cost: ${bookingResult.totalCost} PKR`);
    console.log(`📋 Booking summary:`);
    console.log(`   - Transport bookings: ${JSON.stringify(bookingResult.bookings.transportationBookings)}`);
    console.log(`   - Accommodation bookings: ${bookingResult.bookings.accommodationBookings.length} booking(s)`);
    console.log(`   - Errors: ${JSON.stringify(bookingResult.errors)}`);

    // Save the confirmed plan if booking was successful
    if (bookingResult.success || hasAnyBooking) {
      console.log("\n💾 === SAVING CONFIRMED PLAN ===");
      try {
        // Extract activities and trip details from request body
        const { 
          activities, 
          itinerary, 
          planName: customPlanName,
          startLocation: reqStartLocation,
          endLocation: reqEndLocation,
          numberOfTravelers: reqTravelers,
          budget: reqBudget,
          interests: reqInterests
        } = req.body;
        
        // Generate a plan name based on route and date
        const destinationName = reqEndLocation?.split(',')[0] || 'Destination';
        const generatedPlanName = customPlanName || 
          `Trip to ${destinationName} - ${new Date(checkInDate || new Date()).toLocaleDateString()}`;
        
        console.log(`   📝 Plan name: ${generatedPlanName}`);
        
        // Build planData with only activities and booking information
        const planDataToSave = {
          activities: activities || [],
          itinerary: itinerary || [],
          bookings: {
            transportation: {
              outbound: bookingResult.bookings.transportationBookings.outbound,
              return: bookingResult.bookings.transportationBookings.return,
            },
            accommodation: bookingResult.bookings.accommodationBookings,
          },
          totalCost: bookingResult.totalCost,
          bookedAt: new Date().toISOString(),
        };
        
        console.log(`   📦 Saving plan data with ${activities?.length || 0} activities`);
        
        const savedPlan = await prisma.savedTripPlan.create({
          data: {
            userId,
            planName: generatedPlanName,
            startLocation: reqStartLocation || 'Unknown',
            endLocation: reqEndLocation || 'Unknown',
            startTime: checkInDate ? new Date(checkInDate) : new Date(),
            endTime: checkOutDate ? new Date(checkOutDate) : new Date(),
            numberOfTravelers: reqTravelers || 1,
            budget: reqBudget || bookingResult.totalCost,
            interests: reqInterests || [],
            needsReturnTransport: !!returnTransportId,
            selectedOutboundTransportId: outboundTransportId || null,
            selectedReturnTransportId: returnTransportId || null,
            selectedAccommodationId: accommodationId || null,
            seatsNeeded: seatsNeeded || null,
            planData: planDataToSave,
            status: 'booked',
            tags: ['auto-booked'],
          },
        });
        
        console.log(`   ✅ Plan saved successfully (ID: ${savedPlan.id})`);
        
        // Add saved plan ID to the response
        (bookingResult as any).savedPlanId = savedPlan.id;
      } catch (saveError) {
        console.error("   ❌ Error saving plan:", saveError);
        // Don't fail the booking if plan saving fails
        bookingResult.errors?.push(
          `Booking successful but failed to save plan: ${
            saveError instanceof Error ? saveError.message : 'Unknown error'
          }`
        );
      }
    }

    const statusCode = bookingResult.success ? 200 : hasAnyBooking ? 207 : 400;
    console.log(`🚀 Sending response with status code: ${statusCode}`);
    console.log("🎯 === BOOKING CONFIRMATION COMPLETED ===\n");
    
    res.status(statusCode).json(bookingResult);
  } catch (error) {
    console.error("❌ === CRITICAL ERROR IN BOOKING CONFIRMATION ===");
    console.error("Error details:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    res.status(500).json({
      error: "An internal server error occurred.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Process a transportation booking using existing OfferController
 */
async function processTransportationBooking(
  userId: string,
  listingId: number,
  seatsNeeded: number,
  type: "outbound" | "return",
  accommodationDetails?: { name: string; location: string }
) {
  console.log(`\n   🚗 processTransportationBooking - ${type}`);
  console.log(`   - User ID: ${userId}`);
  console.log(`   - Listing ID: ${listingId}`);
  console.log(`   - Seats needed: ${seatsNeeded}`);
  
  // Get the listing to retrieve provider info and validate
  console.log(`   🔍 Fetching transportation listing...`);
  const listing = await prisma.transportationListing.findUnique({
    where: { id: listingId },
    include: { provider: true },
  });

  if (!listing) {
    console.log(`   ❌ Listing not found`);
    throw new Error(`Transportation listing ${listingId} not found`);
  }

  console.log(`   ✅ Listing found: ${listing.origin} → ${listing.destination}`);
  console.log(`   📍 Provider: ${listing.provider.name} (ID: ${listing.providerId})`);
  console.log(`   💺 Seats available: ${listing.seatsAvailable}`);
  console.log(`   💰 Price per seat: ${listing.pricePerSeat} PKR`);

  if (listing.seatsAvailable < seatsNeeded) {
    console.log(`   ❌ Insufficient seats`);
    throw new Error(
      `Insufficient seats available. Requested: ${seatsNeeded}, Available: ${listing.seatsAvailable}`
    );
  }

  const totalPrice = Number(listing.pricePerSeat) * seatsNeeded;
  console.log(`   💰 Total price: ${totalPrice} PKR`);

  // Build the message with accommodation info if available
  let offerMessage = `Booking request for ${seatsNeeded} seat(s) - ${type} trip`;
  if (type === "outbound" && accommodationDetails) {
    offerMessage += ` to ${accommodationDetails.name} at ${accommodationDetails.location}`;
  } else if (type === "outbound") {
    offerMessage += `. Please contact user for destination details`;
  }
  offerMessage += ` (Requested via AI Travel Planner)`;
  console.log(`   📝 Offer message: "${offerMessage}"`);

  // Create the offer directly
  console.log(`   🎯 Creating offer...`);
  const offerModel = new PrismaOfferModel();
  const fileUploader = new FileUploaderForS3();
  const offerController = new OfferController(offerModel, fileUploader);

  // Create a mock request/response to use with the existing controller
  const mockReq: any = {
    body: {
      senderId: userId,
      recipientId: listing.providerId,
      pricePerSeat: listing.pricePerSeat,
      seatsRequested: seatsNeeded,
      message: offerMessage,
      transportationListingId: listingId,
    },
  };

  let offerResult: any = null;
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`   📨 OfferController response - Status: ${code}`);
        console.log(`   📨 Response data:`, JSON.stringify(data));
        if (code === 201 && data.success) {
          offerResult = data.data;
        } else {
          throw new Error(data.message || "Failed to create offer");
        }
      },
    }),
  };

  // Call the existing createOffer method
  await offerController.createOffer(mockReq, mockRes);

  if (!offerResult) {
    console.log(`   ❌ Offer creation failed - no result returned`);
    throw new Error("Failed to create transportation offer");
  }

  console.log(`   ✅ Offer created successfully (ID: ${offerResult.id})`);

  // Return offer details - the provider will need to accept it
  const result = {
    offerId: offerResult.id,
    status: "pending",
    totalPrice: totalPrice,
    message: "Offer sent to transportation provider and awaiting approval",
    id: null, // No booking ID yet since the offer hasn't been accepted
  };
  console.log(`   📦 Returning result:`, JSON.stringify(result));
  return result;
}

/**
 * Process accommodation bookings with confirmed status after payment
 * Uses the createConfirmedBookingAfterPayment endpoint
 */
async function processAccommodationBookingsWithPayment(
  userId: string,
  roomAllocations: { roomId: number; numberOfRooms: number }[],
  checkInDate: Date,
  checkOutDate: Date,
  stripePaymentIntentId: string
) {
  console.log(`\n   🏨 processAccommodationBookingsWithPayment`);
  console.log(`   - User ID: ${userId}`);
  console.log(`   - Room allocations: ${JSON.stringify(roomAllocations)}`);
  console.log(`   - Check-in: ${checkInDate.toISOString()}`);
  console.log(`   - Check-out: ${checkOutDate.toISOString()}`);
  console.log(`   - Stripe Payment Intent: ${stripePaymentIntentId}`);
  
  const bookings: Array<{
    id: number;
    roomId: number;
    status: string;
    totalPrice: number;
  }> = [];

  const accommodationBookingModel = new AccommodationBookingModel();
  const accommodationBookingController = new AccommodationBookingController(
    accommodationBookingModel
  );
  const numberOfNights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  console.log(`   📅 Number of nights: ${numberOfNights}`);

  for (const allocation of roomAllocations) {
    console.log(`\n   🛏️ Processing allocation for room ${allocation.roomId}...`);
    // Get room details to calculate price
    const room = await prisma.room.findUnique({
      where: { id: allocation.roomId },
    });

    if (!room) {
      console.log(`   ❌ Room not found`);
      throw new Error(`Room ${allocation.roomId} not found`);
    }

    console.log(`   ✅ Room found: ${room.roomType}`);
    console.log(`   💰 Price per night: ${room.pricePerNight} PKR`);
    console.log(`   📊 Creating ${allocation.numberOfRooms} booking(s)...`);

    // Create confirmed booking for each room after payment
    for (let i = 0; i < allocation.numberOfRooms; i++) {
      console.log(`\n   📝 Creating booking ${i + 1}/${allocation.numberOfRooms}...`);
      const totalPrice = Number(room.pricePerNight) * numberOfNights;
      console.log(`   💰 Total price: ${totalPrice} PKR`);

      const paymentId = `${stripePaymentIntentId}_room_${allocation.roomId}_${i + 1}`;
      console.log(`   🆔 Payment ID: ${paymentId}`);

      // Create mock request/response for the existing controller
      const mockReq: any = {
        body: {
          travelerId: userId,
          roomId: allocation.roomId,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          totalPrice: totalPrice,
          paymentId: paymentId,
        },
      };

      console.log(`   📤 Calling createConfirmedBookingAfterPayment...`);
      let bookingResult: any = null;
      const mockRes: any = {
        status: (code: number) => ({
          json: (data: any) => {
            console.log(`   📨 Booking response - Status: ${code}`);
            console.log(`   📨 Response data:`, JSON.stringify(data));
            if (code === 201 && data.success) {
              bookingResult = data.data;
            } else {
              throw new Error(
                data.message ||
                  "Failed to create confirmed accommodation booking"
              );
            }
          },
        }),
      };

      // Use the createConfirmedBookingAfterPayment method (creates booking with confirmed status)
      await accommodationBookingController.createConfirmedBookingAfterPayment(
        mockReq,
        mockRes
      );

      if (!bookingResult) {
        console.log(`   ❌ Booking creation failed - no result returned`);
        throw new Error(
          `Failed to create confirmed booking for room ${allocation.roomId}`
        );
      }

      console.log(`   ✅ Booking created successfully (ID: ${bookingResult.id})`);
      const booking = {
        id: bookingResult.id,
        roomId: bookingResult.roomId,
        status: bookingResult.status,
        totalPrice: Number(bookingResult.totalPrice),
      };
      bookings.push(booking);
      console.log(`   📦 Booking added to results:`, JSON.stringify(booking));
    }
  }

  console.log(`\n   ✅ Total bookings created: ${bookings.length}`);
  return bookings;
}
