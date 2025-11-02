import {
  Player,
  Connect4Config,
  Connect4GameState,
  Connect4BoardSize,
  Connect4CellValue,
  Connect4Move,
  PowerUp,
  PowerUpTypeConnect4,
  Connect4GameResult,
  Connect4MatchScore,
  Connect4Player
} from '@gaming-hub/shared';

export class Connect4Game {
  /**
   * Initialize a new Connect 4 tournament
   */
  static initializeGame(players: Player[], config: Connect4Config): Connect4GameState {
    if (players.length !== 2) {
      throw new Error('Connect 4 requires exactly 2 players');
    }

    const { rows, cols } = this.parseBoardSize(config.boardSize);
    const emptyBoard = this.createEmptyBoard(rows, cols);

    return {
      config,
      board: emptyBoard,
      currentPlayer: 'Yellow',
      gameNumber: 1,
      matchScore: {
        Yellow: 0,
        Red: 0,
        draws: 0
      },
      moves: [],
      powerUps: config.powerUpsEnabled ? this.initializePowerUps(players) : [],
      blockedColumns: [],
      moveStartTime: Date.now(),
      gameResults: [],
      status: 'playing',
      winner: null
    };
  }

  /**
   * Parse board size string into dimensions
   */
  private static parseBoardSize(size: Connect4BoardSize): { rows: number; cols: number } {
    const [rows, cols] = size.split('x').map(Number);
    return { rows, cols };
  }

  /**
   * Create an empty board of specified dimensions
   */
  private static createEmptyBoard(rows: number, cols: number): Connect4CellValue[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(null));
  }

  /**
   * Initialize power-ups for both players
   */
  private static initializePowerUps(players: Player[]): PowerUp[] {
    const powerUpTypes: PowerUpTypeConnect4[] = ['remove_disc', 'block_column', 'swap_colors', 'extra_turn'];
    return players.flatMap((player, index) =>
      powerUpTypes.map(type => ({
        type: type as any, // Cast to satisfy PowerUpType
        playerId: player.id,
        used: false
      }))
    );
  }

  /**
   * Check if a column is full
   */
  private static isColumnFull(board: Connect4CellValue[][], col: number): boolean {
    return board[0][col] !== null;
  }

  /**
   * Drop a disc into a column (gravity-based)
   */
  private static dropDisc(
    board: Connect4CellValue[][],
    col: number,
    player: Connect4Player
  ): { board: Connect4CellValue[][]; row: number } {
    const newBoard = board.map(r => [...r]);

    // Find the lowest empty row in this column
    for (let row = newBoard.length - 1; row >= 0; row--) {
      if (newBoard[row][col] === null) {
        newBoard[row][col] = player;
        return { board: newBoard, row };
      }
    }

    throw new Error('Column is full');
  }

  /**
   * Make a move on the board
   */
  static makeMove(
    gameState: Connect4GameState,
    playerId: string,
    players: Player[],
    col: number
  ): { gameState: Connect4GameState; move: Connect4Move; gameOver: boolean } {
    if (gameState.status !== 'playing') {
      throw new Error('Game is not in playing state');
    }

    // Determine which color this player is
    const playerIndex = players.findIndex(p => p.id === playerId);
    const playerColor: Connect4Player = playerIndex === 0 ? 'Yellow' : 'Red';

    // Validate it's the player's turn
    if (gameState.currentPlayer !== playerColor) {
      throw new Error('Not your turn');
    }

    const { rows, cols } = this.parseBoardSize(gameState.config.boardSize);

    // Validate column
    if (col < 0 || col >= cols) {
      throw new Error('Invalid column');
    }

    // Check if column is blocked
    if (gameState.blockedColumns.includes(col)) {
      throw new Error('This column is blocked');
    }

    // Check if column is full
    if (this.isColumnFull(gameState.board, col)) {
      throw new Error('Column is full');
    }

    // Drop the disc
    const { board: newBoard, row } = this.dropDisc(gameState.board, col, playerColor);

    const move: Connect4Move = {
      col,
      row,
      player: playerColor,
      timestamp: Date.now()
    };

    const newMoves = [...gameState.moves, move];

    // Clear blocked columns after use
    const clearedBlockedColumns: number[] = [];

    // Check for winner (4-in-a-row from the last move)
    const winner = this.checkWinner(newBoard, row, col, playerColor);
    const isDraw = !winner && this.isBoardFull(newBoard);

    let newGameState: Connect4GameState;

    if (winner || isDraw) {
      // Game over
      const gameResult: Connect4GameResult = {
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
        blockedColumns: clearedBlockedColumns,
        gameResults: newGameResults,
        matchScore: newMatchScore,
        status: 'game_over',
        winner: winner || 'draw'
      };

      return { gameState: newGameState, move, gameOver: true };
    } else {
      // Continue playing - switch turns
      const nextPlayer: Connect4Player = gameState.currentPlayer === 'Yellow' ? 'Red' : 'Yellow';

      newGameState = {
        ...gameState,
        board: newBoard,
        currentPlayer: nextPlayer,
        moves: newMoves,
        blockedColumns: clearedBlockedColumns,
        moveStartTime: Date.now()
      };

      return { gameState: newGameState, move, gameOver: false };
    }
  }

  /**
   * Use a power-up
   */
  static usePowerUp(
    gameState: Connect4GameState,
    playerId: string,
    players: Player[],
    powerUpType: PowerUpTypeConnect4,
    targetCol?: number,
    targetRow?: number
  ): { gameState: Connect4GameState; result: string } {
    if (!gameState.config.powerUpsEnabled) {
      throw new Error('Power-ups are not enabled');
    }

    const playerIndex = players.findIndex(p => p.id === playerId);
    const playerColor: Connect4Player = playerIndex === 0 ? 'Yellow' : 'Red';

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
      case 'remove_disc':
        // Remove an opponent's disc
        if (targetRow === undefined || targetCol === undefined) {
          throw new Error('Target position required for remove_disc power-up');
        }

        const opponentColor: Connect4Player = playerColor === 'Yellow' ? 'Red' : 'Yellow';

        if (gameState.board[targetRow][targetCol] !== opponentColor) {
          throw new Error('Can only remove opponent discs');
        }

        const newBoardRemove = gameState.board.map(r => [...r]);

        // Remove the disc and apply gravity
        newBoardRemove[targetRow][targetCol] = null;

        // Apply gravity to the column
        for (let row = targetRow; row > 0; row--) {
          newBoardRemove[row][targetCol] = newBoardRemove[row - 1][targetCol];
        }
        newBoardRemove[0][targetCol] = null;

        newGameState.board = newBoardRemove;
        result = `Removed disc at column ${targetCol}`;
        break;

      case 'block_column':
        // Block a column for one turn
        if (targetCol === undefined) {
          throw new Error('Target column required for block_column power-up');
        }

        const { cols } = this.parseBoardSize(gameState.config.boardSize);
        if (targetCol < 0 || targetCol >= cols) {
          throw new Error('Invalid column');
        }

        if (this.isColumnFull(gameState.board, targetCol)) {
          throw new Error('Cannot block a full column');
        }

        newGameState.blockedColumns = [...gameState.blockedColumns, targetCol];
        result = `Blocked column ${targetCol}`;
        break;

      case 'swap_colors':
        // Swap all discs on the board
        const newBoardSwap = gameState.board.map(row =>
          row.map(cell => {
            if (cell === 'Yellow') return 'Red';
            if (cell === 'Red') return 'Yellow';
            return null;
          })
        );
        newGameState.board = newBoardSwap;
        result = 'Swapped all disc colors';
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
  static nextGameInSeries(gameState: Connect4GameState): Connect4GameState {
    if (gameState.status !== 'game_over') {
      throw new Error('Current game is not over');
    }

    // Check if match is over
    const gamesNeededToWin = Math.ceil(gameState.config.bestOf / 2);

    if (gameState.matchScore.Yellow >= gamesNeededToWin ||
        gameState.matchScore.Red >= gamesNeededToWin) {
      return {
        ...gameState,
        status: 'match_over'
      };
    }

    // Start new game
    const { rows, cols } = this.parseBoardSize(gameState.config.boardSize);
    const emptyBoard = this.createEmptyBoard(rows, cols);

    // Alternate who starts
    const newStartingPlayer: Connect4Player = gameState.gameNumber % 2 === 0 ? 'Yellow' : 'Red';

    return {
      ...gameState,
      board: emptyBoard,
      currentPlayer: newStartingPlayer,
      gameNumber: gameState.gameNumber + 1,
      moves: [],
      blockedColumns: [],
      moveStartTime: Date.now(),
      status: 'playing',
      winner: null
    };
  }

  /**
   * Check if there's a winner (4-in-a-row from the last move position)
   * Optimized O(1) approach - only check from last move
   */
  private static checkWinner(
    board: Connect4CellValue[][],
    row: number,
    col: number,
    player: Connect4Player
  ): Connect4Player | null {
    const rows = board.length;
    const cols = board[0].length;

    // Check horizontal
    let count = 1;

    // Check left
    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) {
      count++;
    }

    // Check right
    for (let c = col + 1; c < cols && board[row][c] === player; c++) {
      count++;
    }

    if (count >= 4) return player;

    // Check vertical (only need to check downward)
    count = 1;
    for (let r = row + 1; r < rows && board[r][col] === player; r++) {
      count++;
    }

    if (count >= 4) return player;

    // Check diagonal (bottom-left to top-right)
    count = 1;

    // Check down-left
    for (let r = row + 1, c = col - 1; r < rows && c >= 0 && board[r][c] === player; r++, c--) {
      count++;
    }

    // Check up-right
    for (let r = row - 1, c = col + 1; r >= 0 && c < cols && board[r][c] === player; r--, c++) {
      count++;
    }

    if (count >= 4) return player;

    // Check anti-diagonal (top-left to bottom-right)
    count = 1;

    // Check up-left
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && board[r][c] === player; r--, c--) {
      count++;
    }

    // Check down-right
    for (let r = row + 1, c = col + 1; r < rows && c < cols && board[r][c] === player; r++, c++) {
      count++;
    }

    if (count >= 4) return player;

    return null;
  }

  /**
   * Check if board is full (for draw detection)
   */
  private static isBoardFull(board: Connect4CellValue[][]): boolean {
    // Check if top row is full
    return board[0].every(cell => cell !== null);
  }

  /**
   * Get match statistics
   */
  static getMatchStats(gameState: Connect4GameState) {
    const totalGames = gameState.gameResults.length;
    const averageGameDuration = totalGames > 0
      ? gameState.gameResults.reduce((sum, g) => sum + g.duration, 0) / totalGames
      : 0;

    const gamesNeededToWin = Math.ceil(gameState.config.bestOf / 2);
    const matchWinner =
      gameState.matchScore.Yellow >= gamesNeededToWin ? 'Yellow' :
      gameState.matchScore.Red >= gamesNeededToWin ? 'Red' :
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
  static getAvailablePowerUps(gameState: Connect4GameState, playerId: string): PowerUp[] {
    return gameState.powerUps.filter(pu => pu.playerId === playerId && !pu.used);
  }

  /**
   * Check if time limit has been exceeded
   */
  static hasTimeLimitExceeded(gameState: Connect4GameState): boolean {
    if (gameState.config.timeLimit === 0) {
      return false; // No time limit
    }

    const timeElapsed = (Date.now() - gameState.moveStartTime) / 1000;
    return timeElapsed > gameState.config.timeLimit;
  }

  /**
   * Handle time limit expiration (auto-forfeit)
   */
  static handleTimeExpired(gameState: Connect4GameState): Connect4GameState {
    // Current player loses their turn and loses the game
    const winner: Connect4Player = gameState.currentPlayer === 'Yellow' ? 'Red' : 'Yellow';

    const gameResult: Connect4GameResult = {
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
