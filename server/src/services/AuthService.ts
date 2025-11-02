import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { User, SignupRequest, SignupResponse, LoginRequest, LoginResponse } from '@gaming-hub/shared';

const prisma = new PrismaClient();

export class AuthService {
  private static readonly SALT_ROUNDS = 10;
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  /**
   * Validate username format
   * - Must be 3-20 characters
   * - Only alphanumeric and underscore allowed
   */
  private static validateUsername(username: string): { valid: boolean; message?: string } {
    if (!username || username.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
      return { valid: false, message: 'Username must be at most 20 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    return { valid: true };
  }

  /**
   * Validate 4-digit PIN
   */
  private static validatePin(pin: string): { valid: boolean; message?: string } {
    if (!pin || pin.length !== 4) {
      return { valid: false, message: 'PIN must be exactly 4 digits' };
    }
    if (!/^\d{4}$/.test(pin)) {
      return { valid: false, message: 'PIN must contain only numbers' };
    }
    return { valid: true };
  }

  /**
   * Hash a PIN using bcrypt
   */
  private static async hashPin(pin: string): Promise<string> {
    return await bcrypt.hash(pin, this.SALT_ROUNDS);
  }

  /**
   * Compare a plain PIN with a hashed PIN
   */
  private static async comparePin(pin: string, hashedPin: string): Promise<boolean> {
    return await bcrypt.compare(pin, hashedPin);
  }

  /**
   * Generate JWT token for a user
   */
  private static generateToken(userId: string, username: string): string {
    return jwt.sign(
      { userId, username },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }

  /**
   * Verify JWT token and return payload
   */
  static verifyToken(token: string): { userId: string; username: string } | null {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: string; username: string };
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Register a new user
   */
  static async signup(request: SignupRequest): Promise<SignupResponse> {
    try {
      // Validate username
      const usernameValidation = this.validateUsername(request.username);
      if (!usernameValidation.valid) {
        return {
          success: false,
          message: usernameValidation.message
        };
      }

      // Validate PIN
      const pinValidation = this.validatePin(request.pin);
      if (!pinValidation.valid) {
        return {
          success: false,
          message: pinValidation.message
        };
      }

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: request.username }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Username already taken'
        };
      }

      // Hash PIN and create user
      const pinHash = await this.hashPin(request.pin);
      const user = await prisma.user.create({
        data: {
          username: request.username,
          pinHash
        }
      });

      // Generate token
      const token = this.generateToken(user.id, user.username);

      // Save session
      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt.toISOString()
        },
        token
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'An error occurred during signup'
      };
    }
  }

  /**
   * Login a user
   */
  static async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Validate PIN format (basic check)
      const pinValidation = this.validatePin(request.pin);
      if (!pinValidation.valid) {
        return {
          success: false,
          message: 'Invalid username or PIN'
        };
      }

      // Find user by username
      const user = await prisma.user.findUnique({
        where: { username: request.username }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid username or PIN'
        };
      }

      // Verify PIN
      const pinMatch = await this.comparePin(request.pin, user.pinHash);
      if (!pinMatch) {
        return {
          success: false,
          message: 'Invalid username or PIN'
        };
      }

      // Generate token
      const token = this.generateToken(user.id, user.username);

      // Save session
      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt.toISOString()
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  }

  /**
   * Logout a user (invalidate session)
   */
  static async logout(token: string): Promise<boolean> {
    try {
      await prisma.session.delete({
        where: { token }
      });
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Validate a session token
   */
  static async validateSession(token: string): Promise<User | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!session) {
        return null;
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        // Delete expired session
        await prisma.session.delete({ where: { token } });
        return null;
      }

      return {
        id: session.user.id,
        username: session.user.username,
        createdAt: session.user.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Cleanup expired sessions (should be run periodically)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      return result.count;
    } catch (error) {
      console.error('Session cleanup error:', error);
      return 0;
    }
  }
}
