# Quick Reference: New Request Search Parameters

## 🎯 For Frontend Developers

### Base URL
```
GET /api/requests/nearby
```

### New Optional Parameters (All backward compatible!)

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `startTime` | string | `08:00` | Minimum time of day (HH:MM) |
| `endTime` | string | `18:00` | Maximum time of day (HH:MM) |
| `minBudget` | number | `20` | Minimum budget |
| `maxBudget` | number | `100` | Maximum budget |
| `maxSeatsNeeded` | number | `4` | Show requests with ≤ this many seats |
| `sortBy` | string | `budget_desc` | Sort order |

### Sort Options
- `distance` (default)
- `budget_asc` 
- `budget_desc`
- `time_asc`
- `time_desc`

### Quick Examples

#### Example 1: Morning rides, 4-seat vehicle, profitable
```javascript
const url = `/api/requests/nearby?lat=${lat}&lng=${lng}&startTime=06:00&endTime=12:00&maxSeatsNeeded=4&sortBy=budget_desc`;
```

#### Example 2: Budget rides nearby
```javascript
const url = `/api/requests/nearby?lat=${lat}&lng=${lng}&maxBudget=50&radiusKm=15&sortBy=distance`;
```

#### Example 3: Evening rides on route
```javascript
const url = `/api/requests/nearby?lat=${startLat}&lng=${startLng}&latEnd=${endLat}&lngEnd=${endLng}&startTime=17:00&endTime=22:00`;
```

### TypeScript Interface
```typescript
interface RequestSearchParams {
  // Required
  lat: number;
  lng: number;
  
  // Optional - Location
  radiusKm?: number;
  latEnd?: number;
  lngEnd?: number;
  
  // Optional - Time
  startTime?: string;  // "HH:MM"
  endTime?: string;    // "HH:MM"
  
  // Optional - Budget
  minBudget?: number;
  maxBudget?: number;
  
  // Optional - Capacity
  maxSeatsNeeded?: number;
  
  // Optional - Sorting
  sortBy?: 'distance' | 'budget_asc' | 'budget_desc' | 'time_asc' | 'time_desc';
}
```

### Response Structure
```typescript
interface RequestSearchResponse {
  success: boolean;
  count: number;
  filters: {
    radiusKm?: number;
    endLat?: number;
    endLng?: number;
    startTime?: string;
    endTime?: string;
    minBudget?: number;
    maxBudget?: number;
    maxSeatsNeeded?: number;
    sortBy: string;
  };
  data: Array<{
    id: number;
    travelerId: string;
    startLocationText: string;
    endLocationText: string;
    startLocationLat: number;
    startLocationLng: number;
    endLocationLat: number;
    endLocationLng: number;
    departureTime: string;
    seatsNeeded: number;
    budget: string;
    createdAt: string;
    distance_to_start_km: number;
    distance_to_end_km?: number;
    user: {
      id: string;
      email: string;
      username: string;
      mediaUrls: string[];
      accountStatus: string;
      createdAt: string;
    };
  }>;
}
```

### Important Notes

✅ **All new parameters are optional** - old code works without changes!

✅ **Time format is HH:MM** - use 24-hour format (e.g., "08:00", "14:30", "23:45")

✅ **maxSeatsNeeded is inclusive** - if driver has 4 seats, use `maxSeatsNeeded=4` to see 1-4 seat requests

✅ **Filters combine with AND logic** - all filters must match

✅ **Budget is numeric** - don't include currency symbols

### Common UI Patterns

#### Filter Panel
```jsx
<FilterPanel>
  <TimeRange 
    startTime={startTime} 
    endTime={endTime} 
  />
  <BudgetRange 
    min={minBudget} 
    max={maxBudget} 
  />
  <SeatsFilter 
    max={maxSeatsNeeded} 
    label="Vehicle capacity"
  />
  <SortDropdown 
    options={['distance', 'budget_desc', 'budget_asc', 'time_asc']}
    value={sortBy}
  />
</FilterPanel>
```

#### Smart Defaults
```javascript
const defaultParams = {
  radiusKm: 30,
  sortBy: 'distance',
  maxSeatsNeeded: vehicleCapacity, // From driver profile
};
```

### Error Handling
```javascript
try {
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.success) {
    console.error('API Error:', data.error);
    // Show user-friendly error
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### Testing Checklist
- [ ] Test with no filters (backward compatibility)
- [ ] Test each filter individually
- [ ] Test multiple filters combined
- [ ] Test all sort options
- [ ] Test invalid values (should get 400 error)
- [ ] Test extreme values (large radius, tight budget range)

For full documentation, see: `API_DOCUMENTATION_FIND_NEARBY_REQUESTS.md`
