// Anthropic Claude Service (Minimal)
import Anthropic from '@anthropic-ai/sdk';
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

export async function anthropicChat(
  userMessage: string,
  conversationHistory?: Array<{role: string, content: string, author?: string}>,
  enrichedContext?: EnrichedContext
): Promise<string> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    console.log('[Anthropic] API Key:', apiKey ? `${apiKey.substring(0, 15)}... (${apiKey.length} chars)` : 'MISSING');

    const client = new Anthropic({
      apiKey,
    });

    // Build messages array with conversation history
    const messages: Array<{role: 'user' | 'assistant', content: string}> = [];

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

    // Build system prompt with optional enriched context
    let systemPrompt = 'You are Claude, an AI assistant on the CollabHub AI Executive Team. You provide strategic thinking, ethical reasoning, and thoughtful analysis. You are in a multi-agent collaboration session with other AI assistants (GPT-4, Gemini, and Perplexity). You can see the conversation history including what other agents have said. Build upon their insights and collaborate effectively. Be concise and professional.';

    if (enrichedContext) {
      const contextPrompt = formatContextForPrompt(enrichedContext);
      systemPrompt += contextPrompt;
      console.log('[Anthropic] Context injected:', enrichedContext.metadata.documentsIncluded, 'docs,', enrichedContext.metadata.codeFilesIncluded, 'files,', enrichedContext.totalTokens, 'tokens');
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    });

    return response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response';
  } catch (error: any) {
    console.error('Anthropic API Error:', error);
    throw new Error(`Claude unavailable: ${error.message}`);
  }
}
