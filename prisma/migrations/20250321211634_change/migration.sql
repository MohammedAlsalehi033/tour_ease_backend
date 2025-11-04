/*
  Warnings:

  - The primary key for the `AccommodationProvider` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Admin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TransportationProvider` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Traveler` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserRole` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Accommodation" DROP CONSTRAINT "Accommodation_providerId_fkey";

-- DropForeignKey
ALTER TABLE "AccommodationBooking" DROP CONSTRAINT "AccommodationBooking_travelerId_fkey";

-- DropForeignKey
ALTER TABLE "AccommodationProvider" DROP CONSTRAINT "AccommodationProvider_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_userId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "TransportationBooking" DROP CONSTRAINT "TransportationBooking_travelerId_fkey";

-- DropForeignKey
ALTER TABLE "TransportationListing" DROP CONSTRAINT "TransportationListing_providerId_fkey";

-- DropForeignKey
ALTER TABLE "TransportationProvider" DROP CONSTRAINT "TransportationProvider_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Traveler" DROP CONSTRAINT "Traveler_travelerId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_travelerId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- AlterTable
ALTER TABLE "Accommodation" ALTER COLUMN "providerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "AccommodationBooking" ALTER COLUMN "travelerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "AccommodationProvider" DROP CONSTRAINT "AccommodationProvider_pkey",
ALTER COLUMN "providerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "AccommodationProvider_pkey" PRIMARY KEY ("providerId");

-- AlterTable
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_pkey",
ALTER COLUMN "adminId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Admin_pkey" PRIMARY KEY ("adminId");

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "senderId" SET DATA TYPE TEXT,
ALTER COLUMN "receiverId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "reviewerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TransportationBooking" ALTER COLUMN "travelerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TransportationListing" ALTER COLUMN "providerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TransportationProvider" DROP CONSTRAINT "TransportationProvider_pkey",
ALTER COLUMN "providerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "TransportationProvider_pkey" PRIMARY KEY ("providerId");

-- AlterTable
ALTER TABLE "Traveler" DROP CONSTRAINT "Traveler_pkey",
ALTER COLUMN "travelerId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Traveler_pkey" PRIMARY KEY ("travelerId");

-- AlterTable
ALTER TABLE "Trip" ALTER COLUMN "travelerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_pkey",
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationProvider" ADD CONSTRAINT "TransportationProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationProvider" ADD CONSTRAINT "AccommodationProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationListing" ADD CONSTRAINT "TransportationListing_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TransportationProvider"("providerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accommodation" ADD CONSTRAINT "Accommodation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AccommodationProvider"("providerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportationBooking" ADD CONSTRAINT "TransportationBooking_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationBooking" ADD CONSTRAINT "AccommodationBooking_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traveler" ADD CONSTRAINT "Traveler_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
