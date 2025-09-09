import { prisma } from '../utils/prismaClient';
import admin from '../services/firebase-admin';
import authMiddleware from './authMiddleware';


const adminMiddleware = (requiredPermissions: string[] = []) => {
  return async (req, res, next) => {
    try {

      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No authentication token, authorization denied'
        });
      }

      const decodedToken = await admin.auth.verifyIdToken(token);

     
      
      const myAdmin = await prisma.admin.findUnique({
        where: { adminId: decodedToken.uid },
    
      });

      if (!myAdmin) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found in database'
        });
      }


       const user =await prisma.user.findUnique({
                where: { id: decodedToken.uid },
      });
      // Check account status
      if (user.accountStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active'
        });
      }

      if (requiredPermissions.length > 0) {
        const userPermissionNames = myAdmin.permissions;
        const hasRequiredPermission = requiredPermissions.every(permission => userPermissionNames.includes(permission));

        if (!hasRequiredPermission) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to access this resource'
          });
        }
      }

      req.user = myAdmin;

      next();
    } catch (error : any) {
      console.error('Authentication error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      } else if (error.code === 'auth/invalid-id-token') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }
      
      res.status(401).json({
        success: false,
        message: `${error.message}`
      });
    }
  };
};

export default adminMiddleware;