/**
 * Global error handling middleware
 */
import { AppError, ValidationError } from '../utils/errors.js';
import { Prisma } from '@prisma/client';

export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Erreur interne du serveur';
  let details = [];

  // Handle known operational errors
  if (err instanceof ValidationError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    switch (err.code) {
      case 'P2002':
        message = 'Violation de contrainte d\'unicité';
        const field = err.meta?.target?.[0] || 'champ';
        details = [{ field, message: `Ce ${field} existe déjà` }];
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Ressource non trouvée';
        break;
      case 'P2003':
        message = 'Violation de contrainte de clé étrangère';
        break;
      default:
        message = 'Erreur de base de données';
    }
  }
  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Erreur de validation des données';
  }
  // Handle Multer errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Fichier trop volumineux (max 5MB)';
    } else {
      message = `Erreur d'upload: ${err.message}`;
    }
  }

  // Log error for debugging (don't expose stack traces to client)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  } else if (!err.isOperational) {
    console.error('❌ Unexpected Error:', err);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details.length > 0 && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler for undefined routes
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} non trouvée`
  });
};
