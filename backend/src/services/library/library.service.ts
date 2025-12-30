// Library Service - Document CRUD, search, and category management
import { PrismaClient, Prisma } from '@prisma/client';
import * as storageService from './storage.service';

const prisma = new PrismaClient();

export interface CreateDocumentInput {
  projectId: string;
  categoryId?: string;
  title: string;
  description?: string;
  uploadedBy: string;
  tags?: string[];
  file: Express.Multer.File;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface SearchDocumentsInput {
  projectId: string;
  query?: string;
  categoryId?: string;
  tags?: string[];
  fileType?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateCategoryInput {
  projectId: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

/**
 * Create a new document with file upload
 */
export async function createDocument(input: CreateDocumentInput) {
  try {
    // Generate document ID
    const documentId = crypto.randomUUID();

    // Store file and extract content
    const uploadResult = await storageService.storeFile(
      input.projectId,
      documentId,
      input.file
    );

    // Determine document file type
    const fileType = storageService.getDocumentFileType(
      uploadResult.mimeType,
      input.file.originalname
    );

    // Create document record
    const document = await prisma.libraryDocument.create({
      data: {
        id: documentId,
        projectId: input.projectId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        fileType: fileType as any,
        fileName: uploadResult.fileName,
        filePath: uploadResult.filePath,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        contentText: uploadResult.contentText,
        contentHash: uploadResult.contentHash,
        uploadedBy: input.uploadedBy,
        tags: input.tags || [],
      },
      include: {
        category: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('[Library] Document created:', document.id);
    return document;
  } catch (error) {
    console.error('[Library] Document creation failed:', error);
    throw error;
  }
}

/**
 * Get document by ID
 */
export async function getDocumentById(documentId: string, projectId: string) {
  try {
    const document = await prisma.libraryDocument.findFirst({
      where: {
        id: documentId,
        projectId,
      },
      include: {
        category: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          orderBy: {
            version: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            contextUsage: true,
            agentEdits: true,
          },
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Update access tracking
    await prisma.libraryDocument.update({
      where: { id: documentId },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    return document;
  } catch (error) {
    console.error('[Library] Get document failed:', error);
    throw error;
  }
}

/**
 * Update document metadata
 */
export async function updateDocument(
  documentId: string,
  projectId: string,
  input: UpdateDocumentInput
) {
  try {
    const document = await prisma.libraryDocument.updateMany({
      where: {
        id: documentId,
        projectId,
      },
      data: input,
    });

    if (document.count === 0) {
      throw new Error('Document not found');
    }

    return await getDocumentById(documentId, projectId);
  } catch (error) {
    console.error('[Library] Document update failed:', error);
    throw error;
  }
}

/**
 * Delete document (soft delete by default)
 */
export async function deleteDocument(
  documentId: string,
  projectId: string,
  hardDelete: boolean = false
) {
  try {
    if (hardDelete) {
      // Get document details first
      const document = await prisma.libraryDocument.findFirst({
        where: { id: documentId, projectId },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete file from storage
      await storageService.deleteFile(projectId, documentId);

      // Delete database record
      await prisma.libraryDocument.delete({
        where: { id: documentId },
      });

      console.log('[Library] Document hard deleted:', documentId);
    } else {
      // Soft delete
      await prisma.libraryDocument.updateMany({
        where: { id: documentId, projectId },
        data: { isActive: false },
      });

      console.log('[Library] Document soft deleted:', documentId);
    }

    return { success: true };
  } catch (error) {
    console.error('[Library] Document deletion failed:', error);
    throw error;
  }
}

/**
 * Search documents with filters
 */
export async function searchDocuments(input: SearchDocumentsInput) {
  try {
    const where: Prisma.LibraryDocumentWhereInput = {
      projectId: input.projectId,
      isActive: input.isActive !== undefined ? input.isActive : true,
    };

    // Category filter
    if (input.categoryId) {
      where.categoryId = input.categoryId;
    }

    // File type filter
    if (input.fileType) {
      where.fileType = input.fileType as any;
    }

    // Tags filter
    if (input.tags && input.tags.length > 0) {
      where.tags = {
        hasSome: input.tags,
      };
    }

    // Text search across title, description, and content
    if (input.query) {
      where.OR = [
        { title: { contains: input.query, mode: 'insensitive' } },
        { description: { contains: input.query, mode: 'insensitive' } },
        { contentText: { contains: input.query, mode: 'insensitive' } },
        { tags: { hasSome: [input.query] } },
      ];
    }

    // Execute query with pagination
    const [documents, total] = await Promise.all([
      prisma.libraryDocument.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              contextUsage: true,
            },
          },
        },
        orderBy: [
          { lastAccessedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        take: input.limit || 20,
        skip: input.offset || 0,
      }),
      prisma.libraryDocument.count({ where }),
    ]);

    return {
      documents,
      total,
      hasMore: (input.offset || 0) + documents.length < total,
    };
  } catch (error) {
    console.error('[Library] Document search failed:', error);
    throw error;
  }
}

/**
 * Download document file
 */
export async function downloadDocument(documentId: string, projectId: string) {
  try {
    const document = await prisma.libraryDocument.findFirst({
      where: { id: documentId, projectId, isActive: true },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const buffer = await storageService.retrieveFile(
      projectId,
      documentId,
      document.fileName
    );

    // Update access tracking
    await prisma.libraryDocument.update({
      where: { id: documentId },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    return {
      buffer,
      fileName: document.fileName,
      mimeType: document.mimeType,
    };
  } catch (error) {
    console.error('[Library] Document download failed:', error);
    throw error;
  }
}

// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * Create a new category
 */
export async function createCategory(input: CreateCategoryInput) {
  try {
    const category = await prisma.libraryCategory.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        parentId: input.parentId,
        icon: input.icon,
        color: input.color,
        sortOrder: input.sortOrder || 0,
      },
      include: {
        parent: true,
        _count: {
          select: {
            documents: true,
            children: true,
          },
        },
      },
    });

    console.log('[Library] Category created:', category.id);
    return category;
  } catch (error) {
    console.error('[Library] Category creation failed:', error);
    throw error;
  }
}

/**
 * Get category tree for a project
 */
export async function getCategoryTree(projectId: string) {
  try {
    // Get all categories
    const categories = await prisma.libraryCategory.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            documents: { where: { isActive: true } },
            children: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Build tree structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      const node = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    });

    return rootCategories;
  } catch (error) {
    console.error('[Library] Get category tree failed:', error);
    throw error;
  }
}

/**
 * Update category
 */
export async function updateCategory(
  categoryId: string,
  projectId: string,
  data: Partial<CreateCategoryInput>
) {
  try {
    const category = await prisma.libraryCategory.updateMany({
      where: { id: categoryId, projectId },
      data,
    });

    if (category.count === 0) {
      throw new Error('Category not found');
    }

    return await prisma.libraryCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { documents: true, children: true },
        },
      },
    });
  } catch (error) {
    console.error('[Library] Category update failed:', error);
    throw error;
  }
}

/**
 * Delete category (only if empty)
 */
export async function deleteCategory(categoryId: string, projectId: string) {
  try {
    // Check if category has documents or children
    const category = await prisma.libraryCategory.findFirst({
      where: { id: categoryId, projectId },
      include: {
        _count: {
          select: { documents: true, children: true },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category._count.documents > 0) {
      throw new Error('Cannot delete category with documents');
    }

    if (category._count.children > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    await prisma.libraryCategory.delete({
      where: { id: categoryId },
    });

    console.log('[Library] Category deleted:', categoryId);
    return { success: true };
  } catch (error) {
    console.error('[Library] Category deletion failed:', error);
    throw error;
  }
}

/**
 * Get recently accessed documents
 */
export async function getRecentDocuments(projectId: string, limit: number = 10) {
  try {
    const documents = await prisma.libraryDocument.findMany({
      where: {
        projectId,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        lastAccessedAt: 'desc',
      },
      take: limit,
    });

    return documents;
  } catch (error) {
    console.error('[Library] Get recent documents failed:', error);
    throw error;
  }
}

/**
 * Get document statistics for a project
 */
export async function getProjectLibraryStats(projectId: string) {
  try {
    const [
      totalDocuments,
      activeDocuments,
      categoriesCount,
      storageStats,
      recentlyAdded,
    ] = await Promise.all([
      prisma.libraryDocument.count({ where: { projectId } }),
      prisma.libraryDocument.count({ where: { projectId, isActive: true } }),
      prisma.libraryCategory.count({ where: { projectId } }),
      storageService.getProjectStorageStats(projectId),
      prisma.libraryDocument.count({
        where: {
          projectId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalDocuments,
      activeDocuments,
      categoriesCount,
      totalStorageSize: storageStats.totalSize,
      totalFiles: storageStats.totalFiles,
      recentlyAddedCount: recentlyAdded,
    };
  } catch (error) {
    console.error('[Library] Get library stats failed:', error);
    throw error;
  }
}
