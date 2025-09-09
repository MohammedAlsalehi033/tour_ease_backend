# Report Functionality Documentation

## Overview
The report functionality allows users to report inappropriate content, users, or activities within the TourEase platform. This system provides comprehensive reporting capabilities with admin management features.

## Features

### User Features
- Create reports for various content types
- View their own reports
- Report different types of content (users, listings, questions, comments, etc.)

### Admin Features
- View all reports with filtering and pagination
- Update report status (pending, investigating, resolved, dismissed)
- Add resolution notes
- View report statistics
- Delete reports
- Filter reports by type, status, and user

## API Endpoints

### User Endpoints

#### Create a Report
```
POST /api/reports
```
**Authentication:** Required
**Body:**
```json
{
  "reportableType": "USER|TRANSPORTATION_LISTING|ACCOMMODATION|ROOM|QUESTION|COMMENT|MESSAGE|OFFER|TRANSPORTATION_BOOKING|ACCOMMODATION_BOOKING",
  "reportReason": "string (1-100 characters)",
  "description": "string (10-1000 characters)",
  "reportedUserId": "string (optional)",
  "transportationListingId": "number (optional)",
  "accommodationId": "number (optional)",
  "roomId": "number (optional)",
  "questionId": "number (optional)",
  "commentId": "number (optional)",
  "messageId": "number (optional)",
  "offerId": "number (optional)",
  "transportationBookingId": "number (optional)",
  "accommodationBookingId": "number (optional)"
}
```

#### Get User's Reports
```
GET /api/reports/my-reports?page=1&limit=10
```
**Authentication:** Required
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

### Admin Endpoints

#### Get All Reports
```
GET /api/reports?page=1&limit=10&status=pending&reportableType=USER&reporterId=user123
```
**Authentication:** Required (Admin only)
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `status`: Filter by status (pending, investigating, resolved, dismissed)
- `reportableType`: Filter by reportable type
- `reporterId`: Filter by reporter ID

#### Get Report by ID
```
GET /api/reports/:id
```
**Authentication:** Required (Admin only)

#### Update Report Status
```
PATCH /api/reports/:id/status
```
**Authentication:** Required (Admin only)
**Body:**
```json
{
  "status": "pending|investigating|resolved|dismissed",
  "resolutionNotes": "string (optional, max 500 characters)"
}
```

#### Delete Report
```
DELETE /api/reports/:id
```
**Authentication:** Required (Admin only)

#### Get Reports by Type
```
GET /api/reports/type/:type?page=1&limit=10&status=pending
```
**Authentication:** Required (Admin only)
**Path Parameters:**
- `type`: Reportable type (USER, TRANSPORTATION_LISTING, etc.)

#### Get Reports by User
```
GET /api/reports/user/:userId?page=1&limit=10
```
**Authentication:** Required (Admin only)
**Path Parameters:**
- `userId`: User ID to get reports for

#### Get Report Statistics
```
GET /api/reports/statistics
```
**Authentication:** Required (Admin only)

## Report Types

### USER
Report a user for inappropriate behavior, spam, or other violations.

### TRANSPORTATION_LISTING
Report a transportation listing for being fake, misleading, or inappropriate.

### ACCOMMODATION
Report an accommodation listing for being fake, misleading, or inappropriate.

### ROOM
Report a room listing for being fake, misleading, or inappropriate.

### QUESTION
Report a question for being spam, inappropriate, or off-topic.

### COMMENT
Report a comment for being inappropriate, spam, or offensive.

### MESSAGE
Report a message for being inappropriate, spam, or harassment.

### OFFER
Report an offer for being fake, misleading, or inappropriate.

### TRANSPORTATION_BOOKING
Report a transportation booking for issues or disputes.

### ACCOMMODATION_BOOKING
Report an accommodation booking for issues or disputes.

## Report Statuses

- **pending**: Report has been submitted and is awaiting review
- **investigating**: Report is being investigated by an admin
- **resolved**: Report has been resolved with appropriate action taken
- **dismissed**: Report has been dismissed as invalid or not requiring action

## Validation Rules

### Report Creation
- `reportableType` is required and must be one of the valid types
- `reportReason` is required and must be 1-100 characters
- `description` is required and must be 10-1000 characters
- At least one reportable ID must be provided
- Duplicate reports for the same item are not allowed

### Status Updates
- `status` must be one of: pending, investigating, resolved, dismissed
- `resolutionNotes` is optional and must be less than 500 characters

## Testing

### Test Endpoints

#### Create Sample Data
```
POST /api/test/reports/create-sample-data
```
Creates sample users, admin, transportation listings, questions, and comments for testing.

#### Create Sample Reports
```
POST /api/test/reports/create-sample-reports
```
Creates sample reports for testing the functionality.

#### Get Statistics
```
GET /api/test/reports/statistics
```
Gets report statistics for testing.

#### Cleanup
```
DELETE /api/test/reports/cleanup
```
Cleans up all sample data created for testing.

## Database Schema

The report functionality uses the existing `Report` model in the Prisma schema with the following key fields:

- `id`: Primary key
- `reporterId`: ID of the user who created the report
- `reportableType`: Type of content being reported
- `reportReason`: Reason for the report
- `description`: Detailed description of the issue
- `status`: Current status of the report
- `createdAt`: When the report was created
- `updatedAt`: When the report was last updated
- `resolvedAt`: When the report was resolved (if applicable)
- `resolvedBy`: ID of the admin who resolved the report
- `resolutionNotes`: Notes from the admin about the resolution

## Security Features

- Authentication required for all endpoints
- Admin-only access for management functions
- Input validation and sanitization
- Duplicate report prevention
- Comprehensive error handling

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // For validation errors
}
```

## Usage Examples

### Creating a Report
```javascript
const response = await fetch('/api/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    reportableType: 'USER',
    reportReason: 'Inappropriate behavior',
    description: 'This user sent me inappropriate messages and made me feel uncomfortable.',
    reportedUserId: 'user123'
  })
});
```

### Getting Reports (Admin)
```javascript
const response = await fetch('/api/reports?status=pending&page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer admin-jwt-token'
  }
});
```

### Updating Report Status (Admin)
```javascript
const response = await fetch('/api/reports/123/status', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer admin-jwt-token'
  },
  body: JSON.stringify({
    status: 'resolved',
    resolutionNotes: 'User has been warned and content has been removed.'
  })
});
```

## Future Enhancements

- Email notifications for report status changes
- Report categories and subcategories
- Bulk actions for admins
- Report analytics and insights
- Integration with moderation tools
- Automated content flagging
