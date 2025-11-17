import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugRides() {
  console.log('🔍 Searching for rides from Islamabad to Lahore...\n');
  
  // Find all rides from Islamabad area to Lahore area
  const rides = await prisma.transportationListing.findMany({
    where: {
      startLocationText: { contains: 'Islamabad', mode: 'insensitive' },
      endLocationText: { contains: 'Lahore', mode: 'insensitive' },
      status: 'active',
      departureTime: {
        gte: new Date('2025-11-30T00:00:00.000Z'),
        lte: new Date('2025-11-30T23:59:59.999Z')
      }
    },
    include: {
      provider: {
        include: {
          user: { select: { username: true } }
        }
      },
      reviews: { select: { rating: true } }
    },
    orderBy: {
      pricePerSeat: 'asc'
    }
  });

  console.log(`Found ${rides.length} rides:\n`);
  
  rides.forEach((ride, idx) => {
    const avgRating = ride.reviews.length > 0
      ? ride.reviews.reduce((sum, r) => sum + r.rating, 0) / ride.reviews.length
      : null;
      
    console.log(`${idx + 1}. ID: ${ride.id}`);
    console.log(`   Provider: ${ride.providerId} (${ride.provider.user.username})`);
    console.log(`   Vehicle: ${ride.provider.vehicleType}`);
    console.log(`   Price: ${ride.pricePerSeat} PKR/seat`);
    console.log(`   Seats: ${ride.seatsAvailable}`);
    console.log(`   Departure: ${ride.departureTime.toISOString()}`);
    console.log(`   From: ${ride.startLocationText}`);
    console.log(`   To: ${ride.endLocationText}`);
    console.log(`   Rating: ${avgRating || 'No ratings'}`);
    console.log(`   Reviews: ${ride.reviews.length}`);
    console.log('');
  });

  await prisma.$disconnect();
}

debugRides().catch(console.error);
