import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & {
        roles: ('user' | 'provider' | 'admin')[];
      };
    }
  }
}

export {};
