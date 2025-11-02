import { Room, Player } from '@gaming-hub/shared';
import { v4 as uuidv4 } from 'uuid';
import { RoomRepository } from '../repositories/RoomRepository';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map();
  private roomOwners: Map<string, string> = new Map(); // roomId -> userId

  private constructor() {}

  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  createRoom(gameId: string, creatorName: string, maxPlayers: number = 2, userId?: string): { room: Room; player: Player } {
    const roomId = this.generateRoomCode();
    const playerId = uuidv4();

    const player: Player = {
      id: playerId,
      name: creatorName,
      isReady: false,
      userId: userId
    };

    const room: Room = {
      id: roomId,
      gameId,
      players: [player],
      maxPlayers,
      status: 'waiting',
      createdAt: Date.now(),
      isPermanent: false
    };

    this.rooms.set(roomId, room);
    return { room, player };
  }

  /**
   * Create or load a permanent room for a user
   */
  async createPermanentRoom(
    userId: string,
    username: string,
    name: string,
    gameId: string,
    maxPlayers: number = 8
  ): Promise<{ room: Room; player: Player } | null> {
    try {
      // Create/update permanent room in database
      const dbRoom = await RoomRepository.createPermanentRoom(userId, name, gameId);
      if (!dbRoom) {
        return null;
      }

      const playerId = uuidv4();
      const player: Player = {
        id: playerId,
        name: username,
        isReady: false,
        userId: userId
      };

      const room: Room = {
        id: dbRoom.id,
        gameId: dbRoom.gameId,
        name: dbRoom.name,
        players: [player],
        maxPlayers,
        status: 'waiting',
        createdAt: Date.now(),
        isPermanent: true,
        ownerId: userId
      };

      this.rooms.set(room.id, room);
      this.roomOwners.set(room.id, userId);

      // Mark room as active in database
      await RoomRepository.activateRoom(userId);

      return { room, player };
    } catch (error) {
      console.error('Error creating permanent room:', error);
      return null;
    }
  }

  /**
   * Load a user's permanent room from database
   */
  async loadPermanentRoom(
    userId: string,
    username: string,
    maxPlayers: number = 8
  ): Promise<{ room: Room; player: Player } | null> {
    try {
      const dbRoom = await RoomRepository.getPermanentRoom(userId);
      if (!dbRoom) {
        return null;
      }

      // Check if room is already loaded
      const existing = this.rooms.get(dbRoom.id);
      if (existing) {
        // Check if user is already in the room
        const existingPlayer = existing.players.find(p => p.userId === userId);
        if (existingPlayer) {
          // User already in room, return existing player
          return { room: existing, player: existingPlayer };
        }

        // Add new player to existing room
        const playerId = uuidv4();
        const player: Player = {
          id: playerId,
          name: username,
          isReady: false,
          userId: userId
        };

        existing.players.push(player);
        this.rooms.set(dbRoom.id, existing);
        return { room: existing, player };
      }

      // Create new room instance
      const playerId = uuidv4();
      const player: Player = {
        id: playerId,
        name: username,
        isReady: false,
        userId: userId
      };

      const room: Room = {
        id: dbRoom.id,
        gameId: dbRoom.gameId,
        name: dbRoom.name,
        players: [player],
        maxPlayers,
        status: 'waiting',
        createdAt: Date.now(),
        isPermanent: true,
        ownerId: userId
      };

      this.rooms.set(room.id, room);
      this.roomOwners.set(room.id, userId);

      // Mark room as active
      await RoomRepository.activateRoom(userId);

      return { room, player };
    } catch (error) {
      console.error('Error loading permanent room:', error);
      return null;
    }
  }

  joinRoom(roomId: string, playerName: string, userId?: string): { room: Room; player: Player } | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    if (room.status !== 'waiting') {
      throw new Error('Game already in progress');
    }

    const playerId = uuidv4();
    const player: Player = {
      id: playerId,
      name: playerName,
      isReady: false,
      userId: userId
    };

    room.players.push(player);
    this.rooms.set(roomId, room);

    return { room, player };
  }

  async leaveRoom(roomId: string, playerId: string): Promise<Room | null> {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    const leavingPlayer = room.players.find(p => p.id === playerId);
    room.players = room.players.filter(p => p.id !== playerId);

    // For permanent rooms, don't delete when empty
    // But mark as inactive if owner leaves
    if (room.isPermanent) {
      if (leavingPlayer?.userId === room.ownerId && room.ownerId) {
        // Owner is leaving, deactivate the room
        await RoomRepository.deactivateRoom(room.ownerId);
      }

      if (room.players.length === 0) {
        // Remove from memory but keep in database
        this.rooms.delete(roomId);
        this.roomOwners.delete(roomId);
        return null;
      }

      this.rooms.set(roomId, room);
      return room;
    }

    // For temporary rooms, delete if empty
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  updateRoom(roomId: string, updates: Partial<Room>): Room | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    const updatedRoom = { ...room, ...updates };
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  changeGame(roomId: string, newGameId: string): Room | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    // Update game ID and reset room to waiting state
    const updatedRoom: Room = {
      ...room,
      gameId: newGameId,
      status: 'waiting'
    };

    // Reset all players' ready state
    updatedRoom.players.forEach(player => {
      player.isReady = false;
    });

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  setPlayerReady(roomId: string, playerId: string, isReady: boolean): Room | null {
    const room = this.rooms.get(roomId);

    if (!room) {
      return null;
    }

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = isReady;
      this.rooms.set(roomId, room);
    }

    return room;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Update room name (permanent rooms only)
   */
  async updateRoomName(roomId: string, userId: string, name: string): Promise<Room | null> {
    const room = this.rooms.get(roomId);

    if (!room || !room.isPermanent) {
      return null;
    }

    if (room.ownerId !== userId) {
      return null; // Only owner can rename
    }

    const success = await RoomRepository.updateRoomName(roomId, userId, name);
    if (!success) {
      return null;
    }

    room.name = name;
    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Kick a player from a room (owner only)
   */
  kickPlayer(roomId: string, ownerId: string, playerId: string): { room: Room; kickedPlayer: Player } | null {
    const room = this.rooms.get(roomId);

    if (!room || !room.isPermanent) {
      return null;
    }

    if (room.ownerId !== ownerId) {
      return null; // Only owner can kick
    }

    const kickedPlayer = room.players.find(p => p.id === playerId);
    if (!kickedPlayer || kickedPlayer.userId === ownerId) {
      return null; // Can't kick owner or non-existent player
    }

    room.players = room.players.filter(p => p.id !== playerId);
    this.rooms.set(roomId, room);

    return { room, kickedPlayer };
  }

  /**
   * Get room owner ID
   */
  getRoomOwnerId(roomId: string): string | null {
    const room = this.rooms.get(roomId);
    return room?.ownerId || null;
  }

  /**
   * Check if user is room owner
   */
  isRoomOwner(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    return room?.ownerId === userId;
  }

  /**
   * Get all active user IDs (for public rooms list)
   */
  getActiveUserIds(): string[] {
    const userIds = new Set<string>();
    for (const room of this.rooms.values()) {
      for (const player of room.players) {
        if (player.userId) {
          userIds.add(player.userId);
        }
      }
    }
    return Array.from(userIds);
  }

  private generateRoomCode(): string {
    // Generate a 6-character room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Ensure uniqueness
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }

    return code;
  }
}
