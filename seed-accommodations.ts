import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_ID = 'xeSEu67NIjZjSj92CIMjVixNQPr2';

// Popular tourist destinations in the region
const LOCATIONS = [
  'Riyadh',
  'Jeddah',
  'Mecca',
  'Medina',
  'Dammam',
  'Taif',
  'Abha',
  'Al Khobar',
  'Khamis Mushait',
  'Tabuk',
  'Yanbu',
  'Al-Ahsa',
  'Buraydah',
  'Najran'
];

const ACCOMMODATION_TYPES = [
  { suffix: 'Grand Hotel', description: 'Luxury accommodation with world-class amenities' },
  { suffix: 'Plaza Inn', description: 'Comfortable mid-range hotel perfect for business and leisure' },
  { suffix: 'Budget Suites', description: 'Affordable and clean accommodation for budget travelers' },
  { suffix: 'Resort & Spa', description: 'Premium resort with spa facilities and recreational activities' },
  { suffix: 'Business Hotel', description: 'Modern hotel with excellent business facilities' },
  { suffix: 'Boutique Inn', description: 'Charming boutique hotel with personalized service' },
  { suffix: 'Family Hotel', description: 'Family-friendly hotel with spacious rooms and amenities' }
];

const ROOM_TYPES = [
  { name: 'Single Room', capacity: 1, basePrice: 150 },
  { name: 'Double Room', capacity: 2, basePrice: 250 },
  { name: 'Twin Room', capacity: 2, basePrice: 270 },
  { name: 'Triple Room', capacity: 3, basePrice: 350 },
  { name: 'Family Suite', capacity: 4, basePrice: 500 },
  { name: 'Deluxe Suite', capacity: 2, basePrice: 600 },
  { name: 'Executive Suite', capacity: 3, basePrice: 750 },
  { name: 'Presidential Suite', capacity: 4, basePrice: 1200 }
];

// Sample media URLs for accommodations and rooms
const ACCOMMODATION_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
];

const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1590490360182-c33d57733427',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39'
];

// Helper function to generate phone number
function generatePhoneNumber(): string {
  return `+966 5${Math.floor(Math.random() * 90000000 + 10000000)}`;
}

// Helper function to generate address
function generateAddress(location: string, index: number): string {
  const streets = ['King Fahd Road', 'Prince Sultan Street', 'Al Tahlia Street', 'Al Olaya Road', 'Makkah Road'];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const building = Math.floor(Math.random() * 500 + 1);
  return `Building ${building}, ${street}, ${location}`;
}

// Helper function to get random items from array
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to adjust price based on location and type
function adjustPrice(basePrice: number, location: string, hotelType: string): number {
  let multiplier = 1.0;
  
  // Premium locations
  if (['Riyadh', 'Jeddah', 'Mecca', 'Medina'].includes(location)) {
    multiplier += 0.3;
  }
  
  // Hotel type adjustments
  if (hotelType.includes('Resort') || hotelType.includes('Grand')) {
    multiplier += 0.5;
  } else if (hotelType.includes('Budget')) {
    multiplier -= 0.3;
  } else if (hotelType.includes('Boutique') || hotelType.includes('Business')) {
    multiplier += 0.2;
  }
  
  return Math.round(basePrice * multiplier);
}

async function main() {
  console.log('🚀 Starting accommodation seeding process...\n');

  try {
    // Start transaction with longer timeout
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

      // Create accommodation providers (one per location)
      console.log('🏢 Creating accommodation providers...');
      const providers: Array<{ provider: any; location: string }> = [];

      for (let i = 0; i < LOCATIONS.length; i++) {
        const location = LOCATIONS[i];
        const providerId = `provider_${location.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${i}`;
        
        // First create the user
        await tx.user.create({
          data: {
            id: providerId,
            username: `${location.toLowerCase()}_hotels_${i}`,
            email: `hotels.${location.toLowerCase()}.${i}@tourease.com`,
            passwordHash: '$2b$10$dummyHashForSeedingPurposesOnly123456789',
            mediaUrls: [],
            accountStatus: 'active'
          }
        });

        // Then create the accommodation provider
        const provider = await tx.accommodationProvider.create({
          data: {
            providerId: providerId,
            accommodationName: `${location} Hospitality Group`,
            address: generateAddress(location, i),
            contactNumber: generatePhoneNumber(),
            mediaUrls: getRandomItems(ACCOMMODATION_IMAGES, 2)
          }
        });

        providers.push({ provider, location });
        console.log(`  ✓ Created provider: ${provider.accommodationName}`);
      }

      console.log(`\n✅ Created ${providers.length} accommodation providers\n`);

      // Create accommodations (2-3 per provider)
      console.log('🏨 Creating accommodations...');
      let totalAccommodations = 0;
      let totalRooms = 0;

      for (const { provider, location } of providers) {
        const numAccommodations = Math.floor(Math.random() * 2) + 2; // 2-3 accommodations

        for (let i = 0; i < numAccommodations; i++) {
          const hotelType = ACCOMMODATION_TYPES[Math.floor(Math.random() * ACCOMMODATION_TYPES.length)];
          const hotelName = `${location} ${hotelType.suffix}`;

          const accommodation = await tx.accommodation.create({
            data: {
              providerId: provider.providerId,
              name: hotelName,
              location: location,
              description: hotelType.description,
              mediaUrls: getRandomItems(ACCOMMODATION_IMAGES, 3)
            }
          });

          totalAccommodations++;
          console.log(`  ✓ Created accommodation: ${hotelName}`);

          // Create rooms for this accommodation (4-6 room types)
          const numRoomTypes = Math.floor(Math.random() * 3) + 4; // 4-6 room types
          const selectedRoomTypes = getRandomItems(ROOM_TYPES, numRoomTypes);

          // Batch create rooms
          const roomsData = selectedRoomTypes.map(roomType => {
            const adjustedPrice = adjustPrice(
              roomType.basePrice,
              location,
              hotelType.suffix
            );

            return {
              accommodationId: accommodation.id,
              roomType: roomType.name,
              pricePerNight: adjustedPrice,
              capacity: roomType.capacity,
              mediaUrls: getRandomItems(ROOM_IMAGES, 2)
            };
          });

          await tx.room.createMany({
            data: roomsData
          });

          totalRooms += selectedRoomTypes.length;
          console.log(`    → Added ${selectedRoomTypes.length} room types`);
        }
      }

      console.log(`\n✅ Created ${totalAccommodations} accommodations with ${totalRooms} total room types\n`);

      // Add some reviews to make accommodations more realistic
      console.log('⭐ Creating sample reviews...');
      const allAccommodations = await tx.accommodation.findMany({
        include: { rooms: true }
      });

      let totalReviews = 0;
      const ratings = [3, 4, 4, 4, 5, 5, 5]; // Weighted towards positive ratings

      // Batch create reviews
      const reviewsData: Array<{
        reviewerId: string;
        reviewableType: string;
        accommodationId: number;
        rating: number;
        comment: string;
      }> = [];
      for (const accommodation of allAccommodations.slice(0, 15)) {
        // Add 2-5 reviews per accommodation
        const numReviews = Math.floor(Math.random() * 4) + 2;

        for (let i = 0; i < numReviews; i++) {
          const rating = ratings[Math.floor(Math.random() * ratings.length)];
          const comments = [
            'Great location and excellent service!',
            'Clean rooms and comfortable beds.',
            'Good value for money.',
            'Friendly staff and nice amenities.',
            'Would definitely stay here again!',
            'Perfect for families.',
            'Great breakfast options.'
          ];

          reviewsData.push({
            reviewerId: USER_ID,
            reviewableType: 'accommodation',
            accommodationId: accommodation.id,
            rating: rating,
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
      console.log(`  • Accommodations:  ${totalAccommodations}`);
      console.log(`  • Room Types:      ${totalRooms}`);
      console.log(`  • Reviews:         ${totalReviews}`);
      console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }, {
      maxWait: 10000, // 10 seconds max wait
      timeout: 30000, // 30 seconds timeout
    });

    console.log('✨ Transaction completed successfully!');
    console.log('🎉 All accommodation data has been seeded!\n');

    // Verify the data
    const counts = await Promise.all([
      prisma.accommodationProvider.count(),
      prisma.accommodation.count(),
      prisma.room.count(),
      prisma.review.count({ where: { reviewableType: 'accommodation' } })
    ]);

    console.log('✅ Verification:');
    console.log(`  • Total Accommodation Providers: ${counts[0]}`);
    console.log(`  • Total Accommodations: ${counts[1]}`);
    console.log(`  • Total Rooms: ${counts[2]}`);
    console.log(`  • Total Accommodation Reviews: ${counts[3]}\n`);

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
