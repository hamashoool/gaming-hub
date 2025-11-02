// localStorage keys
const KEYS = {
  PLAYER_ID: 'gaming-hub:playerId',
  PLAYER_NAME: 'gaming-hub:playerName',
  RECENT_ROOMS: 'gaming-hub:recentRooms',
  FAVORITE_GAME: 'gaming-hub:favoriteGame',
  SETTINGS_PREFIX: 'gaming-hub:settings:',
  SOUNDS_ENABLED: 'gaming-hub:soundsEnabled'
};

// Max number of recent rooms to store
const MAX_RECENT_ROOMS = 10;

// Player ID and Name
export const savePlayerId = (playerId: string): void => {
  localStorage.setItem(KEYS.PLAYER_ID, playerId);
};

export const getPlayerId = (): string | null => {
  return localStorage.getItem(KEYS.PLAYER_ID);
};

export const savePlayerName = (playerName: string): void => {
  localStorage.setItem(KEYS.PLAYER_NAME, playerName);
};

export const getPlayerName = (): string | null => {
  return localStorage.getItem(KEYS.PLAYER_NAME);
};

// Recent Rooms
export const addRecentRoom = (roomCode: string): void => {
  const recentRooms = getRecentRooms();

  // Remove if already exists (to move it to front)
  const filtered = recentRooms.filter(code => code !== roomCode);

  // Add to front
  const updated = [roomCode, ...filtered].slice(0, MAX_RECENT_ROOMS);

  localStorage.setItem(KEYS.RECENT_ROOMS, JSON.stringify(updated));
};

export const getRecentRooms = (): string[] => {
  const stored = localStorage.getItem(KEYS.RECENT_ROOMS);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const clearRecentRooms = (): void => {
  localStorage.removeItem(KEYS.RECENT_ROOMS);
};

// Favorite Game
export const saveFavoriteGame = (gameId: string): void => {
  localStorage.setItem(KEYS.FAVORITE_GAME, gameId);
};

export const getFavoriteGame = (): string | null => {
  return localStorage.getItem(KEYS.FAVORITE_GAME);
};

// Game Settings
export const saveGameSettings = (gameId: string, settings: any): void => {
  const key = KEYS.SETTINGS_PREFIX + gameId;
  localStorage.setItem(key, JSON.stringify(settings));
};

export const getGameSettings = (gameId: string): any | null => {
  const key = KEYS.SETTINGS_PREFIX + gameId;
  const stored = localStorage.getItem(key);

  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

// Sound Settings
export const saveSoundsEnabled = (enabled: boolean): void => {
  localStorage.setItem(KEYS.SOUNDS_ENABLED, JSON.stringify(enabled));
};

export const getSoundsEnabled = (): boolean => {
  const stored = localStorage.getItem(KEYS.SOUNDS_ENABLED);
  if (stored === null) return true; // Default to enabled

  try {
    return JSON.parse(stored);
  } catch {
    return true;
  }
};

// Clear all stored data
export const clearAllData = (): void => {
  Object.values(KEYS).forEach(key => {
    if (key.includes(':')) {
      localStorage.removeItem(key);
    }
  });

  // Clear settings with prefix
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(KEYS.SETTINGS_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
};
