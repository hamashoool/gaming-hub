import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { SocketEvents, CreateRoomPayload, JoinRoomPayload } from '@gaming-hub/shared';
import { gameSounds } from '../utils/sounds';
import { getPlayerName, savePlayerName, getRecentRooms, addRecentRoom, getFavoriteGame, saveFavoriteGame } from '../utils/storage';
import { ThemeToggle } from '../components/ThemeToggle';
import { MyRoom } from '../components/MyRoom';
import { PublicRoomsList } from '../components/PublicRoomsList';
import { AVAILABLE_GAMES } from '../config/games';

type TabType = 'quick-play' | 'my-room' | 'public-rooms';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user, isAuthenticated, logout } = useAuth();
  const { setPlayerId, setRoom } = useGame();

  const [activeTab, setActiveTab] = useState<TabType>('quick-play');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedGameId, setSelectedGameId] = useState<string>('this-or-that');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [recentRooms, setRecentRooms] = useState<string[]>([]);

  // Load saved data on mount
  useEffect(() => {
    const savedName = getPlayerName();
    if (savedName) {
      setPlayerName(savedName);
    } else if (user?.username) {
      setPlayerName(user.username);
    }

    const favoriteGame = getFavoriteGame();
    if (favoriteGame) {
      setSelectedGameId(favoriteGame as any);
    }

    const recent = getRecentRooms();
    setRecentRooms(recent);
  }, [user]);

  const handleCreateRoom = () => {
    if (!socket || !playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    // Save player name and favorite game
    savePlayerName(playerName.trim());
    saveFavoriteGame(selectedGameId);

    setIsCreating(true);
    setError('');

    const payload: CreateRoomPayload = {
      playerName: playerName.trim(),
      gameId: selectedGameId
    };

    socket.emit(SocketEvents.CREATE_ROOM, payload);

    socket.once(SocketEvents.ROOM_CREATED, ({ room, playerId }: any) => {
      gameSounds.create.play().catch(() => {});
      setPlayerId(playerId);
      setRoom(room);
      addRecentRoom(room.id);
      setIsCreating(false);
      navigate(`/room/${room.id}`);
    });

    socket.once(SocketEvents.ERROR, ({ message }: any) => {
      setError(message);
      setIsCreating(false);
    });
  };

  const handleJoinRoom = () => {
    if (!socket || !playerName.trim() || !roomCode.trim()) {
      setError('Please enter your name and room code');
      return;
    }

    // Save player name
    savePlayerName(playerName.trim());

    setIsJoining(true);
    setError('');

    const payload: JoinRoomPayload = {
      roomId: roomCode.trim().toUpperCase(),
      playerName: playerName.trim()
    };

    socket.emit(SocketEvents.JOIN_ROOM, payload);

    socket.once(SocketEvents.ROOM_JOINED, ({ room, playerId }: any) => {
      gameSounds.join.play().catch(() => {});
      setPlayerId(playerId);
      setRoom(room);
      addRecentRoom(room.id);
      setIsJoining(false);
      navigate(`/room/${room.id}`);
    });

    socket.once(SocketEvents.ERROR, ({ message }: any) => {
      setError(message);
      setIsJoining(false);
    });
  };

  const handleQuickJoinRoom = (roomCode: string) => {
    if (!playerName.trim()) {
      setError('Please enter your name first');
      return;
    }
    setRoomCode(roomCode);
    setTimeout(() => handleJoinRoom(), 0);
  };

  const handleLogout = async () => {
    await logout();
    setPlayerName('');
  };

  const tabs = [
    { id: 'quick-play', name: 'Quick Play', emoji: '⚡' },
    { id: 'my-room', name: 'My Room', emoji: '🏠' },
    { id: 'public-rooms', name: 'Public Rooms', emoji: '🌐' }
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh-light dark:bg-gradient-mesh-dark bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-theme relative overflow-hidden">
      {/* Floating Theme Toggle */}
      <div className="fixed top-6 right-6 z-50 animate-fade-in">
        <ThemeToggle />
      </div>

      {/* Auth UI */}
      <div className="fixed top-6 left-6 z-50 animate-fade-in">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="glass-light px-4 py-2 rounded-xl">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                👤 {user.username}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="glass-light px-4 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:shadow-glass transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <a
              href="/login"
              className="glass-light px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:shadow-glass transition-all"
            >
              Login
            </a>
            <a
              href="/signup"
              className="glass-heavy px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-glow hover:shadow-glow-intense transition-all"
            >
              Sign Up
            </a>
          </div>
        )}
      </div>

      <div className="max-w-2xl w-full glass rounded-3xl shadow-glass dark:shadow-glass-dark p-8 animate-scale-in">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2 transition-theme">Gaming Hub</h1>
          <p className="text-slate-600 dark:text-slate-400 transition-theme">Play multiplayer games with friends</p>
          <div className="mt-4">
            {isConnected ? (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium glass-light shadow-glow-green transition-theme">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-emerald-700 dark:text-emerald-400">Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium glass-light shadow-glow-red transition-theme">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <span className="text-red-700 dark:text-red-400">Disconnected</span>
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 p-1 glass-light rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 py-3 px-4 rounded-lg transition-all transform ${
                activeTab === tab.id
                  ? 'glass-heavy shadow-glow text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:glass'
              }`}
            >
              <div className="text-xl mb-1">{tab.emoji}</div>
              <div className="text-sm font-semibold">{tab.name}</div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'quick-play' && (
            <div className="space-y-6">
              <div className="animate-slide-up">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-theme">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 glass-light rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-theme"
                  disabled={!isConnected}
                />
              </div>

              <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 transition-theme">
                  Select Game
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_GAMES.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGameId(game.id)}
                      className={`p-4 rounded-xl transition-all transform hover:scale-105 ${
                        selectedGameId === game.id
                          ? 'glass-heavy shadow-glow text-slate-100'
                          : 'glass-light text-slate-700 dark:text-slate-300 hover:shadow-glass'
                      }`}
                    >
                      <div className="text-2xl mb-1">{game.emoji}</div>
                      <div className="font-semibold text-sm">{game.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <button
                  onClick={handleCreateRoom}
                  disabled={!isConnected || isCreating || !playerName.trim()}
                  className="w-full glass-heavy py-3 rounded-xl font-semibold shadow-glow hover:shadow-glow-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] text-slate-100"
                >
                  {isCreating ? 'Creating...' : 'Create New Room'}
                </button>
              </div>

              <div className="relative animate-slide-up" style={{animationDelay: '0.3s'}}>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/50 dark:border-slate-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 glass-light text-slate-500 dark:text-slate-400 rounded-full">OR</span>
                </div>
              </div>

              <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-theme">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3 glass-light rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none uppercase text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono text-center tracking-widest transition-theme"
                  disabled={!isConnected}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!isConnected || isJoining || !playerName.trim() || !roomCode.trim()}
                className="w-full glass-heavy py-3 rounded-xl font-semibold shadow-glow-blue hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] text-slate-100 animate-slide-up"
                style={{animationDelay: '0.5s'}}
              >
                {isJoining ? 'Joining...' : 'Join Room'}
              </button>

              {error && (
                <div className="glass-light border border-red-400/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm shadow-glow-red animate-slide-down">
                  {error}
                </div>
              )}

              {recentRooms.length > 0 && (
                <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-6 animate-slide-up" style={{animationDelay: '0.6s'}}>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 transition-theme">Recent Rooms</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {recentRooms.slice(0, 6).map((code, index) => (
                      <button
                        key={code}
                        onClick={() => handleQuickJoinRoom(code)}
                        disabled={!isConnected || !playerName.trim()}
                        className="px-3 py-2 glass-light hover:glass-heavy disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 rounded-lg text-sm font-mono transition-all transform hover:scale-105"
                        style={{animationDelay: `${0.7 + index * 0.05}s`}}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-room' && (
            <div className="animate-fade-in">
              <MyRoom />
            </div>
          )}

          {activeTab === 'public-rooms' && (
            <div className="animate-fade-in">
              <PublicRoomsList playerName={playerName} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
