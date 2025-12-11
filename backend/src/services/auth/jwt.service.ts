/**
 * JWT Service
 * Token generation and verification
 */

import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { JWTPayload, UserRole } from '../../types';

/**
 * Generate access token
 */
export function generateAccessToken(
  userId: string,
  email: string,
  role: UserRole
): string {
  if (!config.auth.jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  const payload: JWTPayload = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(
  userId: string,
  email: string,
  role: UserRole
): string {
  if (!config.auth.refreshTokenSecret) {
    throw new Error('Refresh token secret not configured');
  }

  const payload: JWTPayload = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, config.auth.refreshTokenSecret, {
    expiresIn: config.auth.refreshTokenExpiresIn,
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  if (!config.auth.jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  return jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  if (!config.auth.refreshTokenSecret) {
    throw new Error('Refresh token secret not configured');
  }

  return jwt.verify(token, config.auth.refreshTokenSecret) as JWTPayload;
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(
  userId: string,
  email: string,
  role: UserRole
): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(userId, email, role),
    refreshToken: generateRefreshToken(userId, email, role),
  };
}
