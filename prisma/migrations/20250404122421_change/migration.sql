-- AlterTable
ALTER TABLE "TransportationBooking" ADD COLUMN     "offerId" INTEGER;

-- CreateTable
CREATE TABLE "Offer" (
    "id" SERIAL NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "pricePerSeat" DECIMAL(10,2) NOT NULL,
    "seatsRequested" INTEGER NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transportationListingId" INTEGER,
    "transportationRequestId" INTEGER,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_senderId_idx" ON "Offer"("senderId");

-- CreateIndex
CREATE INDEX "Offer_recipientId_idx" ON "Offer"("recipientId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE INDEX "Offer_transportationListingId_idx" ON "Offer"("transportationListingId");

-- CreateIndex
CREATE INDEX "Offer_transportationRequestId_idx" ON "Offer"("transportationRequestId");

-- CreateIndex
CREATE INDEX "TransportationBooking_offerId_idx" ON "TransportationBooking"("offerId");

-- AddForeignKey
ALTER TABLE "TransportationBooking" ADD CONSTRAINT "TransportationBooking_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_transportationListingId_fkey" FOREIGN KEY ("transportationListingId") REFERENCES "TransportationListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_transportationRequestId_fkey" FOREIGN KEY ("transportationRequestId") REFERENCES "TransportationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
