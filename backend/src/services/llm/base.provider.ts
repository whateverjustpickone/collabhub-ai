/**
 * Base LLM Provider Interface
 * Abstract interface that all LLM providers must implement
 */

import { LLMProvider, LLMRequest, LLMResponse } from '../../types';

export interface LLMProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;
  public abstract readonly provider: LLMProvider;
  public abstract readonly defaultModel: string;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  /**
   * Generate completion from the LLM
   */
  abstract generateCompletion(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Stream completion (optional - for real-time responses)
   */
  abstract streamCompletion?(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse>;

  /**
   * Check if provider is available and configured
   */
  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.provider;
  }

  /**
   * Get default model
   */
  getDefaultModel(): string {
    return this.config.model || this.defaultModel;
  }
}
