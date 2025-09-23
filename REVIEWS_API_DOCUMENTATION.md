# Reviews API Documentation

## Overview
The Reviews API provides comprehensive functionality for managing reviews across different types of bookable items in the TourEase platform. Users can create, read, update, and delete reviews for transportation listings, accommodations, rooms, and bookings.

## Database Schema
The Review model supports multiple reviewable types:
- **TRANSPORTATION_LISTING**: Reviews for transportation service listings
- **ACCOMMODATION**: Reviews for accommodation providers
- **ROOM**: Reviews for specific rooms
- **TRANSPORTATION_BOOKING**: Reviews for complete transportation bookings
- **ACCOMMODATION_BOOKING**: Reviews for complete accommodation bookings

## API Endpoints

### Base URL
```
/api/reviews
```

### Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create a Review
**POST** `/api/reviews`

Creates a new review for a bookable item.

**Request Body:**
```json
{
  "reviewableType": "TRANSPORTATION_LISTING",
  "reviewableId": 123,
  "rating": 5,
  "comment": "Excellent service! Very punctual and comfortable ride."
}
```

**Validation Rules:**
- `reviewableType`: Required, must be one of the valid types
- `reviewableId`: Required, must be a valid ID for the reviewable type
- `rating`: Required, must be between 1 and 5
- `comment`: Required, must be a non-empty string
- User must have complete a booking for the item being reviewed
- User can only review each item once

**Response:**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": 1,
    "reviewerId": "user123",
    "reviewableType": "TRANSPORTATION_LISTING",
    "rating": 5,
    "comment": "Excellent service! Very punctual and comfortable ride.",
    "createdAt": "2024-01-15T10:30:00Z",
    "reviewer": {
      "id": "user123",
      "username": "john_doe",
      "mediaUrls": ["profile.jpg"]
    }
  }
}
```

### 2. Get All Reviews
**GET** `/api/reviews`

Retrieves all reviews with pagination and filtering options.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort order - "newest", "oldest", "highest_rating", "lowest_rating" (default: "newest")
- `reviewableType`: Filter by reviewable type
- `minRating`: Minimum rating filter
- `maxRating`: Maximum rating filter

**Example:**
```
GET /api/reviews?page=1&limit=20&sort=highest_rating&minRating=4
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "reviewerId": "user123",
      "reviewableType": "TRANSPORTATION_LISTING",
      "rating": 5,
      "comment": "Excellent service!",
      "createdAt": "2024-01-15T10:30:00Z",
      "reviewer": {
        "id": "user123",
        "username": "john_doe",
        "mediaUrls": ["profile.jpg"]
      },
      "transportationListing": {
        "id": 123,
        "startLocationText": "Downtown",
        "endLocationText": "Airport",
        "departureTime": "2024-01-15T08:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 3. Get Reviews for Specific Item
**GET** `/api/reviews/item/:reviewableType/:reviewableId`

Retrieves all reviews for a specific reviewable item.

**Parameters:**
- `reviewableType`: The type of item (e.g., "TRANSPORTATION_LISTING")
- `reviewableId`: The ID of the item

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:**
```
GET /api/reviews/item/TRANSPORTATION_LISTING/123?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "reviewerId": "user123",
        "rating": 5,
        "comment": "Great service!",
        "createdAt": "2024-01-15T10:30:00Z",
        "reviewer": {
          "id": "user123",
          "username": "john_doe",
          "mediaUrls": ["profile.jpg"]
        }
      }
    ],
    "stats": {
      "totalReviews": 1,
      "averageRating": 5.0,
      "ratingDistribution": {
        "5": 1
      }
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

### 4. Get Review Statistics
**GET** `/api/reviews/stats/:reviewableType/:reviewableId`

Retrieves statistics for reviews of a specific item.

**Parameters:**
- `reviewableType`: The type of item
- `reviewableId`: The ID of the item

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReviews": 15,
    "averageRating": 4.2,
    "ratingDistribution": {
      "1": 1,
      "2": 0,
      "3": 2,
      "4": 5,
      "5": 7
    }
  }
}
```

### 5. Get Reviews by Reviewer
**GET** `/api/reviews/reviewer/:reviewerId`

Retrieves all reviews created by a specific user.

**Parameters:**
- `reviewerId`: The ID of the reviewer

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### 6. Get My Reviews
**GET** `/api/reviews/my-reviews`

Retrieves all reviews created by the authenticated user.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### 7. Get Review by ID
**GET** `/api/reviews/:id`

Retrieves a specific review by its ID.

**Parameters:**
- `id`: The review ID

### 8. Update Review
**PUT** `/api/reviews/:id`

Updates an existing review. Only the reviewer can update their own reviews.

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated comment with more details about the experience."
}
```

**Validation:**
- Only the original reviewer can update the review
- Rating must be between 1 and 5 if provided
- Comment must be non-empty if provided

### 9. Delete Review
**DELETE** `/api/reviews/:id`

Deletes a review. Only the reviewer or admin can delete reviews.

**Parameters:**
- `id`: The review ID

**Validation:**
- Only the original reviewer or admin can delete the review

### 10. Search Reviews
**GET** `/api/reviews/search`

Searches reviews by comment content or reviewable type.

**Query Parameters:**
- `query`: Search term (required)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Example:**
```
GET /api/reviews/search?query=excellent&page=1&limit=10
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to review this item"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Review not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

## Business Rules

1. **Review Access Control**: Users can only review items they have complete bookings for
2. **One Review Per Item**: Each user can only create one review per reviewable item
3. **complete Bookings Only**: Reviews can only be created for complete bookings
4. **Rating Validation**: Ratings must be integers between 1 and 5
5. **Ownership**: Users can only update/delete their own reviews (except admins)
6. **Authentication**: All endpoints require valid authentication

## Usage Examples

### Creating a Review for Transportation Listing
```javascript
const response = await fetch('/api/reviews', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    reviewableType: 'TRANSPORTATION_LISTING',
    reviewableId: 123,
    rating: 5,
    comment: 'Excellent service! Very punctual and comfortable ride.'
  })
});
```

### Getting Reviews for an Accommodation
```javascript
const response = await fetch('/api/reviews/item/ACCOMMODATION/456?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Updating a Review
```javascript
const response = await fetch('/api/reviews/789', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    rating: 4,
    comment: 'Updated review with more details'
  })
});
```

## File Structure

```
src/
├── models/review/
│   ├── reviewBaseModel.ts      # Abstract base model
│   └── reviewModel.ts          # Prisma implementation
├── controllers/review/
│   └── reviewController.ts     # Business logic and request handling
├── routes/review/
│   └── reviewRoutes.ts         # Route definitions
└── Types/
    ├── myEnum.ts               # Review-related enums
    └── myType.ts               # Review-related types
```

## Integration

The reviews functionality is fully integrated into the main application:
- Routes are registered in `src/app.ts` under `/api/reviews`
- Uses existing authentication middleware
- Follows the same patterns as other features in the codebase
- Compatible with the existing Prisma database schema
