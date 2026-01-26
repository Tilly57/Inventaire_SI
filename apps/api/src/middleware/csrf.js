/**
 * @fileoverview CSRF Protection Middleware
 *
 * Implements CSRF token validation for state-changing operations.
 * Uses Double Submit Cookie pattern with SameSite cookies for enhanced security.
 *
 * Security Strategy:
 * - CSRF tokens generated per session
 * - Tokens validated on all non-GET/HEAD/OPTIONS requests
 * - SameSite cookie attribute for additional protection
 * - Works alongside CORS restrictions
 *
 * Note: This is a lightweight implementation. For production with complex
 * requirements, consider using the 'csurf' package.
 */

import crypto from 'crypto';
import { UnauthorizedError } from './errorHandler.js';

// Exempt routes that don't need CSRF protection
const EXEMPT_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
  '/api/metrics',
  '/api-docs',
];

// Methods that don't need CSRF protection (safe methods)
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Generate a random CSRF token
 * @returns {string} CSRF token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF token generation middleware
 * Generates and stores CSRF token in cookie
 */
export const csrfTokenGenerator = (req, res, next) => {
  // Skip if token already exists
  if (req.cookies && req.cookies['XSRF-TOKEN']) {
    return next();
  }

  const token = generateToken();

  // Set token in cookie (readable by JavaScript)
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Must be readable by client JS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Prevent CSRF
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  next();
};

/**
 * CSRF token validation middleware
 * Validates CSRF token on state-changing requests
 */
export const csrfProtection = (req, res, next) => {
  // Skip safe methods
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }

  // Skip exempt routes
  const isExempt = EXEMPT_ROUTES.some(route => req.path.startsWith(route));
  if (isExempt) {
    return next();
  }

  // Get token from cookie
  const cookieToken = req.cookies && req.cookies['XSRF-TOKEN'];

  // Get token from header (standard header name for CSRF)
  const headerToken = req.get('X-XSRF-TOKEN') || req.get('X-CSRF-TOKEN');

  // Validate tokens exist and match
  if (!cookieToken || !headerToken) {
    throw new UnauthorizedError('CSRF token missing');
  }

  if (cookieToken !== headerToken) {
    throw new UnauthorizedError('CSRF token validation failed');
  }

  next();
};

/**
 * Get CSRF token endpoint handler
 * Allows clients to retrieve the current CSRF token
 */
export const getCsrfToken = (req, res) => {
  const token = req.cookies && req.cookies['XSRF-TOKEN'];

  if (!token) {
    const newToken = generateToken();
    res.cookie('XSRF-TOKEN', newToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.json({ csrfToken: newToken });
  }

  res.json({ csrfToken: token });
};
