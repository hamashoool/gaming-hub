import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, NumberGuessingGameConfig, WouldYouRatherConfig, ThisOrThatConfig, TicTacToeConfig, Connect4Config, RPSConfig, HangmanConfig, QuestionCategory, GameMode, BoardSize, Connect4BoardSize, RPSVariant, HangmanMode, HangmanCategory, HangmanDifficulty } from '@gaming-hub/shared';
import { NumberGuessingGame } from '../components/NumberGuessingGame';
import { WouldYouRatherGame } from '../components/WouldYouRatherGame';
import { ThisOrThatGame } from '../components/ThisOrThatGame';
import { TicTacToeGame } from '../components/TicTacToeGame';
import { Connect4Game } from '../components/Connect4Game';
import { RockPaperScissorsGame } from '../components/RockPaperScissorsGame';
import { HangmanGame } from '../components/HangmanGame';
import { SettingsPanel } from '../components/SettingsPanel';
import { gameSounds } from '../utils/sounds';
import { getSoundsEnabled, saveSoundsEnabled } from '../utils/storage';
import { AVAILABLE_GAMES, getGameConfig, getGameTitle } from '../config/games';

export const GameRoom: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { playerId, room, gameState, leaveRoom } = useGame();
  // Number Guessing config
  const [minRange, setMinRange] = useState(1);
  const [maxRange, setMaxRange] = useState(100);
  // Would You Rather config
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>(['food', 'travel', 'lifestyle', 'deep', 'fun']);
  const [maxRounds, setMaxRounds] = useState<number>(10);
  const [gameMode, setGameMode] = useState<GameMode>('compatibility');
  // This or That config
  const [thisOrThatCategories, setThisOrThatCategories] = useState<QuestionCategory[]>(['food', 'travel', 'lifestyle', 'deep', 'fun']);
  const [thisOrThatRounds, setThisOrThatRounds] = useState<number>(10);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(10);
  // Tic Tac Toe config
  const [boardSize, setBoardSize] = useState<BoardSize>(3);
  const [bestOf, setBestOf] = useState<number>(3);
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [powerUpsEnabled, setPowerUpsEnabled] = useState<boolean>(false);
  // Connect 4 config
  const [connect4BoardSize, setConnect4BoardSize] = useState<Connect4BoardSize>('6x7');
  const [connect4BestOf, setConnect4BestOf] = useState<number>(3);
  const [connect4TimeLimit, setConnect4TimeLimit] = useState<number>(0);
  const [connect4PowerUpsEnabled, setConnect4PowerUpsEnabled] = useState<boolean>(false);
  // RPS config
  const [rpsVariant, setRpsVariant] = useState<RPSVariant>('classic');
  const [rpsBestOf, setRpsBestOf] = useState<number>(3);
  const [rpsTimeLimit, setRpsTimeLimit] = useState<number>(0);
  const [rpsPowerUpsEnabled, setRpsPowerUpsEnabled] = useState<boolean>(false);
  // Hangman config
  const [hangmanMode, setHangmanMode] = useState<HangmanMode>('coop');
  const [hangmanCategory, setHangmanCategory] = useState<HangmanCategory>('movies');
  const [hangmanDifficulty, setHangmanDifficulty] = useState<HangmanDifficulty>('medium');
  const [hangmanTimeLimit, setHangmanTimeLimit] = useState<number>(0);
  const [hangmanPowerUpsEnabled, setHangmanPowerUpsEnabled] = useState<boolean>(false);
  const [hangmanMaxWrongGuesses, setHangmanMaxWrongGuesses] = useState<number>(6);
  const [error, setError] = useState('');
  // Game switching
  const [showGameSwitcher, setShowGameSwitcher] = useState(false);
  // Settings panel
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  useEffect(() => {
    if (!room || !playerId) {
      // If we don't have room or player data, redirect to home
      navigate('/');
    }
  }, [room, playerId, navigate]);

  // Load sound settings on mount
  useEffect(() => {
    const savedSoundsEnabled = getSoundsEnabled();
    setSoundsEnabled(savedSoundsEnabled);
    gameSounds.setSoundsEnabled(savedSoundsEnabled);
  }, []);

  const handleChangeGame = (newGameId: string) => {
    if (!socket || !room) return;

    // Emit the change game event
    socket.emit(SocketEvents.CHANGE_GAME, {
      roomId: room.id,
      newGameId
    });

    setShowGameSwitcher(false);
    setError('');
  };

  const handleStartGame = () => {
    if (!socket || !room) return;

    if (room.players.length < 2) {
      setError('Need at least 2 players to start the game');
      return;
    }

    let config: NumberGuessingGameConfig | WouldYouRatherConfig | ThisOrThatConfig | TicTacToeConfig | Connect4Config | RPSConfig | HangmanConfig;

    if (room.gameId === 'number-guessing') {
      config = {
        minRange,
        maxRange
      };
    } else if (room.gameId === 'would-you-rather') {
      if (selectedCategories.length === 0) {
        setError('Please select at least one category');
        return;
      }
      config = {
        categories: selectedCategories,
        maxRounds,
        mode: gameMode
      };
    } else if (room.gameId === 'this-or-that') {
      if (thisOrThatCategories.length === 0) {
        setError('Please select at least one category');
        return;
      }
      config = {
        categories: thisOrThatCategories,
        maxRounds: thisOrThatRounds,
        timePerQuestion
      };
    } else if (room.gameId === 'tic-tac-toe') {
      config = {
        boardSize,
        bestOf,
        timeLimit,
        powerUpsEnabled
      };
    } else if (room.gameId === 'connect-4') {
      config = {
        boardSize: connect4BoardSize,
        bestOf: connect4BestOf,
        timeLimit: connect4TimeLimit,
        powerUpsEnabled: connect4PowerUpsEnabled
      };
    } else if (room.gameId === 'rock-paper-scissors') {
      config = {
        variant: rpsVariant,
        bestOf: rpsBestOf,
        timeLimit: rpsTimeLimit,
        powerUpsEnabled: rpsPowerUpsEnabled
      };
    } else if (room.gameId === 'hangman') {
      config = {
        mode: hangmanMode,
        category: hangmanCategory,
        difficulty: hangmanDifficulty,
        timeLimit: hangmanTimeLimit,
        powerUpsEnabled: hangmanPowerUpsEnabled,
        maxWrongGuesses: hangmanMaxWrongGuesses
      };
    } else {
      return;
    }

    socket.emit(SocketEvents.START_GAME, { roomId: room.id, config });
    setError('');
  };

  const toggleCategory = (category: QuestionCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleThisOrThatCategory = (category: QuestionCategory) => {
    setThisOrThatCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCurrentGameTitle = () => {
    return room?.gameId ? getGameTitle(room.gameId) : 'Game Room';
  };

  const getCurrentGameConfig = () => {
    return room?.gameId ? getGameConfig(room.gameId) : null;
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    navigate('/');
  };

  const copyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.id);
    }
  };

  const handleToggleSounds = () => {
    const newValue = !soundsEnabled;
    setSoundsEnabled(newValue);
    gameSounds.setSoundsEnabled(newValue);
    saveSoundsEnabled(newValue);
  };

  const handleStartOver = () => {
    if (!socket || !room) return;

    // Reset the game with the same settings - emit START_GAME again
    handleStartGame();
    setIsSettingsPanelOpen(false);
  };

  const handleResetToLobby = () => {
    if (!socket || !room) return;

    // Reset to lobby by changing game to the current game (which resets state)
    socket.emit(SocketEvents.CHANGE_GAME, {
      roomId: room.id,
      newGameId: room.gameId
    });

    setIsSettingsPanelOpen(false);
  };

  if (!room || !playerId) {
    return null;
  }

  const isGameStarted = room.status === 'playing' || room.status === 'finished';

  return (
    <div className="min-h-screen bg-gradient-mesh-light dark:bg-gradient-mesh-dark bg-slate-50 dark:bg-slate-950 p-4 transition-theme relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass rounded-2xl shadow-glass dark:shadow-glass-dark p-4 mb-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{getCurrentGameConfig()?.emoji || '🎮'}</div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme">{getCurrentGameTitle()}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400 transition-theme">Room Code:</span>
                  <code className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-sm font-mono font-bold text-slate-800 dark:text-slate-100">
                    {room.id}
                  </code>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setIsSettingsPanelOpen(true)}
                className="px-3 py-2 glass-light hover:glass-heavy rounded-xl flex items-center gap-2 transition-all hover:scale-105 text-slate-700 dark:text-slate-300"
                aria-label="Settings"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={() => setShowGameSwitcher(true)}
                className="px-3 py-2 glass-light hover:glass-heavy rounded-xl flex items-center gap-2 transition-all hover:scale-105 text-slate-700 dark:text-slate-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">Change Game</span>
              </button>
              <button
                onClick={copyRoomCode}
                className="px-3 py-2 glass-light hover:glass-heavy rounded-xl flex items-center gap-2 transition-all hover:scale-105 text-slate-700 dark:text-slate-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">Copy Code</span>
              </button>
              <button
                onClick={handleLeaveRoom}
                className="px-3 py-2 bg-red-500/90 hover:bg-red-600 text-white rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-glow-red"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Leave</span>
              </button>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="glass rounded-2xl shadow-glass dark:shadow-glass-dark p-6 mb-4 animate-slide-up">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-4">
            Players ({room.players.length}/{room.maxPlayers})
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {room.players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  player.id === playerId
                    ? 'border-purple-500 dark:border-purple-400 glass-heavy shadow-glow'
                    : 'border-slate-200 dark:border-slate-700 glass-light'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 transition-theme">{player.name}</span>
                  {player.id === playerId && (
                    <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">You</span>
                  )}
                </div>
                {gameState && gameState.currentTurn === player.id && gameState.status === 'playing' && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium transition-theme">Current Turn</span>
                )}
              </div>
            ))}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 glass-light flex items-center justify-center transition-theme"
              >
                <span className="text-slate-400 dark:text-slate-500 transition-theme">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Setup or Game */}
        {!isGameStarted ? (
          <div className="glass rounded-2xl shadow-glass dark:shadow-glass-dark p-6 animate-scale-in">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-4">Game Settings</h2>
            <div className="space-y-4">
              {/* Number Guessing Settings */}
              {room.gameId === 'number-guessing' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Min Range
                    </label>
                    <input
                      type="number"
                      value={minRange}
                      onChange={(e) => setMinRange(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 glass-light rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none text-slate-800 dark:text-slate-100 transition-theme"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Max Range
                    </label>
                    <input
                      type="number"
                      value={maxRange}
                      onChange={(e) => setMaxRange(parseInt(e.target.value) || 100)}
                      className="w-full px-4 py-2 glass-light rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none text-slate-800 dark:text-slate-100 transition-theme"
                    />
                  </div>
                </div>
              )}

              {/* Would You Rather Settings */}
              {room.gameId === 'would-you-rather' && (
                <div className="space-y-4">
                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Question Categories
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(['food', 'travel', 'lifestyle', 'deep', 'fun'] as QuestionCategory[]).map((category) => (
                        <button
                          key={category}
                          onClick={() => toggleCategory(category)}
                          className={`px-4 py-2 rounded-xl border-2 transition-all capitalize transform hover:scale-105 ${
                            selectedCategories.includes(category)
                              ? 'glass-heavy border-purple-600 text-slate-100 shadow-glow'
                              : 'glass-light border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of Rounds */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Number of Rounds
                    </label>
                    <div className="flex gap-2">
                      {[5, 10, 20].map((num) => (
                        <button
                          key={num}
                          onClick={() => setMaxRounds(num)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            maxRounds === num
                              ? 'glass-heavy border-blue-600 text-slate-100 shadow-glow-blue'
                              : 'glass-light border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                          }`}
                        >
                          {num} Questions
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Game Mode */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Game Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setGameMode('casual')}
                        className={`px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                          gameMode === 'casual'
                            ? 'glass-heavy border-green-600 text-slate-100 shadow-glow-green'
                            : 'glass-light border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-green-400'
                        }`}
                      >
                        Casual (No Scoring)
                      </button>
                      <button
                        onClick={() => setGameMode('compatibility')}
                        className={`px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                          gameMode === 'compatibility'
                            ? 'glass-heavy border-pink-600 text-slate-100 shadow-glow'
                            : 'glass-light border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-pink-400'
                        }`}
                      >
                        Compatibility
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* This or That Settings */}
              {room.gameId === 'this-or-that' && (
                <div className="space-y-4">
                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Question Categories
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(['food', 'travel', 'lifestyle', 'deep', 'fun'] as QuestionCategory[]).map((category) => (
                        <button
                          key={category}
                          onClick={() => toggleThisOrThatCategory(category)}
                          className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                            thisOrThatCategories.includes(category)
                              ? 'bg-orange-500 border-orange-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-orange-400'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of Rounds */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Number of Rounds
                    </label>
                    <div className="flex gap-2">
                      {[5, 10, 15].map((num) => (
                        <button
                          key={num}
                          onClick={() => setThisOrThatRounds(num)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            thisOrThatRounds === num
                              ? 'bg-yellow-500 border-yellow-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-yellow-400'
                          }`}
                        >
                          {num} Questions
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Per Question */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Time Per Question (seconds)
                    </label>
                    <div className="flex gap-2">
                      {[5, 10, 15].map((time) => (
                        <button
                          key={time}
                          onClick={() => setTimePerQuestion(time)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            timePerQuestion === time
                              ? 'bg-orange-500 border-orange-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-orange-400'
                          }`}
                        >
                          {time}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tic Tac Toe Settings */}
              {room.gameId === 'tic-tac-toe' && (
                <div className="space-y-4">
                  {/* Board Size */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Board Size
                    </label>
                    <div className="flex gap-2">
                      {[3, 4, 5].map((size) => (
                        <button
                          key={size}
                          onClick={() => setBoardSize(size as BoardSize)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            boardSize === size
                              ? 'glass-heavy border-blue-600 text-slate-100 shadow-glow-blue'
                              : 'glass-light border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                          }`}
                        >
                          {size}x{size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Best Of */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Tournament Format
                    </label>
                    <div className="flex gap-2">
                      {[3, 5, 7].map((num) => (
                        <button
                          key={num}
                          onClick={() => setBestOf(num)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            bestOf === num
                              ? 'bg-red-500 border-red-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                          }`}
                        >
                          Best of {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Time Limit Per Move
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 10, 15, 30].map((time) => (
                        <button
                          key={time}
                          onClick={() => setTimeLimit(time)}
                          className={`px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            timeLimit === time
                              ? 'bg-purple-500 border-purple-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                          }`}
                        >
                          {time === 0 ? 'None' : `${time}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Power-ups */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Power-ups
                    </label>
                    <button
                      onClick={() => setPowerUpsEnabled(!powerUpsEnabled)}
                      className={`w-full px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                        powerUpsEnabled
                          ? 'bg-yellow-500 border-yellow-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-yellow-400'
                      }`}
                    >
                      {powerUpsEnabled ? '⚡ Enabled (Steal, Block, Extra Turn)' : 'Disabled'}
                    </button>
                  </div>
                </div>
              )}

              {/* Connect 4 Settings */}
              {room.gameId === 'connect-4' && (
                <div className="space-y-4">
                  {/* Board Size */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Board Size
                    </label>
                    <div className="flex gap-2">
                      {(['6x7', '7x8', '8x9'] as Connect4BoardSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => setConnect4BoardSize(size)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            connect4BoardSize === size
                              ? 'bg-yellow-500 border-yellow-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-yellow-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Best Of */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Tournament Format
                    </label>
                    <div className="flex gap-2">
                      {[3, 5, 7].map((num) => (
                        <button
                          key={num}
                          onClick={() => setConnect4BestOf(num)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            connect4BestOf === num
                              ? 'bg-red-500 border-red-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                          }`}
                        >
                          Best of {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Time Limit Per Move
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 10, 15, 30].map((time) => (
                        <button
                          key={time}
                          onClick={() => setConnect4TimeLimit(time)}
                          className={`px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            connect4TimeLimit === time
                              ? 'bg-purple-500 border-purple-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                          }`}
                        >
                          {time === 0 ? 'None' : `${time}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Power-ups */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Power-ups
                    </label>
                    <button
                      onClick={() => setConnect4PowerUpsEnabled(!connect4PowerUpsEnabled)}
                      className={`w-full px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                        connect4PowerUpsEnabled
                          ? 'bg-blue-500 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                      }`}
                    >
                      {connect4PowerUpsEnabled ? '⚡ Enabled (Remove, Block, Swap, Extra Turn)' : 'Disabled'}
                    </button>
                  </div>
                </div>
              )}

              {/* Rock Paper Scissors Settings */}
              {room.gameId === 'rock-paper-scissors' && (
                <div className="space-y-4">
                  {/* Variant */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Game Variant
                    </label>
                    <div className="flex gap-2">
                      {(['classic', 'extended'] as RPSVariant[]).map((variant) => (
                        <button
                          key={variant}
                          onClick={() => setRpsVariant(variant)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            rpsVariant === variant
                              ? 'bg-purple-500 border-purple-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                          }`}
                        >
                          {variant === 'classic' ? '🪨 Classic (RPS)' : '🖖 Extended (RPSLS)'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {rpsVariant === 'classic'
                        ? 'Rock, Paper, Scissors'
                        : 'Rock, Paper, Scissors, Lizard, Spock'}
                    </p>
                  </div>

                  {/* Tournament Format */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Tournament Format
                    </label>
                    <div className="flex gap-2">
                      {[3, 5, 7].map((num) => (
                        <button
                          key={num}
                          onClick={() => setRpsBestOf(num)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            rpsBestOf === num
                              ? 'bg-purple-500 border-purple-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                          }`}
                        >
                          Best of {num}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      First to {Math.ceil(rpsBestOf / 2)} wins the tournament
                    </p>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Time Per Round
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 0, label: 'None' },
                        { value: 10, label: '10s' },
                        { value: 15, label: '15s' },
                        { value: 30, label: '30s' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setRpsTimeLimit(value)}
                          className={`px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            rpsTimeLimit === value
                              ? 'bg-purple-500 border-purple-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Power-Ups */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Power-Ups
                    </label>
                    <button
                      onClick={() => setRpsPowerUpsEnabled(!rpsPowerUpsEnabled)}
                      className={`w-full px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                        rpsPowerUpsEnabled
                          ? 'bg-purple-500 border-purple-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                      }`}
                    >
                      {rpsPowerUpsEnabled ? '⚡ Enabled (🔍 Reveal, 🛡️ Shield, ⭐ 2x Points)' : 'Disabled'}
                    </button>
                  </div>
                </div>
              )}

              {/* Hangman Settings */}
              {room.gameId === 'hangman' && (
                <div className="space-y-4">
                  {/* Mode */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Game Mode
                    </label>
                    <div className="flex gap-2">
                      {(['coop', 'pvp'] as HangmanMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setHangmanMode(mode)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            hangmanMode === mode
                              ? 'bg-indigo-500 border-indigo-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'
                          }`}
                        >
                          {mode === 'coop' ? '🤝 Co-op' : '⚔️ PvP'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {hangmanMode === 'coop' ? 'Work together to guess the word' : 'One sets word, other guesses'}
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['movies', 'animals', 'countries', 'food', 'sports', 'technology'] as HangmanCategory[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setHangmanCategory(cat)}
                          className={`px-3 py-2 rounded-lg border-2 capitalize text-sm transition-colors ${
                            hangmanCategory === cat
                              ? 'bg-indigo-500 border-indigo-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Difficulty
                    </label>
                    <div className="flex gap-2">
                      {(['easy', 'medium', 'hard'] as HangmanDifficulty[]).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setHangmanDifficulty(diff)}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 capitalize transition-colors ${
                            hangmanDifficulty === diff
                              ? 'bg-indigo-500 border-indigo-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {hangmanDifficulty === 'easy' && '4-6 letters'}
                      {hangmanDifficulty === 'medium' && '7-9 letters'}
                      {hangmanDifficulty === 'hard' && '10+ letters'}
                    </p>
                  </div>

                  {/* Max Wrong Guesses */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Max Wrong Guesses
                    </label>
                    <div className="flex gap-2">
                      {[4, 6, 8].map((num) => (
                        <button
                          key={num}
                          onClick={() => setHangmanMaxWrongGuesses(num)}
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            hangmanMaxWrongGuesses === num
                              ? 'bg-indigo-500 border-indigo-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Time Per Guess
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 0, label: 'None' },
                        { value: 10, label: '10s' },
                        { value: 15, label: '15s' },
                        { value: 30, label: '30s' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setHangmanTimeLimit(value)}
                          className={`px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-105 ${
                            hangmanTimeLimit === value
                              ? 'bg-indigo-500 border-indigo-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Power-Ups */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                      Power-Ups
                    </label>
                    <button
                      onClick={() => setHangmanPowerUpsEnabled(!hangmanPowerUpsEnabled)}
                      className={`w-full px-4 py-2 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                        hangmanPowerUpsEnabled
                          ? 'bg-indigo-500 border-indigo-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'
                      }`}
                    >
                      {hangmanPowerUpsEnabled ? '⚡ Enabled (🔍 Reveal, ❌ Remove, 💪 Extra)' : 'Disabled'}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartGame}
                disabled={room.players.length < 2}
                className="w-full glass-heavy py-3 rounded-xl font-semibold shadow-glow-green hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] text-slate-100"
              >
                Start Game
              </button>

              {error && (
                <div className="glass-light border border-red-400/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm shadow-glow-red animate-slide-down transition-theme">
                  {error}
                </div>
              )}

              {room.players.length < 2 && (
                <div className="glass-light border border-blue-400/50 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl text-sm transition-theme">
                  Waiting for another player to join...
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {room.gameId === 'number-guessing' && <NumberGuessingGame />}
            {room.gameId === 'would-you-rather' && <WouldYouRatherGame />}
            {room.gameId === 'this-or-that' && <ThisOrThatGame />}
            {room.gameId === 'tic-tac-toe' && <TicTacToeGame />}
            {room.gameId === 'connect-4' && <Connect4Game />}
            {room.gameId === 'rock-paper-scissors' && <RockPaperScissorsGame />}
            {room.gameId === 'hangman' && <HangmanGame />}
          </>
        )}

        {/* Game Switcher Modal */}
        {showGameSwitcher && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="glass rounded-2xl shadow-glass-dark dark:shadow-black p-6 max-w-lg w-full mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-theme">Change Game</h3>
                <button
                  onClick={() => setShowGameSwitcher(false)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-theme text-2xl w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 transition-theme mb-4">
                Select a new game to play. Current game progress will be reset.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_GAMES.map((game) => {
                  const isCurrentGame = room.gameId === game.id;
                  return (
                    <button
                      key={game.id}
                      onClick={() => handleChangeGame(game.id)}
                      disabled={isCurrentGame}
                      className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                        isCurrentGame
                          ? 'glass-light border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                          : 'glass-light border-purple-300 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-400 hover:glass-heavy text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{game.emoji}</div>
                      <div className="font-semibold text-sm">{game.name}</div>
                      {game.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {game.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={isSettingsPanelOpen}
          onClose={() => setIsSettingsPanelOpen(false)}
          onStartOver={isGameStarted ? handleStartOver : undefined}
          onResetToLobby={isGameStarted ? handleResetToLobby : undefined}
          soundsEnabled={soundsEnabled}
          onToggleSounds={handleToggleSounds}
          isInGame={isGameStarted}
        />
      </div>
    </div>
  );
};
