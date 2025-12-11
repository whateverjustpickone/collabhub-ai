/**
 * Authentication Controller
 * Handles user registration, login, and token refresh
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as authService from '../services/auth/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { validate, userRegistrationSchema, userLoginSchema } from '../utils/validation';
import logger from '../config/logger';

/**
 * Register new user
 * POST /api/auth/register
 */
export async function register(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const data = validate(userRegistrationSchema, req.body);

    // Register user
    const result = await authService.register(data);

    logger.info('User registered successfully', {
      userId: result.user.id,
      email: result.user.email,
    });

    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const data = validate(userLoginSchema, req.body);

    // Login user
    const result = await authService.login(data);

    logger.info('User logged in successfully', {
      userId: result.user.id,
      email: result.user.email,
    });

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refresh(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Refresh token is required');
    }

    // Refresh access token
    const result = await authService.refreshAccessToken(refreshToken);

    logger.info('Access token refreshed');

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user
 * GET /api/auth/me
 */
export async function getCurrentUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTHENTICATION_ERROR', 'Not authenticated');
    }

    const user = await authService.getUserById(req.user.id);

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export async function logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // In a production app, you would invalidate the refresh token here
    // For now, we just send success (client will discard tokens)

    logger.info('User logged out', {
      userId: req.user?.id,
    });

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
