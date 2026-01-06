/**
 * @fileoverview Users service - Business logic for system user management
 *
 * This service handles:
 * - System user CRUD operations (ADMIN, GESTIONNAIRE, LECTURE)
 * - Password management (creation, updates, change password)
 * - Email uniqueness validation
 * - Secure password hashing with bcrypt
 *
 * Note: This manages system users (who access the admin panel),
 * NOT employees (who borrow equipment). See employees.service.js for that.
 */

import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { NotFoundError, ConflictError, UnauthorizedError } from '../utils/errors.js';
import { BCRYPT_SALT_ROUNDS } from '../utils/constants.js';
import { findOneOrFail, validateUniqueFields } from '../utils/prismaHelpers.js';
import { logCreate, logUpdate, logDelete } from '../utils/auditHelpers.js';

/**
 * Get all system users
 *
 * Returns users without password hashes for security.
 * Ordered by creation date (newest first).
 *
 * @returns {Promise<Array>} Array of user objects (excluding passwords)
 *
 * @example
 * const users = await getAllUsers();
 * // users = [{ id, email, role, createdAt, updatedAt }, ...]
 */
export async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
      // passwordHash explicitly excluded for security
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return users;
}

/**
 * Get a single user by ID
 *
 * @param {string} id - User ID (CUID format)
 * @returns {Promise<Object>} User object (excluding password)
 * @throws {NotFoundError} If user doesn't exist
 *
 * @example
 * const user = await getUserById('clijrn9ht0000...');
 */
export async function getUserById(id) {
  const user = await findOneOrFail('user', { id }, {
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    },
    errorMessage: 'Utilisateur non trouvé'
  });

  return user;
}

/**
 * Create a new system user
 *
 * Validates email uniqueness and hashes password before storage.
 * Only accessible by ADMIN users.
 *
 * @param {string} email - User email (must be unique)
 * @param {string} password - Plain text password (will be hashed)
 * @param {string} role - User role (ADMIN, GESTIONNAIRE, or LECTURE)
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Created user object (excluding password)
 * @throws {ConflictError} If email already exists
 *
 * @example
 * const user = await createUser('user@example.com', 'SecurePass123!', 'GESTIONNAIRE', req);
 */
export async function createUser(email, password, role, req) {
  // Check if user already exists
  await validateUniqueFields('user', { email }, {
    errorMessages: { email: 'Un utilisateur avec cet email existe déjà' }
  });

  // Hash password with bcrypt (configured salt rounds from constants)
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Create user (password hash stored, but not returned)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Audit trail (NEVER log passwords)
  await logCreate('User', user.id, req, { email, role });  // Exclude passwordHash

  return user;
}

/**
 * Update an existing user
 *
 * Can update email and role. Password changes use separate changePassword function.
 * Validates email uniqueness if email is being changed.
 *
 * @param {string} id - User ID to update
 * @param {Object} data - Update data
 * @param {string} [data.email] - New email (must be unique)
 * @param {string} [data.role] - New role
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Updated user object
 * @throws {NotFoundError} If user doesn't exist
 * @throws {ConflictError} If new email already exists
 *
 * @example
 * const updated = await updateUser('userId123', { role: 'ADMIN' }, req);
 */
export async function updateUser(id, data, req) {
  // Check if user exists
  const existingUser = await findOneOrFail('user', { id }, {
    errorMessage: 'Utilisateur non trouvé'
  });

  // If email is being changed, validate uniqueness
  if (data.email && data.email !== existingUser.email) {
    await validateUniqueFields('user', { email: data.email }, {
      excludeId: id,
      errorMessages: { email: 'Un utilisateur avec cet email existe déjà' }
    });
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Audit trail (exclude passwordHash)
  await logUpdate('User', id, req, { email: existingUser.email, role: existingUser.role }, { email: user.email, role: user.role });

  return user;
}

/**
 * Delete a system user
 *
 * Permanently removes user from the system.
 * Note: No cascading checks needed as users don't own critical data.
 *
 * @param {string} id - User ID to delete
 * @param {Object} req - Express request object (for audit trail)
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If user doesn't exist
 *
 * @example
 * await deleteUser('userId123', req);
 */
export async function deleteUser(id, req) {
  // Check if user exists
  const existingUser = await findOneOrFail('user', { id }, {
    errorMessage: 'Utilisateur non trouvé'
  });

  // Delete user
  await prisma.user.delete({ where: { id } });

  // Audit trail (exclude passwordHash)
  await logDelete('User', id, req, { email: existingUser.email, role: existingUser.role });

  return { message: 'Utilisateur supprimé avec succès' };
}

/**
 * Change user password
 *
 * Requires current password verification for security.
 * New password is hashed before storage.
 *
 * @param {string} userId - User ID changing password
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password (plain text, will be hashed)
 * @returns {Promise<Object>} Success message
 * @throws {NotFoundError} If user doesn't exist
 * @throws {UnauthorizedError} If current password is incorrect
 *
 * @example
 * await changePassword('userId123', 'oldPass', 'newSecurePass123!');
 */
export async function changePassword(userId, currentPassword, newPassword) {
  // Get user with password hash (needed for verification)
  const user = await findOneOrFail('user', { id: userId }, {
    errorMessage: 'Utilisateur non trouvé'
  });

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Mot de passe actuel incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash }
  });

  return { message: 'Mot de passe modifié avec succès' };
}
