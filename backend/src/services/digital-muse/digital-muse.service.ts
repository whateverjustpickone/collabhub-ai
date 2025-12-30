/**
 * Digital Muse Core Service
 * Main service for local LLM integration with hybrid local-cloud architecture
 */

import { getOllamaClient, OllamaClient } from './ollama-client';
import {
  triageQuery,
  TriageResult,
  UserPreferences,
} from './triage';
import {
  synthesizeResponses,
  summarize as synthesizeSummarize,
  AgentResponse,
  SynthesizedResponse,
} from './synthesis';
import { EnrichedContext } from '../context/context-injection.service';

export interface DigitalMuseResponse {
  answer: string;
  source: 'digital-muse-local' | 'digital-muse-synthesis';
  model: string;
  executionTimeMs: number;
  tokensGenerated?: number;
  cost: number;
  confidence?: number;
}

export class DigitalMuseService {
  private ollamaClient: OllamaClient;

  constructor() {
    this.ollamaClient = getOllamaClient();
    console.log('[DigitalMuseService] Initialized');
  }

  /**
   * Triage a query to determine routing strategy
   */
  async triage(
    query: string,
    preferences?: UserPreferences
  ): Promise<TriageResult> {
    return triageQuery(query, preferences);
  }

  /**
   * Answer a simple query entirely locally
   */
  async answerSimple(
    query: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    enrichedContext?: EnrichedContext
  ): Promise<DigitalMuseResponse> {
    const startTime = Date.now();

    try {
      // Build system prompt
      let systemPrompt = `You are Digital Muse, the core AI assistant for CollabHub AI. You are part of a 12-member Executive Team of AI agents, but you handle simple queries locally without cloud assistance.

Your role:
- Answer straightforward questions clearly and concisely
- Provide accurate information without needing real-time data
- Be helpful, professional, and efficient
- If the query is too complex for you, acknowledge that and suggest the user's query will be escalated to the full Executive Team

Respond directly and naturally.`;

      // Add enriched context if available
      if (enrichedContext && enrichedContext.documents.length > 0) {
        const contextSummary = enrichedContext.documents
          .slice(0, 3)
          .map((doc) => `- ${doc.title}: ${doc.content.substring(0, 200)}...`)
          .join('\n');

        systemPrompt += `\n\nRELEVANT CONTEXT FROM KNOWLEDGE LIBRARY:\n${contextSummary}`;
      }

      // Generate response
      const response = await this.ollamaClient.chat(
        query,
        conversationHistory,
        systemPrompt
      );

      const executionTimeMs = Date.now() - startTime;

      console.log('[DigitalMuseService] Simple query answered locally', {
        queryLength: query.length,
        executionTimeMs,
        tokensGenerated: response.tokensGenerated,
      });

      return {
        answer: response.response,
        source: 'digital-muse-local',
        model: response.modelUsed,
        executionTimeMs,
        tokensGenerated: response.tokensGenerated,
        cost: 0,
        confidence: 0.85,
      };
    } catch (error: any) {
      console.error('[DigitalMuseService] Failed to answer simple query', {
        error: error.message,
      });

      throw new Error(`Digital Muse unavailable: ${error.message}`);
    }
  }

  /**
   * Prepare context for cloud agents
   * Formats and summarizes context to optimize token usage
   */
  async prepareContext(context: EnrichedContext): Promise<string> {
    try {
      // If context is small, return as-is
      const contextString = JSON.stringify(context);
      if (contextString.length < 2000) {
        return this.formatContextSimple(context);
      }

      // For large context, summarize with Digital Muse
      const fullContext = this.formatContextSimple(context);
      const summarized = await synthesizeSummarize(fullContext, 1500);

      console.log('[DigitalMuseService] Context prepared', {
        originalLength: fullContext.length,
        summarizedLength: summarized.length,
        compressionRatio: Math.round((summarized.length / fullContext.length) * 100),
      });

      return summarized;
    } catch (error: any) {
      console.error('[DigitalMuseService] Context preparation failed', {
        error: error.message,
      });

      // Fallback: Return simple formatted context
      return this.formatContextSimple(context);
    }
  }

  /**
   * Synthesize multiple agent responses
   */
  async synthesize(
    query: string,
    responses: AgentResponse[]
  ): Promise<SynthesizedResponse> {
    return synthesizeResponses(query, responses);
  }

  /**
   * Summarize long content
   */
  async summarize(content: string, maxLength?: number): Promise<string> {
    return synthesizeSummarize(content, maxLength);
  }

  /**
   * Perform initial code review analysis
   */
  async reviewCodeInitial(
    files: Array<{ path: string; content: string }>
  ): Promise<{
    complexityScore: number;
    syntaxIssues: string[];
    securityConcerns: string[];
    summary: string;
  }> {
    try {
      const filesText = files
        .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\`\n`)
        .join('\n');

      const prompt = `You are performing an initial code review. Analyze the following code files and provide:
1. Complexity score (0-100, where 100 is most complex)
2. List of syntax issues or style violations
3. List of potential security concerns
4. Brief summary

CODE FILES:
${filesText}

Respond in JSON format:
{
  "complexity_score": 0-100,
  "syntax_issues": ["issue 1", "issue 2"],
  "security_concerns": ["concern 1", "concern 2"],
  "summary": "Brief summary in 1-2 sentences"
}`;

      const response = await this.ollamaClient.generate({
        prompt,
        temperature: 0.3,
        maxTokens: 1024,
      });

      // Parse JSON response
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse code review response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      console.log('[DigitalMuseService] Code review completed', {
        filesCount: files.length,
        complexityScore: analysis.complexity_score,
      });

      return {
        complexityScore: analysis.complexity_score,
        syntaxIssues: analysis.syntax_issues || [],
        securityConcerns: analysis.security_concerns || [],
        summary: analysis.summary,
      };
    } catch (error: any) {
      console.error('[DigitalMuseService] Code review failed', {
        error: error.message,
      });

      // Return fallback analysis
      return {
        complexityScore: 50,
        syntaxIssues: [],
        securityConcerns: [],
        summary: 'Initial code analysis unavailable, escalating to cloud experts.',
      };
    }
  }

  /**
   * Check if Digital Muse is available
   */
  async healthCheck(): Promise<{
    available: boolean;
    model: string;
    host: string;
  }> {
    const isAvailable = await this.ollamaClient.healthCheck();
    const config = this.ollamaClient.getConfig();

    return {
      available: isAvailable,
      model: config.model,
      host: config.host,
    };
  }

  /**
   * Get available models
   */
  async listModels(): Promise<string[]> {
    return this.ollamaClient.listModels();
  }

  /**
   * Simple context formatting (private helper)
   */
  private formatContextSimple(context: EnrichedContext): string {
    let formatted = '';

    if (context.documents.length > 0) {
      formatted += '## Relevant Documents:\n';
      context.documents.forEach((doc) => {
        formatted += `### ${doc.title}\n${doc.content}\n\n`;
      });
    }

    if (context.codeFiles.length > 0) {
      formatted += '## Relevant Code Files:\n';
      context.codeFiles.forEach((file) => {
        formatted += `### ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
      });
    }

    if (context.conversationHistory.length > 0) {
      formatted += '## Recent Conversation:\n';
      context.conversationHistory.slice(-5).forEach((msg) => {
        formatted += `**${msg.role}**: ${msg.content}\n`;
      });
    }

    return formatted;
  }
}

// Singleton instance
let digitalMuseInstance: DigitalMuseService | null = null;

export function getDigitalMuseService(): DigitalMuseService {
  if (!digitalMuseInstance) {
    digitalMuseInstance = new DigitalMuseService();
  }
  return digitalMuseInstance;
}

// Export types
export type {
  TriageResult,
  UserPreferences,
  AgentResponse,
  SynthesizedResponse,
  QueryComplexity,
  RoutingStrategy,
} from './triage';
