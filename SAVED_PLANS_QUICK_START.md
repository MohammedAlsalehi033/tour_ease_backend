# Saved Plans Feature - Quick Start Guide

## Overview
Users can now save trip plans for later review, modification, and booking. This allows users to compare options over time, make adjustments, and book when ready.

---

## User Stories

### Story 1: Save Plan for Later Decision
```
As a user planning a vacation,
I want to save multiple trip plan options,
So that I can compare them and decide later which one to book.
```

### Story 2: Modify Before Booking
```
As a user who saved a plan last week,
I want to change the hotel selection to a cheaper option,
So that I can stay within my updated budget.
```

### Story 3: Organize Plans with Tags
```
As a frequent traveler,
I want to tag my saved plans (e.g., "family", "business", "beach"),
So that I can easily find and manage them later.
```

---

## API Quick Reference

### 1. Save a New Plan
```http
POST /api/planner/saved
Authorization: Bearer {token}
Content-Type: application/json

{
  "planName": "Weekend Beach Getaway",
  "description": "Family trip to Alexandria",
  "selectedOutboundId": 123,
  "selectedReturnId": 456,
  "selectedAccommodationId": 789,
  "selectedRoomAllocations": [
    { "roomId": 101, "quantity": 2 }
  ],
  "selectedActivities": [10, 20, 30],
  "totalCost": 3500,
  "tags": ["family", "beach", "summer"],
  "originalSearchParams": {
    "origin": "Cairo",
    "destination": "Alexandria",
    "startDate": "2025-06-01",
    "endDate": "2025-06-05",
    "travelers": 4,
    "budget": 5000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "planName": "Weekend Beach Getaway",
    "status": "draft",
    "createdAt": "2025-01-20T10:00:00Z"
  }
}
```

---

### 2. List All Saved Plans
```http
GET /api/planner/saved?status=draft&tag=beach&sortBy=createdAt&sortOrder=desc
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional) - Filter by: `draft`, `booked`, `expired`
- `tag` (optional) - Filter by tag name
- `sortBy` (optional) - Sort by: `createdAt`, `updatedAt`, `totalCost`, `planName`
- `sortOrder` (optional) - `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "savedPlans": [
      {
        "id": 42,
        "planName": "Weekend Beach Getaway",
        "description": "Family trip to Alexandria",
        "status": "draft",
        "totalCost": 3500,
        "tags": ["family", "beach", "summer"],
        "createdAt": "2025-01-20T10:00:00Z",
        "updatedAt": "2025-01-20T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

### 3. Get Plan Details
```http
GET /api/planner/saved/42
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "planName": "Weekend Beach Getaway",
    "description": "Family trip to Alexandria",
    "status": "draft",
    "totalCost": 3500,
    "tags": ["family", "beach", "summer"],
    "outboundTransportation": {
      "id": 123,
      "vehicleType": "SUV",
      "providerName": "Ahmed Transport",
      "totalCost": 450
    },
    "returnTransportation": {
      "id": 456,
      "vehicleType": "Sedan",
      "providerName": "Mohamed Rides",
      "totalCost": 420
    },
    "accommodation": {
      "id": 789,
      "name": "Seaside Resort",
      "rating": 4.7,
      "totalCost": 2400
    },
    "roomAllocations": [
      {
        "room": {
          "id": 101,
          "type": "Family Room",
          "capacity": 4,
          "pricePerNight": 600
        },
        "quantity": 2
      }
    ],
    "activities": [
      { "id": 10, "title": "Beach Day", "description": "..." },
      { "id": 20, "title": "Museum Tour", "description": "..." }
    ],
    "originalSearchParams": { /* search parameters */ },
    "createdAt": "2025-01-20T10:00:00Z",
    "updatedAt": "2025-01-20T10:00:00Z"
  }
}
```

---

### 4. Update Saved Plan
```http
PUT /api/planner/saved/42
Authorization: Bearer {token}
Content-Type: application/json

{
  "planName": "Updated Summer Vacation",
  "selectedAccommodationId": 999,
  "totalCost": 3200,
  "tags": ["family", "beach", "summer", "budget-friendly"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "planName": "Updated Summer Vacation",
    "totalCost": 3200,
    "updatedAt": "2025-01-21T14:30:00Z"
  }
}
```

---

### 5. Book Saved Plan
```http
POST /api/planner/saved/42/book
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingConfirmation": {
      "transportationBookings": {
        "outbound": {
          "id": 501,
          "status": "pending",
          "totalPrice": 450,
          "offerId": 301
        },
        "return": {
          "id": 502,
          "status": "pending",
          "totalPrice": 420,
          "offerId": 302
        }
      },
      "accommodationBookings": [
        {
          "id": 601,
          "roomId": 101,
          "status": "confirmed",
          "totalPrice": 1200
        }
      ]
    },
    "savedPlan": {
      "id": 42,
      "status": "booked",
      "bookedAt": "2025-01-22T09:00:00Z"
    }
  }
}
```

---

### 6. Delete Saved Plan
```http
DELETE /api/planner/saved/42
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

---

## Frontend Implementation Examples

### Save Button Handler
```javascript
const handleSavePlan = async () => {
  const planData = {
    planName: planNameInput.value,
    description: descriptionInput.value,
    selectedOutboundId: selectedOutbound.id,
    selectedReturnId: selectedReturn?.id,
    selectedAccommodationId: selectedAccommodation.id,
    selectedRoomAllocations: selectedRooms,
    selectedActivities: selectedActivities.map(a => a.id),
    totalCost: calculateTotal(),
    tags: tagsInput.value.split(',').map(t => t.trim()),
    originalSearchParams: searchParams
  };

  try {
    const response = await fetch('/api/planner/saved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(planData)
    });

    const result = await response.json();
    
    if (result.success) {
      showNotification('Plan saved successfully!');
      navigateTo('/my-plans');
    }
  } catch (error) {
    showError('Failed to save plan');
  }
};
```

### Load Saved Plans List
```javascript
const loadSavedPlans = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.tag) params.append('tag', filters.tag);
  params.append('sortBy', filters.sortBy || 'createdAt');
  params.append('sortOrder', filters.sortOrder || 'desc');

  try {
    const response = await fetch(`/api/planner/saved?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      displayPlans(result.data.savedPlans);
    }
  } catch (error) {
    showError('Failed to load plans');
  }
};
```

### Update Plan Handler
```javascript
const handleUpdatePlan = async (planId, updates) => {
  try {
    const response = await fetch(`/api/planner/saved/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    const result = await response.json();
    
    if (result.success) {
      showNotification('Plan updated successfully!');
      refreshPlanDetails(planId);
    }
  } catch (error) {
    showError('Failed to update plan');
  }
};
```

### Book Saved Plan Handler
```javascript
const handleBookSavedPlan = async (planId) => {
  if (!confirm('Are you sure you want to book this plan?')) {
    return;
  }

  try {
    const response = await fetch(`/api/planner/saved/${planId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const booking = result.data.bookingConfirmation;
      showBookingConfirmation(booking);
      navigateTo('/my-bookings');
    }
  } catch (error) {
    showError('Failed to book plan');
  }
};
```

---

## Status Values

### Plan Statuses
- **`draft`** - Plan is saved but not yet booked
- **`booked`** - Plan has been converted to actual bookings
- **`expired`** - Transportation/accommodation dates have passed

### Transportation Booking Statuses
- **`pending`** - Offer sent to driver, awaiting approval
- **`confirmed`** - Driver accepted the offer
- **`rejected`** - Driver rejected the offer

### Accommodation Booking Statuses
- **`confirmed`** - Room booking confirmed immediately

---

## Common Use Cases

### Use Case 1: Save Multiple Options
```javascript
// User searches for trip
const results = await searchTrip(params);

// User saves optimal plan
await savePlan({
  planName: "Option 1 - Luxury",
  ...results.optimalPlan
});

// User customizes and saves alternative
await savePlan({
  planName: "Option 2 - Budget",
  ...customSelections
});

// User compares later and books preferred one
```

### Use Case 2: Save and Modify
```javascript
// User saves initial plan
const saved = await savePlan({
  planName: "Summer Vacation",
  ...selections
});

// One week later, user finds cheaper hotel
await updatePlan(saved.data.id, {
  selectedAccommodationId: cheaperHotelId,
  totalCost: newTotalCost
});

// User books the updated plan
await bookSavedPlan(saved.data.id);
```

### Use Case 3: Tag-Based Organization
```javascript
// User saves multiple plans with tags
await savePlan({
  planName: "Family Beach Trip",
  tags: ["family", "beach", "summer"]
});

await savePlan({
  planName: "Business Conference",
  tags: ["business", "conference", "cairo"]
});

// Later, filter by tag
const beachTrips = await loadPlans({ tag: "beach" });
const businessTrips = await loadPlans({ tag: "business" });
```

---

## Error Handling

### Common Errors

**Plan Not Found:**
```json
{
  "success": false,
  "message": "Saved plan not found"
}
```

**Unauthorized Access:**
```json
{
  "success": false,
  "message": "You don't have permission to access this plan"
}
```

**Invalid Selection:**
```json
{
  "success": false,
  "message": "Selected transportation listing not found"
}
```

**Already Booked:**
```json
{
  "success": false,
  "message": "This plan has already been booked"
}
```

---

## Tips & Best Practices

### For Users
1. **Use Descriptive Names** - "Summer 2025 Family Beach Trip" instead of "Trip 1"
2. **Add Tags** - Makes finding plans easier later
3. **Review Before Booking** - Prices may change over time
4. **Set Reminders** - Don't let plans expire

### For Developers
1. **Validate Selections** - Ensure transport/accommodation still available
2. **Handle Expired Plans** - Show clear status indicators
3. **Real-time Updates** - Refresh prices if they've changed
4. **Confirmation Dialogs** - Before booking or deleting

---

## Testing Checklist

- [ ] Save plan with all required fields
- [ ] Save plan with optional fields (description, tags)
- [ ] List plans with no filters
- [ ] Filter plans by status (draft/booked)
- [ ] Filter plans by tag
- [ ] Sort plans by date/cost/name
- [ ] View plan details with all related data
- [ ] Update plan name and description
- [ ] Update plan selections (transport/accommodation)
- [ ] Book saved plan successfully
- [ ] Handle booking errors gracefully
- [ ] Delete plan and verify cascade deletion
- [ ] Verify user can only access their own plans
- [ ] Handle expired plan display

---

## Summary

The saved plans feature allows users to:
- ✅ Save trip plans for later decision
- ✅ Organize plans with tags
- ✅ Modify selections before booking
- ✅ Compare multiple options side-by-side
- ✅ Book when ready with one click

**Status:** Ready for production
**Documentation:** TRIP_PLANNER_COMPLETE_GUIDE.md
**Deployment:** DEPLOYMENT_INSTRUCTIONS.md
