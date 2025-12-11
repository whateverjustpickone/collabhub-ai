/**
 * Anthropic Claude Provider
 * Handles communication with Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider, LLMProviderConfig } from './base.provider';
import { LLMProvider, LLMRequest, LLMResponse, ExternalServiceError } from '../../types';
import logger from '../../config/logger';

export class AnthropicProvider extends BaseLLMProvider {
  public readonly provider = LLMProvider.ANTHROPIC;
  public readonly defaultModel = 'claude-3-5-sonnet-20241022';
  private client: Anthropic;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  /**
   * Generate completion from Claude
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = request.model || this.getDefaultModel();

      logger.info('Anthropic API request', {
        model,
        messageCount: request.messages.length,
      });

      // Convert messages to Anthropic format
      const messages = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // Extract system message if present
      const systemMessage = request.messages.find((m) => m.role === 'system');

      // Call Anthropic API
      const response = await this.client.messages.create({
        model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        system: systemMessage?.content,
        messages,
      });

      // Extract content
      const content = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      logger.info('Anthropic API response', {
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
        },
      };
    } catch (error: any) {
      logger.error('Anthropic API error', {
        error: error.message,
        status: error.status,
      });

      throw new ExternalServiceError(
        'Anthropic',
        `Claude API error: ${error.message}`
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

      const messages = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const systemMessage = request.messages.find((m) => m.role === 'system');

      const stream = await this.client.messages.stream({
        model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        system: systemMessage?.content,
        messages,
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
      };
    } catch (error: any) {
      logger.error('Anthropic streaming error', {
        error: error.message,
      });

      throw new ExternalServiceError(
        'Anthropic',
        `Claude streaming error: ${error.message}`
      );
    }
  }
}
