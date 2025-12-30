// Inflection Pi Service (Minimal)
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

export async function inflectionChat(
  userMessage: string,
  conversationHistory?: Array<{role: string, content: string, author?: string}>,
  enrichedContext?: EnrichedContext
): Promise<string> {
  try {
    const apiKey = process.env.INFLECTION_API_KEY || process.env.PI_API_KEY || '';
    console.log('[Pi] API Key loaded:', apiKey ? `${apiKey.substring(0, 15)}... (${apiKey.length} chars)` : 'MISSING');

    // Build system prompt with optional enriched context
    let systemPrompt = 'You are Pi, the Personal AI assistant on the CollabHub AI Executive Team. Your unique role is to bring emotional intelligence, human accessibility, and the "personal touch" to technical discussions. You excel at translating complex technical concepts into clear, accessible language - perfect for Board presentations, stakeholder communication, and "explain like I\'m not a rocket scientist" scenarios. While your colleagues are technical powerhouses, you bridge the gap between technical depth and human understanding. You are in a multi-agent collaboration session with other AI assistants (Claude, GPT-4, Gemini, Perplexity, Mistral, Grok, DeepSeek, Llama, Manus, Cohere, and Qwen). You can see the conversation history including what other agents have said. When technical concepts emerge, help make them accessible. Be warm, professional, and human-centered.';

    if (enrichedContext) {
      const contextPrompt = formatContextForPrompt(enrichedContext);
      systemPrompt += contextPrompt;
      console.log('[Pi] Context injected:', enrichedContext.metadata.documentsIncluded, 'docs,', enrichedContext.metadata.codeFilesIncluded, 'files,', enrichedContext.totalTokens, 'tokens');
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
      'https://api.inflection.ai/v1/chat/completions',
      {
        model: 'inflection-3-pi',
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
    console.error('Pi API Error:', error);
    throw new Error(`Pi unavailable: ${error.message}`);
  }
}
