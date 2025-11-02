import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, WouldYouRatherGameState, RoundResult } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';

export const WouldYouRatherGame: React.FC = () => {
  const { socket } = useSocket();
  const { playerId, room, gameState: rawGameState } = useGame();
  const [, setSelectedChoice] = useState<'A' | 'B' | null>(null);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const prevGameStateRef = useRef<WouldYouRatherGameState | null>(null);

  const gameState = rawGameState as WouldYouRatherGameState | null;

  // Play sounds based on game state changes
  useEffect(() => {
    if (!gameState || !soundsEnabled) return;

    const prevState = prevGameStateRef.current;

    // Play sound when game starts
    if (!prevState && gameState.status === 'playing') {
      gameSounds.playGameStart();
    }

    // Play sound when choices are revealed
    if (prevState && prevState.status === 'playing' && gameState.status === 'revealing') {
      const latestResult = gameState.roundResults[gameState.roundResults.length - 1];
      if (latestResult.isMatch) {
        gameSounds.playWin(); // Match sound
      } else {
        gameSounds.playClick(); // Different choice sound
      }
    }

    // Play sound when moving to next question
    if (prevState && prevState.status === 'revealing' && gameState.status === 'playing') {
      gameSounds.playYourTurn();
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

  const handleChoiceClick = (choice: 'A' | 'B') => {
    if (gameState.status !== 'playing') return;
    if (gameState.choices.some(c => c.playerId === playerId)) return; // Already chose

    setSelectedChoice(choice);
    gameSounds.playClick();

    socket?.emit(SocketEvents.SUBMIT_CHOICE, {
      roomId: room.id,
      playerId,
      choice
    });
  };

  const handleNextQuestion = () => {
    if (socket && room) {
      gameSounds.playClick();
      socket.emit(SocketEvents.NEXT_QUESTION, { roomId: room.id });
      setSelectedChoice(null);
    }
  };

  const handlePlayAgain = () => {
    if (socket && room) {
      gameSounds.playClick();
      socket.emit(SocketEvents.PLAY_AGAIN, { roomId: room.id });
      setSelectedChoice(null);
    }
  };

  const toggleSounds = () => {
    setSoundsEnabled(!soundsEnabled);
    gameSounds.playClick();
  };

  const myChoice = gameState.choices.find(c => c.playerId === playerId);
  const opponentChoice = gameState.choices.find(c => c.playerId !== playerId);
  const isFinished = gameState.status === 'finished';
  const isRevealing = gameState.status === 'revealing';
  const bothChosen = gameState.choices.length === 2;
  const latestResult: RoundResult | undefined = gameState.roundResults[gameState.roundResults.length - 1];

  const compatibilityPercentage = gameState.roundResults.length > 0
    ? Math.round((gameState.matchCount / gameState.roundResults.length) * 100)
    : 0;

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
          {isFinished ? '🎉 Game Finished!' : '🤔 Would You Rather...'}
        </h2>
        <div className="flex justify-center gap-4 text-sm text-slate-600 dark:text-slate-400 transition-theme">
          <span>Round: {gameState.currentRound}/{gameState.config.maxRounds}</span>
          {gameState.config.mode === 'compatibility' && (
            <span>Compatibility: {compatibilityPercentage}%</span>
          )}
        </div>
      </div>

      {/* Game Finished Screen */}
      {isFinished && (
        <div className="space-y-6">
          <div className="glass-light rounded-xl border-2 border-purple-300 dark:border-purple-700 hover:glass-heavy shadow-glow p-6 text-center transition-theme">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme mb-4">Final Results!</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="glass-light rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Total Matches</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 transition-theme">{gameState.matchCount}</p>
              </div>
              <div className="glass-light rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Differences</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 transition-theme">
                  {gameState.roundResults.length - gameState.matchCount}
                </p>
              </div>
            </div>
            {gameState.config.mode === 'compatibility' && (
              <div className="glass-light rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm mb-2">Compatibility Score</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4 transition-theme">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${compatibilityPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 transition-theme">{compatibilityPercentage}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Previous Rounds Summary */}
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Round History</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gameState.roundResults.map((result) => (
                <div
                  key={result.round}
                  className={`p-3 rounded-xl border-2 transition-theme ${
                    result.isMatch
                      ? 'glass-light border-green-300 dark:border-green-700 hover:glass-heavy shadow-glow'
                      : 'glass-light border-orange-300 dark:border-orange-700 hover:glass-heavy shadow-glow'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 transition-theme">Round {result.round}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 transition-theme">
                      {result.isMatch ? '✅ Match!' : '❌ Different'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 transition-theme mb-2">
                    <span className="font-medium">A:</span> {result.question.optionA}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 transition-theme">
                    <span className="font-medium">B:</span> {result.question.optionB}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePlayAgain}
            className="w-full glass-heavy shadow-glow hover:shadow-glow-blue text-slate-100 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            🎮 Play Again
          </button>
        </div>
      )}

      {/* Revealing Screen */}
      {isRevealing && latestResult && (
        <div className="space-y-6">
          <div className={`p-6 rounded-xl text-center border-2 transition-theme ${
            latestResult.isMatch
              ? 'glass-light border-green-300 dark:border-green-700 hover:glass-heavy shadow-glow'
              : 'glass-light border-orange-300 dark:border-orange-700 hover:glass-heavy shadow-glow'
          }`}>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme mb-2">
              {latestResult.isMatch ? '🎉 You Both Chose the Same!' : '🤷 You Chose Differently'}
            </p>
            {gameState.config.mode === 'compatibility' && (
              <p className="text-slate-700 dark:text-slate-300 transition-theme">Current Compatibility: {compatibilityPercentage}%</p>
            )}
          </div>

          {/* Show question and choices */}
          <div className="space-y-4">
            <div className="glass-light rounded-xl p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 transition-theme mb-3 text-center">Would you rather...</p>
              <div className="grid grid-cols-2 gap-4">
                {latestResult.choices.map((choice) => (
                  <div
                    key={choice.playerId}
                    className={`p-4 rounded-xl border-2 transition-theme ${
                      choice.choice === 'A'
                        ? 'glass-light border-purple-300 dark:border-purple-700 hover:glass-heavy shadow-glow'
                        : 'glass-light border-blue-300 dark:border-blue-700 hover:glass-heavy shadow-glow'
                    }`}
                  >
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 transition-theme mb-1">{choice.playerName}</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 transition-theme">
                      Chose: <span className="font-bold">{choice.choice}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 transition-theme mt-2">
                      {choice.choice === 'A' ? latestResult.question.optionA : latestResult.question.optionB}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleNextQuestion}
            className="w-full glass-heavy shadow-glow hover:shadow-glow-blue text-slate-100 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            {gameState.currentRound >= gameState.config.maxRounds ? 'See Results' : 'Next Question →'}
          </button>
        </div>
      )}

      {/* Playing Screen */}
      {gameState.status === 'playing' && gameState.currentQuestion && (
        <div className="space-y-6">
          <div className="glass-light rounded-xl p-6 transition-theme">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400 transition-theme mb-4">
              Category: <span className="font-semibold capitalize">{gameState.currentQuestion.category}</span>
            </p>
            <p className="text-center text-lg font-medium text-slate-800 dark:text-slate-100 transition-theme mb-6">
              Would you rather...
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleChoiceClick('A')}
                disabled={!!myChoice}
                className={`p-6 rounded-xl border-2 text-left transition-all transform ${
                  myChoice?.choice === 'A'
                    ? 'glass-heavy border-purple-300 dark:border-purple-700 shadow-glow text-slate-100 scale-105'
                    : 'glass-light border-purple-300 dark:border-purple-700 hover:glass-heavy hover:shadow-glow hover:scale-105'
                } ${myChoice && myChoice.choice !== 'A' ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-2xl font-bold ${myChoice?.choice === 'A' ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100 transition-theme'}`}>A</span>
                  {myChoice?.choice === 'A' && <span className="text-sm text-slate-100">✓ Your Choice</span>}
                </div>
                <p className={myChoice?.choice === 'A' ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100 transition-theme'}>
                  {gameState.currentQuestion.optionA}
                </p>
              </button>

              <button
                onClick={() => handleChoiceClick('B')}
                disabled={!!myChoice}
                className={`p-6 rounded-xl border-2 text-left transition-all transform ${
                  myChoice?.choice === 'B'
                    ? 'glass-heavy border-blue-300 dark:border-blue-700 shadow-glow text-slate-100 scale-105'
                    : 'glass-light border-blue-300 dark:border-blue-700 hover:glass-heavy hover:shadow-glow hover:scale-105'
                } ${myChoice && myChoice.choice !== 'B' ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-2xl font-bold ${myChoice?.choice === 'B' ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100 transition-theme'}`}>B</span>
                  {myChoice?.choice === 'B' && <span className="text-sm text-slate-100">✓ Your Choice</span>}
                </div>
                <p className={myChoice?.choice === 'B' ? 'text-slate-100' : 'text-slate-800 dark:text-slate-100 transition-theme'}>
                  {gameState.currentQuestion.optionB}
                </p>
              </button>
            </div>
          </div>

          {/* Status indicator */}
          {myChoice && !bothChosen && (
            <div className="glass-light border-2 border-blue-300 dark:border-blue-700 text-slate-700 dark:text-slate-300 transition-theme px-4 py-3 rounded-xl text-center">
              ⏳ Waiting for your partner to choose...
            </div>
          )}

          {opponentChoice && !myChoice && (
            <div className="glass-light border-2 border-purple-300 dark:border-purple-700 text-slate-700 dark:text-slate-300 transition-theme px-4 py-3 rounded-xl text-center animate-pulse">
              🤔 Your partner is waiting for you!
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {!isFinished && gameState.config.mode === 'compatibility' && gameState.roundResults.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 transition-theme">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Matches</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 transition-theme">{gameState.matchCount}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Differences</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400 transition-theme">
              {gameState.roundResults.length - gameState.matchCount}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Compatibility</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400 transition-theme">{compatibilityPercentage}%</p>
          </div>
        </div>
      )}
    </div>
  );
};
