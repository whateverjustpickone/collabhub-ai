// Library Controller - REST API handlers for document management
import { Request, Response } from 'express';
import * as libraryService from '../services/library/library.service';
import * as storageService from '../services/library/storage.service';

/**
 * Upload a new document
 * POST /api/library/documents
 */
export async function uploadDocument(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { projectId, categoryId, title, description, uploadedBy, tags } = req.body;

    if (!projectId || !title || !uploadedBy) {
      return res.status(400).json({
        error: 'projectId, title, and uploadedBy are required',
      });
    }

    // Parse tags if provided as JSON string
    let parsedTags: string[] | undefined;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid tags format' });
      }
    }

    const document = await libraryService.createDocument({
      projectId,
      categoryId: categoryId || undefined,
      title,
      description: description || undefined,
      uploadedBy,
      tags: parsedTags,
      file: req.file,
    });

    res.status(201).json({
      success: true,
      document,
    });
  } catch (error: any) {
    console.error('[Library Controller] Upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Document upload failed',
    });
  }
}

/**
 * List documents with filtering and pagination
 * GET /api/library/documents?projectId=...&query=...&categoryId=...&tags=...&fileType=...&limit=...&offset=...
 */
export async function listDocuments(req: Request, res: Response) {
  try {
    const {
      projectId,
      query,
      categoryId,
      tags,
      fileType,
      isActive,
      limit,
      offset,
    } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // Parse tags if provided
    let parsedTags: string[] | undefined;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = undefined;
      }
    }

    const result = await libraryService.searchDocuments({
      projectId: projectId as string,
      query: query as string | undefined,
      categoryId: categoryId as string | undefined,
      tags: parsedTags,
      fileType: fileType as string | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Library Controller] List documents failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list documents',
    });
  }
}

/**
 * Get a single document by ID
 * GET /api/library/documents/:id
 */
export async function getDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const document = await libraryService.getDocumentById(id, projectId as string);

    res.json({
      success: true,
      document,
    });
  } catch (error: any) {
    console.error('[Library Controller] Get document failed:', error);
    const statusCode = error.message === 'Document not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to get document',
    });
  }
}

/**
 * Update document metadata
 * PUT /api/library/documents/:id
 */
export async function updateDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { projectId, title, description, categoryId, tags, isActive } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const document = await libraryService.updateDocument(id, projectId, {
      title,
      description,
      categoryId,
      tags,
      isActive,
    });

    res.json({
      success: true,
      document,
    });
  } catch (error: any) {
    console.error('[Library Controller] Update document failed:', error);
    const statusCode = error.message === 'Document not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update document',
    });
  }
}

/**
 * Delete document (soft or hard delete)
 * DELETE /api/library/documents/:id
 */
export async function deleteDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { projectId, hardDelete } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    await libraryService.deleteDocument(
      id,
      projectId as string,
      hardDelete === 'true'
    );

    res.json({
      success: true,
      message: hardDelete === 'true' ? 'Document permanently deleted' : 'Document archived',
    });
  } catch (error: any) {
    console.error('[Library Controller] Delete document failed:', error);
    const statusCode = error.message === 'Document not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete document',
    });
  }
}

/**
 * Download document file
 * GET /api/library/documents/:id/download
 */
export async function downloadDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const result = await libraryService.downloadDocument(id, projectId as string);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.buffer);
  } catch (error: any) {
    console.error('[Library Controller] Download document failed:', error);
    const statusCode = error.message === 'Document not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to download document',
    });
  }
}

/**
 * Search documents
 * GET /api/library/search
 */
export async function searchDocuments(req: Request, res: Response) {
  try {
    const {
      projectId,
      query,
      categoryId,
      tags,
      fileType,
      limit,
      offset,
    } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // Parse tags if provided
    let parsedTags: string[] | undefined;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = undefined;
      }
    }

    const result = await libraryService.searchDocuments({
      projectId: projectId as string,
      query: query as string | undefined,
      categoryId: categoryId as string | undefined,
      tags: parsedTags,
      fileType: fileType as string | undefined,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Library Controller] Search failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Search failed',
    });
  }
}

// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * Create a new category
 * POST /api/library/categories
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const { projectId, name, description, parentId, icon, color, sortOrder } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({
        error: 'projectId and name are required',
      });
    }

    const category = await libraryService.createCategory({
      projectId,
      name,
      description,
      parentId,
      icon,
      color,
      sortOrder,
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error: any) {
    console.error('[Library Controller] Create category failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create category',
    });
  }
}

/**
 * Get category tree for a project
 * GET /api/library/categories?projectId=...
 */
export async function getCategoryTree(req: Request, res: Response) {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const categories = await libraryService.getCategoryTree(projectId as string);

    res.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    console.error('[Library Controller] Get category tree failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get category tree',
    });
  }
}

/**
 * Update a category
 * PUT /api/library/categories/:id
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { projectId, name, description, parentId, icon, color, sortOrder } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const category = await libraryService.updateCategory(id, projectId, {
      name,
      description,
      parentId,
      icon,
      color,
      sortOrder,
    });

    res.json({
      success: true,
      category,
    });
  } catch (error: any) {
    console.error('[Library Controller] Update category failed:', error);
    const statusCode = error.message === 'Category not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to update category',
    });
  }
}

/**
 * Delete a category (only if empty)
 * DELETE /api/library/categories/:id
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    await libraryService.deleteCategory(id, projectId as string);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('[Library Controller] Delete category failed:', error);
    const statusCode = error.message === 'Category not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete category',
    });
  }
}

/**
 * Get recent documents
 * GET /api/library/recent?projectId=...&limit=...
 */
export async function getRecentDocuments(req: Request, res: Response) {
  try {
    const { projectId, limit } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const documents = await libraryService.getRecentDocuments(
      projectId as string,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      documents,
    });
  } catch (error: any) {
    console.error('[Library Controller] Get recent documents failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent documents',
    });
  }
}

/**
 * Get project library statistics
 * GET /api/library/stats?projectId=...
 */
export async function getLibraryStats(req: Request, res: Response) {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const stats = await libraryService.getProjectLibraryStats(projectId as string);

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[Library Controller] Get library stats failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get library stats',
    });
  }
}
