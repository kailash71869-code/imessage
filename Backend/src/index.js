import express from 'express';
import http from 'http';
import path from 'path';
import 'dotenv/config';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';

import { connectDB } from './lib/db.js';
import { initRedis } from './lib/redis.js';
import { initQueue } from './lib/queue.js';
import { setupSocket } from './socket/socket.js';

import aiRoutes from './routes/ai.routes.js';
import messageRoutes from './routes/message.routes.js';
import userRoutes from './routes/user.routes.js';
import botRoutes from './routes/bot.routes.js';
import newsRoutes from './routes/news.routes.js';
import translateRoutes from './routes/translate.routes.js';
import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', '*'],
  credentials: true,
}));

// Clerk authentication middleware
if (process.env.CLERK_SECRET_KEY) {
  try {
    app.use(clerkMiddleware());
  } catch (err) {
    console.warn('[Clerk] Clerk middleware error:', err.message);
  }
}

// Serve uploaded media
app.use('/uploads', express.static(path.resolve('uploads')));

// Health check endpoint (used by Docker healthchecks)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
  });
});

// Setup Socket.io and Redis Adapter
let io = null;

// Initialize Server & dependencies
async function startServer() {
  try {
    // 1. Connect Mongo DB
    await connectDB();

    // 2. Initialize Redis clients for pub/sub & horizontal scaling
    await initRedis();

    // 3. Setup Socket.io
    io = setupSocket(server, FRONTEND_URL);
    app.set('io', io);

    // 4. Initialize BullMQ background queues
    initQueue(io);

    // 5. Mount API Routes
    app.use('/api/ai/copilot', aiRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/bot', botRoutes);
    app.use('/api/news', newsRoutes);
    app.use('/api/translate', translateRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/contacts', contactRoutes);

    // Global Error Handler
    app.use((err, req, res, next) => {
      console.error('[Express Error]', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error',
      });
    });

    server.listen(PORT, () => {
      console.log(`🚀 iMessage Backend running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket ready for multi-client broadcasting on port ${PORT}`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

startServer();
