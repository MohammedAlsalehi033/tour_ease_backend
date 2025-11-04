import axios from 'axios';

const GOOGLE_PLACES_API_KEY = process.env.GEMINI_API_KEY; // Same Google Cloud API key
const PLACES_API_BASE = 'https://places.googleapis.com/v1';

export interface PlaceDetails {
  name: string;
  description?: string;
  rating?: number;
  userRatingsTotal?: number;
  address?: string;
  photos?: string[];
  openingHours?: {
    openNow?: boolean;
    weekdayText?: string[];
  };
  website?: string;
  phoneNumber?: string;
  types?: string[];
  priceLevel?: number;
  reviews?: {
    author: string;
    rating: number;
    text: string;
    time: string;
  }[];
}

export class GooglePlacesService {
  /**
   * Search for a place and get its details using the NEW Google Places API
   */
  static async findPlaceDetails(placeName: string, location: string): Promise<PlaceDetails | null> {
    try {
      // Use the new Places API (New) - Text Search
      const searchUrl = `${PLACES_API_BASE}/places:searchText`;
      
      const requestBody = {
        textQuery: `${placeName}, ${location}`,
        maxResultCount: 1
      };

      const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.editorialSummary,places.regularOpeningHours,places.websiteUri,places.internationalPhoneNumber,places.types,places.priceLevel,places.photos,places.reviews,places.location'
      };

      const searchResponse = await axios.post(searchUrl, requestBody, { headers });
      
      if (!searchResponse.data.places || searchResponse.data.places.length === 0) {
        console.log(`No place found for: ${placeName}, ${location}`);
        return null;
      }

      const place = searchResponse.data.places[0];

      // Extract photo URLs (first 3)
      const photos: string[] = [];
      if (place.photos && place.photos.length > 0) {
        for (let i = 0; i < Math.min(3, place.photos.length); i++) {
          const photoName = place.photos[i].name;
          // New API photo format: https://places.googleapis.com/v1/{photoName}/media?key=API_KEY&maxHeightPx=800
          const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${GOOGLE_PLACES_API_KEY}&maxHeightPx=800`;
          photos.push(photoUrl);
        }
      }

      // Extract reviews (top 3)
      const reviews: PlaceDetails['reviews'] = [];
      if (place.reviews && place.reviews.length > 0) {
        for (let i = 0; i < Math.min(3, place.reviews.length); i++) {
          const review = place.reviews[i];
          reviews.push({
            author: review.authorAttribution?.displayName || 'Anonymous',
            rating: review.rating || 0,
            text: review.text?.text || '',
            time: review.publishTime || ''
          });
        }
      }

      const placeDetails: PlaceDetails = {
        name: place.displayName?.text || placeName,
        description: place.editorialSummary?.text || this.generateDescription(place.types || []),
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        address: place.formattedAddress,
        photos,
        openingHours: place.regularOpeningHours ? {
          openNow: place.regularOpeningHours.openNow,
          weekdayText: place.regularOpeningHours.weekdayDescriptions
        } : undefined,
        website: place.websiteUri,
        phoneNumber: place.internationalPhoneNumber,
        types: place.types,
        priceLevel: place.priceLevel ? this.convertPriceLevel(place.priceLevel) : undefined,
        reviews
      };

      return placeDetails;

    } catch (error: any) {
      console.error(`Error fetching place details for "${placeName}":`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Convert new API price level string to numeric (0-4)
   */
  private static convertPriceLevel(priceLevel: string): number {
    const priceLevels: { [key: string]: number } = {
      'PRICE_LEVEL_FREE': 0,
      'PRICE_LEVEL_INEXPENSIVE': 1,
      'PRICE_LEVEL_MODERATE': 2,
      'PRICE_LEVEL_EXPENSIVE': 3,
      'PRICE_LEVEL_VERY_EXPENSIVE': 4
    };
    return priceLevels[priceLevel] || 2;
  }

  /**
   * Generate a basic description based on place types if no editorial summary is available
   */
  private static generateDescription(types?: string[]): string {
    if (!types || types.length === 0) {
      return 'A popular attraction in the area.';
    }

    const typeDescriptions: Record<string, string> = {
      'tourist_attraction': 'A must-visit tourist attraction',
      'museum': 'A fascinating museum showcasing history and culture',
      'mosque': 'A beautiful mosque with stunning architecture',
      'park': 'A scenic park perfect for relaxation',
      'shopping_mall': 'A popular shopping destination',
      'restaurant': 'A highly-rated dining establishment',
      'cafe': 'A cozy café perfect for a break',
      'point_of_interest': 'An interesting landmark worth visiting',
      'establishment': 'A notable establishment in the area',
      'historical': 'A site of historical significance',
      'monument': 'An impressive monument'
    };

    for (const type of types) {
      if (typeDescriptions[type]) {
        return typeDescriptions[type];
      }
    }

    return 'A popular destination worth visiting.';
  }

  /**
   * Search for nearby places of a specific type using new Places API
   */
  static async searchNearbyPlaces(
    latitude: number,
    longitude: number,
    type: string,
    radius: number = 5000
  ): Promise<PlaceDetails[]> {
    try {
      const searchUrl = `${PLACES_API_BASE}/places:searchNearby`;
      
      const requestBody = {
        includedTypes: [type],
        maxResultCount: 5,
        locationRestriction: {
          circle: {
            center: {
              latitude,
              longitude
            },
            radius
          }
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types'
      };

      const response = await axios.post(searchUrl, requestBody, { headers });
      
      if (!response.data.places || response.data.places.length === 0) {
        return [];
      }

      // Get details for results
      const places: PlaceDetails[] = [];
      for (const place of response.data.places) {
        const details = await this.findPlaceDetails(place.displayName?.text || '', '');
        if (details) {
          places.push(details);
        }
      }

      return places;

    } catch (error: any) {
      console.error('Error searching nearby places:', error.response?.data || error.message);
      return [];
    }
  }
}
