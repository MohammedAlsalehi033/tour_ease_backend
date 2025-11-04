# TourEase Backend - Full API Documentation

**Base URL**: `http://192.168.18.31:3000` (Development)
**Production**: Will be updated on deployment

---

## Table of Contents
1. [Authentication & User Routes](#authentication--user-routes)
2. [Accommodation Routes](#accommodation-routes)
3. [Room Routes](#room-routes)
4. [Accommodation Booking Routes](#accommodation-booking-routes)
5. [Accommodation Provider Routes](#accommodation-provider-routes)
6. [Upload Routes](#upload-routes)
7. [Question Routes](#question-routes)
8. [Comment Routes](#comment-routes)
9. [Transportation Routes](#transportation-routes)
10. [Ride Sharing Routes](#ride-sharing-routes)
11. [Report Routes](#report-routes)
12. [Review Routes](#review-routes)
13. [Admin Routes](#admin-routes)
14. [Planner Routes](#planner-routes)
15. [Chat Routes](#chat-routes)

---

## Authentication & User Routes

### Base Path: `/api`

#### 1. Create User
```http
POST /api/createUser
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Response**: User created with authentication token

---

#### 2. Get User Role
```http
GET /api/getRole
Authorization: Bearer <token>
```
**Response**:
```json
{
  "success": true,
  "role": "accommodationProvider"
}
```

---

#### 3. Update User Role
```http
POST /api/updateUserRole
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "user-id",
  "role": "accommodationProvider"
}
```

---

#### 4. Get All Users
```http
GET /api/getAllUsers
Authorization: Bearer <admin-token>
```
**Requires**: Admin permission "Manage Users"

---

#### 5. Get User By ID
```http
GET /api/getUserById?id=user-id
```

---

#### 6. **Get Accommodation ID from User ID** ⭐ (KEY ROUTE)
```http
GET /api/accommodation-id/:userId
```

**Parameters**:
- `userId` (string): Firebase user ID

**Response**:
```json
{
  "success": true,
  "accommodationId": 58,
  "accommodation": {
    "id": 58,
    "name": "Al Syed Hostel",
    "providerId": "h0k81gDXw2XytJZa1GzujOGK5gN2",
    "location": "M555+4JG, Chatta Bakhtawar, Islamabad",
    "description": "Just 6 minutes away from COMSATS"
  },
  "message": "Accommodation found for provider"
}
```

**Example**: 
```
GET http://192.168.18.31:3000/api/accommodation-id/h0k81gDXw2XytJZa1GzujOGK5gN2
```

**Use Case**: Flutter app uses this to get accommodation ID before fetching dashboard

---

#### 7. Add FCM Token
```http
POST /api/FCMToken/:userId
Content-Type: application/json

{
  "token": "fcm-token-here"
}
```

---

#### 8. Update Profile Picture
```http
POST /api/profile-picture/:userId
Content-Type: multipart/form-data

FormData:
- profilePicture: <image-file>
```

---

## Accommodation Routes

### Base Path: `/api/accommodations`

#### 1. **Get Accommodation Dashboard** ⭐ (KEY ROUTE)
```http
GET /api/accommodations/:accommodationId/dashboard
```

**Parameters**:
- `accommodationId` (number): Accommodation ID from getAccommodationIdByUserId

**Response**:
```json
{
  "success": true,
  "data": {
    "accommodationId": 58,
    "name": "Al Syed Hostel",
    "location": "M555+4JG, Chatta Bakhtawar, Islamabad",
    "description": "Just 6 minutes away from COMSATS UNIVERSITY ISLAMABAD",
    "mediaUrls": [
      "https://tour-ease.s3.ap-south-1.amazonaws.com/uploads/h0k81gDXw2XytJZa1GzujOGK5gN2/1762198397379-accommodation-profile.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA2OAJT5IDLQAF74VX%2F20251104%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20251104T134545Z&X-Amz-Expires=3600&X-Amz-Signature=8ae1cefae5cefb42524f4241bc365c9cb581fb69ca3e53fb03cd9f67322d0543&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject"
    ],
    "provider": {
      "id": "h0k81gDXw2XytJZa1GzujOGK5gN2",
      "username": "Wajahat",
      "email": "wajahat@gmail.com",
      "phoneNumber": null,
      "profileImage": null,
      "accommodationName": "Al Syed Hostel",
      "address": "M555+4JG, Chatta Bakhtawar, Islamabad",
      "contactNumber": "03310207495"
    },
    "performance": {
      "occupancyRate": 0,
      "rating": 0,
      "revenue": 0,
      "guests": 0,
      "totalRooms": 2,
      "availableRooms": 2,
      "reviewCount": 0
    },
    "rooms": [
      {
        "id": 286,
        "type": "1 Seater",
        "price": 3,
        "capacity": 1,
        "images": [
          "https://tour-ease.s3.ap-south-1.amazonaws.com/uploads/h0k81gDXw2XytJZa1GzujOGK5gN2/1762198399945-room-1-1.jpg?..."
        ]
      },
      {
        "id": 287,
        "type": "2 Seater",
        "price": 6,
        "capacity": 2,
        "images": [
          "https://tour-ease.s3.ap-south-1.amazonaws.com/uploads/h0k81gDXw2XytJZa1GzujOGK5gN2/1762198402151-room-2-1.jpg?..."
        ]
      }
    ],
    "createdAt": "2025-11-03T19:33:25.385Z"
  }
}
```

**Example**:
```
GET http://192.168.18.31:3000/api/accommodations/58/dashboard
```

**Use Case**: Displays complete accommodation dashboard on Flutter HomeScreen with all images as S3 signed URLs

---

#### 2. Create Accommodation
```http
POST /api/accommodations
Content-Type: application/json
Authorization: Bearer <token>

{
  "providerId": "provider-id",
  "name": "Hostel Name",
  "location": "Location",
  "description": "Description",
  "mediaUrls": ["s3-key-1", "s3-key-2"]
}
```

---

#### 3. Get All Accommodations
```http
GET /api/accommodations
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 58,
      "name": "Al Syed Hostel",
      "location": "Islamabad",
      "description": "...",
      "providerId": "...",
      "mediaUrls": ["..."],
      "createdAt": "2025-11-03T19:33:25.385Z"
    }
  ]
}
```

---

#### 4. Get Accommodation by ID
```http
GET /api/accommodations/:id
```

---

#### 5. Search Accommodations by Location
```http
GET /api/accommodations/search?location=Islamabad
```

---

#### 6. Update Accommodation
```http
PUT /api/accommodations/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "location": "New Location",
  "description": "New Description"
}
```

---

#### 7. Delete Accommodation
```http
DELETE /api/accommodations/:id
Authorization: Bearer <token>
```

---

#### 8. Debug: Get Media URLs
```http
GET /api/accommodations/debug/:id/media-urls
```

**Response**: Shows raw S3 keys stored in database (for debugging)

---

## Room Routes

### Base Path: `/api/rooms`

#### 1. Create Room
```http
POST /api/rooms
Content-Type: application/json
Authorization: Bearer <token>

{
  "accommodationId": 58,
  "roomType": "1 Seater",
  "pricePerNight": 3000,
  "capacity": 1,
  "mediaUrls": ["s3-key-1"]
}
```

---

#### 2. Get All Rooms
```http
GET /api/rooms
```

---

#### 3. Get Room by ID
```http
GET /api/rooms/:id
```

---

#### 4. Get Rooms by Accommodation
```http
GET /api/rooms?accommodationId=58
```

---

#### 5. Update Room
```http
PUT /api/rooms/:id
Content-Type: application/json

{
  "roomType": "2 Seater",
  "pricePerNight": 5000,
  "capacity": 2
}
```

---

#### 6. Delete Room
```http
DELETE /api/rooms/:id
```

---

## Accommodation Booking Routes

### Base Path: `/api/accommodation-bookings`

#### 1. Create Booking
```http
POST /api/accommodation-bookings
Content-Type: application/json

{
  "roomId": 286,
  "travelerId": "user-id",
  "checkInDate": "2025-12-01",
  "checkOutDate": "2025-12-05",
  "totalPrice": 12000,
  "numberOfGuests": 1
}
```

---

#### 2. Get All Bookings
```http
GET /api/accommodation-bookings
```

---

#### 3. Get Booking by ID
```http
GET /api/accommodation-bookings/:id
```

---

#### 4. Get Bookings by Room
```http
GET /api/accommodation-bookings?roomId=286
```

---

#### 5. Update Booking
```http
PUT /api/accommodation-bookings/:id
Content-Type: application/json

{
  "status": "confirmed",
  "totalPrice": 15000
}
```

---

#### 6. Delete Booking
```http
DELETE /api/accommodation-bookings/:id
```

---

## Accommodation Provider Routes

### Base Path: `/api/accommodation-providers`

#### 1. Create Provider
```http
POST /api/accommodation-providers
Content-Type: application/json

{
  "providerId": "user-id",
  "accommodationName": "Hostel Name",
  "address": "Address",
  "contactNumber": "03310207495"
}
```

---

#### 2. Get Provider by ID
```http
GET /api/accommodation-providers/:providerId
```

---

#### 3. Update Provider
```http
PUT /api/accommodation-providers/:providerId
Content-Type: application/json

{
  "accommodationName": "New Name",
  "address": "New Address",
  "contactNumber": "03001234567"
}
```

---

#### 4. Delete Provider
```http
DELETE /api/accommodation-providers/:providerId
```

---

## Upload Routes

### Base Path: `/api`

#### 1. Upload File to S3
```http
POST /api/upload
Content-Type: multipart/form-data

FormData:
- file: <binary-file>
- type: "accommodation-profile" | "room" | "profile-picture"
```

**Response**:
```json
{
  "success": true,
  "s3Key": "uploads/userId/1762198397379-accommodation-profile.jpg",
  "signedUrl": "https://tour-ease.s3.ap-south-1.amazonaws.com/..."
}
```

---

## Question Routes

### Base Path: `/api`

#### 1. Get All Questions
```http
GET /api/questions?page=1&limit=10&sort=newest
```

**Sort Options**: `newest`, `oldest`, `popular`

---

#### 2. Get Question by ID
```http
GET /api/questions/:id
```

---

#### 3. Create Question
```http
POST /api/questions
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Question Title",
  "description": "Question Description",
  "tags": ["tag1", "tag2"],
  "userId": "user-id"
}
```

---

#### 4. Update Question
```http
PUT /api/questions/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated Description",
  "tags": ["newtag"]
}
```

---

#### 5. Delete Question
```http
DELETE /api/questions/:id
```

---

## Comment Routes

### Base Path: `/api`

#### 1. Get Comments for Question
```http
GET /api/comments?questionId=1
```

---

#### 2. Create Comment
```http
POST /api/comments
Content-Type: application/json

{
  "questionId": 1,
  "userId": "user-id",
  "text": "Comment text"
}
```

---

#### 3. Update Comment
```http
PUT /api/comments/:id
Content-Type: application/json

{
  "text": "Updated comment"
}
```

---

#### 4. Delete Comment
```http
DELETE /api/comments/:id
```

---

## Transportation Routes

### Base Path: `/api`

#### 1. Create Transportation Listing
```http
POST /api/transportation-provider
Content-Type: application/json

{
  "providerId": "user-id",
  "vehicle": "Car",
  "licensePlate": "ABC-123",
  "capacity": 4,
  "mediaUrls": ["s3-key"]
}
```

---

#### 2. Get Transportation Listings
```http
GET /api/transportation-provider
```

---

#### 3. Get Listing by ID
```http
GET /api/transportation-provider/:id
```

---

#### 4. Update Listing
```http
PUT /api/transportation-provider/:id
```

---

#### 5. Delete Listing
```http
DELETE /api/transportation-provider/:id
```

---

## Ride Sharing Routes

### Base Path: `/api`

#### 1. Create Ride Request
```http
POST /api/requests
Content-Type: application/json

{
  "userId": "user-id",
  "from": "Islamabad",
  "to": "Rawalpindi",
  "departureTime": "2025-12-01T10:00:00",
  "passengers": 2,
  "budget": 2000
}
```

---

#### 2. Get All Requests
```http
GET /api/requests
```

---

#### 3. Get Request by ID
```http
GET /api/requests/:id
```

---

#### 4. Find Nearby Requests
```http
GET /api/requests/nearby?latitude=33.6844&longitude=73.0479&radius=5
```

---

#### 5. Create Offer
```http
POST /api/offers
Content-Type: application/json

{
  "requestId": 1,
  "driverId": "user-id",
  "price": 2000,
  "vehicleId": 1,
  "departureTime": "2025-12-01T10:00:00"
}
```

---

#### 6. Get Offers for Request
```http
GET /api/offers?requestId=1
```

---

#### 7. Create Booking
```http
POST /api/ride-bookings
Content-Type: application/json

{
  "offerId": 1,
  "travelerId": "user-id",
  "seats": 2,
  "totalPrice": 4000
}
```

---

#### 8. Get Ride Listings
```http
GET /api/listings
```

---

#### 9. Create Listing
```http
POST /api/listings
Content-Type: application/json

{
  "driverId": "user-id",
  "from": "Islamabad",
  "to": "Rawalpindi",
  "departureTime": "2025-12-01T10:00:00",
  "availableSeats": 3,
  "pricePerSeat": 1000
}
```

---

## Report Routes

### Base Path: `/api/reports`

#### 1. Create Report
```http
POST /api/reports
Content-Type: application/json

{
  "reportedUserId": "user-id",
  "reporterUserId": "your-user-id",
  "reason": "Inappropriate behavior",
  "description": "Description of issue"
}
```

---

#### 2. Get All Reports
```http
GET /api/reports
```

---

#### 3. Get Report by ID
```http
GET /api/reports/:id
```

---

#### 4. Update Report Status
```http
PUT /api/reports/:id
Content-Type: application/json

{
  "status": "resolved"
}
```

---

## Review Routes

### Base Path: `/api/reviews`

#### 1. Create Review
```http
POST /api/reviews
Content-Type: application/json

{
  "reviewableId": 58,
  "reviewableType": "accommodation", // or "user"
  "reviewerId": "user-id",
  "rating": 4.5,
  "comment": "Great place!"
}
```

---

#### 2. Get Reviews
```http
GET /api/reviews?reviewableId=58&reviewableType=accommodation
```

---

#### 3. Get Review by ID
```http
GET /api/reviews/:id
```

---

#### 4. Update Review
```http
PUT /api/reviews/:id
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent!"
}
```

---

#### 5. Delete Review
```http
DELETE /api/reviews/:id
```

---

## Admin Routes

### Base Path: `/api/admin`

#### 1. Get Dashboard Analytics
```http
GET /api/admin/analytics
Authorization: Bearer <admin-token>
```

---

#### 2. Get User Statistics
```http
GET /api/admin/analytics/users
Authorization: Bearer <admin-token>
```

---

#### 3. Get Reports
```http
GET /api/admin/reports
Authorization: Bearer <admin-token>
```

---

#### 4. Manage Users
```http
PUT /api/admin/users/:id
Authorization: Bearer <admin-token>

{
  "status": "active" | "suspended"
}
```

---

## Planner Routes

### Base Path: `/api/planner`

#### 1. Create Trip Plan
```http
POST /api/planner/plans
Content-Type: application/json

{
  "userId": "user-id",
  "title": "Trip to Hunza",
  "description": "5 days trip",
  "startDate": "2025-12-01",
  "endDate": "2025-12-05",
  "destination": "Hunza, Gilgit-Baltistan"
}
```

---

#### 2. Get Trip Plans
```http
GET /api/planner/plans
```

---

#### 3. Get Plan Details
```http
GET /api/planner/plans/:planId
```

---

#### 4. Update Plan
```http
PUT /api/planner/plans/:planId
```

---

#### 5. Delete Plan
```http
DELETE /api/planner/plans/:planId
```

---

## Chat Routes

### Base Path: `/api` (WebSocket)

#### 1. Connect to Chat
```javascript
io.on('connection', (socket) => {
  socket.emit('user_connected', userId);
});
```

#### 2. Send Message
```javascript
socket.emit('send_message', {
  senderId: 'user-id',
  receiverId: 'recipient-id',
  message: 'Hello!'
});
```

#### 3. Receive Message
```javascript
socket.on('receive_message', (data) => {
  console.log(data.message);
});
```

#### 4. Typing Status
```javascript
socket.emit('typing', {
  senderId: 'user-id',
  receiverId: 'recipient-id',
  isTyping: true
});
```

#### 5. User Status
```javascript
socket.on('user_status_change', (data) => {
  console.log(data.userId, data.status); // online/offline
});
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400
}
```

### Common Status Codes:
- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Server Error

---

## Authentication

Most endpoints require Bearer token authentication:

```http
Authorization: Bearer <your-jwt-token>
```

Get token from login/signup endpoints and include in all protected routes.

---

## Rate Limiting

- No official rate limiting implemented yet
- Recommended: 100 requests/minute per user

---

## CORS

CORS is enabled for:
- Origin: `http://192.168.18.31:3000` (development)
- Methods: GET, POST, PUT, DELETE
- Credentials: true

---

## WebSocket Events (Chat)

- `connection` - User connects
- `user_connected` - User sends their ID
- `disconnect` - User disconnects
- `send_message` - Send chat message
- `receive_message` - Receive chat message
- `typing` - User is typing
- `user_typing` - Receive typing status
- `user_status_change` - User comes online/offline

---

## S3 Image Handling

All images are stored in AWS S3 at: `tour-ease.s3.ap-south-1.amazonaws.com`

**Image URL Format** (S3 signed URLs - valid for 1 hour):
```
https://tour-ease.s3.ap-south-1.amazonaws.com/uploads/{userId}/{timestamp}-{type}.{ext}?X-Amz-Algorithm=...
```

**Image Types**:
- `accommodation-profile` - Accommodation main image
- `room-{roomId}-{index}` - Room images
- `profile` - User profile picture

---

## Testing

### Using Postman:
1. Import the collection from `/REPORT_API_TESTS.postman_collection.json`
2. Set base URL to `http://192.168.18.31:3000`
3. Add Bearer token in Authorization tab
4. Test each endpoint

### Using cURL:
```bash
curl -X GET http://192.168.18.31:3000/api/accommodations/58/dashboard
```

---

## Flutter Implementation

### Key Routes for Flutter:

1. **Get Accommodation ID**:
```dart
GET http://192.168.18.31:3000/api/accommodation-id/{userId}
```

2. **Get Dashboard**:
```dart
GET http://192.168.18.31:3000/api/accommodations/{accommodationId}/dashboard
```

Both return S3 signed URLs directly usable with `Image.network()` in Flutter.

---

## Deployment

When deploying to production:
1. Update base URL to production server
2. Update CORS origin
3. Update S3 region if needed
4. Ensure all environment variables are set

---

**Last Updated**: November 4, 2025
**API Version**: 1.0
**Status**: Production Ready ✅
