import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
  transactionOptions: {
    maxWait: 10000,
    timeout: 30000
  }
});

async function reseedTransport() {
  try {
    console.log('🗑️  Deleting old transportation listings...');
    await prisma.transportationListing.deleteMany({});
    console.log('✅ Old listings deleted\n');

    console.log('🚌 Creating new transportation listings...');
    
    // Get existing providers
    const providers = await prisma.transportationProvider.findMany({
      select: { providerId: true, vehicleType: true }
    });

    if (providers.length === 0) {
      console.log('❌ No providers found! Run seed-pakistan-transportation.ts first');
      return;
    }

    const routes = [
      { start: 'Islamabad, Pakistan', end: 'Lahore City, Pakistan' },
      { start: 'Lahore City, Pakistan', end: 'Islamabad, Pakistan' }
    ];

    const vehicleTypes = ['Bus', 'Van', 'Car', 'Minibus'];
    const timeSlots = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    
    // Seed for next 60 days
    const listings: any[] = [];
    const today = new Date();
    
    for (let day = 0; day < 60; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      
      for (const route of routes) {
        for (const timeSlot of timeSlots) {
          // 2-3 providers per time slot
          const numProviders = 2 + Math.floor(Math.random() * 2);
          const selectedProviders = providers
            .sort(() => Math.random() - 0.5)
            .slice(0, numProviders);
          
          for (const provider of selectedProviders) {
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const departureTime = new Date(date);
            departureTime.setHours(hours, minutes, 0, 0);
            
            const pricePerSeat = 1500 + Math.floor(Math.random() * 4500); // 1500-6000 PKR
            const seatsAvailable = 20 + Math.floor(Math.random() * 30); // 20-50 seats
            
            listings.push({
              providerId: provider.providerId,
              startLocationText: route.start,
              startLocationLat: route.start.includes('Islamabad') ? 33.6844 : 31.5204,
              startLocationLng: route.start.includes('Islamabad') ? 73.0479 : 74.3587,
              endLocationText: route.end,
              endLocationLat: route.end.includes('Lahore') ? 31.5204 : 33.6844,
              endLocationLng: route.end.includes('Lahore') ? 74.3587 : 73.0479,
              departureTime,
              pricePerSeat,
              seatsAvailable,
              luggage: 2,
              mediaUrls: [],
              status: 'active'
            });
          }
        }
      }
    }

    console.log(`Creating ${listings.length} transportation listings...`);
    
    // Batch create in chunks of 100
    for (let i = 0; i < listings.length; i += 100) {
      const chunk = listings.slice(i, i + 100);
      await prisma.transportationListing.createMany({
        data: chunk
      });
      console.log(`  Created ${Math.min(i + 100, listings.length)}/${listings.length}`);
    }

    console.log(`\n✅ Successfully created ${listings.length} transportation listings!`);
    console.log(`   - ${listings.length / 2} Islamabad → Lahore`);
    console.log(`   - ${listings.length / 2} Lahore → Islamabad`);
    console.log(`   - ${timeSlots.length} time slots per day`);
    console.log(`   - 60 days of availability`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

reseedTransport();
