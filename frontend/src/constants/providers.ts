// Provider to Company Name Mapping
export const PROVIDER_COMPANIES: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  perplexity: 'Perplexity',
  mistral: 'Mistral AI',
  xai: 'xAI',
  deepseek: 'DeepSeek',
  manus: 'Butterfly Effect',
  meta: 'Meta',
  cohere: 'Cohere',
  alibaba: 'Alibaba Cloud',
  inflection: 'Inflection AI',
};

// Available Models per Provider
export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export const PROVIDER_MODELS: Record<string, ModelOption[]> = {
  anthropic: [
    {
      id: 'claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      description: 'Most intelligent model',
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      description: 'Powerful analysis',
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance',
    },
  ],
  openai: [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Latest GPT-4 with 128K context',
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Most capable model',
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient',
    },
  ],
  google: [
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: '1M+ token context',
    },
    {
      id: 'gemini-1.0-pro',
      name: 'Gemini 1.0 Pro',
      description: 'Production ready',
    },
  ],
  perplexity: [
    {
      id: 'perplexity-ai',
      name: 'Perplexity Online',
      description: 'Real-time research',
    },
  ],
  mistral: [
    {
      id: 'mistral-large',
      name: 'Mistral Large',
      description: 'Most capable model',
    },
    {
      id: 'mistral-medium',
      name: 'Mistral Medium',
      description: 'Balanced performance',
    },
  ],
  xai: [
    {
      id: 'grok-2',
      name: 'Grok 2',
      description: 'Latest model',
    },
  ],
  deepseek: [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      description: 'Advanced reasoning',
    },
  ],
  manus: [
    {
      id: 'manus-1',
      name: 'Manus 1',
      description: 'Asia-Pacific specialist',
    },
  ],
  meta: [
    {
      id: 'llama-3.3',
      name: 'Llama 3.3 70B',
      description: 'Open source leader',
    },
    {
      id: 'llama-3.1',
      name: 'Llama 3.1 405B',
      description: 'Largest open model',
    },
  ],
  cohere: [
    {
      id: 'command-r-plus',
      name: 'Command R+',
      description: 'Enterprise RAG specialist',
    },
    {
      id: 'command-r',
      name: 'Command R',
      description: 'Production grade',
    },
  ],
  alibaba: [
    {
      id: 'qwen-turbo',
      name: 'Qwen Turbo',
      description: 'Fast Chinese+English',
    },
    {
      id: 'qwen-plus',
      name: 'Qwen Plus',
      description: 'Enhanced capabilities',
    },
  ],
  inflection: [
    {
      id: 'inflection-3-pi',
      name: 'Pi (Inflection 3)',
      description: 'Personal AI assistant',
    },
  ],
};
