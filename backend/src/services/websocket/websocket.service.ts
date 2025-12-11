/**
 * WebSocket Service
 * Real-time communication using Socket.io
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import logger from '../../config/logger';
import { WebSocketEvent, JWTPayload } from '../../types';

class WebSocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        if (!config.auth.jwtSecret) {
          return next(new Error('Authentication not configured'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;

        // Attach user data to socket
        (socket as any).userId = decoded.userId;
        (socket as any).userEmail = decoded.email;
        (socket as any).userRole = decoded.role;

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed', { error });
        next(new Error('Invalid authentication token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('✓ WebSocket server initialized');
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    const userId = (socket as any).userId;
    const userEmail = (socket as any).userEmail;

    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId,
      userEmail,
    });

    // Track user socket
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);
    this.socketUsers.set(socket.id, userId);

    // Send authentication success
    socket.emit(WebSocketEvent.AUTH_SUCCESS, {
      userId,
      userEmail,
      timestamp: new Date(),
    });

    // Register event handlers
    this.registerEventHandlers(socket);

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Register all event handlers for a socket
   */
  private registerEventHandlers(socket: Socket): void {
    // Channel events
    socket.on(WebSocketEvent.JOIN_CHANNEL, (data: { channelId: string }) => {
      this.handleJoinChannel(socket, data.channelId);
    });

    socket.on(WebSocketEvent.LEAVE_CHANNEL, (data: { channelId: string }) => {
      this.handleLeaveChannel(socket, data.channelId);
    });

    // Typing indicators
    socket.on(WebSocketEvent.TYPING_START, (data: { channelId: string }) => {
      this.handleTypingStart(socket, data.channelId);
    });

    socket.on(WebSocketEvent.TYPING_STOP, (data: { channelId: string }) => {
      this.handleTypingStop(socket, data.channelId);
    });
  }

  /**
   * Handle user joining a channel
   */
  private handleJoinChannel(socket: Socket, channelId: string): void {
    const userId = (socket as any).userId;
    const userEmail = (socket as any).userEmail;

    socket.join(`channel:${channelId}`);

    logger.info('User joined channel', { userId, channelId });

    // Notify others in channel
    socket.to(`channel:${channelId}`).emit(WebSocketEvent.USER_JOINED, {
      userId,
      userEmail,
      channelId,
      timestamp: new Date(),
    });
  }

  /**
   * Handle user leaving a channel
   */
  private handleLeaveChannel(socket: Socket, channelId: string): void {
    const userId = (socket as any).userId;

    socket.leave(`channel:${channelId}`);
    logger.info('User left channel', { userId, channelId });

    socket.to(`channel:${channelId}`).emit(WebSocketEvent.USER_LEFT, {
      userId,
      channelId,
      timestamp: new Date(),
    });
  }

  /**
   * Handle typing indicators
   */
  private handleTypingStart(socket: Socket, channelId: string): void {
    const userId = (socket as any).userId;
    socket.to(`channel:${channelId}`).emit(WebSocketEvent.TYPING_START, {
      userId,
      channelId,
    });
  }

  private handleTypingStop(socket: Socket, channelId: string): void {
    const userId = (socket as any).userId;
    socket.to(`channel:${channelId}`).emit(WebSocketEvent.TYPING_STOP, {
      userId,
      channelId,
    });
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: Socket): void {
    const userId = (socket as any).userId;

    logger.info('WebSocket client disconnected', { socketId: socket.id, userId });

    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketUsers.delete(socket.id);
  }

  /**
   * Broadcast to channel
   */
  broadcastToChannel(channelId: string, event: WebSocketEvent, data: any): void {
    if (!this.io) return;
    this.io.to(`channel:${channelId}`).emit(event, { ...data, timestamp: new Date() });
  }

  /**
   * Send to specific user
   */
  sendToUser(userId: string, event: WebSocketEvent, data: any): void {
    if (!this.io) return;
    const userSockets = this.userSockets.get(userId);
    if (!userSockets) return;

    for (const socketId of userSockets) {
      this.io.to(socketId).emit(event, { ...data, timestamp: new Date() });
    }
  }

  /**
   * Broadcast agent thinking status
   */
  broadcastAgentThinking(channelId: string, agentId: string, isThinking: boolean): void {
    this.broadcastToChannel(channelId, WebSocketEvent.AGENT_THINKING, { agentId, isThinking });
  }

  /**
   * Get connected user count
   */
  getConnectedUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
