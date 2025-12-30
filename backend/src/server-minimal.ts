// CollabHub AI - Minimal Express Server for Board Demo
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST before any other imports
const envPath = path.join(__dirname, '..', '.env');
console.log('[ENV] Loading from:', envPath);
console.log('[ENV] __dirname:', __dirname);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('[ENV] Error loading .env file:', result.error);
} else {
  console.log('[ENV] Successfully loaded .env file');
  console.log('[ENV] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);
  console.log('[ENV] OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
  console.log('[ENV] GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
  console.log('[ENV] PERPLEXITY_API_KEY present:', !!process.env.PERPLEXITY_API_KEY);
}

import express from 'express';
import cors from 'cors';
import { anthropicChat } from './services/llm-minimal/anthropic';
import { openaiChat } from './services/llm-minimal/openai';
import { googleChat } from './services/llm-minimal/google';
import { perplexityChat } from './services/llm-minimal/perplexity';
import { mistralChat } from './services/llm-minimal/mistral';
import { grokChat } from './services/llm-minimal/grok';
import { deepseekChat } from './services/llm-minimal/deepseek';
import { manusChat } from './services/llm-minimal/manus';
import { llamaChat } from './services/llm-minimal/llama';
import { cohereChat } from './services/llm-minimal/cohere';
import { qwenChat } from './services/llm-minimal/qwen';
import { inflectionChat } from './services/llm-minimal/inflection';
import libraryRoutes from './routes/library.routes';
import githubRoutes from './routes/github.routes';
import { initializeStorage } from './services/library/storage.service';
import { buildEnrichedContext, trackContextUsage } from './services/context/context-injection.service';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize storage directory
initializeStorage().catch((err) => {
  console.error('[Server] Storage initialization failed:', err);
});

// Mount routes
app.use('/api/library', libraryRoutes);
app.use('/api/github', githubRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CollabHub AI Backend is running' });
});

// Health check for individual LLM providers
app.get('/api/health/:provider', async (req, res) => {
  const { provider } = req.params;

  try {
    let isHealthy = false;
    let errorMessage = '';

    switch (provider) {
      case 'anthropic':
        try {
          await anthropicChat('ping', []);
          isHealthy = true;
        } catch (error: any) {
          errorMessage = error.message;
        }
        break;

      case 'openai':
        try {
          await openaiChat('ping', []);
          isHealthy = true;
        } catch (error: any) {
          errorMessage = error.message;
        }
        break;

      case 'google':
        try {
          await googleChat('ping', []);
          isHealthy = true;
        } catch (error: any) {
          errorMessage = error.message;
        }
        break;

      case 'perplexity':
        try {
          await perplexityChat('ping', []);
          isHealthy = true;
        } catch (error: any) {
          errorMessage = error.message;
        }
        break;

      default:
        return res.status(400).json({
          provider,
          status: 'unknown',
          error: 'Unknown provider'
        });
    }

    res.json({
      provider,
      status: isHealthy ? 'online' : 'offline',
      error: errorMessage || undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      provider,
      status: 'offline',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Message endpoint
app.post('/api/messages', async (req, res) => {
  try {
    const { content, agentId, conversationHistory, activeAgents, projectId, messageId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    console.log(`Processing message for agent: ${agentId}`);

    // Build context from conversation history
    let contextMessages: Array<{role: string, content: string, author?: string}> = [];
    if (conversationHistory && conversationHistory.length > 0) {
      contextMessages = conversationHistory.map((msg: any) => ({
        role: msg.authorType === 'human' ? 'user' : 'assistant',
        content: msg.content,
        author: msg.authorName || msg.authorId
      }));
    }

    // Build enriched context if projectId provided
    let enrichedContext = undefined;
    if (projectId) {
      try {
        console.log(`[Messages] Building enriched context for project: ${projectId}, agent: ${agentId}`);
        enrichedContext = await buildEnrichedContext(
          projectId,
          agentId,
          content,
          contextMessages,
          agentId // Using agentId as modelName
        );
        console.log(`[Messages] Context built: ${enrichedContext.metadata.documentsIncluded} docs, ${enrichedContext.metadata.codeFilesIncluded} files, ${enrichedContext.totalTokens} tokens`);
      } catch (contextError: any) {
        console.warn('[Messages] Failed to build context:', contextError.message);
        // Continue without context if it fails - don't break the flow
      }
    }

    let response: string;
    let provider: string;

    // Route to appropriate LLM based on agent ID
    switch (agentId) {
      case 'claude-3.5-sonnet':
        provider = 'anthropic';
        response = await anthropicChat(content, contextMessages, enrichedContext);
        break;

      case 'gpt-4-turbo':
        provider = 'openai';
        response = await openaiChat(content, contextMessages, enrichedContext);
        break;

      case 'gemini-1.5-pro':
        provider = 'google';
        response = await googleChat(content, contextMessages, enrichedContext);
        break;

      case 'perplexity-ai':
        provider = 'perplexity';
        response = await perplexityChat(content, contextMessages, enrichedContext);
        break;

      case 'mistral-large':
        provider = 'mistral';
        response = await mistralChat(content, contextMessages, enrichedContext);
        break;

      case 'grok-2':
        provider = 'xai';
        response = await grokChat(content, contextMessages, enrichedContext);
        break;

      case 'deepseek-chat':
        provider = 'deepseek';
        response = await deepseekChat(content, contextMessages, enrichedContext);
        break;

      case 'manus-1':
        provider = 'manus';
        response = await manusChat(content, contextMessages, enrichedContext);
        break;

      case 'llama-3.3':
        provider = 'meta';
        response = await llamaChat(content, contextMessages, enrichedContext);
        break;

      case 'command-r-plus':
        provider = 'cohere';
        response = await cohereChat(content, contextMessages, enrichedContext);
        break;

      case 'qwen-turbo':
        provider = 'alibaba';
        response = await qwenChat(content, contextMessages, enrichedContext);
        break;

      case 'inflection-3-pi':
        provider = 'inflection';
        response = await inflectionChat(content, contextMessages, enrichedContext);
        break;

      default:
        return res.status(400).json({ error: `Unknown agent: ${agentId}` });
    }

    // Track context usage if context was used and messageId provided
    if (enrichedContext && messageId) {
      try {
        await trackContextUsage(messageId, agentId, enrichedContext);
      } catch (trackError: any) {
        console.warn('[Messages] Failed to track context usage:', trackError.message);
        // Don't fail the request if tracking fails
      }
    }

    // Return the response with context metadata
    res.json({
      success: true,
      agentId,
      provider,
      response,
      context: enrichedContext ? {
        documentsIncluded: enrichedContext.metadata.documentsIncluded,
        codeFilesIncluded: enrichedContext.metadata.codeFilesIncluded,
        tokensUsed: enrichedContext.totalTokens,
        tokenBudget: enrichedContext.metadata.tokenBudget,
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error processing message:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 CollabHub AI Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Messages API: http://localhost:${PORT}/api/messages\n`);
});
