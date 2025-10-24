/*
  Warnings:

  - You are about to drop the column `listingId` on the `TransportationBooking` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TransportationBooking" DROP CONSTRAINT "TransportationBooking_listingId_fkey";

-- DropIndex
DROP INDEX "TransportationBooking_listingId_idx";

-- AlterTable
ALTER TABLE "TransportationBooking" DROP COLUMN "listingId",
ADD COLUMN     "bookingSource" TEXT NOT NULL DEFAULT 'listing',
ADD COLUMN     "transportationListingId" INTEGER,
ADD COLUMN     "transportationRequestId" INTEGER;

-- CreateTable
CREATE TABLE "TransportationRequest" (
    "id" SERIAL NOT NULL,
    "travelerId" TEXT NOT NULL,
    "startLocation" TEXT NOT NULL,
    "endLocation" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "seatsNeeded" INTEGER NOT NULL,
    "budget" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportationRequest_travelerId_idx" ON "TransportationRequest"("travelerId");

-- CreateIndex
CREATE INDEX "TransportationRequest_startLocation_endLocation_idx" ON "TransportationRequest"("startLocation", "endLocation");

-- CreateIndex
CREATE INDEX "TransportationRequest_departureTime_idx" ON "TransportationRequest"("departureTime");

-- CreateIndex
CREATE INDEX "TransportationBooking_transportationListingId_idx" ON "TransportationBooking"("transportationListingId");

-- CreateIndex
CREATE INDEX "TransportationBooking_transportationRequestId_idx" ON "TransportationBooking"("transportationRequestId");

-- AddForeignKey
ALTER TABLE "TransportationRequest" ADD CONSTRAINT "TransportationRequest_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationBooking" ADD CONSTRAINT "TransportationBooking_transportationListingId_fkey" FOREIGN KEY ("transportationListingId") REFERENCES "TransportationListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationBooking" ADD CONSTRAINT "TransportationBooking_transportationRequestId_fkey" FOREIGN KEY ("transportationRequestId") REFERENCES "TransportationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
