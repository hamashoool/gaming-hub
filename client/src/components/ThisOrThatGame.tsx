import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, ThisOrThatGameState, ThisOrThatRoundResult } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';

export const ThisOrThatGame: React.FC = () => {
  const { socket } = useSocket();
  const { playerId, room, gameState: rawGameState } = useGame();
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [latestResult, setLatestResult] = useState<ThisOrThatRoundResult | null>(null);
  const prevGameStateRef = useRef<ThisOrThatGameState | null>(null);

  const gameState = rawGameState as ThisOrThatGameState | null;

  // Play sounds based on game state changes
  useEffect(() => {
    if (!gameState || !soundsEnabled) return;

    const prevState = prevGameStateRef.current;

    // Play sound when game starts
    if (!prevState && gameState.status === 'playing') {
      gameSounds.playGameStart();
    }

    prevGameStateRef.current = gameState;
  }, [gameState, soundsEnabled]);

  // Sync sounds enabled state
  useEffect(() => {
    gameSounds.setSoundsEnabled(soundsEnabled);
  }, [soundsEnabled]);

  // Listen for round completion
  useEffect(() => {
    if (!socket) return;

    const handleRoundComplete = ({ roundResult }: { roundResult: ThisOrThatRoundResult }) => {
      setLatestResult(roundResult);
      setShowResult(true);

      // Play appropriate sound
      if (roundResult.isMatch) {
        gameSounds.playWin();
      } else {
        gameSounds.playClick();
      }

      // Hide result after 1.5 seconds (auto-advance happens at 2s)
      setTimeout(() => {
        setShowResult(false);
      }, 1500);
    };

    socket.on(SocketEvents.THIS_OR_THAT_ROUND_COMPLETE, handleRoundComplete);

    return () => {
      socket.off(SocketEvents.THIS_OR_THAT_ROUND_COMPLETE, handleRoundComplete);
    };
  }, [socket, soundsEnabled]);

  if (!gameState || !room || !playerId) {
    return null;
  }

  const handleChoiceClick = (choice: 'A' | 'B') => {
    if (gameState.status !== 'playing') return;
    if (gameState.choices.some(c => c.playerId === playerId)) return; // Already chose

    gameSounds.playClick();

    socket?.emit(SocketEvents.SUBMIT_THIS_OR_THAT_CHOICE, {
      roomId: room.id,
      playerId,
      choice
    });
  };

  const handlePlayAgain = () => {
    if (socket && room) {
      gameSounds.playClick();
      socket.emit(SocketEvents.PLAY_AGAIN, { roomId: room.id });
      setShowResult(false);
      setLatestResult(null);
    }
  };

  const toggleSounds = () => {
    setSoundsEnabled(!soundsEnabled);
    gameSounds.playClick();
  };

  const myChoice = gameState.choices.find(c => c.playerId === playerId);
  const opponentChoice = gameState.choices.find(c => c.playerId !== playerId);
  const isFinished = gameState.status === 'finished';
  const bothChosen = gameState.choices.length === 2;

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
          {isFinished ? '🎉 Game Finished!' : '⚡ This or That'}
        </h2>
        <div className="flex justify-center gap-4 text-sm text-slate-600 dark:text-slate-300 transition-theme">
          <span>Round: {gameState.currentRound}/{gameState.config.maxRounds}</span>
          <span>Matches: {gameState.matchCount}</span>
          <span>Compatibility: {compatibilityPercentage}%</span>
        </div>
      </div>

      {/* Game Finished Screen */}
      {isFinished && (
        <div className="space-y-6">
          <div className="glass-light border-2 border-yellow-300 dark:border-yellow-500 rounded-2xl p-6 text-center shadow-glow">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme mb-4">⚡ Lightning Round Complete!</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="glass rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-300 transition-theme text-sm">Total Matches</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 transition-theme">{gameState.matchCount}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-300 transition-theme text-sm">Differences</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 transition-theme">
                  {gameState.roundResults.length - gameState.matchCount}
                </p>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-slate-600 dark:text-slate-300 transition-theme text-sm mb-2">Compatibility Score</p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex-1 glass-light rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${compatibilityPercentage}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400 transition-theme">{compatibilityPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Previous Rounds Summary */}
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {gameState.roundResults.map((result) => (
                <div
                  key={result.round}
                  className={`p-2 rounded-xl border-2 text-center text-xs ${
                    result.isMatch ? 'glass-light border-green-300 dark:border-green-500' : 'glass-light border-orange-300 dark:border-orange-500'
                  }`}
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-100 transition-theme">
                    Round {result.round}: {result.isMatch ? '✅' : '❌'}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 transition-theme">{result.timeElapsed.toFixed(1)}s</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePlayAgain}
            className="w-full glass-heavy shadow-glow hover:shadow-glow-blue text-slate-100 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            ⚡ Play Again
          </button>
        </div>
      )}

      {/* Result Popup */}
      {showResult && latestResult && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 animate-fadeIn">
          <div className={`p-8 rounded-2xl text-center border-4 transform scale-110 ${
            latestResult.isMatch
              ? 'bg-green-400 border-green-600 text-white'
              : 'bg-orange-400 border-orange-600 text-white'
          }`}>
            <p className="text-4xl font-bold mb-2">
              {latestResult.isMatch ? '✅ MATCH!' : '❌ DIFFERENT'}
            </p>
            <p className="text-xl">
              {latestResult.timeElapsed.toFixed(1)}s
            </p>
          </div>
        </div>
      )}

      {/* Playing Screen */}
      {gameState.status === 'playing' && gameState.currentQuestion && (
        <div className="space-y-6">
          <div className="glass-light rounded-2xl p-6 shadow-glow">
            <p className="text-center text-sm text-slate-600 dark:text-slate-300 transition-theme mb-2">
              Category: <span className="font-semibold capitalize">{gameState.currentQuestion.category}</span>
            </p>
            <p className="text-center text-lg font-medium text-slate-800 dark:text-slate-100 transition-theme mb-6">
              Which do you prefer?
            </p>

            <div className="grid grid-cols-2 gap-6">
              {/* Option A */}
              <button
                onClick={() => handleChoiceClick('A')}
                disabled={!!myChoice}
                className={`p-8 rounded-xl border-2 text-center transition-all transform ${
                  myChoice?.choice === 'A'
                    ? 'bg-yellow-500 border-yellow-600 text-white scale-105 shadow-glow'
                    : 'glass-light hover:glass-heavy shadow-glow border-yellow-300 dark:border-yellow-500 hover:border-yellow-500 dark:hover:border-yellow-400 hover:scale-105'
                } ${myChoice && myChoice.choice !== 'A' ? 'opacity-50' : ''}`}
              >
                <div className="text-6xl mb-3">{gameState.currentQuestion.optionA.emoji}</div>
                <div className={`text-xl font-bold transition-theme ${myChoice?.choice === 'A' ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                  {gameState.currentQuestion.optionA.text}
                </div>
                {myChoice?.choice === 'A' && (
                  <div className="mt-2 text-sm">✓ Your Choice</div>
                )}
              </button>

              {/* Option B */}
              <button
                onClick={() => handleChoiceClick('B')}
                disabled={!!myChoice}
                className={`p-8 rounded-xl border-2 text-center transition-all transform ${
                  myChoice?.choice === 'B'
                    ? 'bg-orange-500 border-orange-600 text-white scale-105 shadow-glow'
                    : 'glass-light hover:glass-heavy shadow-glow border-orange-300 dark:border-orange-500 hover:border-orange-500 dark:hover:border-orange-400 hover:scale-105'
                } ${myChoice && myChoice.choice !== 'B' ? 'opacity-50' : ''}`}
              >
                <div className="text-6xl mb-3">{gameState.currentQuestion.optionB.emoji}</div>
                <div className={`text-xl font-bold transition-theme ${myChoice?.choice === 'B' ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                  {gameState.currentQuestion.optionB.text}
                </div>
                {myChoice?.choice === 'B' && (
                  <div className="mt-2 text-sm">✓ Your Choice</div>
                )}
              </button>
            </div>
          </div>

          {/* Status indicator */}
          {myChoice && !bothChosen && (
            <div className="glass-light border border-blue-300 dark:border-blue-500 text-blue-700 dark:text-blue-300 transition-theme px-4 py-3 rounded-xl text-center animate-pulse">
              ⏳ Waiting for your partner...
            </div>
          )}

          {opponentChoice && !myChoice && (
            <div className="glass-light border border-orange-300 dark:border-orange-500 text-orange-700 dark:text-orange-300 transition-theme px-4 py-3 rounded-xl text-center animate-pulse">
              ⚡ Quick! Your partner is waiting!
            </div>
          )}
        </div>
      )}

      {/* Live Stats */}
      {!isFinished && gameState.roundResults.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 transition-theme">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 transition-theme text-sm">Matches</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 transition-theme">{gameState.matchCount}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 transition-theme text-sm">Differences</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400 transition-theme">
              {gameState.roundResults.length - gameState.matchCount}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-300 transition-theme text-sm">Avg Time</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 transition-theme">
              {(gameState.roundResults.reduce((sum, r) => sum + r.timeElapsed, 0) / gameState.roundResults.length).toFixed(1)}s
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
