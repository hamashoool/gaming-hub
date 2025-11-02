import { Server, Socket } from 'socket.io';
import {
  SocketEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  MakeGuessPayload,
  SubmitChoicePayload,
  NextQuestionPayload,
  SubmitThisOrThatChoicePayload,
  MakeMovePayload,
  UsePowerUpPayload,
  NextGamePayload,
  ChangeGamePayload,
  ErrorPayload,
  NumberGuessingGameConfig,
  NumberGuessingGameState,
  WouldYouRatherConfig,
  WouldYouRatherGameState,
  ThisOrThatConfig,
  ThisOrThatGameState,
  TicTacToeConfig,
  TicTacToeGameState,
  Connect4Config,
  Connect4GameState,
  Connect4MakeMovePayload,
  RPSConfig,
  RPSGameState,
  RPSSubmitChoicePayload,
  HangmanConfig,
  HangmanGameState,
  HangmanSetWordPayload,
  HangmanGuessLetterPayload,
  CreatePermanentRoomPayload,
  UpdateRoomNamePayload,
  KickPlayerPayload
} from '@gaming-hub/shared';
import { RoomManager } from './managers/RoomManager';
import { GameStateManager } from './managers/GameStateManager';
import { RoomRepository } from './repositories/RoomRepository';
import { NumberGuessingGame } from './games/NumberGuessingGame';
import { WouldYouRatherGame } from './games/WouldYouRatherGame';
import { ThisOrThatGame } from './games/ThisOrThatGame';
import { TicTacToeGame } from './games/TicTacToeGame';
import { Connect4Game } from './games/Connect4Game';
import { RockPaperScissorsGame } from './games/RockPaperScissorsGame';
import { HangmanGame } from './games/HangmanGame';

export class SocketHandler {
  private io: Server;
  private roomManager: RoomManager;
  private gameStateManager: GameStateManager;
  private playerSocketMap: Map<string, string> = new Map(); // playerId -> socketId

  constructor(io: Server) {
    this.io = io;
    this.roomManager = RoomManager.getInstance();
    this.gameStateManager = GameStateManager.getInstance();
  }

  initialize() {
    this.io.on(SocketEvents.CONNECT, (socket: Socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      this.handleCreateRoom(socket);
      this.handleJoinRoom(socket);
      this.handleLeaveRoom(socket);
      this.handleStartGame(socket);
      this.handleMakeGuess(socket);
      this.handleSubmitChoice(socket);
      this.handleNextQuestion(socket);
      this.handleSubmitThisOrThatChoice(socket);
      this.handleMakeMove(socket);
      this.handleUsePowerUp(socket);
      this.handleNextGameInSeries(socket);
      this.handleConnect4MakeMove(socket);
      this.handleRPSSubmitChoice(socket);
      this.handleHangmanSetWord(socket);
      this.handleHangmanGuessLetter(socket);
      this.handleChangeGame(socket);
      this.handlePlayAgain(socket);

      // Permanent room handlers
      this.handleCreatePermanentRoom(socket);
      this.handleGetMyRoom(socket);
      this.handleGetPublicRooms(socket);
      this.handleUpdateRoomName(socket);
      this.handleKickPlayer(socket);

      this.handleDisconnect(socket);
    });
  }

  private handleCreateRoom(socket: Socket) {
    socket.on(SocketEvents.CREATE_ROOM, (payload: CreateRoomPayload) => {
      try {
        const { playerName, gameId, config } = payload;
        // Pass userId if authenticated
        const { room, player } = this.roomManager.createRoom(gameId, playerName, 2, socket.userId);

        // Store player-socket mapping
        this.playerSocketMap.set(player.id, socket.id);

        // Join socket room
        socket.join(room.id);

        // Send response to creator
        socket.emit(SocketEvents.ROOM_CREATED, { room, playerId: player.id });

        console.log(`🎮 Room created: ${room.id} by ${playerName}`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleJoinRoom(socket: Socket) {
    socket.on(SocketEvents.JOIN_ROOM, (payload: JoinRoomPayload) => {
      try {
        const { roomId, playerName } = payload;
        // Pass userId if authenticated
        const result = this.roomManager.joinRoom(roomId, playerName, socket.userId);

        if (!result) {
          this.emitError(socket, 'Failed to join room');
          return;
        }

        const { room, player } = result;

        // Store player-socket mapping
        this.playerSocketMap.set(player.id, socket.id);

        // Join socket room
        socket.join(room.id);

        // Notify the joining player
        socket.emit(SocketEvents.ROOM_JOINED, { room, playerId: player.id });

        // Notify all players in the room
        this.io.to(room.id).emit(SocketEvents.PLAYER_JOINED, { player, room });

        console.log(`👤 ${playerName} joined room: ${roomId}`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleLeaveRoom(socket: Socket) {
    socket.on(SocketEvents.LEAVE_ROOM, async ({ roomId, playerId }: { roomId: string; playerId: string }) => {
      try {
        const room = await this.roomManager.leaveRoom(roomId, playerId);

        socket.leave(roomId);
        this.playerSocketMap.delete(playerId);

        if (room) {
          // Notify remaining players
          this.io.to(roomId).emit(SocketEvents.PLAYER_LEFT, { playerId, room });
        } else {
          // Room was deleted (empty)
          this.gameStateManager.deleteGameState(roomId);
        }

        console.log(`👋 Player ${playerId} left room: ${roomId}`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleStartGame(socket: Socket) {
    socket.on(SocketEvents.START_GAME, ({ roomId, config }: { roomId: string; config?: NumberGuessingGameConfig | WouldYouRatherConfig | ThisOrThatConfig | TicTacToeConfig | Connect4Config | RPSConfig | HangmanConfig }) => {
      try {
        const room = this.roomManager.getRoom(roomId);

        if (!room) {
          this.emitError(socket, 'Room not found');
          return;
        }

        if (room.players.length < 2) {
          this.emitError(socket, 'Need at least 2 players to start');
          return;
        }

        // Update room status
        this.roomManager.updateRoom(roomId, { status: 'playing' });

        // Initialize game based on gameId
        if (room.gameId === 'number-guessing') {
          const gameConfig: NumberGuessingGameConfig = (config as NumberGuessingGameConfig) || {
            minRange: 1,
            maxRange: 100
          };

          const gameState = NumberGuessingGame.initializeGame(room.players, gameConfig);
          this.gameStateManager.setGameState(roomId, gameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_STARTED, {
            room,
            gameState: {
              ...gameState,
              targetNumber: undefined // Don't send target number to clients
            }
          });

          console.log(`🎯 Game started in room: ${roomId}`);
        } else if (room.gameId === 'would-you-rather') {
          const gameConfig: WouldYouRatherConfig = config as WouldYouRatherConfig || {
            categories: ['food', 'travel', 'lifestyle', 'deep', 'fun'],
            maxRounds: 10,
            mode: 'compatibility'
          };

          const gameState = WouldYouRatherGame.initializeGame(room.players, gameConfig);
          this.gameStateManager.setGameState(roomId, gameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_STARTED, {
            room,
            gameState
          });

          console.log(`🤔 Would You Rather game started in room: ${roomId}`);
        } else if (room.gameId === 'this-or-that') {
          const gameConfig: ThisOrThatConfig = config as ThisOrThatConfig || {
            categories: ['food', 'travel', 'lifestyle', 'deep', 'fun'],
            maxRounds: 10,
            timePerQuestion: 10
          };

          const gameState = ThisOrThatGame.initializeGame(room.players, gameConfig);
          this.gameStateManager.setGameState(roomId, gameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_STARTED, {
            room,
            gameState
          });

          console.log(`⚡ This or That game started in room: ${roomId}`);
        } else if (room.gameId === 'tic-tac-toe') {
          const gameConfig: TicTacToeConfig = config as TicTacToeConfig || {
            boardSize: 3,
            bestOf: 3,
            timeLimit: 0,
            powerUpsEnabled: false
          };

          const gameState = TicTacToeGame.initializeGame(room.players, gameConfig);
          this.gameStateManager.setGameState(roomId, gameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_STARTED, {
            room,
            gameState
          });

          console.log(`⭕ Tic Tac Toe tournament started in room: ${roomId}`);
        } else if (room.gameId === 'connect-4') {
          const gameConfig: Connect4Config = config as Connect4Config || {
            boardSize: '6x7',
            bestOf: 3,
            timeLimit: 0,
            powerUpsEnabled: false
          };

          const gameState = Connect4Game.initializeGame(room.players, gameConfig);
          this.gameStateManager.setGameState(roomId, gameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_STARTED, {
            room,
            gameState
          });

          console.log(`🔴 Connect 4 tournament started in room: ${roomId}`);
        } else if (room.gameId === 'rock-paper-scissors') {
          const gameConfig: RPSConfig = config as RPSConfig || {
            variant: 'classic',
            bestOf: 3,
            timeLimit: 0,
            powerUpsEnabled: false
          };

          const gameState = RockPaperScissorsGame.initializeGame(room.players, gameConfig);
          this.gameStateManager.setGameState(roomId, gameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_STARTED, {
            room,
            gameState
          });

          console.log(`🪨 Rock Paper Scissors tournament started in room: ${roomId}`);
        } else if (room.gameId === 'hangman') {
          const gameConfig: HangmanConfig = config as HangmanConfig || {
            mode: 'coop',
            category: 'movies',
            difficulty: 'medium',
            timeLimit: 0,
            powerUpsEnabled: false,
            maxWrongGuesses: 6
          };

          const gameState = HangmanGame.initializeGame(room.players, gameConfig);
          this.gameStateManager.setGameState(roomId, gameState);

          // Notify all players - hide word in PvP setup, hide word entirely in coop
          const safeGameState = gameConfig.mode === 'coop'
            ? { ...gameState, word: gameState.word.replace(/[A-Z]/g, '_') }
            : gameState.status === 'setup'
            ? gameState
            : { ...gameState, word: gameState.word.replace(/[A-Z]/g, '_') };

          this.io.to(roomId).emit(SocketEvents.GAME_STARTED, {
            room,
            gameState: safeGameState
          });

          console.log(`📝 Hangman game started in room: ${roomId} (${gameConfig.mode} mode)`);
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleMakeGuess(socket: Socket) {
    socket.on(SocketEvents.MAKE_GUESS, ({ roomId, guess, playerId }: MakeGuessPayload & { playerId: string }) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<NumberGuessingGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'playing') {
          this.emitError(socket, 'Game is not in progress');
          return;
        }

        const player = room.players.find(p => p.id === playerId);
        if (!player) {
          this.emitError(socket, 'Player not found');
          return;
        }

        // Process the guess
        const { gameState: updatedGameState, guess: guessResult, isCorrect } =
          NumberGuessingGame.processGuess(gameState, playerId, player.name, guess);

        // Update game state
        this.gameStateManager.setGameState(roomId, updatedGameState);

        // Send guess result to all players
        this.io.to(roomId).emit(SocketEvents.GUESS_RESULT, {
          guess: guessResult,
          gameState: {
            ...updatedGameState,
            targetNumber: undefined // Don't send target number
          }
        });

        if (isCorrect) {
          // Game finished
          this.roomManager.updateRoom(roomId, { status: 'finished' });
          this.io.to(roomId).emit(SocketEvents.GAME_FINISHED, {
            winner: player,
            targetNumber: updatedGameState.targetNumber,
            gameState: updatedGameState
          });

          console.log(`🏆 ${player.name} won in room: ${roomId}`);
        } else {
          // Switch turn
          const nextPlayerId = NumberGuessingGame.getNextPlayer(playerId, room.players);
          const updatedState = this.gameStateManager.updateGameState<NumberGuessingGameState>(roomId, {
            currentTurn: nextPlayerId
          });

          this.io.to(roomId).emit(SocketEvents.TURN_CHANGED, {
            currentTurn: nextPlayerId,
            gameState: {
              ...updatedState,
              targetNumber: undefined
            }
          });
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handlePlayAgain(socket: Socket) {
    socket.on(SocketEvents.PLAY_AGAIN, ({ roomId }: { roomId: string }) => {
      try {
        const room = this.roomManager.getRoom(roomId);

        if (!room) {
          this.emitError(socket, 'Room not found');
          return;
        }

        // Reset room status to playing
        this.roomManager.updateRoom(roomId, { status: 'playing' });

        if (room.gameId === 'number-guessing') {
          // Get the current game state to preserve config
          const currentGameState = this.gameStateManager.getGameState<NumberGuessingGameState>(roomId);

          if (!currentGameState) {
            this.emitError(socket, 'No game state found');
            return;
          }

          // Initialize new game with same config
          const newGameState = NumberGuessingGame.initializeGame(room.players, currentGameState.config);
          this.gameStateManager.setGameState(roomId, newGameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_RESET, {
            room,
            gameState: {
              ...newGameState,
              targetNumber: undefined // Don't send target number to clients
            }
          });

          console.log(`🔄 Number Guessing game reset in room: ${roomId}`);
        } else if (room.gameId === 'would-you-rather') {
          // Get the current game state to preserve config
          const currentGameState = this.gameStateManager.getGameState<WouldYouRatherGameState>(roomId);

          if (!currentGameState) {
            this.emitError(socket, 'No game state found');
            return;
          }

          // Initialize new game with same config
          const newGameState = WouldYouRatherGame.initializeGame(room.players, currentGameState.config);
          this.gameStateManager.setGameState(roomId, newGameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_RESET, {
            room,
            gameState: newGameState
          });

          console.log(`🔄 Would You Rather game reset in room: ${roomId}`);
        } else if (room.gameId === 'this-or-that') {
          // Get the current game state to preserve config
          const currentGameState = this.gameStateManager.getGameState<ThisOrThatGameState>(roomId);

          if (!currentGameState) {
            this.emitError(socket, 'No game state found');
            return;
          }

          // Initialize new game with same config
          const newGameState = ThisOrThatGame.initializeGame(room.players, currentGameState.config);
          this.gameStateManager.setGameState(roomId, newGameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_RESET, {
            room,
            gameState: newGameState
          });

          console.log(`🔄 This or That game reset in room: ${roomId}`);
        } else if (room.gameId === 'tic-tac-toe') {
          // Get the current game state to preserve config
          const currentGameState = this.gameStateManager.getGameState<TicTacToeGameState>(roomId);

          if (!currentGameState) {
            this.emitError(socket, 'No game state found');
            return;
          }

          // Initialize new tournament with same config
          const newGameState = TicTacToeGame.initializeGame(room.players, currentGameState.config);
          this.gameStateManager.setGameState(roomId, newGameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_RESET, {
            room,
            gameState: newGameState
          });

          console.log(`🔄 Tic Tac Toe tournament reset in room: ${roomId}`);
        } else if (room.gameId === 'connect-4') {
          // Get the current game state to preserve config
          const currentGameState = this.gameStateManager.getGameState<Connect4GameState>(roomId);

          if (!currentGameState) {
            this.emitError(socket, 'No game state found');
            return;
          }

          // Initialize new tournament with same config
          const newGameState = Connect4Game.initializeGame(room.players, currentGameState.config);
          this.gameStateManager.setGameState(roomId, newGameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_RESET, {
            room,
            gameState: newGameState
          });

          console.log(`🔄 Connect 4 tournament reset in room: ${roomId}`);
        } else if (room.gameId === 'rock-paper-scissors') {
          // Get the current game state to preserve config
          const currentGameState = this.gameStateManager.getGameState<RPSGameState>(roomId);

          if (!currentGameState) {
            this.emitError(socket, 'No game state found');
            return;
          }

          // Initialize new tournament with same config
          const newGameState = RockPaperScissorsGame.initializeGame(room.players, currentGameState.config);
          this.gameStateManager.setGameState(roomId, newGameState);

          // Notify all players
          this.io.to(roomId).emit(SocketEvents.GAME_RESET, {
            room,
            gameState: newGameState
          });

          console.log(`🔄 Rock Paper Scissors tournament reset in room: ${roomId}`);
        } else if (room.gameId === 'hangman') {
          // Get the current game state to preserve config
          const currentGameState = this.gameStateManager.getGameState<HangmanGameState>(roomId);

          if (!currentGameState) {
            this.emitError(socket, 'No game state found');
            return;
          }

          // Initialize new game with same config
          const newGameState = HangmanGame.initializeGame(room.players, currentGameState.config);
          this.gameStateManager.setGameState(roomId, newGameState);

          // Notify all players - hide word appropriately
          const safeGameState = currentGameState.config.mode === 'coop'
            ? { ...newGameState, word: newGameState.word.replace(/[A-Z]/g, '_') }
            : newGameState;

          this.io.to(roomId).emit(SocketEvents.GAME_RESET, {
            room,
            gameState: safeGameState
          });

          console.log(`🔄 Hangman game reset in room: ${roomId}`);
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleSubmitChoice(socket: Socket) {
    socket.on(SocketEvents.SUBMIT_CHOICE, ({ roomId, playerId, choice }: SubmitChoicePayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<WouldYouRatherGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'playing') {
          this.emitError(socket, 'Game is not in playing state');
          return;
        }

        const player = room.players.find(p => p.id === playerId);
        if (!player) {
          this.emitError(socket, 'Player not found');
          return;
        }

        // Record the choice
        const { gameState: updatedGameState, choice: choiceRecord, bothChosen } =
          WouldYouRatherGame.recordChoice(gameState, playerId, player.name, choice);

        // Update game state
        this.gameStateManager.setGameState(roomId, updatedGameState);

        // Notify player that choice was submitted
        socket.emit(SocketEvents.CHOICE_SUBMITTED, {
          choice: choiceRecord
        });

        // If both players have chosen, reveal choices
        if (bothChosen) {
          const { gameState: finalGameState, roundResult } =
            WouldYouRatherGame.processRoundResults(updatedGameState);

          // Update game state to revealing
          this.gameStateManager.setGameState(roomId, finalGameState);

          // Notify all players of the reveal
          this.io.to(roomId).emit(SocketEvents.CHOICES_REVEALED, {
            roundResult,
            gameState: finalGameState
          });

          console.log(`🤔 Round ${roundResult.round} completed in room: ${roomId} - Match: ${roundResult.isMatch}`);
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleNextQuestion(socket: Socket) {
    socket.on(SocketEvents.NEXT_QUESTION, ({ roomId }: NextQuestionPayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<WouldYouRatherGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'revealing') {
          this.emitError(socket, 'Cannot proceed to next question');
          return;
        }

        // Move to next question
        const updatedGameState = WouldYouRatherGame.nextQuestion(gameState);
        this.gameStateManager.setGameState(roomId, updatedGameState);

        if (updatedGameState.status === 'finished') {
          // Game finished
          this.roomManager.updateRoom(roomId, { status: 'finished' });

          const stats = WouldYouRatherGame.getGameStats(updatedGameState);

          this.io.to(roomId).emit(SocketEvents.GAME_FINISHED, {
            gameState: updatedGameState,
            stats
          });

          console.log(`🎉 Would You Rather game finished in room: ${roomId} - Compatibility: ${stats.compatibilityPercentage}%`);
        } else {
          // Next round
          this.io.to(roomId).emit(SocketEvents.NEXT_QUESTION, {
            gameState: updatedGameState
          });

          console.log(`🔄 Next question loaded in room: ${roomId} - Round ${updatedGameState.currentRound}`);
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleSubmitThisOrThatChoice(socket: Socket) {
    socket.on(SocketEvents.SUBMIT_THIS_OR_THAT_CHOICE, ({ roomId, playerId, choice }: SubmitThisOrThatChoicePayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<ThisOrThatGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'playing') {
          this.emitError(socket, 'Game is not in playing state');
          return;
        }

        const player = room.players.find(p => p.id === playerId);
        if (!player) {
          this.emitError(socket, 'Player not found');
          return;
        }

        // Check if player already made a choice for this round
        if (gameState.choices.some(c => c.playerId === playerId)) {
          this.emitError(socket, 'You have already made a choice for this round');
          return;
        }

        // Record the choice
        const { gameState: updatedGameState, choice: choiceRecord, bothChosen } =
          ThisOrThatGame.recordChoice(gameState, playerId, player.name, choice);

        // Update game state
        this.gameStateManager.setGameState(roomId, updatedGameState);

        // Notify player that choice was submitted
        socket.emit(SocketEvents.THIS_OR_THAT_CHOICE_SUBMITTED, {
          choice: choiceRecord
        });

        // If both players have chosen, complete the round
        if (bothChosen) {
          const { gameState: finalGameState, roundResult } =
            ThisOrThatGame.completeRound(updatedGameState);

          // Update game state
          this.gameStateManager.setGameState(roomId, finalGameState);

          // Notify all players of the round result
          this.io.to(roomId).emit(SocketEvents.THIS_OR_THAT_ROUND_COMPLETE, {
            roundResult,
            gameState: finalGameState
          });

          console.log(`⚡ This or That Round ${roundResult.round} completed in room: ${roomId} - Match: ${roundResult.isMatch}`);

          // Auto-advance to next question after 2 seconds
          setTimeout(() => {
            const currentRoom = this.roomManager.getRoom(roomId);
            const currentGameState = this.gameStateManager.getGameState<ThisOrThatGameState>(roomId);

            if (!currentRoom || !currentGameState) {
              return;
            }

            // Move to next question
            const nextGameState = ThisOrThatGame.nextQuestion(currentGameState);
            this.gameStateManager.setGameState(roomId, nextGameState);

            if (nextGameState.status === 'finished') {
              // Game finished
              this.roomManager.updateRoom(roomId, { status: 'finished' });

              const stats = ThisOrThatGame.getGameStats(nextGameState);

              this.io.to(roomId).emit(SocketEvents.GAME_FINISHED, {
                gameState: nextGameState,
                stats
              });

              console.log(`🎉 This or That game finished in room: ${roomId} - Compatibility: ${stats.compatibilityPercentage}%`);
            } else {
              // Next round
              this.io.to(roomId).emit(SocketEvents.THIS_OR_THAT_AUTO_NEXT, {
                gameState: nextGameState
              });

              console.log(`🔄 This or That auto-advanced to round ${nextGameState.currentRound} in room: ${roomId}`);
            }
          }, 2000);
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleMakeMove(socket: Socket) {
    socket.on(SocketEvents.MAKE_MOVE, ({ roomId, playerId, row, col }: MakeMovePayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<TicTacToeGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'playing') {
          this.emitError(socket, 'Game is not in playing state');
          return;
        }

        // Make the move
        const { gameState: updatedGameState, move, gameOver } =
          TicTacToeGame.makeMove(gameState, playerId, room.players, row, col);

        // Update game state
        this.gameStateManager.setGameState(roomId, updatedGameState);

        // Notify all players of the move
        this.io.to(roomId).emit(SocketEvents.MOVE_MADE, {
          move,
          gameState: updatedGameState
        });

        if (gameOver) {
          // Game over
          this.io.to(roomId).emit(SocketEvents.TIC_TAC_TOE_GAME_OVER, {
            gameState: updatedGameState,
            winner: updatedGameState.winner
          });

          console.log(`⭕ Tic Tac Toe game ${updatedGameState.gameNumber} finished in room: ${roomId} - Winner: ${updatedGameState.winner}`);

          // Check if match is over
          const stats = TicTacToeGame.getMatchStats(updatedGameState);
          if (stats.matchWinner) {
            this.roomManager.updateRoom(roomId, { status: 'finished' });

            this.io.to(roomId).emit(SocketEvents.MATCH_OVER, {
              gameState: updatedGameState,
              matchWinner: stats.matchWinner,
              stats
            });

            console.log(`🏆 Tic Tac Toe match over in room: ${roomId} - Winner: ${stats.matchWinner}`);
          }
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleUsePowerUp(socket: Socket) {
    socket.on(SocketEvents.USE_POWER_UP, ({ roomId, playerId, powerUpType, targetRow, targetCol }: UsePowerUpPayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<TicTacToeGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'playing') {
          this.emitError(socket, 'Game is not in playing state');
          return;
        }

        // Use power-up
        const { gameState: updatedGameState, result } =
          TicTacToeGame.usePowerUp(gameState, playerId, room.players, powerUpType, targetRow, targetCol);

        // Update game state
        this.gameStateManager.setGameState(roomId, updatedGameState);

        // Notify all players
        this.io.to(roomId).emit(SocketEvents.POWER_UP_USED, {
          playerId,
          powerUpType,
          result,
          gameState: updatedGameState
        });

        console.log(`⚡ Power-up used in room: ${roomId} - ${powerUpType} by ${playerId}`);

        // Check for winner after steal power-up
        if (powerUpType === 'steal') {
          const winner = TicTacToeGame['checkWinner'](updatedGameState.board, updatedGameState.config.boardSize);
          if (winner) {
            const finalGameState = this.gameStateManager.updateGameState<TicTacToeGameState>(roomId, {
              status: 'game_over',
              winner
            });

            this.io.to(roomId).emit(SocketEvents.TIC_TAC_TOE_GAME_OVER, {
              gameState: finalGameState,
              winner
            });
          }
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleNextGameInSeries(socket: Socket) {
    socket.on(SocketEvents.NEXT_GAME_IN_SERIES, ({ roomId }: NextGamePayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<TicTacToeGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'game_over') {
          this.emitError(socket, 'Current game is not over');
          return;
        }

        // Start next game in series
        const nextGameState = TicTacToeGame.nextGameInSeries(gameState);
        this.gameStateManager.setGameState(roomId, nextGameState);

        if (nextGameState.status === 'match_over') {
          // Match is over
          this.roomManager.updateRoom(roomId, { status: 'finished' });

          const stats = TicTacToeGame.getMatchStats(nextGameState);

          this.io.to(roomId).emit(SocketEvents.MATCH_OVER, {
            gameState: nextGameState,
            matchWinner: stats.matchWinner,
            stats
          });

          console.log(`🏆 Tic Tac Toe match completed in room: ${roomId}`);
        } else {
          // Next game started
          this.io.to(roomId).emit(SocketEvents.GAME_STARTED, {
            room,
            gameState: nextGameState
          });

          console.log(`⭕ Next Tic Tac Toe game (${nextGameState.gameNumber}) started in room: ${roomId}`);
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleConnect4MakeMove(socket: Socket) {
    socket.on(SocketEvents.CONNECT_4_MOVE_MADE, ({ roomId, playerId, col }: Connect4MakeMovePayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<Connect4GameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'playing') {
          this.emitError(socket, 'Game is not in playing state');
          return;
        }

        // Make the move
        const { gameState: updatedGameState, move, gameOver } =
          Connect4Game.makeMove(gameState, playerId, room.players, col);

        // Update game state
        this.gameStateManager.setGameState(roomId, updatedGameState);

        // Notify all players of the move
        this.io.to(roomId).emit(SocketEvents.CONNECT_4_MOVE_MADE, {
          move,
          gameState: updatedGameState
        });

        if (gameOver) {
          // Game over
          this.io.to(roomId).emit(SocketEvents.CONNECT_4_GAME_OVER, {
            gameState: updatedGameState,
            winner: updatedGameState.winner
          });

          console.log(`🔴 Connect 4 game ${updatedGameState.gameNumber} finished in room: ${roomId} - Winner: ${updatedGameState.winner}`);

          // Check if match is over
          const stats = Connect4Game.getMatchStats(updatedGameState);
          if (stats.matchWinner) {
            this.roomManager.updateRoom(roomId, { status: 'finished' });

            this.io.to(roomId).emit(SocketEvents.MATCH_OVER, {
              gameState: updatedGameState,
              matchWinner: stats.matchWinner,
              stats
            });

            console.log(`🏆 Connect 4 match over in room: ${roomId} - Winner: ${stats.matchWinner}`);
          }
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleRPSSubmitChoice(socket: Socket) {
    socket.on(SocketEvents.RPS_SUBMIT_CHOICE, ({ roomId, playerId, choice, powerUpType }: RPSSubmitChoicePayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<RPSGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'waiting' && gameState.status !== 'playing') {
          this.emitError(socket, 'Game is not accepting choices');
          return;
        }

        // Submit choice
        const { gameState: updatedGameState, bothSubmitted } =
          RockPaperScissorsGame.submitChoice(gameState, playerId, room.players, choice, powerUpType);

        // Update game state
        this.gameStateManager.setGameState(roomId, updatedGameState);

        // Notify player that choice was submitted
        socket.emit(SocketEvents.RPS_CHOICE_SUBMITTED, {
          playerId,
          choice: powerUpType === 'reveal' ? choice : null // Only reveal if using reveal power-up
        });

        // If both players submitted, evaluate round
        if (bothSubmitted) {
          const { gameState: finalGameState, roundResult, matchOver } =
            RockPaperScissorsGame.evaluateRound(updatedGameState, room.players);

          // Update game state
          this.gameStateManager.setGameState(roomId, finalGameState);

          // Notify all players of round result
          this.io.to(roomId).emit(SocketEvents.RPS_ROUND_COMPLETE, {
            roundResult,
            gameState: finalGameState
          });

          console.log(`🪨 RPS Round ${roundResult.roundNumber} complete in room: ${roomId} - Winner: ${roundResult.winner}`);

          if (matchOver) {
            // Match is over
            this.roomManager.updateRoom(roomId, { status: 'finished' });

            const stats = RockPaperScissorsGame.getMatchStats(finalGameState);

            this.io.to(roomId).emit(SocketEvents.RPS_MATCH_OVER, {
              gameState: finalGameState,
              matchWinner: stats.matchWinner,
              stats
            });

            console.log(`🏆 RPS match over in room: ${roomId} - Winner: ${stats.matchWinner}`);
          } else {
            // Auto-advance to next round after 3 seconds
            setTimeout(() => {
              const currentRoom = this.roomManager.getRoom(roomId);
              const currentGameState = this.gameStateManager.getGameState<RPSGameState>(roomId);

              if (!currentRoom || !currentGameState) {
                return;
              }

              // Start next round
              const nextRoundState = RockPaperScissorsGame.nextRound(currentGameState);
              this.gameStateManager.setGameState(roomId, nextRoundState);

              this.io.to(roomId).emit(SocketEvents.GAME_STARTED, {
                room: currentRoom,
                gameState: nextRoundState
              });

              console.log(`🔄 RPS auto-advanced to round ${nextRoundState.currentRound} in room: ${roomId}`);
            }, 3000);
          }
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleHangmanSetWord(socket: Socket) {
    socket.on(SocketEvents.HANGMAN_SET_WORD, ({ roomId, playerId, word }: HangmanSetWordPayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<HangmanGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'setup') {
          this.emitError(socket, 'Word can only be set during setup');
          return;
        }

        // Set the word
        const updatedGameState = HangmanGame.setWord(gameState, playerId, word);
        this.gameStateManager.setGameState(roomId, updatedGameState);

        // Notify all players that word has been set (without revealing it)
        this.io.to(roomId).emit(SocketEvents.HANGMAN_WORD_SET, {
          gameState: {
            ...updatedGameState,
            word: updatedGameState.word.replace(/[A-Z]/g, '_')
          }
        });

        console.log(`📝 Hangman word set in room: ${roomId} by player: ${playerId}`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleHangmanGuessLetter(socket: Socket) {
    socket.on(SocketEvents.HANGMAN_GUESS_LETTER, ({ roomId, playerId, letter, powerUpType }: HangmanGuessLetterPayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        const gameState = this.gameStateManager.getGameState<HangmanGameState>(roomId);

        if (!room || !gameState) {
          this.emitError(socket, 'Game not found');
          return;
        }

        if (gameState.status !== 'playing') {
          this.emitError(socket, 'Game is not in progress');
          return;
        }

        // In PvP mode, prevent word setter from guessing
        if (gameState.config.mode === 'pvp' && gameState.wordSetter === playerId) {
          this.emitError(socket, 'Word setter cannot guess');
          return;
        }

        // Guess letter
        const { gameState: updatedGameState, correct, gameOver } =
          HangmanGame.guessLetter(gameState, playerId, room.players, letter, powerUpType);

        // Update game state
        this.gameStateManager.setGameState(roomId, updatedGameState);

        // Notify all players of the guess
        this.io.to(roomId).emit(SocketEvents.HANGMAN_LETTER_GUESSED, {
          letter,
          correct,
          gameState: {
            ...updatedGameState,
            word: updatedGameState.word.replace(/[A-Z]/g, '_')
          },
          maskedWord: HangmanGame.getMaskedWord(updatedGameState)
        });

        console.log(`📝 Hangman letter guessed in room: ${roomId} - Letter: ${letter}, Correct: ${correct}`);

        if (gameOver) {
          // Game is over
          this.roomManager.updateRoom(roomId, { status: 'finished' });

          const stats = HangmanGame.getGameStats(updatedGameState);

          this.io.to(roomId).emit(SocketEvents.HANGMAN_GAME_OVER, {
            gameState: updatedGameState, // Reveal the full word
            winner: updatedGameState.winner,
            stats
          });

          console.log(`🏆 Hangman game over in room: ${roomId} - Winner: ${updatedGameState.winner || 'None'}`);
        }
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleChangeGame(socket: Socket) {
    socket.on(SocketEvents.CHANGE_GAME, ({ roomId, newGameId, config }: ChangeGamePayload) => {
      try {
        const room = this.roomManager.getRoom(roomId);

        if (!room) {
          this.emitError(socket, 'Room not found');
          return;
        }

        // Change the game in the room
        const updatedRoom = this.roomManager.changeGame(roomId, newGameId);

        if (!updatedRoom) {
          this.emitError(socket, 'Failed to change game');
          return;
        }

        // Clear the old game state
        this.gameStateManager.deleteGameState(roomId);

        // Broadcast game change to all players in the room
        this.io.to(roomId).emit(SocketEvents.GAME_CHANGED, {
          room: updatedRoom,
          newGameId,
          config
        });

        console.log(`🔄 Game changed in room: ${roomId} to ${newGameId}`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleCreatePermanentRoom(socket: Socket) {
    socket.on(SocketEvents.CREATE_PERMANENT_ROOM, async (payload: CreatePermanentRoomPayload) => {
      try {
        // Require authentication
        if (!socket.userId || !socket.user) {
          this.emitError(socket, 'Authentication required to create permanent room');
          return;
        }

        const { name, gameId, maxPlayers } = payload;

        // Create or load permanent room
        const result = await this.roomManager.createPermanentRoom(
          socket.userId,
          socket.user.username,
          name,
          gameId,
          maxPlayers || 8
        );

        if (!result) {
          this.emitError(socket, 'Failed to create permanent room');
          return;
        }

        const { room, player } = result;

        // Store player-socket mapping
        this.playerSocketMap.set(player.id, socket.id);

        // Join socket room
        socket.join(room.id);

        // Send response to creator
        socket.emit(SocketEvents.ROOM_CREATED, { room, playerId: player.id });

        console.log(`🏠 Permanent room created/loaded: ${room.id} by ${socket.user.username}`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleGetMyRoom(socket: Socket) {
    socket.on(SocketEvents.GET_MY_ROOM, async () => {
      try {
        // Require authentication
        if (!socket.userId || !socket.user) {
          this.emitError(socket, 'Authentication required');
          return;
        }

        // Try to load permanent room
        const result = await this.roomManager.loadPermanentRoom(
          socket.userId,
          socket.user.username,
          8
        );

        if (!result) {
          // User doesn't have a permanent room yet
          socket.emit(SocketEvents.MY_ROOM_DATA, { room: null });
          return;
        }

        const { room, player } = result;

        // Store player-socket mapping
        this.playerSocketMap.set(player.id, socket.id);

        // Join socket room
        socket.join(room.id);

        // Send room data
        socket.emit(SocketEvents.MY_ROOM_DATA, { room, playerId: player.id });

        console.log(`🏠 User ${socket.user.username} loaded their permanent room: ${room.id}`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleGetPublicRooms(socket: Socket) {
    socket.on(SocketEvents.GET_PUBLIC_ROOMS, async () => {
      try {
        // Get list of active user IDs from RoomManager
        const activeUserIds = this.roomManager.getActiveUserIds();

        // Get public rooms from database filtered by active users
        const publicRooms = await RoomRepository.getPublicRooms(activeUserIds);

        // Enrich with current player counts from memory
        const enrichedRooms = publicRooms.map(publicRoom => {
          const room = this.roomManager.getRoom(publicRoom.id);
          return {
            ...publicRoom,
            playerCount: room?.players.length || 0,
            maxPlayers: room?.maxPlayers || 8
          };
        });

        // Send to client
        socket.emit(SocketEvents.PUBLIC_ROOMS_LIST, { rooms: enrichedRooms });

        console.log(`📋 Sent ${enrichedRooms.length} public rooms to client`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleUpdateRoomName(socket: Socket) {
    socket.on(SocketEvents.UPDATE_ROOM_NAME, async (payload: UpdateRoomNamePayload) => {
      try {
        // Require authentication
        if (!socket.userId) {
          this.emitError(socket, 'Authentication required');
          return;
        }

        const { roomId, name } = payload;

        // Update room name (checks ownership internally)
        const updatedRoom = await this.roomManager.updateRoomName(roomId, socket.userId, name);

        if (!updatedRoom) {
          this.emitError(socket, 'Failed to update room name. You must be the room owner.');
          return;
        }

        // Notify all players in the room
        this.io.to(roomId).emit(SocketEvents.ROOM_NAME_UPDATED, { room: updatedRoom });

        console.log(`✏️ Room ${roomId} renamed to "${name}" by user ${socket.userId}`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleKickPlayer(socket: Socket) {
    socket.on(SocketEvents.KICK_PLAYER, (payload: KickPlayerPayload) => {
      try {
        // Require authentication
        if (!socket.userId) {
          this.emitError(socket, 'Authentication required');
          return;
        }

        const { roomId, playerId } = payload;

        // Kick player (checks ownership internally)
        const result = this.roomManager.kickPlayer(roomId, socket.userId, playerId);

        if (!result) {
          this.emitError(socket, 'Failed to kick player. You must be the room owner.');
          return;
        }

        const { room, kickedPlayer } = result;

        // Get kicked player's socket
        const kickedSocketId = this.playerSocketMap.get(playerId);

        if (kickedSocketId) {
          const kickedSocket = this.io.sockets.sockets.get(kickedSocketId);
          if (kickedSocket) {
            // Notify kicked player
            kickedSocket.emit(SocketEvents.PLAYER_KICKED, {
              roomId,
              reason: 'You were kicked by the room owner'
            });

            // Remove from socket room
            kickedSocket.leave(roomId);
          }

          // Remove from player-socket mapping
          this.playerSocketMap.delete(playerId);
        }

        // Notify remaining players
        this.io.to(roomId).emit(SocketEvents.PLAYER_LEFT, { playerId, room });

        console.log(`👢 Player ${kickedPlayer.name} kicked from room ${roomId} by owner ${socket.userId}`);
      } catch (error: any) {
        this.emitError(socket, error.message);
      }
    });
  }

  private handleDisconnect(socket: Socket) {
    socket.on(SocketEvents.DISCONNECT, async () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      // Find and remove player from any rooms
      const playerId = Array.from(this.playerSocketMap.entries())
        .find(([_, socketId]) => socketId === socket.id)?.[0];

      if (playerId) {
        // Find all rooms with this player and remove them
        const rooms = this.roomManager.getAllRooms();
        for (const room of rooms) {
          if (room.players.some(p => p.id === playerId)) {
            const updatedRoom = await this.roomManager.leaveRoom(room.id, playerId);
            if (updatedRoom) {
              this.io.to(room.id).emit(SocketEvents.PLAYER_LEFT, { playerId, room: updatedRoom });
            }
          }
        }

        this.playerSocketMap.delete(playerId);
      }
    });
  }

  private emitError(socket: Socket, message: string, code?: string) {
    const error: ErrorPayload = { message, code };
    socket.emit(SocketEvents.ERROR, error);
    console.error(`⚠️ Error: ${message}`);
  }
}
