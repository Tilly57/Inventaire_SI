/**
 * Unit tests for auth.js middleware
 * Tests JWT authentication middleware including:
 * - Authorization header validation
 * - Bearer token extraction
 * - Token verification
 * - User attachment to request
 * - Error handling for invalid/missing tokens
 */

import { jest } from '@jest/globals';
import { UnauthorizedError } from '../../utils/errors.js';

// Mock dependencies
const mockVerifyAccessToken = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn); // Pass through function

jest.unstable_mockModule('../../utils/jwt.js', () => ({
  verifyAccessToken: mockVerifyAccessToken
}));

jest.unstable_mockModule('../asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler
}));

// Import middleware after mocks
const { requireAuth } = await import('../auth.js');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express request object
    req = {
      headers: {},
      user: null
    };

    // Mock Express response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock Express next function
    next = jest.fn();
  });

  describe('requireAuth', () => {
    it('should authenticate user with valid token', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'GESTIONNAIRE'
      };

      req.headers.authorization = `Bearer ${mockToken}`;
      mockVerifyAccessToken.mockReturnValue(mockPayload);

      await requireAuth(req, res, next);

      expect(mockVerifyAccessToken).toHaveBeenCalledWith(mockToken);
      expect(req.user).toEqual({
        userId: 'user123',
        email: 'test@example.com',
        role: 'GESTIONNAIRE'
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should attach correct user info for ADMIN role', async () => {
      const mockPayload = {
        userId: 'admin1',
        email: 'admin@example.com',
        role: 'ADMIN'
      };

      req.headers.authorization = 'Bearer admin.token';
      mockVerifyAccessToken.mockReturnValue(mockPayload);

      await requireAuth(req, res, next);

      expect(req.user.role).toBe('ADMIN');
      expect(req.user.userId).toBe('admin1');
    });

    it('should attach correct user info for LECTURE role', async () => {
      const mockPayload = {
        userId: 'reader1',
        email: 'reader@example.com',
        role: 'LECTURE'
      };

      req.headers.authorization = 'Bearer reader.token';
      mockVerifyAccessToken.mockReturnValue(mockPayload);

      await requireAuth(req, res, next);

      expect(req.user.role).toBe('LECTURE');
    });

    it('should throw UnauthorizedError when Authorization header is missing', async () => {
      // No Authorization header
      req.headers = {};

      await expect(requireAuth(req, res, next))
        .rejects.toThrow(UnauthorizedError);
      await expect(requireAuth(req, res, next))
        .rejects.toThrow('Token d\'authentification requis');

      expect(mockVerifyAccessToken).not.toHaveBeenCalled();
      expect(req.user).toBeNull();
    });

    it('should throw UnauthorizedError when Authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'Basic sometoken';

      await expect(requireAuth(req, res, next))
        .rejects.toThrow(UnauthorizedError);
      await expect(requireAuth(req, res, next))
        .rejects.toThrow('Token d\'authentification requis');

      expect(mockVerifyAccessToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when Authorization header is just "Bearer"', async () => {
      req.headers.authorization = 'Bearer';

      await expect(requireAuth(req, res, next))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when token is empty string', async () => {
      req.headers.authorization = 'Bearer ';

      // Empty token will be passed to verifyAccessToken which should throw
      mockVerifyAccessToken.mockImplementation(() => {
        throw new UnauthorizedError('Token invalide');
      });

      await expect(requireAuth(req, res, next))
        .rejects.toThrow(UnauthorizedError);

      expect(mockVerifyAccessToken).toHaveBeenCalledWith('');
    });

    it('should throw UnauthorizedError when token verification fails', async () => {
      req.headers.authorization = 'Bearer invalid.token';

      mockVerifyAccessToken.mockImplementation(() => {
        throw new UnauthorizedError('Token invalide ou expiré');
      });

      await expect(requireAuth(req, res, next))
        .rejects.toThrow('Token invalide ou expiré');

      expect(req.user).toBeNull();
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError when token is expired', async () => {
      req.headers.authorization = 'Bearer expired.token';

      mockVerifyAccessToken.mockImplementation(() => {
        throw new UnauthorizedError('Token expiré');
      });

      await expect(requireAuth(req, res, next))
        .rejects.toThrow('Token expiré');
    });

    it('should correctly extract token after "Bearer " prefix', async () => {
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
      req.headers.authorization = `Bearer ${expectedToken}`;

      mockVerifyAccessToken.mockReturnValue({
        userId: 'user1',
        email: 'test@example.com',
        role: 'ADMIN'
      });

      await requireAuth(req, res, next);

      expect(mockVerifyAccessToken).toHaveBeenCalledWith(expectedToken);
    });

    it('should handle tokens with special characters', async () => {
      const tokenWithSpecialChars = 'token.with-special_chars.123';
      req.headers.authorization = `Bearer ${tokenWithSpecialChars}`;

      mockVerifyAccessToken.mockReturnValue({
        userId: 'user1',
        email: 'test@example.com',
        role: 'GESTIONNAIRE'
      });

      await requireAuth(req, res, next);

      expect(mockVerifyAccessToken).toHaveBeenCalledWith(tokenWithSpecialChars);
      expect(next).toHaveBeenCalled();
    });

    it('should not modify request if token verification throws', async () => {
      req.headers.authorization = 'Bearer bad.token';
      const originalUser = req.user;

      mockVerifyAccessToken.mockImplementation(() => {
        throw new UnauthorizedError('Invalid token');
      });

      await expect(requireAuth(req, res, next)).rejects.toThrow();

      expect(req.user).toBe(originalUser);
    });

    it('should handle case-sensitive Authorization header', async () => {
      // Test with lowercase 'bearer' (should fail)
      req.headers.authorization = 'bearer token123';

      await expect(requireAuth(req, res, next))
        .rejects.toThrow('Token d\'authentification requis');
    });

    it('should call next exactly once on success', async () => {
      req.headers.authorization = 'Bearer valid.token';
      mockVerifyAccessToken.mockReturnValue({
        userId: 'user1',
        email: 'test@example.com',
        role: 'ADMIN'
      });

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });
});
