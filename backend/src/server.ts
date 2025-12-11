/**
 * Server Entry Point
 * HTTP server initialization and startup
 */

import http from 'http';
import { createApp } from './app';
import { config } from './config/env';
import logger from './config/logger';
import prisma from './config/database';
import websocketService from './services/websocket/websocket.service';

/**
 * Start the HTTP server
 */
async function startServer(): Promise<void> {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    try {
      await prisma.$connect();
      logger.info('✓ Database connected successfully');
    } catch (error) {
      logger.warn('⚠ Database connection failed (will retry on first request):', error);
      // Don't fail startup if database isn't ready yet
      // Prisma will retry on first actual query
    }

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket server
    websocketService.initialize(server);

    // Start listening
    server.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 CollabHub AI Backend Server                          ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(43)}║
║   Port: ${config.port.toString().padEnd(50)}║
║   URL: http://localhost:${config.port.toString().padEnd(36)}║
║                                                           ║
║   Status: ✓ Running                                       ║
║   Database: ${prisma ? '✓ Connected' : '⚠ Pending'.padEnd(44)}║
║   WebSocket: ✓ Initialized                                ║
║                                                           ║
║   API Documentation: http://localhost:${config.port}/api${' '.repeat(14)}║
║   Health Check: http://localhost:${config.port}/health${' '.repeat(10)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Close WebSocket server
        websocketService.close();
        logger.info('WebSocket server closed');

        // Close database connection
        await prisma.$disconnect();
        logger.info('Database connection closed');

        logger.info('Shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
