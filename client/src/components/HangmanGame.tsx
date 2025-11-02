import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, HangmanGameState, HangmanPowerUpType } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';

export const HangmanGame: React.FC = () => {
  const { socket } = useSocket();
  const { playerId, room, gameState: rawGameState } = useGame();
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [wordInput, setWordInput] = useState('');
  const [selectedPowerUp, setSelectedPowerUp] = useState<HangmanPowerUpType | null>(null);
  const prevGameStateRef = useRef<HangmanGameState | null>(null);

  const gameState = rawGameState as HangmanGameState | null;

  // Play sounds based on game state changes
  useEffect(() => {
    if (!gameState || !soundsEnabled) return;

    const prevState = prevGameStateRef.current;

    // Play sound when word is set in PvP
    if (prevState && prevState.status === 'setup' && gameState.status === 'playing') {
      gameSounds.playClick();
    }

    // Play sound when game is over
    if (prevState && prevState.status !== 'won' && prevState.status !== 'lost' &&
        (gameState.status === 'won' || gameState.status === 'lost')) {
      if (gameState.status === 'won') {
        gameSounds.playWin();
      } else {
        gameSounds.playLose();
      }
    }

    prevGameStateRef.current = gameState;
  }, [gameState, soundsEnabled]);

  // Sync sounds enabled state
  useEffect(() => {
    gameSounds.setSoundsEnabled(soundsEnabled);
  }, [soundsEnabled]);

  if (!gameState || !room || !playerId) {
    return null;
  }

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  const opponentName = room.players[1 - playerIndex]?.name || 'Opponent';
  const isWordSetter = gameState.wordSetter === playerId;
  const isGameOver = gameState.status === 'won' || gameState.status === 'lost';

  const handleSetWord = () => {
    if (!wordInput.trim() || !socket) return;

    gameSounds.playClick();

    socket.emit(SocketEvents.HANGMAN_SET_WORD, {
      roomId: room.id,
      playerId,
      word: wordInput.trim()
    });

    setWordInput('');
  };

  const handleGuessLetter = (letter: string) => {
    if (!socket || gameState.status !== 'playing') return;

    // In PvP mode, word setter cannot guess
    if (gameState.config.mode === 'pvp' && isWordSetter) return;

    // Check if already guessed
    if (gameState.guessedLetters.includes(letter)) return;

    gameSounds.playClick();

    socket.emit(SocketEvents.HANGMAN_GUESS_LETTER, {
      roomId: room.id,
      playerId,
      letter,
      powerUpType: selectedPowerUp
    });

    setSelectedPowerUp(null);
  };

  const handlePowerUpClick = (powerUpType: HangmanPowerUpType) => {
    if (selectedPowerUp === powerUpType) {
      setSelectedPowerUp(null);
    } else {
      setSelectedPowerUp(powerUpType);
      gameSounds.playClick();
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

  // Get masked word with spaces
  const getMaskedWord = () => {
    return gameState.word
      .split('')
      .map(char => {
        if (char === ' ') return ' ';
        return gameState.guessedLetters.includes(char) ? char : '_';
      })
      .join(' ');
  };

  // Alphabet for letter buttons
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Draw hangman based on wrong guesses
  const getHangmanDrawing = () => {
    const parts = [
      '😵',  // head
      '|',   // body
      '/',   // left arm
      '\\',  // right arm
      '/',   // left leg
      '\\'   // right leg
    ];

    const wrongCount = gameState.wrongGuessCount;
    const visibleParts = Math.min(wrongCount, parts.length);

    return (
      <div className="text-center font-mono text-2xl">
        <div className="mb-2">_____</div>
        <div className="mb-2">|   {visibleParts >= 1 ? parts[0] : ' '}</div>
        <div className="mb-2">|  {visibleParts >= 3 ? parts[2] : ' '}{visibleParts >= 2 ? parts[1] : ' '}{visibleParts >= 4 ? parts[3] : ' '}</div>
        <div className="mb-2">|  {visibleParts >= 5 ? parts[4] : ' '} {visibleParts >= 6 ? parts[5] : ' '}</div>
        <div>|</div>
      </div>
    );
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
          {isGameOver ? '🏆 Game Complete!' : '📝 Hangman'}
        </h2>
        <div className="flex justify-center gap-4 text-sm text-slate-600 dark:text-slate-400 transition-theme mb-2">
          <span>Mode: {gameState.config.mode === 'coop' ? 'Co-op' : 'PvP'}</span>
          <span>Category: {gameState.category}</span>
          <span>Difficulty: {gameState.config.difficulty}</span>
        </div>
      </div>

      {/* Word Setup Screen (PvP only) */}
      {gameState.status === 'setup' && gameState.config.mode === 'pvp' && (
        <div className="space-y-6">
          {isWordSetter ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl text-center font-semibold glass-light border-2 border-blue-500 dark:border-blue-400 text-blue-800 dark:text-blue-300 transition-theme">
                Set a Word for Your Opponent
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 transition-theme mb-2">
                  Enter Word (Letters & Spaces Only)
                </label>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value.toUpperCase())}
                  placeholder="Enter word..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 glass-light rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase transition-theme"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 transition-theme mt-1">
                  {gameState.config.difficulty === 'easy' && '4-6 letters'}
                  {gameState.config.difficulty === 'medium' && '7-9 letters'}
                  {gameState.config.difficulty === 'hard' && '10+ letters'}
                </p>
              </div>
              <button
                onClick={handleSetWord}
                disabled={!wordInput.trim()}
                className="w-full glass-light hover:glass-heavy text-slate-800 dark:text-slate-100 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-theme"
              >
                Set Word
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-xl text-center glass-light border-2 border-yellow-500 dark:border-yellow-400 transition-theme">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 transition-theme">
                Waiting for {opponentName} to set a word...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Playing Screen */}
      {gameState.status === 'playing' && (
        <div className="space-y-6">
          {/* Hangman Drawing & Progress */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-light rounded-xl p-4 border-2 border-slate-300 dark:border-slate-700 transition-theme">
              {getHangmanDrawing()}
              <div className="text-center mt-4 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-theme">
                Wrong: {gameState.wrongGuessCount}/{gameState.config.maxWrongGuesses}
              </div>
            </div>
            <div className="space-y-4">
              <div className="glass-light rounded-xl p-4 border-2 border-blue-300 dark:border-blue-600 transition-theme">
                <div className="text-sm text-slate-600 dark:text-slate-400 transition-theme mb-2">Word:</div>
                <div className="text-3xl font-bold text-blue-800 dark:text-blue-300 transition-theme tracking-wider font-mono">
                  {getMaskedWord()}
                </div>
              </div>
              <div className="glass-light rounded-xl p-3 border-2 border-green-300 dark:border-green-600 transition-theme">
                <div className="text-xs text-slate-600 dark:text-slate-400 transition-theme mb-1">Guessed:</div>
                <div className="text-sm font-semibold text-green-800 dark:text-green-300 transition-theme">
                  {gameState.guessedLetters.sort().join(' ') || 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* In PvP, word setter just watches */}
          {gameState.config.mode === 'pvp' && isWordSetter ? (
            <div className="p-4 rounded-xl text-center glass-light border-2 border-yellow-300 dark:border-yellow-500 transition-theme">
              <p className="font-semibold text-yellow-800 dark:text-yellow-300 transition-theme">
                Watching {opponentName} guess your word...
              </p>
            </div>
          ) : (
            <>
              {/* Selected Power-Up Indicator */}
              {selectedPowerUp && (
                <div className="glass-light border-2 border-purple-400 dark:border-purple-500 p-3 rounded-xl text-center transition-theme">
                  <p className="font-semibold text-purple-800 dark:text-purple-300 transition-theme">
                    {selectedPowerUp === 'reveal_letter' && '🔍 Reveal a random letter'}
                    {selectedPowerUp === 'remove_wrong' && '❌ Remove last wrong guess'}
                    {selectedPowerUp === 'extra_guess' && '💪 Extra guess'}
                  </p>
                  <button
                    onClick={() => setSelectedPowerUp(null)}
                    className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-theme"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Letter Buttons */}
              <div className="grid grid-cols-7 gap-2">
                {alphabet.map((letter) => {
                  const isGuessed = gameState.guessedLetters.includes(letter);
                  const isWrong = gameState.wrongGuesses.includes(letter);

                  return (
                    <button
                      key={letter}
                      onClick={() => handleGuessLetter(letter)}
                      disabled={isGuessed}
                      className={`p-3 rounded-xl font-bold text-lg transition-all ${
                        isGuessed
                          ? isWrong
                            ? 'glass-light border-2 border-red-400 dark:border-red-500 text-red-800 dark:text-red-300 cursor-not-allowed transition-theme'
                            : 'glass-light border-2 border-green-400 dark:border-green-500 text-green-800 dark:text-green-300 cursor-not-allowed transition-theme'
                          : 'glass-light border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:glass-heavy active:scale-95 transition-theme'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {/* Power-Ups */}
              {gameState.config.powerUpsEnabled && availablePowerUps.length > 0 && (
                <div className="border-t border-slate-300 dark:border-slate-700 pt-4 transition-theme">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Your Power-Ups</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {availablePowerUps.map((powerUp, index) => {
                      const powerUpType = powerUp.type as any as HangmanPowerUpType;
                      return (
                        <button
                          key={index}
                          onClick={() => handlePowerUpClick(powerUpType)}
                          className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                            selectedPowerUp === powerUpType
                              ? 'glass-heavy border-purple-600 dark:border-purple-400 text-purple-900 dark:text-purple-100 scale-105 transition-theme'
                              : 'glass-light border-purple-300 dark:border-purple-600 text-purple-800 dark:text-purple-300 hover:glass-heavy transition-theme'
                          }`}
                        >
                          {powerUpType === 'reveal_letter' && '🔍 Reveal'}
                          {powerUpType === 'remove_wrong' && '❌ Remove'}
                          {powerUpType === 'extra_guess' && '💪 Extra'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="space-y-6">
          <div className={`rounded-2xl p-6 text-center border-2 transition-theme ${
            gameState.status === 'won'
              ? 'glass-heavy shadow-glow-green border-green-400 dark:border-green-500'
              : 'glass-heavy border-red-400 dark:border-red-500'
          }`}>
            <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100 transition-theme">
              {gameState.status === 'won'
                ? (gameState.config.mode === 'coop'
                    ? '🎉 Team Victory!'
                    : (gameState.winner === playerId ? '🎉 You Win!' : '😢 You Lost!'))
                : (gameState.config.mode === 'coop'
                    ? '😢 Team Lost!'
                    : (gameState.winner === playerId ? '🎉 You Win!' : '😢 You Lost!'))}
            </h3>

            <div className="glass-light rounded-xl p-4 mb-4 transition-theme">
              <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm mb-2">The word was:</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 transition-theme tracking-wider">{gameState.word}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="glass-light rounded-xl p-3 transition-theme">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-xs">Total Guesses</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme">{gameState.guessHistory.length}</p>
              </div>
              <div className="glass-light rounded-xl p-3 transition-theme">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-xs">Correct</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 transition-theme">
                  {gameState.guessHistory.filter(g => g.correct).length}
                </p>
              </div>
              <div className="glass-light rounded-xl p-3 transition-theme">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-xs">Wrong</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 transition-theme">{gameState.wrongGuessCount}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlayAgain}
            className="w-full glass-light hover:glass-heavy text-slate-800 dark:text-slate-100 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            🎮 Play Again
          </button>
        </div>
      )}

      {/* Guess History */}
      {!isGameOver && gameState.guessHistory.length > 0 && (
        <div className="border-t border-slate-300 dark:border-slate-700 pt-4 transition-theme">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Recent Guesses</h4>
          <div className="grid grid-cols-8 gap-2">
            {gameState.guessHistory.slice(-8).map((guess, index) => (
              <div
                key={index}
                className={`p-2 rounded-xl text-center text-sm font-bold transition-theme ${
                  guess.correct
                    ? 'glass-light text-green-800 dark:text-green-300 border-2 border-green-300 dark:border-green-500'
                    : 'glass-light text-red-800 dark:text-red-300 border-2 border-red-300 dark:border-red-500'
                }`}
                title={`${guess.playerName}: ${guess.letter} (${guess.correct ? 'Correct' : 'Wrong'})`}
              >
                {guess.letter}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
