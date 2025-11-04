import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_ID = 'xeSEu67NIjZjSj92CIMjVixNQPr2';

// Pakistani cities - Islamabad and Lahore
const LOCATIONS = [
  'Islamabad',
  'Lahore'
];

const ACCOMMODATION_TYPES = [
  { suffix: 'Serena Hotel', description: 'Five-star luxury hotel with world-class amenities and service' },
  { suffix: 'Pearl Continental', description: 'Premium hotel offering exceptional comfort and hospitality' },
  { suffix: 'Marriott Hotel', description: 'International luxury hotel with modern facilities' },
  { suffix: 'Avari Hotel', description: 'Elegant hotel known for excellent service and comfort' },
  { suffix: 'Ramada Plaza', description: 'Contemporary mid-range hotel with great amenities' },
  { suffix: 'Best Western', description: 'Comfortable and affordable accommodation' },
  { suffix: 'Hospitality Inn', description: 'Budget-friendly hotel with essential amenities' },
  { suffix: 'Grand Palace', description: 'Traditional Pakistani hospitality with modern comforts' },
  { suffix: 'Ambassador Hotel', description: 'Well-appointed hotel in prime location' },
  { suffix: 'Royal Suites', description: 'Luxurious suites with panoramic city views' }
];

const ROOM_TYPES = [
  { name: 'Standard Single', capacity: 1, basePrice: 8000 },  // PKR
  { name: 'Standard Double', capacity: 2, basePrice: 12000 },
  { name: 'Deluxe Room', capacity: 2, basePrice: 15000 },
  { name: 'Twin Deluxe', capacity: 2, basePrice: 16000 },
  { name: 'Executive Room', capacity: 2, basePrice: 20000 },
  { name: 'Junior Suite', capacity: 3, basePrice: 25000 },
  { name: 'Family Suite', capacity: 4, basePrice: 35000 },
  { name: 'Executive Suite', capacity: 3, basePrice: 40000 },
  { name: 'Presidential Suite', capacity: 4, basePrice: 75000 },
  { name: 'Royal Suite', capacity: 5, basePrice: 100000 }
];

// Sample media URLs for accommodations and rooms
const ACCOMMODATION_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
  'https://images.unsplash.com/photo-1455587734955-081b22074882'
];

const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1590490360182-c33d57733427',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
];

// Helper function to generate phone number (Pakistan format)
function generatePhoneNumber(): string {
  return `+92 ${Math.floor(Math.random() * 90) + 300} ${Math.floor(Math.random() * 9000000 + 1000000)}`;
}

// Helper function to generate address
function generateAddress(location: string, index: number): string {
  const islamabadAreas = ['Blue Area', 'F-7 Markaz', 'F-6/3', 'G-5/2', 'E-11', 'I-8 Markaz', 'Constitution Avenue'];
  const lahoreAreas = ['Gulberg', 'DHA Phase 5', 'Mall Road', 'Canal Road', 'MM Alam Road', 'Ferozepur Road', 'Liberty Market'];
  
  const areas = location === 'Islamabad' ? islamabadAreas : lahoreAreas;
  const area = areas[index % areas.length];
  const building = Math.floor(Math.random() * 200 + 1);
  
  return `Building ${building}, ${area}, ${location}`;
}

// Helper function to get random items from array
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to adjust price based on location and type
function adjustPrice(basePrice: number, location: string, hotelType: string): number {
  let multiplier = 1.0;
  
  // Islamabad tends to be slightly more expensive
  if (location === 'Islamabad') {
    multiplier += 0.15;
  }
  
  // Hotel type adjustments
  if (hotelType.includes('Serena') || hotelType.includes('Marriott') || hotelType.includes('Pearl Continental')) {
    multiplier += 0.6;
  } else if (hotelType.includes('Avari') || hotelType.includes('Royal')) {
    multiplier += 0.4;
  } else if (hotelType.includes('Ramada') || hotelType.includes('Ambassador')) {
    multiplier += 0.2;
  } else if (hotelType.includes('Best Western') || hotelType.includes('Hospitality')) {
    multiplier -= 0.2;
  }
  
  return Math.round(basePrice * multiplier);
}

async function main() {
  console.log('🚀 Starting accommodation seeding for Islamabad & Lahore...\n');

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

      // Create accommodation providers
      console.log('🏢 Creating accommodation providers...');
      const providers: Array<{ provider: any; location: string }> = [];

      for (let i = 0; i < LOCATIONS.length; i++) {
        const location = LOCATIONS[i];
        const providerId = `provider_${location.toLowerCase()}_${Date.now()}_${i}`;
        
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

      // Create accommodations (5-7 per city for variety)
      console.log('🏨 Creating accommodations...');
      let totalAccommodations = 0;
      let totalRooms = 0;

      for (const { provider, location } of providers) {
        const numAccommodations = Math.floor(Math.random() * 3) + 5; // 5-7 accommodations per city

        for (let i = 0; i < numAccommodations; i++) {
          const hotelType = ACCOMMODATION_TYPES[i % ACCOMMODATION_TYPES.length];
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

          // Create rooms for this accommodation (5-8 room types)
          const numRoomTypes = Math.floor(Math.random() * 4) + 5; // 5-8 room types
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

      // Add reviews to make accommodations more realistic
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

      for (const accommodation of allAccommodations) {
        // Add 3-6 reviews per accommodation
        const numReviews = Math.floor(Math.random() * 4) + 3;

        for (let i = 0; i < numReviews; i++) {
          const rating = ratings[Math.floor(Math.random() * ratings.length)];
          const comments = [
            'Excellent hospitality and beautiful rooms!',
            'Great location, very convenient for business and leisure.',
            'Clean and comfortable with friendly staff.',
            'Perfect Pakistani hospitality, highly recommended!',
            'Amazing food at the restaurant, will stay again.',
            'Beautiful views and top-notch service.',
            'Very professional staff and well-maintained property.',
            'Ideal for families, spacious rooms and good facilities.',
            'Great value for money, exceeded expectations!',
            'Convenient location with easy access to main areas.'
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

    // Show breakdown by city
    const byCity = await prisma.accommodation.groupBy({
      by: ['location'],
      _count: {
        id: true
      }
    });

    console.log('🏙️ Accommodations by City:');
    byCity.forEach(city => {
      console.log(`  • ${city.location}: ${city._count.id} accommodations`);
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
