// GitHub Routes - REST API endpoints for GitHub integration
import { Router } from 'express';
import * as githubController from '../controllers/github.controller';

const router = Router();

// ============================================
// OAUTH FLOW
// ============================================

// Initiate OAuth
router.get('/auth', githubController.initiateAuth);

// OAuth callback
router.get('/auth/callback', githubController.handleCallback);

// Get connection status
router.get('/connection', githubController.getConnectionStatus);

// Revoke connection
router.delete('/connection', githubController.revokeConnection);

// ============================================
// REPOSITORY OPERATIONS
// ============================================

// List user's repositories
router.get('/repositories', githubController.listRepositories);

// Get connected repositories
router.get('/repositories/connected', githubController.getConnectedRepositories);

// Connect repository
router.post('/repositories/connect', githubController.connectRepository);

// Disconnect repository
router.delete('/repositories/:id', githubController.disconnectRepository);

// ============================================
// FILE OPERATIONS
// ============================================

// Get file content
router.get('/files/content', githubController.getFileContent);

// List files in directory
router.get('/files/list', githubController.listFiles);

// Search code
router.get('/files/search', githubController.searchCode);

// ============================================
// PULL REQUEST OPERATIONS
// ============================================

// Create pull request
router.post('/pulls', githubController.createPullRequest);

// List pull requests
router.get('/pulls', githubController.listPullRequests);

// ============================================
// ISSUE OPERATIONS
// ============================================

// Create issue
router.post('/issues', githubController.createIssue);

// List issues
router.get('/issues', githubController.listIssues);

// ============================================
// RATE LIMIT
// ============================================

// Check rate limit
router.get('/rate-limit', githubController.getRateLimit);

export default router;
