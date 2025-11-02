# Gaming Hub

A modular real-time multiplayer gaming platform built with React, TypeScript, Node.js, and Socket.io. Currently featuring a competitive Number Guessing Game with plans for easy expansion to additional games.

## Features

- **Real-time Multiplayer**: Play with friends over the network using WebSocket technology
- **Number Guessing Game**: Two players compete to guess a random number within a configurable range
- **Modular Architecture**: Designed for easy addition of new games
- **Room System**: Create or join game rooms with unique 6-character codes
- **Responsive UI**: Modern interface built with React and Tailwind CSS
- **Docker Ready**: Complete containerization for easy deployment

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **Socket.io-client** for real-time communication
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Socket.io** for WebSocket server
- **Modular game architecture** for extensibility

### Infrastructure
- **Monorepo** structure with shared types
- **Docker** and **Docker Compose** for deployment
- **Nginx** for serving the frontend in production

## Project Structure

```
games/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts (Socket, Game)
│   │   ├── hooks/       # Custom hooks
│   │   └── styles/      # CSS files
│   ├── Dockerfile
│   └── nginx.conf
├── server/              # Backend Node.js server
│   ├── src/
│   │   ├── games/       # Game implementations
│   │   ├── managers/    # Room and state managers
│   │   └── index.ts     # Server entry point
│   └── Dockerfile
├── shared/              # Shared TypeScript types
│   └── src/
│       └── types.ts     # Common interfaces and enums
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

This will install dependencies for all workspaces (client, server, and shared).

### Development

Run both the client and server in development mode:

```bash
npm run dev
```

This will start:
- Frontend at `http://localhost:3000`
- Backend at `http://localhost:3001`

Or run them separately:

```bash
# Run server only
npm run dev:server

# Run client only
npm run dev:client
```

### Building for Production

Build both client and server:

```bash
npm run build
```

### Running on Local Network

To play with others on your local network:

1. Start the development servers:
```bash
npm run dev
```

2. Find your local IP address:
   - **macOS/Linux**: `ifconfig` or `ip addr`
   - **Windows**: `ipconfig`

3. Update the Socket.io connection URL in `client/src/contexts/SocketContext.tsx`:
```typescript
const socketInstance = io('http://YOUR_LOCAL_IP:3001', {
  transports: ['websocket'],
  autoConnect: true
});
```

4. Share `http://YOUR_LOCAL_IP:3000` with other players on your network

### Docker Deployment

Deploy the entire application using Docker Compose:

```bash
docker-compose up --build
```

**Access Points:**
- **Client**: `http://localhost:4401`
- **Server API**: `http://localhost:3001` (optional, can be made private)

**Portainer Deployment:**
When deploying via Portainer, the client will be accessible on port **4401**.

#### Network Architecture

The application uses a private Docker bridge network (`gaming-hub`) for secure client-server communication:

- **Private Network**: Client and server communicate internally via the `gaming-hub` network
- **Client Container**: Uses service name `gaming-hub-server:3001` to connect to the server
- **Exposed Port**: Only port 4401 is required to be exposed for client access
- **Optional Server Access**: Port 3001 can be removed from docker-compose.yml to make the server completely private

**Security Benefits:**
- Internal communication happens over the private network
- Server can be isolated from external access
- Only the web interface (client) needs to be publicly accessible

## How to Play

### Number Guessing Game

1. **Create a Room**:
   - Enter your name
   - Click "Create New Room"
   - Share the 6-character room code with a friend

2. **Join a Room**:
   - Enter your name
   - Enter the room code
   - Click "Join Room"

3. **Configure Game**:
   - Set the minimum and maximum range for the number
   - Click "Start Game" (requires 2 players)

4. **Gameplay**:
   - Players take turns guessing the number
   - Receive feedback: "Too High", "Too Low", or "Correct"
   - First player to guess correctly wins!

## Adding New Games

The gaming hub is designed with a modular architecture to easily add new games:

### 1. Define Game Types

Add new types to `shared/src/types.ts`:

```typescript
export interface MyNewGameState {
  // Your game state properties
}

export interface MyNewGameConfig {
  // Your game configuration
}
```

### 2. Implement Game Logic

Create a new file in `server/src/games/MyNewGame.ts`:

```typescript
export class MyNewGame {
  static initializeGame(players: Player[], config: MyNewGameConfig) {
    // Initialize game state
  }

  static processAction(gameState: MyNewGameState, action: any) {
    // Handle game actions
  }
}
```

### 3. Add Socket Handlers

Update `server/src/SocketHandler.ts` to handle your game's events.

### 4. Create UI Components

Create game UI in `client/src/components/MyNewGame.tsx` and integrate it into the room page.

## API Endpoints

### REST API

- `GET /health` - Health check endpoint
- `GET /api/rooms` - Get all active rooms

### Socket.io Events

**Client → Server:**
- `create_room` - Create a new game room
- `join_room` - Join an existing room
- `leave_room` - Leave a room
- `start_game` - Start the game
- `make_guess` - Submit a guess (Number Guessing Game)

**Server → Client:**
- `room_created` - Room successfully created
- `room_joined` - Successfully joined room
- `player_joined` - Another player joined
- `player_left` - Player left the room
- `game_started` - Game has started
- `guess_result` - Result of a guess
- `turn_changed` - Turn switched to another player
- `game_finished` - Game completed
- `error` - Error occurred

## Environment Variables

### Docker Compose
- `CLIENT_PORT` - Client exposed port (default: 4401)
- `SERVER_PORT` - Server exposed port (default: 3001)
- `JWT_SECRET` - Secret key for JWT tokens (required for production)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:3000)
- `VITE_API_URL` - API URL for the client (default: http://gaming-hub-server:3001)

### Server
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - SQLite database location
- `JWT_SECRET` - Secret for JWT token generation
- `JWT_EXPIRES_IN` - Token expiration time (default: 7d)

## Future Enhancements

- [ ] Add more games (Tic-Tac-Toe, Trivia, etc.)
- [ ] Player authentication and profiles
- [ ] Game statistics and leaderboards
- [ ] Spectator mode
- [ ] Private rooms with passwords
- [ ] Chat functionality
- [ ] Game replay system
- [ ] Mobile app versions

## Contributing

This is a modular project designed for extensibility. Feel free to:
- Add new games
- Improve existing games
- Enhance the UI/UX
- Add new features to the platform

## License

MIT License - Feel free to use this project for learning and development.

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Built with ❤️ using TypeScript, React, and Socket.io**
