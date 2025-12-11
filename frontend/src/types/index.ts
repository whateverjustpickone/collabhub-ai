// CollabHub AI - TypeScript Type Definitions

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

// LLM Provider Types
export type LLMProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'perplexity'
  | 'deepseek'
  | 'xai'
  | 'manus';

// Agent Types
export interface Agent {
  id: string;
  name: string;
  provider: LLMProvider;
  model: string;
  avatar: string;
  description: string;
  status: 'online' | 'offline' | 'thinking';
  capabilities: string[];
  color: string;
  isExecutiveTeam: boolean;
  priority: number; // 1 = Big 4, 2 = Phase 2
}

// Message Types
export interface Message {
  id: string;
  channelId: string;
  content: string;
  authorType: 'system' | 'human' | 'agent';
  authorId: string;
  authorName: string;
  agentProvider?: LLMProvider;
  timestamp: string;
  veraHash?: string;
  veraContributionId?: string;
  reactions?: Reaction[];
  attachments?: Attachment[];
}

export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  name: string;
  size?: number;
}

// VERA Attribution Types
export interface VERAContribution {
  id: string;
  messageId: string;
  agentId: string;
  agentName: string;
  agentProvider: LLMProvider;
  content: string;
  sha256Hash: string;
  timestamp: string;
  tokens?: number;
  cost?: number;
}

export interface VERAReport {
  channelId: string;
  totalContributions: number;
  totalContributors: number;
  contributions: VERAContribution[];
  generatedAt: string;
}

// Channel/Project Types
export interface Channel {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: 'chat' | 'meeting' | 'whiteboard';
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  type: 'human' | 'agent';
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  agentProvider?: LLMProvider;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  channels: Channel[];
  createdAt: string;
  updatedAt: string;
}

// Session Recording Types
export interface SessionRecording {
  id: string;
  channelId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'recording' | 'paused' | 'stopped';
  fileUrl?: string;
}

// UI State Types
export interface UIState {
  sidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  currentTheme: 'light' | 'dark';
  activeChannel?: string;
  activeProject?: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

// Executive Team Agent Profiles
export const EXECUTIVE_TEAM_AGENTS: Agent[] = [
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude',
    provider: 'anthropic',
    model: 'claude-3.5-sonnet-20241022',
    avatar: '/agents/claude.svg',
    description: 'Strategic thinking, ethical reasoning, long context analysis',
    status: 'online',
    capabilities: ['Strategic Planning', 'Ethical Oversight', 'Complex Problem-Solving'],
    color: '#D97706',
    isExecutiveTeam: true,
    priority: 1,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4',
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    avatar: '/agents/gpt4.svg',
    description: 'General excellence, creative problem-solving, broad knowledge',
    status: 'online',
    capabilities: ['Creative Ideation', 'General Intelligence', 'Versatile Analysis'],
    color: '#10B981',
    isExecutiveTeam: true,
    priority: 1,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini',
    provider: 'google',
    model: 'gemini-1.5-pro',
    avatar: '/agents/gemini.svg',
    description: 'Multimodal analysis, deep research, large-scale context',
    status: 'online',
    capabilities: ['Multimodal Understanding', 'Deep Research', '1M+ Token Context'],
    color: '#3B82F6',
    isExecutiveTeam: true,
    priority: 1,
  },
  {
    id: 'perplexity-ai',
    name: 'Perplexity',
    provider: 'perplexity',
    model: 'perplexity-online',
    avatar: '/agents/perplexity.svg',
    description: 'Real-time research, citation-backed answers, fact-checking',
    status: 'online',
    capabilities: ['Real-Time Research', 'Fact-Checking', 'Citations'],
    color: '#6366F1',
    isExecutiveTeam: true,
    priority: 1,
  },
  {
    id: 'deepseek-v2',
    name: 'DeepSeek',
    provider: 'deepseek',
    model: 'deepseek-v2',
    avatar: '/agents/deepseek.svg',
    description: 'Advanced reasoning, technical analysis, code understanding',
    status: 'offline',
    capabilities: ['Technical Architecture', 'Deep Reasoning', 'Systems Analysis'],
    color: '#8B5CF6',
    isExecutiveTeam: true,
    priority: 2,
  },
  {
    id: 'grok-2',
    name: 'Grok',
    provider: 'xai',
    model: 'grok-2',
    avatar: '/agents/grok.svg',
    description: 'Real-time information, unconventional perspectives',
    status: 'offline',
    capabilities: ['Alternative Viewpoints', 'Real-Time Data', 'Creative Disruption'],
    color: '#EC4899',
    isExecutiveTeam: true,
    priority: 2,
  },
  {
    id: 'manus',
    name: 'Manus',
    provider: 'manus',
    model: 'manus-v1',
    avatar: '/agents/manus.svg',
    description: 'Autonomous agent, independent reasoning, task execution',
    status: 'offline',
    capabilities: ['Autonomous Workflows', 'Task Execution', 'Dynamic Planning'],
    color: '#F59E0B',
    isExecutiveTeam: true,
    priority: 2,
  },
];
