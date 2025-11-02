// Authentication types

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface SignupRequest {
  username: string;
  pin: string;
}

export interface SignupResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export interface LoginRequest {
  username: string;
  pin: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export interface AuthToken {
  token: string;
  expiresAt: string;
}

export interface PublicRoom {
  id: string;
  name: string;
  gameId: string;
  ownerName: string;
  playerCount: number;
  maxPlayers: number;
  isActive: boolean;
}

// Socket event payloads for authentication
export interface AuthLoginPayload {
  username: string;
  pin: string;
}

export interface AuthSignupPayload {
  username: string;
  pin: string;
}

export interface CreatePermanentRoomPayload {
  name: string;
  gameId: string;
  maxPlayers?: number;
}

export interface UpdateRoomNamePayload {
  roomId: string;
  name: string;
}

export interface KickPlayerPayload {
  roomId: string;
  playerId: string;
}
