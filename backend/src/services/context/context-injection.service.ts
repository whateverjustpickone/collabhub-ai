// Context Injection Service - THE CRITICAL SERVICE for agent knowledge awareness
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Model token limits (conservative estimates for safety)
const MODEL_TOKEN_LIMITS = {
  'claude-3.5-sonnet': 200000,
  'gpt-4-turbo': 128000,
  'gemini-1.5-pro': 1000000,
  'perplexity-ai': 16000,
  'mistral-large': 128000,
  'grok-2': 128000,
  'deepseek-chat': 64000,
  'manus-1': 128000,
  'llama-3.3': 128000,
  'command-r-plus': 128000,
  'qwen-turbo': 32000,
  'inflection-3-pi': 32000,
};

// Token budget allocation (percentages)
const TOKEN_ALLOCATION = {
  conversation: 0.40,  // 40% for conversation history
  context: 0.45,       // 45% for injected context (documents + code)
  response: 0.15,      // 15% reserved for response generation
};

// Relevance scoring weights
const RELEVANCE_WEIGHTS = {
  explicitMention: 10.0,   // Directly referenced in current message
  keywordMatch: 3.0,       // Keywords match
  tagMatch: 2.0,           // Tags match
  recentAccess: 1.5,       // Recently accessed
  filePathMention: 8.0,    // Code file path mentioned
  repositoryMention: 5.0,  // Repository mentioned
};

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

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Extract keywords from message for relevance matching
 */
function extractKeywords(message: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'can', 'may', 'might', 'must', 'this', 'that', 'these', 'those',
  ]);

  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.has(word));

  return Array.from(new Set(words));
}

/**
 * Calculate relevance score for a document
 */
function calculateDocumentRelevance(
  document: any,
  currentMessage: string,
  keywords: string[],
  explicitMentions: Set<string>
): number {
  let score = 0;

  // Check explicit mention (highest priority)
  if (
    explicitMentions.has(document.id) ||
    explicitMentions.has(document.title.toLowerCase())
  ) {
    score += RELEVANCE_WEIGHTS.explicitMention;
  }

  // Keyword matching in title and content
  const documentText = `${document.title} ${document.description || ''} ${document.contentText || ''}`.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) =>
    documentText.includes(keyword)
  );
  score += matchedKeywords.length * RELEVANCE_WEIGHTS.keywordMatch;

  // Tag matching
  if (document.tags && Array.isArray(document.tags)) {
    const matchedTags = document.tags.filter((tag: string) =>
      keywords.includes(tag.toLowerCase())
    );
    score += matchedTags.length * RELEVANCE_WEIGHTS.tagMatch;
  }

  // Recent access bonus
  if (document.lastAccessedAt) {
    const hoursSinceAccess =
      (Date.now() - new Date(document.lastAccessedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceAccess < 24) {
      score += RELEVANCE_WEIGHTS.recentAccess;
    }
  }

  return score;
}

/**
 * Calculate relevance score for a code file
 */
function calculateCodeFileRelevance(
  codeFile: any,
  currentMessage: string,
  keywords: string[],
  explicitMentions: Set<string>
): number {
  let score = 0;

  // Check explicit file path mention
  if (
    explicitMentions.has(codeFile.filePath.toLowerCase()) ||
    currentMessage.toLowerCase().includes(codeFile.filePath.toLowerCase())
  ) {
    score += RELEVANCE_WEIGHTS.filePathMention;
  }

  // Check repository mention
  if (codeFile.repository && codeFile.repository.fullName) {
    const repoName = codeFile.repository.fullName.toLowerCase();
    if (currentMessage.toLowerCase().includes(repoName)) {
      score += RELEVANCE_WEIGHTS.repositoryMention;
    }
  }

  // Keyword matching in file content
  const fileContent = (codeFile.contentText || '').toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => fileContent.includes(keyword));
  score += matchedKeywords.length * RELEVANCE_WEIGHTS.keywordMatch;

  // File name/extension relevance
  const fileName = codeFile.fileName.toLowerCase();
  const matchedFileNameKeywords = keywords.filter((keyword) =>
    fileName.includes(keyword)
  );
  score += matchedFileNameKeywords.length * RELEVANCE_WEIGHTS.keywordMatch;

  return score;
}

/**
 * Build enriched context for agent from documents and code
 */
export async function buildEnrichedContext(
  projectId: string,
  agentId: string,
  currentMessage: string,
  conversationHistory: any[],
  modelName: string
): Promise<EnrichedContext> {
  try {
    // Get token limits for model
    const modelLimit = MODEL_TOKEN_LIMITS[modelName as keyof typeof MODEL_TOKEN_LIMITS] || 16000;

    // Calculate token budgets
    const conversationTokens = estimateTokens(
      conversationHistory.map((m) => m.content).join('\n')
    );
    const contextBudget = Math.floor(modelLimit * TOKEN_ALLOCATION.context);

    // Extract keywords and explicit mentions from current message
    const keywords = extractKeywords(currentMessage);
    const explicitMentions = new Set(
      currentMessage.toLowerCase().match(/["']([^"']+)["']/g)?.map((m) => m.slice(1, -1)) || []
    );

    // Fetch relevant documents from library
    const documents = await prisma.libraryDocument.findMany({
      where: {
        projectId,
        isActive: true,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      take: 50, // Fetch top 50 to score and filter
      orderBy: [
        { lastAccessedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Score and sort documents by relevance
    const scoredDocuments = documents
      .map((doc) => ({
        ...doc,
        relevance: calculateDocumentRelevance(doc, currentMessage, keywords, explicitMentions),
        tokens: estimateTokens(doc.contentText || ''),
      }))
      .filter((doc) => doc.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);

    // Fetch relevant code files from GitHub
    const codeFiles = await prisma.gitHubCodeFile.findMany({
      where: {
        repository: {
          projectId,
          syncEnabled: true,
        },
      },
      include: {
        repository: {
          select: {
            fullName: true,
          },
        },
      },
      take: 50,
      orderBy: {
        lastFetchedAt: 'desc',
      },
    });

    // Score and sort code files by relevance
    const scoredCodeFiles = codeFiles
      .map((file) => ({
        ...file,
        relevance: calculateCodeFileRelevance(file, currentMessage, keywords, explicitMentions),
        tokens: estimateTokens(file.contentText || ''),
      }))
      .filter((file) => file.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);

    // Build context within token budget
    const selectedDocuments: any[] = [];
    const selectedCodeFiles: any[] = [];
    let tokensUsed = 0;

    // Prioritize high-relevance items
    const allItems = [
      ...scoredDocuments.map((d) => ({ type: 'document', item: d })),
      ...scoredCodeFiles.map((f) => ({ type: 'code', item: f })),
    ].sort((a, b) => b.item.relevance - a.item.relevance);

    // Fill context budget
    for (const { type, item } of allItems) {
      if (tokensUsed + item.tokens > contextBudget) {
        continue; // Skip if would exceed budget
      }

      if (type === 'document') {
        selectedDocuments.push({
          id: item.id,
          title: item.title,
          content: item.contentText || '',
          relevance: item.relevance,
          tokens: item.tokens,
        });
      } else {
        selectedCodeFiles.push({
          id: item.id,
          path: item.filePath,
          content: item.contentText || '',
          repository: item.repository.fullName,
          relevance: item.relevance,
          tokens: item.tokens,
        });
      }

      tokensUsed += item.tokens;
    }

    return {
      documents: selectedDocuments,
      codeFiles: selectedCodeFiles,
      totalTokens: tokensUsed,
      metadata: {
        documentsIncluded: selectedDocuments.length,
        codeFilesIncluded: selectedCodeFiles.length,
        tokenBudget: contextBudget,
        tokenUsed: tokensUsed,
      },
    };
  } catch (error) {
    console.error('[Context Injection] Build context failed:', error);
    return {
      documents: [],
      codeFiles: [],
      totalTokens: 0,
      metadata: {
        documentsIncluded: 0,
        codeFilesIncluded: 0,
        tokenBudget: 0,
        tokenUsed: 0,
      },
    };
  }
}

/**
 * Format enriched context for LLM system prompt
 */
export function formatContextForPrompt(context: EnrichedContext): string {
  if (context.documents.length === 0 && context.codeFiles.length === 0) {
    return '';
  }

  let prompt = '\n\n## Available Knowledge Base\n\n';

  // Add documents
  if (context.documents.length > 0) {
    prompt += '### Project Documents:\n\n';
    for (const doc of context.documents) {
      prompt += `**${doc.title}** (Relevance: ${doc.relevance.toFixed(1)})\n`;
      prompt += `${doc.content.substring(0, 1000)}${doc.content.length > 1000 ? '...' : ''}\n\n`;
    }
  }

  // Add code files
  if (context.codeFiles.length > 0) {
    prompt += '### Connected Code Files:\n\n';
    for (const file of context.codeFiles) {
      const extension = file.path.split('.').pop() || '';
      prompt += `**${file.path}** (${file.repository}) (Relevance: ${file.relevance.toFixed(1)})\n`;
      prompt += '```' + extension + '\n';
      prompt += `${file.content.substring(0, 500)}${file.content.length > 500 ? '...' : ''}\n`;
      prompt += '```\n\n';
    }
  }

  prompt += `\n*Context includes ${context.metadata.documentsIncluded} documents and ${context.metadata.codeFilesIncluded} code files (${context.totalTokens} tokens)*\n`;
  prompt += '\n**Instructions:** Reference these materials when relevant to the conversation. Cite specific documents or files when you use information from them.\n';

  return prompt;
}

/**
 * Track context usage in database for analytics
 */
export async function trackContextUsage(
  messageId: string,
  agentId: string,
  context: EnrichedContext
): Promise<void> {
  try {
    // Track document usage
    const documentUsagePromises = context.documents.map((doc) =>
      prisma.contextDocumentUsage.create({
        data: {
          documentId: doc.id,
          messageId,
          agentId,
          relevanceScore: doc.relevance,
          usageType: doc.relevance >= RELEVANCE_WEIGHTS.explicitMention ? 'REFERENCED' : 'AUTO_INJECTED',
          tokensUsed: doc.tokens,
        },
      })
    );

    // Track code file usage
    const codeUsagePromises = context.codeFiles.map((file) =>
      prisma.contextGitHubUsage.create({
        data: {
          repositoryId: file.id, // Will need to map this properly
          codeFileId: file.id,
          messageId,
          agentId,
          relevanceScore: file.relevance,
          usageType: file.relevance >= RELEVANCE_WEIGHTS.filePathMention ? 'FILE_REFERENCED' : 'CODE_ANALYZED',
          tokensUsed: file.tokens,
        },
      })
    );

    await Promise.all([...documentUsagePromises, ...codeUsagePromises]);

    console.log(
      `[Context Injection] Tracked usage: ${context.documents.length} docs, ${context.codeFiles.length} files`
    );
  } catch (error) {
    console.error('[Context Injection] Track usage failed:', error);
    // Don't throw - tracking failure shouldn't break the main flow
  }
}

/**
 * Get context statistics for a project
 */
export async function getContextStatistics(projectId: string, days: number = 7) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [documentUsage, codeUsage, totalMessages] = await Promise.all([
      prisma.contextDocumentUsage.count({
        where: {
          document: { projectId },
          createdAt: { gte: since },
        },
      }),
      prisma.contextGitHubUsage.count({
        where: {
          repository: { projectId },
          createdAt: { gte: since },
        },
      }),
      prisma.contextDocumentUsage.groupBy({
        by: ['messageId'],
        where: {
          document: { projectId },
          createdAt: { gte: since },
        },
      }),
    ]);

    // Get most referenced documents
    const topDocuments = await prisma.contextDocumentUsage.groupBy({
      by: ['documentId'],
      where: {
        document: { projectId },
        createdAt: { gte: since },
      },
      _count: {
        documentId: true,
      },
      orderBy: {
        _count: {
          documentId: 'desc',
        },
      },
      take: 10,
    });

    return {
      period: `${days} days`,
      totalDocumentUsages: documentUsage,
      totalCodeUsages: codeUsage,
      messagesWithContext: totalMessages.length,
      topDocuments: topDocuments.map((d) => ({
        documentId: d.documentId,
        usageCount: d._count.documentId,
      })),
    };
  } catch (error) {
    console.error('[Context Injection] Get statistics failed:', error);
    throw error;
  }
}
