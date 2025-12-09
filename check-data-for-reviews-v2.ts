
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Users ---');
  const users = await prisma.user.findMany({ take: 5 });
  console.log(users.map(u => ({ id: u.id, username: u.username })));

  console.log('\n--- Transportation Bookings with Listings ---');
  const tBookings = await prisma.transportationBooking.findMany({
    where: {
      transportationListingId: { not: null }
    },
    take: 5,
    include: {
      listing: {
        include: {
          provider: true
        }
      }
    }
  });
  console.log(tBookings.map(b => ({
    id: b.id,
    travelerId: b.travelerId,
    status: b.status,
    listingId: b.transportationListingId,
    providerId: b.listing?.providerId
  })));

  console.log('\n--- Accommodation Bookings with Rooms ---');
  const aBookings = await prisma.accommodationBooking.findMany({
    take: 5,
    include: {
      room: {
        include: {
          accommodation: true
        }
      }
    }
  });
  console.log(aBookings.map(b => ({
    id: b.id,
    travelerId: b.travelerId,
    status: b.status,
    roomId: b.roomId,
    accommodationId: b.room?.accommodationId
  })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
