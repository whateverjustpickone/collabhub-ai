/**
 * Response Synthesis
 * Digital Muse combines multiple AI agent responses into cohesive answers
 */

import { getOllamaClient } from './ollama-client';

export interface AgentResponse {
  agent: string;
  content: string;
  confidence?: number;
  timestamp: Date;
}

export interface SynthesizedResponse {
  synthesizedAnswer: string;
  keyInsights: string[];
  consensusScore: number;
  contributingAgents: string[];
  executionTimeMs: number;
  cost: number;
}

/**
 * Synthesize multiple agent responses into a single cohesive answer
 */
export async function synthesizeResponses(
  query: string,
  responses: AgentResponse[]
): Promise<SynthesizedResponse> {
  const startTime = Date.now();

  try {
    const ollamaClient = getOllamaClient();

    // Check if Ollama is available
    const isAvailable = await ollamaClient.healthCheck();
    if (!isAvailable) {
      console.warn('[Synthesis] Ollama unavailable, using fallback synthesis');
      return fallbackSynthesis(query, responses);
    }

    // Build synthesis prompt
    const synthesisPrompt = buildSynthesisPrompt(query, responses);

    // Generate synthesis
    const response = await ollamaClient.generate({
      prompt: synthesisPrompt,
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Parse synthesized response
    const synthesizedAnswer = response.response;

    // Extract key insights
    const keyInsights = extractKeyInsights(synthesizedAnswer);

    // Calculate consensus score
    const consensusScore = calculateConsensusScore(responses);

    const executionTimeMs = Date.now() - startTime;

    console.log('[Synthesis] Responses synthesized', {
      numResponses: responses.length,
      consensusScore,
      executionTimeMs,
    });

    return {
      synthesizedAnswer,
      keyInsights,
      consensusScore,
      contributingAgents: responses.map((r) => r.agent),
      executionTimeMs,
      cost: 0, // Local synthesis is free
    };
  } catch (error: any) {
    console.error('[Synthesis] Failed to synthesize responses', {
      error: error.message,
    });

    return fallbackSynthesis(query, responses);
  }
}

/**
 * Build synthesis prompt for Digital Muse
 */
function buildSynthesisPrompt(
  query: string,
  responses: AgentResponse[]
): string {
  const responsesText = responses
    .map(
      (r, idx) =>
        `### Response ${idx + 1} (${r.agent}):\n${r.content}\n\n`
    )
    .join('');

  return `You are the synthesis engine for CollabHub AI's Executive Team. Multiple AI agents have responded to a user query. Your task is to synthesize their insights into a single, cohesive, comprehensive answer.

USER QUERY: "${query}"

AGENT RESPONSES:
${responsesText}

SYNTHESIS GUIDELINES:
1. **Identify Consensus**: Find common themes and agreements across responses
2. **Highlight Unique Insights**: Include valuable unique perspectives from each agent
3. **Resolve Contradictions**: If agents disagree, present both views fairly
4. **Structure Clearly**: Organize the information logically
5. **Be Concise**: Remove redundancy while keeping all valuable information
6. **Attribute When Needed**: Mention which agent provided key insights if relevant

SYNTHESIZED ANSWER:`;
}

/**
 * Extract key insights from synthesized response
 */
function extractKeyInsights(synthesizedAnswer: string): string[] {
  const insights: string[] = [];

  // Look for numbered lists
  const numberedPattern = /\d+\.\s+([^\n]+)/g;
  let match;
  while ((match = numberedPattern.exec(synthesizedAnswer)) !== null) {
    insights.push(match[1].trim());
  }

  // Look for bullet points
  const bulletPattern = /[•\-*]\s+([^\n]+)/g;
  while ((match = bulletPattern.exec(synthesizedAnswer)) !== null) {
    insights.push(match[1].trim());
  }

  // If no structured insights, extract first sentences from paragraphs
  if (insights.length === 0) {
    const paragraphs = synthesizedAnswer.split('\n\n');
    insights.push(
      ...paragraphs
        .map((p) => p.split('.')[0].trim())
        .filter((s) => s.length > 20 && s.length < 200)
        .slice(0, 5)
    );
  }

  return insights.slice(0, 5); // Top 5 insights
}

/**
 * Calculate consensus score based on response similarity
 */
function calculateConsensusScore(responses: AgentResponse[]): number {
  if (responses.length < 2) {
    return 1.0; // Perfect consensus with only one response
  }

  // Simple word overlap analysis
  const wordSets = responses.map((r) => {
    const words = r.content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3); // Filter out short words
    return new Set(words);
  });

  let totalOverlap = 0;
  let comparisons = 0;

  // Calculate pairwise overlap
  for (let i = 0; i < wordSets.length; i++) {
    for (let j = i + 1; j < wordSets.length; j++) {
      const intersection = new Set(
        [...wordSets[i]].filter((x) => wordSets[j].has(x))
      );
      const union = new Set([...wordSets[i], ...wordSets[j]]);

      const jaccardSimilarity = intersection.size / union.size;
      totalOverlap += jaccardSimilarity;
      comparisons++;
    }
  }

  const averageOverlap = comparisons > 0 ? totalOverlap / comparisons : 0;

  // Scale to 0-1 range (Jaccard similarity is already 0-1, but boost it slightly)
  const consensusScore = Math.min(averageOverlap * 1.5, 1.0);

  return Math.round(consensusScore * 100) / 100; // Round to 2 decimals
}

/**
 * Fallback synthesis when Ollama is unavailable
 */
function fallbackSynthesis(
  query: string,
  responses: AgentResponse[]
): SynthesizedResponse {
  // Simple concatenation with headers
  const synthesizedAnswer = responses
    .map((r) => {
      const header = `## ${r.agent}\n\n`;
      return header + r.content;
    })
    .join('\n\n---\n\n');

  // Extract first sentence from each response as insight
  const keyInsights = responses
    .map((r) => {
      const firstSentence = r.content.split('.')[0].trim();
      return firstSentence + '.';
    })
    .filter((s) => s.length > 20)
    .slice(0, 5);

  return {
    synthesizedAnswer,
    keyInsights,
    consensusScore: 0.5, // Unknown consensus
    contributingAgents: responses.map((r) => r.agent),
    executionTimeMs: 0,
    cost: 0,
  };
}

/**
 * Summarize long text using Digital Muse
 */
export async function summarize(
  content: string,
  maxLength: number = 500
): Promise<string> {
  try {
    const ollamaClient = getOllamaClient();

    const isAvailable = await ollamaClient.healthCheck();
    if (!isAvailable) {
      // Fallback: Simple truncation
      return content.length > maxLength
        ? content.substring(0, maxLength) + '...'
        : content;
    }

    const prompt = `Summarize the following content in approximately ${maxLength} characters. Be concise and capture the key points.

CONTENT:
${content}

SUMMARY:`;

    const response = await ollamaClient.generate({
      prompt,
      temperature: 0.5,
      maxTokens: Math.ceil(maxLength / 3), // Rough token estimate
    });

    return response.response;
  } catch (error: any) {
    console.error('[Synthesis] Summarization failed', {
      error: error.message,
    });

    // Fallback: Simple truncation
    return content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
  }
}
