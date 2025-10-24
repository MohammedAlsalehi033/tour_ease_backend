import { prisma } from "../../../utils/prismaClient";

export class SuperAdminModel {

    /**
     * Retrieves a list of all users who have the 'admin' role.
     * Includes their associated admin permissions.
     * @returns A promise that resolves to an array of admin users.
     */
    async getAllAdmins() {
        try {
            const admins = await prisma.user.findMany({
                where: {
                    // Filter users who have a role relationship where the role name is 'admin'
                    roles: {
                        some: {
                            role: {
                                roleName: 'admin'
                            }
                        }
                    }
                },
                include: {
                    // Include the specific admin record to get permissions
                    admin: true, 
                    // Include roles to confirm their status
                    roles: {
                        include: {
                            role: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return admins;
        } catch (error) {
            console.error("Error fetching admins:", error);
            throw new Error("Failed to fetch admins");
        }
    }

    /**
     * Assigns the 'admin' role to a user and creates an associated admin record.
     * @param userId The ID of the user to promote to admin.
     * @returns A promise that resolves to the updated user object.
     */
    async addAdmin(userId: string) {
        try {
            // Use a transaction to ensure both operations (adding role and creating admin record) succeed or fail together.
            return await prisma.$transaction(async (tx) => {
                // 1. Find the user to ensure they exist.
                const user = await tx.user.findUnique({ where: { id: userId } });
                if (!user) {
                    throw new Error("User not found");
                }

                // 2. Find the 'admin' role to get its ID.
                const adminRole = await tx.role.findUnique({ where: { roleName: 'admin' } });
                if (!adminRole) {
                    throw new Error("'admin' role not found in the database. Please seed the roles.");
                }

                // 3. Check if the user already has the admin role.
                const existingUserRole = await tx.userRole.findUnique({
                    where: {
                        userId_roleId: {
                            userId: userId,
                            roleId: adminRole.id
                        }
                    }
                });

                if (existingUserRole) {
                    throw new Error("User is already an admin");
                }
                
                // 4. Create the link in the UserRole table.
                await tx.userRole.create({
                    data: {
                        userId: userId,
                        roleId: adminRole.id
                    }
                });

                // 5. Create a corresponding record in the Admin table with default permissions.
                await tx.admin.create({
                    data: {
                        adminId: userId,
                        permissions: ['View Reports'] // Assign some default permissions
                    }
                });

                // 6. Return the updated user with their new role and admin data.
                return tx.user.findUnique({
                    where: { id: userId },
                    include: { roles: { include: { role: true } }, admin: true }
                });
            });
        } catch (error) {
            console.error("Error adding admin:", error);
            // Check for our custom error messages to pass them through
            if (error instanceof Error && (error.message.includes("User not found") || error.message.includes("already an admin"))) {
                throw error;
            }
            throw new Error("Failed to add admin");
        }
    }

    /**
     * Removes the 'admin' role from a user and deletes their admin record.
     * @param userId The ID of the user to demote.
     * @returns A promise that resolves to the updated user object.
     */
    async removeAdmin(userId: string) {
        try {
            return await prisma.$transaction(async (tx) => {
                const adminRole = await tx.role.findUnique({ where: { roleName: 'admin' } });
                if (!adminRole) {
                    throw new Error("'admin' role not found.");
                }

                // 1. Delete the UserRole link
                await tx.userRole.delete({
                    where: {
                        userId_roleId: {
                            userId: userId,
                            roleId: adminRole.id
                        }
                    }
                }).catch(() => { throw new Error("User is not an admin."); }); // If delete fails, user wasn't an admin

                // 2. Delete the associated Admin record
                await tx.admin.delete({
                    where: { adminId: userId }
                }).catch(() => {}); // Ignore error if admin record didn't exist for some reason

                // 3. Return the updated user
                return tx.user.findUnique({
                    where: { id: userId },
                    include: { roles: { include: { role: true } }, admin: true }
                });
            });
        } catch (error) {
            console.error("Error removing admin:", error);
            if (error instanceof Error && error.message.includes("User is not an admin")) {
                throw error;
            }
            throw new Error("Failed to remove admin");
        }
    }

    /**
     * Toggles a user's account status between 'active' and 'deactivated'.
     * @param userId The ID of the user whose status to toggle.
     * @returns A promise that resolves to the updated user object.
     */
    async toggleUserStatus(userId: string) {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new Error("User not found");
            }

            const newStatus = user.accountStatus === 'active' ? 'deactivated' : 'active';
            
            return await prisma.user.update({
                where: { id: userId },
                data: { accountStatus: newStatus }
            });
        } catch (error) {
            console.error("Error toggling user status:", error);
            throw new Error("Failed to toggle user status");
        }
    }
    
    /**
     * Updates the permissions for a specific admin.
     * @param adminId The ID of the admin user.
     * @param newPermissions An array of strings representing the new permissions.
     * @returns A promise that resolves to the updated admin record.
     */
    async changeAdminPermissions(adminId: string, newPermissions: string[]) {
        try {
            const admin = await prisma.admin.findUnique({ where: { adminId: adminId } });
            if (!admin) {
                throw new Error("Admin record not found for this user.");
            }

            return await prisma.admin.update({
                where: { adminId: adminId },
                data: { permissions: newPermissions }
            });
        } catch (error) {
            console.error("Error changing admin permissions:", error);
            throw new Error("Failed to change admin permissions");
        }
    }
}