import React, { createContext, useContext, useState, useEffect } from 'react';
import { Room, Player, NumberGuessingGameState, SocketEvents } from '@gaming-hub/shared';
import { useSocket } from './SocketContext';

interface GameContextType {
  playerId: string | null;
  room: Room | null;
  gameState: NumberGuessingGameState | null;
  setPlayerId: (id: string) => void;
  setRoom: (room: Room) => void;
  setGameState: (state: NumberGuessingGameState | null) => void;
  leaveRoom: () => void;
}

const GameContext = createContext<GameContextType>({
  playerId: null,
  room: null,
  gameState: null,
  setPlayerId: () => {},
  setRoom: () => {},
  setGameState: () => {},
  leaveRoom: () => {}
});

export const useGame = () => useContext(GameContext);

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const { socket } = useSocket();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<NumberGuessingGameState | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for room updates
    socket.on(SocketEvents.ROOM_UPDATED, (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    socket.on(SocketEvents.PLAYER_JOINED, ({ room: updatedRoom }: { player: Player; room: Room }) => {
      setRoom(updatedRoom);
    });

    socket.on(SocketEvents.PLAYER_LEFT, ({ room: updatedRoom }: { playerId: string; room: Room }) => {
      setRoom(updatedRoom);
    });

    socket.on(SocketEvents.GAME_STARTED, ({ room: updatedRoom, gameState: newGameState }: any) => {
      setRoom(updatedRoom);
      setGameState(newGameState);
    });

    socket.on(SocketEvents.GUESS_RESULT, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.TURN_CHANGED, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.GAME_FINISHED, ({ gameState: finalGameState }: any) => {
      setGameState(finalGameState);
    });

    socket.on(SocketEvents.GAME_RESET, ({ room: updatedRoom, gameState: resetGameState }: any) => {
      setRoom(updatedRoom);
      setGameState(resetGameState);
    });

    // Would You Rather events
    socket.on(SocketEvents.CHOICE_SUBMITTED, ({ choice }: any) => {
      // Optional: Could show a toast notification
      console.log('Choice submitted:', choice);
    });

    socket.on(SocketEvents.CHOICES_REVEALED, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.NEXT_QUESTION, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    // This or That events
    socket.on(SocketEvents.THIS_OR_THAT_CHOICE_SUBMITTED, ({ choice }: any) => {
      // Optional: Could show a toast notification
      console.log('This or That choice submitted:', choice);
    });

    socket.on(SocketEvents.THIS_OR_THAT_ROUND_COMPLETE, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.THIS_OR_THAT_AUTO_NEXT, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    // Tic Tac Toe events
    socket.on(SocketEvents.MOVE_MADE, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.POWER_UP_USED, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.TIC_TAC_TOE_GAME_OVER, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.MATCH_OVER, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    // Game switching events
    socket.on(SocketEvents.GAME_CHANGED, ({ room: updatedRoom }: any) => {
      setRoom(updatedRoom);
      setGameState(null); // Clear game state when switching games
    });

    // Connect 4 events
    socket.on(SocketEvents.CONNECT_4_MOVE_MADE, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.CONNECT_4_GAME_OVER, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    // Rock Paper Scissors events
    socket.on(SocketEvents.RPS_CHOICE_SUBMITTED, ({ choice }: any) => {
      // Optional: Could show a toast notification
      console.log('RPS choice submitted:', choice);
    });

    socket.on(SocketEvents.RPS_ROUND_COMPLETE, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.RPS_MATCH_OVER, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    // Hangman events
    socket.on(SocketEvents.HANGMAN_WORD_SET, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.HANGMAN_LETTER_GUESSED, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    socket.on(SocketEvents.HANGMAN_GAME_OVER, ({ gameState: updatedGameState }: any) => {
      setGameState(updatedGameState);
    });

    return () => {
      socket.off(SocketEvents.ROOM_UPDATED);
      socket.off(SocketEvents.PLAYER_JOINED);
      socket.off(SocketEvents.PLAYER_LEFT);
      socket.off(SocketEvents.GAME_STARTED);
      socket.off(SocketEvents.GUESS_RESULT);
      socket.off(SocketEvents.TURN_CHANGED);
      socket.off(SocketEvents.GAME_FINISHED);
      socket.off(SocketEvents.GAME_RESET);
      socket.off(SocketEvents.CHOICE_SUBMITTED);
      socket.off(SocketEvents.CHOICES_REVEALED);
      socket.off(SocketEvents.NEXT_QUESTION);
      socket.off(SocketEvents.THIS_OR_THAT_CHOICE_SUBMITTED);
      socket.off(SocketEvents.THIS_OR_THAT_ROUND_COMPLETE);
      socket.off(SocketEvents.THIS_OR_THAT_AUTO_NEXT);
      socket.off(SocketEvents.MOVE_MADE);
      socket.off(SocketEvents.POWER_UP_USED);
      socket.off(SocketEvents.TIC_TAC_TOE_GAME_OVER);
      socket.off(SocketEvents.MATCH_OVER);
      socket.off(SocketEvents.GAME_CHANGED);
      socket.off(SocketEvents.CONNECT_4_MOVE_MADE);
      socket.off(SocketEvents.CONNECT_4_GAME_OVER);
      socket.off(SocketEvents.RPS_CHOICE_SUBMITTED);
      socket.off(SocketEvents.RPS_ROUND_COMPLETE);
      socket.off(SocketEvents.RPS_MATCH_OVER);
      socket.off(SocketEvents.HANGMAN_WORD_SET);
      socket.off(SocketEvents.HANGMAN_LETTER_GUESSED);
      socket.off(SocketEvents.HANGMAN_GAME_OVER);
    };
  }, [socket]);

  const leaveRoom = () => {
    if (socket && room && playerId) {
      socket.emit(SocketEvents.LEAVE_ROOM, { roomId: room.id, playerId });
      setRoom(null);
      setGameState(null);
    }
  };

  return (
    <GameContext.Provider
      value={{
        playerId,
        room,
        gameState,
        setPlayerId,
        setRoom,
        setGameState,
        leaveRoom
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
