// GitHub Authentication Service - OAuth flow and token management
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';

const prisma = new PrismaClient();

// GitHub OAuth Configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || '';
const ENCRYPTION_KEY = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || '';

// OAuth scopes required for full repository access
const REQUIRED_SCOPES = ['repo', 'read:user', 'write:discussion'];

/**
 * Encrypt token using AES-256-GCM
 */
function encryptToken(token: string): { encrypted: string; iv: string; tag: string } {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('GITHUB_TOKEN_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
  }

  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypt token using AES-256-GCM
 */
function decryptToken(encrypted: string, iv: string, tag: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('GITHUB_TOKEN_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
  }

  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  if (!GITHUB_CLIENT_ID) {
    throw new Error('GITHUB_CLIENT_ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: REQUIRED_SCOPES.join(' '),
    state,
    allow_signup: 'true',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope: string[];
}> {
  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const { access_token, refresh_token, expires_in, scope } = response.data;

    if (!access_token) {
      throw new Error('No access token received from GitHub');
    }

    const scopes = scope ? scope.split(',').map((s: string) => s.trim()) : REQUIRED_SCOPES;
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : undefined;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
      scope: scopes,
    };
  } catch (error: any) {
    console.error('[GitHub Auth] Token exchange failed:', error.response?.data || error.message);
    throw new Error('Failed to exchange code for token');
  }
}

/**
 * Get GitHub user information
 */
export async function getGitHubUser(accessToken: string): Promise<{
  id: string;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}> {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return {
      id: response.data.id.toString(),
      login: response.data.login,
      name: response.data.name || response.data.login,
      email: response.data.email || '',
      avatar_url: response.data.avatar_url,
    };
  } catch (error: any) {
    console.error('[GitHub Auth] Get user failed:', error.response?.data || error.message);
    throw new Error('Failed to get GitHub user information');
  }
}

/**
 * Store GitHub connection in database
 */
export async function storeConnection(
  userId: string,
  projectId: string,
  accessToken: string,
  refreshToken: string | undefined,
  expiresAt: Date | undefined,
  scopes: string[],
  githubUser: { id: string; login: string }
) {
  try {
    // Encrypt access token
    const { encrypted, iv, tag } = encryptToken(accessToken);
    const encryptedToken = `${encrypted}:${iv}:${tag}`;

    // Encrypt refresh token if present
    let encryptedRefreshToken: string | undefined;
    if (refreshToken) {
      const refreshEncrypted = encryptToken(refreshToken);
      encryptedRefreshToken = `${refreshEncrypted.encrypted}:${refreshEncrypted.iv}:${refreshEncrypted.tag}`;
    }

    // Upsert connection
    const connection = await prisma.gitHubConnection.upsert({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      create: {
        userId,
        projectId,
        accessToken: encryptedToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        githubUserId: githubUser.id,
        githubUsername: githubUser.login,
        scopes,
        isActive: true,
      },
      update: {
        accessToken: encryptedToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresAt,
        githubUserId: githubUser.id,
        githubUsername: githubUser.login,
        scopes,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    console.log('[GitHub Auth] Connection stored:', connection.id);
    return connection;
  } catch (error) {
    console.error('[GitHub Auth] Store connection failed:', error);
    throw error;
  }
}

/**
 * Get decrypted access token for a user's project
 */
export async function getAccessToken(userId: string, projectId: string): Promise<string> {
  try {
    const connection = await prisma.gitHubConnection.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!connection || !connection.isActive) {
      throw new Error('GitHub connection not found or inactive');
    }

    // Check if token needs refresh
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      if (!connection.refreshToken) {
        throw new Error('Access token expired and no refresh token available');
      }
      // Token refresh would be implemented here
      // For now, throw an error
      throw new Error('Access token expired - please reconnect');
    }

    // Decrypt access token
    const [encrypted, iv, tag] = connection.accessToken.split(':');
    return decryptToken(encrypted, iv, tag);
  } catch (error) {
    console.error('[GitHub Auth] Get access token failed:', error);
    throw error;
  }
}

/**
 * Revoke GitHub connection
 */
export async function revokeConnection(userId: string, projectId: string): Promise<void> {
  try {
    await prisma.gitHubConnection.updateMany({
      where: {
        userId,
        projectId,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    console.log('[GitHub Auth] Connection revoked:', userId, projectId);
  } catch (error) {
    console.error('[GitHub Auth] Revoke connection failed:', error);
    throw error;
  }
}

/**
 * Check if user has active GitHub connection for project
 */
export async function hasActiveConnection(userId: string, projectId: string): Promise<boolean> {
  try {
    const connection = await prisma.gitHubConnection.findFirst({
      where: {
        userId,
        projectId,
        isActive: true,
      },
    });

    return !!connection;
  } catch (error) {
    console.error('[GitHub Auth] Check connection failed:', error);
    return false;
  }
}

/**
 * Get connection details
 */
export async function getConnection(userId: string, projectId: string) {
  try {
    const connection = await prisma.gitHubConnection.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      select: {
        id: true,
        githubUsername: true,
        scopes: true,
        isActive: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return connection;
  } catch (error) {
    console.error('[GitHub Auth] Get connection failed:', error);
    throw error;
  }
}
