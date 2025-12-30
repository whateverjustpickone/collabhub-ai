// OpenAI GPT-4 Service (Minimal)
import OpenAI from 'openai';
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

export async function openaiChat(
  userMessage: string,
  conversationHistory?: Array<{role: string, content: string, author?: string}>,
  enrichedContext?: EnrichedContext
): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY || '';
    console.log('[OpenAI] API Key:', apiKey ? `${apiKey.substring(0, 15)}... (${apiKey.length} chars)` : 'MISSING');

    const client = new OpenAI({
      apiKey,
    });

    // Build system prompt with optional enriched context
    let systemPrompt = 'You are GPT-4, an AI assistant on the CollabHub AI Executive Team. You excel at creative problem-solving and general intelligence. You are in a multi-agent collaboration session with other AI assistants (Claude, Gemini, and Perplexity). You can see the conversation history including what other agents have said. Build upon their insights and collaborate effectively. Be concise and professional.';

    if (enrichedContext) {
      const contextPrompt = formatContextForPrompt(enrichedContext);
      systemPrompt += contextPrompt;
      console.log('[OpenAI] Context injected:', enrichedContext.metadata.documentsIncluded, 'docs,', enrichedContext.metadata.codeFilesIncluded, 'files,', enrichedContext.totalTokens, 'tokens');
    }

    // Build messages array with conversation history
    const messages: Array<{role: 'user' | 'assistant' | 'system', content: string}> = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

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

    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      max_tokens: 1024,
      messages
    });

    return completion.choices[0]?.message?.content || 'Unable to generate response';
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(`GPT-4 unavailable: ${error.message}`);
  }
}
