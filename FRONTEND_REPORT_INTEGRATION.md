# Frontend Report Integration Guide

## Overview
This document provides everything your frontend developers need to implement the report functionality in the TourEase frontend application.

## API Base URL
```
Base URL: http://localhost:3000/api/reports
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## User Interface Components Needed

### 1. Report Creation Modal/Form
A modal or form component for users to create reports.

### 2. Report List (User View)
A component to display user's own reports with status indicators.

### 3. Admin Report Dashboard
A comprehensive admin interface for managing all reports.

### 4. Report Details View
A detailed view of individual reports for admins.

## API Endpoints Reference

### User Endpoints

#### Create a Report
```http
POST /api/reports
Content-Type: application/json
Authorization: Bearer <token>

{
  "reportableType": "USER",
  "reportReason": "Inappropriate behavior",
  "description": "This user sent me inappropriate messages and made me feel uncomfortable.",
  "reportedUserId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "id": 1,
    "reporterId": "reporter123",
    "reportableType": "USER",
    "reportReason": "Inappropriate behavior",
    "description": "This user sent me inappropriate messages...",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "User_Report_reportedUserIdToUser": {
      "id": "user123",
      "username": "reporteduser",
      "email": "reported@example.com"
    }
  }
}
```

#### Get User's Reports
```http
GET /api/reports/my-reports?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": 1,
        "reportableType": "USER",
        "reportReason": "Inappropriate behavior",
        "description": "This user sent me inappropriate messages...",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00Z",
        "User_Report_reportedUserIdToUser": {
          "id": "user123",
          "username": "reporteduser",
          "email": "reported@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Admin Endpoints

#### Get All Reports
```http
GET /api/reports?page=1&limit=10&status=pending&reportableType=USER
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": 1,
        "reporterId": "reporter123",
        "reportableType": "USER",
        "reportReason": "Inappropriate behavior",
        "description": "This user sent me inappropriate messages...",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "User_Report_reporterIdToUser": {
          "id": "reporter123",
          "username": "reporter",
          "email": "reporter@example.com"
        },
        "User_Report_reportedUserIdToUser": {
          "id": "user123",
          "username": "reporteduser",
          "email": "reported@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### Update Report Status
```http
PATCH /api/reports/1/status
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "status": "resolved",
  "resolutionNotes": "User has been warned and content has been removed."
}
```

#### Get Report Statistics
```http
GET /api/reports/statistics
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReports": 25,
    "pendingReports": 10,
    "resolvedReports": 12,
    "dismissedReports": 3,
    "reportsByType": [
      { "type": "USER", "count": 8 },
      { "type": "TRANSPORTATION_LISTING", "count": 5 },
      { "type": "QUESTION", "count": 7 },
      { "type": "COMMENT", "count": 5 }
    ],
    "reportsByStatus": [
      { "status": "pending", "count": 10 },
      { "status": "resolved", "count": 12 },
      { "status": "dismissed", "count": 3 }
    ]
  }
}
```

## Report Types and Their UI Requirements

### 1. USER Reports
- **Trigger**: Report button on user profiles, user cards, or user lists
- **Required Data**: `reportedUserId`
- **UI Elements**: User selection, reason dropdown, description textarea

### 2. TRANSPORTATION_LISTING Reports
- **Trigger**: Report button on transportation listing cards
- **Required Data**: `transportationListingId`
- **UI Elements**: Listing preview, reason dropdown, description textarea

### 3. ACCOMMODATION Reports
- **Trigger**: Report button on accommodation cards
- **Required Data**: `accommodationId`
- **UI Elements**: Accommodation preview, reason dropdown, description textarea

### 4. ROOM Reports
- **Trigger**: Report button on room cards
- **Required Data**: `roomId`
- **UI Elements**: Room preview, reason dropdown, description textarea

### 5. QUESTION Reports
- **Trigger**: Report button on question cards or question detail pages
- **Required Data**: `questionId`
- **UI Elements**: Question preview, reason dropdown, description textarea

### 6. COMMENT Reports
- **Trigger**: Report button on comment components
- **Required Data**: `commentId`
- **UI Elements**: Comment preview, reason dropdown, description textarea

### 7. MESSAGE Reports
- **Trigger**: Report button in chat/messaging interface
- **Required Data**: `messageId`
- **UI Elements**: Message preview, reason dropdown, description textarea

### 8. OFFER Reports
- **Trigger**: Report button on offer cards
- **Required Data**: `offerId`
- **UI Elements**: Offer preview, reason dropdown, description textarea

### 9. TRANSPORTATION_BOOKING Reports
- **Trigger**: Report button on booking details
- **Required Data**: `transportationBookingId`
- **UI Elements**: Booking preview, reason dropdown, description textarea

### 10. ACCOMMODATION_BOOKING Reports
- **Trigger**: Report button on booking details
- **Required Data**: `accommodationBookingId`
- **UI Elements**: Booking preview, reason dropdown, description textarea

## Report Reasons (Dropdown Options)

```javascript
const reportReasons = [
  "Inappropriate behavior",
  "Spam",
  "Fake listing",
  "Inappropriate content",
  "Harassment",
  "Scam",
  "Off-topic",
  "Duplicate content",
  "Violation of terms",
  "Other"
];
```

## Status Indicators

### Status Colors and Icons
```javascript
const statusConfig = {
  pending: {
    color: "#f59e0b", // amber
    icon: "⏳",
    label: "Pending Review"
  },
  investigating: {
    color: "#3b82f6", // blue
    icon: "🔍",
    label: "Under Investigation"
  },
  resolved: {
    color: "#10b981", // green
    icon: "✅",
    label: "Resolved"
  },
  dismissed: {
    color: "#6b7280", // gray
    icon: "❌",
    label: "Dismissed"
  }
};
```

## Frontend Component Structure

### 1. ReportButton Component
```jsx
// Usage: <ReportButton reportableType="USER" reportableId="user123" />
const ReportButton = ({ reportableType, reportableId, className }) => {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowModal(true)} className={className}>
        🚩 Report
      </button>
      {showModal && (
        <ReportModal
          reportableType={reportableType}
          reportableId={reportableId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};
```

### 2. ReportModal Component
```jsx
const ReportModal = ({ reportableType, reportableId, onClose }) => {
  const [formData, setFormData] = useState({
    reportReason: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // API call to create report
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reportableType,
        [getReportableIdField(reportableType)]: reportableId,
        ...formData
      })
    });
    // Handle response
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <select 
          value={formData.reportReason}
          onChange={(e) => setFormData({...formData, reportReason: e.target.value})}
          required
        >
          <option value="">Select a reason</option>
          {reportReasons.map(reason => (
            <option key={reason} value={reason}>{reason}</option>
          ))}
        </select>
        
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Please provide details about the issue..."
          required
          minLength={10}
          maxLength={1000}
        />
        
        <button type="submit">Submit Report</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};
```

### 3. UserReportsList Component
```jsx
const UserReportsList = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUserReports();
  }, [currentPage]);

  const fetchUserReports = async () => {
    const response = await fetch(`/api/reports/my-reports?page=${currentPage}&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setReports(data.data.reports);
    setPagination(data.data.pagination);
  };

  return (
    <div className="user-reports">
      <h2>My Reports</h2>
      {reports.map(report => (
        <ReportCard key={report.id} report={report} />
      ))}
      <Pagination 
        currentPage={currentPage}
        totalPages={pagination.totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
```

### 4. AdminReportDashboard Component
```jsx
const AdminReportDashboard = () => {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    reportableType: '',
    page: 1
  });
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, [filters]);

  const fetchReports = async () => {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/api/reports?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await response.json();
    setReports(data.data.reports);
  };

  const updateReportStatus = async (reportId, status, notes) => {
    const response = await fetch(`/api/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status, resolutionNotes: notes })
    });
    // Handle response and refresh data
  };

  return (
    <div className="admin-dashboard">
      <ReportStatistics stats={statistics} />
      <ReportFilters filters={filters} onFilterChange={setFilters} />
      <ReportTable 
        reports={reports} 
        onStatusUpdate={updateReportStatus}
      />
    </div>
  );
};
```

## Error Handling

### Common Error Responses
```javascript
// Validation Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "description",
      "message": "Description must be between 10 and 1000 characters"
    }
  ]
}

// Authentication Error
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}

// Duplicate Report Error
{
  "success": false,
  "message": "You have already reported this item"
}
```

### Error Handling in Components
```javascript
const handleApiError = (error, response) => {
  if (response.status === 401) {
    // Redirect to login
    router.push('/login');
  } else if (response.status === 403) {
    // Show access denied message
    showNotification('Access denied', 'error');
  } else if (response.status === 400) {
    // Show validation errors
    const data = await response.json();
    data.errors.forEach(error => {
      showFieldError(error.field, error.message);
    });
  } else {
    // Show generic error
    showNotification('An error occurred', 'error');
  }
};
```

## Testing Endpoints (Development Only)

### Create Sample Data
```http
POST /api/test/reports/create-sample-data
```

### Create Sample Reports
```http
POST /api/test/reports/create-sample-reports
```

### Get Test Statistics
```http
GET /api/test/reports/statistics
```

### Cleanup Test Data
```http
DELETE /api/test/reports/cleanup
```

## Implementation Checklist

### Phase 1: Basic Report Creation
- [ ] Create ReportButton component
- [ ] Create ReportModal component
- [ ] Add report buttons to user profiles
- [ ] Add report buttons to content cards (listings, questions, etc.)
- [ ] Implement form validation
- [ ] Add success/error notifications

### Phase 2: User Report Management
- [ ] Create UserReportsList component
- [ ] Add "My Reports" page/section
- [ ] Implement pagination
- [ ] Add status indicators
- [ ] Add report details view

### Phase 3: Admin Dashboard
- [ ] Create AdminReportDashboard component
- [ ] Add report statistics widgets
- [ ] Create report table with filtering
- [ ] Add status update functionality
- [ ] Implement bulk actions
- [ ] Add report details modal

### Phase 4: Advanced Features
- [ ] Add real-time notifications for new reports
- [ ] Implement report analytics charts
- [ ] Add export functionality
- [ ] Add report templates
- [ ] Implement automated responses

## Security Considerations

1. **Authentication**: All API calls must include valid JWT tokens
2. **Authorization**: Admin-only endpoints must check user roles
3. **Input Validation**: Validate all form inputs on both client and server
4. **Rate Limiting**: Implement rate limiting for report creation
5. **Content Sanitization**: Sanitize user input to prevent XSS attacks

## Performance Considerations

1. **Pagination**: Use pagination for large report lists
2. **Lazy Loading**: Load report details only when needed
3. **Caching**: Cache report statistics and user data
4. **Debouncing**: Debounce search and filter inputs
5. **Optimistic Updates**: Update UI immediately, sync with server

This comprehensive guide should provide your frontend developers with everything they need to implement the report functionality successfully!





