import { PrismaClient, User } from "@prisma/client";
import { prisma } from "../utils/prismaClient";
import { UserRole } from "../Types/myEnum";
import { FileUploaderForS3 } from "../utils/FileUploader";

export default class UserModel {



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


async getAllUsers(
  page: number = 1, 
  pageSize: number = 10,
  filter?: { 
    username?: string, 
    email?: string, 
    accountStatus?: string,
    role?: string
  }
): Promise<{
  users: {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    mediaUrls: string[];
    accountStatus: string;
    createdAt: Date;
    updatedAt: Date;
    roles: string[];
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  try {
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    
    const where: any = {};
    
    if (filter) {
      if (filter.username) {
        where.username = { contains: filter.username, mode: 'insensitive' };
      }
      if (filter.email) {
        where.email = { contains: filter.email, mode: 'insensitive' };
      }
      if (filter.accountStatus) {
        where.accountStatus = filter.accountStatus;
      }
    }
    
    // Role filtering requires a different approach
    let roleFilter;
    if (filter?.role) {
      roleFilter = {
        some: {
          role: {
            roleName: filter.role
          }
        }
      };
    }
    
    // Get total count for pagination metadata
    const totalCount = await prisma.user.count({ 
      where,
      ...(roleFilter && { include: { roles: true } })
    });
    
    // Fetch users with pagination
    const users = await prisma.user.findMany({
      where,
      skip,
      take,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    
    // Apply role filter manually if needed
    let filteredUsers = users;
    if (filter?.role) {
      filteredUsers = users.filter(user => 
        user.roles.some(userRole => 
          (userRole.role as any).roleName === filter.role
        )
      );
    }
    
    // Transform users to match return type
    const transformedUsers = filteredUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      mediaUrls: user.mediaUrls,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map((userRole: any) => userRole.role.roleName),
    }));
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      users: transformedUsers,
      total: totalCount,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error("Error getting all users:", error);
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


  async updateProfilePicture(
    userId: string,
    file: any
  ): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
  
      if (!user) {
        throw new Error('User not found');
      }
  
      const fileUploader = new FileUploaderForS3();
      
      
      const uploadResult = await fileUploader.uploadFile(file, "profilePicture", user.username);
      const updatedMediaUrls = [uploadResult.key];
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          mediaUrls: updatedMediaUrls,
        },
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  }

  async addFCMToken(userId: string, fcmToken: string): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          fcmTokens: {
            push: fcmToken,
          },
        },
      });

      return updatedUser;
    } catch (error) {
      console.error('Error adding FCM token:', error);
      throw error;
    }
  }
}
