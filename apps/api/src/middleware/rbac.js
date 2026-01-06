/**
 * @fileoverview Role-Based Access Control (RBAC) middleware
 *
 * This middleware enforces access control based on user roles:
 * - ADMIN: Full access to all features
 * - GESTIONNAIRE: Manage assets, loans, employees (no user management)
 * - LECTURE: Read-only access
 *
 * Role Hierarchy (from most to least privileged):
 * ADMIN > GESTIONNAIRE > LECTURE
 *
 * Requirements:
 * - Must be used AFTER requireAuth middleware (needs req.user)
 * - Throws ForbiddenError (403) if user lacks required permissions
 */

import { ForbiddenError } from '../utils/errors.js';

/**
 * Require specific roles middleware factory
 *
 * Creates a middleware that checks if authenticated user has one of
 * the allowed roles. Grants access if user's role matches any in the list.
 *
 * @param {string[]} allowedRoles - Array of allowed role names
 * @returns {Function} Express middleware function
 *
 * @example
 * // Custom role requirement
 * router.post('/secret', requireAuth, requireRoles(['ADMIN', 'GESTIONNAIRE']), handler);
 *
 * @example
 * // Using predefined helpers
 * router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);
 * router.post('/loans', requireAuth, requireManager, createLoan);
 */
export const requireRoles = (allowedRoles) => {
  /**
   * RBAC middleware function
   *
   * @middleware
   * @param {Request} req - Express request object (must have req.user from requireAuth)
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @throws {ForbiddenError} If user not authenticated or lacks required role
   */
  return (req, res, next) => {
    // Ensure user is authenticated (should never happen if requireAuth is used)
    if (!req.user) {
      return next(new ForbiddenError('Utilisateur non authentifié'));
    }

    // Check if user's role is in allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Vous n\'avez pas les permissions nécessaires'));
    }

    // User has required role, proceed
    next();
  };
};

/**
 * Require ADMIN role only
 *
 * Shorthand middleware for admin-only routes.
 * Only users with ADMIN role can access these routes.
 *
 * Use for:
 * - User management (create, update, delete users)
 * - System configuration
 * - Sensitive operations
 *
 * @middleware
 *
 * @example
 * // Admin-only route
 * router.post('/users', requireAuth, requireAdmin, createUser);
 * router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);
 */
/**
 * Require a single specific role
 *
 * Shorthand for requiring a single role.
 *
 * @param {string} role - Required role name
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/dashboard/refresh', requireAuth, requireRole('ADMIN'), refreshStats);
 */
export const requireRole = (role) => requireRoles([role]);

export const requireAdmin = requireRoles(['ADMIN']);

/**
 * Require ADMIN or GESTIONNAIRE roles
 *
 * Shorthand middleware for manager-level routes.
 * Users with ADMIN or GESTIONNAIRE roles can access these routes.
 *
 * Use for:
 * - Asset management (create, update assets)
 * - Loan management (create, close loans)
 * - Employee management (CRUD employees)
 * - Stock management
 *
 * LECTURE users are excluded (read-only access only).
 *
 * @middleware
 *
 * @example
 * // Manager-level routes
 * router.post('/loans', requireAuth, requireManager, createLoan);
 * router.post('/employees', requireAuth, requireManager, createEmployee);
 * router.patch('/assets/:id', requireAuth, requireManager, updateAsset);
 *
 * @example
 * // Complete route protection
 * router.get('/loans', requireAuth, getLoans);           // All authenticated users
 * router.post('/loans', requireAuth, requireManager, createLoan);  // ADMIN + GESTIONNAIRE
 * router.delete('/loans/:id', requireAuth, requireAdmin, deleteLoan);  // ADMIN only
 */
export const requireManager = requireRoles(['ADMIN', 'GESTIONNAIRE']);
