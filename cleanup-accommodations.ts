import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting cleanup of seeded accommodation data...\n');

  try {
    await prisma.$transaction(async (tx) => {
      console.log('📝 Transaction started...\n');

      // Find all providers created by our seed (they have specific email pattern)
      const seededProviders = await tx.accommodationProvider.findMany({
        where: {
          user: {
            email: {
              contains: '@tourease.com'
            }
          }
        },
        select: {
          providerId: true,
          accommodationName: true
        }
      });

      if (seededProviders.length === 0) {
        console.log('ℹ️  No seeded data found to clean up.\n');
        return;
      }

      console.log(`Found ${seededProviders.length} seeded providers to delete:\n`);
      seededProviders.forEach(p => console.log(`  - ${p.accommodationName}`));
      console.log('');

      const providerIds = seededProviders.map(p => p.providerId);

      // Delete in correct order due to foreign key constraints
      
      // 1. Delete reviews for accommodations
      const deletedReviews = await tx.review.deleteMany({
        where: {
          accommodation: {
            providerId: {
              in: providerIds
            }
          }
        }
      });
      console.log(`✓ Deleted ${deletedReviews.count} reviews`);

      // 2. Delete rooms (this will cascade delete bookings)
      const deletedRooms = await tx.room.deleteMany({
        where: {
          accommodation: {
            providerId: {
              in: providerIds
            }
          }
        }
      });
      console.log(`✓ Deleted ${deletedRooms.count} rooms`);

      // 3. Delete accommodations
      const deletedAccommodations = await tx.accommodation.deleteMany({
        where: {
          providerId: {
            in: providerIds
          }
        }
      });
      console.log(`✓ Deleted ${deletedAccommodations.count} accommodations`);

      // 4. Delete accommodation providers
      const deletedProviders = await tx.accommodationProvider.deleteMany({
        where: {
          providerId: {
            in: providerIds
          }
        }
      });
      console.log(`✓ Deleted ${deletedProviders.count} accommodation providers`);

      // 5. Delete the user accounts created for providers
      const deletedUsers = await tx.user.deleteMany({
        where: {
          id: {
            in: providerIds
          }
        }
      });
      console.log(`✓ Deleted ${deletedUsers.count} provider user accounts`);

      console.log('\n📊 Cleanup Summary:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Reviews deleted:       ${deletedReviews.count}`);
      console.log(`Rooms deleted:         ${deletedRooms.count}`);
      console.log(`Accommodations:        ${deletedAccommodations.count}`);
      console.log(`Providers:             ${deletedProviders.count}`);
      console.log(`User accounts:         ${deletedUsers.count}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    console.log('✨ Cleanup completed successfully!\n');

    // Verify
    const remainingCount = await prisma.accommodationProvider.count();
    console.log(`✅ Remaining accommodation providers in database: ${remainingCount}\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanup()
  .then(() => {
    console.log('👋 Cleanup script finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });
