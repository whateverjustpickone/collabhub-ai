/**
 * Messages Controller
 * Handles message creation, retrieval, and AI agent responses
 */

import { Response, NextFunction } from 'express';
import { AuthRequest, MessageType } from '../types';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { validate, messageCreateSchema, paginationSchema } from '../utils/validation';
import prisma from '../config/database';
import llmService from '../services/llm/llm.service';
import { getAgentPersona } from '../services/llm/agent-personas';
import { createContribution } from '../services/vera/vera.service';
import { generateContentHash } from '../utils/crypto';
import websocketService from '../services/websocket/websocket.service';
import { WebSocketEvent } from '../types';
import logger from '../config/logger';

/**
 * Get messages for a channel
 * GET /api/messages?channelId=xxx&page=1&pageSize=50
 */
export async function getMessages(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { channelId } = req.query;
    const pagination = validate(paginationSchema, req.query);

    if (!channelId || typeof channelId !== 'string') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'channelId is required');
    }

    // Get total count
    const total = await prisma.message.count({
      where: { channelId },
    });

    // Get messages with pagination
    const messages = await prisma.message.findMany({
      where: { channelId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });

    sendPaginated(res, messages, pagination.page, pagination.pageSize, total);
  } catch (error) {
    next(error);
  }
}

/**
 * Create new message
 * POST /api/messages
 */
export async function createMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTHENTICATION_ERROR', 'Not authenticated');
    }

    const data = validate(messageCreateSchema, req.body);

    // Generate content hash for VERA
    const contentHash = generateContentHash(data.content);

    // Create message
    const message = await prisma.message.create({
      data: {
        channelId: data.channelId,
        senderId: req.user.id,
        senderType: 'USER',
        type: data.type || MessageType.TEXT,
        content: data.content,
        veraHash: contentHash,
        metadata: data.metadata || {},
        parentId: data.parentId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Message created', {
      messageId: message.id,
      channelId: message.channelId,
      userId: req.user.id,
    });

    // Broadcast to channel via WebSocket
    websocketService.broadcastToChannel(
      message.channelId,
      WebSocketEvent.MESSAGE_RECEIVED,
      { message }
    );

    sendSuccess(res, message, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Send message and get AI agent response
 * POST /api/messages/agent
 */
export async function sendToAgent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return sendError(res, 401, 'AUTHENTICATION_ERROR', 'Not authenticated');
    }

    const { channelId, content, agentId, conversationHistory } = req.body;

    if (!channelId || !content || !agentId) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'channelId, content, and agentId are required'
      );
    }

    // Get agent persona
    const persona = getAgentPersona(agentId);
    if (!persona) {
      return sendError(res, 404, 'NOT_FOUND', `Agent ${agentId} not found`);
    }

    // Check if provider is available
    if (!llmService.isProviderAvailable(persona.provider)) {
      return sendError(
        res,
        503,
        'SERVICE_UNAVAILABLE',
        `Agent ${persona.name} is currently unavailable`
      );
    }

    // Create user message
    const contentHash = generateContentHash(content);
    const userMessage = await prisma.message.create({
      data: {
        channelId,
        senderId: req.user.id,
        senderType: 'USER',
        type: MessageType.TEXT,
        content,
        veraHash: contentHash,
      },
    });

    // Broadcast user message
    websocketService.broadcastToChannel(channelId, WebSocketEvent.MESSAGE_RECEIVED, {
      message: userMessage,
    });

    // Show agent thinking status
    websocketService.broadcastAgentThinking(channelId, agentId, true);

    logger.info('Sending message to AI agent', {
      agentId,
      agentName: persona.name,
      channelId,
      userId: req.user.id,
    });

    // Get AI response
    const aiResponse = await llmService.sendMessageToAgent(
      persona.provider,
      persona.model,
      persona.systemPrompt,
      content,
      conversationHistory
    );

    // Stop thinking status
    websocketService.broadcastAgentThinking(channelId, agentId, false);

    // Get or create agent user record
    let agentUser = await prisma.user.findFirst({
      where: {
        email: `${agentId}@agents.collabhub.ai`,
      },
    });

    if (!agentUser) {
      agentUser = await prisma.user.create({
        data: {
          email: `${agentId}@agents.collabhub.ai`,
          name: persona.name,
          passwordHash: '', // Agents don't have passwords
          role: 'AGENT',
        },
      });
    }

    // Create AI agent message
    const agentContentHash = generateContentHash(aiResponse.content);
    const agentMessage = await prisma.message.create({
      data: {
        channelId,
        senderId: agentUser.id,
        senderType: 'AGENT',
        type: MessageType.TEXT,
        content: aiResponse.content,
        veraHash: agentContentHash,
        metadata: {
          provider: persona.provider,
          model: aiResponse.model,
          tokensUsed: aiResponse.tokensUsed,
          agentId: persona.id,
          agentRole: persona.role,
        },
        parentId: userMessage.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create VERA contribution record
    await createContribution({
      messageId: agentMessage.id,
      agentId: agentUser.id,
      contributionType: 'TEXT',
      content: aiResponse.content,
      metadata: {
        provider: persona.provider,
        model: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed,
      },
    });

    // Broadcast agent response
    websocketService.broadcastToChannel(channelId, WebSocketEvent.MESSAGE_RECEIVED, {
      message: agentMessage,
    });

    logger.info('AI agent responded', {
      agentId,
      messageId: agentMessage.id,
      tokensUsed: aiResponse.tokensUsed.total,
    });

    sendSuccess(res, {
      userMessage,
      agentMessage,
      tokensUsed: aiResponse.tokensUsed,
    }, 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Get single message
 * GET /api/messages/:messageId
 */
export async function getMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        veraContributions: true,
      },
    });

    if (!message) {
      return sendError(res, 404, 'NOT_FOUND', 'Message not found');
    }

    sendSuccess(res, message);
  } catch (error) {
    next(error);
  }
}
