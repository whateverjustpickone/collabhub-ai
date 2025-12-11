/**
 * Environment Configuration
 * Centralized environment variable access with validation
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import logger from './logger';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Redis (optional for now)
  REDIS_URL: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z.string().min(32).optional(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  // LLM APIs (all optional - we'll add them progressively)
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),

  // Avatar Services (optional - Week 3-4)
  DID_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    logger.error('Environment validation failed:', error.errors);
    // In development, provide defaults for missing optional variables
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Running in development mode with default configuration');
      env = {
        NODE_ENV: 'development',
        PORT: 3001,
        JWT_SECRET: 'dev-secret-change-in-production-min-32-chars',
        JWT_EXPIRES_IN: '7d',
        REFRESH_TOKEN_SECRET: 'dev-refresh-secret-change-in-production-min-32-chars',
        REFRESH_TOKEN_EXPIRES_IN: '30d',
        CORS_ORIGIN: 'http://localhost:5173',
        RATE_LIMIT_WINDOW_MS: 900000,
        RATE_LIMIT_MAX_REQUESTS: 100,
        LOG_LEVEL: 'info',
      } as z.infer<typeof envSchema>;
    } else {
      throw new Error('Environment validation failed in production');
    }
  } else {
    throw error;
  }
}

// Export configuration
export const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
  },

  // Authentication
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  },

  // LLM APIs
  llm: {
    anthropic: env.ANTHROPIC_API_KEY,
    openai: env.OPENAI_API_KEY,
    google: env.GOOGLE_API_KEY,
    xai: env.XAI_API_KEY,
    deepseek: env.DEEPSEEK_API_KEY,
    perplexity: env.PERPLEXITY_API_KEY,
  },

  // Avatar Services
  avatar: {
    did: env.DID_API_KEY,
    elevenlabs: env.ELEVENLABS_API_KEY,
  },

  // Security
  cors: {
    origin: env.CORS_ORIGIN,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
  },
};

export default config;
