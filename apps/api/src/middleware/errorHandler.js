/**
 * @fileoverview Global error handling middleware
 *
 * This middleware provides centralized error handling for the application:
 * - Converts operational errors to appropriate HTTP responses
 * - Maps Prisma database errors to user-friendly messages
 * - Handles file upload errors (Multer)
 * - Sanitizes error details for production (hides stack traces)
 * - Logs unexpected errors for debugging
 *
 * Error Response Format:
 * ```json
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "details": [{ "field": "email", "message": "..." }],
 *   "stack": "..." // Only in development
 * }
 * ```
 */

import { AppError, ValidationError } from '../utils/errors.js';
import { Prisma } from '@prisma/client';

/**
 * Global error handler middleware
 *
 * Processes all errors thrown in route handlers and middleware.
 * Converts errors to standardized JSON responses with appropriate
 * HTTP status codes and user-friendly messages.
 *
 * Handles:
 * - AppError subclasses (ValidationError, NotFoundError, etc.)
 * - Prisma database errors (unique constraints, foreign keys, not found)
 * - Multer file upload errors (size limits, invalid types)
 * - Unexpected errors (500 Internal Server Error)
 *
 * @middleware
 * @param {Error} err - Error object caught from previous middleware/routes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function (unused but required)
 *
 * @example
 * // In app.js, register as last middleware
 * app.use(errorHandler);
 *
 * @example
 * // Throwing operational error in route
 * throw new NotFoundError('User not found'); // → 404 response
 *
 * @example
 * // Prisma unique constraint violation
 * // Prisma error P2002 → "Violation de contrainte d'unicité"
 */
export const errorHandler = (err, req, res, next) => {
  // Default to 500 Internal Server Error
  let statusCode = 500;
  let message = 'Erreur interne du serveur';
  let details = [];

  // Handle operational errors (known error types)
  // These are expected errors with specific status codes and messages

  if (err instanceof ValidationError) {
    // Validation errors (400) with field-level details
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;  // Array of field validation errors
  } else if (err instanceof AppError) {
    // Other operational errors (NotFoundError, UnauthorizedError, etc.)
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Prisma database errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma errors have specific error codes
    statusCode = 400;

    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        // Example: duplicate email, asset tag, serial number
        message = 'Violation de contrainte d\'unicité';
        const field = err.meta?.target?.[0] || 'champ';
        details = [{ field, message: `Ce ${field} existe déjà` }];
        break;

      case 'P2025':
        // Record not found (e.g., update/delete non-existent record)
        statusCode = 404;
        message = 'Ressource non trouvée';
        break;

      case 'P2003':
        // Foreign key constraint violation
        // Example: referencing non-existent assetModelId
        message = 'Violation de contrainte de clé étrangère';
        break;

      default:
        // Other Prisma errors
        message = 'Erreur de base de données';
    }
  }
  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    // Data type validation errors (wrong types, missing required fields)
    statusCode = 400;
    message = 'Erreur de validation des données';
  }
  // Handle Multer file upload errors
  else if (err.name === 'MulterError') {
    statusCode = 400;

    if (err.code === 'LIMIT_FILE_SIZE') {
      // File size exceeds limit (5MB for signatures)
      message = 'Fichier trop volumineux (max 5MB)';
    } else {
      // Other Multer errors (invalid field name, etc.)
      message = `Erreur d'upload: ${err.message}`;
    }
  }

  // Logging strategy:
  // Development: Log all errors with stack traces
  // Production: Only log unexpected (non-operational) errors
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  } else if (!err.isOperational) {
    // Unexpected errors in production need investigation
    console.error('❌ Unexpected Error:', err);
  }

  // Send standardized JSON error response
  res.status(statusCode).json({
    success: false,
    error: message,
    // Include field-level details if present (validation errors)
    ...(details.length > 0 && { details }),
    // Include stack trace in development for debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404 handler for undefined routes
 *
 * Catches requests to routes that don't exist and returns
 * a standardized 404 error response.
 *
 * Should be registered AFTER all route definitions but BEFORE errorHandler.
 *
 * @middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 *
 * @example
 * // In app.js
 * app.use('/api/users', userRoutes);
 * app.use('/api/loans', loanRoutes);
 * // ... other routes
 * app.use(notFoundHandler);  // Catch all undefined routes
 * app.use(errorHandler);     // Then handle errors
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} non trouvée`
  });
};
