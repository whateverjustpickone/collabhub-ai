// CollabHub AI - Zustand Store

import { create } from 'zustand';
import { AuthState, User, Channel, Message, Agent, EXECUTIVE_TEAM_AGENTS } from '../types/index.ts';

interface AppState {
  // Auth
  auth: AuthState;
  setAuth: (auth: Partial<AuthState>) => void;
  login: (user: User, token: string) => void;
  logout: () => void;

  // UI State
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  // Current Selection
  currentChannel: Channel | null;
  setCurrentChannel: (channel: Channel | null) => void;

  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;

  // Agents
  agents: Agent[];
  activeAgents: string[]; // IDs of agents active in current session
  toggleAgent: (agentId: string) => void;
  setAgentStatus: (agentId: string, status: 'online' | 'offline' | 'thinking') => void;

  // Session Recording
  isRecording: boolean;
  recordingStartTime: Date | null;
  toggleRecording: () => void;

  // VERA Attribution
  contributionCount: number;
  contributorCount: number;
  incrementContributions: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth initial state
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  },
  setAuth: (auth) =>
    set((state) => ({
      auth: { ...state.auth, ...auth },
    })),
  login: (user, token) =>
    set({
      auth: {
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      },
    }),
  logout: () =>
    set({
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      },
    }),

  // UI State
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  toggleLeftSidebar: () =>
    set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed })),
  toggleRightSidebar: () =>
    set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed })),

  // Current Selection
  currentChannel: null,
  setCurrentChannel: (channel) => set({ currentChannel: channel }),

  // Messages
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setMessages: (messages) => set({ messages }),

  // Agents
  agents: EXECUTIVE_TEAM_AGENTS,
  activeAgents: [
    // Default 4 active agents for new chat sessions
    'claude-3.5-sonnet',  // Claude (Anthropic)
    'gpt-4-turbo',        // ChatGPT (OpenAI)
    'manus-1',            // Manus AI (Butterfly Effect)
    'perplexity-ai',      // Perplexity
  ], // Default active agents
  toggleAgent: (agentId) =>
    set((state) => ({
      activeAgents: state.activeAgents.includes(agentId)
        ? state.activeAgents.filter((id) => id !== agentId)
        : [...state.activeAgents, agentId],
    })),
  setAgentStatus: (agentId, status) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, status } : agent
      ),
    })),

  // Session Recording
  isRecording: false,
  recordingStartTime: null,
  toggleRecording: () =>
    set((state) => ({
      isRecording: !state.isRecording,
      recordingStartTime: !state.isRecording ? new Date() : null,
    })),

  // VERA Attribution
  contributionCount: 0,
  contributorCount: 12, // 12-member Executive Team
  incrementContributions: () =>
    set((state) => ({
      contributionCount: state.contributionCount + 1,
    })),
}));
