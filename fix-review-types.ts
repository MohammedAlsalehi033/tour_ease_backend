/**
 * Update old review entries to use uppercase ACCOMMODATION instead of lowercase
 * Run with: npx ts-node fix-review-types.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixReviewTypes() {
  console.log('\n========== FIXING REVIEW TYPES ==========\n');

  try {
    // 1. Check current review types
    console.log('1. Checking current reviewableType values...');
    const reviewTypes = await prisma.$queryRaw<Array<{reviewableType: string, count: bigint}>>`
      SELECT "reviewableType", COUNT(*) as count
      FROM "Review"
      GROUP BY "reviewableType"
      ORDER BY count DESC;
    `;
    
    console.log('   Current review types:');
    reviewTypes.forEach(type => {
      console.log(`   - ${type.reviewableType}: ${type.count.toString()} reviews`);
    });

    // 2. Update lowercase 'accommodation' to uppercase 'ACCOMMODATION'
    console.log('\n2. Updating lowercase variants to uppercase...');
    
    const updates = [
      { from: 'accommodation', to: 'ACCOMMODATION' },
      { from: 'Accommodation', to: 'ACCOMMODATION' },
      { from: 'room', to: 'ROOM' },
      { from: 'Room', to: 'ROOM' },
      { from: 'transportation_listing', to: 'TRANSPORTATION_LISTING' },
      { from: 'transportation_booking', to: 'TRANSPORTATION_BOOKING' },
      { from: 'accommodation_booking', to: 'ACCOMMODATION_BOOKING' },
    ];

    for (const update of updates) {
      const result = await prisma.review.updateMany({
        where: { reviewableType: update.from },
        data: { reviewableType: update.to },
      });
      
      if (result.count > 0) {
        console.log(`   ✅ Updated ${result.count} reviews from '${update.from}' to '${update.to}'`);
      }
    }

    // 3. Check updated review types
    console.log('\n3. Checking updated reviewableType values...');
    const updatedTypes = await prisma.$queryRaw<Array<{reviewableType: string, count: bigint}>>`
      SELECT "reviewableType", COUNT(*) as count
      FROM "Review"
      GROUP BY "reviewableType"
      ORDER BY count DESC;
    `;
    
    console.log('   Updated review types:');
    updatedTypes.forEach(type => {
      console.log(`   - ${type.reviewableType}: ${type.count.toString()} reviews`);
    });

    console.log('\n========== UPDATE COMPLETED SUCCESSFULLY ==========\n');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixReviewTypes();
