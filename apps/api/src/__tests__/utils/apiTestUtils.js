/**
 * API Test Utilities
 *
 * Helpers for testing Express API endpoints with Supertest
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';

/**
 * Generate JWT tokens for testing
 *
 * @param {Object} user - User object
 * @returns {Object} { accessToken, refreshToken }
 */
export function generateTestTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET || 'test-access-secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

/**
 * Create authenticated request helper
 *
 * @param {Object} app - Express app
 * @param {Object} user - User to authenticate as
 * @returns {Object} Request object with authentication
 */
export function authenticatedRequest(app, user) {
  const { accessToken } = generateTestTokens(user);

  return {
    get: (url) => request(app).get(url).set('Cookie', `accessToken=${accessToken}`),
    post: (url) => request(app).post(url).set('Cookie', `accessToken=${accessToken}`),
    put: (url) => request(app).put(url).set('Cookie', `accessToken=${accessToken}`),
    patch: (url) => request(app).patch(url).set('Cookie', `accessToken=${accessToken}`),
    delete: (url) => request(app).delete(url).set('Cookie', `accessToken=${accessToken}`),
  };
}

/**
 * Expect API error response
 *
 * @param {Object} response - Supertest response
 * @param {number} statusCode - Expected status code
 * @param {string} errorMessage - Expected error message (optional)
 */
export function expectApiError(response, statusCode, errorMessage = null) {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(false);
  expect(response.body).toHaveProperty('error');

  if (errorMessage) {
    expect(response.body.error).toContain(errorMessage);
  }
}

/**
 * Expect API success response
 *
 * @param {Object} response - Supertest response
 * @param {number} statusCode - Expected status code (default 200)
 */
export function expectApiSuccess(response, statusCode = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
  expect(response.body).toHaveProperty('data');
}

/**
 * Create a mock Express app for testing specific routes
 *
 * @param {Function} router - Express router to test
 * @returns {Object} Express app
 */
export function createTestApp(router) {
  const express = (await import('express')).default;
  const cookieParser = (await import('cookie-parser')).default;

  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cookieParser());

  // Router
  app.use(router);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  });

  return app;
}

export default {
  generateTestTokens,
  authenticatedRequest,
  expectApiError,
  expectApiSuccess,
  createTestApp,
};
