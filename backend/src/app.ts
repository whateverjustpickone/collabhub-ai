/**
 * Express Application Setup
 * Main application configuration and middleware
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';

// Import routes
import authRoutes from './routes/auth.routes';
import agentsRoutes from './routes/agents.routes';
import messagesRoutes from './routes/messages.routes';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // ============================================
  // SECURITY MIDDLEWARE
  // ============================================

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction,
      crossOriginEmbedderPolicy: config.isProduction,
    })
  );

  // CORS - Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ============================================
  // REQUEST PROCESSING MIDDLEWARE
  // ============================================

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Request logging
  if (config.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      })
    );
  }

  // Rate limiting (apply to all routes)
  app.use('/api/', apiLimiter);

  // ============================================
  // HEALTH CHECK
  // ============================================

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: '2.0.0',
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'pending', // Will be updated once Prisma is connected
        redis: 'pending', // Will be updated once Redis is connected
      },
    });
  });

  // ============================================
  // API ROUTES
  // ============================================

  // Authentication routes
  app.use('/api/auth', authRoutes);

  // Agent routes
  app.use('/api/agents', agentsRoutes);

  // Message routes
  app.use('/api/messages', messagesRoutes);

  // API info route
  app.get('/api', (req, res) => {
    res.json({
      message: 'CollabHub AI API v2.0.0',
      status: 'operational',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        agents: '/api/agents',
        messages: '/api/messages',
      },
      documentation: 'https://docs.collabhub.ai',
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
