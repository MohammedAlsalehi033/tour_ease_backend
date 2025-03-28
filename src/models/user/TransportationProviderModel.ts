import { UserRole } from '../../Types/myEnum';
import { prisma } from '../../utils/prismaClient';
import { TransportationProvider } from './../../../node_modules/.prisma/client/index.d';



export default class TransportationProviderModel {

    async createTransportationProvider(
        id: string,
        role: UserRole,
        licenseMmediaUrls: string[],
        vehicleMediaUrls: string[],
        seatsAvailable: number,
        vehicleType: string
    ): Promise<TransportationProvider> {
        try {
            const roleRecord = await prisma.role.findUnique({
                where: {
                    roleName: role,
                },
            });

            if (!roleRecord) {
                throw new Error(`Role   '${role}' not found`);
            }

            const user = await prisma.user.findUnique({
                where: {
                    id,
                },
                include: {}
            });

            if (!user) {
                throw new Error(`User with id ${id} doesnot exists`);
            }



            const newTrasportationProvider = await prisma.$transaction(async (prisma : any) => {
                const transportationProvider = await prisma.transportationProvider.create({
                    data: {
                        providerId: id,
                        licenseMmediaUrls: licenseMmediaUrls,
                        vehicleMediaUrls: vehicleMediaUrls,
                        vehicleType: vehicleType,
                        seatsAvailable: parseInt(seatsAvailable.toString()) ,
                    },
                });

                await prisma.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: roleRecord.id,
                    },
                });

                return transportationProvider
                    ;
            });


            return await newTrasportationProvider;


        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }




    }

async getTransportationProviderById(id: string): Promise<TransportationProvider> {
        try {
            const transportationProvider = await prisma.transportationProvider.findUnique({
                where: {
                    providerId:id,
                },
            });

            return transportationProvider;
        } catch (error) {
            console.error("Error getting transportation provider:", error);
            throw error;
        }
    }

    async getUserById(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        passwordHash: string;
        mediaUrls: string[];
        accountStatus: string;
        createdAt: Date;
        updatedAt: Date;
        roles: string[]; 
    }> {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id,
                },
                include: {
                    roles: {
                        include: {
                            role: true, 
                        },
                    },
                },
            });
    
            if (!user) {
                throw new Error("User not found");
            }
    
            const transformedUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                passwordHash: user.passwordHash,
                mediaUrls: user.mediaUrls,
                accountStatus: user.accountStatus,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                roles: user.roles.map((userRole : any) => userRole.role.roleName), 
            };
    
            return transformedUser;
        } catch (error) {
            console.error("Error getting user by ID:", error);
            throw error;
        }
    }
    

}