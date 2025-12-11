/**
 * Authentication Service
 * User registration, login, and authentication logic
 */

import prisma from '../../config/database';
import { hashPassword, verifyPassword } from '../../utils/crypto';
import { generateTokenPair } from './jwt.service';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  UserRole,
} from '../../types';

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: UserRole.USER,
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(
    user.id,
    user.email,
    user.role as UserRole
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Login user
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isValid = await verifyPassword(data.password, user.passwordHash);

  if (!isValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(
    user.id,
    user.email,
    user.role as UserRole
  );

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string }> {
  // Verify refresh token
  const { verifyRefreshToken } = await import('./jwt.service');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Generate new access token
  const { generateAccessToken } = await import('./jwt.service');
  const accessToken = generateAccessToken(
    user.id,
    user.email,
    user.role as UserRole
  );

  return { accessToken };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}
