/**
 * JWT configuration
 */
import { JWT_ACCESS_TOKEN_EXPIRES_IN, JWT_REFRESH_TOKEN_EXPIRES_IN } from '../utils/constants.js';
import logger from './logger.js';

// Validate required secrets
const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

// Secrets MUST be set — fail hard si absents (toutes les envs sauf development)
if (!accessSecret || !refreshSecret) {
  if (process.env.NODE_ENV !== 'development') {
    logger.error('🔴 CRITICAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set!');
    logger.error('Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'base64\'))"');
    process.exit(1);
  }
  logger.warn('⚠️  WARNING: JWT secrets not set. Using auto-generated dev secrets (NEVER use in production).');
}

// En développement uniquement : génère des secrets aléatoires plutôt que des valeurs fixes
import crypto from 'crypto';
const devAccessSecret = accessSecret || crypto.randomBytes(64).toString('base64');
const devRefreshSecret = refreshSecret || crypto.randomBytes(64).toString('base64');

export const jwtConfig = {
  accessSecret: devAccessSecret,
  refreshSecret: devRefreshSecret,
  accessExpiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
  refreshExpiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
};
