/**
 * Ollama Client Wrapper
 * Handles communication with local Ollama server
 */

import { Ollama } from 'ollama';

export interface OllamaConfig {
  host?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface GenerateOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GenerateResponse {
  response: string;
  modelUsed: string;
  durationMs: number;
  tokensGenerated: number;
}

export class OllamaClient {
  private ollama: Ollama;
  private config: Required<OllamaConfig>;

  constructor(config?: OllamaConfig) {
    this.config = {
      host: config?.host || process.env.OLLAMA_HOST || 'http://localhost:11434',
      model: config?.model || process.env.DIGITAL_MUSE_MODEL || 'digital-muse:latest',
      temperature: config?.temperature || 0.7,
      maxTokens: config?.maxTokens || 2048,
      timeout: config?.timeout || 30000,
    };

    this.ollama = new Ollama({
      host: this.config.host,
    });

    console.log('[OllamaClient] Initialized', {
      host: this.config.host,
      model: this.config.model,
    });
  }

  /**
   * Generate completion from Digital Muse
   */
  async generate(options: GenerateOptions): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      const response = await this.ollama.generate({
        model: this.config.model,
        prompt: options.prompt,
        system: options.system,
        options: {
          temperature: options.temperature || this.config.temperature,
          num_predict: options.maxTokens || this.config.maxTokens,
        },
        stream: false,
      });

      const durationMs = Date.now() - startTime;

      console.log('[OllamaClient] Generation successful', {
        model: this.config.model,
        durationMs,
        promptLength: options.prompt.length,
        responseLength: response.response.length,
      });

      return {
        response: response.response,
        modelUsed: this.config.model,
        durationMs,
        tokensGenerated: response.eval_count || 0,
      };
    } catch (error: any) {
      console.error('[OllamaClient] Generation failed', {
        error: error.message,
        host: this.config.host,
        model: this.config.model,
      });

      throw new Error(`Digital Muse unavailable: ${error.message}`);
    }
  }

  /**
   * Chat completion with conversation history
   */
  async chat(
    userMessage: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      const messages = [
        ...(conversationHistory || []),
        { role: 'user', content: userMessage },
      ];

      const response = await this.ollama.chat({
        model: this.config.model,
        messages,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
        ...(systemPrompt && { system: systemPrompt }),
      });

      const durationMs = Date.now() - startTime;

      return {
        response: response.message.content,
        modelUsed: this.config.model,
        durationMs,
        tokensGenerated: response.eval_count || 0,
      };
    } catch (error: any) {
      console.error('[OllamaClient] Chat failed', {
        error: error.message,
        host: this.config.host,
        model: this.config.model,
      });

      throw new Error(`Digital Muse chat unavailable: ${error.message}`);
    }
  }

  /**
   * Check if Ollama service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.host}/api/version`);
      return response.ok;
    } catch (error) {
      console.error('[OllamaClient] Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: this.config.host,
      });
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map((m) => m.name);
    } catch (error: any) {
      console.error('[OllamaClient] Failed to list models', {
        error: error.message,
      });
      return [];
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<OllamaConfig> {
    return { ...this.config };
  }
}

// Singleton instance
let ollamaClientInstance: OllamaClient | null = null;

export function getOllamaClient(config?: OllamaConfig): OllamaClient {
  if (!ollamaClientInstance) {
    ollamaClientInstance = new OllamaClient(config);
  }
  return ollamaClientInstance;
}
