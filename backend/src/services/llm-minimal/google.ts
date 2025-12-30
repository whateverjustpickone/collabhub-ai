// Google Gemini Service (Minimal)
import { GoogleGenerativeAI } from '@google/generative-ai';
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

export async function googleChat(
  userMessage: string,
  conversationHistory?: Array<{role: string, content: string, author?: string}>,
  enrichedContext?: EnrichedContext
): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || '';
    console.log('[Google] API Key:', apiKey ? `${apiKey.substring(0, 15)}... (${apiKey.length} chars)` : 'MISSING');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build base system prompt
    let systemPrompt = 'You are Gemini, an AI assistant on the CollabHub AI Executive Team. You excel at multimodal analysis, deep research, and handling large-scale context. You are in a multi-agent collaboration session with other AI assistants (Claude, GPT-4, and Perplexity). You can see the conversation history including what other agents have said. Build upon their insights and collaborate effectively. Be concise and professional.';

    // Add enriched context if available
    if (enrichedContext) {
      const contextPrompt = formatContextForPrompt(enrichedContext);
      systemPrompt += contextPrompt;
      console.log('[Google] Context injected:', enrichedContext.metadata.documentsIncluded, 'docs,', enrichedContext.metadata.codeFilesIncluded, 'files,', enrichedContext.totalTokens, 'tokens');
    }

    // Build context from conversation history
    let contextStr = '';
    if (conversationHistory && conversationHistory.length > 0) {
      contextStr = '\n\n## Recent Conversation:\n' + conversationHistory
        .map(msg => msg.content)
        .join('\n\n');
    }

    const prompt = `${systemPrompt}${contextStr}

User message: ${userMessage}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Google API Error:', error);
    throw new Error(`Gemini unavailable: ${error.message}`);
  }
}
