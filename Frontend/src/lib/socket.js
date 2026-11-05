import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin
);

let socket = null;

export function initSocket(user, onReconnectCallback) {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected successfully with ID:', socket.id);
      if (user) {
        socket.emit('user-identify', user);
      }
      if (onReconnectCallback) {
        onReconnectCallback();
      }
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket.io] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection error:', err.message);
    });
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function joinRoom(roomId) {
  if (socket?.connected) {
    socket.emit('join-room', roomId);
  }
}

export function leaveRoom(roomId) {
  if (socket?.connected) {
    socket.emit('leave-room', roomId);
  }
}

export function emitMessage(messageData) {
  if (socket?.connected) {
    socket.emit('send-message', messageData);
    return true;
  }
  return false;
}

export function emitTyping(roomId, user) {
  if (socket?.connected) {
    socket.emit('typing', {
      roomId,
      userId: user.clerkId,
      userName: user.fullName,
    });
  }
}

export function emitStopTyping(roomId, user) {
  if (socket?.connected) {
    socket.emit('stop-typing', {
      roomId,
      userId: user.clerkId,
    });
  }
}
