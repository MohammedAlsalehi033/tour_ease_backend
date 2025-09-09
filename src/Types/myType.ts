import { User, Role } from '@prisma/client';

// Extend the Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User & {
        roles: Array<{
          role: Role;
        }>;
      };
    }
  }
}

export {};
