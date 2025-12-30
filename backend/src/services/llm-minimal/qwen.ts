// Alibaba Qwen (通义千问) Service (Minimal)
import axios from 'axios';
import { formatContextForPrompt } from '../context/context-injection.service';

interface EnrichedContext {
  documents: Array<{
    id: string;
    title: string;
    content: string;
    relevance: number;
    tokens: number;
  }>;
  codeFiles: Array<{
    id: string;
    path: string;
    content: string;
    repository: string;
    relevance: number;
    tokens: number;
  }>;
  totalTokens: number;
  metadata: {
    documentsIncluded: number;
    codeFilesIncluded: number;
    tokenBudget: number;
    tokenUsed: number;
  };
}

export async function qwenChat(
  userMessage: string,
  conversationHistory?: Array<{role: string, content: string, author?: string}>,
  enrichedContext?: EnrichedContext
): Promise<string> {
  try {
    const apiKey = process.env.QWEN_API_KEY || process.env.ALIBABA_API_KEY || '';
    console.log('[Qwen] API Key loaded:', apiKey ? `${apiKey.substring(0, 15)}... (${apiKey.length} chars)` : 'MISSING');

    // Build system prompt with optional enriched context
    let systemPrompt = 'You are Qwen 2.5, an AI assistant on the CollabHub AI Executive Team. You excel at Chinese language processing, multimodal understanding, and bridging Eastern and Western technical approaches. You are in a multi-agent collaboration session with other AI assistants (Claude, GPT-4, Gemini, Perplexity, Mistral, Grok, DeepSeek, Llama, Manus, Cohere, and Pi). You can see the conversation history including what other agents have said. Build upon their insights and collaborate effectively. Be concise and professional.';

    if (enrichedContext) {
      const contextPrompt = formatContextForPrompt(enrichedContext);
      systemPrompt += contextPrompt;
      console.log('[Qwen] Context injected:', enrichedContext.metadata.documentsIncluded, 'docs,', enrichedContext.metadata.codeFilesIncluded, 'files,', enrichedContext.totalTokens, 'tokens');
    }

    // Build messages array with conversation history
    const messages: Array<{role: string, content: string}> = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Alibaba Cloud DashScope API
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-turbo',
        input: {
          messages
        },
        parameters: {
          max_tokens: 1024,
          temperature: 0.7,
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.output?.choices?.[0]?.message?.content || 'Unable to generate response';
  } catch (error: any) {
    console.error('Qwen API Error:', error);
    throw new Error(`Qwen unavailable: ${error.message}`);
  }
}
