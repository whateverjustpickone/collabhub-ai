/**
 * OpenAI Provider
 * Handles communication with OpenAI's GPT-4 API
 */

import OpenAI from 'openai';
import { BaseLLMProvider, LLMProviderConfig } from './base.provider';
import { LLMProvider, LLMRequest, LLMResponse, ExternalServiceError } from '../../types';
import logger from '../../config/logger';

export class OpenAIProvider extends BaseLLMProvider {
  public readonly provider = LLMProvider.OPENAI;
  public readonly defaultModel = 'gpt-4-turbo-2024-04-09';
  private client: OpenAI;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  /**
   * Generate completion from GPT-4
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = request.model || this.getDefaultModel();

      logger.info('OpenAI API request', {
        model,
        messageCount: request.messages.length,
      });

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens || 4096,
      });

      const content = response.choices[0]?.message?.content || '';

      logger.info('OpenAI API response', {
        model,
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      });

      return {
        content,
        provider: this.provider,
        model,
        tokensUsed: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0,
        },
        metadata: {
          id: response.id,
          finishReason: response.choices[0]?.finish_reason,
        },
      };
    } catch (error: any) {
      logger.error('OpenAI API error', {
        error: error.message,
        status: error.status,
      });

      throw new ExternalServiceError(
        'OpenAI',
        `GPT-4 API error: ${error.message}`
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

      const stream = await this.client.chat.completions.create({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens || 4096,
        stream: true,
      });

      let fullContent = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          onChunk(delta);
        }
      }

      return {
        content: fullContent,
        provider: this.provider,
        model,
        tokensUsed: {
          input: 0, // Not available in streaming
          output: 0,
          total: 0,
        },
      };
    } catch (error: any) {
      logger.error('OpenAI streaming error', {
        error: error.message,
      });

      throw new ExternalServiceError(
        'OpenAI',
        `GPT-4 streaming error: ${error.message}`
      );
    }
  }
}
