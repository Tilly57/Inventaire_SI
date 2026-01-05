/**
 * Unit tests for errorHandler.js middleware
 * Tests global error handling including:
 * - AppError subclasses (ValidationError, NotFoundError, etc.)
 * - Prisma database errors (P2002, P2025, P2003, validation)
 * - Multer file upload errors (LIMIT_FILE_SIZE, etc.)
 * - Generic unexpected errors
 * - notFoundHandler for undefined routes
 * - Environment-specific behavior (dev vs production)
 */

import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';

// Mock logger before imports
const mockLogger = {
  error: jest.fn()
};

jest.unstable_mockModule('../../config/logger.js', () => ({
  default: mockLogger
}));

// Import errors and middleware after mocks
const { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } =
  await import('../../utils/errors.js');
const { errorHandler, notFoundHandler } = await import('../errorHandler.js');

describe('Error Handler Middleware', () => {
  let req, res, next;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Express request object
    req = {
      method: 'GET',
      path: '/api/test',
      body: {},
      headers: {}
    };

    // Mock Express response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock Express next function
    next = jest.fn();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  describe('AppError handling', () => {
    it('should handle ValidationError with details', () => {
      const validationDetails = [
        { field: 'email', message: 'Email invalide' },
        { field: 'password', message: 'Mot de passe trop court' }
      ];
      const err = new ValidationError('Erreur de validation', validationDetails);

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Erreur de validation',
          details: validationDetails
        })
      );
    });

    it('should handle NotFoundError (404)', () => {
      const err = new NotFoundError('Utilisateur non trouvé');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Utilisateur non trouvé'
        })
      );
    });

    it('should handle UnauthorizedError (401)', () => {
      const err = new UnauthorizedError('Token invalide');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Token invalide'
        })
      );
    });

    it('should handle ForbiddenError (403)', () => {
      const err = new ForbiddenError('Accès interdit');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Accès interdit'
        })
      );
    });

    it('should handle generic AppError with custom status code', () => {
      const err = new AppError('Erreur personnalisée', 418);

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(418);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Erreur personnalisée'
        })
      );
    });
  });

  describe('Prisma error handling', () => {
    it('should handle P2002 unique constraint violation', () => {
      const err = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] }
        }
      );

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Violation de contrainte d\'unicité',
          details: [{ field: 'email', message: 'Ce email existe déjà' }]
        })
      );
    });

    it('should handle P2002 without meta target', () => {
      const err = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Violation de contrainte d\'unicité',
          details: [{ field: 'champ', message: 'Ce champ existe déjà' }]
        })
      );
    });

    it('should handle P2025 record not found', () => {
      const err = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Ressource non trouvée'
        })
      );
    });

    it('should handle P2003 foreign key constraint violation', () => {
      const err = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { field_name: 'assetModelId' }
        }
      );

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Violation de contrainte de clé étrangère'
        })
      );
    });

    it('should handle unknown Prisma error code', () => {
      const err = new Prisma.PrismaClientKnownRequestError(
        'Unknown database error',
        {
          code: 'P9999',
          clientVersion: '5.0.0',
          meta: {}
        }
      );

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Erreur de base de données'
        })
      );
    });

    it('should handle PrismaClientValidationError', () => {
      const err = new Prisma.PrismaClientValidationError(
        'Invalid data type',
        { clientVersion: '5.0.0' }
      );

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Erreur de validation des données'
        })
      );
    });
  });

  describe('Multer error handling', () => {
    it('should handle LIMIT_FILE_SIZE error', () => {
      const err = new Error('File too large');
      err.name = 'MulterError';
      err.code = 'LIMIT_FILE_SIZE';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Fichier trop volumineux (max 5MB)'
        })
      );
    });

    it('should handle other Multer errors', () => {
      const err = new Error('Unexpected field');
      err.name = 'MulterError';
      err.code = 'LIMIT_UNEXPECTED_FILE';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Erreur d\'upload: Unexpected field'
        })
      );
    });
  });

  describe('Generic error handling', () => {
    it('should handle unexpected errors with 500 status', () => {
      const err = new Error('Something went wrong');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Erreur interne du serveur'
        })
      );
    });

    it('should handle errors without message', () => {
      const err = new Error();

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Erreur interne du serveur'
        })
      );
    });
  });

  describe('Environment-specific behavior', () => {
    it('should include stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';
      const err = new Error('Test error');
      err.stack = 'Error stack trace';

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: 'Error stack trace'
        })
      );
    });

    it('should not include stack trace in production mode', () => {
      process.env.NODE_ENV = 'production';
      const err = new Error('Test error');
      err.stack = 'Error stack trace';

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.anything()
        })
      );
    });

    it('should log all errors in development mode', () => {
      process.env.NODE_ENV = 'development';
      const err = new Error('Development error');

      errorHandler(err, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Error:',
        expect.objectContaining({ error: err })
      );
    });

    it('should log non-operational errors in production mode', () => {
      process.env.NODE_ENV = 'production';
      const err = new Error('Production error');
      err.isOperational = false;

      errorHandler(err, req, res, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Unexpected Error:',
        expect.objectContaining({ error: err })
      );
    });

    it('should not log operational errors in production mode', () => {
      process.env.NODE_ENV = 'production';
      const err = new ValidationError('Validation failed', []);
      err.isOperational = true;

      errorHandler(err, req, res, next);

      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('Response structure', () => {
    it('should always include success: false', () => {
      const err = new Error('Test');

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should not include details for non-validation errors', () => {
      const err = new NotFoundError('Not found');

      errorHandler(err, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response).not.toHaveProperty('details');
    });

    it('should include details for validation errors', () => {
      const details = [{ field: 'test', message: 'Invalid' }];
      const err = new ValidationError('Validation failed', details);

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ details })
      );
    });

    it('should not include empty details array', () => {
      const err = new ValidationError('Validation failed', []);

      errorHandler(err, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response).not.toHaveProperty('details');
    });
  });
});

describe('Not Found Handler', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/nonexistent'
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should return 404 status', () => {
    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return route not found message with method and path', () => {
    notFoundHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Route GET /api/nonexistent non trouvée'
    });
  });

  it('should handle POST requests', () => {
    req.method = 'POST';
    req.path = '/api/undefined';

    notFoundHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Route POST /api/undefined non trouvée'
    });
  });

  it('should handle DELETE requests', () => {
    req.method = 'DELETE';
    req.path = '/api/missing';

    notFoundHandler(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Route DELETE /api/missing non trouvée'
    });
  });

  it('should include success: false in response', () => {
    notFoundHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
