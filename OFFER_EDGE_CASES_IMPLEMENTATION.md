# Offer Acceptance Edge Cases Implementation

## Overview
This document outlines the comprehensive edge case handling implemented in the `acceptOffer` method in `offerModel.ts`.

## Edge Cases Addressed

### 1. **For Listings: Multiple Bookings for Drivers, Single for Travelers**
**Requirement**: 
- **Drivers**: Can accept multiple offers for their listing until seats run out
- **Travelers**: Can only have one active booking at a time to prevent double-booking

**Implementation**:
- Multiple travelers can have offers accepted for the same listing as long as seats are available
- Seat availability is validated before each acceptance
- **Driver advantage**: Drivers can manage multiple bookings for their own listings
- **Traveler protection**: Travelers are prevented from having overlapping bookings
- Other pending offers remain valid until seats run out

**Code Location**: Lines ~320-340 in `acceptOffer` method

```typescript
if (offer.transportationListingId) {
  // Don't cancel other offers, just validate availability
  // Other offers can still be accepted if seats remain available
}
```

### 2. **For Requests: Competitive Offer Acceptance**
**Requirement**: When accepting offers for requests, cancel all competing offers.

**Implementation**:
- Only one offer can be accepted per request
- All other pending offers for the same request are automatically rejected
- Driver conflict checking is performed

**Code Location**: Lines ~345-375 in `acceptOffer` method

```typescript
} else if (offer.transportationRequestId) {
  // Cancel all other offers for the same request
  await tx.offer.updateMany({
    where: {
      transportationRequestId: offer.transportationRequestId,
      id: { not: offerId },
      status: { in: ["pending", "countered"] }  
    },
    data: { status: "rejected" }
  });
}
```

### 3. **Seat Availability Validation (Prevent Overselling)**
**Scenario**: 
- Listing has 3 seats
- User A offers for 2 seats
- User B books 2 seats (1 seat remaining)
- Driver tries to accept User A's offer for 2 seats

**Implementation**:
- Real-time seat availability check before acceptance
- Transaction-level validation prevents race conditions
- Clear error messages for insufficient seats

**Code Location**: Lines ~295-310 in `acceptOffer` method

```typescript
if (currentListing.seatsAvailable < offer.seatsRequested) {
  throw new Error(`Not enough seats available. Available: ${currentListing.seatsAvailable}, Requested: ${offer.seatsRequested}`);
}
```

### 4. **Traveler Conflict Resolution**
**Scenario**: Traveler's offer for a listing gets accepted while they have active requests.

**Implementation**:
- When traveler's offer for listing is accepted, their active future requests are marked as 'fulfilled'
- Prevents double booking scenarios
- Only affects future requests (past requests remain unchanged)

**Code Location**: Lines ~325-340 in `acceptOffer` method

```typescript
// Cancel traveler's active requests when their offer for listing is accepted
await tx.transportationRequest.updateMany({
  where: {
    travelerId: offer.senderId,
    status: 'active',
    departureTime: { gte: new Date() },
  },
  data: { status: 'fulfilled' }
});
```

### 5. **Driver Conflict Resolution**
**Scenario**: Driver's offer to fulfill a request is accepted while they have conflicting listings.

**Implementation**:
- Checks for driver's active listings within 4-hour time window
- Automatically cancels conflicting listings with status 'cancelled_due_to_conflict'
- Considers route and time overlaps

**Code Location**: Lines ~350-380 in `acceptOffer` method

```typescript
// Auto-cancel conflicting listings
await tx.transportationListing.updateMany({
  where: {
    id: { in: conflictingListings.map(l => l.id) }
  },
  data: {
    status: 'cancelled_due_to_conflict'
  }
});
```

### 6. **Traveler vs Driver Booking Rules**
**Key Distinction**: The system enforces different rules for drivers and travelers:

**Drivers (Listing Owners)**:
- ✅ Can accept multiple offers for their listings until seats are exhausted
- ✅ Can manage their own capacity and availability
- ✅ Multiple travelers can book the same listing simultaneously
- ⚠️ System warns about potential conflicts but allows drivers to decide

**Travelers (Offer Makers)**:
- ❌ Can only have ONE active booking at a time
- ❌ Cannot make overlapping bookings within 2-hour window
- ✅ System prevents double-booking automatically
- ✅ Active requests are cancelled when listing offer is accepted

**Implementation**:
```typescript
// For travelers - strict validation
if (existingBookings.length > 0) {
  throw new Error(`Traveler cannot have multiple active bookings. Found ${existingBookings.length} conflicting booking(s) at similar times.`);
}

// For drivers - no restrictions on their own listings
if (isDriver) {
  return []; // Drivers can manage their own capacity
}
```

### 7. **Booking Conflict Validation**
**Enhancement**: Additional validation to prevent users from having overlapping bookings.

**Implementation**:
- Helper method `validateUserBookingConflicts` checks for existing bookings
- 2-hour buffer window for booking conflicts
- Warns about potential conflicts (can be configured to throw errors)

**Code Location**: Lines ~425-470 (helper methods)

## Helper Methods Added

### 1. `validateUserBookingConflicts()`
- Checks for existing bookings that might conflict with new bookings
- Configurable time buffer (default: 2 hours)
- Returns array of conflicting bookings

### 2. `checkTimeRouteConflicts()`
- Comprehensive conflict checking for time and route overlaps
- 4-hour time buffer for conflict detection
- Location text matching for route conflicts

## Status Management

### New Statuses Added:
- `fulfilled` - For requests that are satisfied through offers
- `cancelled_due_to_conflict` - For listings cancelled due to conflicts
- `booked` - For listings with no available seats

### Validation Enhancements:
- Offer status validation (only 'pending' offers can be accepted)
- Listing status validation (only 'active' listings)
- Real-time seat availability checking

## Return Value Enhancement

The `acceptOffer` method now returns comprehensive conflict resolution information:

```typescript
return {
  offer: updatedOffer,
  booking,
  conflictResolution: {
    cancelledRequests: number,
    cancelledListings: number,
    rejectedOffers: number
  }
}
```

## Configuration Options

### Time Buffers:
- **Listing conflicts**: 4 hours
- **Booking conflicts**: 2 hours
- **Route conflicts**: Configurable via location text matching

### Conflict Actions:
- **Automatic cancellation**: Currently enabled for conflicting listings
- **Warning mode**: Available for booking conflicts
- **Status updates**: Comprehensive status tracking

## Testing Scenarios

### Test Case 1: Multiple Offers on Listing (Driver accepts multiple)
1. Driver creates listing with 4 seats
2. Traveler A offers for 1 seat → Driver accepts → ✅ Success (3 seats left)
3. Traveler B offers for 2 seats → Driver accepts → ✅ Success (1 seat left)  
4. Traveler C offers for 2 seats → Driver tries to accept → ❌ Should fail (insufficient seats)
5. Traveler D offers for 1 seat → Driver accepts → ✅ Success (0 seats left, listing marked as 'booked')

### Test Case 2: Traveler Double-Booking Prevention
1. Traveler A books a ride for 2 PM
2. Traveler A tries to make another offer for 1:30 PM ride → ❌ Should fail (conflict detected)
3. Traveler A tries to make offer for 5 PM ride → ✅ Success (outside 2-hour buffer)

### Test Case 3: Request Offer Competition
1. Traveler creates request for ride
2. Driver A makes offer → Pending
3. Driver B makes offer → Pending  
4. Traveler accepts Driver A's offer → Driver B's offer auto-rejected

### Test Case 4: Traveler Conflict Resolution
1. Traveler creates active request for 2 PM
2. Traveler makes offer on listing for 1:45 PM
3. Listing owner accepts offer → Original request marked as 'fulfilled'

### Test Case 5: Driver Conflict Resolution  
1. Driver creates listing for 2 PM
2. Driver makes offer on request for 1:30 PM
3. Request owner accepts offer → Original listing cancelled due to conflict

## Error Handling

### Validation Errors:
- "Offer not found"
- "Cannot accept offer with status: {status}"
- "Listing not found"
- "Not enough seats available"
- "Cannot accept offer for listing with status: {status}"

### Conflict Warnings:
- Console logging for conflicting bookings
- Detailed conflict resolution reporting
- Optional error throwing for strict validation

## Future Enhancements

### Potential Improvements:
1. **Smart conflict detection**: More sophisticated route matching
2. **User notifications**: Automated notifications for conflicts
3. **Flexible time buffers**: User-configurable conflict windows
4. **Partial acceptance**: Allow partial seat acceptance for large offers
5. **Priority system**: VIP users or premium offers get priority

### Configuration Recommendations:
1. Add environment variables for time buffers
2. Implement user preferences for conflict handling
3. Add admin controls for automatic vs. manual conflict resolution

## Migration Notes

### Database Changes Needed:
- New status values in relevant enums
- Consider adding conflict resolution logs table
- Index optimization for conflict queries

### Backward Compatibility:
- Existing functionality preserved
- New features are additive
- No breaking changes to API responses

## Performance Considerations

### Optimizations:
- Transaction-based operations prevent race conditions
- Efficient database queries with proper indexing
- Minimal additional database calls

### Monitoring:
- Log conflict resolution statistics
- Track performance of conflict detection queries
- Monitor transaction completion times

---

**Last Updated**: October 4, 2025  
**Version**: 1.0  
**Author**: AI Assistant