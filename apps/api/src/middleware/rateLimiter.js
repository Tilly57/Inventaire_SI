/**
 * @fileoverview Rate Limiting Middleware
 *
 * Protects the API from abuse by limiting the number of requests
 * a client can make within a time window.
 */

import rateLimit from 'express-rate-limit';

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
  // Skip successful requests to file downloads
  skip: (req) => req.path.startsWith('/uploads/'),
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
  // Only apply to POST, PUT, PATCH, DELETE
  skip: (req) => req.method === 'GET',
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
});

export default {
  generalLimiter,
  authLimiter,
  mutationLimiter,
  uploadLimiter,
};
