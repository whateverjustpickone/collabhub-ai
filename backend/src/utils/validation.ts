/**
 * Validation Utilities
 * Common validation helpers using Zod
 */

import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// User registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// User login schema
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Message creation schema
export const messageCreateSchema = z.object({
  channelId: uuidSchema,
  content: z.string().min(1, 'Message content is required').max(10000),
  type: z.enum(['TEXT', 'SYSTEM', 'COMMAND', 'FILE']).optional(),
  metadata: z.record(z.any()).optional(),
  parentId: uuidSchema.optional(),
});

// Project creation schema
export const projectCreateSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  organizationId: uuidSchema.optional(),
  settings: z
    .object({
      visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).default('PRIVATE'),
      humanOversightLevel: z.number().int().min(1).max(4).default(2),
      veraEnabled: z.boolean().default(true),
      recordingSessions: z.boolean().default(false),
    })
    .optional(),
});

// Channel creation schema
export const channelCreateSchema = z.object({
  projectId: uuidSchema,
  name: z.string().min(2, 'Channel name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['TEXT', 'VIDEO', 'VOICE', 'MEETING']).default('TEXT'),
  isPrivate: z.boolean().default(false),
});

// Agent profile schema
export const agentProfileSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  provider: z.enum(['ANTHROPIC', 'OPENAI', 'GOOGLE', 'XAI', 'DEEPSEEK', 'PERPLEXITY']),
  model: z.string(),
  personality: z.object({
    directness: z.number().int().min(1).max(10),
    creativity: z.number().int().min(1).max(10),
    formality: z.number().int().min(1).max(10),
    enthusiasm: z.number().int().min(1).max(10),
  }),
  specialties: z.array(z.string()).optional(),
});

/**
 * Validate data against schema and throw ValidationError if invalid
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validate data and return result or error
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
