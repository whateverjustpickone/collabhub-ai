/**
 * Manus Provider
 * Specialized Anthropic Claude provider for the Manus persona
 * Manus serves as Chief Architect with technical focus
 *
 * Note: Uses same Anthropic API but with distinct system prompts and configuration
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider, LLMProviderConfig } from './base.provider';
import { LLMProvider, LLMRequest, LLMResponse, ExternalServiceError } from '../../types';
import logger from '../../config/logger';

export class ManusProvider extends BaseLLMProvider {
  public readonly provider = LLMProvider.ANTHROPIC; // Uses Anthropic backend
  public readonly defaultModel = 'claude-3-5-sonnet-20241022';
  private client: Anthropic;

  // Manus-specific system prompt that defines the technical architect persona
  private readonly manusSystemPrompt = `You are Manus, Chief Architect of Digital Muse Holdings.

Your expertise lies in:
- System architecture and technical design
- Infrastructure planning and scalability
- Integration patterns and API design
- Technical debt management and refactoring strategies
- Best practices and design patterns

Your personality traits:
- Communication Style: Technical, precise, systems-oriented
- Approach: Architecture-first, scalability-focused, best practices
- Tone: Authoritative, detailed, technical
- Directness: 8/10 (very direct)
- Creativity: 4/10 (conservative, proven patterns)
- Formality: 8/10 (technical and professional)
- Enthusiasm: 5/10 (measured and steady)

When responding:
- Provide detailed technical specifications
- Consider long-term architectural implications
- Recommend industry best practices and proven patterns
- Create system diagrams and technical documentation when appropriate
- Focus on scalability, maintainability, and performance

Always maintain your role as the technical authority and architectural decision-maker.`;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  /**
   * Generate completion from Manus (Claude with architect persona)
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = request.model || this.getDefaultModel();

      logger.info('Manus (Anthropic) API request', {
        model,
        messageCount: request.messages.length,
      });

      // Inject or enhance system message with Manus persona
      const messages = request.messages.filter((m) => m.role !== 'system');
      const existingSystemMessage = request.messages.find((m) => m.role === 'system');

      // Combine Manus persona with any additional system instructions
      let systemPrompt = this.manusSystemPrompt;
      if (existingSystemMessage) {
        systemPrompt += `\n\nAdditional context:\n${existingSystemMessage.content}`;
      }

      const formattedMessages = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Call Anthropic API with Manus persona
      const response = await this.client.messages.create({
        model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.6, // Slightly lower for more consistent technical responses
        system: systemPrompt,
        messages: formattedMessages,
      });

      // Extract content
      const content = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      logger.info('Manus (Anthropic) API response', {
        model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      });

      return {
        content,
        provider: this.provider,
        model,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        metadata: {
          id: response.id,
          stopReason: response.stop_reason,
          persona: 'Manus - Chief Architect',
        },
      };
    } catch (error: any) {
      logger.error('Manus (Anthropic) API error', {
        error: error.message,
        status: error.status,
      });

      throw new ExternalServiceError(
        'Anthropic (Manus)',
        `Manus API error: ${error.message}`
      );
    }
  }

  /**
   * Stream completion (for real-time responses)
   */
  async streamCompletion(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    try {
      const model = request.model || this.getDefaultModel();

      const messages = request.messages.filter((m) => m.role !== 'system');
      const existingSystemMessage = request.messages.find((m) => m.role === 'system');

      let systemPrompt = this.manusSystemPrompt;
      if (existingSystemMessage) {
        systemPrompt += `\n\nAdditional context:\n${existingSystemMessage.content}`;
      }

      const formattedMessages = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const stream = await this.client.messages.stream({
        model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.6,
        system: systemPrompt,
        messages: formattedMessages,
      });

      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const delta = (chunk as any).delta;
          if (delta.type === 'text_delta') {
            const text = delta.text;
            fullContent += text;
            onChunk(text);
          }
        } else if (chunk.type === 'message_start') {
          const message = (chunk as any).message;
          inputTokens = message.usage.input_tokens;
        } else if (chunk.type === 'message_delta') {
          const usage = (chunk as any).usage;
          outputTokens = usage.output_tokens;
        }
      }

      return {
        content: fullContent,
        provider: this.provider,
        model,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        metadata: {
          persona: 'Manus - Chief Architect',
        },
      };
    } catch (error: any) {
      logger.error('Manus (Anthropic) streaming error', {
        error: error.message,
      });

      throw new ExternalServiceError(
        'Anthropic (Manus)',
        `Manus streaming error: ${error.message}`
      );
    }
  }
}
