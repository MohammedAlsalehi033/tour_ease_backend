# Find Nearby Requests API Documentation

## Endpoint
`GET /api/requests/nearby` (or your configured route)

## Overview
This API endpoint allows drivers/providers to search for transportation requests near their location with advanced filtering capabilities. The API is **backward compatible** - old clients will continue to work with just the basic parameters.

## Request Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `lat` | number | Starting point latitude | `33.5138` |
| `lng` | number | Starting point longitude | `36.2765` |

### Optional Parameters - Location

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `radiusKm` | number | `30` | Search radius in kilometers | `50` |
| `latEnd` | number | - | End point latitude (for route matching) | `33.5200` |
| `lngEnd` | number | - | End point longitude (for route matching) | `36.2800` |

### Optional Parameters - Time Filtering

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `startDate` | string | - | Minimum date (YYYY-MM-DD format) | `2025-10-06` |
| `endDate` | string | - | Maximum date (YYYY-MM-DD format) | `2025-10-15` |
| `startTime` | string | - | Minimum time of day (24-hour format HH:MM) | `08:00` |
| `endTime` | string | - | Maximum time of day (24-hour format HH:MM) | `18:00` |

**Date Filter Examples:**
- Show only rides on a specific date: `startDate=2025-10-06&endDate=2025-10-06`
- Show rides this week: `startDate=2025-10-05&endDate=2025-10-12`
- Show rides starting from tomorrow: `startDate=2025-10-06`
- Show rides until end of month: `endDate=2025-10-31`

**Time Filter Examples:**
- Show only morning rides: `startTime=06:00&endTime=12:00`
- Show only evening rides: `startTime=17:00&endTime=23:00`
- Show business hours: `startTime=08:00&endTime=18:00`

**Combined Date & Time Examples:**
- Morning rides tomorrow: `startDate=2025-10-06&endDate=2025-10-06&startTime=06:00&endTime=12:00`
- Evening rides this weekend: `startDate=2025-10-12&endDate=2025-10-13&startTime=17:00&endTime=23:00`

### Optional Parameters - Budget Filtering

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `minBudget` | number | - | Minimum budget amount | `10` |
| `maxBudget` | number | - | Maximum budget amount | `100` |

**Budget Filter Examples:**
- Show budget-friendly rides: `maxBudget=50`
- Show premium rides only: `minBudget=100`
- Show mid-range rides: `minBudget=30&maxBudget=80`

### Optional Parameters - Capacity Filtering

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `maxSeatsNeeded` | number | - | Maximum number of seats in requests (shows requests with ≤ this value) | `4` |

**Seats Filter Logic:**
- If a driver can accommodate 4 passengers, they should set `maxSeatsNeeded=4`
- This will show requests for 1, 2, 3, OR 4 seats
- Requests needing 5+ seats will be excluded
- This allows drivers to see all requests they can fulfill

### Optional Parameters - Sorting

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `sortBy` | string | `distance` | Sort order for results | `budget_asc` |

**Sort Options:**
- `distance` - Nearest requests first (default)
- `budget_asc` - Lowest budget first
- `budget_desc` - Highest budget first (most profitable)
- `time_asc` - Earliest departure time first
- `time_desc` - Latest departure time first

## Request Examples

### Example 1: Basic Search (Backward Compatible)
```
GET /api/requests/nearby?lat=33.5138&lng=36.2765
```
Returns all nearby requests within 30km, sorted by distance.

### Example 2: Advanced Search with All Filters
```
GET /api/requests/nearby?lat=33.5138&lng=36.2765&latEnd=33.5200&lngEnd=36.2800&radiusKm=50&startDate=2025-10-06&endDate=2025-10-10&startTime=08:00&endTime=18:00&minBudget=20&maxBudget=100&maxSeatsNeeded=4&sortBy=budget_desc
```

### Example 3: Find Rides Tomorrow Morning
```
GET /api/requests/nearby?lat=33.5138&lng=36.2765&startDate=2025-10-06&endDate=2025-10-06&startTime=06:00&endTime=12:00&sortBy=budget_desc
```

### Example 4: Find High-Budget Rides This Week
```
GET /api/requests/nearby?lat=33.5138&lng=36.2765&startDate=2025-10-05&endDate=2025-10-12&minBudget=50&sortBy=budget_desc
```

### Example 5: Find Budget-Friendly Rides for Small Vehicle
```
GET /api/requests/nearby?lat=33.5138&lng=36.2765&maxBudget=40&maxSeatsNeeded=2&sortBy=distance
```

### Example 6: Evening Rides on a Specific Route This Weekend
```
GET /api/requests/nearby?lat=33.5138&lng=36.2765&latEnd=33.5200&lngEnd=36.2800&startDate=2025-10-12&endDate=2025-10-13&startTime=17:00&endTime=22:00&sortBy=time_asc
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "count": 5,
  "filters": {
    "radiusKm": 30,
    "endLat": 33.52,
    "endLng": 36.28,
    "startDate": "2025-10-06",
    "endDate": "2025-10-10",
    "startTime": "08:00",
    "endTime": "18:00",
    "minBudget": 20,
    "maxBudget": 100,
    "maxSeatsNeeded": 4,
    "sortBy": "budget_desc"
  },
  "data": [
    {
      "id": 123,
      "travelerId": "user-uuid",
      "startLocationText": "Damascus",
      "endLocationText": "Aleppo",
      "startLocationLat": 33.5138,
      "startLocationLng": 36.2765,
      "endLocationLat": 36.2021,
      "endLocationLng": 37.1343,
      "departureTime": "2025-10-06T09:30:00.000Z",
      "seatsNeeded": 3,
      "budget": "75.00",
      "createdAt": "2025-10-05T10:00:00.000Z",
      "distance_to_start_km": 2.5,
      "distance_to_end_km": 1.8,
      "user": {
        "id": "user-uuid",
        "email": "traveler@example.com",
        "username": "JohnDoe",
        "mediaUrls": ["https://signed-url..."],
        "accountStatus": "active",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

### Error Response (400)
```json
{
  "success": false,
  "error": "Valid latitude and longitude are required"
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Important Notes for Frontend Development

### Backward Compatibility
✅ **Old API calls will continue to work!** If you only send `lat`, `lng`, and optionally `radiusKm`, the API will behave exactly as before.

### Date Format
- Use ISO date format: `YYYY-MM-DD` (e.g., `2025-10-06`, `2025-12-31`)
- Dates are inclusive (both startDate and endDate include rides on those dates)
- If only `startDate` is provided, shows all rides from that date onwards
- If only `endDate` is provided, shows all rides up to and including that date

### Time Format
- Use 24-hour format: `HH:MM` (e.g., `08:00`, `13:30`, `23:45`)
- Time filters apply to the time of day only, not the date
- Can be combined with date filters for precise control

### Budget Format
- Send as decimal numbers without currency symbols
- Example: `50` or `50.00` (not `$50` or `50 USD`)

### Seats Logic
- `maxSeatsNeeded` is inclusive
- If driver has 4 seats, use `maxSeatsNeeded=4` to see requests for 1-4 seats
- This ensures drivers see ALL requests they can fulfill

### Sorting Recommendations
- **For most drivers:** Use `distance` (default) or `budget_desc`
- **For budget-conscious:** Use `budget_asc`
- **For planning routes:** Use `time_asc` with time filters

### Common Use Cases

#### Use Case 1: Driver with 4-seat vehicle looking for profitable morning rides tomorrow
```
?lat=33.5138&lng=36.2765&maxSeatsNeeded=4&startDate=2025-10-06&endDate=2025-10-06&startTime=06:00&endTime=12:00&sortBy=budget_desc
```

#### Use Case 2: Driver searching for rides on their daily commute route this week
```
?lat=33.5138&lng=36.2765&latEnd=33.5200&lngEnd=36.2800&radiusKm=20&startDate=2025-10-05&endDate=2025-10-12&sortBy=distance
```

#### Use Case 3: Driver looking for quick budget rides nearby today
```
?lat=33.5138&lng=36.2765&radiusKm=15&maxBudget=30&startDate=2025-10-05&endDate=2025-10-05&sortBy=distance
```

## Testing Tips

1. **Test backward compatibility:** Call with only `lat` and `lng`
2. **Test each filter individually:** Add one filter at a time
3. **Test extreme values:** Very large radius, very small budget range, etc.
4. **Test time ranges:** Morning, afternoon, evening, late night
5. **Test sorting:** Try all sort options with same filters

## Performance Considerations

- Larger `radiusKm` values may return more results but slower queries
- Combining multiple filters reduces result set and improves performance
- Distance-based sorting is optimized with PostGIS spatial indexes
- Budget/time sorting is fast due to database indexes

## Future Enhancements (Coming Soon)

The schema currently supports these fields, but luggage filtering is not yet implemented:
- `luggageCapacity` - Filter by luggage space requirements
- `vehicleType` - Filter by vehicle type preferences

If you need these features, please request them!
