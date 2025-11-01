import { PrismaClient } from '@prisma/client';
import { PlannerModel } from './src/models/planner/plannerModel';

const prisma = new PrismaClient();

async function testPlanner() {
  try {
    console.log('🧪 Testing Trip Planner with Frontend Request Format...\n');

    // Simulating frontend request
    const frontendRequest = {
      startLocation: "Islamabad, Pakistan",
      endLocation: "Lahore, Pakistan",
      startTime: "2025-11-15T00:00:00.000Z",
      endTime: "2025-11-22T00:00:00.000Z",
      interests: ["sightseeing", "museums & culture", "food & dining"],
      budget: 900000, // PKR (Pakistani Rupees)
      numberOfTravelers: 2,
      needsReturnTransport: true,
      useAIOptimization: false,
      maxIterations: 3,
      preferredTransportMode: "Air" as const,
      specialRequirements: "Need hotel with gym access"
    };

    console.log('📋 Frontend Request:');
    console.log(JSON.stringify(frontendRequest, null, 2));
    console.log('\n🔄 Processing...\n');

    // Convert to backend format (simulating controller logic)
    const backendRequest = {
      startLocation: frontendRequest.startLocation.split(',')[0].trim(),
      endLocation: frontendRequest.endLocation.split(',')[0].trim(),
      startTime: new Date(frontendRequest.startTime),
      endTime: new Date(frontendRequest.endTime),
      interests: frontendRequest.interests,
      budget: frontendRequest.budget,
      numberOfTravelers: frontendRequest.numberOfTravelers,
      needsReturnTransport: frontendRequest.needsReturnTransport
    };

    console.log('💰 Budget Information:');
    console.log(`   Budget: ${backendRequest.budget.toLocaleString()} PKR`);
    console.log(`   Per Person: ${(backendRequest.budget / backendRequest.numberOfTravelers).toLocaleString()} PKR`);
    
    const nights = Math.ceil(
      (backendRequest.endTime.getTime() - backendRequest.startTime.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(`   Duration: ${nights} nights`);
    console.log(`   Per Night Budget: ${(backendRequest.budget / nights).toLocaleString()} PKR\n`);

    const result = await PlannerModel.generateTripPlans(backendRequest);

    // Filter by gym requirement (simulating controller logic)
    let accommodationsWithGym = result.availableOptions.accommodations;
    if (frontendRequest.specialRequirements?.toLowerCase().includes('gym')) {
      accommodationsWithGym = result.availableOptions.accommodations.filter(
        acc => acc.description?.toLowerCase().includes('gym') || 
               acc.description?.toLowerCase().includes('fitness') ||
               acc.name?.toLowerCase().includes('gym')
      );
      console.log(`🏋️ Hotels with Gym: ${accommodationsWithGym.length}/${result.availableOptions.accommodations.length}\n`);
    }

    console.log('📊 Results Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Available Outbound Transport Options: ${result.availableOptions.outboundTransportation.length}`);
    console.log(`Available Return Transport Options: ${result.availableOptions.returnTransportation.length}`);
    console.log(`Available Accommodations (Total): ${result.availableOptions.accommodations.length}`);
    console.log(`Available Accommodations (Matching): ${accommodationsWithGym.length}`);
    console.log(`Available Activities: ${result.availableOptions.activities.length}`);
    console.log(`Recommended Plans: ${result.recommendedPlans.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (accommodationsWithGym.length > 0) {
      console.log('🏨 Top 3 Accommodations (PKR):');
      accommodationsWithGym.slice(0, 3).forEach((acc, idx) => {
        console.log(`\n${idx + 1}. ${acc.name}`);
        console.log(`   Location: ${acc.location}`);
        console.log(`   Total: ${acc.totalCost.toLocaleString()} PKR`);
        console.log(`   Per Night: ${(acc.totalCost / nights).toLocaleString()} PKR`);
        console.log(`   Rating: ${acc.avgRating ? acc.avgRating.toFixed(1) + ' ⭐' : 'N/A'}`);
        console.log(`   Description: ${acc.description}`);
        console.log(`   Rooms:`);
        acc.roomAllocations.forEach(room => {
          console.log(`     - ${room.numberOfRooms}x ${room.roomType} (${room.guestsAllocated} guests)`);
          console.log(`       ${room.pricePerNight.toLocaleString()} PKR/night × ${nights} nights = ${room.totalCost.toLocaleString()} PKR`);
        });
      });
    }

    if (result.optimalPlan) {
      console.log('\n⭐ Optimal Plan (PKR):');
      console.log(`   Plan: ${result.optimalPlan.planName}`);
      console.log(`   Transportation: ${result.optimalPlan.costs.transportation.toLocaleString()} PKR`);
      console.log(`   Accommodation: ${result.optimalPlan.costs.accommodation.toLocaleString()} PKR`);
      console.log(`   Activities: ${result.optimalPlan.costs.activities.toLocaleString()} PKR`);
      console.log(`   Total: ${result.optimalPlan.costs.total.toLocaleString()} PKR`);
      console.log(`   Budget: ${backendRequest.budget.toLocaleString()} PKR`);
      console.log(`   Remaining: ${(backendRequest.budget - result.optimalPlan.costs.total).toLocaleString()} PKR`);
      console.log(`   Within Budget: ${result.optimalPlan.costs.total <= backendRequest.budget ? '✅ Yes' : '❌ No'}`);
      console.log(`   Score: ${(result.optimalPlan.optimizationScore).toFixed(1)}`);
      console.log(`   Warnings: ${result.optimalPlan.warnings.length > 0 ? result.optimalPlan.warnings.join(', ') : 'None'}`);
    }

    console.log('\n✅ Test completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPlanner();
