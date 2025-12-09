
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReviews() {
  const reviewerId = 'xeSEu67NIjZjSj92CIMjVixNQPr2'; // Using the traveler from the bookings found

  console.log(`Seeding reviews for user: ${reviewerId}`);

  // --- 1. Transportation Review ---
  const transportBookingId = 66;
  // const transportListingId = 961;
  // const transportProviderId = 'CUmHBhvF1BQBvpHdtRwN1Gf4tlO2';

  console.log('\n--- Seeding Transportation Reviews ---');
  
  // Check if already reviewed
  const existingTransportReview = await prisma.review.findFirst({
    where: {
      reviewerId,
      reviewableType: 'TRANSPORTATION_BOOKING',
      transportationBookingId: transportBookingId
    }
  });

  if (existingTransportReview) {
    console.log('Transportation booking already reviewed.');
  } else {
    console.log('Creating reviews for Transportation Booking ID:', transportBookingId);
    
    // 1. Review for Booking
    const bookingReview = await prisma.review.create({
      data: {
        reviewerId,
        reviewableType: 'TRANSPORTATION_BOOKING',
        transportationBookingId: transportBookingId,
        rating: 5,
        comment: "Excellent service, very punctual!",
      }
    });
    console.log('Created Booking Review:', bookingReview.id);

    // 2. Review for Provider
    // Note: The current implementation in ReviewController/ReviewModel seems to create a review 
    // with reviewableType='TRANSPORTATION_PROVIDER' but without linking it to the provider ID in the database.
    // We will replicate this behavior.
    const driverReview = await prisma.review.create({
      data: {
        reviewerId,
        reviewableType: 'TRANSPORTATION_PROVIDER',
        // No providerId field in Review model
        rating: 5,
        comment: "Driver was very professional.",
      }
    });
    console.log('Created Driver Review:', driverReview.id);
  }

  // --- 2. Accommodation Review ---
  const accommodationBookingId = 37;
  const accommodationId = 49;

  console.log('\n--- Seeding Accommodation Reviews ---');

  const existingAccommodationReview = await prisma.review.findFirst({
    where: {
      reviewerId,
      reviewableType: 'ACCOMMODATION',
      accommodationId: accommodationId,
      accommodationBookingId: accommodationBookingId
    }
  });

  if (existingAccommodationReview) {
    console.log('Accommodation already reviewed.');
  } else {
    console.log('Creating reviews for Accommodation Booking ID:', accommodationBookingId);

    // 1. Review for Accommodation
    const accommodationReview = await prisma.review.create({
      data: {
        reviewerId,
        reviewableType: 'ACCOMMODATION',
        accommodationId: accommodationId,
        accommodationBookingId: accommodationBookingId,
        rating: 4,
        comment: "Nice stay, clean room.",
      }
    });
    console.log('Created Accommodation Review:', accommodationReview.id);

    // 2. Review for Accommodation Booking
    const bookingReview = await prisma.review.create({
      data: {
        reviewerId,
        reviewableType: 'ACCOMMODATION_BOOKING',
        accommodationBookingId: accommodationBookingId,
        rating: 4,
        comment: "Booking process was smooth.",
      }
    });
    console.log('Created Accommodation Booking Review:', bookingReview.id);
  }
}

seedReviews()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
