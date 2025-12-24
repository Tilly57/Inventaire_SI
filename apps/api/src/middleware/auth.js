/**
 * @fileoverview Authentication middleware for JWT token verification
 *
 * This middleware:
 * - Extracts and validates JWT access tokens from Authorization headers
 * - Verifies token signature and expiration
 * - Attaches authenticated user information to request object
 * - Protects routes requiring authentication
 *
 * Security: Uses Bearer token authentication with short-lived access tokens.
 * Refresh tokens are handled separately via httpOnly cookies.
 */

import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import { asyncHandler } from './asyncHandler.js';

/**
 * Require authentication middleware
 *
 * Validates JWT access token from Authorization header and attaches
 * user information to the request object for downstream middleware/controllers.
 *
 * Expected header format: `Authorization: Bearer <token>`
 *
 * Token payload must contain:
 * - userId: User's database ID
 * - email: User's email address
 * - role: User's role (ADMIN, GESTIONNAIRE, or LECTURE)
 *
 * On success, populates `req.user` with:
 * ```javascript
 * {
 *   userId: string,
 *   email: string,
 *   role: 'ADMIN' | 'GESTIONNAIRE' | 'LECTURE'
 * }
 * ```
 *
 * @middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @throws {UnauthorizedError} If no token provided or token is invalid/expired
 *
 * @example
 * // Protect a route with authentication
 * router.get('/protected', requireAuth, (req, res) => {
 *   console.log(req.user.email); // Authenticated user's email
 *   res.json({ message: 'Success' });
 * });
 *
 * @example
 * // Client request with token
 * fetch('/api/protected', {
 *   headers: {
 *     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
 *   }
 * });
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  // Extract Authorization header
  const authHeader = req.headers.authorization;

  // Validate Authorization header format
  // Must be present and start with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token d\'authentification requis');
  }

  // Extract token by removing "Bearer " prefix (7 characters)
  const token = authHeader.substring(7);

  // Verify JWT token signature and expiration
  // This throws UnauthorizedError if token is invalid or expired
  const payload = verifyAccessToken(token);

  // Attach authenticated user information to request
  // Available to all subsequent middleware and route handlers
  req.user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role  // Used by RBAC middleware
  };

  next();
});
