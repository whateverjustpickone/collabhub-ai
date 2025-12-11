/**
 * Agents Routes
 * /api/agents/*
 */

import { Router } from 'express';
import * as agentsController from '../controllers/agents.controller';
import { authenticate } from '../middleware/auth';
import { llmLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * GET /api/agents
 * Get all available agents
 */
router.get('/', authenticate, agentsController.getAgents);

/**
 * GET /api/agents/providers/status
 * Get LLM provider status
 */
router.get('/providers/status', authenticate, agentsController.getProviderStatus);

/**
 * GET /api/agents/:agentId
 * Get specific agent details
 */
router.get('/:agentId', authenticate, agentsController.getAgent);

/**
 * POST /api/agents/:agentId/message
 * Send test message to agent
 */
router.post('/:agentId/message', authenticate, llmLimiter, agentsController.sendMessageToAgent);

export default router;
