import { PrismaClient } from '@prisma/client';
import { PlannerModel } from './src/models/planner/plannerModel';

const prisma = new PrismaClient();

async function testItineraryPlanner() {
  try {
    console.log('🧪 Testing Itinerary Planner...\n');

    // Use dates starting 2 days from now
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 2);
    startDate.setHours(9, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3); // 3 nights, 4 days
    endDate.setHours(18, 0, 0, 0);
    
    const request = {
      userId: 'xeSEu67NIjZjSj92CIMjVixNQPr2',
      startLocation: 'Islamabad, Pakistan',
      endLocation: 'Lahore City, Pakistan',
      startTime: startDate,
      endTime: endDate,
      interests: ['culture', 'food', 'shopping'],
      budget: 150000, // PKR
      numberOfTravelers: 2,
      specialRequirements: []
    };

    console.log('📋 Request Details:');
    console.log(`  From: ${request.startLocation}`);
    console.log(`  To: ${request.endLocation}`);
    console.log(`  Dates: ${request.startTime.toISOString().split('T')[0]} to ${request.endTime.toISOString().split('T')[0]}`);
    console.log(`  Budget: ${request.budget.toLocaleString()} PKR`);
    console.log(`  Travelers: ${request.numberOfTravelers}`);
    console.log(`  Interests: ${request.interests.join(', ')}\n`);

    const result = await PlannerModel.generateTripPlans(request);

    console.log('✅ TRIP PLAN GENERATED\n');
    console.log('='.repeat(80));

    // Transportation Options
    console.log('\n🚌 TRANSPORTATION OPTIONS\n');
    console.log('Outbound (Islamabad → Lahore):');
    result.transportationOptions.outbound.forEach((transport, idx) => {
      console.log(`  ${idx + 1}. ${transport.providerName} - ${transport.vehicleType}`);
      console.log(`     Departure: ${new Date(transport.departureTime).toLocaleString()}`);
      console.log(`     Price: ${transport.pricePerSeat.toLocaleString()} PKR/seat`);
      console.log(`     Total: ${(transport.pricePerSeat * request.numberOfTravelers).toLocaleString()} PKR`);
      console.log(`     Rating: ${transport.avgRating || 'N/A'} ⭐`);
      console.log();
    });

    console.log('\nReturn (Lahore → Islamabad):');
    result.transportationOptions.return.forEach((transport, idx) => {
      console.log(`  ${idx + 1}. ${transport.providerName} - ${transport.vehicleType}`);
      console.log(`     Departure: ${new Date(transport.departureTime).toLocaleString()}`);
      console.log(`     Price: ${transport.pricePerSeat.toLocaleString()} PKR/seat`);
      console.log(`     Total: ${(transport.pricePerSeat * request.numberOfTravelers).toLocaleString()} PKR`);
      console.log(`     Rating: ${transport.avgRating || 'N/A'} ⭐`);
      console.log();
    });

    // Accommodation Options
    console.log('\n🏨 ACCOMMODATION OPTIONS\n');
    result.accommodationOptions.forEach((accommodation, idx) => {
      console.log(`  ${idx + 1}. ${accommodation.name}`);
      console.log(`     Location: ${accommodation.location}`);
      console.log(`     Rating: ${accommodation.avgRating || 'N/A'} ⭐`);
      console.log(`     Nights: ${accommodation.numberOfNights}`);
      console.log(`     Rooms: ${accommodation.roomAllocations.length} type(s)`);
      accommodation.roomAllocations.forEach(room => {
        console.log(`       - ${room.roomType} (${room.numberOfRooms}x): ${room.pricePerNight.toLocaleString()} PKR/night`);
      });
      console.log(`     Total Cost: ${accommodation.totalCost.toLocaleString()} PKR`);
      console.log();
    });

    // Day-by-Day Itinerary
    console.log('\n📅 DAY-BY-DAY ITINERARY\n');
    result.itinerary.forEach(day => {
      console.log(`DAY ${day.day}: ${day.dayOfWeek}, ${day.date}`);
      console.log(`Theme: ${day.theme || 'Exploration'}`);
      console.log(`Duration: ${Math.floor(day.totalDuration / 60)}h ${day.totalDuration % 60}m | Cost: ${day.totalEstimatedCost.toLocaleString()} PKR\n`);
      
      day.activities.forEach(activity => {
        console.log(`  ⏰ ${activity.time} (${activity.duration}min) - ${activity.title}`);
        console.log(`     📍 ${activity.location.name}${activity.location.address ? ', ' + activity.location.address : ''}`);
        console.log(`     💵 ${activity.estimatedCost.toLocaleString()} PKR`);
        
        // Display Google Places data if available
        if (activity.placeDetails) {
          console.log(`     --- Google Places Data ---`);
          
          if (activity.placeDetails.rating) {
            console.log(`     ⭐ Rating: ${activity.placeDetails.rating}/5 (${activity.placeDetails.userRatingsTotal || 0} reviews)`);
          }
          
          if (activity.placeDetails.priceLevel !== undefined) {
            const priceSymbols = '₨'.repeat(activity.placeDetails.priceLevel + 1);
            console.log(`     💰 Price Level: ${priceSymbols}`);
          }
          
          if (activity.placeDetails.openingHours) {
            console.log(`     🕐 Open Now: ${activity.placeDetails.openingHours.openNow ? 'Yes ✓' : 'No ✗'}`);
            if (activity.placeDetails.openingHours.weekdayText && activity.placeDetails.openingHours.weekdayText.length > 0) {
              const dayOfWeek = new Date(day.date).getDay();
              console.log(`     Hours Today: ${activity.placeDetails.openingHours.weekdayText[dayOfWeek]}`);
            }
          }
          
          if (activity.placeDetails.website) {
            console.log(`     🌐 Website: ${activity.placeDetails.website}`);
          }
          
          if (activity.placeDetails.phoneNumber) {
            console.log(`     📞 Phone: ${activity.placeDetails.phoneNumber}`);
          }
          
          if (activity.placeDetails.photos && activity.placeDetails.photos.length > 0) {
            console.log(`     📸 Photos (${activity.placeDetails.photos.length}):`);
            activity.placeDetails.photos.slice(0, 2).forEach((photo, i) => {
              console.log(`        ${i + 1}. ${photo}`);
            });
          }
          
          if (activity.placeDetails.reviews && activity.placeDetails.reviews.length > 0) {
            console.log(`     💬 Top Review:`);
            const review = activity.placeDetails.reviews[0];
            console.log(`        ⭐ ${review.rating}/5 by ${review.author}`);
            const reviewText = review.text.length > 100 ? review.text.substring(0, 100) + '...' : review.text;
            console.log(`        "${reviewText}"`);
          }
        }
        
        if (activity.mapUrl) {
          console.log(`     🗺️  ${activity.mapUrl}`);
        }
        if (activity.tips) {
          console.log(`     💡 ${activity.tips}`);
        }
        if (activity.bookingRequired) {
          console.log(`     ⚠️  Booking required`);
        }
        console.log();
      });
      console.log('-'.repeat(80));
      console.log();
    });

    // Trip Summary
    console.log('\n💰 TRIP SUMMARY\n');
    console.log(`Total Duration: ${result.tripSummary.totalDays} days, ${result.tripSummary.totalNights} nights`);
    console.log(`\nEstimated Costs:`);
    console.log(`  Transportation: ${result.tripSummary.estimatedTotalCost.transportation.toLocaleString()} PKR`);
    console.log(`  Accommodation:  ${result.tripSummary.estimatedTotalCost.accommodation.toLocaleString()} PKR`);
    console.log(`  Activities:     ${result.tripSummary.estimatedTotalCost.activities.toLocaleString()} PKR`);
    console.log(`  Meals:          ${result.tripSummary.estimatedTotalCost.meals.toLocaleString()} PKR`);
    console.log(`  ───────────────────────────────`);
    console.log(`  TOTAL:          ${result.tripSummary.estimatedTotalCost.total.toLocaleString()} PKR`);
    console.log(`\nBudget: ${request.budget.toLocaleString()} PKR`);
    console.log(`Remaining: ${result.tripSummary.remainingBudget.toLocaleString()} PKR`);
    console.log(`Status: ${result.tripSummary.budgetStatus.toUpperCase()}`);
    
    const usagePercent = ((result.tripSummary.estimatedTotalCost.total / request.budget) * 100).toFixed(1);
    console.log(`Budget Usage: ${usagePercent}%`);

    console.log('\n' + '='.repeat(80));
    console.log('✨ Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testItineraryPlanner();
