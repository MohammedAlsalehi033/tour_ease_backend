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
  
  availableOptions: {
    outboundTransportation: TransportationOption[];
    returnTransportation: TransportationOption[];
    accommodations: AccommodationOption[];
    activities: ActivityOption[];
  };
  
  recommendedPlans: TripOption[];
  
  optimalPlan: TripOption | null;
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
  
  // Additional info
  specialRequests?: string;
}

export interface BookingConfirmationResponse {
  success: boolean;
  bookings: {
    transportationBookings: {
      outbound?: {
        id: number;
        status: string;
        totalPrice: number;
        offerId?: number;
      };
      return?: {
        id: number;
        status: string;
        totalPrice: number;
        offerId?: number;
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
}
