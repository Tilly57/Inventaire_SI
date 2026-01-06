/**
 * @fileoverview Prisma helpers for common database operations
 *
 * Reduces code duplication in service layers by providing:
 * - findOneOrFail: Fetch and validate existence (30+ duplicate blocks eliminated)
 * - ensureUnique: Validate field uniqueness before create/update
 */

import prisma from '../config/database.js';
import { NotFoundError, ConflictError } from './errors.js';

/**
 * Find a single record or throw NotFoundError
 *
 * Combines findUnique + existence check into one reusable function.
 * Eliminates 30+ duplicate validation blocks across services.
 *
 * @param {string} model - Prisma model name (e.g., 'assetItem', 'user')
 * @param {Object} where - Where clause for findUnique
 * @param {Object} [options={}] - Additional options
 * @param {Object} [options.include] - Relations to include
 * @param {Object} [options.select] - Fields to select
 * @param {string} [options.errorMessage] - Custom error message
 * @returns {Promise<Object>} Found record
 * @throws {NotFoundError} If record doesn't exist
 *
 * @example
 * // Simple existence check
 * const item = await findOneOrFail('assetItem', { id });
 *
 * @example
 * // With relations
 * const item = await findOneOrFail('assetItem', { id }, {
 *   include: { assetModel: true },
 *   errorMessage: 'Article d\'équipement non trouvé'
 * });
 *
 * @example
 * // With field selection
 * const user = await findOneOrFail('user', { email }, {
 *   select: { id: true, email: true, role: true }
 * });
 */
export const findOneOrFail = async (model, where, options = {}) => {
  const { include, select, errorMessage } = options;

  const record = await prisma[model].findUnique({
    where,
    ...(include && { include }),
    ...(select && { select })
  });

  if (!record) {
    throw new NotFoundError(errorMessage || `${model} non trouvé`);
  }

  return record;
};

/**
 * Ensure a field value is unique (throw if already exists)
 *
 * Validates uniqueness constraints before create/update operations.
 * Useful for fields like email, assetTag, serial numbers.
 *
 * @param {string} model - Prisma model name
 * @param {string} field - Field name to check (must have unique constraint)
 * @param {*} value - Value to validate
 * @param {Object} [options={}] - Additional options
 * @param {string} [options.excludeId] - Record ID to exclude (for updates)
 * @param {string} [options.errorMessage] - Custom error message
 * @throws {ConflictError} If value already exists
 *
 * @example
 * // Check email uniqueness on create
 * await ensureUnique('user', 'email', 'test@example.com');
 *
 * @example
 * // Check email uniqueness on update (exclude current record)
 * await ensureUnique('user', 'email', 'new@example.com', {
 *   excludeId: userId,
 *   errorMessage: 'Cet email est déjà utilisé'
 * });
 */
export const ensureUnique = async (model, field, value, options = {}) => {
  const { excludeId, errorMessage } = options;

  if (!value) return; // Skip if value is null/undefined

  const existing = await prisma[model].findUnique({
    where: { [field]: value }
  });

  // If record exists and it's not the one we're updating
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(errorMessage || `Ce ${field} existe déjà`);
  }
};

/**
 * Validate uniqueness for multiple fields at once
 *
 * Batch validation for models with multiple unique constraints
 * (e.g., assetItem has both assetTag and serial).
 *
 * @param {string} model - Prisma model name
 * @param {Object} fields - Object with field names as keys and values to check
 * @param {Object} [options={}] - Additional options
 * @param {string} [options.excludeId] - Record ID to exclude (for updates)
 * @param {Object} [options.errorMessages] - Custom error messages per field
 * @throws {ConflictError} If any field value already exists
 *
 * @example
 * // Validate assetTag and serial on create
 * await validateUniqueFields('assetItem', {
 *   assetTag: 'INV-001',
 *   serial: 'SN123456'
 * });
 *
 * @example
 * // Validate on update with custom messages
 * await validateUniqueFields('assetItem', {
 *   assetTag: data.assetTag,
 *   serial: data.serial
 * }, {
 *   excludeId: itemId,
 *   errorMessages: {
 *     assetTag: 'Ce numéro d\'inventaire existe déjà',
 *     serial: 'Ce numéro de série existe déjà'
 *   }
 * });
 */
export const validateUniqueFields = async (model, fields, options = {}) => {
  const { excludeId, errorMessages = {} } = options;

  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue; // Skip null/undefined values

    const existing = await prisma[model].findUnique({
      where: { [field]: value }
    });

    if (existing && existing.id !== excludeId) {
      const message = errorMessages[field] || `Ce ${field} existe déjà`;
      throw new ConflictError(message);
    }
  }
};
