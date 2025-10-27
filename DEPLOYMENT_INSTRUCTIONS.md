# Trip Planner Deployment Instructions

## Overview
The smart trip planner with saved plans feature is ready for deployment. This document outlines the steps needed to deploy the new features to your AWS EC2 PostgreSQL database.

---

## What's Been Implemented

### ✅ Backend Features
1. **Core Trip Planning** - Search for transportation, accommodations, and activities
2. **AI Optimization** - Iterative refinement with Google Gemini API
3. **Multi-Room Allocation** - Smart room distribution for groups
4. **Cost Calculation** - Comprehensive pricing for transport + accommodation
5. **Optimal Plan Recommendation** - AI-scored best option highlighted
6. **User Choice** - Quick book or customize selections
7. **Saved Plans (NEW)** - Save, modify, and book plans later

### ✅ API Endpoints
- `POST /api/planner/generate` - Search for trip plans
- `POST /api/planner/confirm` - Book selected options
- `POST /api/planner/refine` - AI conversational refinement
- `POST /api/planner/saved` - Save trip plan
- `GET /api/planner/saved` - List saved plans (with filters)
- `GET /api/planner/saved/:id` - Get plan details
- `PUT /api/planner/saved/:id` - Update saved plan
- `DELETE /api/planner/saved/:id` - Delete plan
- `POST /api/planner/saved/:id/book` - Book saved plan

### ✅ Files Created/Modified
- `/src/controllers/planner/savedPlansController.ts` (NEW)
- `/src/routes/planner/plannerRouter.ts` (UPDATED)
- `/prisma/schema.prisma` (UPDATED)
- `/migrations/add_saved_trip_plans.sql` (NEW)
- `/TRIP_PLANNER_COMPLETE_GUIDE.md` (UPDATED)

---

## Deployment Steps

### Step 1: Connect to AWS EC2
```bash
# SSH into your EC2 instance
ssh -i awsKey.pem ec2-user@your-ec2-ip
```

### Step 2: Run Database Migration
```bash
# Navigate to your project directory
cd /path/to/tour_ease_backend

# Connect to PostgreSQL and run the migration
psql -U your_db_user -d your_database_name -f migrations/add_saved_trip_plans.sql

# Or if you need to specify host/port:
psql -h localhost -p 5432 -U your_db_user -d your_database_name -f migrations/add_saved_trip_plans.sql
```

**Expected Output:**
```
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE FUNCTION
CREATE TRIGGER
```

### Step 3: Regenerate Prisma Client
```bash
# In your project directory
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### Step 4: Build TypeScript (if needed)
```bash
# Compile TypeScript to JavaScript
npm run build

# Or if using tsc directly:
tsc
```

### Step 5: Restart Your Application
```bash
# If using PM2:
pm2 restart tour_ease_backend

# If using ecosystem.config.js:
pm2 restart ecosystem.config.js

# Or restart manually based on your setup
```

### Step 6: Verify Migration
```bash
# Connect to PostgreSQL
psql -U your_db_user -d your_database_name

# Check if tables were created
\dt SavedTripPlan
\dt SavedPlanRoomAllocation

# Check table structure
\d SavedTripPlan
\d SavedPlanRoomAllocation

# Exit psql
\q
```

---

## Testing the New Features

### Test 1: Save a Plan
```bash
curl -X POST http://your-server/api/planner/saved \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "planName": "Test Beach Trip",
    "description": "Testing saved plans feature",
    "selectedOutboundId": 123,
    "selectedReturnId": 456,
    "selectedAccommodationId": 789,
    "selectedRoomAllocations": [{"roomId": 101, "quantity": 2}],
    "selectedActivities": [10, 20],
    "totalCost": 3000,
    "tags": ["test", "beach"]
  }'
```

### Test 2: List Saved Plans
```bash
curl -X GET "http://your-server/api/planner/saved?status=draft" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Get Plan Details
```bash
curl -X GET "http://your-server/api/planner/saved/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Update Plan
```bash
curl -X PUT http://your-server/api/planner/saved/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "planName": "Updated Beach Trip",
    "tags": ["test", "beach", "updated"]
  }'
```

### Test 5: Book Saved Plan
```bash
curl -X POST http://your-server/api/planner/saved/1/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 6: Delete Plan
```bash
curl -X DELETE http://your-server/api/planner/saved/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Rollback Plan (If Needed)

If something goes wrong, you can rollback the migration:

```sql
-- Connect to PostgreSQL
psql -U your_db_user -d your_database_name

-- Drop the new tables
DROP TABLE IF EXISTS "SavedPlanRoomAllocation" CASCADE;
DROP TABLE IF EXISTS "SavedTripPlan" CASCADE;

-- Drop the trigger and function
DROP TRIGGER IF EXISTS update_saved_trip_plan_updated_at ON "SavedTripPlan";
DROP FUNCTION IF EXISTS update_updated_at_column();
```

---

## Database Schema Details

### SavedTripPlan Table
Stores user's saved trip plans with all selections:
- `id` - Primary key
- `userId` - Reference to User table
- `planName` - User-defined name for the plan
- `description` - Optional description
- `status` - 'draft', 'booked', or 'expired'
- `selectedOutboundId` - Reference to TransportationListing
- `selectedReturnId` - Reference to TransportationListing
- `selectedAccommodationId` - Reference to Accommodation
- `selectedActivities` - Array of activity IDs
- `totalCost` - Total cost of the plan
- `tags` - Array of tags for filtering
- `originalSearchParams` - JSONB of search parameters
- `bookedAt` - Timestamp when plan was booked
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp (auto-updated)

### SavedPlanRoomAllocation Table
Stores room allocations for each saved plan:
- `id` - Primary key
- `savedPlanId` - Reference to SavedTripPlan (CASCADE delete)
- `roomId` - Reference to Room table
- `quantity` - Number of rooms of this type

### Indexes Created
1. `idx_saved_trip_plan_user_id` - For user's plans lookup
2. `idx_saved_trip_plan_status` - For status filtering
3. `idx_saved_trip_plan_created_at` - For sorting by date
4. `idx_saved_trip_plan_tags` - For tag-based filtering (GIN index)
5. `idx_saved_plan_room_allocation_saved_plan_id` - For room lookups
6. `idx_saved_plan_room_allocation_room_id` - For room reference

---

## Environment Variables

Make sure these are set in your environment:
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `JWT_SECRET` - For authentication

---

## Monitoring

After deployment, monitor:
1. **Database Performance** - Check query times for saved plans
2. **Error Logs** - Watch for any TypeScript/Prisma errors
3. **API Response Times** - Ensure endpoints respond quickly
4. **User Activity** - Track saved plans usage

---

## Support

If you encounter issues:
1. Check application logs: `pm2 logs tour_ease_backend`
2. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql.log`
3. Verify Prisma client: `npx prisma validate`
4. Test database connection: `npx prisma db pull`

---

## Next Steps

After successful deployment:
1. Update frontend to implement saved plans UI
2. Add analytics tracking for saved plans feature
3. Consider adding plan sharing functionality
4. Implement plan templates for common trips
5. Add email notifications for plan reminders

---

## Summary

✅ Migration file created: `/migrations/add_saved_trip_plans.sql`
✅ Prisma schema updated with new models
✅ Controller implemented with 6 endpoints
✅ Routes configured in plannerRouter
✅ Documentation updated in TRIP_PLANNER_COMPLETE_GUIDE.md

**Status:** Ready for deployment
**Estimated Time:** 10-15 minutes
**Risk Level:** Low (only adding new tables, no modifications to existing data)
