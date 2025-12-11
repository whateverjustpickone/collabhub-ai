/**
 * TypeScript Type Definitions
 * Shared types across the backend application
 */

import { Request } from 'express';

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  AGENT = 'AGENT',
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// ============================================
// AI AGENTS
// ============================================

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRAINING = 'TRAINING',
  SUSPENDED = 'SUSPENDED',
}

export enum LLMProvider {
  ANTHROPIC = 'ANTHROPIC',
  OPENAI = 'OPENAI',
  GOOGLE = 'GOOGLE',
  XAI = 'XAI',
  DEEPSEEK = 'DEEPSEEK',
  PERPLEXITY = 'PERPLEXITY',
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  provider: LLMProvider;
  model: string;
  status: AgentStatus;
  personality: PersonalityMatrix;
  avatar?: AvatarConfig;
  specialties: string[];
  education: EducationRecord[];
  certifications: CertificationRecord[];
}

export interface PersonalityMatrix {
  directness: number; // 1-10
  creativity: number; // 1-10
  formality: number; // 1-10
  enthusiasm: number; // 1-10
}

export interface AvatarConfig {
  didAgentId?: string;
  elevenlabsVoiceId?: string;
  appearance: {
    gender: string;
    age: string;
    ethnicity: string;
    attire: string;
  };
  voice: {
    tone: string;
    pace: string;
    style: string;
  };
}

export interface EducationRecord {
  institution: string;
  program: string;
  competencyUnits: number;
  completedAt: Date;
  gpa?: number;
}

export interface CertificationRecord {
  name: string;
  tier: 'FOUNDATION' | 'PROFESSIONAL' | 'ADVANCED' | 'MASTER';
  issuedAt: Date;
  expiresAt?: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

// ============================================
// MESSAGES & COMMUNICATION
// ============================================

export enum MessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
  COMMAND = 'COMMAND',
  FILE = 'FILE',
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderType: 'USER' | 'AGENT' | 'SYSTEM';
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  veraHash: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageCreate {
  channelId: string;
  content: string;
  type?: MessageType;
  metadata?: Record<string, any>;
  parentId?: string;
}

// ============================================
// VERA ATTRIBUTION
// ============================================

export interface VERAContribution {
  id: string;
  messageId: string;
  agentId: string;
  contributionType: ContributionType;
  content: string;
  contentHash: string; // SHA-256
  metadata: Record<string, any>;
  verifiedAt: Date;
  blockchainTxId?: string; // Future: blockchain transaction ID
}

export enum ContributionType {
  TEXT = 'TEXT',
  CODE = 'CODE',
  DESIGN = 'DESIGN',
  ANALYSIS = 'ANALYSIS',
  DECISION = 'DECISION',
  REVIEW = 'REVIEW',
}

export interface VERACertificate {
  id: string;
  projectId: string;
  agentId: string;
  contributionCount: number;
  contributionTypes: ContributionType[];
  totalTokens: number;
  generatedAt: Date;
  certificateUrl: string;
}

// ============================================
// PROJECTS & CHANNELS
// ============================================

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED',
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  organizationId?: string;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC';
  allowedAgents: string[];
  humanOversightLevel: 1 | 2 | 3 | 4; // 4-level autonomy matrix
  veraEnabled: boolean;
  recordingSessions: boolean;
}

export enum ChannelType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  VOICE = 'VOICE',
  MEETING = 'MEETING',
}

export interface Channel {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: ChannelType;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TASKS & WORKFLOW
// ============================================

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId?: string;
  assignedToType?: 'USER' | 'AGENT';
  requiresHumanApproval: boolean;
  dependencies: string[]; // Task IDs
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ============================================
// HUMAN OVERSIGHT
// ============================================

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_CHANGES = 'REQUIRES_CHANGES',
}

export interface HumanApproval {
  id: string;
  taskId?: string;
  messageId?: string;
  agentId: string;
  reviewerId: string;
  status: ApprovalStatus;
  feedback?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

// ============================================
// LLM SERVICE
// ============================================

export interface LLMRequest {
  provider: LLMProvider;
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  metadata?: Record<string, any>;
}

// ============================================
// WEBSOCKET EVENTS
// ============================================

export enum WebSocketEvent {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // Authentication
  AUTH = 'auth',
  AUTH_SUCCESS = 'auth:success',
  AUTH_FAILURE = 'auth:failure',

  // Channels
  JOIN_CHANNEL = 'channel:join',
  LEAVE_CHANNEL = 'channel:leave',

  // Messages
  MESSAGE_SEND = 'message:send',
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_UPDATED = 'message:updated',
  MESSAGE_DELETED = 'message:deleted',

  // Typing Indicators
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',

  // Agent Status
  AGENT_STATUS = 'agent:status',
  AGENT_THINKING = 'agent:thinking',

  // VERA
  VERA_CONTRIBUTION = 'vera:contribution',

  // Presence
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  USER_STATUS = 'user:status',
}

export interface WebSocketPayload<T = any> {
  event: WebSocketEvent;
  data: T;
  timestamp: Date;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    timestamp: Date;
  };
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// ERROR TYPES
// ============================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      502,
      message || `External service error: ${service}`,
      'EXTERNAL_SERVICE_ERROR',
      { service }
    );
    this.name = 'ExternalServiceError';
  }
}
