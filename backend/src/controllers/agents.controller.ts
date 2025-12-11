/**
 * Agents Controller
 * Handles AI agent management and status
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import llmService from '../services/llm/llm.service';
import { getAllExecutiveTeamPersonas, getAgentPersona } from '../services/llm/agent-personas';
import logger from '../config/logger';

/**
 * Get all available agents
 * GET /api/agents
 */
export async function getAgents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get Executive Team personas
    const personas = getAllExecutiveTeamPersonas();

    // Check provider availability
    const agents = personas.map((persona) => ({
      id: persona.id,
      name: persona.name,
      role: persona.role,
      provider: persona.provider,
      model: persona.model,
      personality: persona.personality,
      available: llmService.isProviderAvailable(persona.provider),
      status: llmService.isProviderAvailable(persona.provider) ? 'ACTIVE' : 'UNAVAILABLE',
    }));

    logger.info('Retrieved agent list', { count: agents.length });

    sendSuccess(res, {
      agents,
      totalCount: agents.length,
      availableCount: agents.filter((a) => a.available).length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get specific agent details
 * GET /api/agents/:agentId
 */
export async function getAgent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { agentId } = req.params;

    const persona = getAgentPersona(agentId);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Agent ${agentId} not found`,
        },
      });
    }

    const agentDetails = {
      ...persona,
      available: llmService.isProviderAvailable(persona.provider),
      status: llmService.isProviderAvailable(persona.provider) ? 'ACTIVE' : 'UNAVAILABLE',
    };

    sendSuccess(res, agentDetails);
  } catch (error) {
    next(error);
  }
}

/**
 * Get LLM provider status
 * GET /api/agents/providers/status
 */
export async function getProviderStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const status = llmService.getProviderStatus();

    sendSuccess(res, {
      providers: status,
      availableProviders: llmService.getAvailableProviders(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send message to an agent (test endpoint)
 * POST /api/agents/:agentId/message
 */
export async function sendMessageToAgent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { agentId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message is required',
        },
      });
    }

    const persona = getAgentPersona(agentId);

    if (!persona) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Agent ${agentId} not found`,
        },
      });
    }

    // Check if provider is available
    if (!llmService.isProviderAvailable(persona.provider)) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: `Agent ${persona.name} is currently unavailable (provider ${persona.provider} not configured)`,
        },
      });
    }

    logger.info('Sending message to agent', {
      agentId,
      agentName: persona.name,
      provider: persona.provider,
    });

    // Send message to LLM
    const response = await llmService.sendMessageToAgent(
      persona.provider,
      persona.model,
      persona.systemPrompt,
      message,
      undefined, // no conversation history for test endpoint
      false // no streaming
    );

    sendSuccess(res, {
      agent: {
        id: persona.id,
        name: persona.name,
        role: persona.role,
      },
      response: response.content,
      tokensUsed: response.tokensUsed,
    });
  } catch (error) {
    next(error);
  }
}
