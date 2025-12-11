/**
 * Authentication Middleware
 * JWT token verification and user attachment
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload, AuthenticationError, AuthorizationError, UserRole } from '../types';
import { config } from '../config/env';
import logger from '../config/logger';

/**
 * Verify JWT token and attach user to request
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    if (!config.auth.jwtSecret) {
      logger.error('JWT secret not configured');
      throw new AuthenticationError('Authentication configuration error');
    }

    const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: '', // Will be populated from database in actual implementation
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    if (!config.auth.jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: '',
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Token invalid, but don't fail - just continue without user
    next();
  }
}

/**
 * Require specific role
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AuthorizationError(
          `Access denied. Required roles: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Require user or admin role
 */
export const requireUser = requireRole(UserRole.USER, UserRole.ADMIN);
