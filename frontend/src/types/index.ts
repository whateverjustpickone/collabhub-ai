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
  | 'mistral'
  | 'xai'
  | 'deepseek'
  | 'manus'
  | 'meta'
  | 'cohere'
  | 'alibaba'
  | 'inflection';

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

// Executive Team Agent Profiles - 12 Members
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
    id: 'mistral-large',
    name: 'Mistral',
    provider: 'mistral',
    model: 'mistral-large-latest',
    avatar: '/agents/mistral.svg',
    description: 'European AI, multilingual expertise, regulatory compliance',
    status: 'online',
    capabilities: ['Multilingual', 'European Compliance', 'Efficient Reasoning'],
    color: '#F97316',
    isExecutiveTeam: true,
    priority: 1,
  },
  {
    id: 'grok-2',
    name: 'Grok',
    provider: 'xai',
    model: 'grok-2-1212',
    avatar: '/agents/grok.svg',
    description: 'Real-time information, unconventional perspectives, tech insights',
    status: 'online',
    capabilities: ['Alternative Viewpoints', 'Real-Time Data', 'Creative Disruption'],
    color: '#EC4899',
    isExecutiveTeam: true,
    priority: 1,
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek',
    provider: 'deepseek',
    model: 'deepseek-chat',
    avatar: '/agents/deepseek.svg',
    description: 'Advanced reasoning, technical analysis, code understanding',
    status: 'online',
    capabilities: ['Technical Architecture', 'Deep Reasoning', 'Systems Analysis'],
    color: '#8B5CF6',
    isExecutiveTeam: true,
    priority: 1,
  },
  {
    id: 'manus-1',
    name: 'Manus AI',
    provider: 'manus',
    model: 'manus-1',
    avatar: '/agents/manus.svg',
    description: 'Asia-Pacific insights, multilateral collaboration, business pragmatism',
    status: 'offline',
    capabilities: ['Asia-Pacific Markets', 'Cross-Cultural Collaboration', 'Business Strategy'],
    color: '#F59E0B',
    isExecutiveTeam: true,
    priority: 2,
  },
  {
    id: 'llama-3.3',
    name: 'Llama',
    provider: 'meta',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    avatar: '/agents/llama.svg',
    description: 'Open-source leader, democratizing AI access, cost-effective performance',
    status: 'offline',
    capabilities: ['Open Source', 'Community-Driven', 'Cost-Effective'],
    color: '#0EA5E9',
    isExecutiveTeam: true,
    priority: 2,
  },
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    model: 'command-r-plus',
    avatar: '/agents/cohere.svg',
    description: 'Enterprise RAG specialist, production-grade deployment, business applications',
    status: 'offline',
    capabilities: ['Enterprise RAG', 'Production-Grade', 'Business Intelligence'],
    color: '#14B8A6',
    isExecutiveTeam: true,
    priority: 2,
  },
  {
    id: 'qwen-turbo',
    name: 'Qwen',
    provider: 'alibaba',
    model: 'qwen-turbo',
    avatar: '/agents/qwen.svg',
    description: 'Chinese language expertise, multimodal understanding, Eastern tech approaches',
    status: 'offline',
    capabilities: ['Chinese Language', 'Multimodal', 'Eastern Perspectives'],
    color: '#FF6A00',
    isExecutiveTeam: true,
    priority: 2,
  },
  {
    id: 'inflection-3-pi',
    name: 'Pi',
    provider: 'inflection',
    model: 'inflection-3-pi',
    avatar: '/agents/pi.svg',
    description: 'Personal AI, human accessibility, emotional intelligence, "explain like I\'m 5"',
    status: 'offline',
    capabilities: ['Human Accessibility', 'Emotional Intelligence', 'Personal Touch'],
    color: '#A855F7',
    isExecutiveTeam: true,
    priority: 2,
  },
];
