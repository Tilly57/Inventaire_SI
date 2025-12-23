/**
 * Role-Based Access Control middleware
 */
import { ForbiddenError } from '../utils/errors.js';

/**
 * Require specific roles middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Utilisateur non authentifié'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Vous n\'avez pas les permissions nécessaires'));
    }

    next();
  };
};

/**
 * Require ADMIN role
 */
export const requireAdmin = requireRoles(['ADMIN']);

/**
 * Require ADMIN or GESTIONNAIRE roles
 */
export const requireManager = requireRoles(['ADMIN', 'GESTIONNAIRE']);
