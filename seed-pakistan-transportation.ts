import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_ID = 'xeSEu67NIjZjSj92CIMjVixNQPr2';

// Routes between Islamabad and Lahore
const ROUTES = [
  {
    from: 'Islamabad',
    to: 'Lahore',
    distance: 375, // km
    basePrice: 3000 // PKR per seat
  },
  {
    from: 'Lahore',
    to: 'Islamabad',
    distance: 375, // km
    basePrice: 3000 // PKR per seat
  }
];

const VEHICLE_TYPES = [
  { type: 'Sedan', seats: 3, priceMultiplier: 1.0 },
  { type: 'SUV', seats: 5, priceMultiplier: 1.3 },
  { type: 'Van', seats: 7, priceMultiplier: 1.6 },
  { type: 'Luxury Sedan', seats: 3, priceMultiplier: 2.0 },
  { type: 'Coaster', seats: 15, priceMultiplier: 0.7 },
  { type: 'Bus', seats: 30, priceMultiplier: 0.5 }
];

const PROVIDER_NAMES = [
  'Daewoo Express',
  'Faisal Movers',
  'Niazi Express',
  'Skyways',
  'Bilal Travels',
  'Khan Transport',
  'Metro Shuttle',
  'Royal Coaches'
];

// Helper function to generate phone number (Pakistan format)
function generatePhoneNumber(): string {
  return `+92 ${Math.floor(Math.random() * 90) + 300} ${Math.floor(Math.random() * 9000000 + 1000000)}`;
}

// Helper function to get random items from array
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate departure times for next 30 days
function generateDepartureTimes(daysAhead: number = 30): Date[] {
  const times: Date[] = [];
  const baseDate = new Date();
  
  // Time slots: 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM
  const timeSlots = [6, 9, 12, 15, 18, 21];
  
  for (let day = 0; day < daysAhead; day++) {
    for (const hour of timeSlots) {
      const departureDate = new Date(baseDate);
      departureDate.setDate(departureDate.getDate() + day);
      departureDate.setHours(hour, 0, 0, 0);
      times.push(departureDate);
    }
  }
  
  return times;
}

async function main() {
  console.log('🚀 Starting transportation seeding for Pakistan routes...\n');

  try {
    await prisma.$transaction(async (tx) => {
      console.log('📝 Transaction started...\n');

      // Check if user exists
      const user = await tx.user.findUnique({
        where: { id: USER_ID }
      });

      if (!user) {
        throw new Error(`❌ User with ID ${USER_ID} not found!`);
      }

      console.log(`✅ User found: ${user.username}\n`);

      // Create transportation providers
      console.log('🚗 Creating transportation providers...');
      const providers: any[] = [];

      for (let i = 0; i < PROVIDER_NAMES.length; i++) {
        const providerName = PROVIDER_NAMES[i];
        const vehicleType = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
        const providerId = `transport_provider_${providerName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${i}`;
        
        // Create user for provider
        await tx.user.create({
          data: {
            id: providerId,
            username: `${providerName.toLowerCase().replace(/\s+/g, '_')}_${i}`,
            email: `transport.${providerName.toLowerCase().replace(/\s+/g, '_')}.${i}@tourease.com`,
            passwordHash: '$2b$10$dummyHashForSeedingPurposesOnly123456789',
            mediaUrls: [],
            accountStatus: 'active'
          }
        });

        // Create transportation provider
        const provider = await tx.transportationProvider.create({
          data: {
            providerId: providerId,
            vehicleType: vehicleType.type,
            seatsAvailable: vehicleType.seats,
            licenseMmediaUrls: [],
            vehicleMediaUrls: [],
            accountStatus: 'active'
          }
        });

        providers.push({ provider, vehicleType, providerName });
        console.log(`  ✓ Created provider: ${providerName} (${vehicleType.type})`);
      }

      console.log(`\n✅ Created ${providers.length} transportation providers\n`);

      // Create transportation listings
      console.log('🚌 Creating transportation listings...');
      let totalListings = 0;
      const departureTimes = generateDepartureTimes(30);

      for (const route of ROUTES) {
        console.log(`\n  Route: ${route.from} → ${route.to}`);
        
        // Create listings for each provider on this route
        for (const { provider, vehicleType } of providers) {
          // Each provider has listings for multiple departure times
          const providerDepartures = getRandomItems(departureTimes, 20); // 20 listings per provider per route
          
          const listingsData = providerDepartures.map(departureTime => {
            const pricePerSeat = Math.round(route.basePrice * vehicleType.priceMultiplier);
            
            return {
              providerId: provider.providerId,
              startLocationText: route.from,
              endLocationText: route.to,
              startLocationLat: route.from === 'Islamabad' ? 33.6844 : 31.5497,
              startLocationLng: route.from === 'Islamabad' ? 73.0479 : 74.3436,
              endLocationLat: route.to === 'Islamabad' ? 33.6844 : 31.5497,
              endLocationLng: route.to === 'Islamabad' ? 73.0479 : 74.3436,
              departureTime: departureTime,
              pricePerSeat: pricePerSeat,
              seatsAvailable: vehicleType.seats,
              luggage: Math.floor(vehicleType.seats * 0.8),
              status: 'active',
              mediaUrls: []
            };
          });

          await tx.transportationListing.createMany({
            data: listingsData
          });

          totalListings += listingsData.length;
        }
        
        console.log(`    → Created ${providers.length * 20} listings`);
      }

      console.log(`\n✅ Created ${totalListings} transportation listings\n`);

      // Add reviews for some listings
      console.log('⭐ Creating sample reviews...');
      const allListings = await tx.transportationListing.findMany({
        take: 30 // Review first 30 listings
      });

      let totalReviews = 0;
      const ratings = [3, 4, 4, 4, 5, 5, 5];
      const comments = [
        'Comfortable journey, arrived on time!',
        'Great service and professional driver.',
        'Clean vehicle and smooth ride.',
        'Good value for money.',
        'Highly recommend this service!',
        'Punctual and reliable.',
        'Pleasant experience overall.'
      ];

      const reviewsData: any[] = [];
      for (const listing of allListings) {
        const numReviews = Math.floor(Math.random() * 3) + 2; // 2-4 reviews

        for (let i = 0; i < numReviews; i++) {
          reviewsData.push({
            reviewerId: USER_ID,
            reviewableType: 'transportation_listing',
            transportationListingId: listing.id,
            rating: ratings[Math.floor(Math.random() * ratings.length)],
            comment: comments[Math.floor(Math.random() * comments.length)]
          });
          totalReviews++;
        }
      }

      await tx.review.createMany({
        data: reviewsData
      });

      console.log(`✅ Created ${totalReviews} reviews\n`);

      console.log('📊 Seeding Summary:');
      console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  • Providers:       ${providers.length}`);
      console.log(`  • Listings:        ${totalListings}`);
      console.log(`  • Reviews:         ${totalReviews}`);
      console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    }, {
      maxWait: 10000,
      timeout: 60000,
    });

    console.log('✨ Transaction completed successfully!\n');

    // Verify the data
    const counts = await Promise.all([
      prisma.transportationProvider.count(),
      prisma.transportationListing.count(),
      prisma.review.count({ where: { reviewableType: 'transportation_listing' } })
    ]);

    console.log('✅ Verification:');
    console.log(`  • Total Transportation Providers: ${counts[0]}`);
    console.log(`  • Total Transportation Listings: ${counts[1]}`);
    console.log(`  • Total Transportation Reviews: ${counts[2]}\n`);

    // Show breakdown by route
    const byRoute = await prisma.transportationListing.groupBy({
      by: ['startLocationText', 'endLocationText'],
      _count: {
        id: true
      }
    });

    console.log('🛣️ Listings by Route:');
    byRoute.forEach(route => {
      console.log(`  • ${route.startLocationText} → ${route.endLocationText}: ${route._count.id} listings`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('👋 Seed script finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  });
