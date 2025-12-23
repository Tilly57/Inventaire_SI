/**
 * Custom error classes for API error handling
 */

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400);
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Non autorisé') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès interdit') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflit de données') {
    super(message, 409);
  }
}
