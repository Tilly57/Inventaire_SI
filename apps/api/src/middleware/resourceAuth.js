/**
 * @fileoverview Resource-level authorization middleware - Phase 2 Security
 *
 * This middleware adds ownership and resource-level access control beyond RBAC.
 *
 * RBAC (Role-Based Access Control) checks if a user's ROLE allows an action.
 * Resource Auth checks if a user has OWNERSHIP/ACCESS to a specific resource.
 *
 * Example:
 * - RBAC: "Can a GESTIONNAIRE delete employees?" → YES
 * - Resource Auth: "Can THIS GESTIONNAIRE delete THIS SPECIFIC employee?" → Only if they manage them
 *
 * Use Cases:
 * - Employee management: Only manage employees you're assigned to
 * - Loan management: Only access loans you created
 * - Asset assignment: Only modify assets you're responsible for
 *
 * Security Principle: Defense in depth
 * - Layer 1: Authentication (requireAuth)
 * - Layer 2: Role-based access (requireRoles)
 * - Layer 3: Resource ownership (THIS MODULE)
 */

import prisma from '../config/database.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { asyncHandler } from './asyncHandler.js';
import { ROLES } from '../utils/constants.js';

/**
 * Check if user owns or has access to an employee
 *
 * Ownership Rules:
 * - ADMIN: Access all employees
 * - GESTIONNAIRE: Access only employees they manage (managerId)
 * - LECTURE: Read-only access (enforced by RBAC)
 *
 * @param {string} userId - Authenticated user's ID
 * @param {string} userRole - Authenticated user's role
 * @param {string} employeeId - Employee ID to check
 * @returns {Promise<boolean>} True if user has access
 */
async function canAccessEmployee(userId, userRole, employeeId) {
  // ADMIN has access to all employees
  if (userRole === ROLES.ADMIN) {
    return true;
  }

  // For GESTIONNAIRE: Check if they manage this employee
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, managerId: true }
  });

  if (!employee) {
    throw new NotFoundError('Employé non trouvé');
  }

  // Gestionnaire can only access employees they manage
  return employee.managerId === userId;
}

/**
 * Check if user owns or has access to a loan
 *
 * Ownership Rules:
 * - ADMIN: Access all loans
 * - GESTIONNAIRE: Access only loans they created
 * - LECTURE: Read-only access (enforced by RBAC)
 *
 * @param {string} userId - Authenticated user's ID
 * @param {string} userRole - Authenticated user's role
 * @param {string} loanId - Loan ID to check
 * @returns {Promise<boolean>} True if user has access
 */
async function canAccessLoan(userId, userRole, loanId) {
  // ADMIN has access to all loans
  if (userRole === ROLES.ADMIN) {
    return true;
  }

  // For GESTIONNAIRE: Check if they created this loan
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: { id: true, createdById: true }
  });

  if (!loan) {
    throw new NotFoundError('Prêt non trouvé');
  }

  // Gestionnaire can only access loans they created
  return loan.createdById === userId;
}

/**
 * Check if user owns or has access to an asset item
 *
 * Ownership Rules:
 * - ADMIN: Access all assets
 * - GESTIONNAIRE: Access all assets (business rule: assets are shared)
 * - LECTURE: Read-only access (enforced by RBAC)
 *
 * @param {string} userId - Authenticated user's ID
 * @param {string} userRole - Authenticated user's role
 * @param {string} assetItemId - Asset item ID to check
 * @returns {Promise<boolean>} True if user has access
 */
async function canAccessAssetItem(userId, userRole, assetItemId) {
  // ADMIN and GESTIONNAIRE have access to all assets
  if (userRole === ROLES.ADMIN || userRole === ROLES.GESTIONNAIRE) {
    return true;
  }

  // LECTURE role is read-only (enforced by RBAC before this check)
  return false;
}

/**
 * Check if user owns or has access to a user account
 *
 * Ownership Rules:
 * - ADMIN: Access all users
 * - GESTIONNAIRE: Access only their own account
 * - LECTURE: Access only their own account
 *
 * @param {string} userId - Authenticated user's ID
 * @param {string} userRole - Authenticated user's role
 * @param {string} targetUserId - Target user ID to check
 * @returns {Promise<boolean>} True if user has access
 */
async function canAccessUser(userId, userRole, targetUserId) {
  // ADMIN has access to all users
  if (userRole === ROLES.ADMIN) {
    return true;
  }

  // Non-admin users can only access their own account
  return userId === targetUserId;
}

/**
 * Middleware factory: Require ownership of a resource
 *
 * Verifies that the authenticated user owns or has permission to access
 * the specified resource. Should be used AFTER requireAuth and requireRoles.
 *
 * Middleware Chain Example:
 * ```javascript
 * router.patch('/employees/:id',
 *   requireAuth,                    // Layer 1: Is user authenticated?
 *   requireManager,                 // Layer 2: Does user have GESTIONNAIRE/ADMIN role?
 *   requireOwnership('employee'),   // Layer 3: Does user manage THIS employee?
 *   updateEmployee
 * )
 * ```
 *
 * @param {string} resourceType - Type of resource ('employee', 'loan', 'assetItem', 'user')
 * @returns {Function} Express middleware function
 *
 * @throws {ForbiddenError} If user doesn't own/have access to the resource
 * @throws {NotFoundError} If resource doesn't exist
 *
 * @example
 * // Protect employee update endpoint
 * router.patch('/employees/:id',
 *   requireAuth,
 *   requireManager,
 *   requireOwnership('employee'),
 *   updateEmployee
 * );
 *
 * @example
 * // Protect loan deletion endpoint
 * router.delete('/loans/:id',
 *   requireAuth,
 *   requireManager,
 *   requireOwnership('loan'),
 *   deleteLoan
 * );
 */
export const requireOwnership = (resourceType) => {
  return asyncHandler(async (req, res, next) => {
    const { userId, role } = req.user;
    const resourceId = req.params.id;

    if (!resourceId) {
      throw new ForbiddenError('ID de ressource requis');
    }

    let hasAccess = false;

    switch (resourceType) {
      case 'employee':
        hasAccess = await canAccessEmployee(userId, role, resourceId);
        break;

      case 'loan':
        hasAccess = await canAccessLoan(userId, role, resourceId);
        break;

      case 'assetItem':
        hasAccess = await canAccessAssetItem(userId, role, resourceId);
        break;

      case 'user':
        hasAccess = await canAccessUser(userId, role, resourceId);
        break;

      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    if (!hasAccess) {
      throw new ForbiddenError('Vous n\'avez pas accès à cette ressource');
    }

    next();
  });
};

/**
 * Convenience middleware: Require ownership for current user
 *
 * Ensures that a user can only perform actions on their own account.
 * Useful for profile update, password change, etc.
 *
 * @example
 * // User can only update their own profile
 * router.patch('/users/me',
 *   requireAuth,
 *   requireSelf,
 *   updateUserProfile
 * );
 */
export const requireSelf = asyncHandler(async (req, res, next) => {
  const { userId } = req.user;
  const targetUserId = req.params.id || req.body.userId;

  if (userId !== targetUserId) {
    throw new ForbiddenError('Vous ne pouvez modifier que votre propre compte');
  }

  next();
});