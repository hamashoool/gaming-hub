import {
  Player,
  RPSConfig,
  RPSGameState,
  RPSChoice,
  RPSPowerUpType,
  RPSPlayer,
  RPSRound,
  RPSMatchScore,
  PowerUp
} from '@gaming-hub/shared';

export class RockPaperScissorsGame {
  /**
   * Initialize a new RPS tournament
   */
  static initializeGame(players: Player[], config: RPSConfig): RPSGameState {
    if (players.length !== 2) {
      throw new Error('Rock Paper Scissors requires exactly 2 players');
    }

    return {
      config,
      currentRound: 1,
      roundResults: [],
      matchScore: {
        Player1: 0,
        Player2: 0,
        draws: 0
      },
      player1Choice: null,
      player2Choice: null,
      powerUps: config.powerUpsEnabled ? this.initializePowerUps(players) : [],
      roundStartTime: Date.now(),
      status: 'waiting',
      winner: null,
      shieldActive: { Player1: false, Player2: false }
    };
  }

  /**
   * Initialize power-ups for both players
   */
  private static initializePowerUps(players: Player[]): PowerUp[] {
    const powerUpTypes: RPSPowerUpType[] = ['reveal', 'shield', 'double_points'];
    return players.flatMap((player, index) =>
      powerUpTypes.map(type => ({
        type: type as any, // Cast to satisfy PowerUpType
        playerId: player.id,
        used: false
      }))
    );
  }

  /**
   * Submit a player's choice
   */
  static submitChoice(
    gameState: RPSGameState,
    playerId: string,
    players: Player[],
    choice: RPSChoice,
    powerUpType?: RPSPowerUpType
  ): { gameState: RPSGameState; bothSubmitted: boolean } {
    if (gameState.status !== 'waiting' && gameState.status !== 'playing') {
      throw new Error('Cannot submit choice in current game state');
    }

    // Determine which player this is
    const playerIndex = players.findIndex(p => p.id === playerId);
    const player: RPSPlayer = playerIndex === 0 ? 'Player1' : 'Player2';

    // Validate choice based on variant
    if (gameState.config.variant === 'classic') {
      if (choice === 'lizard' || choice === 'spock') {
        throw new Error('Lizard and Spock are not available in classic mode');
      }
    }

    // Handle power-up if provided
    if (powerUpType && gameState.config.powerUpsEnabled) {
      const powerUpIndex = gameState.powerUps.findIndex(
        pu => pu.playerId === playerId && (pu.type as any) === powerUpType && !pu.used
      );

      if (powerUpIndex === -1) {
        throw new Error('Power-up not available');
      }

      // Mark power-up as used
      const newPowerUps = [...gameState.powerUps];
      newPowerUps[powerUpIndex] = { ...newPowerUps[powerUpIndex], used: true };
      gameState = { ...gameState, powerUps: newPowerUps };

      // Apply shield effect
      if (powerUpType === 'shield') {
        gameState.shieldActive = {
          ...gameState.shieldActive,
          [player]: true
        };
      }
    }

    // Record choice
    if (player === 'Player1') {
      gameState.player1Choice = choice;
    } else {
      gameState.player2Choice = choice;
    }

    const bothSubmitted = gameState.player1Choice !== null && gameState.player2Choice !== null;

    return {
      gameState: {
        ...gameState,
        status: bothSubmitted ? 'playing' : 'waiting'
      },
      bothSubmitted
    };
  }

  /**
   * Evaluate the round and determine winner
   */
  static evaluateRound(
    gameState: RPSGameState,
    players: Player[]
  ): { gameState: RPSGameState; roundResult: RPSRound; matchOver: boolean } {
    if (!gameState.player1Choice || !gameState.player2Choice) {
      throw new Error('Both players must submit choices');
    }

    const player1Choice = gameState.player1Choice;
    const player2Choice = gameState.player2Choice;

    // Determine winner
    let winner: RPSPlayer | 'draw' = this.determineWinner(
      player1Choice,
      player2Choice,
      gameState.config.variant
    );

    // Apply shield logic
    if (winner === 'Player1' && gameState.shieldActive.Player2) {
      winner = 'draw'; // Shield negates the loss
    } else if (winner === 'Player2' && gameState.shieldActive.Player1) {
      winner = 'draw'; // Shield negates the loss
    }

    // Check if double points power-up was used
    const doublePoints = this.wasDoublePointsUsed(gameState, players);

    // Calculate points
    let pointsToAdd = 1;
    if (doublePoints && winner !== 'draw') {
      pointsToAdd = 2;
    }

    const newMatchScore = { ...gameState.matchScore };
    if (winner === 'Player1') {
      newMatchScore.Player1 += pointsToAdd;
    } else if (winner === 'Player2') {
      newMatchScore.Player2 += pointsToAdd;
    } else {
      newMatchScore.draws++;
    }

    const roundResult: RPSRound = {
      roundNumber: gameState.currentRound,
      player1Choice,
      player2Choice,
      winner,
      doublePoints,
      duration: Date.now() - gameState.roundStartTime
    };

    const newRoundResults = [...gameState.roundResults, roundResult];

    // Check if match is over
    const gamesNeededToWin = Math.ceil(gameState.config.bestOf / 2);
    const matchOver =
      newMatchScore.Player1 >= gamesNeededToWin ||
      newMatchScore.Player2 >= gamesNeededToWin;

    let finalWinner: RPSPlayer | 'draw' | null = null;
    if (matchOver) {
      if (newMatchScore.Player1 > newMatchScore.Player2) {
        finalWinner = 'Player1';
      } else if (newMatchScore.Player2 > newMatchScore.Player1) {
        finalWinner = 'Player2';
      } else {
        finalWinner = 'draw';
      }
    }

    return {
      gameState: {
        ...gameState,
        roundResults: newRoundResults,
        matchScore: newMatchScore,
        status: matchOver ? 'match_over' : 'round_over',
        winner: finalWinner,
        shieldActive: { Player1: false, Player2: false } // Reset shields
      },
      roundResult,
      matchOver
    };
  }

  /**
   * Start next round
   */
  static nextRound(gameState: RPSGameState): RPSGameState {
    if (gameState.status !== 'round_over') {
      throw new Error('Can only start next round after current round is over');
    }

    return {
      ...gameState,
      currentRound: gameState.currentRound + 1,
      player1Choice: null,
      player2Choice: null,
      roundStartTime: Date.now(),
      status: 'waiting'
    };
  }

  /**
   * Determine winner based on choices and variant
   */
  private static determineWinner(
    choice1: RPSChoice,
    choice2: RPSChoice,
    variant: 'classic' | 'extended'
  ): RPSPlayer | 'draw' {
    if (choice1 === choice2) {
      return 'draw';
    }

    if (variant === 'classic') {
      return this.classicRules(choice1, choice2);
    } else {
      return this.extendedRules(choice1, choice2);
    }
  }

  /**
   * Classic RPS rules (Rock, Paper, Scissors)
   */
  private static classicRules(choice1: RPSChoice, choice2: RPSChoice): RPSPlayer {
    const winConditions: Record<RPSChoice, RPSChoice[]> = {
      rock: ['scissors'],
      paper: ['rock'],
      scissors: ['paper'],
      lizard: [], // Not used in classic
      spock: [] // Not used in classic
    };

    return winConditions[choice1].includes(choice2) ? 'Player1' : 'Player2';
  }

  /**
   * Extended RPS rules (Rock, Paper, Scissors, Lizard, Spock)
   * Rock crushes Scissors and Lizard
   * Paper covers Rock and disproves Spock
   * Scissors cuts Paper and decapitates Lizard
   * Lizard eats Paper and poisons Spock
   * Spock vaporizes Rock and smashes Scissors
   */
  private static extendedRules(choice1: RPSChoice, choice2: RPSChoice): RPSPlayer {
    const winConditions: Record<RPSChoice, RPSChoice[]> = {
      rock: ['scissors', 'lizard'],
      paper: ['rock', 'spock'],
      scissors: ['paper', 'lizard'],
      lizard: ['paper', 'spock'],
      spock: ['rock', 'scissors']
    };

    return winConditions[choice1].includes(choice2) ? 'Player1' : 'Player2';
  }

  /**
   * Check if double points power-up was used in this round
   */
  private static wasDoublePointsUsed(gameState: RPSGameState, players: Player[]): boolean {
    // Check if either player used double_points in the last move
    // This is tracked by checking recently used power-ups
    // For simplicity, we'll check if the power-up was just used (this round)
    return gameState.powerUps.some(
      pu => (pu.type as any) === 'double_points' && pu.used
    );
  }

  /**
   * Use reveal power-up to see opponent's choice
   */
  static useRevealPowerUp(
    gameState: RPSGameState,
    playerId: string,
    players: Player[]
  ): { gameState: RPSGameState; opponentChoice: RPSChoice | null } {
    if (!gameState.config.powerUpsEnabled) {
      throw new Error('Power-ups are not enabled');
    }

    const powerUpIndex = gameState.powerUps.findIndex(
      pu => pu.playerId === playerId && (pu.type as any) === 'reveal' && !pu.used
    );

    if (powerUpIndex === -1) {
      throw new Error('Reveal power-up not available');
    }

    const newPowerUps = [...gameState.powerUps];
    newPowerUps[powerUpIndex] = { ...newPowerUps[powerUpIndex], used: true };

    // Determine opponent choice
    const playerIndex = players.findIndex(p => p.id === playerId);
    const opponentChoice = playerIndex === 0 ? gameState.player2Choice : gameState.player1Choice;

    return {
      gameState: { ...gameState, powerUps: newPowerUps },
      opponentChoice
    };
  }

  /**
   * Get match statistics
   */
  static getMatchStats(gameState: RPSGameState) {
    const totalRounds = gameState.roundResults.length;
    const averageRoundDuration = totalRounds > 0
      ? gameState.roundResults.reduce((sum, r) => sum + r.duration, 0) / totalRounds
      : 0;

    const gamesNeededToWin = Math.ceil(gameState.config.bestOf / 2);
    const matchWinner =
      gameState.matchScore.Player1 >= gamesNeededToWin ? 'Player1' :
      gameState.matchScore.Player2 >= gamesNeededToWin ? 'Player2' :
      null;

    return {
      totalRounds,
      averageRoundDuration,
      matchScore: gameState.matchScore,
      matchWinner,
      roundsPlayed: gameState.currentRound - 1
    };
  }

  /**
   * Get available power-ups for a player
   */
  static getAvailablePowerUps(gameState: RPSGameState, playerId: string): PowerUp[] {
    return gameState.powerUps.filter(pu => pu.playerId === playerId && !pu.used);
  }

  /**
   * Check if time limit has been exceeded
   */
  static hasTimeLimitExceeded(gameState: RPSGameState): boolean {
    if (gameState.config.timeLimit === 0) {
      return false; // No time limit
    }

    const timeElapsed = (Date.now() - gameState.roundStartTime) / 1000;
    return timeElapsed > gameState.config.timeLimit;
  }
}
