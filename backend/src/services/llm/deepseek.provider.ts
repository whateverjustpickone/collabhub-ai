/**
 * DeepSeek Provider
 * Handles communication with DeepSeek's API
 */

import axios from 'axios';
import { BaseLLMProvider, LLMProviderConfig } from './base.provider';
import { LLMProvider, LLMRequest, LLMResponse, ExternalServiceError } from '../../types';
import logger from '../../config/logger';

export class DeepSeekProvider extends BaseLLMProvider {
  public readonly provider = LLMProvider.DEEPSEEK;
  public readonly defaultModel = 'deepseek-chat';

  constructor(config: LLMProviderConfig) {
    super(config);
  }

  /**
   * Generate completion from DeepSeek
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = request.model || this.getDefaultModel();

      logger.info('DeepSeek API request', {
        model,
        messageCount: request.messages.length,
      });

      // DeepSeek uses OpenAI-compatible API
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
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

      logger.info('DeepSeek API response', {
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
      logger.error('DeepSeek API error', {
        error: error.message,
        status: error.response?.status,
      });

      throw new ExternalServiceError(
        'DeepSeek',
        `DeepSeek API error: ${error.message}`
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

      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens || 4096,
          stream: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );

      let fullContent = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices[0]?.delta?.content || '';
                if (delta) {
                  fullContent += delta;
                  onChunk(delta);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        });

        response.data.on('end', () => {
          resolve({
            content: fullContent,
            provider: this.provider,
            model,
            tokensUsed: {
              input: 0,
              output: 0,
              total: 0,
            },
          });
        });

        response.data.on('error', (error: Error) => {
          reject(new ExternalServiceError('DeepSeek', `Streaming error: ${error.message}`));
        });
      });
    } catch (error: any) {
      logger.error('DeepSeek streaming error', {
        error: error.message,
      });

      throw new ExternalServiceError(
        'DeepSeek',
        `DeepSeek streaming error: ${error.message}`
      );
    }
  }
}
