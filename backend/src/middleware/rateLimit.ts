/**
 * Rate Limiting Middleware
 * Protect API from abuse
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { sendError } from '../utils/response';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      429,
      'RATE_LIMIT_ERROR',
      'Too many requests, please try again later'
    );
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      429,
      'RATE_LIMIT_ERROR',
      'Too many authentication attempts, please try again in 15 minutes'
    );
  },
});

/**
 * Generous rate limiter for LLM requests (they can be expensive)
 */
export const llmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many LLM requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      429,
      'RATE_LIMIT_ERROR',
      'Too many AI requests, please wait a moment'
    );
  },
});
