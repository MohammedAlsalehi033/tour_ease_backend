import { prisma } from "../../utils/prismaClient";

export class AdminModel {

    async getTransportationProvidersByStatus(status = "pending") {
        return await prisma.transportationProvider.findMany({
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