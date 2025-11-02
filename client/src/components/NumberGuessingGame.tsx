import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';

export const NumberGuessingGame: React.FC = () => {
  const { socket } = useSocket();
  const { playerId, room, gameState } = useGame();
  const [guess, setGuess] = useState('');
  const [error, setError] = useState('');
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const prevGameStateRef = useRef(gameState);

  // Play sounds based on game state changes
  useEffect(() => {
    if (!gameState || !soundsEnabled) return;

    const prevState = prevGameStateRef.current;

    // Play sound when game starts (first guess or game reset)
    if (prevState && prevState.guesses.length === 0 && gameState.guesses.length === 0 && prevState.status !== gameState.status) {
      gameSounds.playGameStart();
    }

    // Play sound when a new guess is made
    if (prevState && gameState.guesses.length > prevState.guesses.length) {
      const latestGuess = gameState.guesses[gameState.guesses.length - 1];

      if (latestGuess.feedback === 'correct') {
        // Play win or lose sound
        if (latestGuess.playerId === playerId) {
          gameSounds.playWin();
        } else {
          gameSounds.playLose();
        }
      } else if (latestGuess.playerId === playerId) {
        // Play feedback sound for your own guesses
        if (latestGuess.feedback === 'too_high') {
          gameSounds.playTooHigh();
        } else if (latestGuess.feedback === 'too_low') {
          gameSounds.playTooLow();
        }
      }
    }

    // Play sound when turn changes to you
    if (prevState && prevState.currentTurn !== playerId && gameState.currentTurn === playerId && gameState.status === 'playing') {
      gameSounds.playYourTurn();
    }

    prevGameStateRef.current = gameState;
  }, [gameState, playerId, soundsEnabled]);

  // Sync sounds enabled state
  useEffect(() => {
    gameSounds.setSoundsEnabled(soundsEnabled);
  }, [soundsEnabled]);

  if (!gameState || !room || !playerId) {
    return null;
  }

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();

    const guessNumber = parseInt(guess);

    if (isNaN(guessNumber)) {
      setError('Please enter a valid number');
      return;
    }

    if (guessNumber < gameState.config.minRange || guessNumber > gameState.config.maxRange) {
      setError(`Number must be between ${gameState.config.minRange} and ${gameState.config.maxRange}`);
      return;
    }

    if (gameState.currentTurn !== playerId) {
      setError("It's not your turn!");
      return;
    }

    gameSounds.playClick();

    socket?.emit(SocketEvents.MAKE_GUESS, {
      roomId: room.id,
      guess: guessNumber,
      playerId
    });

    setGuess('');
    setError('');
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

  const isMyTurn = gameState.currentTurn === playerId;
  const isFinished = gameState.status === 'finished';
  const winner = isFinished && gameState.winner
    ? room.players.find(p => p.id === gameState.winner)
    : null;

  const myGuesses = gameState.guesses.filter(g => g.playerId === playerId);
  const opponentGuesses = gameState.guesses.filter(g => g.playerId !== playerId);

  return (
    <div className="glass rounded-2xl shadow-glass dark:shadow-glass-dark p-6 space-y-6 animate-scale-in">
      {/* Game Info */}
      <div className="text-center relative">
        <button
          onClick={toggleSounds}
          className="absolute right-0 top-0 px-3 py-1 text-sm glass-light hover:glass-heavy rounded-xl transition-all hover:scale-105"
          title={soundsEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundsEnabled ? '🔊' : '🔇'}
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme mb-2">
          {isFinished ? '🎉 Game Finished!' : '🎯 Guess the Number'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 transition-theme">
          Range: {gameState.config.minRange} - {gameState.config.maxRange}
        </p>
      </div>

      {/* Winner announcement */}
      {isFinished && winner && (
        <div className="space-y-4 animate-fade-in">
          <div className={`p-4 rounded-xl text-center border-2 transition-theme ${
            winner.id === playerId
              ? 'glass-heavy border-emerald-500 dark:border-emerald-400 shadow-glow-green'
              : 'glass-heavy border-red-500 dark:border-red-400 shadow-glow-red'
          }`}>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-theme">
              {winner.id === playerId ? '🏆 You Won!' : `${winner.name} Won!`}
            </p>
            <p className="text-slate-700 dark:text-slate-300 transition-theme mt-2">
              The number was: <span className="font-bold">{gameState.guesses.find(g => g.feedback === 'correct')?.number}</span>
            </p>
          </div>
          <button
            onClick={handlePlayAgain}
            className="w-full glass-heavy py-3 rounded-xl font-semibold shadow-glow hover:shadow-glow-blue transition-all transform hover:scale-[1.02] active:scale-[0.98] text-slate-100"
          >
            🎮 Play Again
          </button>
        </div>
      )}

      {/* Guess Input */}
      {!isFinished && (
        <form onSubmit={handleSubmitGuess} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme">
                Your Guess
              </label>
              {isMyTurn ? (
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold transition-theme animate-pulse">Your Turn!</span>
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-400 transition-theme">Waiting for opponent...</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Enter your guess"
                min={gameState.config.minRange}
                max={gameState.config.maxRange}
                disabled={!isMyTurn}
                className="flex-1 px-4 py-3 glass-light rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none disabled:opacity-50 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-theme"
              />
              <button
                type="submit"
                disabled={!isMyTurn || !guess}
                className="px-6 py-3 glass-heavy rounded-xl font-semibold shadow-glow hover:shadow-glow-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 text-slate-100"
              >
                Submit
              </button>
            </div>
          </div>

          {error && (
            <div className="glass-light border border-red-400/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm shadow-glow-red animate-slide-down transition-theme">
              {error}
            </div>
          )}
        </form>
      )}

      {/* Guess History */}
      <div className="grid grid-cols-2 gap-4">
        {/* My Guesses */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Your Guesses</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {myGuesses.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm transition-theme">No guesses yet</p>
            ) : (
              myGuesses.map((g, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border-2 transition-all animate-slide-up ${
                    g.feedback === 'correct'
                      ? 'glass-heavy border-emerald-500 dark:border-emerald-400 shadow-glow-green'
                      : g.feedback === 'too_high'
                      ? 'glass-light border-orange-500 dark:border-orange-400'
                      : 'glass-light border-blue-500 dark:border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-slate-800 dark:text-slate-100 transition-theme">{g.number}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 transition-theme">
                      {g.feedback === 'correct' && '✅ Correct!'}
                      {g.feedback === 'too_high' && '⬇️ Too High'}
                      {g.feedback === 'too_low' && '⬆️ Too Low'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Opponent Guesses */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Opponent's Guesses</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {opponentGuesses.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm transition-theme">No guesses yet</p>
            ) : (
              opponentGuesses.map((g, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border-2 transition-all animate-slide-up ${
                    g.feedback === 'correct'
                      ? 'glass-heavy border-emerald-500 dark:border-emerald-400 shadow-glow-green'
                      : g.feedback === 'too_high'
                      ? 'glass-light border-orange-500 dark:border-orange-400'
                      : 'glass-light border-blue-500 dark:border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-slate-800 dark:text-slate-100 transition-theme">{g.number}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 transition-theme">
                      {g.feedback === 'correct' && '✅ Correct!'}
                      {g.feedback === 'too_high' && '⬇️ Too High'}
                      {g.feedback === 'too_low' && '⬆️ Too Low'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm transition-theme">Your Attempts</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 transition-theme">{myGuesses.length}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm transition-theme">Opponent's Attempts</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-theme">{opponentGuesses.length}</p>
        </div>
      </div>
    </div>
  );
};
