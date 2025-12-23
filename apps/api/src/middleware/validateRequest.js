/**
 * Request validation middleware using Zod
 */
import { ValidationError } from '../utils/errors.js';

/**
 * Validate request body against Zod schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error.errors) {
        // Zod validation error
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(new ValidationError('Erreur de validation', details));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate query parameters against Zod schema
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error.errors) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(new ValidationError('Erreur de validation des paramètres', details));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate route parameters against Zod schema
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error.errors) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(new ValidationError('Erreur de validation des paramètres de route', details));
      } else {
        next(error);
      }
    }
  };
};
