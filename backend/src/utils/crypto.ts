/**
 * Cryptography Utilities
 * Password hashing and VERA content hashing
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate SHA-256 hash for VERA attribution
 * Used to create immutable proof of content
 */
export function generateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Generate unique ID (UUID v4)
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('base64url');
}
