import { PrismaClient } from '@prisma/client';
import {
  TransportationOption,
  AccommodationOption,
  RoomAllocation,
  ActivityOption,
  TripOption,
  TripPlan,
  PlanGenerationRequest
} from '../../Types/plannerTypes';
import { AIPlannerAgent } from '../../services/aiPlannerAgent';

const prisma = new PrismaClient();

export class PlannerModel {
  /**
   * Find available transportation options
   */
  static async findAvailableTransportation(
    startLocation: string,
    endLocation: string,
    departureDate: Date,
    seatsNeeded: number,
    maxBudgetPerSeat: number,
    isReturnTrip: boolean = false
  ): Promise<TransportationOption[]> {
    const timeWindowStart = new Date(departureDate);
    const timeWindowEnd = new Date(departureDate);
    
    // For outbound trips, search within same day and next 6 hours
    // For return trips, search on the return date
    if (!isReturnTrip) {
      timeWindowEnd.setHours(timeWindowEnd.getHours() + 6);
    } else {
      timeWindowEnd.setDate(timeWindowEnd.getDate() + 1);
    }

    const listings = await prisma.transportationListing.findMany({
      where: {
        startLocationText: { contains: startLocation, mode: 'insensitive' },
        endLocationText: { contains: endLocation, mode: 'insensitive' },
        departureTime: { 
          gte: timeWindowStart, 
          lte: timeWindowEnd 
        },
        pricePerSeat: { lte: maxBudgetPerSeat },
        seatsAvailable: { gte: seatsNeeded },
        status: 'active'
      },
      include: {
        provider: {
          include: {
            user: { select: { username: true } }
          }
        },
        reviews: { select: { rating: true } }
      },
      orderBy: [
        { departureTime: 'asc' },
        { pricePerSeat: 'asc' }
      ]
    });

    return listings.map(listing => {
      const avgRating = listing.reviews.length > 0
        ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
        : null;

      return {
        id: listing.id,
        providerId: listing.providerId,
        providerName: listing.provider.user.username,
        vehicleType: listing.provider.vehicleType,
        pricePerSeat: Number(listing.pricePerSeat),
        seatsAvailable: listing.seatsAvailable,
        departureTime: listing.departureTime,
        startLocationText: listing.startLocationText,
        endLocationText: listing.endLocationText,
        avgRating,
        totalCost: Number(listing.pricePerSeat) * seatsNeeded,
        isReturnTrip
      };
    });
  }

  /**
   * Allocate rooms for travelers
   */
  static allocateRooms(
    availableRooms: any[],
    numberOfTravelers: number,
    numberOfNights: number
  ): RoomAllocation[] {
    // Sort rooms by capacity (smallest to largest) for efficient allocation
    const sortedRooms = [...availableRooms].sort((a, b) => a.capacity - b.capacity);
    
    let remainingTravelers = numberOfTravelers;
    const allocations: RoomAllocation[] = [];

    for (const room of sortedRooms) {
      if (remainingTravelers <= 0) break;

      const numberOfRoomsNeeded = Math.ceil(remainingTravelers / room.capacity);
      const guestsInThisRoomType = Math.min(remainingTravelers, numberOfRoomsNeeded * room.capacity);

      allocations.push({
        roomId: room.id,
        roomType: room.roomType,
        pricePerNight: Number(room.pricePerNight),
        capacity: room.capacity,
        numberOfRooms: numberOfRoomsNeeded,
        guestsAllocated: guestsInThisRoomType,
        totalCost: Number(room.pricePerNight) * numberOfRoomsNeeded * numberOfNights
      });

      remainingTravelers -= guestsInThisRoomType;
    }

    return allocations;
  }

  /**
   * Find available accommodations with room allocation
   */
  static async findAvailableAccommodations(
    location: string,
    checkInDate: Date,
    checkOutDate: Date,
    numberOfTravelers: number,
    maxBudget: number
  ): Promise<AccommodationOption[]> {
    const numberOfNights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const accommodations = await prisma.accommodation.findMany({
      where: {
        location: { 
          contains: location,
          mode: 'insensitive',
        }
      },
      include: {
        rooms: {
          where: {
            bookings: {
              none: {
                OR: [
                  {
                    checkInDate: { lte: checkOutDate },
                    checkOutDate: { gte: checkInDate }
                  }
                ]
              }
            }
          },
          orderBy: {
            pricePerNight: 'asc'
          }
        },
        reviews: {
          select: { rating: true }
        }
      }
    });

    const accommodationOptions: AccommodationOption[] = [];

    for (const accommodation of accommodations) {
      if (accommodation.rooms.length === 0) continue;

      // Try to allocate rooms for this accommodation
      const roomAllocations = this.allocateRooms(
        accommodation.rooms,
        numberOfTravelers,
        numberOfNights
      );

      // Check if we could allocate all travelers
      const totalAllocated = roomAllocations.reduce((sum, r) => sum + r.guestsAllocated, 0);
      if (totalAllocated < numberOfTravelers) continue;

      const totalCost = roomAllocations.reduce((sum, r) => sum + r.totalCost, 0);

      // Skip if exceeds budget
      if (totalCost > maxBudget) continue;

      const avgRating = accommodation.reviews.length > 0
        ? accommodation.reviews.reduce((sum, r) => sum + r.rating, 0) / accommodation.reviews.length
        : null;

      accommodationOptions.push({
        id: accommodation.id,
        providerId: accommodation.providerId,
        name: accommodation.name,
        location: accommodation.location,
        description: accommodation.description,
        mediaUrls: accommodation.mediaUrls,
        avgRating,
        roomAllocations,
        totalCost,
        totalGuests: numberOfTravelers,
        checkInDate,
        checkOutDate,
        numberOfNights
      });
    }

    // Sort by total cost and rating
    return accommodationOptions.sort((a, b) => {
      const scorea = a.totalCost - (a.avgRating || 0) * 100;
      const scoreb = b.totalCost - (b.avgRating || 0) * 100;
      return scorea - scoreb;
    });
  }

  /**
   * Find local activities based on interests
   */
  static async findActivities(
    interests: string[],
    location: string
  ): Promise<ActivityOption[]> {
    if (!interests || interests.length === 0) return [];

    const questions = await prisma.question.findMany({
      where: {
        OR: interests.flatMap(interest => [
          { title: { contains: interest, mode: 'insensitive' } },
          { description: { contains: interest, mode: 'insensitive' } },
          { tags: { has: interest } }
        ])
      },
      select: { 
        title: true, 
        description: true, 
        upvotes: true,
        tags: true 
      },
      orderBy: { upvotes: 'desc' },
      take: 10
    });

    return questions.map(q => ({
      title: q.title,
      description: q.description,
      upvotes: q.upvotes,
      tags: q.tags,
      source: 'local_knowledge' as const
    }));
  }

  /**
   * Calculate optimization score for a trip option
   */
  static calculateOptimizationScore(option: TripOption, budget: number): number {
    let score = 0;

    // Cost efficiency (40% weight)
    const costRatio = option.costs.total / budget;
    const costScore = Math.max(0, 100 - (costRatio * 100));
    score += costScore * 0.4;

    // Rating quality (30% weight)
    let avgRating = 0;
    let ratingCount = 0;

    if (option.outboundTransport?.avgRating) {
      avgRating += option.outboundTransport.avgRating;
      ratingCount++;
    }
    if (option.returnTransport?.avgRating) {
      avgRating += option.returnTransport.avgRating;
      ratingCount++;
    }
    if (option.accommodation?.avgRating) {
      avgRating += option.accommodation.avgRating;
      ratingCount++;
    }

    if (ratingCount > 0) {
      avgRating = avgRating / ratingCount;
      score += (avgRating / 5) * 100 * 0.3;
    }

    // Completeness (30% weight)
    let completeness = 0;
    if (option.outboundTransport) completeness += 0.4;
    if (option.returnTransport) completeness += 0.3;
    if (option.accommodation) completeness += 0.3;
    score += completeness * 100 * 0.3;

    return Math.round(score * 10) / 10;
  }

  /**
   * Generate comprehensive trip plans with AI-powered iterative optimization
   */
  static async generateTripPlansWithAI(
    request: PlanGenerationRequest,
    maxIterations: number = 3,
    enableAIEnhancement: boolean = true
  ): Promise<TripPlan & { 
    iterations: Array<{
      iterationNumber: number;
      resultCount: number;
      optimalScore: number;
      aiAnalysis?: any;
      adjustmentsMade?: string[];
    }>;
    aiEnhancedPlans?: boolean;
  }> {
    const iterationHistory: Array<{
      iterationNumber: number;
      resultCount: number;
      optimalScore: number;
      aiAnalysis?: any;
      adjustmentsMade?: string[];
    }> = [];

    let currentRequest = { ...request };
    let bestResult: TripPlan | null = null;
    let bestScore = 0;

    // Iterative optimization loop
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      console.log(`\n🔄 Iteration ${iteration}/${maxIterations}`);
      
      // Generate plan with current parameters
      const result = await this.generateTripPlans(currentRequest);
      
      const currentScore = result.optimalPlan?.optimizationScore || 0;
      const resultCount = result.recommendedPlans.length;

      // Track iteration
      const iterationData: any = {
        iterationNumber: iteration,
        resultCount,
        optimalScore: currentScore
      };

      // Keep best result
      if (currentScore > bestScore || bestResult === null) {
        bestScore = currentScore;
        bestResult = result;
      }

      // AI Analysis - should we continue iterating?
      if (iteration < maxIterations && enableAIEnhancement) {
        try {
          const analysis = await AIPlannerAgent.analyzeResults(
            currentRequest,
            result,
            iteration
          );

          iterationData.aiAnalysis = analysis;
          console.log(`📊 AI Analysis:`, analysis.reasoning);
          console.log(`   Issues:`, analysis.mainIssues);

          // If AI says results are good enough, stop iterating
          if (analysis.hasGoodOptions || !analysis.shouldContinueIterating) {
            console.log(`✅ AI determined results are sufficient`);
            iterationHistory.push(iterationData);
            break;
          }

          // Apply AI suggestions for next iteration
          const adjustmentsMade: string[] = [];

          if (analysis.suggestions.budgetAdjustments) {
            const budgetAdj = analysis.suggestions.budgetAdjustments;
            // Adjust internal budget allocation (not total budget)
            adjustmentsMade.push(`Budget reallocation: Transport ${budgetAdj.transportationBudget}, Accommodation ${budgetAdj.accommodationBudget}`);
          }

          if (analysis.suggestions.searchCriteria) {
            const criteria = analysis.suggestions.searchCriteria;
            if (criteria.relaxBudget > 0) {
              currentRequest.budget = currentRequest.budget * (1 + criteria.relaxBudget / 100);
              adjustmentsMade.push(`Increased budget by ${criteria.relaxBudget}%`);
            }
          }

          if (analysis.suggestions.dateFlexibility) {
            const dates = analysis.suggestions.dateFlexibility;
            currentRequest.startTime = dates.suggestedStartDate;
            currentRequest.endTime = dates.suggestedEndDate;
            adjustmentsMade.push(`Adjusted dates: ${dates.suggestedStartDate} to ${dates.suggestedEndDate}`);
          }

          iterationData.adjustmentsMade = adjustmentsMade;
          console.log(`🔧 Adjustments for next iteration:`, adjustmentsMade);

        } catch (error) {
          console.error(`❌ AI analysis failed:`, error);
          // Continue with current best result
        }
      }

      iterationHistory.push(iterationData);

      // If we have a great score, no need to continue
      if (currentScore >= 85) {
        console.log(`🌟 Excellent score achieved (${currentScore}), stopping iterations`);
        break;
      }
    }

    // Enhance final plans with AI insights
    if (bestResult && enableAIEnhancement) {
      try {
        console.log(`\n🤖 Enhancing plans with AI insights...`);
        
        // Enhance top 3 plans
        const plansToEnhance = bestResult.recommendedPlans.slice(0, 3);
        
        for (const plan of plansToEnhance) {
          try {
            const enhancement = await AIPlannerAgent.enhancePlanWithAI(
              plan,
              request,
              bestResult.recommendedPlans
            );

            // Add AI enhancements to plan
            (plan as any).aiEnhancement = enhancement;
          } catch (error) {
            console.error(`Failed to enhance plan ${plan.optionId}:`, error);
          }
        }

        // Generate AI activity suggestions
        const numberOfDays = Math.ceil(
          (new Date(request.endTime).getTime() - new Date(request.startTime).getTime()) 
          / (1000 * 60 * 60 * 24)
        );

        const aiActivities = await AIPlannerAgent.generateActivitySuggestions(
          request.endLocation,
          request.interests,
          bestResult.availableOptions.activities,
          numberOfDays
        );

        // Merge AI activities with existing ones
        bestResult.availableOptions.activities = [
          ...bestResult.availableOptions.activities,
          ...aiActivities
        ];

      } catch (error) {
        console.error(`❌ AI enhancement failed:`, error);
      }
    }

    return {
      ...bestResult!,
      iterations: iterationHistory,
      aiEnhancedPlans: enableAIEnhancement
    };
  }

  /**
   * Generate comprehensive trip plans (single iteration - original method)
   */
  static async generateTripPlans(request: PlanGenerationRequest): Promise<TripPlan> {
    const {
      startLocation,
      endLocation,
      startTime,
      endTime,
      interests,
      budget,
      numberOfTravelers,
      needsReturnTransport = true
    } = request;

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const numberOfNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Estimate budget allocation (flexible)
    const estimatedTransportCost = budget * 0.3;
    const estimatedAccommodationCost = budget * 0.5;
    const maxBudgetPerSeat = estimatedTransportCost / numberOfTravelers;

    // Find all available options
    const [
      outboundTransportation,
      returnTransportation,
      accommodations,
      activities
    ] = await Promise.all([
      this.findAvailableTransportation(
        startLocation,
        endLocation,
        startDate,
        numberOfTravelers,
        maxBudgetPerSeat,
        false
      ),
      needsReturnTransport
        ? this.findAvailableTransportation(
            endLocation,
            startLocation,
            endDate,
            numberOfTravelers,
            maxBudgetPerSeat,
            true
          )
        : Promise.resolve([]),
      this.findAvailableAccommodations(
        endLocation,
        startDate,
        endDate,
        numberOfTravelers,
        estimatedAccommodationCost
      ),
      this.findActivities(interests, endLocation)
    ]);

    // Generate trip options (combinations)
    const recommendedPlans: TripOption[] = [];
    let optionCounter = 0;

    // Generate top combinations
    const maxOutbound = Math.min(outboundTransportation.length, 3);
    const maxReturn = Math.min(returnTransportation.length, 2);
    const maxAccommodation = Math.min(accommodations.length, 3);

    for (let i = 0; i < maxOutbound || i === 0; i++) {
      for (let j = 0; j < maxReturn || j === 0; j++) {
        for (let k = 0; k < maxAccommodation || k === 0; k++) {
          const outbound = outboundTransportation[i] || null;
          const returnTrip = returnTransportation[j] || null;
          const accommodation = accommodations[k] || null;

          const transportCost = (outbound?.totalCost || 0) + (returnTrip?.totalCost || 0);
          const accommodationCost = accommodation?.totalCost || 0;
          const totalCost = transportCost + accommodationCost;

          // Skip if exceeds budget
          if (totalCost > budget) continue;

          const warnings: string[] = [];
          if (!outbound) warnings.push('No outbound transportation available');
          if (needsReturnTransport && !returnTrip) warnings.push('No return transportation available');
          if (!accommodation) warnings.push('No accommodation available');

          const option: TripOption = {
            optionId: `plan_${++optionCounter}`,
            planName: `${accommodation ? accommodation.name : 'Self-arranged Stay'} with ${outbound ? outbound.vehicleType : 'Self Transport'}`,
            description: this.generatePlanDescription(outbound, returnTrip, accommodation, numberOfTravelers),
            outboundTransport: outbound,
            returnTransport: returnTrip,
            accommodation: accommodation,
            activities: activities.slice(0, 5),
            costs: {
              transportation: transportCost,
              accommodation: accommodationCost,
              activities: 0,
              total: totalCost
            },
            isOptimal: false,
            optimizationScore: 0,
            warnings
          };

          option.optimizationScore = this.calculateOptimizationScore(option, budget);
          recommendedPlans.push(option);
        }
      }
    }

    // Sort by optimization score
    recommendedPlans.sort((a, b) => b.optimizationScore - a.optimizationScore);

    // Mark the best option as optimal
    if (recommendedPlans.length > 0) {
      recommendedPlans[0].isOptimal = true;
    }

    return {
      requestSummary: {
        startLocation,
        endLocation,
        startTime: startDate,
        endTime: endDate,
        interests,
        budget,
        numberOfTravelers
      },
      availableOptions: {
        outboundTransportation,
        returnTransportation,
        accommodations,
        activities
      },
      recommendedPlans: recommendedPlans.slice(0, 5),
      optimalPlan: recommendedPlans[0] || null
    };
  }

  /**
   * Generate a human-readable description for a plan
   */
  private static generatePlanDescription(
    outbound: TransportationOption | null,
    returnTrip: TransportationOption | null,
    accommodation: AccommodationOption | null,
    numberOfTravelers: number
  ): string {
    let description = '';

    if (outbound) {
      description += `Travel by ${outbound.vehicleType} from ${outbound.startLocationText} to ${outbound.endLocationText}. `;
    }

    if (accommodation) {
      description += `Stay at ${accommodation.name} (${accommodation.roomAllocations.length} room type(s) for ${numberOfTravelers} guest(s)). `;
    }

    if (returnTrip) {
      description += `Return by ${returnTrip.vehicleType} from ${returnTrip.startLocationText} to ${returnTrip.endLocationText}.`;
    }

    return description.trim();
  }
}
