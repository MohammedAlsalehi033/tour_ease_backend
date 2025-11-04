# 🚀 Trip Planner API - Frontend Integration Guide

**All amounts are in PKR (Pakistani Rupees) 🇵🇰**

---

## 📡 API Endpoint

```
POST /api/planner/generate
Content-Type: application/json
```

---

## 📥 Request Format

```json
{
  "startLocation": "Islamabad, Pakistan",
  "endLocation": "Lahore, Pakistan",
  "startTime": "2025-11-15T00:00:00.000Z",
  "endTime": "2025-11-22T00:00:00.000Z",
  "interests": ["sightseeing", "museums & culture", "food & dining"],
  "budget": 900000,
  "numberOfTravelers": 2,
  "needsReturnTransport": true,
  "useAIOptimization": false,
  "maxIterations": 3,
  "preferredTransportMode": "Air",
  "specialRequirements": "Need hotel with gym access"
}
```

---

## 📤 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "requestSummary": {
      "startLocation": "Islamabad",
      "endLocation": "Lahore",
      "startTime": "2025-11-15T00:00:00.000Z",
      "endTime": "2025-11-22T00:00:00.000Z",
      "interests": ["sightseeing", "museums & culture", "food & dining"],
      "budget": 900000,
      "numberOfTravelers": 2
    },
    "availableOptions": {
      "outboundTransportation": [],
      "returnTransportation": [],
      "accommodations": [
        {
          "id": 123,
          "providerId": "provider_lahore_123",
          "name": "Pearl Continental Lahore",
          "location": "Lahore",
          "description": "Premium hotel offering exceptional comfort and hospitality",
          "mediaUrls": ["https://..."],
          "avgRating": 4.7,
          "roomAllocations": [
            {
              "roomId": 456,
              "roomType": "Standard Double",
              "pricePerNight": 19200,
              "capacity": 2,
              "numberOfRooms": 1,
              "guestsAllocated": 2,
              "totalCost": 134400
            }
          ],
          "totalCost": 134400,
          "totalGuests": 2,
          "checkInDate": "2025-11-15T00:00:00.000Z",
          "checkOutDate": "2025-11-22T00:00:00.000Z",
          "numberOfNights": 7
        }
      ],
      "activities": []
    },
    "recommendedPlans": [
      {
        "optionId": "plan_1",
        "planName": "Pearl Continental Lahore with Self Transport",
        "description": "Stay at Pearl Continental Lahore (1 room type(s) for 2 guest(s))",
        "outboundTransport": null,
        "returnTransport": null,
        "accommodation": {
          "id": 123,
          "name": "Pearl Continental Lahore",
          "location": "Lahore",
          "totalCost": 134400,
          "avgRating": 4.7,
          "roomAllocations": [...]
        },
        "activities": [],
        "costs": {
          "transportation": 0,
          "accommodation": 134400,
          "activities": 0,
          "total": 134400
        },
        "isOptimal": true,
        "optimizationScore": 83.0,
        "warnings": [
          "No outbound transportation available",
          "No return transportation available"
        ]
      }
    ],
    "optimalPlan": {
      "optionId": "plan_1",
      "planName": "Pearl Continental Lahore with Self Transport",
      "costs": {
        "transportation": 0,
        "accommodation": 134400,
        "activities": 0,
        "total": 134400
      },
      "optimizationScore": 83.0,
      "warnings": [
        "No outbound transportation available",
        "No return transportation available"
      ]
    }
  },
  "metadata": {
    "requestedBudget": 900000,
    "budgetCurrency": "PKR",
    "specialRequirementsApplied": true,
    "requestProcessedAt": "2025-11-15T12:00:00.000Z"
  },
  "message": "Trip plans generated successfully"
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Missing required fields: startLocation, endLocation, startTime, endTime, budget, numberOfTravelers are required"
}
```

```json
{
  "success": false,
  "message": "Invalid date format. Use ISO 8601 format (e.g., 2025-11-15T00:00:00.000Z)"
}
```

```json
{
  "success": false,
  "message": "endTime must be after startTime"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Failed to generate trip plans",
  "error": "Error details here"
}
```

---

## 🔧 Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startLocation` | string | ✅ Yes | - | Starting city (format: "City, Country" or just "City") |
| `endLocation` | string | ✅ Yes | - | Destination city (format: "City, Country" or just "City") |
| `startTime` | string | ✅ Yes | - | Trip start date/time in ISO 8601 format |
| `endTime` | string | ✅ Yes | - | Trip end date/time in ISO 8601 format (must be after startTime) |
| `budget` | number | ✅ Yes | - | **Total budget in PKR (Pakistani Rupees)** |
| `numberOfTravelers` | number | ✅ Yes | - | Number of travelers (min: 1) |
| `interests` | string[] | ❌ No | `[]` | Array of interests/activities |
| `needsReturnTransport` | boolean | ❌ No | `true` | Whether return transportation is needed |
| `useAIOptimization` | boolean | ❌ No | `false` | Enable AI-powered optimization (not implemented yet) |
| `maxIterations` | number | ❌ No | `3` | Max optimization iterations (not implemented yet) |
| `preferredTransportMode` | string | ❌ No | `"Any"` | Preferred transport: "Air", "Bus", "Train", "Car", "Any" (not filtered yet) |
| `specialRequirements` | string | ❌ No | `null` | Special requirements (e.g., "Need hotel with gym access") |

---

## 🌍 Available Destinations

Currently, accommodation data is available for:

| City | Hotels Available | Description |
|------|------------------|-------------|
| **Islamabad** | 7 hotels | Capital city, business & tourism |
| **Lahore** | 5 hotels | Cultural hub, historical sites |

**Format:** Use "Islamabad, Pakistan" or just "Islamabad"

---

## 💰 Budget Guidelines (PKR)

### Per Trip Type

| Trip Type | Travelers | Nights | Minimum Budget |
|-----------|-----------|--------|----------------|
| Weekend Getaway | 2 | 2-3 | 180,000 PKR |
| Standard Trip | 2 | 4-5 | 400,000 PKR |
| Week-long Trip | 2 | 7 | 600,000 PKR |
| Luxury Week Trip | 2 | 7 | 1,000,000+ PKR |
| Family Trip | 4 | 5 | 750,000+ PKR |

### Calculation Formula

```javascript
const estimateBudget = (travelers, nights, category) => {
  const ratePerPersonPerNight = {
    budget: 20000,      // Budget hotels
    standard: 35000,    // Mid-range hotels
    luxury: 60000       // Luxury hotels
  };
  
  return travelers * nights * ratePerPersonPerNight[category];
};

// Example: 2 travelers, 7 nights, standard
// 2 × 7 × 35,000 = 490,000 PKR
```

### Room Prices (per night, PKR)

**Islamabad:**
- Budget: 9,600 - 14,400 PKR
- Mid-range: 16,800 - 21,600 PKR
- Luxury: 28,800 - 45,000 PKR

**Lahore:**
- Budget: 10,800 - 15,600 PKR
- Mid-range: 18,000 - 24,000 PKR
- Luxury: 30,000 - 42,000 PKR

---

## 🔍 Special Requirements

The system currently filters accommodations based on keywords in `specialRequirements`:

| Keyword | Matches |
|---------|---------|
| "gym" or "fitness" | Hotels with gym/fitness facilities |
| "pool" or "swimming" | Hotels with swimming pools |
| "spa" | Hotels with spa services |
| "restaurant" or "dining" | Hotels with restaurants |

**Example:**
```json
{
  "specialRequirements": "Need hotel with gym access and pool"
}
```

---

## 📝 TypeScript Interfaces

```typescript
// REQUEST
interface TripPlanRequest {
  startLocation: string;           // "City, Country" or "City"
  endLocation: string;              // "City, Country" or "City"
  startTime: string;                // ISO 8601: "2025-11-15T00:00:00.000Z"
  endTime: string;                  // ISO 8601
  interests?: string[];
  budget: number;                   // PKR (Pakistani Rupees)
  numberOfTravelers: number;        // Min: 1
  needsReturnTransport?: boolean;   // Default: true
  useAIOptimization?: boolean;      // Default: false
  maxIterations?: number;           // Default: 3
  preferredTransportMode?: 'Air' | 'Bus' | 'Train' | 'Car' | 'Any';
  specialRequirements?: string;
}

// RESPONSE
interface TripPlanResponse {
  success: boolean;
  data?: {
    requestSummary: RequestSummary;
    availableOptions: AvailableOptions;
    recommendedPlans: TripPlan[];
    optimalPlan: TripPlan | null;
  };
  metadata?: {
    requestedBudget: number;        // PKR
    budgetCurrency: string;         // "PKR"
    specialRequirementsApplied: boolean;
    requestProcessedAt: string;     // ISO 8601
  };
  message?: string;
  error?: string;
}

interface RequestSummary {
  startLocation: string;
  endLocation: string;
  startTime: Date;
  endTime: Date;
  interests: string[];
  budget: number;                   // PKR
  numberOfTravelers: number;
}

interface AvailableOptions {
  outboundTransportation: TransportOption[];
  returnTransportation: TransportOption[];
  accommodations: Accommodation[];
  activities: Activity[];
}

interface Accommodation {
  id: number;
  providerId: string;
  name: string;
  location: string;
  description: string;
  mediaUrls: string[];
  avgRating: number | null;
  roomAllocations: RoomAllocation[];
  totalCost: number;                // PKR
  totalGuests: number;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
}

interface RoomAllocation {
  roomId: number;
  roomType: string;
  pricePerNight: number;            // PKR
  capacity: number;
  numberOfRooms: number;
  guestsAllocated: number;
  totalCost: number;                // PKR
}

interface TripPlan {
  optionId: string;
  planName: string;
  description: string;
  outboundTransport: TransportOption | null;
  returnTransport: TransportOption | null;
  accommodation: Accommodation | null;
  activities: Activity[];
  costs: {
    transportation: number;         // PKR
    accommodation: number;          // PKR
    activities: number;             // PKR
    total: number;                  // PKR
  };
  isOptimal: boolean;
  optimizationScore: number;        // 0-100
  warnings: string[];
}

interface TransportOption {
  id: number;
  providerId: string;
  providerName: string;
  vehicleType: string;
  pricePerSeat: number;             // PKR
  seatsAvailable: number;
  departureTime: Date;
  startLocationText: string;
  endLocationText: string;
  avgRating: number | null;
  totalCost: number;                // PKR
  isReturnTrip: boolean;
}

interface Activity {
  title: string;
  description: string;
  upvotes: number;
  tags: string[];
  source: 'local_knowledge';
}
```

---

## 🧪 Testing Examples

### Example 1: Week-long Trip to Lahore

```javascript
const request = {
  startLocation: "Islamabad, Pakistan",
  endLocation: "Lahore, Pakistan",
  startTime: "2025-11-15T00:00:00.000Z",
  endTime: "2025-11-22T00:00:00.000Z",
  interests: ["sightseeing", "museums & culture", "food & dining"],
  budget: 900000,  // PKR
  numberOfTravelers: 2,
  needsReturnTransport: true,
  specialRequirements: "Need hotel with gym access"
};

// Expected: 3-5 hotel options, total cost ~130,000-500,000 PKR
```

### Example 2: Weekend Trip

```javascript
const request = {
  startLocation: "Islamabad, Pakistan",
  endLocation: "Lahore, Pakistan",
  startTime: "2025-12-06T00:00:00.000Z",
  endTime: "2025-12-08T00:00:00.000Z",
  budget: 200000,  // PKR
  numberOfTravelers: 2
};

// Expected: 4-5 budget/mid-range hotels
```

### Example 3: Luxury Trip

```javascript
const request = {
  startLocation: "Lahore, Pakistan",
  endLocation: "Islamabad, Pakistan",
  startTime: "2025-12-20T00:00:00.000Z",
  endTime: "2025-12-27T00:00:00.000Z",
  budget: 1500000,  // PKR
  numberOfTravelers: 2,
  interests: ["luxury", "spa", "fine dining"],
  specialRequirements: "Need hotel with spa and pool"
};

// Expected: Premium hotel options
```

---

## 💡 Frontend Implementation Tips

### 1. Currency Display

```javascript
const formatPKR = (amount) => {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
};

// Usage: formatPKR(134400) → "Rs. 134,400"
```

### 2. Date Handling

```javascript
// Convert date picker to ISO string
const startDate = new Date('2025-11-15');
const startTime = startDate.toISOString(); // "2025-11-15T00:00:00.000Z"
```

### 3. Budget Calculator Component

```javascript
const BudgetCalculator = ({ travelers, nights, quality }) => {
  const rates = {
    budget: 20000,
    standard: 35000,
    luxury: 60000
  };
  
  const estimatedBudget = travelers * nights * rates[quality];
  
  return (
    <div>
      <p>Estimated Budget: Rs. {estimatedBudget.toLocaleString()}</p>
    </div>
  );
};
```

### 4. Handle Empty Results

```javascript
if (response.data.availableOptions.accommodations.length === 0) {
  showMessage("No accommodations found. Try increasing your budget or changing dates.");
}
```

### 5. Display Warnings

```javascript
{plan.warnings.map(warning => (
  <Alert key={warning} severity="warning">
    {warning}
  </Alert>
))}
```

### 6. Optimization Score Display

```javascript
const ScoreIndicator = ({ score }) => {
  const percentage = (score).toFixed(0);
  const color = score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red';
  
  return (
    <div style={{ color }}>
      Match Score: {percentage}%
    </div>
  );
};
```

---

## ⚠️ Current Limitations

### 1. No Transportation Data
- `outboundTransportation` and `returnTransportation` will be empty arrays
- Plans will show warnings: "No outbound/return transportation available"
- Users must arrange their own transport

### 2. No Activities Data
- `activities` will be an empty array
- Future enhancement will include local attractions and activities

### 3. Limited Locations
- Only Islamabad and Lahore have data
- Other cities will return empty accommodation results

### 4. Special Requirements
- Only keyword-based filtering (gym, pool, spa, restaurant)
- Not all hotels have detailed amenity data

---

## 🚀 Quick Start Checklist

- [ ] Use PKR (Pakistani Rupees) for all budget inputs
- [ ] Format locations as "City, Country" or "City"
- [ ] Use ISO 8601 format for dates
- [ ] Validate `endTime` is after `startTime`
- [ ] Set minimum budget based on trip duration
- [ ] Handle empty results gracefully
- [ ] Display warnings to users
- [ ] Format currency as "Rs. X,XXX"
- [ ] Show optimization scores
- [ ] Allow filtering by special requirements

---

## 📞 Support

For questions or issues, please contact the backend team or refer to the source code in:
- Controller: `/src/controllers/planner/plannerController.ts`
- Model: `/src/models/planner/plannerModel.ts`
- Types: `/src/Types/plannerTypes.ts`

---

**Last Updated:** November 1, 2025  
**API Version:** 1.0  
**Currency:** PKR (Pakistani Rupees) 🇵🇰
