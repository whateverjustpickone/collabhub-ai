/**
 * xAI Grok Provider
 * Handles communication with xAI's Grok API
 * Note: Implementation pending API availability
 */

import axios from 'axios';
import { BaseLLMProvider, LLMProviderConfig } from './base.provider';
import { LLMProvider, LLMRequest, LLMResponse, ExternalServiceError } from '../../types';
import logger from '../../config/logger';

export class XAIProvider extends BaseLLMProvider {
  public readonly provider = LLMProvider.XAI;
  public readonly defaultModel = 'grok-beta';

  constructor(config: LLMProviderConfig) {
    super(config);
  }

  /**
   * Generate completion from Grok
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = request.model || this.getDefaultModel();

      logger.info('xAI Grok API request', {
        model,
        messageCount: request.messages.length,
      });

      // xAI API endpoint (to be confirmed when API is available)
      const response = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens || 4096,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0]?.message?.content || '';

      logger.info('xAI Grok API response', {
        model,
        inputTokens: response.data.usage?.prompt_tokens,
        outputTokens: response.data.usage?.completion_tokens,
      });

      return {
        content,
        provider: this.provider,
        model,
        tokensUsed: {
          input: response.data.usage?.prompt_tokens || 0,
          output: response.data.usage?.completion_tokens || 0,
          total: response.data.usage?.total_tokens || 0,
        },
        metadata: {
          id: response.data.id,
          finishReason: response.data.choices[0]?.finish_reason,
        },
      };
    } catch (error: any) {
      logger.error('xAI Grok API error', {
        error: error.message,
        status: error.response?.status,
      });

      throw new ExternalServiceError(
        'xAI',
        `Grok API error: ${error.message}`
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
    // Streaming implementation pending API documentation
    logger.warn('xAI Grok streaming not yet implemented, falling back to regular completion');
    return this.generateCompletion(request);
  }
}
