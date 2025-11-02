import { NumberGuessingGameState } from '@gaming-hub/shared';

export class GameStateManager {
  private static instance: GameStateManager;
  private gameStates: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  setGameState(roomId: string, state: any): void {
    this.gameStates.set(roomId, state);
  }

  getGameState<T>(roomId: string): T | undefined {
    return this.gameStates.get(roomId) as T | undefined;
  }

  updateGameState<T>(roomId: string, updates: Partial<T>): T | null {
    const currentState = this.gameStates.get(roomId);

    if (!currentState) {
      return null;
    }

    const updatedState = { ...currentState, ...updates };
    this.gameStates.set(roomId, updatedState);
    return updatedState as T;
  }

  deleteGameState(roomId: string): void {
    this.gameStates.delete(roomId);
  }

  hasGameState(roomId: string): boolean {
    return this.gameStates.has(roomId);
  }
}
