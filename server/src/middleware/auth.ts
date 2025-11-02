import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { User } from '@gaming-hub/shared';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

/**
 * Middleware to authenticate HTTP requests
 * Extracts JWT from Authorization header and validates it
 */
export const authenticateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token
    const payload = AuthService.verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    // Validate session in database
    const user = await AuthService.validateSession(token);
    if (!user) {
      res.status(401).json({ success: false, message: 'Session expired or invalid' });
      return;
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if token is missing/invalid
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = AuthService.verifyToken(token);

      if (payload) {
        const user = await AuthService.validateSession(token);
        if (user) {
          req.user = user;
          req.token = token;
        }
      }
    }
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
