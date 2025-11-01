import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('\n🔍 Database Content Check\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get counts
    const [
      providerCount,
      accommodationCount,
      roomCount,
      reviewCount,
      transportProviders,
      transportListings
    ] = await Promise.all([
      prisma.accommodationProvider.count(),
      prisma.accommodation.count(),
      prisma.room.count(),
      prisma.review.count({ where: { reviewableType: 'accommodation' } }),
      prisma.transportationProvider.count(),
      prisma.transportationListing.count()
    ]);

    console.log('📊 ACCOMMODATION SYSTEM');
    console.log('─────────────────────────────────────────────');
    console.log(`Accommodation Providers:    ${providerCount}`);
    console.log(`Accommodations:             ${accommodationCount}`);
    console.log(`Room Types:                 ${roomCount}`);
    console.log(`Reviews:                    ${reviewCount}\n`);

    console.log('🚗 TRANSPORTATION SYSTEM');
    console.log('─────────────────────────────────────────────');
    console.log(`Transportation Providers:   ${transportProviders}`);
    console.log(`Transportation Listings:    ${transportListings}\n`);

    // Sample data by location
    const accommodationsByLocation = await prisma.accommodation.groupBy({
      by: ['location'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    console.log('🏙️ ACCOMMODATIONS BY LOCATION');
    console.log('─────────────────────────────────────────────');
    accommodationsByLocation.forEach(loc => {
      console.log(`${loc.location.padEnd(20)} ${loc._count.id} accommodations`);
    });
    console.log('');

    // Sample accommodations with room info
    const sampleAccommodations = await prisma.accommodation.findMany({
      take: 5,
      include: {
        rooms: {
          select: {
            roomType: true,
            pricePerNight: true,
            capacity: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    console.log('🏨 SAMPLE ACCOMMODATIONS');
    console.log('─────────────────────────────────────────────');
    sampleAccommodations.forEach((acc, idx) => {
      const avgRating = acc.reviews.length > 0
        ? (acc.reviews.reduce((sum, r) => sum + r.rating, 0) / acc.reviews.length).toFixed(1)
        : 'N/A';
      
      console.log(`\n${idx + 1}. ${acc.name}`);
      console.log(`   Location: ${acc.location}`);
      console.log(`   Rating: ${avgRating} ⭐ (${acc.reviews.length} reviews)`);
      console.log(`   Room Types: ${acc.rooms.length}`);
      
      if (acc.rooms.length > 0) {
        const cheapest = Math.min(...acc.rooms.map(r => Number(r.pricePerNight)));
        const mostExpensive = Math.max(...acc.rooms.map(r => Number(r.pricePerNight)));
        console.log(`   Price Range: ${cheapest} - ${mostExpensive} SAR/night`);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Database check completed!\n');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
