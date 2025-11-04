-- Migration: Add Saved Trip Plans
-- Description: Allow users to save, modify, and manage their trip plans
-- Date: 2025-10-27

-- 1. Create SavedTripPlan table
CREATE TABLE IF NOT EXISTS "SavedTripPlan" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "planName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "startLocation" TEXT NOT NULL,
  "endLocation" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "numberOfTravelers" INTEGER NOT NULL,
  "budget" DECIMAL(10,2) NOT NULL,
  "interests" TEXT[],
  "needsReturnTransport" BOOLEAN NOT NULL DEFAULT true,
  
  -- Selected options (can be null if not yet selected)
  "selectedOutboundTransportId" INTEGER,
  "selectedReturnTransportId" INTEGER,
  "selectedAccommodationId" INTEGER,
  "seatsNeeded" INTEGER,
  
  -- Complete plan data stored as JSON
  "planData" JSONB,
  
  -- Metadata
  "notes" TEXT,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastViewedAt" TIMESTAMP(3),
  
  -- Foreign keys
  CONSTRAINT "SavedTripPlan_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  
  CONSTRAINT "SavedTripPlan_selectedOutboundTransportId_fkey" 
    FOREIGN KEY ("selectedOutboundTransportId") 
    REFERENCES "TransportationListing"("id") ON DELETE SET NULL,
  
  CONSTRAINT "SavedTripPlan_selectedReturnTransportId_fkey" 
    FOREIGN KEY ("selectedReturnTransportId") 
    REFERENCES "TransportationListing"("id") ON DELETE SET NULL,
  
  CONSTRAINT "SavedTripPlan_selectedAccommodationId_fkey" 
    FOREIGN KEY ("selectedAccommodationId") 
    REFERENCES "Accommodation"("id") ON DELETE SET NULL
);

-- 2. Create SavedPlanRoomAllocation table (for multi-room bookings)
CREATE TABLE IF NOT EXISTS "SavedPlanRoomAllocation" (
  "id" SERIAL PRIMARY KEY,
  "savedPlanId" INTEGER NOT NULL,
  "roomId" INTEGER NOT NULL,
  "numberOfRooms" INTEGER NOT NULL DEFAULT 1,
  "checkInDate" TIMESTAMP(3) NOT NULL,
  "checkOutDate" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "SavedPlanRoomAllocation_savedPlanId_fkey" 
    FOREIGN KEY ("savedPlanId") 
    REFERENCES "SavedTripPlan"("id") ON DELETE CASCADE,
  
  CONSTRAINT "SavedPlanRoomAllocation_roomId_fkey" 
    FOREIGN KEY ("roomId") 
    REFERENCES "Room"("id") ON DELETE CASCADE
);

-- 3. Create indexes for performance
CREATE INDEX "SavedTripPlan_userId_idx" ON "SavedTripPlan"("userId");
CREATE INDEX "SavedTripPlan_status_idx" ON "SavedTripPlan"("status");
CREATE INDEX "SavedTripPlan_startTime_idx" ON "SavedTripPlan"("startTime");
CREATE INDEX "SavedTripPlan_createdAt_idx" ON "SavedTripPlan"("createdAt");
CREATE INDEX "SavedTripPlan_tags_idx" ON "SavedTripPlan" USING GIN("tags");
CREATE INDEX "SavedPlanRoomAllocation_savedPlanId_idx" ON "SavedPlanRoomAllocation"("savedPlanId");

-- 4. Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_saved_trip_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_trip_plan_timestamp
  BEFORE UPDATE ON "SavedTripPlan"
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_trip_plan_updated_at();

-- 5. Add comments for documentation
COMMENT ON TABLE "SavedTripPlan" IS 'Stores user-saved trip plans for later modification or booking';
COMMENT ON COLUMN "SavedTripPlan"."status" IS 'Status: draft, finalized, booked, cancelled, expired';
COMMENT ON COLUMN "SavedTripPlan"."planData" IS 'Complete plan data from AI generation stored as JSON';
COMMENT ON TABLE "SavedPlanRoomAllocation" IS 'Stores selected room allocations for saved plans';
