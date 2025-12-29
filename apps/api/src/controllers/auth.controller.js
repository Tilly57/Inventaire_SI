/**
 * @fileoverview Authentication controllers - HTTP request handlers
 *
 * This module provides:
 * - User registration (POST /auth/register)
 * - Login with JWT tokens (POST /auth/login)
 * - Token refresh (POST /auth/refresh)
 * - Logout (POST /auth/logout)
 * - Current user info (GET /auth/me)
 *
 * Authentication Flow:
 * 1. Login → Receives accessToken (15min) + refreshToken cookie (7d)
 * 2. API requests → Include accessToken in Authorization header
 * 3. Token expired → Call /auth/refresh to get new accessToken
 * 4. Logout → Clear refreshToken cookie
 *
 * Security:
 * - Refresh tokens stored in httpOnly cookies (XSS protection)
 * - Access tokens short-lived (15min) to limit exposure
 * - Password validation and hashing in auth.service.js
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import { register as registerService, login as loginService, getCurrentUser } from '../services/auth.service.js';
import { generateAccessToken, verifyRefreshToken } from '../utils/jwt.js';

/**
 * Register a new user
 *
 * Route: POST /api/auth/register
 * Access: Public (no authentication required)
 *
 * Creates a new user account with hashed password. Only ADMIN users can
 * create other users (enforced by auth.service.js).
 *
 * @param {Object} req.body - Registration data
 * @param {string} req.body.email - User email (unique)
 * @param {string} req.body.password - Plain text password (will be hashed)
 * @param {string} req.body.role - User role (ADMIN, GESTIONNAIRE, LECTURE)
 *
 * @returns {Object} 201 - Created user object (password excluded)
 * @returns {Object} 400 - Validation error (invalid email/password)
 * @returns {Object} 409 - Conflict (email already exists)
 *
 * @example
 * POST /api/auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "role": "GESTIONNAIRE"
 * }
 *
 * Response 201:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx...",
 *     "email": "user@example.com",
 *     "role": "GESTIONNAIRE",
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   }
 * }
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await registerService(email, password, role);

  res.status(201).json({
    success: true,
    data: user
  });
});

/**
 * Login user and issue JWT tokens
 *
 * Route: POST /api/auth/login
 * Access: Public (no authentication required)
 *
 * Validates credentials and returns:
 * - Access token (short-lived, in response body)
 * - Refresh token (long-lived, in httpOnly cookie)
 *
 * @param {Object} req.body - Login credentials
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - Plain text password
 *
 * @returns {Object} 200 - Success with accessToken and user data
 * @returns {Object} 401 - Unauthorized (invalid credentials)
 *
 * @example
 * POST /api/auth/login
 * {
 *   "email": "admin@example.com",
 *   "password": "AdminPass123!"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
 *     "user": {
 *       "id": "ckx...",
 *       "email": "admin@example.com",
 *       "role": "ADMIN"
 *     }
 *   }
 * }
 * Set-Cookie: refreshToken=eyJ...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { accessToken, refreshToken, user } = await loginService(email, password);

  // Set refresh token in httpOnly cookie for security
  // - httpOnly: Prevents JavaScript access (XSS protection)
  // - secure: HTTPS only in production
  // - sameSite: CSRF protection
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    data: {
      accessToken,
      user
    }
  });
});

/**
 * Refresh access token using refresh token
 *
 * Route: POST /api/auth/refresh
 * Access: Public (requires refreshToken cookie)
 *
 * Generates a new access token without requiring re-login.
 * Called automatically by frontend when access token expires.
 *
 * @param {Object} req.cookies.refreshToken - Refresh token from cookie
 *
 * @returns {Object} 200 - New accessToken and user data
 * @returns {Object} 401 - Missing or invalid refresh token
 *
 * @example
 * POST /api/auth/refresh
 * Cookie: refreshToken=eyJ...
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "eyJhbGciOiJIUzI1NiIs...",  // New token
 *     "user": {
 *       "id": "ckx...",
 *       "email": "user@example.com",
 *       "role": "GESTIONNAIRE"
 *     }
 *   }
 * }
 */
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token manquant'
    });
  }

  // Verify refresh token (throws UnauthorizedError if invalid/expired)
  const payload = verifyRefreshToken(refreshToken);

  // Fetch current user data (may have changed since token was issued)
  const user = await getCurrentUser(payload.userId);

  // Generate fresh access token with updated user data
  const accessToken = generateAccessToken(user.id, user.email, user.role);

  res.json({
    success: true,
    data: {
      accessToken,
      user
    }
  });
});

/**
 * Logout user by clearing refresh token
 *
 * Route: POST /api/auth/logout
 * Access: Public (no authentication required)
 *
 * Clears the refreshToken cookie. The frontend should also discard the
 * access token from memory.
 *
 * @returns {Object} 200 - Logout success message
 *
 * @example
 * POST /api/auth/logout
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "message": "Déconnexion réussie" }
 * }
 * Set-Cookie: refreshToken=; Max-Age=0  // Cookie cleared
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.json({
    success: true,
    data: { message: 'Déconnexion réussie' }
  });
});

/**
 * Get current user information
 *
 * Route: GET /api/auth/me
 * Access: Protected (requires valid access token)
 *
 * Returns the authenticated user's profile. Requires auth middleware
 * which populates req.user from the access token.
 *
 * @param {Object} req.user - User data from auth middleware
 * @param {string} req.user.userId - Authenticated user's ID
 *
 * @returns {Object} 200 - User profile data
 * @returns {Object} 401 - Unauthorized (missing or invalid token)
 *
 * @example
 * GET /api/auth/me
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "ckx...",
 *     "email": "user@example.com",
 *     "role": "GESTIONNAIRE",
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   }
 * }
 */
export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.userId);

  res.json({
    success: true,
    data: user
  });
});
