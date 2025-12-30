/**
 * Intelligent Query Router
 * Routes queries between local (Digital Muse) and cloud (Executive Team) based on complexity
 */

import {
  getDigitalMuseService,
  DigitalMuseService,
  DigitalMuseResponse,
  TriageResult,
  UserPreferences,
  AgentResponse,
} from '../digital-muse/digital-muse.service';
import { EnrichedContext } from '../context/context-injection.service';

// Import cloud LLM services
import { anthropicChat } from '../llm-minimal/anthropic';
import { openaiChat } from '../llm-minimal/openai';
import { googleChat } from '../llm-minimal/google';
import { perplexityChat } from '../llm-minimal/perplexity';
import { mistralChat } from '../llm-minimal/mistral';
import { grokChat } from '../llm-minimal/grok';
import { deepseekChat } from '../llm-minimal/deepseek';
import { manusChat } from '../llm-minimal/manus';
import { llamaChat } from '../llm-minimal/llama';
import { cohereChat } from '../llm-minimal/cohere';
import { qwenChat } from '../llm-minimal/qwen';
import { inflectionChat } from '../llm-minimal/inflection';

export interface RoutedResponse {
  answer: string;
  routingStrategy: 'local' | 'hybrid' | 'cloud-full';
  agentsUsed: string[];
  executionTimeMs: number;
  totalCost: number;
  triageResult?: TriageResult;
  digitalMuseBadge?: string;
}

export class IntelligentRouter {
  private digitalMuse: DigitalMuseService;
  private cloudAgents: Map<string, Function>;

  constructor() {
    this.digitalMuse = getDigitalMuseService();

    // Map of agent IDs to their chat functions
    this.cloudAgents = new Map([
      ['claude-3.5-sonnet', anthropicChat],
      ['claude-3-opus', anthropicChat],
      ['gpt-4-turbo', openaiChat],
      ['gpt-4', openaiChat],
      ['gemini-1.5-pro', googleChat],
      ['perplexity-ai', perplexityChat],
      ['mistral-large', mistralChat],
      ['grok-2', grokChat],
      ['deepseek-chat', deepseekChat],
      ['manus-1', manusChat],
      ['llama-3.3', llamaChat],
      ['command-r-plus', cohereChat],
      ['qwen-turbo', qwenChat],
      ['inflection-3-pi', inflectionChat],
    ]);

    console.log('[IntelligentRouter] Initialized with 12 cloud agents');
  }

  /**
   * Route a query intelligently between local and cloud
   */
  async route(
    query: string,
    conversationHistory?: Array<{ role: string; content: string; author?: string }>,
    enrichedContext?: EnrichedContext,
    userPreferences?: UserPreferences
  ): Promise<RoutedResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Triage the query
      console.log('[IntelligentRouter] Triaging query...');
      const triageResult = await this.digitalMuse.triage(query, userPreferences);

      console.log('[IntelligentRouter] Triage complete', {
        complexity: triageResult.complexity,
        strategy: triageResult.routingStrategy,
        recommendedAgents: triageResult.recommendedAgents,
        estimatedCost: triageResult.estimatedCost,
      });

      // Step 2: Route based on triage result
      let response: RoutedResponse;

      if (triageResult.routingStrategy === 'local') {
        response = await this.routeLocal(query, conversationHistory, enrichedContext, triageResult);
      } else if (triageResult.routingStrategy === 'hybrid') {
        response = await this.routeHybrid(
          query,
          conversationHistory,
          enrichedContext,
          triageResult
        );
      } else {
        response = await this.routeCloudFull(
          query,
          conversationHistory,
          enrichedContext,
          triageResult
        );
      }

      const totalTimeMs = Date.now() - startTime;

      console.log('[IntelligentRouter] Routing complete', {
        strategy: response.routingStrategy,
        agentsUsed: response.agentsUsed,
        totalTimeMs,
        totalCost: response.totalCost,
      });

      return {
        ...response,
        executionTimeMs: totalTimeMs,
        triageResult,
      };
    } catch (error: any) {
      console.error('[IntelligentRouter] Routing failed', {
        error: error.message,
      });

      // Fallback: Use single cloud agent (Claude)
      return this.fallbackRoute(query, conversationHistory, enrichedContext);
    }
  }

  /**
   * Route entirely to Digital Muse (local)
   */
  private async routeLocal(
    query: string,
    conversationHistory?: Array<{ role: string; content: string; author?: string }>,
    enrichedContext?: EnrichedContext,
    triageResult?: TriageResult
  ): Promise<RoutedResponse> {
    console.log('[IntelligentRouter] Routing to local (Digital Muse)');

    const response = await this.digitalMuse.answerSimple(
      query,
      conversationHistory,
      enrichedContext
    );

    return {
      answer: response.answer,
      routingStrategy: 'local',
      agentsUsed: ['digital-muse'],
      executionTimeMs: response.executionTimeMs,
      totalCost: 0,
      digitalMuseBadge: '🎨 Handled locally by Digital Muse',
    };
  }

  /**
   * Route with hybrid approach (local preprocessing + 1-2 cloud agents + local synthesis)
   */
  private async routeHybrid(
    query: string,
    conversationHistory?: Array<{ role: string; content: string; author?: string }>,
    enrichedContext?: EnrichedContext,
    triageResult?: TriageResult
  ): Promise<RoutedResponse> {
    console.log('[IntelligentRouter] Routing with hybrid approach');

    const agentsToConsult = triageResult?.recommendedAgents.filter(
      (agent) => agent !== 'digital-muse'
    ) || ['claude-3.5-sonnet'];

    // Step 1: Prepare context with Digital Muse
    let preparedContext = enrichedContext;
    if (enrichedContext) {
      const contextString = await this.digitalMuse.prepareContext(enrichedContext);
      preparedContext = {
        ...enrichedContext,
        metadata: {
          ...enrichedContext.metadata,
          preparedByDigitalMuse: true,
          originalSize: JSON.stringify(enrichedContext).length,
          preparedSize: contextString.length,
        },
      };
    }

    // Step 2: Consult 1-2 cloud agents in parallel
    const cloudResponses = await this.consultCloudAgents(
      agentsToConsult.slice(0, 2),
      query,
      conversationHistory,
      preparedContext
    );

    // If only one cloud response, return it directly
    if (cloudResponses.length === 1) {
      return {
        answer: cloudResponses[0].content,
        routingStrategy: 'hybrid',
        agentsUsed: ['digital-muse', cloudResponses[0].agent],
        executionTimeMs: 0, // Will be set by caller
        totalCost: 0.015, // Rough estimate
        digitalMuseBadge: '🎨 Context prepared by Digital Muse',
      };
    }

    // Step 3: Synthesize responses with Digital Muse
    const synthesized = await this.digitalMuse.synthesize(query, cloudResponses);

    return {
      answer: synthesized.synthesizedAnswer,
      routingStrategy: 'hybrid',
      agentsUsed: ['digital-muse', ...cloudResponses.map((r) => r.agent)],
      executionTimeMs: synthesized.executionTimeMs,
      totalCost: cloudResponses.length * 0.015, // Rough estimate
      digitalMuseBadge: '🎨 Synthesized by Digital Muse',
    };
  }

  /**
   * Route to full cloud Executive Team
   */
  private async routeCloudFull(
    query: string,
    conversationHistory?: Array<{ role: string; content: string; author?: string }>,
    enrichedContext?: EnrichedContext,
    triageResult?: TriageResult
  ): Promise<RoutedResponse> {
    console.log('[IntelligentRouter] Routing to full cloud Executive Team');

    const agentsToConsult = triageResult?.recommendedAgents.filter(
      (agent) => agent !== 'digital-muse'
    ) || ['claude-3.5-sonnet', 'gpt-4-turbo', 'gemini-1.5-pro', 'perplexity-ai'];

    // Step 1: Prepare context with Digital Muse
    let preparedContext = enrichedContext;
    if (enrichedContext) {
      const contextString = await this.digitalMuse.prepareContext(enrichedContext);
      preparedContext = {
        ...enrichedContext,
        metadata: {
          ...enrichedContext.metadata,
          preparedByDigitalMuse: true,
        },
      };
    }

    // Step 2: Consult multiple cloud agents in parallel
    const cloudResponses = await this.consultCloudAgents(
      agentsToConsult,
      query,
      conversationHistory,
      preparedContext
    );

    // Step 3: Synthesize responses with Digital Muse
    const synthesized = await this.digitalMuse.synthesize(query, cloudResponses);

    return {
      answer: synthesized.synthesizedAnswer,
      routingStrategy: 'cloud-full',
      agentsUsed: ['digital-muse', ...cloudResponses.map((r) => r.agent)],
      executionTimeMs: synthesized.executionTimeMs,
      totalCost: cloudResponses.length * 0.015, // Rough estimate
      digitalMuseBadge: '🎨 Synthesized by Digital Muse',
    };
  }

  /**
   * Consult multiple cloud agents in parallel
   */
  private async consultCloudAgents(
    agentIds: string[],
    query: string,
    conversationHistory?: Array<{ role: string; content: string; author?: string }>,
    enrichedContext?: EnrichedContext
  ): Promise<AgentResponse[]> {
    const promises = agentIds.map(async (agentId) => {
      try {
        const chatFunction = this.cloudAgents.get(agentId);
        if (!chatFunction) {
          console.warn(`[IntelligentRouter] Unknown agent: ${agentId}`);
          return null;
        }

        console.log(`[IntelligentRouter] Consulting ${agentId}...`);

        const response = await chatFunction(query, conversationHistory, enrichedContext);

        return {
          agent: agentId,
          content: response,
          timestamp: new Date(),
          confidence: 0.85,
        } as AgentResponse;
      } catch (error: any) {
        console.error(`[IntelligentRouter] ${agentId} failed`, {
          error: error.message,
        });
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((r) => r !== null) as AgentResponse[];
  }

  /**
   * Fallback routing when intelligent routing fails
   */
  private async fallbackRoute(
    query: string,
    conversationHistory?: Array<{ role: string; content: string; author?: string }>,
    enrichedContext?: EnrichedContext
  ): Promise<RoutedResponse> {
    console.warn('[IntelligentRouter] Using fallback routing (Claude only)');

    try {
      const response = await anthropicChat(query, conversationHistory, enrichedContext);

      return {
        answer: response,
        routingStrategy: 'cloud-full',
        agentsUsed: ['claude-3.5-sonnet'],
        executionTimeMs: 0,
        totalCost: 0.015,
      };
    } catch (error: any) {
      throw new Error(`All routing strategies failed: ${error.message}`);
    }
  }

  /**
   * Health check for routing system
   */
  async healthCheck(): Promise<{
    digitalMuse: { available: boolean; model: string };
    cloudAgents: { total: number; available: number };
  }> {
    const digitalMuseHealth = await this.digitalMuse.healthCheck();

    return {
      digitalMuse: {
        available: digitalMuseHealth.available,
        model: digitalMuseHealth.model,
      },
      cloudAgents: {
        total: this.cloudAgents.size,
        available: this.cloudAgents.size, // Assuming all cloud agents are available
      },
    };
  }
}

// Singleton instance
let intelligentRouterInstance: IntelligentRouter | null = null;

export function getIntelligentRouter(): IntelligentRouter {
  if (!intelligentRouterInstance) {
    intelligentRouterInstance = new IntelligentRouter();
  }
  return intelligentRouterInstance;
}
