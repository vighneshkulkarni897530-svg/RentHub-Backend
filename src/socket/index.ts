import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import logger from '../config/logger';

let io: Server | null = null;

/**
 * Initialize Socket.IO on the HTTP server.
 * Real-time chat + notifications.
 */
export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  // JWT authentication middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, env.jwtAccessSecret) as { sub: string; role: string };
      (socket as any).userId = decoded.sub;
      (socket as any).role = decoded.role;
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    logger.info(`Socket connected: user ${userId}`);

    // Join a personal room for targeted notifications
    socket.join(`user:${userId}`);

    // Join conversation rooms
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user ${userId}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

/**
 * Returns the Socket.IO server instance (null before init).
 */
export function getIO(): Server | null {
  return io;
}

export default { initSocket, getIO };

