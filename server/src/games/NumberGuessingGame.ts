import { NumberGuessingGameState, NumberGuessingGameConfig, Guess, Player } from '@gaming-hub/shared';

export class NumberGuessingGame {
  static initializeGame(players: Player[], config: NumberGuessingGameConfig): NumberGuessingGameState {
    const targetNumber = this.generateRandomNumber(config.minRange, config.maxRange);

    return {
      targetNumber,
      config,
      currentTurn: players[0].id,
      guesses: [],
      status: 'playing'
    };
  }

  static processGuess(
    gameState: NumberGuessingGameState,
    playerId: string,
    playerName: string,
    guessNumber: number
  ): { gameState: NumberGuessingGameState; guess: Guess; isCorrect: boolean; nextPlayerId: string | null } {
    let feedback: 'too_low' | 'too_high' | 'correct';
    let isCorrect = false;

    if (guessNumber === gameState.targetNumber) {
      feedback = 'correct';
      isCorrect = true;
    } else if (guessNumber < gameState.targetNumber) {
      feedback = 'too_low';
    } else {
      feedback = 'too_high';
    }

    const guess: Guess = {
      playerId,
      playerName,
      number: guessNumber,
      feedback,
      timestamp: Date.now()
    };

    gameState.guesses.push(guess);

    // Determine next player or winner
    let nextPlayerId: string | null = null;

    if (isCorrect) {
      gameState.winner = playerId;
      gameState.status = 'finished';
    } else {
      // Switch turn to the other player
      const currentPlayerIndex = gameState.guesses.filter(g => g.playerId === playerId).length;
      // Simple turn switching - could be enhanced with more complex logic
      nextPlayerId = gameState.currentTurn;
    }

    return { gameState, guess, isCorrect, nextPlayerId };
  }

  static getNextPlayer(currentPlayerId: string, players: Player[]): string {
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex].id;
  }

  private static generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static getPlayerStats(gameState: NumberGuessingGameState, playerId: string) {
    const playerGuesses = gameState.guesses.filter(g => g.playerId === playerId);
    return {
      totalGuesses: playerGuesses.length,
      guesses: playerGuesses
    };
  }

  static isGameFinished(gameState: NumberGuessingGameState): boolean {
    return gameState.status === 'finished';
  }
}
