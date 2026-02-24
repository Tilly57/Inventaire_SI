/**
 * @fileoverview Protected File Serving Middleware
 *
 * Sécurise l'accès aux fichiers uploadés (signatures, documents sensibles)
 * en requérant une authentification JWT valide.
 *
 * Features:
 * - Authentification obligatoire pour tous les fichiers
 * - Validation du token JWT
 * - Logging des accès aux fichiers
 * - Protection contre path traversal
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import { jwtConfig } from '../config/jwt.js';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Middleware pour servir les fichiers protégés
 * Requiert authentification JWT valide
 *
 * @middleware
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export const serveProtectedFile = async (req, res, next) => {
  try {
    // 1. Vérifier l'authentification
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token d\'authentification requis pour accéder aux fichiers');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // 2. Vérifier le token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.accessSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expiré');
      }
      throw new UnauthorizedError('Token invalide');
    }

    // 3. Extraire le chemin du fichier demandé
    const requestedPath = req.path; // e.g., /signatures/xyz.png

    // 4. Protection contre path traversal (reject obvious patterns early)
    if (requestedPath.includes('..') || requestedPath.includes('~') || requestedPath.includes('\0')) {
      logger.warn('Path traversal attempt detected', {
        userId: decoded.userId,
        requestedPath,
        ip: req.ip
      });
      throw new ForbiddenError('Accès refusé');
    }

    // 5. Construire le chemin absolu du fichier
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, requestedPath);

    // 6. Vérifier que le fichier existe et que le chemin résolu reste dans uploadsDir
    try {
      const realPath = await fs.realpath(filePath);
      const realUploadsDir = await fs.realpath(uploadsDir);
      if (!realPath.startsWith(realUploadsDir + path.sep) && realPath !== realUploadsDir) {
        logger.warn('Path traversal via symlink detected', {
          userId: decoded.userId,
          requestedPath,
          resolvedPath: realPath,
          ip: req.ip
        });
        throw new ForbiddenError('Accès refusé');
      }
    } catch (error) {
      if (error instanceof ForbiddenError) throw error;
      throw new NotFoundError('Fichier non trouvé');
    }

    // 7. Logger l'accès au fichier
    logger.info('Protected file accessed', {
      userId: decoded.userId,
      username: decoded.username,
      file: requestedPath,
      ip: req.ip
    });

    // 8. Servir le fichier
    res.sendFile(filePath);

  } catch (error) {
    next(error);
  }
};

/**
 * Alternative: Générer une URL signée temporaire pour un fichier
 * Permet de partager un lien sans token JWT (expiration courte)
 *
 * @param {string} filePath - Chemin relatif du fichier
 * @param {number} expiresInSeconds - Durée de validité (défaut: 1h)
 * @returns {string} Token signé à utiliser comme query param
 */
export function generateSignedUrl(filePath, expiresInSeconds = 3600) {
  const payload = {
    filePath,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };

  return jwt.sign(payload, jwtConfig.accessSecret);
}

/**
 * Middleware pour servir les fichiers avec URL signée
 * Utilise un token dans les query params au lieu du header Authorization
 *
 * @middleware
 * @example
 * GET /uploads/signatures/abc123.png?token=eyJhbGciOi...
 */
export const serveSignedFile = async (req, res, next) => {
  try {
    // 1. Récupérer le token de la query string
    const { token } = req.query;

    if (!token) {
      throw new UnauthorizedError('Token requis dans l\'URL');
    }

    // 2. Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.accessSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Lien expiré');
      }
      throw new UnauthorizedError('Lien invalide');
    }

    // 3. Vérifier que le fichier demandé correspond au token
    const requestedPath = req.path;

    if (decoded.filePath !== requestedPath) {
      logger.warn('File path mismatch in signed URL', {
        tokenPath: decoded.filePath,
        requestedPath,
        ip: req.ip
      });
      throw new ForbiddenError('Token invalide pour ce fichier');
    }

    // 4. Protection contre path traversal
    if (requestedPath.includes('..') || requestedPath.includes('~') || requestedPath.includes('\0')) {
      throw new ForbiddenError('Accès refusé');
    }

    // 5. Servir le fichier
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, requestedPath);

    try {
      const realPath = await fs.realpath(filePath);
      const realUploadsDir = await fs.realpath(uploadsDir);
      if (!realPath.startsWith(realUploadsDir + path.sep) && realPath !== realUploadsDir) {
        throw new ForbiddenError('Accès refusé');
      }
    } catch (error) {
      if (error instanceof ForbiddenError) throw error;
      throw new NotFoundError('Fichier non trouvé');
    }

    logger.info('Signed file accessed', {
      file: requestedPath,
      ip: req.ip
    });

    res.sendFile(filePath);

  } catch (error) {
    next(error);
  }
};
