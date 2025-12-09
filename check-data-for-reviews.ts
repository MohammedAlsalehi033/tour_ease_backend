
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Users ---');
  const users = await prisma.user.findMany({ take: 5 });
  console.log(users.map(u => ({ id: u.id, username: u.username, email: u.email })));

  console.log('\n--- Transportation Listings ---');
  const listings = await prisma.transportationListing.findMany({ take: 5, include: { provider: true } });
  console.log(listings.map(l => ({ id: l.id, providerId: l.providerId, status: l.status })));

  console.log('\n--- Transportation Bookings ---');
  const tBookings = await prisma.transportationBooking.findMany({ take: 5, include: { listing: true } });
  console.log(tBookings.map(b => ({ id: b.id, travelerId: b.travelerId, status: b.status, listingId: b.transportationListingId })));

  console.log('\n--- Accommodations ---');
  const accommodations = await prisma.accommodation.findMany({ take: 5 });
  console.log(accommodations.map(a => ({ id: a.id, name: a.name, providerId: a.providerId })));

  console.log('\n--- Accommodation Bookings ---');
  const aBookings = await prisma.accommodationBooking.findMany({ take: 5, include: { room: true } });
  console.log(aBookings.map(b => ({ id: b.id, travelerId: b.travelerId, status: b.status, roomId: b.roomId })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
