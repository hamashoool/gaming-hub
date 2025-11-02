import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, TicTacToeGameState, PowerUpType } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';

export const TicTacToeGame: React.FC = () => {
  const { socket } = useSocket();
  const { playerId, room, gameState: rawGameState } = useGame();
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpType | null>(null);
  const prevGameStateRef = useRef<TicTacToeGameState | null>(null);

  const gameState = rawGameState as TicTacToeGameState | null;

  // Play sounds based on game state changes
  useEffect(() => {
    if (!gameState || !soundsEnabled) return;

    const prevState = prevGameStateRef.current;

    // Play sound when game starts
    if (!prevState && gameState.status === 'playing') {
      gameSounds.playGameStart();
    }

    // Play sound when move is made
    if (prevState && gameState.moves.length > prevState.moves.length) {
      gameSounds.playClick();
    }

    // Play sound when game is over
    if (prevState && prevState.status === 'playing' && gameState.status === 'game_over') {
      if (gameState.winner === 'draw') {
        gameSounds.playClick();
      } else {
        const playerIndex = room?.players.findIndex(p => p.id === playerId) ?? -1;
        const playerSymbol = playerIndex === 0 ? 'X' : 'O';
        if (gameState.winner === playerSymbol) {
          gameSounds.playWin();
        } else {
          gameSounds.playLose();
        }
      }
    }

    prevGameStateRef.current = gameState;
  }, [gameState, soundsEnabled, playerId, room]);

  // Sync sounds enabled state
  useEffect(() => {
    gameSounds.setSoundsEnabled(soundsEnabled);
  }, [soundsEnabled]);

  if (!gameState || !room || !playerId) {
    return null;
  }

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  const playerSymbol = playerIndex === 0 ? 'X' : 'O';
  const isMyTurn = gameState.currentPlayer === playerSymbol && gameState.status === 'playing';

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn) return;
    if (gameState.board[row][col] !== null) return;

    // If power-up is selected, use it instead
    if (selectedPowerUp) {
      handlePowerUpUse(row, col);
      return;
    }

    // Check if cell is blocked
    if (gameState.blockedCell &&
        gameState.blockedCell.row === row &&
        gameState.blockedCell.col === col) {
      return;
    }

    gameSounds.playClick();

    socket?.emit(SocketEvents.MAKE_MOVE, {
      roomId: room.id,
      playerId,
      row,
      col
    });
  };

  const handlePowerUpClick = (powerUpType: PowerUpType) => {
    if (!isMyTurn) return;

    if (selectedPowerUp === powerUpType) {
      setSelectedPowerUp(null);
    } else {
      setSelectedPowerUp(powerUpType);
      gameSounds.playClick();
    }
  };

  const handlePowerUpUse = (targetRow?: number, targetCol?: number) => {
    if (!selectedPowerUp) return;

    socket?.emit(SocketEvents.USE_POWER_UP, {
      roomId: room.id,
      playerId,
      powerUpType: selectedPowerUp,
      targetRow,
      targetCol
    });

    setSelectedPowerUp(null);
    gameSounds.playClick();
  };

  const handleNextGame = () => {
    if (socket && room) {
      gameSounds.playClick();
      socket.emit(SocketEvents.NEXT_GAME_IN_SERIES, { roomId: room.id });
    }
  };

  const handlePlayAgain = () => {
    if (socket && room) {
      gameSounds.playClick();
      socket.emit(SocketEvents.PLAY_AGAIN, { roomId: room.id });
    }
  };

  const toggleSounds = () => {
    setSoundsEnabled(!soundsEnabled);
    gameSounds.playClick();
  };

  const availablePowerUps = gameState.powerUps.filter(
    pu => pu.playerId === playerId && !pu.used
  );

  const gamesNeededToWin = Math.ceil(gameState.config.bestOf / 2);
  const isMatchOver = gameState.status === 'match_over';

  const getCellClassName = (row: number, col: number) => {
    const cell = gameState.board[row][col];
    const isBlocked = gameState.blockedCell?.row === row && gameState.blockedCell?.col === col;

    let className = 'aspect-square flex items-center justify-center text-4xl font-bold border-2 transition-all cursor-pointer rounded-xl ';

    if (isBlocked) {
      className += 'glass-heavy border-slate-600 dark:border-slate-700 cursor-not-allowed ';
    } else if (cell === null) {
      if (isMyTurn && selectedPowerUp === 'block') {
        className += 'glass-light border-yellow-300 dark:border-yellow-600 hover:glass-heavy ';
      } else if (isMyTurn) {
        className += 'glass-light border-slate-300 dark:border-slate-700 hover:glass-heavy ';
      } else {
        className += 'glass-light border-slate-300 dark:border-slate-700 cursor-default ';
      }
    } else if (cell === 'X') {
      if (isMyTurn && selectedPowerUp === 'steal' && cell !== playerSymbol) {
        className += 'glass-light border-red-400 dark:border-red-600 hover:glass-heavy ';
      } else {
        className += 'glass-light border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 cursor-default transition-theme ';
      }
    } else {
      if (isMyTurn && selectedPowerUp === 'steal' && cell !== playerSymbol) {
        className += 'glass-light border-red-400 dark:border-red-600 hover:glass-heavy ';
      } else {
        className += 'glass-light border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 cursor-default transition-theme ';
      }
    }

    return className;
  };

  return (
    <div className="glass rounded-2xl shadow-glass dark:shadow-glass-dark animate-scale-in p-6 space-y-6">
      {/* Game Info */}
      <div className="text-center relative">
        <button
          onClick={toggleSounds}
          className="absolute right-0 top-0 px-3 py-1 text-sm glass-light hover:glass-heavy rounded-xl transition-theme"
          title={soundsEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundsEnabled ? '🔊' : '🔇'}
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme mb-2">
          {isMatchOver ? '🏆 Tournament Complete!' : '⭕ Tic Tac Toe Tournament'}
        </h2>
        <div className="flex justify-center gap-4 text-sm text-slate-600 dark:text-slate-400 transition-theme mb-2">
          <span>Game: {gameState.gameNumber}/{gameState.config.bestOf}</span>
          <span>Board: {gameState.config.boardSize}x{gameState.config.boardSize}</span>
        </div>
      </div>

      {/* Match Score */}
      <div className="grid grid-cols-3 gap-4 py-4 glass-light rounded-2xl">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Player X</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 transition-theme">{gameState.matchScore.X}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Draws</p>
          <p className="text-2xl font-bold text-slate-600 dark:text-slate-400 transition-theme">{gameState.matchScore.draws}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Player O</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 transition-theme">{gameState.matchScore.O}</p>
        </div>
      </div>

      {/* Match Over Screen */}
      {isMatchOver && (
        <div className="space-y-6">
          <div className="glass-heavy border-2 shadow-glow-green rounded-2xl p-6 text-center">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme mb-4">
              🏆 {gameState.matchScore.X > gameState.matchScore.O ? 'Player X' : 'Player O'} Wins the Tournament!
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="glass-light rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Total Games</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 transition-theme">{gameState.gameResults.length}</p>
              </div>
              <div className="glass-light rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Final Score</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme">
                  {gameState.matchScore.X} - {gameState.matchScore.O}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlayAgain}
            className="w-full bg-gradient-to-r from-blue-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-red-700 transition-all transform hover:scale-105"
          >
            🎮 New Tournament
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.status === 'game_over' && !isMatchOver && (
        <div className="space-y-4">
          <div className={`p-6 rounded-2xl text-center border-2 ${
            gameState.winner === 'draw'
              ? 'glass-light border-slate-300 dark:border-slate-700'
              : gameState.winner === 'X'
              ? 'glass-heavy border-blue-500 shadow-glow-green'
              : 'glass-heavy border-red-500 shadow-glow-green'
          }`}>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme mb-2">
              {gameState.winner === 'draw'
                ? '🤝 Draw!'
                : `🎉 ${gameState.winner} Wins Game ${gameState.gameNumber}!`}
            </p>
            <p className="text-slate-700 dark:text-slate-300 transition-theme">
              First to {gamesNeededToWin} wins the tournament
            </p>
          </div>

          <button
            onClick={handleNextGame}
            className="w-full bg-gradient-to-r from-blue-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-red-700 transition-theme"
          >
            Next Game →
          </button>
        </div>
      )}

      {/* Playing Screen */}
      {gameState.status === 'playing' && (
        <div className="space-y-6">
          {/* Turn Indicator */}
          <div className={`p-4 rounded-2xl text-center font-semibold transition-theme ${
            isMyTurn
              ? 'glass-heavy border-2 shadow-glow-green text-green-800 dark:text-green-300'
              : 'glass-light border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            {isMyTurn
              ? `Your Turn (${playerSymbol})`
              : `Waiting for ${gameState.currentPlayer}...`}
          </div>

          {/* Selected Power-Up Indicator */}
          {selectedPowerUp && (
            <div className="glass-heavy border-2 border-purple-400 dark:border-purple-500 p-3 rounded-2xl text-center">
              <p className="font-semibold text-purple-800 dark:text-purple-300 transition-theme">
                {selectedPowerUp === 'steal' && '⚡ Click opponent cell to steal it'}
                {selectedPowerUp === 'block' && '🚫 Click empty cell to block it'}
                {selectedPowerUp === 'extra_turn' && '🔄 Extra turn activated!'}
              </p>
              <button
                onClick={() => setSelectedPowerUp(null)}
                className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-theme"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Board */}
          <div className={`grid gap-2 ${
            gameState.config.boardSize === 3 ? 'grid-cols-3' :
            gameState.config.boardSize === 4 ? 'grid-cols-4' :
            'grid-cols-5'
          }`}>
            {gameState.board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={getCellClassName(rowIndex, colIndex)}
                  disabled={!isMyTurn && !selectedPowerUp}
                >
                  {cell === null ? (
                    gameState.blockedCell?.row === rowIndex &&
                    gameState.blockedCell?.col === colIndex ? '🚫' : ''
                  ) : cell === 'X' ? '❌' : '⭕'}
                </button>
              ))
            )}
          </div>

          {/* Power-Ups */}
          {gameState.config.powerUpsEnabled && availablePowerUps.length > 0 && (
            <div className="border-t border-slate-300 dark:border-slate-700 pt-4">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Your Power-Ups</h4>
              <div className="grid grid-cols-3 gap-2">
                {availablePowerUps.map((powerUp, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (powerUp.type === 'extra_turn') {
                        handlePowerUpUse();
                      } else {
                        handlePowerUpClick(powerUp.type);
                      }
                    }}
                    disabled={!isMyTurn}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      selectedPowerUp === powerUp.type
                        ? 'bg-purple-500 border-purple-600 text-white scale-105'
                        : 'glass-light hover:glass-heavy border-purple-300 dark:border-purple-500 text-purple-800 dark:text-purple-300'
                    } ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {powerUp.type === 'steal' && '⚡ Steal'}
                    {powerUp.type === 'block' && '🚫 Block'}
                    {powerUp.type === 'extra_turn' && '🔄 Extra Turn'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game History */}
      {gameState.gameResults.length > 0 && !isMatchOver && (
        <div className="border-t border-slate-300 dark:border-slate-700 pt-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Game History</h4>
          <div className="grid grid-cols-3 gap-2">
            {gameState.gameResults.map((result) => (
              <div
                key={result.gameNumber}
                className={`p-2 rounded-xl text-center text-sm transition-theme ${
                  result.winner === 'X'
                    ? 'glass-light border-2 border-blue-300 dark:border-blue-600'
                    : result.winner === 'O'
                    ? 'glass-light border-2 border-red-300 dark:border-red-600'
                    : 'glass-light border-2 border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-800 dark:text-slate-100 transition-theme">Game {result.gameNumber}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 transition-theme">
                  {result.winner === 'draw' ? 'Draw' : `${result.winner} Won`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
