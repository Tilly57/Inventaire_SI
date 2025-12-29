/**
 * @fileoverview Custom error classes for structured API error handling
 *
 * This module provides:
 * - Base AppError class for operational errors
 * - HTTP-specific error classes (400, 401, 403, 404, 409)
 * - Error categorization (operational vs programming errors)
 * - Stack trace preservation for debugging
 *
 * Error Flow:
 * 1. Service/controller throws custom error
 * 2. errorHandler middleware catches it
 * 3. Sends appropriate HTTP response with statusCode
 *
 * All errors extend AppError which marks them as "operational" (expected errors
 * like validation failures) vs programming errors (bugs). The errorHandler
 * middleware only sends detailed responses for operational errors.
 */

/**
 * Base class for all application errors
 *
 * Provides standard properties for HTTP error responses:
 * - message: Human-readable error description
 * - statusCode: HTTP status code (default 500)
 * - isOperational: Flag to distinguish expected errors from bugs
 *
 * @class AppError
 * @extends Error
 *
 * @example
 * throw new AppError('Something went wrong', 500)
 */
export class AppError extends Error {
  /**
   * Create a new application error
   *
   * @param {string} message - Error message for the user
   * @param {number} [statusCode=500] - HTTP status code
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Flag for errorHandler middleware
    Error.captureStackTrace(this, this.constructor); // Preserve stack trace
  }
}

/**
 * Validation error (HTTP 400)
 *
 * Used when request data fails validation (Zod schemas, business rules).
 * Can include detailed validation errors array.
 *
 * @class ValidationError
 * @extends AppError
 *
 * @example
 * // Simple validation error
 * throw new ValidationError('Email invalide')
 *
 * @example
 * // With validation details
 * throw new ValidationError('Données invalides', [
 *   { field: 'email', message: 'Format invalide' }
 * ])
 */
export class ValidationError extends AppError {
  /**
   * Create a validation error
   *
   * @param {string} message - Error message
   * @param {Array} [details=[]] - Array of validation error objects
   */
  constructor(message, details = []) {
    super(message, 400);
    this.details = details; // Optional: Detailed validation errors
  }
}

/**
 * Authentication error (HTTP 401)
 *
 * Used when authentication fails (invalid credentials, expired token).
 * Generic messages prevent user enumeration attacks.
 *
 * @class UnauthorizedError
 * @extends AppError
 *
 * @example
 * // Login failure
 * throw new UnauthorizedError('Email ou mot de passe incorrect')
 *
 * @example
 * // Token validation failure
 * throw new UnauthorizedError('Token invalide ou expiré')
 */
export class UnauthorizedError extends AppError {
  /**
   * Create an authentication error
   *
   * @param {string} [message='Non autorisé'] - Error message
   */
  constructor(message = 'Non autorisé') {
    super(message, 401);
  }
}

/**
 * Authorization error (HTTP 403)
 *
 * Used when user is authenticated but lacks permissions.
 * Triggered by RBAC middleware when role doesn't match required role.
 *
 * @class ForbiddenError
 * @extends AppError
 *
 * @example
 * // RBAC check failure
 * throw new ForbiddenError('Vous n\'avez pas les droits nécessaires')
 *
 * @example
 * // Custom permission check
 * if (user.role !== 'ADMIN') {
 *   throw new ForbiddenError('Réservé aux administrateurs')
 * }
 */
export class ForbiddenError extends AppError {
  /**
   * Create an authorization error
   *
   * @param {string} [message='Accès interdit'] - Error message
   */
  constructor(message = 'Accès interdit') {
    super(message, 403);
  }
}

/**
 * Resource not found error (HTTP 404)
 *
 * Used when querying database for a resource that doesn't exist.
 * Thrown after Prisma findUnique/findFirst returns null.
 *
 * @class NotFoundError
 * @extends AppError
 *
 * @example
 * const user = await prisma.user.findUnique({ where: { id } })
 * if (!user) {
 *   throw new NotFoundError('Utilisateur non trouvé')
 * }
 */
export class NotFoundError extends AppError {
  /**
   * Create a not found error
   *
   * @param {string} [message='Ressource non trouvée'] - Error message
   */
  constructor(message = 'Ressource non trouvée') {
    super(message, 404);
  }
}

/**
 * Conflict error (HTTP 409)
 *
 * Used when operation conflicts with existing data:
 * - Unique constraint violations (duplicate email, assetTag)
 * - Race conditions (concurrent updates)
 * - Business rule conflicts (can't delete user with loans)
 *
 * @class ConflictError
 * @extends AppError
 *
 * @example
 * // Unique constraint violation
 * const exists = await prisma.user.findUnique({ where: { email } })
 * if (exists) {
 *   throw new ConflictError('Cet email est déjà utilisé')
 * }
 *
 * @example
 * // Business rule conflict
 * if (employee._count.loans > 0) {
 *   throw new ConflictError('Impossible de supprimer un employé avec des prêts')
 * }
 */
export class ConflictError extends AppError {
  /**
   * Create a conflict error
   *
   * @param {string} [message='Conflit de données'] - Error message
   */
  constructor(message = 'Conflit de données') {
    super(message, 409);
  }
}
