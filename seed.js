"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const prisma = new client_1.PrismaClient();
async function main() {
    // Create Users
    const users = await Promise.all(Array.from({ length: 10 }).map(async () => {
        return prisma.user.create({
            data: {
                username: faker_1.faker.internet.userName(),
                email: faker_1.faker.internet.email(),
                passwordHash: faker_1.faker.internet.password(),
                mediaUrls: [faker_1.faker.image.url(), faker_1.faker.image.url()],
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
    }));
    // Create Questions
    const questions = await Promise.all(users.map(async (user) => {
        return prisma.question.create({
            data: {
                title: faker_1.faker.lorem.sentence(),
                description: faker_1.faker.lorem.paragraph(),
                userId: user.id,
                tags: [faker_1.faker.lorem.word(), faker_1.faker.lorem.word()],
            },
        });
    }));
    // Create Comments
    await Promise.all(questions.map(async (question) => {
        return prisma.comment.create({
            data: {
                content: faker_1.faker.lorem.paragraph(),
                userId: users[Math.floor(Math.random() * users.length)].id,
                questionId: question.id,
            },
        });
    }));
    // Create Transportation Providers
    const transportationProviders = await Promise.all(users.slice(0, 3).map(async (user) => {
        return prisma.transportationProvider.create({
            data: {
                providerId: user.id,
                licenseMmediaUrls: [faker_1.faker.image.url(), faker_1.faker.image.url()],
                vehicleMediaUrls: [faker_1.faker.image.url(), faker_1.faker.image.url()],
                vehicleType: faker_1.faker.vehicle.type(),
                seatsAvailable: faker_1.faker.number.int({ min: 1, max: 10 }),
            },
        });
    }));
    // Create Transportation Listings
    await Promise.all(transportationProviders.map(async (provider) => {
        return prisma.transportationListing.create({
            data: {
                providerId: provider.providerId,
                startLocation: faker_1.faker.location.city(),
                endLocation: faker_1.faker.location.city(),
                departureTime: faker_1.faker.date.future(),
                pricePerSeat: faker_1.faker.number.float({ min: 10, max: 100 }),
                seatsAvailable: faker_1.faker.number.int({ min: 1, max: 10 }),
                mediaUrls: [faker_1.faker.image.url(), faker_1.faker.image.url()],
            },
        });
    }));
    // Create Accommodation Providers
    const accommodationProviders = await Promise.all(users.slice(3, 6).map(async (user) => {
        return prisma.accommodationProvider.create({
            data: {
                providerId: user.id,
                accommodationName: faker_1.faker.company.name(),
                address: faker_1.faker.location.streetAddress(),
                contactNumber: faker_1.faker.phone.number(),
                mediaUrls: [faker_1.faker.image.url(), faker_1.faker.image.url()],
            },
        });
    }));
    // Create Accommodations
    await Promise.all(accommodationProviders.map(async (provider) => {
        return prisma.accommodation.create({
            data: {
                providerId: provider.providerId,
                name: faker_1.faker.company.name(),
                location: faker_1.faker.location.city(),
                description: faker_1.faker.lorem.paragraph(),
                mediaUrls: [faker_1.faker.image.url(), faker_1.faker.image.url()],
            },
        });
    }));
    // Create Rooms
    const accommodations = await prisma.accommodation.findMany();
    await Promise.all(accommodations.map(async (accommodation) => {
        return prisma.room.create({
            data: {
                accommodationId: accommodation.id,
                roomType: faker_1.faker.helpers.arrayElement(['Single', 'Double', 'Suite']),
                pricePerNight: faker_1.faker.number.float({ min: 50, max: 300 }),
                capacity: faker_1.faker.number.int({ min: 1, max: 4 }),
                mediaUrls: [faker_1.faker.image.url(), faker_1.faker.image.url()],
            },
        });
    }));
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
