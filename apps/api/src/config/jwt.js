/**
 * JWT configuration
 */
import { JWT_ACCESS_TOKEN_EXPIRES_IN, JWT_REFRESH_TOKEN_EXPIRES_IN } from '../utils/constants.js';
import logger from './logger.js';

// Validate required secrets
const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

// In production, secrets MUST be set - fail hard if missing
if (!accessSecret || !refreshSecret) {
  if (process.env.NODE_ENV === 'production') {
    logger.error('🔴 CRITICAL: JWT secrets must be set in production environment!');
    logger.error('Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables');
    process.exit(1);
  }
  logger.warn('⚠️  WARNING: JWT secrets not set in environment variables. Using default values (DEVELOPMENT ONLY!)');
}

export const jwtConfig = {
  accessSecret: accessSecret || 'dev_access_secret_change_in_production',
  refreshSecret: refreshSecret || 'dev_refresh_secret_change_in_production',
  accessExpiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
  refreshExpiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
};
