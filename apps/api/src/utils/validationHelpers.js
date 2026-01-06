/**
 * @fileoverview Validation helpers for common validation patterns
 *
 * Provides reusable validation functions to reduce code duplication.
 * These complement the prismaHelpers for more complex validation scenarios.
 */

import prisma from '../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from './errors.js';

/**
 * Validate that a referenced model exists
 *
 * Common pattern when creating/updating records with foreign keys.
 * Throws NotFoundError if the referenced model doesn't exist.
 *
 * @param {string} model - Prisma model name to check
 * @param {string} id - ID to validate
 * @param {string} [errorMessage] - Custom error message
 * @returns {Promise<Object>} The found model record
 * @throws {NotFoundError} If model doesn't exist
 *
 * @example
 * // Validate assetModel exists before creating assetItem
 * const assetModel = await validateModelExists('assetModel', data.assetModelId);
 *
 * @example
 * // With custom error message
 * await validateModelExists('assetModel', id, 'Modèle d\'équipement non trouvé');
 */
export const validateModelExists = async (model, id, errorMessage) => {
  if (!id) return null; // Skip if ID not provided

  const record = await prisma[model].findUnique({ where: { id } });

  if (!record) {
    throw new NotFoundError(errorMessage || `${model} non trouvé`);
  }

  return record;
};

/**
 * Validate email format
 *
 * Simple email validation using regex.
 * For more complex validation, consider using a library like validator.js.
 *
 * @param {string} email - Email to validate
 * @param {string} [errorMessage] - Custom error message
 * @throws {ValidationError} If email format is invalid
 *
 * @example
 * validateEmail(data.email);
 */
export const validateEmail = (email, errorMessage) => {
  if (!email) return; // Skip if not provided

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new ValidationError(errorMessage || 'Format d\'email invalide');
  }
};

/**
 * Validate that a value is one of allowed enum values
 *
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} fieldName - Name of the field (for error message)
 * @throws {ValidationError} If value is not in allowed values
 *
 * @example
 * validateEnum(status, ['EN_STOCK', 'PRETE', 'HS', 'REPARATION'], 'status');
 */
export const validateEnum = (value, allowedValues, fieldName) => {
  if (!value) return; // Skip if not provided

  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} invalide. Valeurs autorisées: ${allowedValues.join(', ')}`
    );
  }
};

/**
 * Validate number is within range
 *
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {string} fieldName - Name of the field (for error message)
 * @throws {ValidationError} If number is out of range
 *
 * @example
 * validateRange(quantity, 1, 100, 'quantity');
 */
export const validateRange = (value, min, max, fieldName) => {
  if (value === null || value === undefined) return; // Skip if not provided

  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} doit être entre ${min} et ${max}`
    );
  }
};

/**
 * Validate string length
 *
 * @param {string} value - String to validate
 * @param {number} [minLength] - Minimum length
 * @param {number} [maxLength] - Maximum length
 * @param {string} fieldName - Name of the field (for error message)
 * @throws {ValidationError} If string length is invalid
 *
 * @example
 * validateStringLength(password, 8, 100, 'password');
 */
export const validateStringLength = (value, minLength, maxLength, fieldName) => {
  if (!value) return; // Skip if not provided

  if (minLength && value.length < minLength) {
    throw new ValidationError(
      `${fieldName} doit contenir au moins ${minLength} caractères`
    );
  }

  if (maxLength && value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} ne peut pas dépasser ${maxLength} caractères`
    );
  }
};
