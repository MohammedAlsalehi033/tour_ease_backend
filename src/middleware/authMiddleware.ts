import { prisma } from '../utils/prismaClient.ts';
import admin from '../services/firebase-admin.ts';


const authMiddleware = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No authentication token, authorization denied'
        });
      }

      // Verify the Firebase token
      const decodedToken = await admin.auth.verifyIdToken(token);
      
      // Find the user in our database using the Firebase UID
      const user = await prisma.user.findUnique({
        where: { id: decodedToken.uid },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found in database'
        });
      }

      // Check account status
      if (user.accountStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // If roles are required, verify that the user has at least one of the required roles
      if (requiredRoles.length > 0) {
        const userRoleNames = user.roles.map(userRole => userRole.role.roleName);
        const hasRequiredRole = requiredRoles.some(role => userRoleNames.includes(role));
        
        if (!hasRequiredRole) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to access this resource'
          });
        }
      }

      // Attach the user to the request object
      req.user = user;
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      
      // More specific error handling
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
        message: 'Token is invalid or expired'
      });
    }
  };
};

export default authMiddleware;