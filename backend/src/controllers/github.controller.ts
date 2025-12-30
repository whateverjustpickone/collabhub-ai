// GitHub Controller - REST API handlers for GitHub integration
import { Request, Response } from 'express';
import crypto from 'crypto';
import * as authService from '../services/github/github-auth.service';
import * as apiService from '../services/github/github-api.service';

// In-memory store for OAuth state tokens (in production, use Redis)
const oauthStates = new Map<string, { userId: string; projectId: string; expires: number }>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expires < now) {
      oauthStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

// ============================================
// OAUTH FLOW
// ============================================

/**
 * Initiate GitHub OAuth flow
 * GET /api/github/auth?userId=...&projectId=...
 */
export async function initiateAuth(req: Request, res: Response) {
  try {
    const { userId, projectId } = req.query;

    if (!userId || !projectId) {
      return res.status(400).json({
        error: 'userId and projectId are required',
      });
    }

    // Generate state token
    const state = crypto.randomBytes(32).toString('hex');
    oauthStates.set(state, {
      userId: userId as string,
      projectId: projectId as string,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Get authorization URL
    const authUrl = authService.getAuthorizationUrl(state);

    res.json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Initiate auth failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate GitHub OAuth',
    });
  }
}

/**
 * Handle GitHub OAuth callback
 * GET /api/github/auth/callback?code=...&state=...
 */
export async function handleCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('Missing code or state parameter');
    }

    // Verify state
    const stateData = oauthStates.get(state as string);
    if (!stateData) {
      return res.status(400).send('Invalid or expired state token');
    }

    // Clean up state
    oauthStates.delete(state as string);

    // Exchange code for token
    const tokenData = await authService.exchangeCodeForToken(code as string);

    // Get GitHub user info
    const githubUser = await authService.getGitHubUser(tokenData.accessToken);

    // Store connection
    await authService.storeConnection(
      stateData.userId,
      stateData.projectId,
      tokenData.accessToken,
      tokenData.refreshToken,
      tokenData.expiresAt,
      tokenData.scope,
      githubUser
    );

    // Redirect to success page (frontend will handle this)
    res.redirect(`http://localhost:5176/github/callback?success=true&username=${githubUser.login}`);
  } catch (error: any) {
    console.error('[GitHub Controller] OAuth callback failed:', error);
    res.redirect(`http://localhost:5176/github/callback?error=${encodeURIComponent(error.message)}`);
  }
}

/**
 * Get connection status
 * GET /api/github/connection?userId=...&projectId=...
 */
export async function getConnectionStatus(req: Request, res: Response) {
  try {
    const { userId, projectId } = req.query;

    if (!userId || !projectId) {
      return res.status(400).json({
        error: 'userId and projectId are required',
      });
    }

    const connection = await authService.getConnection(
      userId as string,
      projectId as string
    );

    if (!connection) {
      return res.json({
        success: true,
        connected: false,
      });
    }

    res.json({
      success: true,
      connected: true,
      connection: {
        username: connection.githubUsername,
        scopes: connection.scopes,
        isActive: connection.isActive,
        expiresAt: connection.tokenExpiresAt,
        connectedAt: connection.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Get connection status failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get connection status',
    });
  }
}

/**
 * Revoke connection
 * DELETE /api/github/connection
 */
export async function revokeConnection(req: Request, res: Response) {
  try {
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({
        error: 'userId and projectId are required',
      });
    }

    await authService.revokeConnection(userId, projectId);

    res.json({
      success: true,
      message: 'GitHub connection revoked',
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Revoke connection failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to revoke connection',
    });
  }
}

// ============================================
// REPOSITORY OPERATIONS
// ============================================

/**
 * List user's repositories
 * GET /api/github/repositories?userId=...&projectId=...
 */
export async function listRepositories(req: Request, res: Response) {
  try {
    const { userId, projectId, visibility, sort, per_page, page } = req.query;

    if (!userId || !projectId) {
      return res.status(400).json({
        error: 'userId and projectId are required',
      });
    }

    const repositories = await apiService.listRepositories(
      userId as string,
      projectId as string,
      {
        visibility: visibility as any,
        sort: sort as any,
        per_page: per_page ? parseInt(per_page as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
      }
    );

    res.json({
      success: true,
      repositories,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] List repositories failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list repositories',
    });
  }
}

/**
 * Connect repository to project
 * POST /api/github/repositories/connect
 */
export async function connectRepository(req: Request, res: Response) {
  try {
    const { userId, projectId, owner, repo } = req.body;

    if (!userId || !projectId || !owner || !repo) {
      return res.status(400).json({
        error: 'userId, projectId, owner, and repo are required',
      });
    }

    const repository = await apiService.connectRepository(
      userId,
      projectId,
      owner,
      repo
    );

    res.status(201).json({
      success: true,
      repository,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Connect repository failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect repository',
    });
  }
}

/**
 * Get connected repositories
 * GET /api/github/repositories/connected?projectId=...
 */
export async function getConnectedRepositories(req: Request, res: Response) {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        error: 'projectId is required',
      });
    }

    const repositories = await apiService.getConnectedRepositories(projectId as string);

    res.json({
      success: true,
      repositories,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Get connected repositories failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get connected repositories',
    });
  }
}

/**
 * Disconnect repository
 * DELETE /api/github/repositories/:id
 */
export async function disconnectRepository(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        error: 'projectId is required',
      });
    }

    await apiService.disconnectRepository(id, projectId as string);

    res.json({
      success: true,
      message: 'Repository disconnected',
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Disconnect repository failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to disconnect repository',
    });
  }
}

// ============================================
// FILE OPERATIONS
// ============================================

/**
 * Get file content
 * GET /api/github/files/content
 */
export async function getFileContent(req: Request, res: Response) {
  try {
    const { userId, projectId, owner, repo, path, branch } = req.query;

    if (!userId || !projectId || !owner || !repo || !path) {
      return res.status(400).json({
        error: 'userId, projectId, owner, repo, and path are required',
      });
    }

    const file = await apiService.getFileContent(
      userId as string,
      projectId as string,
      owner as string,
      repo as string,
      path as string,
      branch as string | undefined
    );

    res.json({
      success: true,
      file,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Get file content failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get file content',
    });
  }
}

/**
 * List files in directory
 * GET /api/github/files/list
 */
export async function listFiles(req: Request, res: Response) {
  try {
    const { userId, projectId, owner, repo, path, branch } = req.query;

    if (!userId || !projectId || !owner || !repo) {
      return res.status(400).json({
        error: 'userId, projectId, owner, and repo are required',
      });
    }

    const files = await apiService.listFiles(
      userId as string,
      projectId as string,
      owner as string,
      repo as string,
      path as string || '',
      branch as string | undefined
    );

    res.json({
      success: true,
      files,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] List files failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list files',
    });
  }
}

/**
 * Search code in repository
 * GET /api/github/files/search
 */
export async function searchCode(req: Request, res: Response) {
  try {
    const { userId, projectId, owner, repo, query, extension, path, per_page, page } = req.query;

    if (!userId || !projectId || !owner || !repo || !query) {
      return res.status(400).json({
        error: 'userId, projectId, owner, repo, and query are required',
      });
    }

    const results = await apiService.searchCode(
      userId as string,
      projectId as string,
      owner as string,
      repo as string,
      query as string,
      {
        extension: extension as string | undefined,
        path: path as string | undefined,
        per_page: per_page ? parseInt(per_page as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
      }
    );

    res.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Search code failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search code',
    });
  }
}

// ============================================
// PULL REQUEST OPERATIONS
// ============================================

/**
 * Create pull request
 * POST /api/github/pulls
 */
export async function createPullRequest(req: Request, res: Response) {
  try {
    const { userId, projectId, owner, repo, title, body, head, base, draft } = req.body;

    if (!userId || !projectId || !owner || !repo || !title || !head || !base) {
      return res.status(400).json({
        error: 'userId, projectId, owner, repo, title, head, and base are required',
      });
    }

    const pr = await apiService.createPullRequest(
      userId,
      projectId,
      owner,
      repo,
      { title, body, head, base, draft }
    );

    res.status(201).json({
      success: true,
      pullRequest: pr,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Create PR failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create pull request',
    });
  }
}

/**
 * List pull requests
 * GET /api/github/pulls
 */
export async function listPullRequests(req: Request, res: Response) {
  try {
    const { userId, projectId, owner, repo, state } = req.query;

    if (!userId || !projectId || !owner || !repo) {
      return res.status(400).json({
        error: 'userId, projectId, owner, and repo are required',
      });
    }

    const prs = await apiService.listPullRequests(
      userId as string,
      projectId as string,
      owner as string,
      repo as string,
      state as any || 'open'
    );

    res.json({
      success: true,
      pullRequests: prs,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] List PRs failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list pull requests',
    });
  }
}

// ============================================
// ISSUE OPERATIONS
// ============================================

/**
 * Create issue
 * POST /api/github/issues
 */
export async function createIssue(req: Request, res: Response) {
  try {
    const { userId, projectId, owner, repo, title, body, labels, assignees } = req.body;

    if (!userId || !projectId || !owner || !repo || !title) {
      return res.status(400).json({
        error: 'userId, projectId, owner, repo, and title are required',
      });
    }

    const issue = await apiService.createIssue(
      userId,
      projectId,
      owner,
      repo,
      { title, body, labels, assignees }
    );

    res.status(201).json({
      success: true,
      issue,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Create issue failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create issue',
    });
  }
}

/**
 * List issues
 * GET /api/github/issues
 */
export async function listIssues(req: Request, res: Response) {
  try {
    const { userId, projectId, owner, repo, state } = req.query;

    if (!userId || !projectId || !owner || !repo) {
      return res.status(400).json({
        error: 'userId, projectId, owner, and repo are required',
      });
    }

    const issues = await apiService.listIssues(
      userId as string,
      projectId as string,
      owner as string,
      repo as string,
      state as any || 'open'
    );

    res.json({
      success: true,
      issues,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] List issues failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list issues',
    });
  }
}

// ============================================
// RATE LIMIT
// ============================================

/**
 * Check rate limit status
 * GET /api/github/rate-limit
 */
export async function getRateLimit(req: Request, res: Response) {
  try {
    const { userId, projectId } = req.query;

    if (!userId || !projectId) {
      return res.status(400).json({
        error: 'userId and projectId are required',
      });
    }

    const rateLimit = await apiService.checkRateLimit(
      userId as string,
      projectId as string
    );

    res.json({
      success: true,
      rateLimit,
    });
  } catch (error: any) {
    console.error('[GitHub Controller] Get rate limit failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get rate limit',
    });
  }
}
