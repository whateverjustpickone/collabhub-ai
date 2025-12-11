/**
 * Google Gemini Provider
 * Handles communication with Google's Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseLLMProvider, LLMProviderConfig } from './base.provider';
import { LLMProvider, LLMRequest, LLMResponse, ExternalServiceError } from '../../types';
import logger from '../../config/logger';

export class GoogleProvider extends BaseLLMProvider {
  public readonly provider = LLMProvider.GOOGLE;
  public readonly defaultModel = 'gemini-1.5-pro-latest';
  private client: GoogleGenerativeAI;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  /**
   * Generate completion from Gemini
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const modelName = request.model || this.getDefaultModel();

      logger.info('Google Gemini API request', {
        model: modelName,
        messageCount: request.messages.length,
      });

      const model = this.client.getGenerativeModel({ model: modelName });

      // Convert messages to Gemini format
      const systemMessage = request.messages.find((m) => m.role === 'system');
      const chatMessages = request.messages.filter((m) => m.role !== 'system');

      // Build conversation history
      const history = chatMessages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      // Get last user message
      const lastMessage = chatMessages[chatMessages.length - 1];

      // Start chat with history
      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens || 4096,
        },
      });

      // Add system message as context if present
      let prompt = lastMessage.content;
      if (systemMessage) {
        prompt = `${systemMessage.content}\n\n${prompt}`;
      }

      // Send message
      const result = await chat.sendMessage(prompt);
      const response = result.response;
      const content = response.text();

      logger.info('Google Gemini API response', {
        model: modelName,
        candidateCount: response.candidates?.length,
      });

      return {
        content,
        provider: this.provider,
        model: modelName,
        tokensUsed: {
          input: 0, // Gemini doesn't provide token counts in response
          output: 0,
          total: 0,
        },
        metadata: {
          finishReason: response.candidates?.[0]?.finishReason,
        },
      };
    } catch (error: any) {
      logger.error('Google Gemini API error', {
        error: error.message,
      });

      throw new ExternalServiceError(
        'Google',
        `Gemini API error: ${error.message}`
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
      const modelName = request.model || this.getDefaultModel();
      const model = this.client.getGenerativeModel({ model: modelName });

      const systemMessage = request.messages.find((m) => m.role === 'system');
      const chatMessages = request.messages.filter((m) => m.role !== 'system');

      const history = chatMessages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const lastMessage = chatMessages[chatMessages.length - 1];

      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens || 4096,
        },
      });

      let prompt = lastMessage.content;
      if (systemMessage) {
        prompt = `${systemMessage.content}\n\n${prompt}`;
      }

      const result = await chat.sendMessageStream(prompt);
      let fullContent = '';

      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullContent += text;
        onChunk(text);
      }

      return {
        content: fullContent,
        provider: this.provider,
        model: modelName,
        tokensUsed: {
          input: 0,
          output: 0,
          total: 0,
        },
      };
    } catch (error: any) {
      logger.error('Google Gemini streaming error', {
        error: error.message,
      });

      throw new ExternalServiceError(
        'Google',
        `Gemini streaming error: ${error.message}`
      );
    }
  }
}
