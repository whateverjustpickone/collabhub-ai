// GitHub API Service - Wrapper for GitHub REST API
import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import * as authService from './github-auth.service';
import crypto from 'crypto';

const prisma = new PrismaClient();

// GitHub API rate limit: 5000 requests per hour
const RATE_LIMIT_WARNING_THRESHOLD = 0.8; // Warn at 80% usage

/**
 * Create authenticated GitHub API client
 */
async function createClient(userId: string, projectId: string): Promise<AxiosInstance> {
  const accessToken = await authService.getAccessToken(userId, projectId);

  return axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'CollabHub-AI',
    },
  });
}

/**
 * Check rate limit status
 */
export async function checkRateLimit(userId: string, projectId: string): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
  warningThreshold: number;
}> {
  try {
    const client = await createClient(userId, projectId);
    const response = await client.get('/rate_limit');

    const { limit, remaining, reset } = response.data.rate;

    if (remaining < limit * (1 - RATE_LIMIT_WARNING_THRESHOLD)) {
      console.warn(`[GitHub API] Rate limit warning: ${remaining}/${limit} remaining`);
    }

    return {
      limit,
      remaining,
      reset: new Date(reset * 1000),
      warningThreshold: Math.floor(limit * RATE_LIMIT_WARNING_THRESHOLD),
    };
  } catch (error: any) {
    console.error('[GitHub API] Check rate limit failed:', error.message);
    throw error;
  }
}

// ============================================
// REPOSITORY OPERATIONS
// ============================================

/**
 * List user's repositories
 */
export async function listRepositories(
  userId: string,
  projectId: string,
  options: {
    visibility?: 'all' | 'public' | 'private';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    per_page?: number;
    page?: number;
  } = {}
) {
  try {
    const client = await createClient(userId, projectId);
    const response = await client.get('/user/repos', {
      params: {
        visibility: options.visibility || 'all',
        sort: options.sort || 'updated',
        per_page: options.per_page || 30,
        page: options.page || 1,
      },
    });

    return response.data.map((repo: any) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      defaultBranch: repo.default_branch,
      language: repo.language,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      updatedAt: new Date(repo.updated_at),
    }));
  } catch (error: any) {
    console.error('[GitHub API] List repositories failed:', error.message);
    throw error;
  }
}

/**
 * Get repository details
 */
export async function getRepository(userId: string, projectId: string, owner: string, repo: string) {
  try {
    const client = await createClient(userId, projectId);
    const response = await client.get(`/repos/${owner}/${repo}`);

    return {
      id: response.data.id.toString(),
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      private: response.data.private,
      defaultBranch: response.data.default_branch,
      language: response.data.language,
      url: response.data.html_url,
      cloneUrl: response.data.clone_url,
      topics: response.data.topics || [],
      createdAt: new Date(response.data.created_at),
      updatedAt: new Date(response.data.updated_at),
    };
  } catch (error: any) {
    console.error('[GitHub API] Get repository failed:', error.message);
    throw error;
  }
}

/**
 * Connect repository to project
 */
export async function connectRepository(
  userId: string,
  projectId: string,
  owner: string,
  repoName: string
) {
  try {
    // Get connection
    const connection = await prisma.gitHubConnection.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!connection) {
      throw new Error('GitHub connection not found');
    }

    // Get repository details from GitHub
    const repoDetails = await getRepository(userId, projectId, owner, repoName);

    // Store in database
    const repository = await prisma.gitHubRepository.upsert({
      where: {
        connectionId_githubRepoId: {
          connectionId: connection.id,
          githubRepoId: repoDetails.id,
        },
      },
      create: {
        connectionId: connection.id,
        projectId,
        githubRepoId: repoDetails.id,
        fullName: repoDetails.fullName,
        defaultBranch: repoDetails.defaultBranch,
        isPrivate: repoDetails.private,
        description: repoDetails.description,
        language: repoDetails.language,
        syncEnabled: true,
        metadata: {
          topics: repoDetails.topics,
          url: repoDetails.url,
          cloneUrl: repoDetails.cloneUrl,
        },
      },
      update: {
        fullName: repoDetails.fullName,
        defaultBranch: repoDetails.defaultBranch,
        isPrivate: repoDetails.private,
        description: repoDetails.description,
        language: repoDetails.language,
        syncEnabled: true,
        metadata: {
          topics: repoDetails.topics,
          url: repoDetails.url,
          cloneUrl: repoDetails.cloneUrl,
        },
        updatedAt: new Date(),
      },
      include: {
        connection: {
          select: {
            githubUsername: true,
          },
        },
      },
    });

    console.log('[GitHub API] Repository connected:', repository.id);
    return repository;
  } catch (error: any) {
    console.error('[GitHub API] Connect repository failed:', error.message);
    throw error;
  }
}

// ============================================
// FILE OPERATIONS
// ============================================

/**
 * Get file content from repository
 */
export async function getFileContent(
  userId: string,
  projectId: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string
) {
  try {
    const client = await createClient(userId, projectId);
    const params: any = { ref: branch };

    const response = await client.get(`/repos/${owner}/${repo}/contents/${path}`, { params });

    if (response.data.type !== 'file') {
      throw new Error('Path is not a file');
    }

    // Decode base64 content
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');

    return {
      path: response.data.path,
      name: response.data.name,
      size: response.data.size,
      sha: response.data.sha,
      content,
      url: response.data.html_url,
    };
  } catch (error: any) {
    console.error('[GitHub API] Get file content failed:', error.message);
    throw error;
  }
}

/**
 * List files in directory
 */
export async function listFiles(
  userId: string,
  projectId: string,
  owner: string,
  repo: string,
  path: string = '',
  branch?: string
) {
  try {
    const client = await createClient(userId, projectId);
    const params: any = {};
    if (branch) params.ref = branch;

    const response = await client.get(`/repos/${owner}/${repo}/contents/${path}`, { params });

    if (!Array.isArray(response.data)) {
      return [response.data];
    }

    return response.data.map((item: any) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      sha: item.sha,
      url: item.html_url,
    }));
  } catch (error: any) {
    console.error('[GitHub API] List files failed:', error.message);
    throw error;
  }
}

/**
 * Search code in repository
 */
export async function searchCode(
  userId: string,
  projectId: string,
  owner: string,
  repo: string,
  query: string,
  options: {
    extension?: string;
    path?: string;
    per_page?: number;
    page?: number;
  } = {}
) {
  try {
    const client = await createClient(userId, projectId);

    let searchQuery = `${query} repo:${owner}/${repo}`;
    if (options.extension) searchQuery += ` extension:${options.extension}`;
    if (options.path) searchQuery += ` path:${options.path}`;

    const response = await client.get('/search/code', {
      params: {
        q: searchQuery,
        per_page: options.per_page || 30,
        page: options.page || 1,
      },
    });

    return {
      total: response.data.total_count,
      items: response.data.items.map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        url: item.html_url,
        repository: {
          name: item.repository.name,
          fullName: item.repository.full_name,
        },
      })),
    };
  } catch (error: any) {
    console.error('[GitHub API] Search code failed:', error.message);
    throw error;
  }
}

/**
 * Cache code file in database
 */
export async function cacheCodeFile(
  repositoryId: string,
  filePath: string,
  fileName: string,
  fileType: string,
  content: string,
  sha: string,
  branch: string = 'main'
) {
  try {
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    const codeFile = await prisma.gitHubCodeFile.upsert({
      where: {
        repositoryId_filePath_branch: {
          repositoryId,
          filePath,
          branch,
        },
      },
      create: {
        repositoryId,
        filePath,
        fileName,
        fileType,
        contentText: content,
        contentHash,
        size: Buffer.byteLength(content, 'utf-8'),
        branch,
        lastFetchedAt: new Date(),
        metadata: { sha },
      },
      update: {
        contentText: content,
        contentHash,
        size: Buffer.byteLength(content, 'utf-8'),
        lastFetchedAt: new Date(),
        metadata: { sha },
      },
    });

    return codeFile;
  } catch (error: any) {
    console.error('[GitHub API] Cache code file failed:', error.message);
    throw error;
  }
}

// ============================================
// PULL REQUEST OPERATIONS
// ============================================

/**
 * Create pull request
 */
export async function createPullRequest(
  userId: string,
  projectId: string,
  owner: string,
  repo: string,
  data: {
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
  }
) {
  try {
    const client = await createClient(userId, projectId);

    const response = await client.post(`/repos/${owner}/${repo}/pulls`, data);

    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body,
      state: response.data.state,
      url: response.data.html_url,
      head: response.data.head.ref,
      base: response.data.base.ref,
      createdAt: new Date(response.data.created_at),
    };
  } catch (error: any) {
    console.error('[GitHub API] Create PR failed:', error.message);
    throw error;
  }
}

/**
 * List pull requests
 */
export async function listPullRequests(
  userId: string,
  projectId: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
) {
  try {
    const client = await createClient(userId, projectId);

    const response = await client.get(`/repos/${owner}/${repo}/pulls`, {
      params: { state },
    });

    return response.data.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      url: pr.html_url,
      head: pr.head.ref,
      base: pr.base.ref,
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(pr.updated_at),
    }));
  } catch (error: any) {
    console.error('[GitHub API] List PRs failed:', error.message);
    throw error;
  }
}

// ============================================
// ISSUE OPERATIONS
// ============================================

/**
 * Create issue
 */
export async function createIssue(
  userId: string,
  projectId: string,
  owner: string,
  repo: string,
  data: {
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  }
) {
  try {
    const client = await createClient(userId, projectId);

    const response = await client.post(`/repos/${owner}/${repo}/issues`, data);

    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body,
      state: response.data.state,
      url: response.data.html_url,
      labels: response.data.labels.map((l: any) => l.name),
      createdAt: new Date(response.data.created_at),
    };
  } catch (error: any) {
    console.error('[GitHub API] Create issue failed:', error.message);
    throw error;
  }
}

/**
 * List issues
 */
export async function listIssues(
  userId: string,
  projectId: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
) {
  try {
    const client = await createClient(userId, projectId);

    const response = await client.get(`/repos/${owner}/${repo}/issues`, {
      params: { state },
    });

    return response.data
      .filter((issue: any) => !issue.pull_request) // Filter out PRs
      .map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        labels: issue.labels.map((l: any) => l.name),
        createdAt: new Date(issue.created_at),
        updatedAt: new Date(issue.updated_at),
      }));
  } catch (error: any) {
    console.error('[GitHub API] List issues failed:', error.message);
    throw error;
  }
}

// ============================================
// CONNECTED REPOSITORIES
// ============================================

/**
 * Get connected repositories for a project
 */
export async function getConnectedRepositories(projectId: string) {
  try {
    const repositories = await prisma.gitHubRepository.findMany({
      where: {
        projectId,
        syncEnabled: true,
      },
      include: {
        connection: {
          select: {
            githubUsername: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            codeFiles: true,
            pullRequests: true,
            issues: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return repositories;
  } catch (error: any) {
    console.error('[GitHub API] Get connected repositories failed:', error.message);
    throw error;
  }
}

/**
 * Disconnect repository
 */
export async function disconnectRepository(repositoryId: string, projectId: string) {
  try {
    const result = await prisma.gitHubRepository.updateMany({
      where: {
        id: repositoryId,
        projectId,
      },
      data: {
        syncEnabled: false,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new Error('Repository not found');
    }

    console.log('[GitHub API] Repository disconnected:', repositoryId);
    return { success: true };
  } catch (error: any) {
    console.error('[GitHub API] Disconnect repository failed:', error.message);
    throw error;
  }
}
