import http from 'http';
import app from './app';
import env from './config/env';
import logger from './config/logger';
import { connectDB } from './config/db';
import { initSocket } from './socket';

/**
 * Server bootstrap:
 * 1. Connect to MongoDB
 * 2. Initialize Socket.IO on the HTTP server
 * 3. Start listening
 */
async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${(error as Error).message}`);
    logger.warn('Server will still start, but database-dependent features will fail until MongoDB is reachable.');
  }

  const server = http.createServer(app);

  // Initialize Socket.IO for real-time chat & notifications
  initSocket(server);

  server.listen(env.port, () => {
    logger.info(`🚀 RentHub API running in ${env.nodeEnv} mode`);
    logger.info(`   Base URL: http://localhost:${env.port}/api/${env.apiVersion}`);
    logger.info(`   Health:   http://localhost:${env.port}/api/${env.apiVersion}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void startServer();

