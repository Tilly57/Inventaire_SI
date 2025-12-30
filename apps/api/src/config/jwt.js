/**
 * JWT configuration
 */
import { JWT_ACCESS_TOKEN_EXPIRES_IN, JWT_REFRESH_TOKEN_EXPIRES_IN } from '../utils/constants.js';
import logger from './logger.js';

export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
  accessExpiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
  refreshExpiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
};

// Validate required secrets
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  logger.warn('⚠️  WARNING: JWT secrets not set in environment variables. Using default values (NOT SECURE!)');
}
