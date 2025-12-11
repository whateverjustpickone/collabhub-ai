/**
 * LLM Orchestration Service
 * Manages all LLM providers and routes requests to appropriate provider
 */

import { config } from '../../config/env';
import logger from '../../config/logger';
import { LLMProvider, LLMRequest, LLMResponse, ExternalServiceError } from '../../types';
import { BaseLLMProvider } from './base.provider';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAIProvider } from './openai.provider';
import { GoogleProvider } from './google.provider';
import { XAIProvider } from './xai.provider';
import { DeepSeekProvider } from './deepseek.provider';
import { PerplexityProvider } from './perplexity.provider';

class LLMService {
  private providers: Map<LLMProvider, BaseLLMProvider>;

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  /**
   * Initialize all available LLM providers
   */
  private initializeProviders(): void {
    logger.info('Initializing LLM providers...');

    // Anthropic Claude
    if (config.llm.anthropic) {
      try {
        const provider = new AnthropicProvider({
          apiKey: config.llm.anthropic,
        });
        this.providers.set(LLMProvider.ANTHROPIC, provider);
        logger.info('✓ Anthropic Claude provider initialized');
      } catch (error: any) {
        logger.warn('⚠ Failed to initialize Anthropic provider:', error.message);
      }
    }

    // OpenAI GPT-4
    if (config.llm.openai) {
      try {
        const provider = new OpenAIProvider({
          apiKey: config.llm.openai,
        });
        this.providers.set(LLMProvider.OPENAI, provider);
        logger.info('✓ OpenAI GPT-4 provider initialized');
      } catch (error: any) {
        logger.warn('⚠ Failed to initialize OpenAI provider:', error.message);
      }
    }

    // Google Gemini
    if (config.llm.google) {
      try {
        const provider = new GoogleProvider({
          apiKey: config.llm.google,
        });
        this.providers.set(LLMProvider.GOOGLE, provider);
        logger.info('✓ Google Gemini provider initialized');
      } catch (error: any) {
        logger.warn('⚠ Failed to initialize Google provider:', error.message);
      }
    }

    // xAI Grok
    if (config.llm.xai) {
      try {
        const provider = new XAIProvider({
          apiKey: config.llm.xai,
        });
        this.providers.set(LLMProvider.XAI, provider);
        logger.info('✓ xAI Grok provider initialized');
      } catch (error: any) {
        logger.warn('⚠ Failed to initialize xAI provider:', error.message);
      }
    }

    // DeepSeek
    if (config.llm.deepseek) {
      try {
        const provider = new DeepSeekProvider({
          apiKey: config.llm.deepseek,
        });
        this.providers.set(LLMProvider.DEEPSEEK, provider);
        logger.info('✓ DeepSeek provider initialized');
      } catch (error: any) {
        logger.warn('⚠ Failed to initialize DeepSeek provider:', error.message);
      }
    }

    // Perplexity
    if (config.llm.perplexity) {
      try {
        const provider = new PerplexityProvider({
          apiKey: config.llm.perplexity,
        });
        this.providers.set(LLMProvider.PERPLEXITY, provider);
        logger.info('✓ Perplexity provider initialized');
      } catch (error: any) {
        logger.warn('⚠ Failed to initialize Perplexity provider:', error.message);
      }
    }

    logger.info(`LLM Service initialized with ${this.providers.size} provider(s)`);

    if (this.providers.size === 0) {
      logger.warn('⚠ No LLM providers configured. Add API keys to enable AI features.');
    }
  }

  /**
   * Get provider instance
   */
  private getProvider(provider: LLMProvider): BaseLLMProvider {
    const instance = this.providers.get(provider);

    if (!instance) {
      throw new ExternalServiceError(
        provider,
        `Provider ${provider} is not configured or initialized`
      );
    }

    if (!instance.isAvailable()) {
      throw new ExternalServiceError(
        provider,
        `Provider ${provider} is not available (missing API key)`
      );
    }

    return instance;
  }

  /**
   * Generate completion from specified provider
   */
  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.getProvider(request.provider);

    logger.info('Generating completion', {
      provider: request.provider,
      model: request.model || provider.getDefaultModel(),
      messageCount: request.messages.length,
    });

    try {
      const response = await provider.generateCompletion(request);

      logger.info('Completion generated successfully', {
        provider: request.provider,
        tokensUsed: response.tokensUsed.total,
      });

      return response;
    } catch (error: any) {
      logger.error('Completion generation failed', {
        provider: request.provider,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Stream completion from specified provider
   */
  async streamCompletion(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    const provider = this.getProvider(request.provider);

    logger.info('Starting streaming completion', {
      provider: request.provider,
      model: request.model || provider.getDefaultModel(),
    });

    if (!provider.streamCompletion) {
      logger.warn('Provider does not support streaming, falling back to regular completion');
      return this.generateCompletion(request);
    }

    try {
      const response = await provider.streamCompletion(request, onChunk);

      logger.info('Streaming completion finished', {
        provider: request.provider,
      });

      return response;
    } catch (error: any) {
      logger.error('Streaming completion failed', {
        provider: request.provider,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(provider: LLMProvider): boolean {
    const instance = this.providers.get(provider);
    return instance ? instance.isAvailable() : false;
  }

  /**
   * Get provider status information
   */
  getProviderStatus(): Record<LLMProvider, { available: boolean; model: string }> {
    const status: any = {};

    for (const [providerName, provider] of this.providers.entries()) {
      status[providerName] = {
        available: provider.isAvailable(),
        model: provider.getDefaultModel(),
      };
    }

    // Add unavailable providers
    const allProviders = Object.values(LLMProvider);
    for (const providerName of allProviders) {
      if (!status[providerName]) {
        status[providerName] = {
          available: false,
          model: 'N/A',
        };
      }
    }

    return status;
  }

  /**
   * Send message to an AI agent
   * Convenience method for agent-specific requests
   */
  async sendMessageToAgent(
    agentProvider: LLMProvider,
    agentModel: string,
    systemPrompt: string,
    userMessage: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    stream?: boolean,
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user' as const, content: userMessage },
    ];

    const request: LLMRequest = {
      provider: agentProvider,
      model: agentModel,
      messages,
      temperature: 0.7,
      maxTokens: 4096,
    };

    if (stream && onChunk) {
      return this.streamCompletion(request, onChunk);
    } else {
      return this.generateCompletion(request);
    }
  }
}

// Export singleton instance
export const llmService = new LLMService();
export default llmService;
