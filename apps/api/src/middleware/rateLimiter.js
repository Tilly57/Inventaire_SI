/**
 * @fileoverview Rate Limiting Middleware
 *
 * Protects the API from abuse by limiting the number of requests
 * a client can make within a time window.
 *
 * NOTE: Rate limiting is disabled in development and test modes
 * (NODE_ENV === 'development' || NODE_ENV === 'test') to facilitate
 * development and prevent test failures.
 *
 * IMPORTANT: Rate limiting is ACTIVE in production for security.
 */

import rateLimit from 'express-rate-limit';

// Disable rate limiting in test and development environments
const isTestEnv = process.env.NODE_ENV === 'test';
const isDevEnv = process.env.NODE_ENV === 'development';
const skipAll = (isTestEnv || isDevEnv) ? () => true : () => false;

/**
 * General rate limiter for all API routes
 *
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip in test/development environments or for file downloads
  skip: (req) => isTestEnv || isDevEnv || req.path.startsWith('/uploads/'),
});

/**
 * Strict rate limiter for authentication routes
 *
 * Limits: 5 requests per 15 minutes per IP
 * Prevents brute force attacks on login/register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip in test environment
  skip: skipAll,
  // Only count failed requests (optional - can be added later)
  skipSuccessfulRequests: false,
});

/**
 * Medium rate limiter for data modification routes
 *
 * Limits: 30 requests per 15 minutes per IP
 * Protects create/update/delete endpoints
 */
export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 mutations per windowMs
  message: {
    success: false,
    error: 'Trop de modifications, veuillez ralentir',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip in test/development environments or for GET requests
  skip: (req) => isTestEnv || isDevEnv || req.method === 'GET',
});

/**
 * Relaxed rate limiter for file uploads
 *
 * Limits: 10 uploads per hour per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    error: 'Trop d\'uploads, veuillez réessayer dans 1 heure',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip in test environment
  skip: skipAll,
});

export default {
  generalLimiter,
  authLimiter,
  mutationLimiter,
  uploadLimiter,
};
