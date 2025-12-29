/**
 * @fileoverview JWT token utilities for authentication
 *
 * This module provides:
 * - Access token generation and verification (short-lived, contains user data)
 * - Refresh token generation and verification (long-lived, minimal payload)
 * - Consistent error handling for expired/invalid tokens
 *
 * Token Strategy:
 * - Access Token: 15min expiry, contains { userId, email, role }
 * - Refresh Token: 7 days expiry, contains { userId } only
 *
 * Security:
 * - Separate secrets for access and refresh tokens
 * - Secrets loaded from environment variables (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)
 * - Throws UnauthorizedError for invalid/expired tokens
 */
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { UnauthorizedError } from './errors.js';

/**
 * Generate a short-lived access token
 *
 * Access tokens contain user data (userId, email, role) and are used for
 * authenticating API requests. They expire quickly (15min) to limit exposure
 * if compromised.
 *
 * @param {string} userId - User's unique ID (CUID)
 * @param {string} email - User's email address
 * @param {string} role - User's role (ADMIN, GESTIONNAIRE, LECTURE)
 * @returns {string} Signed JWT access token
 *
 * @example
 * const accessToken = generateAccessToken(user.id, user.email, user.role)
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 * @example
 * // Token payload:
 * // {
 * //   userId: "ckx1234567890",
 * //   email: "user@example.com",
 * //   role: "GESTIONNAIRE",
 * //   iat: 1234567890,
 * //   exp: 1234568790  // +15min
 * // }
 */
export function generateAccessToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiresIn } // Default: '15m'
  );
}

/**
 * Generate a long-lived refresh token
 *
 * Refresh tokens contain minimal data (only userId) and are used to obtain
 * new access tokens without re-login. They expire slowly (7 days) and should
 * be stored securely (httpOnly cookie recommended).
 *
 * @param {string} userId - User's unique ID (CUID)
 * @returns {string} Signed JWT refresh token
 *
 * @example
 * const refreshToken = generateRefreshToken(user.id)
 * // Store in httpOnly cookie:
 * res.cookie('refreshToken', refreshToken, {
 *   httpOnly: true,
 *   secure: true,
 *   sameSite: 'strict',
 *   maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
 * })
 *
 * @example
 * // Token payload:
 * // {
 * //   userId: "ckx1234567890",
 * //   iat: 1234567890,
 * //   exp: 1235172690  // +7 days
 * // }
 */
export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn } // Default: '7d'
  );
}

/**
 * Verify and decode an access token
 *
 * Validates the token signature and expiration. Used by the auth middleware
 * to authenticate requests.
 *
 * @param {string} token - Access token from Authorization header
 * @returns {Object} Decoded token payload { userId, email, role, iat, exp }
 * @throws {UnauthorizedError} If token is invalid or expired
 *
 * @example
 * try {
 *   const payload = verifyAccessToken(token)
 *   console.log(payload.userId) // "ckx1234567890"
 *   console.log(payload.role)   // "ADMIN"
 * } catch (error) {
 *   // error.message: "Token expiré" or "Token invalide"
 * }
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, jwtConfig.accessSecret);
  } catch (error) {
    // Distinguish between expired and invalid tokens
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expiré');
    }
    // Invalid signature, malformed token, etc.
    throw new UnauthorizedError('Token invalide');
  }
}

/**
 * Verify and decode a refresh token
 *
 * Validates the refresh token signature and expiration. Used by the
 * /auth/refresh endpoint to issue new access tokens.
 *
 * @param {string} token - Refresh token from cookie or request body
 * @returns {Object} Decoded token payload { userId, iat, exp }
 * @throws {UnauthorizedError} If token is invalid or expired
 *
 * @example
 * try {
 *   const payload = verifyRefreshToken(refreshToken)
 *   const user = await prisma.user.findUnique({
 *     where: { id: payload.userId }
 *   })
 *   const newAccessToken = generateAccessToken(user.id, user.email, user.role)
 * } catch (error) {
 *   // error.message: "Refresh token expiré" or "Refresh token invalide"
 * }
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, jwtConfig.refreshSecret);
  } catch (error) {
    // Distinguish between expired and invalid tokens
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Refresh token expiré');
    }
    // Invalid signature, malformed token, etc.
    throw new UnauthorizedError('Refresh token invalide');
  }
}
