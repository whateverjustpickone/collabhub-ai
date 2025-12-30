/**
 * Query Triage and Classification
 * Digital Muse analyzes queries to determine complexity and routing strategy
 */

import { getOllamaClient } from './ollama-client';

export type QueryComplexity = 'simple' | 'moderate' | 'complex';
export type RoutingStrategy = 'local' | 'hybrid' | 'cloud-full';

export interface TriageResult {
  complexity: QueryComplexity;
  routingStrategy: RoutingStrategy;
  recommendedAgents: string[];
  estimatedCost: number;
  estimatedTimeMs: number;
  confidence: number;
  reasoning: string;
  canHandleLocally: boolean;
}

export interface UserPreferences {
  maxCost?: number;
  preferLocal?: boolean;
  maxLatency?: number;
}

/**
 * Triage a user query to determine optimal routing
 */
export async function triageQuery(
  query: string,
  userPreferences?: UserPreferences
): Promise<TriageResult> {
  const startTime = Date.now();

  try {
    const ollamaClient = getOllamaClient();

    // Check if Ollama is available
    const isAvailable = await ollamaClient.healthCheck();
    if (!isAvailable) {
      console.warn('[Triage] Ollama unavailable, defaulting to cloud strategy');
      return getDefaultCloudStrategy(query);
    }

    // Construct triage prompt
    const triagePrompt = `Analyze this user query and classify it for routing in a hybrid AI system.

USER QUERY: "${query}"

Consider:
1. **Complexity**: Simple (factual, definitions), Moderate (explanations, basic code), Complex (architecture, deep analysis)
2. **Requires Real-Time Data**: Does it need current web info?
3. **Code Generation**: Is it asking to write significant code?
4. **Multiple Perspectives**: Would multiple AI models add value?

Respond in JSON format ONLY:
{
  "complexity": "simple|moderate|complex",
  "can_handle_locally": true|false,
  "requires_realtime_data": true|false,
  "requires_code_generation": true|false,
  "benefits_from_multiple_models": true|false,
  "reasoning": "Brief explanation (max 100 chars)"
}`;

    const response = await ollamaClient.generate({
      prompt: triagePrompt,
      temperature: 0.3, // Lower temperature for consistent classification
      maxTokens: 512,
    });

    // Parse JSON response
    const jsonMatch = response.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Triage] Failed to parse JSON response', {
        response: response.response,
      });
      return getDefaultStrategy(query);
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Determine routing strategy
    const routingStrategy = determineRoutingStrategy(
      analysis,
      userPreferences
    );

    // Build triage result
    const triageResult: TriageResult = {
      complexity: analysis.complexity,
      routingStrategy: routingStrategy.strategy,
      recommendedAgents: routingStrategy.agents,
      estimatedCost: routingStrategy.cost,
      estimatedTimeMs: routingStrategy.timeMs,
      confidence: calculateConfidence(analysis),
      reasoning: analysis.reasoning,
      canHandleLocally: analysis.can_handle_locally && !analysis.requires_realtime_data,
    };

    const triageDuration = Date.now() - startTime;

    console.log('[Triage] Query classified', {
      complexity: triageResult.complexity,
      strategy: triageResult.routingStrategy,
      agents: triageResult.recommendedAgents,
      triageDurationMs: triageDuration,
    });

    return triageResult;
  } catch (error: any) {
    console.error('[Triage] Classification failed', {
      error: error.message,
      query: query.substring(0, 100),
    });

    // Fallback to heuristic-based triage
    return heuristicTriage(query, userPreferences);
  }
}

/**
 * Determine routing strategy based on analysis
 */
function determineRoutingStrategy(
  analysis: any,
  preferences?: UserPreferences
) {
  // User preferences override
  if (preferences?.preferLocal && analysis.can_handle_locally) {
    return {
      strategy: 'local' as RoutingStrategy,
      agents: ['digital-muse'],
      cost: 0,
      timeMs: 200,
    };
  }

  // Simple queries that can be handled locally
  if (
    analysis.complexity === 'simple' &&
    analysis.can_handle_locally &&
    !analysis.requires_realtime_data
  ) {
    return {
      strategy: 'local' as RoutingStrategy,
      agents: ['digital-muse'],
      cost: 0,
      timeMs: 200,
    };
  }

  // Moderate queries - hybrid approach
  if (
    analysis.complexity === 'moderate' ||
    (analysis.complexity === 'simple' && analysis.requires_realtime_data)
  ) {
    const agents = ['digital-muse'];

    // Add Perplexity for real-time data
    if (analysis.requires_realtime_data) {
      agents.push('perplexity-ai');
    } else {
      // Add 1-2 cloud agents for better quality
      agents.push('claude-3.5-sonnet');
      if (analysis.requires_code_generation) {
        agents.push('gpt-4-turbo');
      }
    }

    return {
      strategy: 'hybrid' as RoutingStrategy,
      agents,
      cost: agents.length * 0.015, // Rough estimate
      timeMs: 2500,
    };
  }

  // Complex queries - full executive team
  const cloudAgents = [
    'claude-3.5-sonnet',
    'gpt-4-turbo',
    'gemini-1.5-pro',
    'perplexity-ai',
  ];

  // Add Digital Muse for synthesis
  const agents = ['digital-muse', ...cloudAgents];

  return {
    strategy: 'cloud-full' as RoutingStrategy,
    agents,
    cost: 0.06, // Rough estimate for 4 cloud agents
    timeMs: 5000,
  };
}

/**
 * Calculate confidence score based on analysis
 */
function calculateConfidence(analysis: any): number {
  let confidence = 0.7; // Base confidence

  // Clear indicators increase confidence
  if (analysis.complexity === 'simple' && analysis.can_handle_locally) {
    confidence += 0.2;
  }

  if (analysis.complexity === 'complex' && analysis.benefits_from_multiple_models) {
    confidence += 0.15;
  }

  return Math.min(confidence, 0.99);
}

/**
 * Heuristic-based triage (fallback when Ollama is unavailable)
 */
function heuristicTriage(
  query: string,
  preferences?: UserPreferences
): TriageResult {
  const queryLower = query.toLowerCase();
  const queryLength = query.length;

  // Simple query indicators
  const simpleIndicators = [
    'what is',
    'define',
    'explain simply',
    'how do i',
    'what does',
    'who is',
    'when was',
  ];

  const isSimple = simpleIndicators.some((indicator) =>
    queryLower.includes(indicator)
  );

  // Complex query indicators
  const complexIndicators = [
    'analyze',
    'compare',
    'design',
    'architect',
    'review this code',
    'implement',
    'refactor',
  ];

  const isComplex = complexIndicators.some((indicator) =>
    queryLower.includes(indicator)
  );

  // Real-time data indicators
  const realtimeIndicators = [
    'latest',
    'current',
    'today',
    'recent',
    'news',
    'now',
  ];

  const needsRealtime = realtimeIndicators.some((indicator) =>
    queryLower.includes(indicator)
  );

  // Determine complexity
  let complexity: QueryComplexity;
  let routingStrategy: RoutingStrategy;
  let agents: string[];
  let cost: number;
  let timeMs: number;

  if (isSimple && queryLength < 200) {
    complexity = 'simple';
    routingStrategy = 'local';
    agents = ['digital-muse'];
    cost = 0;
    timeMs = 200;
  } else if (isComplex || queryLength > 500) {
    complexity = 'complex';
    routingStrategy = 'cloud-full';
    agents = [
      'digital-muse',
      'claude-3.5-sonnet',
      'gpt-4-turbo',
      'gemini-1.5-pro',
      'perplexity-ai',
    ];
    cost = 0.06;
    timeMs = 5000;
  } else {
    complexity = 'moderate';
    routingStrategy = needsRealtime ? 'hybrid' : 'hybrid';
    agents = needsRealtime
      ? ['digital-muse', 'perplexity-ai']
      : ['digital-muse', 'claude-3.5-sonnet'];
    cost = 0.02;
    timeMs = 2500;
  }

  // Apply user preferences
  if (preferences?.preferLocal && complexity === 'simple') {
    routingStrategy = 'local';
    agents = ['digital-muse'];
    cost = 0;
  }

  return {
    complexity,
    routingStrategy,
    recommendedAgents: agents,
    estimatedCost: cost,
    estimatedTimeMs: timeMs,
    confidence: 0.6, // Lower confidence for heuristic
    reasoning: 'Heuristic-based classification (Ollama unavailable)',
    canHandleLocally: complexity === 'simple' && !needsRealtime,
  };
}

/**
 * Get default cloud strategy (when all else fails)
 */
function getDefaultCloudStrategy(query: string): TriageResult {
  return {
    complexity: 'moderate',
    routingStrategy: 'cloud-full',
    recommendedAgents: [
      'claude-3.5-sonnet',
      'gpt-4-turbo',
      'gemini-1.5-pro',
      'perplexity-ai',
    ],
    estimatedCost: 0.06,
    estimatedTimeMs: 5000,
    confidence: 0.5,
    reasoning: 'Default cloud strategy (triage unavailable)',
    canHandleLocally: false,
  };
}

/**
 * Get default strategy (moderate hybrid)
 */
function getDefaultStrategy(query: string): TriageResult {
  return {
    complexity: 'moderate',
    routingStrategy: 'hybrid',
    recommendedAgents: ['digital-muse', 'claude-3.5-sonnet', 'gpt-4-turbo'],
    estimatedCost: 0.03,
    estimatedTimeMs: 2500,
    confidence: 0.7,
    reasoning: 'Default hybrid strategy',
    canHandleLocally: false,
  };
}
