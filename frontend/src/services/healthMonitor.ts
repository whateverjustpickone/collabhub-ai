// Health Monitoring Service
// Periodically checks the health status of LLM providers

import { useAppStore } from '../store/index';

const API_BASE_URL = 'http://localhost:3001';
const HEALTH_CHECK_INTERVAL = 30000; // Check every 30 seconds

// Map agent IDs to their provider names (12 Executive Team members)
const AGENT_TO_PROVIDER_MAP: Record<string, string> = {
  'claude-3.5-sonnet': 'anthropic',
  'gpt-4-turbo': 'openai',
  'gemini-1.5-pro': 'google',
  'perplexity-ai': 'perplexity',
  'mistral-large': 'mistral',
  'grok-2': 'xai',
  'deepseek-chat': 'deepseek',
  'manus-1': 'manus',
  'llama-3.3': 'meta',
  'command-r-plus': 'cohere',
  'qwen-turbo': 'alibaba',
  'inflection-3-pi': 'inflection',
};

export async function checkProviderHealth(provider: string): Promise<'online' | 'offline'> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health/${provider}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data.status === 'online' ? 'online' : 'offline';
  } catch (error) {
    console.error(`[HealthMonitor] Error checking ${provider}:`, error);
    return 'offline';
  }
}

export async function checkAllAgentsHealth() {
  const store = useAppStore.getState();
  const agents = store.agents;

  // Check health for all agents
  const healthChecks = agents.map(async (agent) => {
    const provider = AGENT_TO_PROVIDER_MAP[agent.id];
    if (!provider) {
      console.warn(`[HealthMonitor] No provider mapping for agent: ${agent.id}`);
      return;
    }

    const status = await checkProviderHealth(provider);

    // Update agent status in store
    store.setAgentStatus(agent.id, status);

    console.log(`[HealthMonitor] ${agent.name}: ${status}`);
  });

  await Promise.all(healthChecks);
}

let healthMonitorInterval: NodeJS.Timeout | null = null;

export function startHealthMonitoring() {
  if (healthMonitorInterval) {
    console.log('[HealthMonitor] Already running');
    return;
  }

  console.log('[HealthMonitor] Starting health monitoring');

  // Run initial health check
  checkAllAgentsHealth();

  // Set up periodic health checks
  healthMonitorInterval = setInterval(() => {
    checkAllAgentsHealth();
  }, HEALTH_CHECK_INTERVAL);
}

export function stopHealthMonitoring() {
  if (healthMonitorInterval) {
    console.log('[HealthMonitor] Stopping health monitoring');
    clearInterval(healthMonitorInterval);
    healthMonitorInterval = null;
  }
}
