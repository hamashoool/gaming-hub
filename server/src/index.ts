import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { RoomManager } from './managers/RoomManager';
import { SocketHandler } from './SocketHandler';
import { AuthService } from './services/AuthService';
import { authenticateRequest } from './middleware/auth';
import { socketAuthMiddleware } from './middleware/socketAuth';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim()),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim()),
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Get all active rooms
app.get('/api/rooms', (req, res) => {
  const rooms = RoomManager.getInstance().getAllRooms();
  res.json(rooms);
});

// Authentication endpoints
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const result = await AuthService.signup(req.body);
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Signup endpoint error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const result = await AuthService.login(req.body);
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/auth/logout', authenticateRequest, async (req, res) => {
  try {
    if (req.token) {
      await AuthService.logout(req.token);
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout endpoint error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateRequest, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// Add Socket.IO authentication middleware
io.use(socketAuthMiddleware);

// Initialize Socket.IO handler
const socketHandler = new SocketHandler(io);
socketHandler.initialize();

// Cleanup expired sessions every hour
setInterval(async () => {
  const cleaned = await AuthService.cleanupExpiredSessions();
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🎮 Gaming Hub Server running on port ${PORT}`);
  console.log(`🌐 Socket.IO ready for connections`);
});
