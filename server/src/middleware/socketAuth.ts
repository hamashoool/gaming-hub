import { Socket } from 'socket.io';
import { AuthService } from '../services/AuthService';
import { User } from '@gaming-hub/shared';

// Extend Socket to include user data
declare module 'socket.io' {
  interface Socket {
    user?: User;
    userId?: string;
  }
}

/**
 * Socket.IO authentication middleware
 * Extracts JWT from handshake auth and validates it
 */
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    // Extract token from handshake auth
    const token = socket.handshake.auth.token;

    if (!token) {
      // Allow connection but mark as unauthenticated
      // This allows guest play while requiring auth for permanent rooms
      return next();
    }

    // Validate token
    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return next();
    }

    // Validate session in database
    const user = await AuthService.validateSession(token);
    if (!user) {
      return next();
    }

    // Attach user to socket
    socket.user = user;
    socket.userId = user.id;

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next();
  }
};

/**
 * Middleware to require authentication for specific events
 */
export const requireAuth = (socket: Socket): boolean => {
  return !!socket.user;
};
