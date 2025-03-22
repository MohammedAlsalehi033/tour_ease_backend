import { PrismaClient, User } from "@prisma/client";
import { prisma } from "../utils/prismaClient";
import { UserRole } from "../Types/myEnum";

export default class AuthModel {



  async createUser(
    id: string,
    username: string,
    email: string,
    passwordHash: string,
    role: UserRole,
    mediaUrls: string[] = []
  ): Promise<User> {
    try {
      console.log("Creating user with role:", role);

      const roleRecord = await prisma.role.findUnique({
        where: {
          roleName: role,
        },
      });

      if (!roleRecord) {
        throw new Error(`Role   '${role}' not found`);
      }

      const newUser = await prisma.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            id,
            username,
            email,
            passwordHash,
            mediaUrls,
          },
        });

        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: roleRecord.id,
          },
        });

        return user;
      });

      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
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


  async getRoles(id: string): Promise<string[]> {
    try {
      const userWithRoles = await prisma.user.findUnique({
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

      if (!userWithRoles) {
        throw new Error("User not found");
      }

      // Extract all role names
      const roles = userWithRoles.roles.map(
        (userRole) => userRole.role.roleName
      );

      if (roles.length === 0) {
        throw new Error("No roles found for the user");
      }

      return roles;
    } catch (error) {
      console.error("Error getting roles:", error);
      throw error;
    }
  }

  async updateUserRole(id: string, role: UserRole): Promise<void> {
    try {
      const roleRecord = await prisma.role.findUnique({
        where: {
          roleName: role,
        },
      });

      if (!roleRecord) {
        throw new Error(`Role '${role}' not found`);
      }

      await prisma.userRole.create({
        data: {
          userId: id,
          roleId: roleRecord.id,
        },
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }
}
