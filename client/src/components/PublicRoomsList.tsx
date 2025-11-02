import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, PublicRoom, JoinRoomPayload } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';
import { savePlayerName, addRecentRoom } from '../utils/storage';

interface PublicRoomsListProps {
  playerName: string;
}

const GAME_EMOJIS: Record<string, string> = {
  'number-guessing': '🎯',
  'would-you-rather': '🤔',
  'this-or-that': '⚡',
  'tic-tac-toe': '⭕',
  'connect-4': '🔴',
  'rock-paper-scissors': '🪨',
  'hangman': '📝'
};

const GAME_NAMES: Record<string, string> = {
  'number-guessing': 'Number Guessing',
  'would-you-rather': 'Would You Rather',
  'this-or-that': 'This or That',
  'tic-tac-toe': 'Tic Tac Toe',
  'connect-4': 'Connect 4',
  'rock-paper-scissors': 'Rock Paper Scissors',
  'hangman': 'Hangman'
};

export const PublicRoomsList: React.FC<PublicRoomsListProps> = ({ playerName }) => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { setPlayerId, setRoom } = useGame();
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (socket && isConnected) {
      fetchPublicRooms();

      // Refresh list every 10 seconds
      const interval = setInterval(fetchPublicRooms, 10000);

      return () => clearInterval(interval);
    }
  }, [socket, isConnected]);

  const fetchPublicRooms = () => {
    if (!socket) return;

    setIsLoading(true);
    socket.emit(SocketEvents.GET_PUBLIC_ROOMS);

    socket.once(SocketEvents.PUBLIC_ROOMS_LIST, ({ rooms }: { rooms: PublicRoom[] }) => {
      setPublicRooms(rooms);
      setIsLoading(false);
    });

    socket.once(SocketEvents.ERROR, ({ message }: any) => {
      setError(message);
      setIsLoading(false);
    });
  };

  const handleJoinRoom = (roomId: string) => {
    if (!socket || !playerName.trim()) {
      setError('Please enter your name first');
      return;
    }

    setIsJoining(roomId);
    setError('');

    // Save player name
    savePlayerName(playerName.trim());

    const payload: JoinRoomPayload = {
      roomId,
      playerName: playerName.trim()
    };

    socket.emit(SocketEvents.JOIN_ROOM, payload);

    socket.once(SocketEvents.ROOM_JOINED, ({ room, playerId }: any) => {
      gameSounds.playJoin();
      setRoom(room);
      setPlayerId(playerId);
      addRecentRoom(roomId);
      navigate(`/room/${roomId}`);
    });

    socket.once(SocketEvents.ERROR, ({ message }: any) => {
      setError(message);
      setIsJoining(null);
    });
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">Connecting to server...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Public Rooms</h2>
        <button
          onClick={fetchPublicRooms}
          disabled={isLoading}
          className="px-4 py-2 glass-light rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:shadow-glass transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              Refreshing...
            </span>
          ) : (
            '🔄 Refresh'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 glass-light rounded-xl border-2 border-red-500 dark:border-red-400">
          <p className="text-red-700 dark:text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {publicRooms.length === 0 ? (
        <div className="text-center py-12 glass-light rounded-xl">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-slate-600 dark:text-slate-400 mb-2">No public rooms available</p>
          <p className="text-slate-500 dark:text-slate-500 text-sm">
            Create your own permanent room to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {publicRooms.map((room) => (
            <div
              key={room.id}
              className="glass-light rounded-xl p-6 hover:shadow-glass transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{GAME_EMOJIS[room.gameId] || '🎮'}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {room.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      by {room.ownerName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-1">
                    {room.playerCount}/{room.maxPlayers} players
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {GAME_NAMES[room.gameId] || room.gameId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleJoinRoom(room.id)}
                disabled={room.playerCount >= room.maxPlayers || isJoining === room.id || !playerName.trim()}
                className="w-full py-2 px-4 glass-heavy rounded-lg font-semibold text-white shadow-glow hover:shadow-glow-intense transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isJoining === room.id ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Joining...
                  </span>
                ) : room.playerCount >= room.maxPlayers ? (
                  'Room Full'
                ) : (
                  'Join Room'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
