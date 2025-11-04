/*
  Warnings:

  - You are about to drop the column `endLocation` on the `TransportationListing` table. All the data in the column will be lost.
  - You are about to drop the column `startLocation` on the `TransportationListing` table. All the data in the column will be lost.
  - You are about to drop the column `endLocation` on the `TransportationRequest` table. All the data in the column will be lost.
  - You are about to drop the column `startLocation` on the `TransportationRequest` table. All the data in the column will be lost.
  - Added the required column `endLocationText` to the `TransportationListing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startLocationText` to the `TransportationListing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endLocationText` to the `TransportationRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startLocationText` to the `TransportationRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- DropIndex
DROP INDEX "TransportationListing_startLocation_endLocation_idx";

-- DropIndex
DROP INDEX "TransportationRequest_startLocation_endLocation_idx";

-- AlterTable
ALTER TABLE "TransportationListing" DROP COLUMN "endLocation",
DROP COLUMN "startLocation",
ADD COLUMN     "endLocationLat" DOUBLE PRECISION,
ADD COLUMN     "endLocationLng" DOUBLE PRECISION,
ADD COLUMN     "endLocationText" TEXT NOT NULL,
ADD COLUMN     "startLocationLat" DOUBLE PRECISION,
ADD COLUMN     "startLocationLng" DOUBLE PRECISION,
ADD COLUMN     "startLocationText" TEXT NOT NULL;


-- AlterTable
ALTER TABLE "TransportationRequest" DROP COLUMN "endLocation",
DROP COLUMN "startLocation",
ADD COLUMN     "endLocationLat" DOUBLE PRECISION,
ADD COLUMN     "endLocationLng" DOUBLE PRECISION,
ADD COLUMN     "endLocationText" TEXT NOT NULL,
ADD COLUMN     "startLocationLat" DOUBLE PRECISION,
ADD COLUMN     "startLocationLng" DOUBLE PRECISION,
ADD COLUMN     "startLocationText" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "TransportationListing_startLocationText_endLocationText_idx" ON "TransportationListing"("startLocationText", "endLocationText");

-- CreateIndex
CREATE INDEX "TransportationRequest_startLocationText_endLocationText_idx" ON "TransportationRequest"("startLocationText", "endLocationText");
