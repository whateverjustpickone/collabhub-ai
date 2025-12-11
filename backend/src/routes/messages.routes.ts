/**
 * Messages Routes
 * /api/messages/*
 */

import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { authenticate } from '../middleware/auth';
import { llmLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * GET /api/messages
 * Get messages for a channel (with pagination)
 */
router.get('/', authenticate, messagesController.getMessages);

/**
 * POST /api/messages
 * Create new message
 */
router.post('/', authenticate, messagesController.createMessage);

/**
 * POST /api/messages/agent
 * Send message to AI agent and get response
 */
router.post('/agent', authenticate, llmLimiter, messagesController.sendToAgent);

/**
 * GET /api/messages/:messageId
 * Get single message with VERA contributions
 */
router.get('/:messageId', authenticate, messagesController.getMessage);

export default router;
