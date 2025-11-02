import {
  Player,
  TicTacToeConfig,
  TicTacToeGameState,
  BoardSize,
  CellValue,
  TicTacToeMove,
  PowerUp,
  PowerUpType,
  GameResult,
  MatchScore
} from '@gaming-hub/shared';

export class TicTacToeGame {
  /**
   * Initialize a new Tic Tac Toe tournament
   */
  static initializeGame(players: Player[], config: TicTacToeConfig): TicTacToeGameState {
    if (players.length !== 2) {
      throw new Error('Tic Tac Toe requires exactly 2 players');
    }

    const emptyBoard = this.createEmptyBoard(config.boardSize);

    return {
      config,
      board: emptyBoard,
      currentPlayer: 'X',
      gameNumber: 1,
      matchScore: {
        X: 0,
        O: 0,
        draws: 0
      },
      moves: [],
      powerUps: config.powerUpsEnabled ? this.initializePowerUps(players) : [],
      blockedCell: null,
      moveStartTime: Date.now(),
      gameResults: [],
      status: 'playing',
      winner: null
    };
  }

  /**
   * Create an empty board of specified size
   */
  private static createEmptyBoard(size: BoardSize): CellValue[][] {
    return Array(size).fill(null).map(() => Array(size).fill(null));
  }

  /**
   * Initialize power-ups for both players
   */
  private static initializePowerUps(players: Player[]): PowerUp[] {
    const powerUpTypes: PowerUpType[] = ['steal', 'block', 'extra_turn'];
    return players.flatMap((player, index) =>
      powerUpTypes.map(type => ({
        type,
        playerId: player.id,
        used: false
      }))
    );
  }

  /**
   * Make a move on the board
   */
  static makeMove(
    gameState: TicTacToeGameState,
    playerId: string,
    players: Player[],
    row: number,
    col: number
  ): { gameState: TicTacToeGameState; move: TicTacToeMove; gameOver: boolean } {
    if (gameState.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    // Determine which symbol this player is
    const playerIndex = players.findIndex(p => p.id === playerId);
    const playerSymbol: 'X' | 'O' = playerIndex === 0 ? 'X' : 'O';

    // Validate it's the player's turn
    if (gameState.currentPlayer !== playerSymbol) {
      throw new Error('Not your turn');
    }

    // Check if cell is blocked
    if (gameState.blockedCell &&
        gameState.blockedCell.row === row &&
        gameState.blockedCell.col === col) {
      throw new Error('This cell is blocked');
    }

    // Validate move
    if (row < 0 || row >= gameState.config.boardSize ||
        col < 0 || col >= gameState.config.boardSize) {
      throw new Error('Invalid move position');
    }

    if (gameState.board[row][col] !== null) {
      throw new Error('Cell is already occupied');
    }

    // Make the move
    const newBoard = gameState.board.map(r => [...r]);
    newBoard[row][col] = playerSymbol;

    const move: TicTacToeMove = {
      row,
      col,
      player: playerSymbol,
      timestamp: Date.now()
    };

    const newMoves = [...gameState.moves, move];

    // Clear blocked cell after use
    const clearedBlockedCell = null;

    // Check for winner
    const winner = this.checkWinner(newBoard, gameState.config.boardSize);
    const isDraw = !winner && this.isBoardFull(newBoard);

    let newGameState: TicTacToeGameState;

    if (winner || isDraw) {
      // Game over
      const gameResult: GameResult = {
        gameNumber: gameState.gameNumber,
        winner: winner || 'draw',
        moves: newMoves,
        duration: Date.now() - gameState.moveStartTime
      };

      const newGameResults = [...gameState.gameResults, gameResult];
      const newMatchScore = { ...gameState.matchScore };

      if (winner) {
        newMatchScore[winner]++;
      } else {
        newMatchScore.draws++;
      }

      newGameState = {
        ...gameState,
        board: newBoard,
        moves: newMoves,
        blockedCell: clearedBlockedCell,
        gameResults: newGameResults,
        matchScore: newMatchScore,
        status: 'game_over',
        winner: winner || 'draw'
      };

      return { gameState: newGameState, move, gameOver: true };
    } else {
      // Continue playing - switch turns
      const nextPlayer: 'X' | 'O' = gameState.currentPlayer === 'X' ? 'O' : 'X';

      newGameState = {
        ...gameState,
        board: newBoard,
        currentPlayer: nextPlayer,
        moves: newMoves,
        blockedCell: clearedBlockedCell,
        moveStartTime: Date.now()
      };

      return { gameState: newGameState, move, gameOver: false };
    }
  }

  /**
   * Use a power-up
   */
  static usePowerUp(
    gameState: TicTacToeGameState,
    playerId: string,
    players: Player[],
    powerUpType: PowerUpType,
    targetRow?: number,
    targetCol?: number
  ): { gameState: TicTacToeGameState; result: string } {
    if (!gameState.config.powerUpsEnabled) {
      throw new Error('Power-ups are not enabled');
    }

    const playerIndex = players.findIndex(p => p.id === playerId);
    const playerSymbol: 'X' | 'O' = playerIndex === 0 ? 'X' : 'O';

    // Find the power-up
    const powerUpIndex = gameState.powerUps.findIndex(
      pu => pu.playerId === playerId && pu.type === powerUpType && !pu.used
    );

    if (powerUpIndex === -1) {
      throw new Error('Power-up not available');
    }

    const newPowerUps = [...gameState.powerUps];
    newPowerUps[powerUpIndex] = { ...newPowerUps[powerUpIndex], used: true };

    let newGameState = { ...gameState, powerUps: newPowerUps };
    let result = '';

    switch (powerUpType) {
      case 'steal':
        // Steal an opponent's cell
        if (targetRow === undefined || targetCol === undefined) {
          throw new Error('Target position required for steal power-up');
        }

        const opponentSymbol: 'X' | 'O' = playerSymbol === 'X' ? 'O' : 'X';

        if (gameState.board[targetRow][targetCol] !== opponentSymbol) {
          throw new Error('Can only steal opponent cells');
        }

        const newBoardSteal = gameState.board.map(r => [...r]);
        newBoardSteal[targetRow][targetCol] = playerSymbol;
        newGameState.board = newBoardSteal;
        result = `Stole cell at (${targetRow}, ${targetCol})`;
        break;

      case 'block':
        // Block a cell for one turn
        if (targetRow === undefined || targetCol === undefined) {
          throw new Error('Target position required for block power-up');
        }

        if (gameState.board[targetRow][targetCol] !== null) {
          throw new Error('Can only block empty cells');
        }

        newGameState.blockedCell = { row: targetRow, col: targetCol };
        result = `Blocked cell at (${targetRow}, ${targetCol})`;
        break;

      case 'extra_turn':
        // Don't switch turns (handled by caller)
        result = 'Extra turn granted';
        break;

      default:
        throw new Error('Unknown power-up type');
    }

    return { gameState: newGameState, result };
  }

  /**
   * Start next game in the series
   */
  static nextGameInSeries(gameState: TicTacToeGameState): TicTacToeGameState {
    if (gameState.status !== 'game_over') {
      throw new Error('Current game is not over');
    }

    // Check if match is over
    const gamesNeededToWin = Math.ceil(gameState.config.bestOf / 2);

    if (gameState.matchScore.X >= gamesNeededToWin ||
        gameState.matchScore.O >= gamesNeededToWin) {
      return {
        ...gameState,
        status: 'match_over'
      };
    }

    // Start new game
    const emptyBoard = this.createEmptyBoard(gameState.config.boardSize);

    // Alternate who starts
    const newStartingPlayer: 'X' | 'O' = gameState.gameNumber % 2 === 0 ? 'X' : 'O';

    return {
      ...gameState,
      board: emptyBoard,
      currentPlayer: newStartingPlayer,
      gameNumber: gameState.gameNumber + 1,
      moves: [],
      blockedCell: null,
      moveStartTime: Date.now(),
      status: 'playing',
      winner: null
    };
  }

  /**
   * Check if the board has a winner
   */
  private static checkWinner(board: CellValue[][], size: BoardSize): 'X' | 'O' | null {
    // Check rows
    for (let row = 0; row < size; row++) {
      if (board[row][0] !== null && board[row].every(cell => cell === board[row][0])) {
        return board[row][0];
      }
    }

    // Check columns
    for (let col = 0; col < size; col++) {
      const firstCell = board[0][col];
      if (firstCell !== null && board.every(row => row[col] === firstCell)) {
        return firstCell;
      }
    }

    // Check main diagonal (top-left to bottom-right)
    const mainDiagFirst = board[0][0];
    if (mainDiagFirst !== null &&
        board.every((row, idx) => row[idx] === mainDiagFirst)) {
      return mainDiagFirst;
    }

    // Check anti-diagonal (top-right to bottom-left)
    const antiDiagFirst = board[0][size - 1];
    if (antiDiagFirst !== null &&
        board.every((row, idx) => row[size - 1 - idx] === antiDiagFirst)) {
      return antiDiagFirst;
    }

    return null;
  }

  /**
   * Check if board is full (for draw detection)
   */
  private static isBoardFull(board: CellValue[][]): boolean {
    return board.every(row => row.every(cell => cell !== null));
  }

  /**
   * Get match statistics
   */
  static getMatchStats(gameState: TicTacToeGameState) {
    const totalGames = gameState.gameResults.length;
    const averageGameDuration = totalGames > 0
      ? gameState.gameResults.reduce((sum, g) => sum + g.duration, 0) / totalGames
      : 0;

    const gamesNeededToWin = Math.ceil(gameState.config.bestOf / 2);
    const matchWinner =
      gameState.matchScore.X >= gamesNeededToWin ? 'X' :
      gameState.matchScore.O >= gamesNeededToWin ? 'O' :
      null;

    return {
      totalGames,
      averageGameDuration,
      matchScore: gameState.matchScore,
      matchWinner,
      gamesPlayed: gameState.gameNumber - 1
    };
  }

  /**
   * Get available power-ups for a player
   */
  static getAvailablePowerUps(gameState: TicTacToeGameState, playerId: string): PowerUp[] {
    return gameState.powerUps.filter(pu => pu.playerId === playerId && !pu.used);
  }

  /**
   * Check if time limit has been exceeded
   */
  static hasTimeLimitExceeded(gameState: TicTacToeGameState): boolean {
    if (gameState.config.timeLimit === 0) {
      return false; // No time limit
    }

    const timeElapsed = (Date.now() - gameState.moveStartTime) / 1000;
    return timeElapsed > gameState.config.timeLimit;
  }

  /**
   * Handle time limit expiration (auto-forfeit)
   */
  static handleTimeExpired(gameState: TicTacToeGameState): TicTacToeGameState {
    // Current player loses their turn and loses the game
    const winner: 'X' | 'O' = gameState.currentPlayer === 'X' ? 'O' : 'X';

    const gameResult: GameResult = {
      gameNumber: gameState.gameNumber,
      winner,
      moves: gameState.moves,
      duration: Date.now() - gameState.moveStartTime
    };

    const newGameResults = [...gameState.gameResults, gameResult];
    const newMatchScore = { ...gameState.matchScore };
    newMatchScore[winner]++;

    return {
      ...gameState,
      gameResults: newGameResults,
      matchScore: newMatchScore,
      status: 'game_over',
      winner
    };
  }
}
