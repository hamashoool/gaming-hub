import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, RPSGameState, RPSChoice, RPSPowerUpType } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';

export const RockPaperScissorsGame: React.FC = () => {
  const { socket } = useSocket();
  const { playerId, room, gameState: rawGameState } = useGame();
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<RPSChoice | null>(null);
  const [selectedPowerUp, setSelectedPowerUp] = useState<RPSPowerUpType | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const prevGameStateRef = useRef<RPSGameState | null>(null);

  const gameState = rawGameState as RPSGameState | null;

  // Play sounds based on game state changes
  useEffect(() => {
    if (!gameState || !soundsEnabled) return;

    const prevState = prevGameStateRef.current;

    // Play sound when round completes
    if (prevState && prevState.status === 'playing' && gameState.status === 'round_over') {
      const playerIndex = room?.players.findIndex(p => p.id === playerId) ?? -1;
      const player = playerIndex === 0 ? 'Player1' : 'Player2';

      const lastRound = gameState.roundResults[gameState.roundResults.length - 1];
      if (lastRound?.winner === player) {
        gameSounds.playWin();
      } else if (lastRound?.winner === 'draw') {
        gameSounds.playClick();
      } else {
        gameSounds.playLose();
      }
    }

    // Play sound when match is over
    if (prevState && prevState.status !== 'match_over' && gameState.status === 'match_over') {
      const playerIndex = room?.players.findIndex(p => p.id === playerId) ?? -1;
      const player = playerIndex === 0 ? 'Player1' : 'Player2';

      if (gameState.winner === player) {
        gameSounds.playWin();
      } else {
        gameSounds.playLose();
      }
    }

    // Reset submission state when moving to next round
    if (prevState && prevState.currentRound !== gameState.currentRound) {
      setHasSubmitted(false);
      setSelectedChoice(null);
      setSelectedPowerUp(null);
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
  const player = playerIndex === 0 ? 'Player1' : 'Player2';
  const playerName = room.players[playerIndex]?.name || 'You';
  const opponentName = room.players[1 - playerIndex]?.name || 'Opponent';

  const handleChoiceSelect = (choice: RPSChoice) => {
    if (hasSubmitted) return;
    setSelectedChoice(choice);
  };

  const handleSubmitChoice = () => {
    if (!selectedChoice || hasSubmitted || !socket) return;

    gameSounds.playClick();

    socket.emit(SocketEvents.RPS_SUBMIT_CHOICE, {
      roomId: room.id,
      playerId,
      choice: selectedChoice,
      powerUpType: selectedPowerUp
    });

    setHasSubmitted(true);
    setSelectedPowerUp(null);
  };

  const handlePowerUpClick = (powerUpType: RPSPowerUpType) => {
    if (hasSubmitted) return;

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

  const gamesNeededToWin = Math.ceil(gameState.config.bestOf / 2);
  const isMatchOver = gameState.status === 'match_over';

  const getChoiceEmoji = (choice: RPSChoice) => {
    switch (choice) {
      case 'rock': return '🪨';
      case 'paper': return '📄';
      case 'scissors': return '✂️';
      case 'lizard': return '🦎';
      case 'spock': return '🖖';
    }
  };

  const availableChoices: RPSChoice[] = gameState.config.variant === 'classic'
    ? ['rock', 'paper', 'scissors']
    : ['rock', 'paper', 'scissors', 'lizard', 'spock'];

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
          {isMatchOver ? '🏆 Tournament Complete!' : '🪨 Rock Paper Scissors'}
        </h2>
        <div className="flex justify-center gap-4 text-sm text-slate-600 dark:text-slate-400 transition-theme mb-2">
          <span>Round: {gameState.currentRound}/{gameState.config.bestOf}</span>
          <span>Variant: {gameState.config.variant === 'classic' ? 'Classic' : 'Extended (RPSLS)'}</span>
        </div>
      </div>

      {/* Match Score */}
      <div className="grid grid-cols-3 gap-4 py-4 glass-light rounded-xl">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">{playerName}</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 transition-theme">{gameState.matchScore[player]}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Draws</p>
          <p className="text-2xl font-bold text-slate-600 dark:text-slate-300 transition-theme">{gameState.matchScore.draws}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">{opponentName}</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 transition-theme">{gameState.matchScore[player === 'Player1' ? 'Player2' : 'Player1']}</p>
        </div>
      </div>

      {/* Match Over Screen */}
      {isMatchOver && (
        <div className="space-y-6">
          <div className="glass-heavy border-2 shadow-glow-green rounded-xl p-6 text-center">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme mb-4">
              {gameState.winner === player ? '🏆 You Win the Tournament!' : '😢 Opponent Wins the Tournament!'}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="glass-light rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Total Rounds</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 transition-theme">{gameState.roundResults.length}</p>
              </div>
              <div className="glass-light rounded-xl p-4">
                <p className="text-slate-600 dark:text-slate-400 transition-theme text-sm">Final Score</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-theme">
                  {gameState.matchScore.Player1} - {gameState.matchScore.Player2}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlayAgain}
            className="w-full bg-gradient-to-r from-green-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-orange-700 transition-all transform hover:scale-105"
          >
            🎮 New Tournament
          </button>
        </div>
      )}

      {/* Round Over Screen */}
      {gameState.status === 'round_over' && !isMatchOver && (
        <div className="space-y-4">
          <div className="glass-light border-2 rounded-xl p-6">
            {gameState.roundResults.length > 0 && (
              <>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 transition-theme text-center mb-4">Round {gameState.roundResults[gameState.roundResults.length - 1].roundNumber} Results</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 transition-theme mb-2">{playerName}</p>
                    <div className="text-6xl">{getChoiceEmoji(gameState.roundResults[gameState.roundResults.length - 1][player === 'Player1' ? 'player1Choice' : 'player2Choice'])}</div>
                  </div>
                  <div className="flex items-center justify-center text-2xl font-bold text-slate-700 dark:text-slate-300 transition-theme">VS</div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 transition-theme mb-2">{opponentName}</p>
                    <div className="text-6xl">{getChoiceEmoji(gameState.roundResults[gameState.roundResults.length - 1][player === 'Player1' ? 'player2Choice' : 'player1Choice'])}</div>
                  </div>
                </div>
                <div className={`text-center text-2xl font-bold p-4 rounded-xl transition-theme ${
                  gameState.roundResults[gameState.roundResults.length - 1].winner === player
                    ? 'bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : gameState.roundResults[gameState.roundResults.length - 1].winner === 'draw'
                    ? 'glass-light text-slate-800 dark:text-slate-100'
                    : 'bg-red-200 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
                  {gameState.roundResults[gameState.roundResults.length - 1].winner === player
                    ? '🎉 You Won!'
                    : gameState.roundResults[gameState.roundResults.length - 1].winner === 'draw'
                    ? '🤝 Draw!'
                    : '😢 You Lost!'}
                </div>
                <p className="text-center text-slate-600 dark:text-slate-400 transition-theme mt-4">
                  First to {gamesNeededToWin} wins the tournament
                </p>
              </>
            )}
          </div>
          <p className="text-center text-slate-600 dark:text-slate-400 transition-theme text-sm">Next round starting in 3 seconds...</p>
        </div>
      )}

      {/* Playing Screen */}
      {(gameState.status === 'waiting' || gameState.status === 'playing') && !hasSubmitted && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl text-center font-semibold glass-heavy border-2 shadow-glow-green text-slate-800 dark:text-slate-100 transition-theme">
            Make Your Choice
          </div>

          {/* Selected Power-Up Indicator */}
          {selectedPowerUp && (
            <div className="glass-light border-2 border-purple-400 dark:border-purple-500 p-3 rounded-xl text-center transition-theme">
              <p className="font-semibold text-purple-800 dark:text-purple-300 transition-theme">
                {selectedPowerUp === 'reveal' && '🔍 Reveal opponent choice (after they submit)'}
                {selectedPowerUp === 'shield' && '🛡️ Shield from loss (draw if you lose)'}
                {selectedPowerUp === 'double_points' && '⭐ Double points (if you win)'}
              </p>
              <button
                onClick={() => setSelectedPowerUp(null)}
                className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-theme"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Choice Buttons */}
          <div className={`grid gap-4 ${gameState.config.variant === 'classic' ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-5'}`}>
            {availableChoices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleChoiceSelect(choice)}
                className={`p-6 glass-light border-2 hover:glass-heavy shadow-glow rounded-xl transition-all ${
                  selectedChoice === choice
                    ? 'scale-110 border-yellow-400 dark:border-yellow-500 shadow-glow'
                    : 'border-transparent'
                } text-slate-800 dark:text-slate-100 font-bold`}
              >
                <div className="text-6xl mb-2">{getChoiceEmoji(choice)}</div>
                <div className="text-sm capitalize transition-theme">{choice}</div>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitChoice}
            disabled={!selectedChoice}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 disabled:glass-light disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-all"
          >
            {selectedChoice ? `Submit ${selectedChoice.toUpperCase()}` : 'Select a choice'}
          </button>

          {/* Power-Ups */}
          {gameState.config.powerUpsEnabled && availablePowerUps.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 transition-theme pt-4">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Your Power-Ups</h4>
              <div className="grid grid-cols-3 gap-2">
                {availablePowerUps.map((powerUp, index) => {
                  const powerUpType = powerUp.type as any as RPSPowerUpType;
                  return (
                    <button
                      key={index}
                      onClick={() => handlePowerUpClick(powerUpType)}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        selectedPowerUp === powerUpType
                          ? 'bg-purple-500 dark:bg-purple-600 border-purple-600 dark:border-purple-700 text-white scale-105'
                          : 'glass-light border-purple-300 dark:border-purple-600 text-purple-800 dark:text-purple-300 hover:glass-heavy'
                      }`}
                    >
                      {powerUpType === 'reveal' && '🔍 Reveal'}
                      {powerUpType === 'shield' && '🛡️ Shield'}
                      {powerUpType === 'double_points' && '⭐ 2x Points'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Waiting for Opponent */}
      {(gameState.status === 'waiting' || gameState.status === 'playing') && hasSubmitted && (
        <div className="space-y-6">
          <div className="p-8 rounded-xl text-center glass-light border-2 border-blue-500 dark:border-blue-400 transition-theme">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 transition-theme">Waiting for opponent...</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 transition-theme mt-2">Your choice has been submitted</p>
          </div>
        </div>
      )}

      {/* Round History */}
      {gameState.roundResults.length > 0 && !isMatchOver && gameState.status !== 'round_over' && (
        <div className="border-t border-slate-200 dark:border-slate-700 transition-theme pt-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 transition-theme mb-3">Round History</h4>
          <div className="grid grid-cols-4 gap-2">
            {gameState.roundResults.slice(-8).map((result) => (
              <div
                key={result.roundNumber}
                className={`p-2 rounded-xl text-center text-sm transition-theme ${
                  result.winner === player
                    ? 'glass-heavy border-2 shadow-glow-green text-slate-800 dark:text-slate-100'
                    : result.winner === 'draw'
                    ? 'glass-light border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    : 'glass-light border-2 border-red-300 dark:border-red-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold">R{result.roundNumber}</div>
                <div className="text-xs">
                  {result.winner === player ? 'Won' : result.winner === 'draw' ? 'Draw' : 'Lost'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
