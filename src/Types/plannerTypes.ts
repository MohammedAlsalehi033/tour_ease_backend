export interface TransportationOption {
  id: number;
  providerId: string;
  providerName: string;
  vehicleType: string;
  pricePerSeat: number;
  seatsAvailable: number;
  departureTime: Date;
  startLocationText: string;
  endLocationText: string;
  estimatedDuration?: string;
  avgRating: number | null;
  totalCost: number; // pricePerSeat * seatsNeeded
  isReturnTrip: boolean;
  providerReviews?: {
    reviews: any[];
    stats: {
      totalReviews: number;
      averageRating: number;
      ratingDistribution: Record<number, number>;
    };
  };
}

export interface RoomAllocation {
  roomId: number;
  roomType: string;
  pricePerNight: number;
  capacity: number;
  numberOfRooms: number;
  guestsAllocated: number;
  totalCost: number; // pricePerNight * numberOfRooms * numberOfNights
}

export interface AccommodationOption {
  id: number;
  providerId: string;
  name: string;
  location: string;
  description: string;
  mediaUrls: string[];
  avgRating: number | null;
  roomAllocations: RoomAllocation[];
  totalCost: number; // sum of all room allocations
  totalGuests: number;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
}

export interface ActivityOption {
  title: string;
  description: string;
  upvotes: number;
  tags: string[];
  estimatedCost?: number;
  source: 'local_knowledge' | 'ai_suggestion';
}

export interface LocationDetails {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
}

export interface DayActivity {
  time: string; // e.g., "09:00 AM"
  duration: number; // minutes
  type: 'breakfast' | 'lunch' | 'dinner' | 'attraction' | 'activity' | 'shopping' | 'rest' | 'travel';
  title: string;
  description: string;
  location: LocationDetails;
  estimatedCost: number; // PKR
  tips?: string;
  bookingRequired?: boolean;
  mapUrl?: string;
  // Google Places enrichment
  placeDetails?: {
    rating?: number;
    userRatingsTotal?: number;
    photos?: string[];
    openingHours?: {
      openNow?: boolean;
      weekdayText?: string[];
    };
    website?: string;
    phoneNumber?: string;
    priceLevel?: number;
    reviews?: {
      author: string;
      rating: number;
      text: string;
      time: string;
    }[];
  };
}

export interface DayItinerary {
  day: number;
  date: string; // "2025-12-01"
  dayOfWeek: string; // "Monday"
  theme?: string; // "Cultural Exploration", "Food Tour", etc.
  activities: DayActivity[];
  totalEstimatedCost: number;
  totalDuration: number; // minutes
  startTime: string;
  endTime: string;
}

export interface TripOption {
  optionId: string;
  planName: string;
  description: string;
  
  // Transportation
  outboundTransport: TransportationOption | null;
  returnTransport: TransportationOption | null;
  
  // Accommodation
  accommodation: AccommodationOption | null;
  
  // Activities
  activities: ActivityOption[];
  
  // Cost breakdown
  costs: {
    transportation: number;
    accommodation: number;
    activities: number;
    total: number;
  };
  
  // Metadata
  isOptimal: boolean;
  optimizationScore: number; // Based on cost, rating, and availability
  warnings: string[];
}

export interface TripPlan {
  requestSummary: {
    startLocation: string;
    endLocation: string;
    startTime: Date;
    endTime: Date;
    interests: string[];
    budget: number;
    numberOfTravelers: number;
  };
  
  // Step 1: Transportation Options (user picks)
  transportationOptions: {
    outbound: TransportationOption[];
    return: TransportationOption[];
  };
  
  // Step 2: Accommodation Options (user picks)
  accommodationOptions: AccommodationOption[];
  
  // Step 3: Day-by-Day Itinerary (auto-generated)
  itinerary: DayItinerary[];
  
  // Legacy structure (for backward compatibility)
  availableOptions: {
    outboundTransportation: TransportationOption[];
    returnTransportation: TransportationOption[];
    accommodations: AccommodationOption[];
    activities: ActivityOption[];
  };
  
  recommendedPlans: TripOption[];
  optimalPlan: TripOption | null;
  
  // Summary
  tripSummary: {
    totalDays: number;
    totalNights: number;
    estimatedTotalCost: {
      transportation: number;
      accommodation: number;
      activities: number;
      meals: number;
      total: number;
    };
    budgetStatus: 'within_budget' | 'over_budget' | 'close_to_budget';
    remainingBudget: number;
  };
}

export interface BookingConfirmationRequest {
  userId: string;
  optionId: string;
  
  // Selected transportation
  outboundTransportId?: number;
  returnTransportId?: number;
  seatsNeeded: number;
  
  // Selected accommodation
  accommodationId?: number;
  selectedRoomAllocations?: {
    roomId: number;
    numberOfRooms: number;
  }[];
  checkInDate: Date;
  checkOutDate: Date;
  
  // Payment information (required for accommodation booking)
  paymentMethod?: string; // e.g., 'stripe', 'card'
  stripePaymentIntentId?: string; // Stripe PaymentIntent ID from frontend
  
  // Additional info
  specialRequests?: string;
}

export interface BookingConfirmationResponse {
  success: boolean;
  bookings: {
    transportationBookings: {
      outbound?: {
        id?: number | null; // Optional since offer may be pending
        status: string;
        totalPrice: number;
        offerId?: number;
        message?: string; // Message about pending approval
      };
      return?: {
        id?: number | null; // Optional since offer may be pending
        status: string;
        totalPrice: number;
        offerId?: number;
        message?: string; // Message about pending approval
      };
    };
    accommodationBookings: {
      id: number;
      roomId: number;
      status: string;
      totalPrice: number;
    }[];
  };
  totalCost: number;
  message: string;
  errors?: string[];
}

export interface PlanGenerationRequest {
  startLocation: string;
  endLocation: string;
  startTime: string | Date;
  endTime: string | Date;
  interests: string[];
  budget: number;
  numberOfTravelers: number;
  needsReturnTransport?: boolean;
  detailedStartLocation?: { lat: number; lng: number }; // Optional specific coordinates for better ride matching
}
