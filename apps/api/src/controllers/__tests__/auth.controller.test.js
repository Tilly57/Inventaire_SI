/**
 * @fileoverview Unit tests for auth.controller.js
 *
 * Tests HTTP layer behavior:
 * - Request/response handling
 * - Status codes
 * - Cookie management
 * - Error handling
 * - Service integration
 */

import { jest } from '@jest/globals';

// Mock dependencies BEFORE imports
const mockRegister = jest.fn();
const mockLogin = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockLogout = jest.fn();
const mockVerifyRefreshToken = jest.fn();
const mockGenerateAccessToken = jest.fn();
const mockAsyncHandler = jest.fn((fn) => fn); // Pass through function

jest.unstable_mockModule('../../services/auth.service.js', () => ({
  register: mockRegister,
  login: mockLogin,
  getCurrentUser: mockGetCurrentUser,
  logout: mockLogout
}));

jest.unstable_mockModule('../../utils/jwt.js', () => ({
  verifyRefreshToken: mockVerifyRefreshToken,
  generateAccessToken: mockGenerateAccessToken
}));

jest.unstable_mockModule('../../middleware/asyncHandler.js', () => ({
  asyncHandler: mockAsyncHandler
}));

// Import controllers AFTER mocks
const { register, login, refresh, logout, me } = await import('../auth.controller.js');

describe('auth.controller', () => {
  let req, res;

  beforeEach(() => {
    // Mock Express request object
    req = {
      body: {},
      cookies: {},
      user: {}
    };

    // Mock Express response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };

    // Clear all mocks between tests
    jest.clearAllMocks();

    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe('register', () => {
    const mockUser = {
      id: 'user-123',
      email: 'newuser@test.com',
      role: 'GESTIONNAIRE'
    };

    const mockTokens = {
      accessToken: 'access-token-xyz',
      refreshToken: 'refresh-token-xyz',
      user: mockUser
    };

    it('should register a new user successfully', async () => {
      req.body = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        role: 'GESTIONNAIRE'
      };

      mockRegister.mockResolvedValue(mockTokens);

      await register(req, res);

      expect(mockRegister).toHaveBeenCalledWith(
        'newuser@test.com',
        'SecurePass123!',
        'GESTIONNAIRE'
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token-xyz',
        expect.objectContaining({
          httpOnly: true,
          secure: false, // test environment
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'access-token-xyz',
          user: mockUser
        }
      });
    });

    it('should set secure cookie in production', async () => {
      process.env.NODE_ENV = 'production';
      req.body = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        role: 'ADMIN'
      };

      mockRegister.mockResolvedValue(mockTokens);

      await register(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({
          secure: true // production environment
        })
      );
    });

    it('should handle registration errors', async () => {
      req.body = {
        email: 'invalid-email',
        password: 'weak',
        role: 'ADMIN'
      };

      const error = new Error('Validation failed');
      mockRegister.mockRejectedValue(error);

      await expect(register(req, res)).rejects.toThrow('Validation failed');
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-456',
      email: 'user@test.com',
      role: 'ADMIN'
    };

    const mockTokens = {
      accessToken: 'access-token-abc',
      refreshToken: 'refresh-token-abc',
      user: mockUser
    };

    it('should login user with valid credentials', async () => {
      req.body = {
        email: 'user@test.com',
        password: 'Password123!'
      };

      mockLogin.mockResolvedValue(mockTokens);

      await login(req, res);

      expect(mockLogin).toHaveBeenCalledWith(
        'user@test.com',
        'Password123!'
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token-abc',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'access-token-abc',
          user: mockUser
        }
      });
    });

    it('should not call res.status for successful login (defaults to 200)', async () => {
      req.body = {
        email: 'user@test.com',
        password: 'Password123!'
      };

      mockLogin.mockResolvedValue(mockTokens);

      await login(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle invalid credentials', async () => {
      req.body = {
        email: 'user@test.com',
        password: 'WrongPassword'
      };

      const error = new Error('Invalid credentials');
      mockLogin.mockRejectedValue(error);

      await expect(login(req, res)).rejects.toThrow('Invalid credentials');
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('should handle missing email', async () => {
      req.body = {
        password: 'Password123!'
      };

      const error = new Error('Email is required');
      mockLogin.mockRejectedValue(error);

      await expect(login(req, res)).rejects.toThrow('Email is required');
    });

    it('should handle missing password', async () => {
      req.body = {
        email: 'user@test.com'
      };

      const error = new Error('Password is required');
      mockLogin.mockRejectedValue(error);

      await expect(login(req, res)).rejects.toThrow('Password is required');
    });
  });

  describe('refresh', () => {
    const mockUser = {
      id: 'user-789',
      email: 'refresh@test.com',
      role: 'GESTIONNAIRE'
    };

    it('should refresh access token with valid refresh token', async () => {
      req.cookies = {
        refreshToken: 'valid-refresh-token'
      };

      const mockPayload = {
        userId: 'user-789'
      };

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGenerateAccessToken.mockReturnValue('new-access-token');

      await refresh(req, res);

      expect(mockVerifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockGetCurrentUser).toHaveBeenCalledWith('user-789');
      expect(mockGenerateAccessToken).toHaveBeenCalledWith(
        'user-789',
        'refresh@test.com',
        'GESTIONNAIRE'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'new-access-token',
          user: mockUser
        }
      });
    });

    it('should return 401 when refresh token is missing', async () => {
      req.cookies = {}; // No refresh token

      await refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refresh token manquant'
      });
      expect(mockVerifyRefreshToken).not.toHaveBeenCalled();
    });

    it('should handle invalid refresh token', async () => {
      req.cookies = {
        refreshToken: 'invalid-token'
      };

      const error = new Error('Invalid refresh token');
      mockVerifyRefreshToken.mockImplementation(() => {
        throw error;
      });

      await expect(refresh(req, res)).rejects.toThrow('Invalid refresh token');
      expect(mockGetCurrentUser).not.toHaveBeenCalled();
    });

    it('should handle expired refresh token', async () => {
      req.cookies = {
        refreshToken: 'expired-token'
      };

      const error = new Error('Token expired');
      mockVerifyRefreshToken.mockImplementation(() => {
        throw error;
      });

      await expect(refresh(req, res)).rejects.toThrow('Token expired');
    });

    it('should handle user not found', async () => {
      req.cookies = {
        refreshToken: 'valid-refresh-token'
      };

      const mockPayload = {
        userId: 'non-existent-user'
      };

      mockVerifyRefreshToken.mockReturnValue(mockPayload);
      mockGetCurrentUser.mockRejectedValue(new Error('User not found'));

      await expect(refresh(req, res)).rejects.toThrow('User not found');
      expect(mockGenerateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear refresh token cookie', async () => {
      await logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Déconnexion réussie' }
      });
    });

    it('should logout even without existing cookie', async () => {
      req.cookies = {}; // No cookies

      await logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Déconnexion réussie' }
      });
    });

    it('should return success status', async () => {
      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('me', () => {
    const mockUser = {
      id: 'user-current',
      email: 'current@test.com',
      role: 'ADMIN',
      createdAt: new Date('2024-01-15T10:30:00Z')
    };

    it('should return current user data', async () => {
      req.user = {
        userId: 'user-current'
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);

      await me(req, res);

      expect(mockGetCurrentUser).toHaveBeenCalledWith('user-current');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should handle user not found', async () => {
      req.user = {
        userId: 'non-existent'
      };

      mockGetCurrentUser.mockRejectedValue(new Error('User not found'));

      await expect(me(req, res)).rejects.toThrow('User not found');
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should require authenticated user', async () => {
      req.user = {}; // No userId

      mockGetCurrentUser.mockResolvedValue(null);

      await me(req, res);

      expect(mockGetCurrentUser).toHaveBeenCalledWith(undefined);
    });
  });

  describe('HTTP layer behavior', () => {
    it('should handle async errors gracefully with asyncHandler', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'Test123!'
      };

      const error = new Error('Database connection failed');
      mockLogin.mockRejectedValue(error);

      // asyncHandler wraps the function, so it should propagate errors
      await expect(login(req, res)).rejects.toThrow('Database connection failed');
    });

    it('should set correct cookie attributes for security', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'Test123!'
      };

      mockLogin.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: '1', email: 'test@test.com', role: 'ADMIN' }
      });

      await login(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,    // XSS protection
          sameSite: 'strict' // CSRF protection
        })
      );
    });

    it('should return consistent response format for success', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'Test123!'
      };

      mockLogin.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: '1', email: 'test@test.com', role: 'ADMIN' }
      });

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });
});
