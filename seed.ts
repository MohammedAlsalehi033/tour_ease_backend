import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Create Users
  const users = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      return prisma.user.create({
        data: {
          username: faker.internet.userName(),
          email: faker.internet.email(),
          passwordHash: faker.internet.password(),
          mediaUrls: [faker.image.url(), faker.image.url()],
          accountStatus: 'active',
          roles: {
            create: {
              role: {
                connectOrCreate: {
                  where: { roleName: 'user' },
                  create: { roleName: 'user' },
                },
              },
            },
          },
        },
      });
    })
  );

  // Create Questions
  const questions = await Promise.all(
    users.map(async (user) => {
      return prisma.question.create({
        data: {
          title: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          userId: user.id,
          tags: [faker.lorem.word(), faker.lorem.word()],
        },
      });
    })
  );

  // Create Comments
  await Promise.all(
    questions.map(async (question) => {
      return prisma.comment.create({
        data: {
          content: faker.lorem.paragraph(),
          userId: users[Math.floor(Math.random() * users.length)].id,
          questionId: question.id,
        },
      });
    })
  );

  // Create Transportation Providers
  const transportationProviders = await Promise.all(
    users.slice(0, 3).map(async (user) => {
      return prisma.transportationProvider.create({
        data: {
          providerId: user.id,
          licenseMmediaUrls: [faker.image.url(), faker.image.url()],
          vehicleMediaUrls: [faker.image.url(), faker.image.url()],
          vehicleType: faker.vehicle.type(),
          seatsAvailable: faker.number.int({ min: 1, max: 10 }),
        },
      });
    })
  );

  // Create Transportation Listings
  await Promise.all(
    transportationProviders.map(async (provider) => {
      return prisma.transportationListing.create({
        data: {
          providerId: provider.providerId,
          startLocation: faker.location.city(),
          endLocation: faker.location.city(),
          departureTime: faker.date.future(),
          pricePerSeat: faker.number.float({ min: 10, max: 100}),
          seatsAvailable: faker.number.int({ min: 1, max: 10 }),
          mediaUrls: [faker.image.url(), faker.image.url()],
        },
      });
    })
  );

  // Create Accommodation Providers
  const accommodationProviders = await Promise.all(
    users.slice(3, 6).map(async (user) => {
      return prisma.accommodationProvider.create({
        data: {
          providerId: user.id,
          accommodationName: faker.company.name(),
          address: faker.location.streetAddress(),
          contactNumber: faker.phone.number(),
          mediaUrls: [faker.image.url(), faker.image.url()],
        },
      });
    })
  );

  // Create Accommodations
  await Promise.all(
    accommodationProviders.map(async (provider) => {
      return prisma.accommodation.create({
        data: {
          providerId: provider.providerId,
          name: faker.company.name(),
          location: faker.location.city(),
          description: faker.lorem.paragraph(),
          mediaUrls: [faker.image.url(), faker.image.url()],
        },
      });
    })
  );

  // Create Rooms
  const accommodations = await prisma.accommodation.findMany();
  await Promise.all(
    accommodations.map(async (accommodation) => {
      return prisma.room.create({
        data: {
          accommodationId: accommodation.id,
          roomType: faker.helpers.arrayElement(['Single', 'Double', 'Suite']),
          pricePerNight: faker.number.float({ min: 50, max: 300}),
          capacity: faker.number.int({ min: 1, max: 4 }),
          mediaUrls: [faker.image.url(), faker.image.url()],
        },
      });
    })
  );

  console.log('Dummy data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });