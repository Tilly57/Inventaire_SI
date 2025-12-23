/**
 * Authentication middleware
 */
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import { asyncHandler } from './asyncHandler.js';

/**
 * Require authentication middleware
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token d\'authentification requis');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify token and extract payload
  const payload = verifyAccessToken(token);

  // Attach user info to request
  req.user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  };

  next();
});
