import { PrismaClient } from '@prisma/client';
import { PublicRoom } from '@gaming-hub/shared';

const prisma = new PrismaClient();

export class RoomRepository {
  /**
   * Create a permanent room for a user
   */
  static async createPermanentRoom(
    userId: string,
    name: string,
    gameId: string
  ): Promise<{ id: string; name: string; gameId: string } | null> {
    try {
      // Check if user already has a permanent room
      const existing = await prisma.permanentRoom.findFirst({
        where: { ownerId: userId }
      });

      if (existing) {
        // Update existing room instead of creating new one
        const updated = await prisma.permanentRoom.update({
          where: { id: existing.id },
          data: {
            name,
            gameId,
            isActive: true,
            lastActive: new Date()
          }
        });
        return {
          id: updated.id,
          name: updated.name,
          gameId: updated.gameId
        };
      }

      // Create new permanent room
      const room = await prisma.permanentRoom.create({
        data: {
          name,
          ownerId: userId,
          gameId,
          isActive: true,
          lastActive: new Date()
        }
      });

      return {
        id: room.id,
        name: room.name,
        gameId: room.gameId
      };
    } catch (error) {
      console.error('Error creating permanent room:', error);
      return null;
    }
  }

  /**
   * Get a user's permanent room
   */
  static async getPermanentRoom(userId: string): Promise<{
    id: string;
    name: string;
    gameId: string;
    isActive: boolean;
  } | null> {
    try {
      const room = await prisma.permanentRoom.findFirst({
        where: { ownerId: userId }
      });

      if (!room) {
        return null;
      }

      return {
        id: room.id,
        name: room.name,
        gameId: room.gameId,
        isActive: room.isActive
      };
    } catch (error) {
      console.error('Error getting permanent room:', error);
      return null;
    }
  }

  /**
   * Get all active public rooms (owner must be online)
   */
  static async getPublicRooms(activeUserIds: string[]): Promise<PublicRoom[]> {
    try {
      const rooms = await prisma.permanentRoom.findMany({
        where: {
          isActive: true,
          ownerId: {
            in: activeUserIds
          }
        },
        include: {
          owner: {
            select: {
              username: true
            }
          }
        },
        orderBy: {
          lastActive: 'desc'
        }
      });

      return rooms.map(room => ({
        id: room.id,
        name: room.name,
        gameId: room.gameId,
        ownerName: room.owner.username,
        playerCount: 0, // Will be filled by RoomManager
        maxPlayers: 8, // Default, will be updated by RoomManager
        isActive: room.isActive
      }));
    } catch (error) {
      console.error('Error getting public rooms:', error);
      return [];
    }
  }

  /**
   * Update room name
   */
  static async updateRoomName(roomId: string, ownerId: string, name: string): Promise<boolean> {
    try {
      await prisma.permanentRoom.updateMany({
        where: {
          id: roomId,
          ownerId: ownerId
        },
        data: {
          name,
          lastActive: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error updating room name:', error);
      return false;
    }
  }

  /**
   * Mark room as active (owner connected)
   */
  static async activateRoom(userId: string): Promise<boolean> {
    try {
      await prisma.permanentRoom.updateMany({
        where: { ownerId: userId },
        data: {
          isActive: true,
          lastActive: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error activating room:', error);
      return false;
    }
  }

  /**
   * Mark room as inactive (owner disconnected)
   */
  static async deactivateRoom(userId: string): Promise<boolean> {
    try {
      await prisma.permanentRoom.updateMany({
        where: { ownerId: userId },
        data: {
          isActive: false,
          lastActive: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error deactivating room:', error);
      return false;
    }
  }

  /**
   * Update room activity timestamp
   */
  static async updateActivity(roomId: string): Promise<boolean> {
    try {
      await prisma.permanentRoom.update({
        where: { id: roomId },
        data: {
          lastActive: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Error updating room activity:', error);
      return false;
    }
  }

  /**
   * Check if a room is permanent (stored in database)
   */
  static async isPermanentRoom(roomId: string): Promise<boolean> {
    try {
      const room = await prisma.permanentRoom.findUnique({
        where: { id: roomId }
      });
      return !!room;
    } catch (error) {
      console.error('Error checking if room is permanent:', error);
      return false;
    }
  }

  /**
   * Get room owner ID
   */
  static async getRoomOwnerId(roomId: string): Promise<string | null> {
    try {
      const room = await prisma.permanentRoom.findUnique({
        where: { id: roomId },
        select: { ownerId: true }
      });
      return room?.ownerId || null;
    } catch (error) {
      console.error('Error getting room owner:', error);
      return null;
    }
  }
}
