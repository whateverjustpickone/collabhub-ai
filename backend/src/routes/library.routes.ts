// Library Routes - REST API endpoints for document management
import { Router } from 'express';
import multer from 'multer';
import * as libraryController from '../controllers/library.controller';
import * as storageService from '../services/library/storage.service';

const router = Router();

// Configure multer for memory storage (files stored in memory as Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: storageService.fileFilter,
});

// ============================================
// DOCUMENT ROUTES
// ============================================

// Upload document
router.post('/documents', upload.single('file'), libraryController.uploadDocument);

// List documents with filters
router.get('/documents', libraryController.listDocuments);

// Get single document
router.get('/documents/:id', libraryController.getDocument);

// Update document metadata
router.put('/documents/:id', libraryController.updateDocument);

// Delete document (soft or hard)
router.delete('/documents/:id', libraryController.deleteDocument);

// Download document file
router.get('/documents/:id/download', libraryController.downloadDocument);

// Search documents (alternative endpoint)
router.get('/search', libraryController.searchDocuments);

// Get recent documents
router.get('/recent', libraryController.getRecentDocuments);

// Get project library statistics
router.get('/stats', libraryController.getLibraryStats);

// ============================================
// CATEGORY ROUTES
// ============================================

// Create category
router.post('/categories', libraryController.createCategory);

// Get category tree
router.get('/categories', libraryController.getCategoryTree);

// Update category
router.put('/categories/:id', libraryController.updateCategory);

// Delete category
router.delete('/categories/:id', libraryController.deleteCategory);

export default router;
