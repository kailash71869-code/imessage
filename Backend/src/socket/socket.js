import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClients } from '../lib/redis.js';

const onlineUsers = new Map(); // clerkId -> socketId

export function setupSocket(server, FRONTEND_URL) {
  const io = new Server(server, {
    cors: {
      origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "*"],
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Attach Redis adapter if connected for seamless multi-container horizontal scaling
  const { pubClient, subClient, isRedisConnected } = getRedisClients();
  if (isRedisConnected && pubClient && subClient) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket.io] Attached @socket.io/redis-adapter for horizontal multi-container scaling.');
  } else {
    console.log('[Socket.io] Running default in-memory adapter (single-node or fallback).');
  }

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // User authentication / identification
    socket.on('user-identify', (user) => {
      if (user?.clerkId) {
        onlineUsers.set(user.clerkId, socket.id);
        socket.data.userId = user.clerkId;
        socket.data.userName = user.fullName;
        
        io.emit('presence-update', {
          userId: user.clerkId,
          status: 'online',
          onlineUserIds: Array.from(onlineUsers.keys()),
        });
        console.log(`[Socket.io] User online: ${user.fullName} (${user.clerkId})`);
      }
    });

    // Room Joining
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`[Socket.io] Socket ${socket.id} joined room: ${roomId}`);
      socket.to(roomId).emit('user-joined-room', {
        userId: socket.data.userId,
        roomId,
      });
    });

    // Room Leaving
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`[Socket.io] Socket ${socket.id} left room: ${roomId}`);
    });

    // Real-Time Message Broadcasting across sockets & Redis Pub/Sub
    socket.on('send-message', (messageData) => {
      console.log(`[Socket.io] Message from ${messageData.senderId} in room ${messageData.roomId} (E2EE: ${messageData.isEncrypted})`);
      // Broadcast to all other sockets in room
      socket.to(messageData.roomId).emit('receive-message', messageData);
    });

    // Typing Indicators
    socket.on('typing', ({ roomId, userId, userName }) => {
      socket.to(roomId).emit('user-typing', {
        roomId,
        userId: userId || socket.data.userId,
        userName: userName || socket.data.userName || 'Someone',
      });
    });

    socket.on('stop-typing', ({ roomId, userId }) => {
      socket.to(roomId).emit('user-stop-typing', {
        roomId,
        userId: userId || socket.data.userId,
      });
    });

    // Message Status (Delivered / Read receipts)
    socket.on('message-delivered', ({ messageId, roomId }) => {
      io.to(roomId).emit('message-status-updated', { messageId, status: 'delivered' });
    });

    socket.on('message-read', ({ messageId, roomId }) => {
      io.to(roomId).emit('message-status-updated', { messageId, status: 'read' });
    });

    // E2EE Public Key Exchange Announcement
    socket.on('e2ee-key-exchange', ({ userId, publicKey }) => {
      socket.broadcast.emit('e2ee-key-updated', { userId, publicKey });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
        io.emit('presence-update', {
          userId: socket.data.userId,
          status: 'offline',
          onlineUserIds: Array.from(onlineUsers.keys()),
        });
        console.log(`[Socket.io] User disconnected: ${socket.data.userName || socket.data.userId}`);
      }
    });
  });

  return io;
}

export function isUserOnline(userId) {
  if (!userId) return false;
  return onlineUsers.has(String(userId));
}

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

