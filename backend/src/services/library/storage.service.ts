// Storage Service - File upload/download and text extraction
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { FileFilterCallback } from 'multer';
import pdfParse from 'pdf-parse';
import { fileTypeFromBuffer } from 'file-type';
import mime from 'mime-types';

// Storage configuration
const STORAGE_BASE_PATH = path.join(process.cwd(), 'storage', 'documents');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/json',
  'application/xml',
  'text/xml',
  'text/yaml',
  'application/x-yaml',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  // Code files
  'text/javascript',
  'application/javascript',
  'text/typescript',
  'text/x-python',
  'text/x-java',
  'text/x-c',
  'text/x-c++',
  'text/x-go',
  'text/x-rust',
  'text/html',
  'text/css',
];

const ALLOWED_EXTENSIONS = [
  '.txt', '.md', '.pdf', '.json', '.xml', '.yaml', '.yml', '.csv',
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.go', '.rs',
  '.html', '.css', '.sh', '.bash', '.sql', '.env',
];

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  contentHash: string;
  contentText?: string;
}

/**
 * Initialize storage directory structure
 */
export async function initializeStorage(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_BASE_PATH, { recursive: true });
    console.log('[Storage] Storage directory initialized:', STORAGE_BASE_PATH);
  } catch (error) {
    console.error('[Storage] Failed to initialize storage:', error);
    throw new Error('Storage initialization failed');
  }
}

/**
 * Validate file type and size
 */
export function validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type ${ext} is not allowed`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `MIME type ${file.mimetype} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Multer file filter function
 */
export function fileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void {
  const validation = validateFile(file);
  if (!validation.valid) {
    callback(new Error(validation.error || 'Invalid file'));
  } else {
    callback(null, true);
  }
}

/**
 * Generate SHA-256 hash of file content
 */
export function generateContentHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extract text content from file based on type
 */
export async function extractTextContent(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string | null> {
  try {
    // PDF extraction
    if (mimeType === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    }

    // Plain text files
    if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/xml' ||
      mimeType === 'application/x-yaml'
    ) {
      return buffer.toString('utf-8');
    }

    // Images - return metadata only
    if (mimeType.startsWith('image/')) {
      const fileType = await fileTypeFromBuffer(buffer);
      return `[Image: ${fileName}, Type: ${fileType?.mime || mimeType}, Size: ${buffer.length} bytes]`;
    }

    // Unsupported type for text extraction
    return null;
  } catch (error) {
    console.error('[Storage] Text extraction failed:', error);
    return null;
  }
}

/**
 * Store uploaded file in project-specific directory
 */
export async function storeFile(
  projectId: string,
  documentId: string,
  file: Express.Multer.File
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }

    // Create project directory
    const projectDir = path.join(STORAGE_BASE_PATH, projectId);
    await fs.mkdir(projectDir, { recursive: true });

    // Create document directory
    const documentDir = path.join(projectDir, documentId);
    await fs.mkdir(documentDir, { recursive: true });

    // Generate file path with original extension
    const ext = path.extname(file.originalname);
    const sanitizedFileName = `${documentId}${ext}`;
    const filePath = path.join(documentDir, sanitizedFileName);

    // Write file to disk
    await fs.writeFile(filePath, file.buffer);

    // Generate content hash
    const contentHash = generateContentHash(file.buffer);

    // Extract text content
    const contentText = await extractTextContent(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    return {
      fileName: sanitizedFileName,
      filePath: path.relative(STORAGE_BASE_PATH, filePath),
      fileSize: file.size,
      mimeType: file.mimetype,
      contentHash,
      contentText: contentText || undefined,
    };
  } catch (error) {
    console.error('[Storage] File storage failed:', error);
    throw error;
  }
}

/**
 * Retrieve file from storage
 */
export async function retrieveFile(
  projectId: string,
  documentId: string,
  fileName: string
): Promise<Buffer> {
  try {
    const filePath = path.join(STORAGE_BASE_PATH, projectId, documentId, fileName);

    // Security check - ensure path is within storage directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(STORAGE_BASE_PATH);
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error('Invalid file path');
    }

    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error('[Storage] File retrieval failed:', error);
    throw new Error('File not found or access denied');
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(
  projectId: string,
  documentId: string
): Promise<void> {
  try {
    const documentDir = path.join(STORAGE_BASE_PATH, projectId, documentId);

    // Security check
    const resolvedPath = path.resolve(documentDir);
    const resolvedBase = path.resolve(STORAGE_BASE_PATH);
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error('Invalid file path');
    }

    await fs.rm(documentDir, { recursive: true, force: true });
    console.log('[Storage] Deleted document directory:', documentDir);
  } catch (error) {
    console.error('[Storage] File deletion failed:', error);
    throw error;
  }
}

/**
 * Get storage statistics for a project
 */
export async function getProjectStorageStats(projectId: string): Promise<{
  totalFiles: number;
  totalSize: number;
}> {
  try {
    const projectDir = path.join(STORAGE_BASE_PATH, projectId);

    let totalFiles = 0;
    let totalSize = 0;

    try {
      const documents = await fs.readdir(projectDir);

      for (const docId of documents) {
        const docDir = path.join(projectDir, docId);
        const stat = await fs.stat(docDir);

        if (stat.isDirectory()) {
          const files = await fs.readdir(docDir);
          totalFiles += files.length;

          for (const file of files) {
            const fileStat = await fs.stat(path.join(docDir, file));
            totalSize += fileStat.size;
          }
        }
      }
    } catch (error) {
      // Project directory doesn't exist yet
      return { totalFiles: 0, totalSize: 0 };
    }

    return { totalFiles, totalSize };
  } catch (error) {
    console.error('[Storage] Failed to get storage stats:', error);
    return { totalFiles: 0, totalSize: 0 };
  }
}

/**
 * Determine DocumentFileType enum from MIME type
 */
export function getDocumentFileType(mimeType: string, fileName: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'text/markdown' || fileName.endsWith('.md')) return 'MARKDOWN';
  if (mimeType === 'application/json') return 'JSON';
  if (mimeType === 'application/xml' || mimeType === 'text/xml') return 'XML';
  if (mimeType === 'application/x-yaml' || mimeType === 'text/yaml' || fileName.endsWith('.yml') || fileName.endsWith('.yaml')) return 'YAML';
  if (mimeType === 'text/csv') return 'CSV';
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (
    mimeType.startsWith('text/') ||
    fileName.endsWith('.js') ||
    fileName.endsWith('.ts') ||
    fileName.endsWith('.py') ||
    fileName.endsWith('.java') ||
    fileName.endsWith('.c') ||
    fileName.endsWith('.cpp') ||
    fileName.endsWith('.go') ||
    fileName.endsWith('.rs')
  ) {
    // Check if it's a code file
    const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.go', '.rs', '.sh', '.bash'];
    if (codeExtensions.some(ext => fileName.endsWith(ext))) {
      return 'CODE';
    }
    return 'TEXT';
  }

  return 'OTHER';
}
