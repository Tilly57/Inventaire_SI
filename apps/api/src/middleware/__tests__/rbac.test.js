/**
 * Unit tests for rbac.js middleware
 * Tests role-based access control including:
 * - requireRoles factory function with various role combinations
 * - requireAdmin shortcut (ADMIN only)
 * - requireManager shortcut (ADMIN + GESTIONNAIRE)
 * - User authentication checks
 * - Permission denial scenarios
 */

import { jest } from '@jest/globals';
import { ForbiddenError } from '../../utils/errors.js';
import { requireRoles, requireAdmin, requireManager } from '../rbac.js';

describe('RBAC Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express request object
    req = {
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

  describe('requireRoles factory function', () => {
    it('should allow access when user has the required role', () => {
      req.user = {
        userId: 'user1',
        email: 'admin@example.com',
        role: 'ADMIN'
      };

      const middleware = requireRoles(['ADMIN']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should allow access when user has one of multiple allowed roles', () => {
      req.user = {
        userId: 'user2',
        email: 'manager@example.com',
        role: 'GESTIONNAIRE'
      };

      const middleware = requireRoles(['ADMIN', 'GESTIONNAIRE']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should block access when user lacks required role', () => {
      req.user = {
        userId: 'user3',
        email: 'reader@example.com',
        role: 'LECTURE'
      };

      const middleware = requireRoles(['ADMIN', 'GESTIONNAIRE']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Vous n\'avez pas les permissions nécessaires'
        })
      );
    });

    it('should block access when req.user is missing', () => {
      req.user = null;

      const middleware = requireRoles(['ADMIN']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Utilisateur non authentifié'
        })
      );
    });

    it('should block access when req.user is undefined', () => {
      req.user = undefined;

      const middleware = requireRoles(['GESTIONNAIRE']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Utilisateur non authentifié'
        })
      );
    });

    it('should handle single role requirement', () => {
      req.user = { userId: 'user1', email: 'test@example.com', role: 'LECTURE' };

      const middleware = requireRoles(['LECTURE']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle three or more allowed roles', () => {
      req.user = { userId: 'user1', email: 'test@example.com', role: 'LECTURE' };

      const middleware = requireRoles(['ADMIN', 'GESTIONNAIRE', 'LECTURE']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should call next exactly once on success', () => {
      req.user = { userId: 'user1', email: 'admin@example.com', role: 'ADMIN' };

      const middleware = requireRoles(['ADMIN']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next exactly once on failure', () => {
      req.user = { userId: 'user1', email: 'reader@example.com', role: 'LECTURE' };

      const middleware = requireRoles(['ADMIN']);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('requireAdmin shortcut', () => {
    it('should allow ADMIN role', () => {
      req.user = {
        userId: 'admin1',
        email: 'admin@example.com',
        role: 'ADMIN'
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should block GESTIONNAIRE role', () => {
      req.user = {
        userId: 'manager1',
        email: 'manager@example.com',
        role: 'GESTIONNAIRE'
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Vous n\'avez pas les permissions nécessaires'
        })
      );
    });

    it('should block LECTURE role', () => {
      req.user = {
        userId: 'reader1',
        email: 'reader@example.com',
        role: 'LECTURE'
      };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should block when user is not authenticated', () => {
      req.user = null;

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Utilisateur non authentifié'
        })
      );
    });
  });

  describe('requireManager shortcut', () => {
    it('should allow ADMIN role', () => {
      req.user = {
        userId: 'admin1',
        email: 'admin@example.com',
        role: 'ADMIN'
      };

      requireManager(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should allow GESTIONNAIRE role', () => {
      req.user = {
        userId: 'manager1',
        email: 'manager@example.com',
        role: 'GESTIONNAIRE'
      };

      requireManager(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should block LECTURE role', () => {
      req.user = {
        userId: 'reader1',
        email: 'reader@example.com',
        role: 'LECTURE'
      };

      requireManager(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Vous n\'avez pas les permissions nécessaires'
        })
      );
    });

    it('should block when user is not authenticated', () => {
      req.user = undefined;

      requireManager(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Utilisateur non authentifié'
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should throw ForbiddenError with correct message for missing user', () => {
      req.user = null;

      const middleware = requireRoles(['ADMIN']);
      middleware(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Utilisateur non authentifié');
      expect(error.statusCode).toBe(403);
    });

    it('should throw ForbiddenError with correct message for insufficient permissions', () => {
      req.user = { userId: 'user1', email: 'test@example.com', role: 'LECTURE' };

      const middleware = requireRoles(['ADMIN']);
      middleware(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Vous n\'avez pas les permissions nécessaires');
      expect(error.statusCode).toBe(403);
    });

    it('should not modify request object on failure', () => {
      req.user = { userId: 'user1', email: 'reader@example.com', role: 'LECTURE' };
      const originalUser = req.user;

      const middleware = requireRoles(['ADMIN']);
      middleware(req, res, next);

      expect(req.user).toBe(originalUser);
    });

    it('should not modify request object on success', () => {
      req.user = { userId: 'user1', email: 'admin@example.com', role: 'ADMIN' };
      const originalUser = req.user;

      const middleware = requireRoles(['ADMIN']);
      middleware(req, res, next);

      expect(req.user).toBe(originalUser);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle admin-only user management route', () => {
      // Simulate route: DELETE /users/:id (admin only)
      req.user = { userId: 'admin1', email: 'admin@example.com', role: 'ADMIN' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle manager-level asset creation route', () => {
      // Simulate route: POST /assets (admin + gestionnaire)
      req.user = { userId: 'manager1', email: 'manager@example.com', role: 'GESTIONNAIRE' };

      requireManager(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should block LECTURE user from creating loans', () => {
      // Simulate route: POST /loans (requires manager)
      req.user = { userId: 'reader1', email: 'reader@example.com', role: 'LECTURE' };

      requireManager(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should handle custom role combination', () => {
      // Simulate custom route with specific requirements
      req.user = { userId: 'manager1', email: 'manager@example.com', role: 'GESTIONNAIRE' };

      const customMiddleware = requireRoles(['ADMIN', 'GESTIONNAIRE']);
      customMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
