import {
  WouldYouRatherGameState,
  WouldYouRatherConfig,
  Player,
  Question,
  Choice,
  RoundResult,
  QuestionCategory
} from '@gaming-hub/shared';
import { v4 as uuidv4 } from 'uuid';

// Question database organized by category
const QUESTIONS: Record<QuestionCategory, Omit<Question, 'id'>[]> = {
  food: [
    { category: 'food', optionA: 'Never eat pizza again', optionB: 'Never eat burgers again' },
    { category: 'food', optionA: 'Only eat sweet food', optionB: 'Only eat savory food' },
    { category: 'food', optionA: 'Give up chocolate forever', optionB: 'Give up cheese forever' },
    { category: 'food', optionA: 'Eat only breakfast foods', optionB: 'Eat only dinner foods' },
    { category: 'food', optionA: 'Never eat dessert again', optionB: 'Never eat appetizers again' },
    { category: 'food', optionA: 'Only drink water', optionB: 'Only drink juice' },
    { category: 'food', optionA: 'Eat sushi every day', optionB: 'Eat tacos every day' },
    { category: 'food', optionA: 'Have unlimited free coffee', optionB: 'Have unlimited free ice cream' },
    { category: 'food', optionA: 'Cook all your meals', optionB: 'Never cook again (but eat out)' },
    { category: 'food', optionA: 'Only eat cold food', optionB: 'Only eat hot food' },
    { category: 'food', optionA: 'Give up pasta', optionB: 'Give up bread' },
    { category: 'food', optionA: 'Eat only spicy food', optionB: 'Eat only bland food' },
    { category: 'food', optionA: 'Have breakfast for every meal', optionB: 'Have pizza for every meal' },
    { category: 'food', optionA: 'Never eat fruits', optionB: 'Never eat vegetables' },
    { category: 'food', optionA: 'Only eat food you can eat with your hands', optionB: 'Only eat food that requires utensils' },
    { category: 'food', optionA: 'Give up all fried food', optionB: 'Give up all baked goods' },
    { category: 'food', optionA: 'Only eat at restaurants', optionB: 'Only eat home-cooked meals' },
    { category: 'food', optionA: 'Have a personal chef', optionB: 'Never have to pay for food again' },
    { category: 'food', optionA: 'Only eat crunchy foods', optionB: 'Only eat soft foods' },
    { category: 'food', optionA: 'Give up wine', optionB: 'Give up beer' }
  ],
  travel: [
    { category: 'travel', optionA: 'Travel to the past', optionB: 'Travel to the future' },
    { category: 'travel', optionA: 'Visit every country once', optionB: 'Visit your favorite country unlimited times' },
    { category: 'travel', optionA: 'Beach vacation', optionB: 'Mountain vacation' },
    { category: 'travel', optionA: 'Travel alone', optionB: 'Travel with a group' },
    { category: 'travel', optionA: 'Luxury hotel', optionB: 'Authentic local experience' },
    { category: 'travel', optionA: 'Road trip across your country', optionB: 'Flight to another continent' },
    { category: 'travel', optionA: 'Explore cities', optionB: 'Explore nature' },
    { category: 'travel', optionA: 'Live by the ocean', optionB: 'Live in the mountains' },
    { category: 'travel', optionA: 'Free flights for life', optionB: 'Free hotels for life' },
    { category: 'travel', optionA: 'Visit space', optionB: 'Explore the deep ocean' },
    { category: 'travel', optionA: 'Backpack through Europe', optionB: 'Island hop in Southeast Asia' },
    { category: 'travel', optionA: 'Safari in Africa', optionB: 'Northern lights in Iceland' },
    { category: 'travel', optionA: 'Summer vacation only', optionB: 'Winter vacation only' },
    { category: 'travel', optionA: 'Travel with unlimited money but limited time', optionB: 'Unlimited time but limited money' },
    { category: 'travel', optionA: 'Never leave your country', optionB: 'Never return to your country' },
    { category: 'travel', optionA: 'Cruise ship vacation', optionB: 'All-inclusive resort' },
    { category: 'travel', optionA: 'Visit historical sites', optionB: 'Experience adventure activities' },
    { category: 'travel', optionA: 'Stay in one amazing place for a month', optionB: 'Visit 10 different places for 3 days each' },
    { category: 'travel', optionA: 'Travel back to ancient Rome', optionB: 'Travel to Mars in the future' },
    { category: 'travel', optionA: 'Own an RV and travel forever', optionB: 'Have a dream house in one perfect location' }
  ],
  lifestyle: [
    { category: 'lifestyle', optionA: 'Live in a big city', optionB: 'Live in a small town' },
    { category: 'lifestyle', optionA: 'Be a morning person', optionB: 'Be a night owl' },
    { category: 'lifestyle', optionA: 'Work from home', optionB: 'Work in an office' },
    { category: 'lifestyle', optionA: 'Have a dog', optionB: 'Have a cat' },
    { category: 'lifestyle', optionA: 'Live without internet', optionB: 'Live without air conditioning' },
    { category: 'lifestyle', optionA: 'Read minds', optionB: 'Be invisible' },
    { category: 'lifestyle', optionA: 'Never use social media', optionB: 'Never watch TV/movies' },
    { category: 'lifestyle', optionA: 'Have more time', optionB: 'Have more money' },
    { category: 'lifestyle', optionA: 'Always be 10 minutes late', optionB: 'Always be 20 minutes early' },
    { category: 'lifestyle', optionA: 'Lose the ability to lie', optionB: 'Lose the ability to tell truth' },
    { category: 'lifestyle', optionA: 'Be able to speak every language', optionB: 'Be able to play every instrument' },
    { category: 'lifestyle', optionA: 'Live without music', optionB: 'Live without movies' },
    { category: 'lifestyle', optionA: 'Have a rewind button for life', optionB: 'Have a pause button for life' },
    { category: 'lifestyle', optionA: 'Give up your smartphone', optionB: 'Give up your computer' },
    { category: 'lifestyle', optionA: 'Work 4 days/week with less pay', optionB: 'Work 6 days/week with more pay' },
    { category: 'lifestyle', optionA: 'Always know what people think of you', optionB: 'Never know what people think of you' },
    { category: 'lifestyle', optionA: 'Be famous', optionB: 'Be the best friend of someone famous' },
    { category: 'lifestyle', optionA: 'Have a photographic memory', optionB: 'Never forget a face' },
    { category: 'lifestyle', optionA: 'Be stuck on a broken ski lift', optionB: 'Be stuck in a broken elevator' },
    { category: 'lifestyle', optionA: 'Live in an apartment in the city', optionB: 'Live in a house in the suburbs' }
  ],
  deep: [
    { category: 'deep', optionA: 'Know how you will die', optionB: 'Know when you will die' },
    { category: 'deep', optionA: 'Be loved', optionB: 'Be feared' },
    { category: 'deep', optionA: 'Be rich with no friends', optionB: 'Be poor with great friends' },
    { category: 'deep', optionA: 'Lose all your memories', optionB: 'Never make new memories' },
    { category: 'deep', optionA: 'Know all the mysteries of the universe', optionB: 'Know every outcome of your choices' },
    { category: 'deep', optionA: 'Be able to change the past', optionB: 'Be able to see the future' },
    { category: 'deep', optionA: 'Save one person you love', optionB: 'Save 100 strangers' },
    { category: 'deep', optionA: 'Live forever alone', optionB: 'Live a normal life with loved ones' },
    { category: 'deep', optionA: 'Be remembered for one great thing', optionB: 'Be forgotten but live happily' },
    { category: 'deep', optionA: 'Have the ability to end world hunger', optionB: 'Have the ability to end all wars' },
    { category: 'deep', optionA: 'Relive your best day forever', optionB: 'Experience a new amazing day once' },
    { category: 'deep', optionA: 'Die saving someone', optionB: 'Live knowing you could have saved them' },
    { category: 'deep', optionA: 'Be intelligent but unhappy', optionB: 'Be less intelligent but happy' },
    { category: 'deep', optionA: 'Have true love but be poor', optionB: 'Be wealthy but never find love' },
    { category: 'deep', optionA: 'Know the absolute truth', optionB: 'Live in blissful ignorance' },
    { category: 'deep', optionA: 'Be the most attractive person', optionB: 'Be the most intelligent person' },
    { category: 'deep', optionA: 'Have world peace for 100 years', optionB: 'End poverty forever' },
    { category: 'deep', optionA: 'Sacrifice yourself for humanity', optionB: 'Let humanity figure it out' },
    { category: 'deep', optionA: 'Live a safe boring life', optionB: 'Live a short exciting life' },
    { category: 'deep', optionA: 'Be able to undo one mistake', optionB: 'Be able to prevent one future mistake' }
  ],
  fun: [
    { category: 'fun', optionA: 'Have the ability to fly', optionB: 'Have the ability to be invisible' },
    { category: 'fun', optionA: 'Fight one horse-sized duck', optionB: 'Fight 100 duck-sized horses' },
    { category: 'fun', optionA: 'Have a third eye', optionB: 'Have a third arm' },
    { category: 'fun', optionA: 'Speak to animals', optionB: 'Speak all human languages' },
    { category: 'fun', optionA: 'Live in a tree house', optionB: 'Live in a boat house' },
    { category: 'fun', optionA: 'Have a dinosaur as a pet', optionB: 'Have a dragon as a pet' },
    { category: 'fun', optionA: 'Sneeze glitter', optionB: 'Cry confetti' },
    { category: 'fun', optionA: 'Sweat maple syrup', optionB: 'Have spaghetti for hair' },
    { category: 'fun', optionA: 'Be Batman', optionB: 'Be Iron Man' },
    { category: 'fun', optionA: 'Live in a video game', optionB: 'Live in a movie' },
    { category: 'fun', optionA: 'Have a personal robot', optionB: 'Have a personal clone' },
    { category: 'fun', optionA: 'Control fire', optionB: 'Control water' },
    { category: 'fun', optionA: 'Be a superhero', optionB: 'Be a wizard' },
    { category: 'fun', optionA: 'Have telekinesis', optionB: 'Have super speed' },
    { category: 'fun', optionA: 'Live in Star Wars universe', optionB: 'Live in Harry Potter universe' },
    { category: 'fun', optionA: 'Have a time machine', optionB: 'Have a teleporter' },
    { category: 'fun', optionA: 'Ride a unicorn', optionB: 'Ride a pegasus' },
    { category: 'fun', optionA: 'Have X-ray vision', optionB: 'Have super hearing' },
    { category: 'fun', optionA: 'Be able to shrink', optionB: 'Be able to grow giant' },
    { category: 'fun', optionA: 'Live in a castle', optionB: 'Live on a private island' }
  ]
};

export class WouldYouRatherGame {
  // Initialize a new game with configuration
  static initializeGame(players: Player[], config: WouldYouRatherConfig): WouldYouRatherGameState {
    const firstQuestion = this.getRandomQuestion(config.categories);

    return {
      config,
      currentRound: 1,
      currentQuestion: firstQuestion,
      choices: [],
      roundResults: [],
      matchCount: 0,
      status: 'playing'
    };
  }

  // Get a random question from selected categories
  static getRandomQuestion(categories: QuestionCategory[]): Question {
    // Pick a random category from the selected ones
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    // Get all questions from that category
    const categoryQuestions = QUESTIONS[randomCategory];

    // Pick a random question
    const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];

    // Return with unique ID
    return {
      ...randomQuestion,
      id: uuidv4()
    };
  }

  // Record a player's choice
  static recordChoice(
    gameState: WouldYouRatherGameState,
    playerId: string,
    playerName: string,
    choice: 'A' | 'B'
  ): { gameState: WouldYouRatherGameState; choice: Choice; bothChosen: boolean } {
    // Check if player already chose for this question
    const existingChoiceIndex = gameState.choices.findIndex(c => c.playerId === playerId);

    const newChoice: Choice = {
      playerId,
      playerName,
      choice,
      timestamp: Date.now()
    };

    let updatedChoices: Choice[];

    if (existingChoiceIndex >= 0) {
      // Update existing choice
      updatedChoices = [...gameState.choices];
      updatedChoices[existingChoiceIndex] = newChoice;
    } else {
      // Add new choice
      updatedChoices = [...gameState.choices, newChoice];
    }

    const updatedGameState = {
      ...gameState,
      choices: updatedChoices
    };

    // Check if both players have chosen
    const bothChosen = updatedChoices.length === 2;

    return {
      gameState: updatedGameState,
      choice: newChoice,
      bothChosen
    };
  }

  // Process round results when both players have chosen
  static processRoundResults(
    gameState: WouldYouRatherGameState
  ): { gameState: WouldYouRatherGameState; roundResult: RoundResult } {
    if (gameState.choices.length !== 2 || !gameState.currentQuestion) {
      throw new Error('Cannot process round results without both choices');
    }

    // Check if choices match
    const isMatch = gameState.choices[0].choice === gameState.choices[1].choice;

    const roundResult: RoundResult = {
      round: gameState.currentRound,
      question: gameState.currentQuestion,
      choices: [...gameState.choices],
      isMatch
    };

    const newMatchCount = gameState.matchCount + (isMatch ? 1 : 0);

    const updatedGameState = {
      ...gameState,
      roundResults: [...gameState.roundResults, roundResult],
      matchCount: newMatchCount,
      status: 'revealing' as const
    };

    return {
      gameState: updatedGameState,
      roundResult
    };
  }

  // Move to next question
  static nextQuestion(gameState: WouldYouRatherGameState): WouldYouRatherGameState {
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
    let nextQuestion: Question;
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
      status: 'playing'
    };
  }

  // Calculate compatibility percentage
  static getCompatibilityPercentage(gameState: WouldYouRatherGameState): number {
    if (gameState.roundResults.length === 0) return 0;
    return Math.round((gameState.matchCount / gameState.roundResults.length) * 100);
  }

  // Get game statistics
  static getGameStats(gameState: WouldYouRatherGameState) {
    return {
      totalRounds: gameState.roundResults.length,
      matches: gameState.matchCount,
      differences: gameState.roundResults.length - gameState.matchCount,
      compatibilityPercentage: this.getCompatibilityPercentage(gameState)
    };
  }

  // Check if game is finished
  static isGameFinished(gameState: WouldYouRatherGameState): boolean {
    return gameState.status === 'finished';
  }
}
