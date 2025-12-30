// Mistral AI Service (Minimal)
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

export async function mistralChat(
  userMessage: string,
  conversationHistory?: Array<{role: string, content: string, author?: string}>,
  enrichedContext?: EnrichedContext
): Promise<string> {
  try {
    const apiKey = process.env.MISTRAL_API_KEY || '';
    console.log('[Mistral] API Key loaded:', apiKey ? `${apiKey.substring(0, 15)}... (${apiKey.length} chars)` : 'MISSING');

    // Build system prompt with optional enriched context
    let systemPrompt = 'You are Mistral Large, an AI assistant on the CollabHub AI Executive Team. You excel at multilingual capabilities, European regulatory compliance, and efficient reasoning. You are in a multi-agent collaboration session with other AI assistants (Claude, GPT-4, Gemini, Perplexity, Grok, and DeepSeek). You can see the conversation history including what other agents have said. Build upon their insights and collaborate effectively. Be concise and professional.';

    if (enrichedContext) {
      const contextPrompt = formatContextForPrompt(enrichedContext);
      systemPrompt += contextPrompt;
      console.log('[Mistral] Context injected:', enrichedContext.metadata.documentsIncluded, 'docs,', enrichedContext.metadata.codeFilesIncluded, 'files,', enrichedContext.totalTokens, 'tokens');
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

    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-large-latest',
        messages,
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0]?.message?.content || 'Unable to generate response';
  } catch (error: any) {
    console.error('Mistral API Error:', error);
    throw new Error(`Mistral unavailable: ${error.message}`);
  }
}
