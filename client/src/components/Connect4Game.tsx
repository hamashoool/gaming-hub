import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, Connect4GameState, PowerUpTypeConnect4 } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';

export const Connect4Game: React.FC = () => {
  const { socket } = useSocket();
  const { playerId, room, gameState: rawGameState } = useGame();
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpTypeConnect4 | null>(null);
  const prevGameStateRef = useRef<Connect4GameState | null>(null);

  const gameState = rawGameState as Connect4GameState | null;

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
        const playerColor = playerIndex === 0 ? 'Yellow' : 'Red';
        if (gameState.winner === playerColor) {
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
  const playerColor = playerIndex === 0 ? 'Yellow' : 'Red';
  const isMyTurn = gameState.currentPlayer === playerColor && gameState.status === 'playing';

  const parseBoardSize = (size: string) => {
    const [, cols] = size.split('x').map(Number);
    return cols;
  };

  const cols = parseBoardSize(gameState.config.boardSize);

  const isColumnFull = (col: number): boolean => {
    return gameState.board[0][col] !== null;
  };

  const handleColumnClick = (col: number) => {
    if (!isMyTurn) return;
    if (isColumnFull(col)) return;
    if (gameState.blockedColumns.includes(col)) return;

    // If power-up is selected, use it instead
    if (selectedPowerUp) {
      handlePowerUpAction(col);
      return;
    }

    gameSounds.playClick();

    socket?.emit(SocketEvents.CONNECT_4_MOVE_MADE, {
      roomId: room.id,
      playerId,
      col
    });
  };

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn) return;
    if (!selectedPowerUp) return;

    if (selectedPowerUp === 'remove_disc') {
      const opponentColor = playerColor === 'Yellow' ? 'Red' : 'Yellow';
      if (gameState.board[row][col] === opponentColor) {
        socket?.emit(SocketEvents.USE_POWER_UP, {
          roomId: room.id,
          playerId,
          powerUpType: 'remove_disc',
          targetRow: row,
          targetCol: col
        });
        setSelectedPowerUp(null);
        gameSounds.playClick();
      }
    }
  };

  const handlePowerUpClick = (powerUpType: PowerUpTypeConnect4) => {
    if (!isMyTurn) return;

    if (selectedPowerUp === powerUpType) {
      setSelectedPowerUp(null);
    } else {
      setSelectedPowerUp(powerUpType);
      gameSounds.playClick();
    }
  };

  const handlePowerUpAction = (col?: number) => {
    if (!selectedPowerUp) return;

    if (selectedPowerUp === 'block_column') {
      if (col === undefined) return;
      socket?.emit(SocketEvents.USE_POWER_UP, {
        roomId: room.id,
        playerId,
        powerUpType: 'block_column',
        targetCol: col
      });
    } else if (selectedPowerUp === 'swap_colors' || selectedPowerUp === 'extra_turn') {
      socket?.emit(SocketEvents.USE_POWER_UP, {
        roomId: room.id,
        playerId,
        powerUpType: selectedPowerUp
      });
    }

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

    let className = 'aspect-square flex items-center justify-center text-3xl font-bold rounded-full border-2 transition-all ';

    if (cell === null) {
      className += 'glass-light border-slate-300 dark:border-slate-700 ';
    } else if (cell === 'Yellow') {
      className += 'bg-yellow-400 border-yellow-500 shadow-md ';
    } else {
      className += 'bg-red-500 border-red-600 shadow-md ';
    }

    // Highlight if power-up is targeting this cell
    if (isMyTurn && selectedPowerUp === 'remove_disc' && cell === (playerColor === 'Yellow' ? 'Red' : 'Yellow')) {
      className += 'ring-4 ring-purple-400 cursor-pointer hover:ring-purple-600 ';
    }

    return className;
  };

  const getColumnClassName = (col: number) => {
    const isBlocked = gameState.blockedColumns.includes(col);
    const isFull = isColumnFull(col);

    let className = 'p-2 rounded-xl transition-all cursor-pointer ';

    if (isBlocked) {
      className += 'glass-heavy cursor-not-allowed ';
    } else if (isFull) {
      className += 'glass-light cursor-not-allowed ';
    } else if (isMyTurn) {
      if (selectedPowerUp === 'block_column') {
        className += 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 border-2 border-yellow-400 dark:border-yellow-500 transition-theme ';
      } else if (!selectedPowerUp) {
        if (playerColor === 'Yellow') {
          className += 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 border-2 border-yellow-300 dark:border-yellow-600 transition-theme ';
        } else {
          className += 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800/30 border-2 border-red-300 dark:border-red-600 transition-theme ';
        }
      } else {
        className += 'glass-light cursor-default ';
      }
    } else {
      className += 'glass-light cursor-default ';
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
          {isMatchOver ? '🏆 Tournament Complete!' : '🔴 Connect 4 Tournament'}
        </h2>
        <div className="flex justify-center gap-4 text-sm text-slate-600 dark:text-slate-400 transition-theme mb-2">
          <span>Game: {gameState.gameNumber}/{gameState.config.bestOf}</span>
          <span>Board: {gameState.config.boardSize}</span>
        </div>
      </div>

      {/* Match Score */}
      <div className="grid grid-cols-3 gap-4 py-4 glass-light rounded-xl">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Yellow</p>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 transition-theme">{gameState.matchScore.Yellow}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Draws</p>
          <p className="text-2xl font-bold text-slate-600 dark:text-slate-300 transition-theme">{gameState.matchScore.draws}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Red</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 transition-theme">{gameState.matchScore.Red}</p>
        </div>
      </div>

      {/* Match Over Screen */}
      {isMatchOver && (
        <div className="space-y-6">
          <div className="glass-heavy border-2 shadow-glow-green rounded-xl p-6 text-center">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme mb-4">
              🏆 {gameState.matchScore.Yellow > gameState.matchScore.Red ? 'Yellow' : 'Red'} Wins the Tournament!
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="glass-light rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Total Games</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 transition-theme">{gameState.gameResults.length}</p>
              </div>
              <div className="glass-light rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Final Score</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme">
                  {gameState.matchScore.Yellow} - {gameState.matchScore.Red}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlayAgain}
            className="w-full bg-gradient-to-r from-yellow-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-yellow-700 hover:to-red-700 transition-all transform hover:scale-105"
          >
            🎮 New Tournament
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.status === 'game_over' && !isMatchOver && (
        <div className="space-y-4">
          <div className={`p-6 rounded-xl text-center border-2 ${
            gameState.winner === 'draw'
              ? 'glass-light border-slate-300 dark:border-slate-700'
              : gameState.winner === 'Yellow'
              ? 'glass-heavy border-yellow-500 shadow-glow-green'
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
            className="w-full bg-gradient-to-r from-yellow-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-yellow-700 hover:to-red-700 transition-all"
          >
            Next Game →
          </button>
        </div>
      )}

      {/* Playing Screen */}
      {gameState.status === 'playing' && (
        <div className="space-y-6">
          {/* Turn Indicator */}
          <div className={`p-4 rounded-xl text-center font-semibold ${
            isMyTurn
              ? 'glass-heavy border-2 border-green-500 text-green-800 dark:text-green-300 shadow-glow-green transition-theme'
              : 'glass-light border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-theme'
          }`}>
            {isMyTurn
              ? `Your Turn (${playerColor})`
              : `Waiting for ${gameState.currentPlayer}...`}
          </div>

          {/* Selected Power-Up Indicator */}
          {selectedPowerUp && (
            <div className="glass-heavy border-2 border-purple-400 dark:border-purple-600 p-3 rounded-xl text-center">
              <p className="font-semibold text-purple-800 dark:text-purple-300 transition-theme">
                {selectedPowerUp === 'remove_disc' && '⚡ Click opponent disc to remove it'}
                {selectedPowerUp === 'block_column' && '🚫 Click column to block it'}
                {selectedPowerUp === 'swap_colors' && '🔄 All colors will be swapped!'}
                {selectedPowerUp === 'extra_turn' && '⭐ Extra turn activated!'}
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
          <div className="bg-blue-600 p-4 rounded-xl shadow-xl">
            <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {gameState.board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={getCellClassName(rowIndex, colIndex)}
                  >
                    {cell === 'Yellow' && '🟡'}
                    {cell === 'Red' && '🔴'}
                  </div>
                ))
              )}
            </div>

            {/* Column Click Indicators */}
            <div className={`grid gap-3 mt-3`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {Array.from({ length: cols }).map((_, col) => {
                const isBlocked = gameState.blockedColumns.includes(col);
                const isFull = isColumnFull(col);
                return (
                  <button
                    key={col}
                    onClick={() => handleColumnClick(col)}
                    disabled={!isMyTurn || isFull || (isBlocked && !selectedPowerUp) || (selectedPowerUp !== 'block_column' && selectedPowerUp !== null && selectedPowerUp !== 'remove_disc')}
                    className={getColumnClassName(col)}
                  >
                    {isBlocked ? '🚫' : '↓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Power-Ups */}
          {gameState.config.powerUpsEnabled && availablePowerUps.length > 0 && (
            <div className="border-t border-slate-300 dark:border-slate-700 pt-4">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Your Power-Ups</h4>
              <div className="grid grid-cols-2 gap-2">
                {availablePowerUps.map((powerUp, index) => {
                  const powerUpType = powerUp.type as any as PowerUpTypeConnect4;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (powerUpType === 'extra_turn' || powerUpType === 'swap_colors') {
                          handlePowerUpAction();
                        } else {
                          handlePowerUpClick(powerUpType);
                        }
                      }}
                      disabled={!isMyTurn}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        selectedPowerUp === powerUpType
                          ? 'bg-purple-500 border-purple-600 text-white scale-105'
                          : 'glass-light hover:glass-heavy border-purple-300 dark:border-purple-600 text-purple-800 dark:text-purple-300'
                      } ${!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {powerUpType === 'remove_disc' && '⚡ Remove Disc'}
                      {powerUpType === 'block_column' && '🚫 Block Column'}
                      {powerUpType === 'swap_colors' && '🔄 Swap Colors'}
                      {powerUpType === 'extra_turn' && '⭐ Extra Turn'}
                    </button>
                  );
                })}
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
                className={`p-2 rounded-xl text-center text-sm ${
                  result.winner === 'Yellow'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-600'
                    : result.winner === 'Red'
                    ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600'
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
