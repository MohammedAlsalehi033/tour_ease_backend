import { prisma } from "../../utils/prismaClient";

export class AdminModel {

    

    async getUserById(id: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: id },
                include: {
                    roles: {
                        include: {
                            role: true,
                        }
                    },
                    transportationProvider: {
                        include: {
                            listings: true,
                        }
                    },
                    accommodationProvider: {
                        include: {
                            accommodations: true,
                        }
                    },
                    transportationBookings: {
                        include: {
                            listing: true,
                            request: true,
                            reviews: true,
                            offer: true,
                        }
                    },
                    accommodationBookings: {
                        include: {
                             room: true,
                             payment: true,
                             reviews: true,
                        }
                    },
                    sentMessages: true,
                    receivedMessages: true,
                    notifications: true,
                    reviews: true,
                    trips: {
                        include: {
                            activities: true,
                        }
                    },
                    questions: {
                         include: {
                            comments: true,
                            vote: true,
                         }
                    },
                    comments: true,
                    sentOffers: {
                         include: {
                            listing: true,
                            request: true,
                            bookings: true,
                            recipient: false,
                            sender: false
                         }
                    },
                    receivedOffers: {
                         include: {
                            listing: true,
                            request: true,
                            bookings: true,
                            recipient: false,
                            sender: false
                         }
                    },
                    traveler: true,
                    admin: true,
                    Vote: true,
                    TransportationRequest: {
                        include: {
                            bookings: true,
                            offers: true,
                        }
                    }
                }
            });
            return user;
        } catch (error) {
            console.error("Error fetching user by ID:", error);
            throw new Error(`Failed to fetch user with ID ${id}`);
        }
    }

    async blockUser(id: string) {
         try {
             const updatedUser = await prisma.user.update({
                 where: { id: id },
                 data: { accountStatus: 'blocked' },
             });
             return updatedUser;
         } catch (error) {
             console.error("Error blocking user:", error);
             throw new Error(`Failed to block user with ID ${id}`);
         }
     }


    async getTransportationProvidersByStatus(status = "pending", page : number, pageSize : number) {
        const skip = (page - 1) * pageSize;

        return await prisma.transportationProvider.findMany({
        skip: skip,
        take: pageSize,
            where: {
                accountStatus: status
            },
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    
    }

  
    async getTransportationProviderById(providerId: string) {
        return await prisma.transportationProvider.findUnique({
            where: {
                providerId
            },
            include: {
                user: true
            }
        });
    }


    async updateTransportationProviderStatus(providerId: string, status: string) {
        return await prisma.transportationProvider.update({
            where: {
                providerId
            },
            data: {
                accountStatus: status
            }
        });
    }


    async getPendingAccommodationProviders() {
        return await prisma.accommodationProvider.findMany({
            where: {
                user: {
                    accountStatus: "pending"
                }
            },
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    }

  
    async getAccommodationProviderById(providerId: string) {
        return await prisma.accommodationProvider.findUnique({
            where: {
                providerId
            },
            include: {
                user: true
            }
        });
    }


    async updateAccommodationProviderStatus(providerId: string, status: string) {
        return await prisma.user.update({
            where: {
                id: providerId
            },
            data: {
                accountStatus: status
            }
        });
    }

    
}