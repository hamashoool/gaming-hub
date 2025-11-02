// Base game interface for modular game architecture
export interface Game {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}

// Player information
export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  userId?: string; // Optional: linked user account
}

// Room state
export interface Room {
  id: string;
  gameId: string;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  isPermanent?: boolean; // True for permanent user rooms
  ownerId?: string; // User ID of room owner (for permanent rooms)
  name?: string; // Display name for permanent rooms
}

// Number Guessing Game specific types
export interface NumberGuessingGameConfig {
  minRange: number;
  maxRange: number;
}

export interface NumberGuessingGameState {
  targetNumber: number;
  config: NumberGuessingGameConfig;
  currentTurn: string; // player ID
  guesses: Guess[];
  winner?: string; // player ID
  status: 'setup' | 'playing' | 'finished';
}

export interface Guess {
  playerId: string;
  playerName: string;
  number: number;
  feedback: 'too_low' | 'too_high' | 'correct';
  timestamp: number;
}

// Would You Rather Game specific types
export type QuestionCategory = 'food' | 'travel' | 'lifestyle' | 'deep' | 'fun';
export type GameMode = 'casual' | 'compatibility';

export interface WouldYouRatherConfig {
  categories: QuestionCategory[];
  maxRounds: number;
  mode: GameMode;
}

export interface Question {
  id: string;
  category: QuestionCategory;
  optionA: string;
  optionB: string;
}

export interface Choice {
  playerId: string;
  playerName: string;
  choice: 'A' | 'B';
  timestamp: number;
}

export interface RoundResult {
  round: number;
  question: Question;
  choices: Choice[];
  isMatch: boolean;
}

export interface WouldYouRatherGameState {
  config: WouldYouRatherConfig;
  currentRound: number;
  currentQuestion: Question | null;
  choices: Choice[];
  roundResults: RoundResult[];
  matchCount: number;
  status: 'setup' | 'playing' | 'revealing' | 'finished';
}

// This or That Game specific types
export interface ThisOrThatQuestion {
  id: string;
  category: QuestionCategory;
  optionA: {
    text: string;
    emoji: string;
  };
  optionB: {
    text: string;
    emoji: string;
  };
}

export interface ThisOrThatChoice {
  playerId: string;
  playerName: string;
  choice: 'A' | 'B';
  timestamp: number;
}

export interface ThisOrThatRoundResult {
  round: number;
  question: ThisOrThatQuestion;
  choices: ThisOrThatChoice[];
  isMatch: boolean;
  timeElapsed: number;
}

export interface ThisOrThatConfig {
  categories: QuestionCategory[];
  maxRounds: number;
  timePerQuestion: number; // seconds
}

export interface ThisOrThatGameState {
  config: ThisOrThatConfig;
  currentRound: number;
  currentQuestion: ThisOrThatQuestion | null;
  choices: ThisOrThatChoice[];
  roundResults: ThisOrThatRoundResult[];
  matchCount: number;
  questionStartTime: number;
  status: 'setup' | 'playing' | 'finished';
}

// Tic Tac Toe Game specific types
export type BoardSize = 3 | 4 | 5;
export type CellValue = 'X' | 'O' | null;
export type PowerUpType = 'steal' | 'block' | 'extra_turn';

// Connect 4 Game specific types
export type Connect4BoardSize = '6x7' | '7x8' | '8x9';
export type Connect4Player = 'Yellow' | 'Red';
export type Connect4CellValue = 'Yellow' | 'Red' | null;
export type PowerUpTypeConnect4 = 'remove_disc' | 'block_column' | 'swap_colors' | 'extra_turn';

export interface TicTacToeConfig {
  boardSize: BoardSize;
  bestOf: number; // 3, 5, or 7
  timeLimit: number; // seconds per move, 0 = unlimited
  powerUpsEnabled: boolean;
}

export interface PowerUp {
  type: PowerUpType;
  playerId: string;
  used: boolean;
}

export interface TicTacToeMove {
  row: number;
  col: number;
  player: 'X' | 'O';
  timestamp: number;
}

export interface GameResult {
  gameNumber: number;
  winner: 'X' | 'O' | 'draw';
  moves: TicTacToeMove[];
  duration: number;
}

export interface MatchScore {
  X: number;
  O: number;
  draws: number;
}

export interface TicTacToeGameState {
  config: TicTacToeConfig;
  board: CellValue[][];
  currentPlayer: 'X' | 'O';
  gameNumber: number;
  matchScore: MatchScore;
  moves: TicTacToeMove[];
  powerUps: PowerUp[];
  blockedCell: { row: number; col: number } | null;
  moveStartTime: number;
  gameResults: GameResult[];
  status: 'setup' | 'playing' | 'game_over' | 'match_over';
  winner: 'X' | 'O' | 'draw' | null;
}

// Connect 4 Game specific types
export interface Connect4Config {
  boardSize: Connect4BoardSize;
  bestOf: number; // 3, 5, or 7
  timeLimit: number; // seconds per move, 0 = unlimited
  powerUpsEnabled: boolean;
}

export interface Connect4Move {
  col: number;
  row: number; // Calculated by gravity
  player: Connect4Player;
  timestamp: number;
}

export interface Connect4GameResult {
  gameNumber: number;
  winner: Connect4Player | 'draw';
  moves: Connect4Move[];
  duration: number;
}

export interface Connect4MatchScore {
  Yellow: number;
  Red: number;
  draws: number;
}

export interface Connect4GameState {
  config: Connect4Config;
  board: Connect4CellValue[][];
  currentPlayer: Connect4Player;
  gameNumber: number;
  matchScore: Connect4MatchScore;
  moves: Connect4Move[];
  powerUps: PowerUp[];
  blockedColumns: number[];
  moveStartTime: number;
  gameResults: Connect4GameResult[];
  status: 'playing' | 'game_over' | 'match_over';
  winner: Connect4Player | 'draw' | null;
}

// Rock Paper Scissors Game specific types
export type RPSVariant = 'classic' | 'extended';
export type RPSChoice = 'rock' | 'paper' | 'scissors' | 'lizard' | 'spock';
export type RPSPowerUpType = 'reveal' | 'shield' | 'double_points';
export type RPSPlayer = 'Player1' | 'Player2';

export interface RPSConfig {
  variant: RPSVariant;
  bestOf: number; // 3, 5, or 7
  timeLimit: number; // seconds per round, 0 = unlimited
  powerUpsEnabled: boolean;
}

export interface RPSPlayerChoice {
  playerId: string;
  playerName: string;
  choice: RPSChoice | null;
  timestamp: number;
  powerUpUsed?: RPSPowerUpType;
}

export interface RPSRound {
  roundNumber: number;
  player1Choice: RPSChoice;
  player2Choice: RPSChoice;
  winner: RPSPlayer | 'draw';
  player1PowerUp?: RPSPowerUpType;
  player2PowerUp?: RPSPowerUpType;
  doublePoints: boolean;
  duration: number;
}

export interface RPSMatchScore {
  Player1: number;
  Player2: number;
  draws: number;
}

export interface RPSGameState {
  config: RPSConfig;
  currentRound: number;
  roundResults: RPSRound[];
  matchScore: RPSMatchScore;
  player1Choice: RPSChoice | null;
  player2Choice: RPSChoice | null;
  powerUps: PowerUp[];
  roundStartTime: number;
  status: 'waiting' | 'playing' | 'round_over' | 'match_over';
  winner: RPSPlayer | 'draw' | null;
  shieldActive: { Player1: boolean; Player2: boolean };
}

// Hangman Game specific types
export type HangmanMode = 'pvp' | 'coop';
export type HangmanCategory = 'movies' | 'animals' | 'countries' | 'food' | 'sports' | 'technology';
export type HangmanDifficulty = 'easy' | 'medium' | 'hard';
export type HangmanPowerUpType = 'reveal_letter' | 'remove_wrong' | 'extra_guess';

export interface HangmanConfig {
  mode: HangmanMode;
  category: HangmanCategory;
  difficulty: HangmanDifficulty;
  timeLimit: number; // seconds per guess, 0 = unlimited
  powerUpsEnabled: boolean;
  maxWrongGuesses: number; // default 6
}

export interface HangmanGuess {
  playerId: string;
  playerName: string;
  letter: string;
  correct: boolean;
  timestamp: number;
}

export interface HangmanGameState {
  config: HangmanConfig;
  word: string; // The word to guess
  wordSetter: string | null; // Player ID who set the word in PvP mode, null in coop
  category: HangmanCategory; // The category of the word
  guessedLetters: string[]; // All letters that have been guessed
  wrongGuesses: string[]; // Incorrect letter guesses
  wrongGuessCount: number;
  powerUps: PowerUp[];
  guessStartTime: number;
  guessHistory: HangmanGuess[];
  status: 'setup' | 'playing' | 'won' | 'lost';
  winner: string | 'team' | null; // player ID, 'team' for coop, or null
}

// Socket event types
export enum SocketEvents {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // Authentication events
  AUTH_LOGIN = 'auth_login',
  AUTH_SIGNUP = 'auth_signup',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_SUCCESS = 'auth_success',
  AUTH_ERROR = 'auth_error',

  // Room events
  CREATE_ROOM = 'create_room',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left',
  ROOM_UPDATED = 'room_updated',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',

  // Permanent room events
  CREATE_PERMANENT_ROOM = 'create_permanent_room',
  GET_MY_ROOM = 'get_my_room',
  MY_ROOM_DATA = 'my_room_data',
  GET_PUBLIC_ROOMS = 'get_public_rooms',
  PUBLIC_ROOMS_LIST = 'public_rooms_list',
  UPDATE_ROOM_NAME = 'update_room_name',
  ROOM_NAME_UPDATED = 'room_name_updated',
  KICK_PLAYER = 'kick_player',
  PLAYER_KICKED = 'player_kicked',

  // Game events
  START_GAME = 'start_game',
  GAME_STARTED = 'game_started',
  MAKE_GUESS = 'make_guess',
  GUESS_RESULT = 'guess_result',
  GAME_FINISHED = 'game_finished',
  TURN_CHANGED = 'turn_changed',
  PLAY_AGAIN = 'play_again',
  GAME_RESET = 'game_reset',

  // Would You Rather events
  SUBMIT_CHOICE = 'submit_choice',
  CHOICE_SUBMITTED = 'choice_submitted',
  CHOICES_REVEALED = 'choices_revealed',
  NEXT_QUESTION = 'next_question',

  // This or That events
  SUBMIT_THIS_OR_THAT_CHOICE = 'submit_this_or_that_choice',
  THIS_OR_THAT_CHOICE_SUBMITTED = 'this_or_that_choice_submitted',
  THIS_OR_THAT_ROUND_COMPLETE = 'this_or_that_round_complete',
  THIS_OR_THAT_AUTO_NEXT = 'this_or_that_auto_next',

  // Tic Tac Toe events
  MAKE_MOVE = 'make_move',
  MOVE_MADE = 'move_made',
  USE_POWER_UP = 'use_power_up',
  POWER_UP_USED = 'power_up_used',
  TIC_TAC_TOE_GAME_OVER = 'tic_tac_toe_game_over',
  NEXT_GAME_IN_SERIES = 'next_game_in_series',
  MATCH_OVER = 'match_over',

  // Game switching events
  CHANGE_GAME = 'change_game',
  GAME_CHANGED = 'game_changed',

  // Connect 4 events
  CONNECT_4_MOVE_MADE = 'connect_4_move_made',
  CONNECT_4_GAME_OVER = 'connect_4_game_over',

  // Rock Paper Scissors events
  RPS_SUBMIT_CHOICE = 'rps_submit_choice',
  RPS_CHOICE_SUBMITTED = 'rps_choice_submitted',
  RPS_ROUND_COMPLETE = 'rps_round_complete',
  RPS_MATCH_OVER = 'rps_match_over',

  // Hangman events
  HANGMAN_SET_WORD = 'hangman_set_word',
  HANGMAN_WORD_SET = 'hangman_word_set',
  HANGMAN_GUESS_LETTER = 'hangman_guess_letter',
  HANGMAN_LETTER_GUESSED = 'hangman_letter_guessed',
  HANGMAN_GAME_OVER = 'hangman_game_over',

  // Error events
  ERROR = 'error'
}

// Socket event payloads
export interface CreateRoomPayload {
  playerName: string;
  gameId: string;
  config?: NumberGuessingGameConfig | WouldYouRatherConfig | ThisOrThatConfig | TicTacToeConfig | Connect4Config | RPSConfig | HangmanConfig;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
}

export interface MakeGuessPayload {
  roomId: string;
  guess: number;
}

export interface SubmitChoicePayload {
  roomId: string;
  playerId: string;
  choice: 'A' | 'B';
}

export interface NextQuestionPayload {
  roomId: string;
}

// This or That payloads
export interface SubmitThisOrThatChoicePayload {
  roomId: string;
  playerId: string;
  choice: 'A' | 'B';
}

// Tic Tac Toe payloads
export interface MakeMovePayload {
  roomId: string;
  playerId: string;
  row: number;
  col: number;
}

export interface UsePowerUpPayload {
  roomId: string;
  playerId: string;
  powerUpType: PowerUpType;
  targetRow?: number;
  targetCol?: number;
}

export interface NextGamePayload {
  roomId: string;
}

export interface ChangeGamePayload {
  roomId: string;
  newGameId: string;
  config?: NumberGuessingGameConfig | WouldYouRatherConfig | ThisOrThatConfig | TicTacToeConfig | Connect4Config | RPSConfig | HangmanConfig;
}

export interface Connect4MakeMovePayload {
  roomId: string;
  playerId: string;
  col: number;
}

// Rock Paper Scissors payloads
export interface RPSSubmitChoicePayload {
  roomId: string;
  playerId: string;
  choice: RPSChoice;
  powerUpType?: RPSPowerUpType;
}

// Hangman payloads
export interface HangmanSetWordPayload {
  roomId: string;
  playerId: string;
  word: string;
}

export interface HangmanGuessLetterPayload {
  roomId: string;
  playerId: string;
  letter: string;
  powerUpType?: HangmanPowerUpType;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}
