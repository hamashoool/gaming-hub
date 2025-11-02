import {
  Player,
  HangmanConfig,
  HangmanGameState,
  HangmanGuess,
  HangmanCategory,
  HangmanDifficulty,
  HangmanPowerUpType,
  PowerUp
} from '@gaming-hub/shared';

// Word banks organized by category and difficulty
const WORD_BANK: Record<HangmanCategory, Record<HangmanDifficulty, string[]>> = {
  movies: {
    easy: ['STAR WARS', 'FROZEN', 'AVATAR', 'JAWS', 'ALIEN'],
    medium: ['INCEPTION', 'GLADIATOR', 'CASABLANCA', 'JURASSIC PARK'],
    hard: ['PULP FICTION', 'INTERSTELLAR', 'GOODFELLAS', 'BLADE RUNNER']
  },
  animals: {
    easy: ['CAT', 'DOG', 'LION', 'BEAR', 'TIGER'],
    medium: ['ELEPHANT', 'GIRAFFE', 'DOLPHIN', 'PENGUIN'],
    hard: ['RHINOCEROS', 'CHIMPANZEE', 'CROCODILE', 'HIPPOPOTAMUS']
  },
  countries: {
    easy: ['ITALY', 'CHINA', 'SPAIN', 'JAPAN', 'INDIA'],
    medium: ['GERMANY', 'BRAZIL', 'AUSTRALIA', 'ARGENTINA'],
    hard: ['SWITZERLAND', 'NETHERLANDS', 'PHILIPPINES', 'UZBEKISTAN']
  },
  food: {
    easy: ['PIZZA', 'PASTA', 'RICE', 'BREAD', 'TACO'],
    medium: ['BURRITO', 'LASAGNA', 'SUSHI', 'BURGER'],
    hard: ['QUESADILLA', 'CAPPUCCINO', 'CROISSANT', 'TIRAMISU']
  },
  sports: {
    easy: ['GOLF', 'SOCCER', 'TENNIS', 'RUGBY', 'BOXING'],
    medium: ['BASEBALL', 'SWIMMING', 'CRICKET', 'HOCKEY'],
    hard: ['BASKETBALL', 'BADMINTON', 'VOLLEYBALL', 'GYMNASTICS']
  },
  technology: {
    easy: ['PHONE', 'MOUSE', 'WIFI', 'EMAIL', 'CLOUD'],
    medium: ['COMPUTER', 'KEYBOARD', 'DATABASE', 'SOFTWARE'],
    hard: ['BLOCKCHAIN', 'ALGORITHM', 'ENCRYPTION', 'CYBERSECURITY']
  }
};

export class HangmanGame {
  /**
   * Initialize a new Hangman game
   */
  static initializeGame(players: Player[], config: HangmanConfig): HangmanGameState {
    if (players.length !== 2) {
      throw new Error('Hangman requires exactly 2 players');
    }

    // For coop mode, select a word from the word bank
    let word = '';
    let wordSetter = null;

    if (config.mode === 'coop') {
      word = this.selectRandomWord(config.category, config.difficulty);
    }

    return {
      config,
      word,
      wordSetter,
      category: config.category,
      guessedLetters: [],
      wrongGuesses: [],
      wrongGuessCount: 0,
      powerUps: config.powerUpsEnabled ? this.initializePowerUps(players) : [],
      guessStartTime: Date.now(),
      guessHistory: [],
      status: config.mode === 'pvp' ? 'setup' : 'playing',
      winner: null
    };
  }

  /**
   * Initialize power-ups for both players
   */
  private static initializePowerUps(players: Player[]): PowerUp[] {
    const powerUpTypes: HangmanPowerUpType[] = ['reveal_letter', 'remove_wrong', 'extra_guess'];
    return players.flatMap((player) =>
      powerUpTypes.map(type => ({
        type: type as any,
        playerId: player.id,
        used: false
      }))
    );
  }

  /**
   * Select a random word from the word bank
   */
  private static selectRandomWord(category: HangmanCategory, difficulty: HangmanDifficulty): string {
    const words = WORD_BANK[category][difficulty];
    return words[Math.floor(Math.random() * words.length)];
  }

  /**
   * Set the word in PvP mode
   */
  static setWord(
    gameState: HangmanGameState,
    playerId: string,
    word: string
  ): HangmanGameState {
    if (gameState.status !== 'setup') {
      throw new Error('Can only set word during setup phase');
    }

    if (gameState.config.mode !== 'pvp') {
      throw new Error('Word setting is only for PvP mode');
    }

    // Validate word (only letters and spaces, uppercase)
    const normalizedWord = word.toUpperCase().trim();
    if (!/^[A-Z\s]+$/.test(normalizedWord)) {
      throw new Error('Word must contain only letters and spaces');
    }

    // Check difficulty constraints
    const wordLength = normalizedWord.replace(/\s/g, '').length;
    const { difficulty } = gameState.config;

    if (difficulty === 'easy' && (wordLength < 4 || wordLength > 6)) {
      throw new Error('Easy mode: word must be 4-6 letters');
    } else if (difficulty === 'medium' && (wordLength < 7 || wordLength > 9)) {
      throw new Error('Medium mode: word must be 7-9 letters');
    } else if (difficulty === 'hard' && wordLength < 10) {
      throw new Error('Hard mode: word must be 10+ letters');
    }

    return {
      ...gameState,
      word: normalizedWord,
      wordSetter: playerId,
      status: 'playing'
    };
  }

  /**
   * Guess a letter
   */
  static guessLetter(
    gameState: HangmanGameState,
    playerId: string,
    players: Player[],
    letter: string,
    powerUpType?: HangmanPowerUpType
  ): { gameState: HangmanGameState; correct: boolean; gameOver: boolean } {
    if (gameState.status !== 'playing') {
      throw new Error('Cannot guess letter when game is not playing');
    }

    // Normalize letter
    const normalizedLetter = letter.toUpperCase().trim();
    if (!/^[A-Z]$/.test(normalizedLetter)) {
      throw new Error('Must guess a single letter');
    }

    // Check if letter already guessed
    if (gameState.guessedLetters.includes(normalizedLetter)) {
      throw new Error('Letter already guessed');
    }

    // Handle power-up if provided
    let updatedGameState = gameState;
    if (powerUpType && gameState.config.powerUpsEnabled) {
      updatedGameState = this.usePowerUp(gameState, playerId, powerUpType);
    }

    // Check if letter is in the word
    const correct = updatedGameState.word.includes(normalizedLetter);

    const newGuessedLetters = [...updatedGameState.guessedLetters, normalizedLetter];
    let newWrongGuesses = [...updatedGameState.wrongGuesses];
    let newWrongGuessCount = updatedGameState.wrongGuessCount;

    if (!correct) {
      newWrongGuesses.push(normalizedLetter);
      newWrongGuessCount++;
    }

    // Get player name
    const player = players.find(p => p.id === playerId);
    const playerName = player?.name || 'Unknown';

    const guess: HangmanGuess = {
      playerId,
      playerName,
      letter: normalizedLetter,
      correct,
      timestamp: Date.now()
    };

    const newGuessHistory = [...updatedGameState.guessHistory, guess];

    // Check if game is over
    const wordLetters = new Set(updatedGameState.word.replace(/\s/g, '').split(''));
    const guessedWordLetters = newGuessedLetters.filter(l => updatedGameState.word.includes(l));
    const allLettersGuessed = [...wordLetters].every(l => guessedWordLetters.includes(l));

    let status = updatedGameState.status;
    let winner = updatedGameState.winner;
    let gameOver = false;

    if (allLettersGuessed) {
      status = 'won';
      gameOver = true;
      if (updatedGameState.config.mode === 'coop') {
        winner = 'team';
      } else {
        // In PvP mode, the guesser wins
        winner = updatedGameState.wordSetter === playerId
          ? players.find(p => p.id !== playerId)?.id || null
          : playerId;
      }
    } else if (newWrongGuessCount >= updatedGameState.config.maxWrongGuesses) {
      status = 'lost';
      gameOver = true;
      if (updatedGameState.config.mode === 'coop') {
        winner = null; // Team lost
      } else {
        // In PvP mode, the word setter wins
        winner = updatedGameState.wordSetter;
      }
    }

    return {
      gameState: {
        ...updatedGameState,
        guessedLetters: newGuessedLetters,
        wrongGuesses: newWrongGuesses,
        wrongGuessCount: newWrongGuessCount,
        guessHistory: newGuessHistory,
        guessStartTime: Date.now(),
        status,
        winner
      },
      correct,
      gameOver
    };
  }

  /**
   * Use a power-up
   */
  private static usePowerUp(
    gameState: HangmanGameState,
    playerId: string,
    powerUpType: HangmanPowerUpType
  ): HangmanGameState {
    const powerUpIndex = gameState.powerUps.findIndex(
      pu => pu.playerId === playerId && (pu.type as any) === powerUpType && !pu.used
    );

    if (powerUpIndex === -1) {
      throw new Error('Power-up not available');
    }

    const newPowerUps = [...gameState.powerUps];
    newPowerUps[powerUpIndex] = { ...newPowerUps[powerUpIndex], used: true };

    let updatedState = { ...gameState, powerUps: newPowerUps };

    // Apply power-up effects
    if (powerUpType === 'reveal_letter') {
      // Reveal a random unguessed letter from the word
      const wordLetters = [...new Set(gameState.word.replace(/\s/g, '').split(''))];
      const unguessedLetters = wordLetters.filter(l => !gameState.guessedLetters.includes(l));

      if (unguessedLetters.length > 0) {
        const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
        updatedState.guessedLetters = [...updatedState.guessedLetters, randomLetter];
      }
    } else if (powerUpType === 'remove_wrong') {
      // Remove the last wrong guess
      if (gameState.wrongGuesses.length > 0) {
        updatedState.wrongGuesses = gameState.wrongGuesses.slice(0, -1);
        updatedState.wrongGuessCount = Math.max(0, gameState.wrongGuessCount - 1);
      }
    } else if (powerUpType === 'extra_guess') {
      // This power-up is passive - it adds an extra guess to the max
      // We'll track this by temporarily not counting a wrong guess
      // This is handled in the socket handler by checking if power-up was used
    }

    return updatedState;
  }

  /**
   * Get available power-ups for a player
   */
  static getAvailablePowerUps(gameState: HangmanGameState, playerId: string): PowerUp[] {
    return gameState.powerUps.filter(pu => pu.playerId === playerId && !pu.used);
  }

  /**
   * Get the masked word (showing guessed letters)
   */
  static getMaskedWord(gameState: HangmanGameState): string {
    return gameState.word
      .split('')
      .map(char => {
        if (char === ' ') return ' ';
        return gameState.guessedLetters.includes(char) ? char : '_';
      })
      .join('');
  }

  /**
   * Check if time limit has been exceeded
   */
  static hasTimeLimitExceeded(gameState: HangmanGameState): boolean {
    if (gameState.config.timeLimit === 0) {
      return false; // No time limit
    }

    const timeElapsed = (Date.now() - gameState.guessStartTime) / 1000;
    return timeElapsed > gameState.config.timeLimit;
  }

  /**
   * Get game statistics
   */
  static getGameStats(gameState: HangmanGameState) {
    const totalGuesses = gameState.guessHistory.length;
    const correctGuesses = gameState.guessHistory.filter(g => g.correct).length;
    const wrongGuesses = gameState.wrongGuessCount;
    const accuracy = totalGuesses > 0 ? (correctGuesses / totalGuesses) * 100 : 0;

    return {
      totalGuesses,
      correctGuesses,
      wrongGuesses,
      accuracy: Math.round(accuracy),
      maskedWord: this.getMaskedWord(gameState),
      isComplete: gameState.status === 'won' || gameState.status === 'lost'
    };
  }
}
