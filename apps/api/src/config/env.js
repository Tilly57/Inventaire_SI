/**
 * Environment variables validation using Zod
 */
import { z } from 'zod';
import logger from './logger.js';

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  // Database
  DATABASE_URL: z.string()
    .url()
    .startsWith('postgresql://', 'DATABASE_URL must be a valid PostgreSQL connection string'),

  // JWT Secrets
  JWT_ACCESS_SECRET: z.string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security'),
  JWT_REFRESH_SECRET: z.string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security'),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // File uploads
  SIGNATURES_DIR: z.string().default('/app/uploads/signatures'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

/**
 * Parse and validate environment variables
 * @throws {ZodError} If validation fails
 */
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    logger.error('Environment validation failed', { errors: error.errors });
    throw new Error('Invalid environment configuration. Check the errors above.');
  }
}

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv();
