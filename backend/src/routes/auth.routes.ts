/**
 * Authentication Routes
 * /api/auth/*
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', authLimiter, authController.register);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authLimiter, authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', authController.refresh);

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * POST /api/auth/logout
 * Logout user (requires authentication)
 */
router.post('/logout', authenticate, authController.logout);

export default router;
