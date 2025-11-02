import {
  ThisOrThatGameState,
  ThisOrThatConfig,
  Player,
  ThisOrThatQuestion,
  ThisOrThatChoice,
  ThisOrThatRoundResult,
  QuestionCategory
} from '@gaming-hub/shared';
import { v4 as uuidv4 } from 'uuid';

// Question database with emojis
const QUESTIONS: Record<QuestionCategory, Omit<ThisOrThatQuestion, 'id'>[]> = {
  food: [
    { category: 'food', optionA: { emoji: '☕', text: 'Coffee' }, optionB: { emoji: '🍵', text: 'Tea' } },
    { category: 'food', optionA: { emoji: '🍕', text: 'Pizza' }, optionB: { emoji: '🍔', text: 'Burger' } },
    { category: 'food', optionA: { emoji: '🍦', text: 'Ice Cream' }, optionB: { emoji: '🍰', text: 'Cake' } },
    { category: 'food', optionA: { emoji: '🍫', text: 'Chocolate' }, optionB: { emoji: '🍬', text: 'Candy' } },
    { category: 'food', optionA: { emoji: '🌮', text: 'Tacos' }, optionB: { emoji: '🍜', text: 'Ramen' } },
    { category: 'food', optionA: { emoji: '🍎', text: 'Apple' }, optionB: { emoji: '🍌', text: 'Banana' } },
    { category: 'food', optionA: { emoji: '🥐', text: 'Croissant' }, optionB: { emoji: '🥯', text: 'Bagel' } },
    { category: 'food', optionA: { emoji: '🍗', text: 'Chicken' }, optionB: { emoji: '🥩', text: 'Steak' } },
    { category: 'food', optionA: { emoji: '🍣', text: 'Sushi' }, optionB: { emoji: '🍱', text: 'Bento' } },
    { category: 'food', optionA: { emoji: '🍪', text: 'Cookies' }, optionB: { emoji: '🧁', text: 'Cupcakes' } },
    { category: 'food', optionA: { emoji: '🥗', text: 'Salad' }, optionB: { emoji: '🥙', text: 'Wrap' } },
    { category: 'food', optionA: { emoji: '🍩', text: 'Donuts' }, optionB: { emoji: '🥞', text: 'Pancakes' } },
    { category: 'food', optionA: { emoji: '🌭', text: 'Hot Dog' }, optionB: { emoji: '🥪', text: 'Sandwich' } },
    { category: 'food', optionA: { emoji: '🍝', text: 'Pasta' }, optionB: { emoji: '🍚', text: 'Rice' } },
    { category: 'food', optionA: { emoji: '🧀', text: 'Cheese' }, optionB: { emoji: '🥓', text: 'Bacon' } },
    { category: 'food', optionA: { emoji: '🥤', text: 'Soda' }, optionB: { emoji: '🧃', text: 'Juice' } },
    { category: 'food', optionA: { emoji: '🍟', text: 'Fries' }, optionB: { emoji: '🍿', text: 'Popcorn' } },
    { category: 'food', optionA: { emoji: '🥑', text: 'Avocado' }, optionB: { emoji: '🥒', text: 'Cucumber' } },
    { category: 'food', optionA: { emoji: '🍓', text: 'Strawberry' }, optionB: { emoji: '🍇', text: 'Grapes' } },
    { category: 'food', optionA: { emoji: '🥛', text: 'Milk' }, optionB: { emoji: '🍷', text: 'Wine' } }
  ],
  travel: [
    { category: 'travel', optionA: { emoji: '🏖️', text: 'Beach' }, optionB: { emoji: '🏔️', text: 'Mountains' } },
    { category: 'travel', optionA: { emoji: '🌆', text: 'City' }, optionB: { emoji: '🌲', text: 'Nature' } },
    { category: 'travel', optionA: { emoji: '✈️', text: 'Plane' }, optionB: { emoji: '🚗', text: 'Car' } },
    { category: 'travel', optionA: { emoji: '🏨', text: 'Hotel' }, optionB: { emoji: '🏕️', text: 'Camping' } },
    { category: 'travel', optionA: { emoji: '🗼', text: 'Paris' }, optionB: { emoji: '🗽', text: 'New York' } },
    { category: 'travel', optionA: { emoji: '🌴', text: 'Tropical' }, optionB: { emoji: '❄️', text: 'Winter' } },
    { category: 'travel', optionA: { emoji: '🚢', text: 'Cruise' }, optionB: { emoji: '🚂', text: 'Train' } },
    { category: 'travel', optionA: { emoji: '🏰', text: 'Castle' }, optionB: { emoji: '🏛️', text: 'Museum' } },
    { category: 'travel', optionA: { emoji: '🎢', text: 'Theme Park' }, optionB: { emoji: '🏊', text: 'Water Park' } },
    { category: 'travel', optionA: { emoji: '🌅', text: 'Sunrise' }, optionB: { emoji: '🌇', text: 'Sunset' } },
    { category: 'travel', optionA: { emoji: '🏝️', text: 'Island' }, optionB: { emoji: '🏜️', text: 'Desert' } },
    { category: 'travel', optionA: { emoji: '🎡', text: 'Carnival' }, optionB: { emoji: '🎪', text: 'Circus' } },
    { category: 'travel', optionA: { emoji: '🏟️', text: 'Stadium' }, optionB: { emoji: '🎭', text: 'Theater' } },
    { category: 'travel', optionA: { emoji: '🌊', text: 'Ocean' }, optionB: { emoji: '🏞️', text: 'Lake' } },
    { category: 'travel', optionA: { emoji: '🚁', text: 'Helicopter' }, optionB: { emoji: '🛥️', text: 'Yacht' } },
    { category: 'travel', optionA: { emoji: '🗾', text: 'Japan' }, optionB: { emoji: '🏰', text: 'Europe' } },
    { category: 'travel', optionA: { emoji: '🏖️', text: 'Resort' }, optionB: { emoji: '🏔️', text: 'Cabin' } },
    { category: 'travel', optionA: { emoji: '🎿', text: 'Skiing' }, optionB: { emoji: '🏄', text: 'Surfing' } },
    { category: 'travel', optionA: { emoji: '🌃', text: 'Nightlife' }, optionB: { emoji: '🌄', text: 'Hiking' } },
    { category: 'travel', optionA: { emoji: '🚴', text: 'Biking' }, optionB: { emoji: '🏇', text: 'Horseback' } }
  ],
  lifestyle: [
    { category: 'lifestyle', optionA: { emoji: '🐶', text: 'Dog' }, optionB: { emoji: '🐱', text: 'Cat' } },
    { category: 'lifestyle', optionA: { emoji: '🌞', text: 'Morning' }, optionB: { emoji: '🌙', text: 'Night' } },
    { category: 'lifestyle', optionA: { emoji: '📱', text: 'Phone' }, optionB: { emoji: '💻', text: 'Laptop' } },
    { category: 'lifestyle', optionA: { emoji: '🎮', text: 'Gaming' }, optionB: { emoji: '📺', text: 'TV' } },
    { category: 'lifestyle', optionA: { emoji: '📚', text: 'Reading' }, optionB: { emoji: '🎵', text: 'Music' } },
    { category: 'lifestyle', optionA: { emoji: '☀️', text: 'Summer' }, optionB: { emoji: '❄️', text: 'Winter' } },
    { category: 'lifestyle', optionA: { emoji: '🏃', text: 'Running' }, optionB: { emoji: '🧘', text: 'Yoga' } },
    { category: 'lifestyle', optionA: { emoji: '🎨', text: 'Art' }, optionB: { emoji: '🎸', text: 'Music' } },
    { category: 'lifestyle', optionA: { emoji: '🌺', text: 'Spring' }, optionB: { emoji: '🍂', text: 'Fall' } },
    { category: 'lifestyle', optionA: { emoji: '🏠', text: 'Home' }, optionB: { emoji: '🏢', text: 'Office' } },
    { category: 'lifestyle', optionA: { emoji: '🎬', text: 'Movies' }, optionB: { emoji: '📖', text: 'Books' } },
    { category: 'lifestyle', optionA: { emoji: '🎤', text: 'Singing' }, optionB: { emoji: '💃', text: 'Dancing' } },
    { category: 'lifestyle', optionA: { emoji: '🏋️', text: 'Gym' }, optionB: { emoji: '🚴', text: 'Cycling' } },
    { category: 'lifestyle', optionA: { emoji: '🧩', text: 'Puzzles' }, optionB: { emoji: '🎲', text: 'Board Games' } },
    { category: 'lifestyle', optionA: { emoji: '🛍️', text: 'Shopping' }, optionB: { emoji: '🎪', text: 'Events' } },
    { category: 'lifestyle', optionA: { emoji: '🌃', text: 'City Life' }, optionB: { emoji: '🌾', text: 'Country Life' } },
    { category: 'lifestyle', optionA: { emoji: '🥳', text: 'Party' }, optionB: { emoji: '🧘', text: 'Relax' } },
    { category: 'lifestyle', optionA: { emoji: '🎯', text: 'Sports' }, optionB: { emoji: '🎨', text: 'Crafts' } },
    { category: 'lifestyle', optionA: { emoji: '🍳', text: 'Cooking' }, optionB: { emoji: '🍽️', text: 'Eating Out' } },
    { category: 'lifestyle', optionA: { emoji: '🎧', text: 'Podcasts' }, optionB: { emoji: '📰', text: 'News' } }
  ],
  deep: [
    { category: 'deep', optionA: { emoji: '❤️', text: 'Love' }, optionB: { emoji: '💰', text: 'Money' } },
    { category: 'deep', optionA: { emoji: '🧠', text: 'Intelligence' }, optionB: { emoji: '😊', text: 'Happiness' } },
    { category: 'deep', optionA: { emoji: '⏰', text: 'Time' }, optionB: { emoji: '💵', text: 'Wealth' } },
    { category: 'deep', optionA: { emoji: '🌟', text: 'Fame' }, optionB: { emoji: '🕊️', text: 'Peace' } },
    { category: 'deep', optionA: { emoji: '👨‍👩‍👧', text: 'Family' }, optionB: { emoji: '💼', text: 'Career' } },
    { category: 'deep', optionA: { emoji: '🎓', text: 'Knowledge' }, optionB: { emoji: '💪', text: 'Strength' } },
    { category: 'deep', optionA: { emoji: '🌍', text: 'Adventure' }, optionB: { emoji: '🏡', text: 'Stability' } },
    { category: 'deep', optionA: { emoji: '✨', text: 'Dreams' }, optionB: { emoji: '⚖️', text: 'Reality' } },
    { category: 'deep', optionA: { emoji: '🎭', text: 'Passion' }, optionB: { emoji: '🧘', text: 'Balance' } },
    { category: 'deep', optionA: { emoji: '🔮', text: 'Future' }, optionB: { emoji: '📜', text: 'Past' } },
    { category: 'deep', optionA: { emoji: '🤝', text: 'Trust' }, optionB: { emoji: '🔒', text: 'Privacy' } },
    { category: 'deep', optionA: { emoji: '🎯', text: 'Purpose' }, optionB: { emoji: '😌', text: 'Contentment' } },
    { category: 'deep', optionA: { emoji: '🌈', text: 'Hope' }, optionB: { emoji: '💎', text: 'Truth' } },
    { category: 'deep', optionA: { emoji: '🦸', text: 'Hero' }, optionB: { emoji: '🧙', text: 'Wisdom' } },
    { category: 'deep', optionA: { emoji: '💫', text: 'Magic' }, optionB: { emoji: '🔬', text: 'Science' } },
    { category: 'deep', optionA: { emoji: '🎪', text: 'Excitement' }, optionB: { emoji: '☮️', text: 'Calm' } },
    { category: 'deep', optionA: { emoji: '🌟', text: 'Success' }, optionB: { emoji: '💝', text: 'Kindness' } },
    { category: 'deep', optionA: { emoji: '🔥', text: 'Passion' }, optionB: { emoji: '❄️', text: 'Logic' } },
    { category: 'deep', optionA: { emoji: '🎨', text: 'Creativity' }, optionB: { emoji: '📊', text: 'Logic' } },
    { category: 'deep', optionA: { emoji: '🌱', text: 'Growth' }, optionB: { emoji: '🏆', text: 'Achievement' } }
  ],
  fun: [
    { category: 'fun', optionA: { emoji: '🦄', text: 'Unicorn' }, optionB: { emoji: '🐉', text: 'Dragon' } },
    { category: 'fun', optionA: { emoji: '🦸', text: 'Superhero' }, optionB: { emoji: '🧙', text: 'Wizard' } },
    { category: 'fun', optionA: { emoji: '🎃', text: 'Halloween' }, optionB: { emoji: '🎄', text: 'Christmas' } },
    { category: 'fun', optionA: { emoji: '🌙', text: 'Moon' }, optionB: { emoji: '⭐', text: 'Stars' } },
    { category: 'fun', optionA: { emoji: '🔥', text: 'Fire' }, optionB: { emoji: '💧', text: 'Water' } },
    { category: 'fun', optionA: { emoji: '⚡', text: 'Lightning' }, optionB: { emoji: '🌪️', text: 'Tornado' } },
    { category: 'fun', optionA: { emoji: '👻', text: 'Ghost' }, optionB: { emoji: '👽', text: 'Alien' } },
    { category: 'fun', optionA: { emoji: '🦖', text: 'Dinosaur' }, optionB: { emoji: '🦕', text: 'Brachiosaurus' } },
    { category: 'fun', optionA: { emoji: '🎪', text: 'Circus' }, optionB: { emoji: '🎡', text: 'Fair' } },
    { category: 'fun', optionA: { emoji: '🎭', text: 'Comedy' }, optionB: { emoji: '😱', text: 'Horror' } },
    { category: 'fun', optionA: { emoji: '🎸', text: 'Rock' }, optionB: { emoji: '🎹', text: 'Pop' } },
    { category: 'fun', optionA: { emoji: '🚀', text: 'Space' }, optionB: { emoji: '🌊', text: 'Ocean' } },
    { category: 'fun', optionA: { emoji: '🦁', text: 'Lion' }, optionB: { emoji: '🐯', text: 'Tiger' } },
    { category: 'fun', optionA: { emoji: '🍕', text: 'Pizza Party' }, optionB: { emoji: '🎂', text: 'Cake Party' } },
    { category: 'fun', optionA: { emoji: '🎮', text: 'Video Games' }, optionB: { emoji: '🎲', text: 'Board Games' } },
    { category: 'fun', optionA: { emoji: '🎰', text: 'Las Vegas' }, optionB: { emoji: '🏝️', text: 'Hawaii' } },
    { category: 'fun', optionA: { emoji: '🎬', text: 'Action' }, optionB: { emoji: '💑', text: 'Romance' } },
    { category: 'fun', optionA: { emoji: '🤖', text: 'Robot' }, optionB: { emoji: '👾', text: 'Video Game Character' } },
    { category: 'fun', optionA: { emoji: '🏴‍☠️', text: 'Pirate' }, optionB: { emoji: '🤠', text: 'Cowboy' } },
    { category: 'fun', optionA: { emoji: '🎉', text: 'Party' }, optionB: { emoji: '🎈', text: 'Balloon' } }
  ]
};

export class ThisOrThatGame {
  static initializeGame(players: Player[], config: ThisOrThatConfig): ThisOrThatGameState {
    const firstQuestion = this.getRandomQuestion(config.categories);

    return {
      config,
      currentRound: 1,
      currentQuestion: firstQuestion,
      choices: [],
      roundResults: [],
      matchCount: 0,
      questionStartTime: Date.now(),
      status: 'playing'
    };
  }

  static getRandomQuestion(categories: QuestionCategory[]): ThisOrThatQuestion {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryQuestions = QUESTIONS[randomCategory];
    const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];

    return {
      ...randomQuestion,
      id: uuidv4()
    };
  }

  static recordChoice(
    gameState: ThisOrThatGameState,
    playerId: string,
    playerName: string,
    choice: 'A' | 'B'
  ): { gameState: ThisOrThatGameState; choice: ThisOrThatChoice; bothChosen: boolean } {
    const existingChoiceIndex = gameState.choices.findIndex(c => c.playerId === playerId);

    const newChoice: ThisOrThatChoice = {
      playerId,
      playerName,
      choice,
      timestamp: Date.now()
    };

    let updatedChoices: ThisOrThatChoice[];

    if (existingChoiceIndex >= 0) {
      updatedChoices = [...gameState.choices];
      updatedChoices[existingChoiceIndex] = newChoice;
    } else {
      updatedChoices = [...gameState.choices, newChoice];
    }

    const updatedGameState = {
      ...gameState,
      choices: updatedChoices
    };

    const bothChosen = updatedChoices.length === 2;

    return {
      gameState: updatedGameState,
      choice: newChoice,
      bothChosen
    };
  }

  static completeRound(gameState: ThisOrThatGameState): { gameState: ThisOrThatGameState; roundResult: ThisOrThatRoundResult } {
    if (gameState.choices.length !== 2 || !gameState.currentQuestion) {
      throw new Error('Cannot complete round without both choices');
    }

    const isMatch = gameState.choices[0].choice === gameState.choices[1].choice;
    const timeElapsed = Math.round((Date.now() - gameState.questionStartTime) / 1000);

    const roundResult: ThisOrThatRoundResult = {
      round: gameState.currentRound,
      question: gameState.currentQuestion,
      choices: [...gameState.choices],
      isMatch,
      timeElapsed
    };

    const newMatchCount = gameState.matchCount + (isMatch ? 1 : 0);

    const updatedGameState = {
      ...gameState,
      roundResults: [...gameState.roundResults, roundResult],
      matchCount: newMatchCount
    };

    return {
      gameState: updatedGameState,
      roundResult
    };
  }

  static nextQuestion(gameState: ThisOrThatGameState): ThisOrThatGameState {
    const isGameFinished = gameState.currentRound >= gameState.config.maxRounds;

    if (isGameFinished) {
      return {
        ...gameState,
        currentQuestion: null,
        choices: [],
        status: 'finished'
      };
    }

    // Get next question (avoid repeating recent questions)
    const usedQuestionIds = new Set(gameState.roundResults.map(r => r.question.id));
    let nextQuestion: ThisOrThatQuestion;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      nextQuestion = this.getRandomQuestion(gameState.config.categories);
      attempts++;
    } while (usedQuestionIds.has(nextQuestion.id) && attempts < maxAttempts);

    return {
      ...gameState,
      currentRound: gameState.currentRound + 1,
      currentQuestion: nextQuestion,
      choices: [],
      questionStartTime: Date.now(),
      status: 'playing'
    };
  }

  static getCompatibilityPercentage(gameState: ThisOrThatGameState): number {
    if (gameState.roundResults.length === 0) return 0;
    return Math.round((gameState.matchCount / gameState.roundResults.length) * 100);
  }

  static getGameStats(gameState: ThisOrThatGameState) {
    return {
      totalRounds: gameState.roundResults.length,
      matches: gameState.matchCount,
      differences: gameState.roundResults.length - gameState.matchCount,
      compatibilityPercentage: this.getCompatibilityPercentage(gameState),
      averageTime: gameState.roundResults.length > 0
        ? Math.round(gameState.roundResults.reduce((sum, r) => sum + r.timeElapsed, 0) / gameState.roundResults.length)
        : 0
    };
  }
}
