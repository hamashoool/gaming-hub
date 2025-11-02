import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, CreatePermanentRoomPayload, Room } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';
import { AVAILABLE_GAMES } from '../config/games';

export const MyRoom: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  const { setPlayerId, setRoom } = useGame();
  const [myRoom, setMyRoom] = useState<Room | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Form states for creating room
  const [roomName, setRoomName] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('this-or-that');

  useEffect(() => {
    if (socket && isConnected && isAuthenticated) {
      fetchMyRoom();
    }
  }, [socket, isConnected, isAuthenticated]);

  const fetchMyRoom = () => {
    if (!socket) return;

    setIsLoading(true);
    socket.emit(SocketEvents.GET_MY_ROOM);

    socket.once(SocketEvents.MY_ROOM_DATA, ({ room, playerId }: any) => {
      if (room) {
        setMyRoom(room);
        setMyPlayerId(playerId);
      } else {
        setMyRoom(null);
        setMyPlayerId(null);
      }
      setIsLoading(false);
    });

    socket.once(SocketEvents.ERROR, ({ message }: any) => {
      setError(message);
      setIsLoading(false);
    });
  };

  const handleCreateRoom = () => {
    if (!socket || !user) return;

    if (!roomName.trim()) {
      setError('Please enter a room name');
      return;
    }

    setIsCreating(true);
    setError('');

    const payload: CreatePermanentRoomPayload = {
      name: roomName.trim(),
      gameId: selectedGameId,
      maxPlayers: 8
    };

    socket.emit(SocketEvents.CREATE_PERMANENT_ROOM, payload);

    socket.once(SocketEvents.ROOM_CREATED, ({ room, playerId }: any) => {
      gameSounds.create.play().catch(() => {});
      setMyRoom(room);
      setMyPlayerId(playerId);

      // Update context state first, then navigate
      setRoom(room);
      setPlayerId(playerId);

      // Use setTimeout to ensure state updates have completed before navigation
      setTimeout(() => {
        setIsCreating(false);
        navigate(`/room/${room.id}`);
      }, 0);
    });

    socket.once(SocketEvents.ERROR, ({ message }: any) => {
      setError(message);
      setIsCreating(false);
    });
  };

  const handleEnterRoom = () => {
    if (!myRoom || !myPlayerId) return;

    setRoom(myRoom);
    setPlayerId(myPlayerId);
    navigate(`/room/${myRoom.id}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12 glass-light rounded-xl">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Authentication Required
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          You need to log in to create and manage your permanent room
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/login"
            className="px-6 py-3 glass-heavy rounded-xl font-semibold text-white shadow-glow hover:shadow-glow-intense transition-all transform hover:scale-105"
          >
            Log In
          </a>
          <a
            href="/signup"
            className="px-6 py-3 glass-light rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:shadow-glass transition-all transform hover:scale-105"
          >
            Sign Up
          </a>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">Connecting to server...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading your room...</p>
      </div>
    );
  }

  if (myRoom) {
    const gameOption = AVAILABLE_GAMES.find(g => g.id === myRoom.gameId);

    return (
      <div className="space-y-6">
        <div className="glass-light rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">{gameOption?.emoji || '🎮'}</div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {myRoom.name}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your Permanent Room
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Active
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {myRoom.players.length}/{myRoom.maxPlayers} players
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 glass rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Current Game</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {gameOption?.name || myRoom.gameId}
              </p>
            </div>

            <div className="p-3 glass rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Room Code</p>
              <p className="text-lg font-mono font-bold text-purple-600 dark:text-purple-400">
                {myRoom.id}
              </p>
            </div>
          </div>

          <button
            onClick={handleEnterRoom}
            className="w-full mt-4 py-3 px-6 glass-heavy rounded-xl font-semibold text-white shadow-glow hover:shadow-glow-intense transition-all transform hover:scale-105 active:scale-95"
          >
            Enter Room
          </button>
        </div>
      </div>
    );
  }

  // No room yet - show creation form
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🏠</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Create Your Permanent Room
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Your permanent room will be available anytime you're online
        </p>
      </div>

      {error && (
        <div className="p-4 glass-light rounded-xl border-2 border-red-500 dark:border-red-400">
          <p className="text-red-700 dark:text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      <div className="glass-light rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Room Name
          </label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={`${user?.username}'s Room`}
            className="w-full px-4 py-3 glass rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-theme"
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Default Game
          </label>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGameId(game.id)}
                disabled={isCreating}
                className={`p-4 rounded-xl transition-all transform hover:scale-105 ${
                  selectedGameId === game.id
                    ? 'glass-heavy shadow-glow text-slate-100'
                    : 'glass text-slate-700 dark:text-slate-300 hover:shadow-glass'
                }`}
              >
                <div className="text-2xl mb-1">{game.emoji}</div>
                <div className="font-semibold text-xs">{game.name}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={isCreating || !roomName.trim()}
          className="w-full py-3 px-6 glass-heavy rounded-xl font-semibold text-white shadow-glow hover:shadow-glow-intense transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isCreating ? (
            <span className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Creating...
            </span>
          ) : (
            'Create Permanent Room'
          )}
        </button>
      </div>
    </div>
  );
};
