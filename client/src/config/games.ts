export interface GameConfig {
  id: string;
  name: string;
  emoji: string;
  description?: string;
}

export const AVAILABLE_GAMES: GameConfig[] = [
  {
    id: 'number-guessing',
    name: 'Number Guessing',
    emoji: '🎯',
    description: 'Guess the secret number'
  },
  {
    id: 'would-you-rather',
    name: 'Would You Rather',
    emoji: '🤔',
    description: 'Choose between two scenarios'
  },
  {
    id: 'this-or-that',
    name: 'This or That',
    emoji: '⚡',
    description: 'Quick fire choices'
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    emoji: '⭕',
    description: 'Classic strategy game'
  },
  {
    id: 'connect-4',
    name: 'Connect 4',
    emoji: '🔴',
    description: 'Connect four in a row'
  },
  {
    id: 'rock-paper-scissors',
    name: 'Rock Paper Scissors',
    emoji: '🪨',
    description: 'Classic hand game'
  },
  {
    id: 'hangman',
    name: 'Hangman',
    emoji: '📝',
    description: 'Guess the word'
  }
];

export const getGameConfig = (gameId: string): GameConfig | undefined => {
  return AVAILABLE_GAMES.find(game => game.id === gameId);
};

export const getGameTitle = (gameId: string): string => {
  const config = getGameConfig(gameId);
  return config?.name || gameId;
};
