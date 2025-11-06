import { PrismaClient } from '@prisma/client';
import {
  TransportationOption,
  AccommodationOption,
  RoomAllocation,
  ActivityOption,
  TripOption,
  TripPlan,
  PlanGenerationRequest,
  DayItinerary,
  DayActivity,
  LocationDetails
} from '../../Types/plannerTypes';
import { AIPlannerAgent } from '../../services/aiPlannerAgent';
import { GooglePlacesService } from '../../services/googlePlacesService';

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
    // Calculate number of nights based on calendar days, not hours
    // From Nov 3 to Nov 6 is 3 nights (3-4, 4-5, 5-6)
    const checkInDay = new Date(checkInDate);
    checkInDay.setHours(0, 0, 0, 0);
    const checkOutDay = new Date(checkOutDate);
    checkOutDay.setHours(0, 0, 0, 0);
    const numberOfNights = Math.round(
      (checkOutDay.getTime() - checkInDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Extract city name - handle "Lahore City, Pakistan" -> "Lahore"
    let cleanLocation = location.split(',')[0].trim();
    // Remove "City" suffix if present
    cleanLocation = cleanLocation.replace(/\s+City$/i, '').trim();

    const accommodations = await prisma.accommodation.findMany({
      where: {
        location: { 
          contains: cleanLocation,
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
   * Generate AI-powered activity suggestions based on interests and location
   */
  static async findActivities(
    interests: string[],
    location: string
  ): Promise<ActivityOption[]> {
    if (!interests || interests.length === 0) {
      interests = ['sightseeing', 'culture', 'food'];
    }

    try {
      // Use AI to generate activity suggestions
      const aiActivities = await AIPlannerAgent.generateActivitySuggestions(
        location,
        interests,
        [], // No existing activities from DB
        7 // Generate activities for up to 7 days
      );

      return aiActivities;
    } catch (error) {
      console.error('Error generating AI activities:', error);
      // Fallback to basic activities if AI fails
      return this.getFallbackActivities(location, interests);
    }
  }

  /**
   * Fallback activities if AI generation fails
   */
  private static getFallbackActivities(
    location: string,
    interests: string[]
  ): ActivityOption[]  {
    const fallbackActivities: ActivityOption[] = [];
    
    // Generic activities based on location
    if (location.toLowerCase().includes('lahore')) {
      fallbackActivities.push(
        { title: 'Visit Badshahi Mosque', description: 'Explore the iconic Mughal-era mosque', upvotes: 0, tags: ['culture', 'history'], source: 'ai_suggestion' as const },
        { title: 'Lahore Fort Tour', description: 'Discover the historical Lahore Fort', upvotes: 0, tags: ['history', 'sightseeing'], source: 'ai_suggestion' as const },
        { title: 'Food Street Experience', description: 'Taste authentic Lahori cuisine', upvotes: 0, tags: ['food', 'culture'], source: 'ai_suggestion' as const }
      );
    } else if (location.toLowerCase().includes('islamabad')) {
      fallbackActivities.push(
        { title: 'Faisal Mosque Visit', description: 'See the largest mosque in Pakistan', upvotes: 0, tags: ['culture', 'sightseeing'], source: 'ai_suggestion' as const },
        { title: 'Daman-e-Koh Viewpoint', description: 'Enjoy panoramic views of Islamabad', upvotes: 0, tags: ['nature', 'sightseeing'], source: 'ai_suggestion' as const },
        { title: 'Lok Virsa Museum', description: 'Explore Pakistani cultural heritage', upvotes: 0, tags: ['culture', 'museums'], source: 'ai_suggestion' as const }
      );
    }

    return fallbackActivities;
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
        
        // COST OPTIMIZATION: Only enhance top plan with AI (if enabled)
        // Other plans get basic enhancements without AI cost
        const plansToEnhance = bestResult.recommendedPlans.slice(0, 3);
        
        for (let i = 0; i < plansToEnhance.length; i++) {
          const plan = plansToEnhance[i];
          try {
            // Only the first plan (top plan) gets full AI enhancement
            const isTopPlan = i === 0;
            const enhancement = await AIPlannerAgent.enhancePlanWithAI(
              plan,
              request,
              bestResult.recommendedPlans,
              isTopPlan
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
    
    // Calculate nights based on calendar days
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(endDate);
    endDay.setHours(0, 0, 0, 0);
    const numberOfNights = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));

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

    // Generate day-by-day itinerary
    const itinerary = await this.generateDayByDayItinerary(
      endLocation,
      startDate,
      endDate,
      interests,
      numberOfTravelers
    );

    // Calculate trip summary
    const cheapestOutbound = outboundTransportation.length > 0 
      ? outboundTransportation.reduce((min, t) => t.pricePerSeat < min.pricePerSeat ? t : min)
      : null;
    const cheapestReturn = returnTransportation.length > 0
      ? returnTransportation.reduce((min, t) => t.pricePerSeat < min.pricePerSeat ? t : min)
      : null;
    const cheapestAccommodation = accommodations.length > 0
      ? accommodations.reduce((min, a) => a.totalCost < min.totalCost ? a : min)
      : null;

    const totalActivitiesCost = itinerary.reduce((sum, day) => sum + day.totalEstimatedCost, 0);
    
    // Separate meals cost from activities
    const totalMealsCost = itinerary.reduce((sum, day) => {
      return sum + day.activities
        .filter(act => act.type === 'breakfast' || act.type === 'lunch' || act.type === 'dinner')
        .reduce((mealSum, act) => mealSum + act.estimatedCost, 0);
    }, 0);
    
    const totalNonMealActivitiesCost = totalActivitiesCost - totalMealsCost;
    
    const transportationCost = ((cheapestOutbound?.pricePerSeat || 0) + (cheapestReturn?.pricePerSeat || 0)) * numberOfTravelers;
    const accommodationCost = cheapestAccommodation?.totalCost || 0;
    
    const totalEstimatedCost = transportationCost + accommodationCost + totalActivitiesCost;

    const remainingBudget = budget - totalEstimatedCost;
    const budgetUsagePercent = budget > 0 ? (totalEstimatedCost / budget) * 100 : 0;
    
    let budgetStatus: 'within_budget' | 'over_budget' | 'close_to_budget';
    if (totalEstimatedCost > budget) {
      budgetStatus = 'over_budget';
    } else if (budgetUsagePercent > 85) {
      budgetStatus = 'close_to_budget';
    } else {
      budgetStatus = 'within_budget';
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalNights = totalDays - 1;

    return {
      transportationOptions: {
        outbound: outboundTransportation,
        return: returnTransportation
      },
      accommodationOptions: accommodations,
      itinerary,
      tripSummary: {
        totalDays,
        totalNights,
        estimatedTotalCost: {
          transportation: transportationCost,
          accommodation: accommodationCost,
          activities: totalNonMealActivitiesCost,
          meals: totalMealsCost,
          total: totalEstimatedCost
        },
        budgetStatus,
        remainingBudget
      },
      // Keep backward compatibility
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

  /**
   * Generate day-by-day itinerary with activities
   */
  private static async generateDayByDayItinerary(
    destination: string,
    startDate: Date,
    endDate: Date,
    interests: string[],
    numberOfTravelers: number
  ): Promise<DayItinerary[]> {
    const itinerary: DayItinerary[] = [];
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Clean destination - "Lahore City, Pakistan" -> "lahore"
    const cleanDest = destination.split(',')[0].trim().replace(/\s+City$/i, '').trim().toLowerCase();

    // Helper function to get rich description for a location
    const getLocationDescription = (locationName: string): string => {
      const descriptions: Record<string, string> = {
        'Badshahi Mosque': 'A magnificent Mughal-era mosque built in 1671, featuring stunning red sandstone architecture, intricate marble inlay work, and massive courtyard. One of the largest mosques in Pakistan and a UNESCO World Heritage Site.',
        'Lahore Fort': 'A spectacular royal fort with 21 monuments built over 1000 years. Features the famous Sheesh Mahal (Palace of Mirrors), beautiful gardens, and stunning Mughal architecture. UNESCO World Heritage Site.',
        'Food Street Gawalmandi': 'Historic food street famous for authentic Lahori cuisine including nihari, paya, haleem, and various kebabs. Atmospheric dining with views of historic buildings.',
        'Shalimar Gardens': 'Breathtaking Mughal garden complex built in 1642 with terraced levels, over 400 fountains, marble pavilions, and stunning landscaping. A masterpiece of hydraulic engineering.',
        'Lahore Museum': 'One of Pakistan\'s oldest and largest museums featuring Gandhara art, Mughal artifacts, ancient manuscripts, and the famous fasting Buddha statue. Rich collection spanning 5000 years.',
        'Minar-e-Pakistan': 'National monument commemorating Pakistan\'s independence, standing 62 meters tall. Features marble and red sandstone construction with panoramic city views from the top.',
        'Anarkali Bazaar': 'One of the oldest surviving markets in South Asia dating back 200 years. Famous for traditional clothing, jewelry, handicrafts, spices, and vibrant local culture.',
        'Liberty Market': 'Modern upscale shopping area with branded stores, boutiques, cafes, and restaurants. Popular for contemporary fashion, accessories, and international brands.',
        'Faisal Mosque': 'Iconic modern mosque designed like a Bedouin tent, one of the largest in the world. Features striking white marble architecture against Margalla Hills backdrop.',
        'Pakistan Monument': 'National monument representing Pakistan\'s four provinces and three territories. Features museum, 360-degree views, and beautiful gardens.',
        'Daman-e-Koh': 'Scenic viewpoint in Margalla Hills offering panoramic views of Islamabad city. Popular picnic spot with restaurant and walking trails.',
        'Lok Virsa Museum': 'National institute showcasing Pakistani folk heritage, traditional crafts, and cultural artifacts from all regions.',
        'Centaurus Mall': 'Premier shopping and entertainment complex with international brands, food court, cinema, and restaurants.',
        'Margalla Hills Trail': 'Popular hiking trail with moderate difficulty, offering stunning views, diverse wildlife, and fresh mountain air.',
      };
      return descriptions[locationName] || 'A popular destination worth visiting in the area.';
    };

    // Location data for Lahore and Islamabad
    const locationDatabase: Record<string, LocationDetails[]> = {
      'lahore': [
        { name: 'Badshahi Mosque', address: 'Walled City, Lahore', latitude: 31.5881, longitude: 74.3099, googleMapsUrl: 'https://maps.google.com/?q=Badshahi+Mosque+Lahore' },
        { name: 'Lahore Fort', address: 'Fort Road, Lahore', latitude: 31.5882, longitude: 74.3154, googleMapsUrl: 'https://maps.google.com/?q=Lahore+Fort' },
        { name: 'Food Street Gawalmandi', address: 'Gawalmandi, Lahore', latitude: 31.5639, longitude: 74.3181, googleMapsUrl: 'https://maps.google.com/?q=Food+Street+Gawalmandi' },
        { name: 'Shalimar Gardens', address: 'GT Road, Lahore', latitude: 31.5870, longitude: 74.3836, googleMapsUrl: 'https://maps.google.com/?q=Shalimar+Gardens+Lahore' },
        { name: 'Lahore Museum', address: 'Mall Road, Lahore', latitude: 31.5688, longitude: 74.3085, googleMapsUrl: 'https://maps.google.com/?q=Lahore+Museum' },
        { name: 'Minar-e-Pakistan', address: 'Iqbal Park, Lahore', latitude: 31.5925, longitude: 74.3095, googleMapsUrl: 'https://maps.google.com/?q=Minar-e-Pakistan' },
        { name: 'Anarkali Bazaar', address: 'Anarkali, Lahore', latitude: 31.5639, longitude: 74.3181, googleMapsUrl: 'https://maps.google.com/?q=Anarkali+Bazaar' },
        { name: 'Liberty Market', address: 'Gulberg, Lahore', latitude: 31.5086, longitude: 74.3499, googleMapsUrl: 'https://maps.google.com/?q=Liberty+Market+Lahore' },
      ],
      'islamabad': [
        { name: 'Faisal Mosque', address: 'Shah Faisal Avenue, Islamabad', latitude: 33.7297, longitude: 73.0372, googleMapsUrl: 'https://maps.google.com/?q=Faisal+Mosque' },
        { name: 'Pakistan Monument', address: 'Shakarparian, Islamabad', latitude: 33.6932, longitude: 73.0683, googleMapsUrl: 'https://maps.google.com/?q=Pakistan+Monument' },
        { name: 'Daman-e-Koh', address: 'Margalla Hills, Islamabad', latitude: 33.7366, longitude: 73.0663, googleMapsUrl: 'https://maps.google.com/?q=Daman-e-Koh' },
        { name: 'Lok Virsa Museum', address: 'Garden Avenue, Islamabad', latitude: 33.6841, longitude: 73.0735, googleMapsUrl: 'https://maps.google.com/?q=Lok+Virsa+Museum' },
        { name: 'Centaurus Mall', address: 'Jinnah Avenue, Islamabad', latitude: 33.7102, longitude: 73.0565, googleMapsUrl: 'https://maps.google.com/?q=Centaurus+Mall' },
        { name: 'Margalla Hills Trail', address: 'Trail 3, Islamabad', latitude: 33.7442, longitude: 73.0581, googleMapsUrl: 'https://maps.google.com/?q=Margalla+Hills+Trail+3' },
      ]
    };

    const destinationKey = cleanDest;
    const locations = locationDatabase[destinationKey] || [];

    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);
      
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dateString = currentDate.toISOString().split('T')[0];

      const activities: DayActivity[] = [];
      let currentTime = '09:00 AM';

      // First day - Arrival
      if (day === 0) {
        activities.push({
          time: '12:00 PM',
          duration: 60,
          type: 'rest',
          title: 'Check-in & Rest',
          description: 'Arrive at hotel, check-in, and freshen up',
          location: { name: 'Hotel', address: destination },
          estimatedCost: 0,
          tips: 'Keep your ID and booking confirmation ready'
        });
        
        activities.push({
          time: '02:00 PM',
          duration: 90,
          type: 'lunch',
          title: 'Welcome Lunch',
          description: locations[0] ? getLocationDescription(locations[0].name) : 'Try local cuisine at a popular restaurant',
          location: locations[0] || { name: 'Local Restaurant', address: destination },
          estimatedCost: 1500 * numberOfTravelers,
          tips: 'Try the local specialties!'
        });

        activities.push({
          time: '04:00 PM',
          duration: 120,
          type: 'attraction',
          title: 'City Orientation Walk',
          description: locations[1] ? getLocationDescription(locations[1].name) : 'Light evening walk to explore nearby area',
          location: locations[1] || { name: 'City Center', address: destination },
          estimatedCost: 500 * numberOfTravelers,
          tips: 'Great time for photos in evening light'
        });

      } else if (day === totalDays - 1) {
        // Last day - Departure
        activities.push({
          time: '08:00 AM',
          duration: 60,
          type: 'breakfast',
          title: 'Farewell Breakfast',
          description: 'Breakfast at hotel',
          location: { name: 'Hotel Restaurant', address: destination },
          estimatedCost: 800 * numberOfTravelers
        });

        activities.push({
          time: '10:00 AM',
          duration: 90,
          type: 'shopping',
          title: 'Last-minute Shopping',
          description: 'Pick up souvenirs and local products',
          location: locations[locations.length - 1] || { name: 'Shopping Area', address: destination },
          estimatedCost: 2000 * numberOfTravelers,
          tips: 'Bargaining is common in local markets'
        });

        activities.push({
          time: '12:00 PM',
          duration: 30,
          type: 'rest',
          title: 'Check-out',
          description: 'Hotel check-out and prepare for departure',
          location: { name: 'Hotel', address: destination },
          estimatedCost: 0
        });

      } else {
        // Regular days
        activities.push({
          time: '08:00 AM',
          duration: 60,
          type: 'breakfast',
          title: 'Breakfast',
          description: 'Start your day with a hearty breakfast',
          location: { name: 'Hotel Restaurant', address: destination },
          estimatedCost: 800 * numberOfTravelers
        });

        // Morning activity
        const morningLoc = locations[(day * 2) % locations.length];
        activities.push({
          time: '10:00 AM',
          duration: 150,
          type: 'attraction',
          title: `Visit ${morningLoc?.name || 'Local Attraction'}`,
          description: (morningLoc && morningLoc.name) ? getLocationDescription(morningLoc.name) : `Explore the ${morningLoc?.name || 'attraction'} and learn about its history`,
          location: morningLoc || { name: 'Attraction', address: destination },
          estimatedCost: 500 * numberOfTravelers,
          bookingRequired: false,
          mapUrl: morningLoc?.googleMapsUrl
        });

        activities.push({
          time: '01:00 PM',
          duration: 90,
          type: 'lunch',
          title: 'Lunch',
          description: 'Enjoy traditional local cuisine with authentic flavors and regional specialties',
          location: locations[(day * 2 + 1) % locations.length] || { name: 'Restaurant', address: destination },
          estimatedCost: 2000 * numberOfTravelers,
          tips: 'Try the chef\'s special!'
        });

        // Afternoon activity
        const afternoonLoc = locations[(day * 2 + 2) % locations.length];
        activities.push({
          time: '03:00 PM',
          duration: 180,
          type: interests.includes('shopping') ? 'shopping' : 'activity',
          title: `${afternoonLoc?.name || 'Afternoon Activity'}`,
          description: (afternoonLoc && afternoonLoc.name) ? getLocationDescription(afternoonLoc.name) : `Experience ${afternoonLoc?.name || 'the local culture'}`,
          location: afternoonLoc || { name: 'Activity Location', address: destination },
          estimatedCost: 1500 * numberOfTravelers,
          mapUrl: afternoonLoc?.googleMapsUrl
        });

        activities.push({
          time: '07:00 PM',
          duration: 120,
          type: 'dinner',
          title: 'Dinner',
          description: 'Dinner at a recommended restaurant featuring local and international cuisine',
          location: locations[(day * 2 + 3) % locations.length] || { name: 'Dinner Spot', address: destination },
          estimatedCost: 2500 * numberOfTravelers,
          tips: 'Reservations recommended for popular spots'
        });
      }

      const totalCost = activities.reduce((sum, act) => sum + act.estimatedCost, 0);
      const totalDuration = activities.reduce((sum, act) => sum + act.duration, 0);

      itinerary.push({
        day: day + 1,
        date: dateString,
        dayOfWeek,
        theme: day === 0 ? 'Arrival & Orientation' : 
               day === totalDays - 1 ? 'Departure Day' : 
               `Day ${day + 1} - Exploration`,
        activities,
        totalEstimatedCost: totalCost,
        totalDuration: totalDuration,
        startTime: activities[0]?.time || '09:00 AM',
        endTime: activities[activities.length - 1]?.time || '09:00 PM'
      });
    }

    // Enrich activities with Google Places data
    await this.enrichActivitiesWithPlacesData(itinerary, cleanDest);

    return itinerary;
  }

  /**
   * Enrich activities with real Google Places data
   */
  private static async enrichActivitiesWithPlacesData(
    itinerary: DayItinerary[],
    destination: string
  ): Promise<void> {
    console.log('🌍 Enriching major attractions with Google Places data...');
    
    let apiCallsCount = 0;
    const maxApiCalls = 5; // Limit to 5 API calls per trip to minimize costs
    
    for (const day of itinerary) {
      for (const activity of day.activities) {
        // COST OPTIMIZATION: Only enrich major attractions, skip meals, rest, and travel
        const shouldEnrich = 
          activity.type === 'attraction' || 
          activity.type === 'activity' || 
          activity.type === 'shopping';
        
        if (!shouldEnrich || !activity.location.name || activity.location.name === 'Hotel') {
          console.log(`  ⊘ Skipped (using AI description): ${activity.location.name}`);
          continue;
        }

        // Stop enriching if we've hit the API call limit
        if (apiCallsCount >= maxApiCalls) {
          console.log(`  ⊘ Skipped (API limit reached): ${activity.location.name}`);
          continue;
        }

        try {
          // Fetch place details from Google Places API (only for major attractions)
          const placeDetails = await GooglePlacesService.findPlaceDetails(
            activity.location.name,
            activity.location.address || destination
          );

          if (placeDetails) {
            apiCallsCount++;
            
            // Enrich activity with Google Places data
            activity.placeDetails = {
              rating: placeDetails.rating,
              userRatingsTotal: placeDetails.userRatingsTotal,
              photos: placeDetails.photos,
              openingHours: placeDetails.openingHours,
              website: placeDetails.website,
              phoneNumber: placeDetails.phoneNumber,
              priceLevel: placeDetails.priceLevel,
              reviews: placeDetails.reviews
            };

            // Update description if Google has a better one
            if (placeDetails.description && placeDetails.description.length > activity.description.length) {
              activity.description = placeDetails.description;
            }

            // Update address if we got a more complete one
            if (placeDetails.address) {
              activity.location.address = placeDetails.address;
            }

            console.log(`  ✓ Enriched: ${activity.location.name} (Rating: ${placeDetails.rating || 'N/A'}) [${apiCallsCount}/${maxApiCalls}]`);
          }
        } catch (error) {
          console.error(`  ✗ Failed to enrich ${activity.location.name}:`, error);
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Activity enrichment complete! API calls used: ${apiCallsCount}/${maxApiCalls}`);
  }
}
